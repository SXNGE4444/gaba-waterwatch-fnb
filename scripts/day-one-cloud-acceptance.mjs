#!/usr/bin/env node
// GABA WaterWatch FNB: isolated cloud acceptance check, synthetic data ONLY.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const baseUrl=process.env.GABA_PUBLIC_API_BASE;
if(!baseUrl) { console.error('Set GABA_PUBLIC_API_BASE to the verified HTTPS WaterWatch API for the intended Supabase project. Never default to a previous account.'); process.exit(2); }
const base=baseUrl.replace(/\/$/,'')+'/api';
let reportId='', clientId='';
const stages=[];
const check=(name,passed)=>{stages.push({name,passed}); console.log((passed?'PASS':'FAIL')+' '+name)};
async function api(path,{method='GET',body,token}={}){
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});
  let data={};try{data=await res.json()}catch{}return {status:res.status,data};
}
try{
  let r=await api('/health');
  assert.equal(r.status,200);assert.equal(r.data.storage,'supabase-postgres');check('Supabase database and Edge API health',true);
  r=await api('/public/feed?area=Khayelitsha%20East');assert.equal(r.status,200);
  assert.equal(r.data.officialFeedConnected,false);check('Synthetic feed is NOT labelled official',true);
  r=await api('/overview');assert.equal(r.status,401);check('Unauthenticated operator access blocked',true);
  clientId='local-'+crypto.randomUUID();
  const body={clientId,category:'Leak or burst pipe',zone:'Khayelitsha East',details:'SYNTHETIC TEST ONLY: fictional burst pipe beside a fictional community hall for FNB demo acceptance.'};
  const anonymous=await api('/reports',{method:'POST',body});assert.equal(anonymous.status,401);
  check('Anonymous resident reporting blocked by backend',true);
  const email=process.env.GABA_TEST_RESIDENT_EMAIL,password=process.env.GABA_TEST_RESIDENT_PASSWORD;
  if(!email||!password){
    console.log('RESIDENT QA PENDING: set GABA_TEST_RESIDENT_EMAIL and GABA_TEST_RESIDENT_PASSWORD for a verified account.');
    console.log('API requires a valid email-confirmed Supabase session before creating a report.');
    process.exit(2);
  }
  const pub='sb_publishable_iZEnOA3f0yvz6M5hnTfOvA_sMYS38Oq';
  const login=await fetch('https://uskemdfbmuilvirqudml.supabase.co/auth/v1/token?grant_type=password',{
    method:'POST',headers:{'Content-Type':'application/json',apikey:pub},
    body:JSON.stringify({email,password}),signal:AbortSignal.timeout(12000)
  });
  assert.equal(login.status,200,'Resident sign-in unsuccessful');
  const auth=await login.json();const residentToken=auth.access_token;
  assert.ok(residentToken);check('Verified resident signed in using real Supabase Auth',true);
  r=await api('/reports',{method:'POST',body,token:residentToken});assert.equal(r.status,201);reportId=r.data.report.id;
  assert.match(reportId,/^REP-[A-Z0-9-]+$/);assert.equal(r.data.report.details,undefined);
  check('Resident report saved to persistent cloud database: '+reportId,true);
  let looked=await api('/public/report-status?clientId='+clientId,{token:residentToken});assert.equal(looked.status,200);
  assert.equal(looked.data.status,'Received');assert.equal(looked.data.details,undefined);
  check('Resident tracking is private and reads saved status',true);
  let duplicate=await api('/reports',{method:'POST',body,token:residentToken});assert.equal(duplicate.status,200);
  assert.equal(duplicate.data.duplicate,true);assert.equal(duplicate.data.report.id,reportId);
  check('Same report cannot duplicate on retry',true);
  const opEmail=process.env.GABA_TEST_OPERATOR_EMAIL,opPass=process.env.GABA_TEST_OPERATOR_PASSWORD;
  const rvEmail=process.env.GABA_TEST_REVIEWER_EMAIL,rvPass=process.env.GABA_TEST_REVIEWER_PASSWORD;
  if(!opEmail||!opPass||!rvEmail||!rvPass){
    console.log('\nCLOUD STAFF ACCEPTANCE PENDING: Set 4 test-only environment variables. Do not print or commit passwords.');
    console.log('Next gate: Supabase Auth users + fnb_staff_roles operator and demo_reviewer.');
    console.log('Checked cloud report:',reportId);
    process.exitCode=2;
  } else {
    let op=await api('/auth/login',{method:'POST',body:{email:opEmail,password:opPass}});
    assert.equal(op.status,200,JSON.stringify({status:op.status,error:op.data.error}));
    assert.equal(op.data.role,'operator');const opToken=op.data.accessToken;
    assert.ok(opToken);check('Separate operator logs in with authorised role',true);
    let overview=await api('/overview',{token:opToken});
    assert.equal(overview.status,200);assert.ok(overview.data.reports.some(x=>x.id===reportId));
    check('Operator sees the same cloud report',true);
    let mutation=await api('/reports/'+reportId+'/status',{method:'PATCH',token:opToken,body:{status:'Investigating'}});
    assert.equal(mutation.status,200);check('Operator starts investigation',true);
    mutation=await api('/reports/'+reportId+'/route',{method:'POST',token:opToken,body:{}});
    assert.equal(mutation.status,200);assert.equal(mutation.data.municipalityNotified,false);
    check('Case routed to simulated reviewer, not municipality',true);
    let rv=await api('/auth/reviewer-login',{method:'POST',body:{email:rvEmail,password:rvPass}});
    assert.equal(rv.status,200,JSON.stringify({status:rv.status,error:rv.data.error}));
    assert.equal(rv.data.role,'demo_reviewer');const rvToken=rv.data.accessToken;
    assert.ok(rvToken);check('Separate simulation reviewer logs in',true);
    let queue=await api('/review/queue',{token:rvToken});assert.equal(queue.status,200);
    assert.ok(queue.data.reports.some(x=>x.id===reportId));check('Reviewer sees routed case',true);
    let review=await api('/review/reports/'+reportId+'/confirm',{method:'POST',token:rvToken,body:{decision:'confirmed',cause:'pipe'}});
    assert.equal(review.status,200);assert.equal(review.data.officialMunicipalVerification,false);
    check('Review confirmed as simulation, never municipal approval',true);
    let ev=await api('/reports/'+reportId+'/field-evidence',{method:'POST',token:opToken,body:{note:'SYNTHETIC QA inspection evidence only: simulated pipe isolation and repair followed by a report update.'}});
    assert.equal(ev.status,200);check('Operator records simulated field evidence',true);
    let close=await api('/reports/'+reportId+'/status',{method:'PATCH',token:opToken,body:{status:'Resolved'}});
    assert.equal(close.status,200);check('Report closed after review and evidence',true);
    looked=await api('/public/report-status?clientId='+clientId,{token:residentToken});
    assert.equal(looked.status,200);assert.equal(looked.data.status,'Resolved');
    assert.equal(looked.data.review.verifiedByMunicipality,false);
    check('Resident sees Resolved from the same cloud database',true);
    console.log('\nFULL SIX-STEP CLOUD WORKFLOW VERIFIED. No real municipality contacted. Report:',reportId);
  }
}catch(e){
  console.error('ACCEPTANCE FAILURE:',e.message);
  if(reportId)console.error('Last synthetic report:',reportId);
  process.exitCode=1;
}
