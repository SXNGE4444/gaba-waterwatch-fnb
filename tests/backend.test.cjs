const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
process.env.GABA_OPERATOR_PASSWORD='test-only-secure-operator-password-2026';
process.env.GABA_DEMO_REVIEW_PASSWORD='test-only-municipal-demo-review-2026';
const {server}=require('../server');
const snapshot=fs.readFileSync(path.join(__dirname,'../data/state.json'),'utf8');
let base,cookie,csrf;
const opsHeaders=()=>({'Content-Type':'application/json','Cookie':cookie,'X-GABA-CSRF':csrf});
test.before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/gabafnbhackaton/api`});
test.after(async()=>{fs.writeFileSync(path.join(__dirname,'../data/state.json'),snapshot);await new Promise(resolve=>server.close(resolve))});
test('public health, session and protected operator overview',async()=>{
  let r=await fetch(base+'/health'); assert.equal(r.status,200); assert.equal((await r.json()).mode,'protected-synthetic-demo');
  r=await fetch(base+'/auth/session');assert.equal((await r.json()).authenticated,false);
  r=await fetch(base+'/overview');assert.equal(r.status,401);
  r=await fetch(base+'/incidents/INC-1042/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,401);
});
test('operator login creates scoped session; CSRF required for every mutation',async()=>{
  let r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'wrong-password'})});assert.equal(r.status,401);
  r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:process.env.GABA_OPERATOR_PASSWORD})});
  assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];const body=await r.json();assert.equal(body.authenticated,true);csrf=body.csrfToken;assert.ok(csrf.length>20);
  r=await fetch(base+'/auth/session',{headers:{'Cookie':cookie}});assert.equal((await r.json()).authenticated,true);
  r=await fetch(base+'/overview',{headers:{'Cookie':cookie}});assert.equal(r.status,200);assert.equal((await r.json()).metadata.mode,'synthetic');
  r=await fetch(base+'/incidents/INC-1042/status',{method:'PATCH',headers:{'Content-Type':'application/json','Cookie':cookie},body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,403);
  r=await fetch(base+'/incidents/INC-1042/status',{method:'PATCH',headers:{...opsHeaders(),Origin:'https://evil.example'},body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,403);
});
test('resident report validates areas, redacts return content and deduplicates',async()=>{
  let r=await fetch(base+'/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:'No water',zone:'Z',details:'xx',clientId:'a'})});assert.equal(r.status,400);
  const report={category:'Leak or burst pipe',zone:'Khayelitsha East',details:'Fictional demo leak near community hall.',clientId:'local-123e4567-e89b-42d3-a456-426614174000'};
  r=await fetch(base+'/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});assert.equal(r.status,201);const received=await r.json();assert.ok(received.report.id.startsWith('REP-'));assert.equal(received.report.details,undefined);
  r=await fetch(base+'/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});assert.equal(r.status,200);assert.equal((await r.json()).duplicate,true);
  r=await fetch(base+'/reports/'+received.report.id+'/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Investigating'})});assert.equal(r.status,200);
  r=await fetch(base+'/public/report-status?clientId='+report.clientId);assert.equal(r.status,200);const status=await r.json();assert.equal(status.status,'Investigating');assert.equal(status.details,undefined);
  r=await fetch(base+'/public/report-status?clientId=abc');assert.equal(r.status,400);
});
test('human-reviewed incident transitions preserve the audit',async()=>{
  let r=await fetch(base+'/incidents/INC-1042/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,200);
  r=await fetch(base+'/incidents/INC-1042/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Investigating'})});assert.equal(r.status,409);
  r=await fetch(base+'/overview',{headers:{Cookie:cookie}});const body=await r.json();assert.ok(body.audit.some(x=>x.detail.includes('INC-1042')));
});
test('public area feed is fictional and excludes report details',async()=>{
  let r=await fetch(base+'/public/feed?area='+encodeURIComponent('Khayelitsha East'));assert.equal(r.status,200);const feed=await r.json();assert.equal(feed.officialFeedConnected,false);assert.ok(feed.incidents.every(x=>x.sourceType==='synthetic_sensor'&&!x.verifiedByUtility));assert.equal(JSON.stringify(feed).includes('community hall'),false);
  r=await fetch(base+'/public/feed?area=Atlantis');assert.equal(r.status,400);
  r=await fetch(base+'/overview',{headers:{Origin:'https://evil.example'}});assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
});
test('public water-health guidance cites authorities and no actual water-quality results',async()=>{
  let r=await fetch(base+'/public/health-guides');assert.equal(r.status,200);const j=await r.json();assert.ok(j.guides.length>=3);assert.ok(j.guides.some(g=>/Boiling water does not remove chemical/.test(g.detail)));
  r=await fetch(base+'/public/municipal-help');assert.equal(r.status,200);const h=await r.json();assert.equal(h.contacts[0].phone,'0860 103 089');assert.match(h.connectionStatus,/No municipal integration/);
});
test('end-to-end report handoff requires separate demo reviewer and field evidence',async()=>{
  let r=await fetch(base+'/reports/REP-3021/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Investigating'})});assert.equal(r.status,200);
  r=await fetch(base+'/reports/REP-3021/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,409);
  r=await fetch(base+'/reports/REP-3021/route',{method:'POST',headers:opsHeaders(),body:'{}'});assert.equal(r.status,200);assert.equal((await r.json()).municipalityNotified,false);
  r=await fetch(base+'/reports/REP-3021/route',{method:'POST',headers:opsHeaders(),body:'{}'});assert.equal(r.status,409);
  r=await fetch(base+'/review/queue',{headers:{Cookie:cookie}});assert.equal(r.status,401);
  r=await fetch(base+'/auth/reviewer-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:process.env.GABA_DEMO_REVIEW_PASSWORD})});assert.equal(r.status,200);
  const reviewerCookie=r.headers.get('set-cookie').split(';')[0];const reviewerSession=await r.json();assert.equal(reviewerSession.role,'demo_reviewer');
  const reviewerHeaders={'Content-Type':'application/json','Cookie':reviewerCookie,'X-GABA-CSRF':reviewerSession.csrfToken};
  r=await fetch(base+'/overview',{headers:{Cookie:reviewerCookie}});assert.equal(r.status,401);
  r=await fetch(base+'/review/queue',{headers:{Cookie:reviewerCookie}});assert.equal(r.status,200);const queue=await r.json();assert.ok(queue.reports.some(x=>x.id==='REP-3021'));
  r=await fetch(base+'/review/reports/REP-3021/confirm',{method:'POST',headers:opsHeaders(),body:JSON.stringify({decision:'confirmed',cause:'pipe'})});assert.equal(r.status,401);
  r=await fetch(base+'/review/reports/REP-3021/confirm',{method:'POST',headers:reviewerHeaders,body:JSON.stringify({decision:'confirmed',cause:'pipe'})});assert.equal(r.status,200);assert.equal((await r.json()).officialMunicipalVerification,false);
  r=await fetch(base+'/reports/REP-3021/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,409);
  r=await fetch(base+'/reports/REP-3021/field-evidence',{method:'POST',headers:opsHeaders(),body:JSON.stringify({note:'Simulated field inspection confirms training repair action'})});assert.equal(r.status,200);
  r=await fetch(base+'/reports/REP-3021/status',{method:'PATCH',headers:opsHeaders(),body:JSON.stringify({status:'Resolved'})});assert.equal(r.status,200);
  r=await fetch(base+'/public/feed?area=Khayelitsha%20East');assert.equal(r.status,200);const f=await r.json();assert.equal(f.communityUpdates[0].verifiedByUtility,false);assert.equal(JSON.stringify(f).includes('No running water since early morning'),false);
  r=await fetch(base.replace('/api','')+'/review');assert.equal(r.status,200);assert.match(await r.text(),/NOT A MUNICIPAL PORTAL/);
});
test('operator reset requires authentication and CSRF, logout revokes session',async()=>{
  let r=await fetch(base+'/demo/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401);
  r=await fetch(base+'/demo/reset',{method:'POST',headers:opsHeaders(),body:'{}'});assert.equal(r.status,200);
  r=await fetch(base+'/auth/logout',{method:'POST',headers:opsHeaders(),body:'{}'});assert.equal(r.status,200);
  r=await fetch(base+'/overview',{headers:{Cookie:cookie}});assert.equal(r.status,401);
});
test('unknown endpoints rejected and prefixed static shell served with security headers',async()=>{
  let r=await fetch(base+'/no-such-api');assert.equal(r.status,404);
  r=await fetch(base.replace('/api','')+'/');assert.equal(r.status,200);assert.match(await r.text(),/GABA WaterWatch/);assert.match(r.headers.get('Content-Security-Policy'),/default-src 'self'/);
  r=await fetch(base.replace('/api','')+'/../../server.js');assert.notEqual(r.status,200);
});
