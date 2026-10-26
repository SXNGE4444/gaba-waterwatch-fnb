'use strict';
/* GABA WATERWATCH v0.6 · FNB Hackathon judge demo. SYNTHETIC DATA, NO LIVE WATER SYSTEMS. */
const icons={grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 17l9 5 9-5"/>',alert:'<path d="m10.3 3.4-8.1 14a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3l-8.1-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 13h6m-6 4h6"/>',file:'<path d="M7 2h7l5 5v15H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 0v5h5M9 13h6m-6 4h6"/>',phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',spark:'<path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z"/>'};
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[el.dataset.icon]||icons.grid}</svg>`);
const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
const qs=new URLSearchParams(location.search);
const native=Boolean(window.GABA_NATIVE_LOGIN_FIRST)||Boolean(window.Capacitor?.isNativePlatform?.())||/^(capacitor|ionic):/.test(location.protocol);
const SUBPATH=location.pathname.startsWith('/gabafnbhackaton')?'/gabafnbhackaton':'';
const API=(window.GABA_API_BASE||SUBPATH||'')+'/api'; const REMOTE=Boolean(window.GABA_API_BASE); let opsToken=REMOTE?(sessionStorage.getItem('gaba.operator.access')||''):'';
const demoSeed={incidents:[{id:'INC-1042',zone:'Khayelitsha East',asset:'DMA-07 / Spine pipeline',type:'Probable underground leak',severity:'Critical',status:'Investigating',source:'Sensor correlation',time:'09:41',litres:2340000,confidence:94,evidence:['Night flow increased to 49.8 L/s','Downstream pressure fell to 308 kPa','Reservoir drawdown accelerated'],audit:['09:41 · Simulated anomaly detected','09:43 · Evidence brief generated']},{id:'INC-1041',zone:'Mitchells Plain',asset:'Reservoir / R-02',type:'Low reservoir level',severity:'High',status:'Open',source:'Reservoir telemetry',time:'08:25',litres:0,confidence:88,evidence:['Reservoir level 38%','24-hour average 61%','No flow confirmation available'],audit:['08:25 · Reservoir warning raised']},{id:'INC-1040',zone:'Bellville South',asset:'Pump station / PS-03',type:'Pump vibration anomaly',severity:'Medium',status:'Monitoring',source:'Sensor simulator',time:'07:58',litres:0,confidence:81,evidence:['Vibration index outside normal band','Run-time above simulated threshold'],audit:['07:58 · Simulated alert opened']}],reports:[{id:'REP-3021',category:'No water',zone:'Khayelitsha East',details:'No running water since early morning near the library.',createdAt:'2026-10-22T08:07:00+02:00',status:'Received',source:'Seeded demonstration',clientId:'seed-3021'}],audit:[{id:'AUD-1',action:'Simulation seeded',detail:'All data is fictional and must not be used for operations',time:'2026-10-22T08:00:00+02:00'}],revision:1};
let opsAuth=false,opsCsrf='';
// Never retain operator-only responses in browser storage. Remove pre-v0.5 cached overviews.
try{localStorage.removeItem('gaba.snapshot')}catch{}
let data=structuredClone(demoSeed);let activeInc='INC-1042',activePage='overview',activeMobile='home',activeFilter='All';let apiConnected=false;let forceOffline=false;let publicFeed=null;let selectedArea=localStorage.getItem('gaba.area')||'Khayelitsha East';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function queued(){try{return JSON.parse(localStorage.getItem('gaba.queue')||'[]')}catch{return []}}
function localReports(){try{return JSON.parse(localStorage.getItem('gaba.localReports')||'[]')}catch{return []}}
function storeLocal(r){const all=localReports();if(!all.some(x=>x.clientId===r.clientId)){all.unshift(r);localStorage.setItem('gaba.localReports',JSON.stringify(all.slice(0,100)))}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),4000)}
function statusUI(){const online=navigator.onLine&&!forceOffline;const el=$('#online-pill');el.textContent=apiConnected&&online?(REMOTE?'CLOUD API CONNECTED':'LOCAL API CONNECTED'):online?'OFFLINE DEMO DATA':'OFFLINE';el.classList.toggle('offline',!online||!apiConnected);const m=$('#mobile-sync');m.classList.toggle('offline',!online||!apiConnected);const n=queued().length;$('#sync-label').textContent=n?`${n} report${n>1?'s':''} queued · ${online?'Sync available':'Saved offline'}`:(apiConnected&&online?'Connected · reports can sync':'Offline-ready · reports save on device');}
async function verifiedResidentToken(){
 const key='gaba.resident.access', rk='gaba.resident.refresh';
 const auth='https://uskemdfbmuilvirqudml.supabase.co/auth/v1';
 const pub='sb_publishable_iZEnOA3f0yvz6M5hnTfOvA_sMYS38Oq';
 const validate=async token=>{
  if(!token)return null;
  try{const r=await fetch(auth+'/user',{headers:{apikey:pub,Authorization:'Bearer '+token},cache:'no-store'});
   if(r.status===401||r.status===403)return null;if(!r.ok)throw Error('Sign-in service unavailable. Retry when connected.');const u=await r.json();return u.email_confirmed_at?token:null;
  }catch(error){throw error}
 };
 let token=await validate(localStorage.getItem(key));
 if(token)return token;
 const refresh=localStorage.getItem(rk);
 if(refresh)try{
  const r=await fetch(auth+'/token?grant_type=refresh_token',{method:'POST',headers:{apikey:pub,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})});
  if(r.ok){const d=await r.json();localStorage.setItem(key,d.access_token);localStorage.setItem(rk,d.refresh_token);token=await validate(d.access_token);if(token)return token;}else if(![400,401,403].includes(r.status)){throw Error('Sign-in service unavailable. Retry when connected.')}
 }catch(error){throw error}
 localStorage.removeItem(key);localStorage.removeItem(rk);
 location.replace(native?'index.html':'auth.html?tab=login&next=community');
 return null;
}
async function request(path,opts={}){
 if(forceOffline)throw Error('Simulated offline');
 if(/^\/(reports$|public\/report-status)/.test(path)){
   const t=await verifiedResidentToken();
   if(!t)throw Error('Your WaterWatch login is required. Sign in again to sync reports.');
   opts={...opts,headers:{...(opts.headers||{}),Authorization:'Bearer '+t}};
 }
 if(forceOffline)throw Error('Simulated offline');const c=new AbortController();const timeout=setTimeout(()=>c.abort(),4000);try{const r=await fetch(API+path,{...opts,signal:c.signal,credentials:'same-origin',headers:{'Content-Type':'application/json',...(REMOTE&&opsToken?{'Authorization':'Bearer '+opsToken}:{}),...(!REMOTE&&opsAuth && /^(PATCH|POST|PUT|DELETE)$/.test(opts.method||'') && path!=='/reports' && path!=='/auth/login'?{'X-GABA-CSRF':opsCsrf}:{}),...(opts.headers||{})},cache:'no-store'});const v=await r.json();if(!r.ok)throw Error(v.error||`API ${r.status}`);return v}finally{clearTimeout(timeout)}}
function updateOperatorGate(){
  const locked=!opsAuth;
  $('#app').classList.toggle('ops-locked',locked);
  const lock=$('#operator-lock');if(lock)lock.setAttribute('aria-hidden',!locked?'true':'false');
  const out=$('#operator-logout');if(out)out.hidden=locked;
}
async function checkOperatorSession(){
  try{const r=await request('/auth/session');opsAuth=!!r.authenticated;opsCsrf=r.csrfToken||'';if(REMOTE&&!opsAuth){opsToken='';sessionStorage.removeItem('gaba.operator.access')}}
  catch{opsAuth=false;opsCsrf=''}
  updateOperatorGate();return opsAuth;
}
async function refresh(){
  if($('#app').classList.contains('mode-site')){apiConnected=false;statusUI();return;}
  try{
    if(!$('#app').classList.contains('mode-community') && !(await checkOperatorSession())){
      apiConnected=false;statusUI();return;
    }
    if($('#app').classList.contains('mode-community')){
      publicFeed=await request('/public/feed?area='+encodeURIComponent(selectedArea));
      // Network refresh and offline-queue sync can overlap. Only merge fresh server
      // results into the *latest* local state; never restore a stale queued snapshot.
      const queuedIds=new Set(queued().map(r=>r.clientId));
      const changes=new Map();
      for(const r of localReports()){
        if(!/^local-[0-9a-fA-F-]{36}$/.test(r.clientId)||queuedIds.has(r.clientId))continue;
        try{
          const check=await request('/public/report-status?clientId='+encodeURIComponent(r.clientId));
          changes.set(r.clientId,{id:check.id,status:check.status,operatorNote:check.operatorNote,routingStage:check.routingStage,review:check.review});
        }catch{}
      }
      if(changes.size){
        const latest=localReports().map(r=>changes.has(r.clientId)?{...r,...changes.get(r.clientId)}:r);
        localStorage.setItem('gaba.localReports',JSON.stringify(latest));
      }
      apiConnected=true;
    }else{
      const v=await request('/overview');data=v;apiConnected=true;
    }
  }catch(e){if(!$('#app').classList.contains('mode-community')){opsAuth=false;opsCsrf='';updateOperatorGate()}apiConnected=false;data=structuredClone(demoSeed)}
  render();statusUI();
}
function switchMode(mode){
 if(mode==='community'&&!native){
   const access=localStorage.getItem('gaba.resident.access');
   if(!access){location.href='auth.html?next=community';return;}
 }
 updateOperatorGate();$('#app').classList.toggle('mode-site',mode==='site');$('#app').classList.toggle('mode-community',mode==='community');$('#app').classList.toggle('mode-operator',mode==='operator');if(mode==='community'){document.title='GABA WaterWatch — Community';showMobile(activeMobile)}else if(mode==='operator'){document.title='GABA Water Intelligence — Operator Command Centre';showPage(activePage)}else{document.title='GABA Water Intelligence | Cleaner Waters. Brighter Tomorrows.'}if(!native){const next=mode==='site'?location.pathname:location.pathname+'?view='+encodeURIComponent(mode);history.replaceState({},'',next)}window.scrollTo({top:0,behavior:'instant'});if(!forceOffline)refresh()}
function showPage(page){if(!$('#page-'+page))return;activePage=page;$$('.page').forEach(n=>n.classList.toggle('active',n.id==='page-'+page));$$('.nav-btn[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===page));$('#current-page-label').textContent=({overview:'COMMAND CENTRE',network:'WATER NETWORK',incidents:'INCIDENTS',workorders:'FIELD OPERATIONS',evidence:'EVIDENCE & AUDIT',communityReports:'COMMUNITY INBOX',judge:'JUDGE WALKTHROUGH'})[page];window.scrollTo({top:0,behavior:'instant'})}
function showMobile(page){if(!$('#community-'+page))return;if(page==='report'&&!$('#report-zone').value)$('#report-zone').value=selectedArea;activeMobile=page;$('#community-shell').classList.toggle('is-subpage',page!=='home');$$('.community-page').forEach(n=>n.classList.toggle('active',n.id==='community-'+page));$$('[data-mobile-page]').forEach(n=>{if(n.closest('.mobile-nav'))n.classList.toggle('active',n.dataset.mobilePage===page)});$('#community-scroll').scrollTop=0}
function render(){const open=data.incidents.filter(i=>i.status!=='Resolved').length;$('#kpi-alerts').innerHTML=`${String(open).padStart(2,'0')} <small>active</small>`;$('#side-incident-count').textContent=open;$('#side-report-count').textContent=data.reports.filter(r=>r.status!=='Resolved').length;
$('#overview-incident-list').innerHTML=data.incidents.map(i=>`<button class="incident-row" data-open-incident="${safe(i.id)}"><span class="incident-status-dot ${safe(i.severity)}"></span><div><strong>${safe(i.type)}</strong><small>${safe(i.zone)} · ${safe(i.id)}</small></div><span>${safe(i.status)} ↗</span></button>`).join('');
const filtered=data.incidents.filter(i=>activeFilter==='All'||i.severity===activeFilter);
$('#incident-table').innerHTML=filtered.map(i=>`<tr><td><strong>${safe(i.id)}</strong><small>${safe(i.time)} · demo reading</small></td><td><strong>${safe(i.zone)}</strong><small>${safe(i.asset)}</small></td><td><span class="severity ${safe(i.severity)}">${safe(i.severity)}</span></td><td>${safe(i.status)}</td><td>${safe(i.confidence)}%*</td><td><button class="table-action" data-open-incident="${safe(i.id)}">Review ↗</button></td></tr>`).join('')||'<tr><td colspan="6">No incidents in this group.</td></tr>';
$('#community-inbox').innerHTML=data.reports.map(r=>`<div class="audit-entry"><span>◉</span><div style="flex:1"><strong>${safe(r.category)} · ${safe(r.zone)}</strong><p>${safe(r.details)}</p><small>${safe(r.id)} · ${safe(r.status)} · ${safe(r.createdAt)} · Handoff: ${safe(r.routingStage||'Not routed')}</small><p style="margin-top:5px">${r.review?.decision==='confirmed'?'SIMULATED REVIEW: '+safe(r.review.cause)+(r.review.eta?' · DEMO ETA '+safe(r.review.eta):''):''}</p><div class="decision-actions" style="margin:10px 0 0">${(r.status==='Received'?['Investigating']:r.status==='Investigating'&&r.review?.decision==='confirmed'&&r.fieldEvidence?['Resolved']:[]).map(st=>`<button class="btn btn-ghost" data-update-report="${safe(r.id)}" data-status="${safe(st)}">${st==='Investigating'?'Start review':'Mark resolved'} ↗</button>`).join('')}${r.status==='Investigating'&&(!r.routingStage||r.routingStage==='Not routed')?`<button class="btn btn-primary" data-route-report="${safe(r.id)}">Queue review ↗</button>`:''}${r.status==='Investigating'&&r.review?.decision==='confirmed'&&!r.fieldEvidence?`<button class="btn btn-primary" data-field-evidence="${safe(r.id)}">Record field demo ↗</button>`:''}</div></div></div>`).join('')||'<p>No reports received.</p>';
const inc=data.incidents.find(i=>i.id===activeInc)||data.incidents[0];if(inc){const statuses=inc.status==='Open'||inc.status==='Monitoring'?['Investigating']:inc.status==='Investigating'?['Inspection approved','Resolved']:inc.status==='Inspection approved'?['Resolved']:[];$('#incident-detail').innerHTML=`<div class="detail-header"><div><div class="panel-overline">EVIDENCE BRIEF / ${safe(inc.id)}</div><h2>${safe(inc.type)}</h2><p>${safe(inc.zone)} · ${safe(inc.asset)}</p></div><span class="severity ${safe(inc.severity)}">${safe(inc.severity)} · ${safe(inc.status)}</span></div><div class="evidence-grid"><div><h3>WHY THIS ALERT WAS RAISED</h3><ul>${inc.evidence.map(e=>`<li>${safe(e)}</li>`).join('')}</ul><p class="disclosure">Confidence: ${safe(inc.confidence)}% (simulated, not calibrated).</p></div><div><h3>DECISION HISTORY</h3><ul>${inc.audit.map(e=>`<li>${safe(e)}</li>`).join('')}</ul></div></div><div class="decision-actions">${statuses.map(st=>`<button class="btn ${st==='Resolved'?'btn-ghost':'btn-primary'}" data-update="${safe(inc.id)}" data-status="${safe(st)}">${st==='Inspection approved'?'Approve inspection':st==='Resolved'?'Verify repair complete':'Start investigation'} ↗</button>`).join('')||'<span class="label-danger" style="color:#2f9777;background:#e6f5eb">SIMULATED CASE RESOLVED</span>'}</div><p class="disclosure">Demonstration controls only. There is no authentication, no real field dispatch, and no control connection to water infrastructure.</p>`}
const zones=[['Khayelitsha East','DMA-07','Critical','Night flow / pressure','◈'],['Mitchells Plain','Reservoir R-02','High','Stored volume / supply','◉'],['Bellville South','Pump PS-03','Medium','Vibration / uptime','⌁'],['Cape Flats West','Pipeline P-04','Normal','Telemetry stable','≈']];$('#network-cards').innerHTML=zones.map(z=>`<article class="network-card"><div class="symbol">${z[4]}</div><div class="panel-overline">${safe(z[1])}</div><h3>${safe(z[0])}</h3><p>${safe(z[3])} monitored by an illustrative simulator. Not a real geospatial mapping of water infrastructure.</p><div class="network-bottom"><span>${safe(z[2].toUpperCase())} · DEMO</span><span>VIEW ASSET ↗</span></div></article>`).join('');
const tasked=data.incidents.filter(i=>i.status==='Inspection approved'||i.status==='Resolved');$('#workorder-content').innerHTML=`<div class="panel-head"><div><div class="panel-overline">CONTROLLED OPERATIONS / LOCAL DEMO</div><h2>Inspections & work orders</h2></div><span class="env-label">${tasked.length} APPROVED OR RESOLVED</span></div><div class="worklist">${tasked.map(i=>`<div class="work-item"><div><strong>${safe(i.id)} / ${safe(i.zone)}</strong><small>${safe(i.type)} · ${safe(i.asset)}</small></div><span class="work-tag">${safe(i.status.toUpperCase())}</span></div>`).join('')||'<div class="work-item"><div><strong>No approved inspections yet</strong><small>Review an incident to authorise an inspection, then return here.</small></div><button class="btn btn-primary" data-page="incidents">Review incidents</button></div>'}</div>`;
$('#audit-list').innerHTML=(data.audit||[]).map(a=>`<div class="audit-entry"><span>◈</span><div><strong>${safe(a.action)}</strong><p>${safe(a.detail)}</p><small>${safe(a.time)}</small></div></div>`).join('');
$('#alert-cards').innerHTML=((publicFeed&&publicFeed.area===selectedArea)?publicFeed.incidents.map(i=>({...i,zone:i.area,type:i.title})):data.incidents).filter(i=>i.zone===selectedArea).map(i=>`<article class="alert-card"><span class="state">SIMULATED SENSOR SIGNAL · ${safe(i.severity.toUpperCase())}</span><h3>${safe(i.type)}</h3><p>${safe(i.zone)} · ${safe(i.status)}. This is a fictional sensor scenario, NOT an official water-disruption advisory.</p><small>Source: test simulation · ${safe(i.id)} · Restoration time unknown</small></article>`).join('')||'<article class="alert-card"><span class="state">NO DEMO INCIDENTS IN THIS AREA</span><h3>No simulated signals shown</h3><p>This is not a guarantee of water supply or quality. Check your authorised water service provider for official information.</p></article>'; 
renderHistory();renderServiceArea()}
function renderServiceArea(){
  const sel=$('#area-select');if(sel && sel.value!==selectedArea) sel.value=selectedArea;
  const source=(publicFeed&&publicFeed.area===selectedArea)?publicFeed.incidents.map(i=>({...i,zone:i.area,type:i.title})):(data.incidents||[]);const relevant=source.filter(i=>i.zone===selectedArea && i.status!=='Resolved');
  const i=relevant[0];const card=$('#area-status-card');if(!card)return;
  if(i){card.innerHTML=`<div class="status-icon">!</div><div class="status-body"><div class="status-badge">SIMULATED SENSOR SIGNAL · ${safe(i.severity.toUpperCase())}</div><h2>${safe(i.type)}</h2><p>This example shows a possible operational risk in ${safe(selectedArea)}. It is not confirmation of a public water disruption or a water-quality problem.</p><div class="status-footer"><span>Source: synthetic data · ${safe(i.id)}</span><button data-mobile-page="alerts">Details →</button></div></div>`}
  else{card.innerHTML=`<div class="status-icon green-status">✓</div><div class="status-body"><div class="status-badge">NO SIMULATED ALERTS</div><h2>No demo signals in ${safe(selectedArea)}</h2><p>No active simulated incident is shown for this area. Actual service availability is unverified.</p><div class="status-footer"><span>Official feed not connected</span><button data-mobile-page="alerts">Details →</button></div></div>`}
}
function estimateWater(){const m=Math.max(0,Math.min(120,Number($('#water-minutes')?.value)||0));const f=Math.max(0,Math.min(40,Number($('#water-flow')?.value)||0));$('#water-estimate').textContent=`${Math.round(m*f)} L`}
$('#area-select').value=selectedArea;
$('#area-select').addEventListener('change',e=>{selectedArea=e.target.value;localStorage.setItem('gaba.area',selectedArea);render();$('#report-zone').value=selectedArea;refresh();toast('Demo area changed to '+selectedArea)});
['#water-minutes','#water-flow'].forEach(q=>$(q).addEventListener('input',estimateWater));estimateWater();
function renderHistory(){const merged=localReports();$('#report-history').innerHTML=merged.map(r=>`<article class="history-card"><strong>${safe(r.category)}</strong><small>${safe(r.zone)} · ${safe(r.id)}</small><p>${safe(r.details)}</p><span class="tag">${safe(r.status)} · ${safe(r.routingStage||'Not routed')}</span>${r.review?`<p><strong>Cause:</strong> ${safe(r.review.reason||'Under investigation')} · ${safe(r.review.verificationLabel||'DEMO ONLY')}</p><p><strong>Estimated restoration:</strong> ${safe(r.review.eta||'Unknown; do not assume a date')}</p>`:''}</article>`).join('')||'<article class="history-card"><strong>No reports yet</strong><p>Your water service reports will appear here.</p></article>'}
async function routeReport(id){try{const result=await request('/reports/'+encodeURIComponent(id)+'/route',{method:'POST',body:'{}'});toast(result.municipalityNotified?'Submitted to municipality':'Queued for DEMO review only; municipality not notified');await refresh()}catch(e){toast(e.message)}}
async function recordDemoEvidence(id){const note=prompt('Describe the SIMULATED inspection/repair evidence (not a real site visit).');if(!note)return;try{await request('/reports/'+encodeURIComponent(id)+'/field-evidence',{method:'POST',body:JSON.stringify({note})});await refresh();toast('Simulated field evidence recorded')}catch(e){toast(e.message)}}
const localHealthGuides=[{title:'Boil-water advisory (microbial risk)',detail:'When authorities advise boiling: use bottled water or bring clear water to a rolling boil for 1 minute; 3 minutes above 1,981 metres. Cool before drinking.',source:'CDC',url:'https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html'},{title:'Chemical contamination',detail:'Boiling does not remove chemicals or toxins. If officials say do not drink or do not use water, follow their directions and use an alternative safe supply.',source:'CDC',url:'https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html'},{title:'Possible water-related illness',detail:'Contaminated drinking water can cause diarrhoeal illness. Seek healthcare advice for symptoms, especially in vulnerable people. This app cannot diagnose.',source:'WHO',url:'https://www.who.int/news-room/fact-sheets/detail/drinking-water'}];
async function renderHealthGuides(){let guides=localHealthGuides;try{const v=await request('/public/health-guides');guides=v.guides}catch{}const box=$('#health-guide-cards');if(!box)return;box.innerHTML=guides.map(g=>`<div class="tip-card"><div class="tip-index">PUBLIC-HEALTH GUIDANCE · NOT AN AREA ADVISORY</div><h3>${safe(g.title)}</h3><p>${safe(g.detail)}</p><a target="_blank" rel="noopener noreferrer" href="${safe(g.url)}">Source: ${safe(g.source)} ↗</a></div>`).join('')}
async function updateIncident(id,status){if(!apiConnected){toast('Backend connection required to change an operator incident.');return}try{await request('/incidents/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status})});toast(`${id} → ${status} · action recorded`);await refresh();showPage('incidents')}catch(e){toast(e.message)}}
async function updateReport(id,status){if(!apiConnected){toast('Backend required to update community reports.');return}try{await request('/reports/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status})});await refresh();toast(`${id} → ${status}`)}catch(e){toast(e.message)}}
async function syncReports(){if(!navigator.onLine||forceOffline){toast('Offline. Your report is retained on this device.');statusUI();return}let pending=queued();if(!pending.length){await refresh();toast(apiConnected?'Up to date. No pending reports.':'Backend unreachable. Retry when available.');return}let remain=[],done=0;for(const r of pending){try{const ans=await request('/reports',{method:'POST',body:JSON.stringify(r)});done++;const saved=localReports().map(x=>x.clientId===r.clientId?{...x,id:ans.report.id,status:'Received · synced'}:x);localStorage.setItem('gaba.localReports',JSON.stringify(saved))}catch{remain.push(r)}}localStorage.setItem('gaba.queue',JSON.stringify(remain));await refresh();toast(done?`${done} report${done>1?'s':''} synced successfully.`:'Could not connect to service. Reports are safely queued.');statusUI()}
async function submitReport(e){e.preventDefault();const form=e.currentTarget;const val=Object.fromEntries(new FormData(form));if(!val.category||val.zone.trim().length<2||val.details.trim().length<8){toast('Please complete all fields.');return}const uid='local-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(16).padStart(8,'0')+'-0000-4000-8000-'+Math.random().toString(16).slice(2,14).padEnd(12,'0')),report={clientId:uid,category:val.category,zone:val.zone.trim().slice(0,80),details:val.details.trim().slice(0,500),id:'LOCAL-'+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),status:'Queued on device'};storeLocal(report);localStorage.setItem('gaba.queue',JSON.stringify([...queued(),report]));form.reset();$('#report-feedback').innerHTML='<div class="report-success">✓ Report saved on this device. We will try to sync it when connected.</div>';renderHistory();statusUI();await syncReports();$('#report-feedback').innerHTML=`<div class="report-success">✓ Report captured. ${queued().length?'Saved offline; awaiting sync.':'Sent to the demo operator service.'}</div>`}
document.addEventListener('click',async e=>{const btn=e.target.closest('button');if(!btn)return;if(btn.dataset.switch){switchMode(btn.dataset.switch);if(btn.dataset.tab)showMobile(btn.dataset.tab);if(btn.dataset.targetPage)showPage(btn.dataset.targetPage);return}if(btn.dataset.page){switchMode('operator');showPage(btn.dataset.page);return}if(btn.dataset.mobilePage){switchMode('community');showMobile(btn.dataset.mobilePage);return}if(btn.dataset.openIncident){activeInc=btn.dataset.openIncident;render();switchMode('operator');showPage('incidents');setTimeout(()=>$('#incident-detail').scrollIntoView({block:'center',behavior:'smooth'}),30);return}if(btn.dataset.updateReport){await updateReport(btn.dataset.updateReport,btn.dataset.status);return}if(btn.dataset.routeReport){await routeReport(btn.dataset.routeReport);return}if(btn.dataset.fieldEvidence){await recordDemoEvidence(btn.dataset.fieldEvidence);return}if(btn.dataset.update){await updateIncident(btn.dataset.update,btn.dataset.status);return}if(btn.dataset.filter){activeFilter=btn.dataset.filter;$$('.filter-btn').forEach(n=>n.classList.toggle('active',n===btn));render();return}});
$('#report-form').addEventListener('submit',submitReport);
$('#operator-login-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget;const box=$('#operator-login-error');box.textContent='Checking credentials…';
  try{const res=await request('/auth/login',{method:'POST',body:JSON.stringify({email:$('#operator-email')?.value||'',password:$('#operator-password').value})});
    opsAuth=res.authenticated;opsCsrf=res.csrfToken||'';if(REMOTE&&res.accessToken){opsToken=res.accessToken;sessionStorage.setItem('gaba.operator.access',opsToken)}form.reset();box.textContent='';updateOperatorGate();await refresh();toast('Operator session active. Synthetic demo only.');
  }catch(err){box.textContent=err.message;opsAuth=false;opsCsrf='';updateOperatorGate()}
});
$('#operator-logout').addEventListener('click',async()=>{
  try{await request('/auth/logout',{method:'POST',body:'{}'})}catch{}
  opsAuth=false;opsCsrf='';opsToken='';sessionStorage.removeItem('gaba.operator.access');apiConnected=false;data=structuredClone(demoSeed);updateOperatorGate();render();toast('Operator session closed.');
});
$('#open-community').onclick=()=>switchMode('community');
$('#float-switch').onclick=()=>switchMode('community');
$('#sync-now').onclick=syncReports;$('#activity-sync').onclick=syncReports;
$('#reload-btn').onclick=refresh;
$('#offline-demo-toggle').onclick=()=>{window.GABA_DEMO.setOffline(!forceOffline);$('#offline-demo-toggle').textContent=forceOffline?'QA: Turn offline simulation off':'QA: Simulate offline mode'};
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
$('#install-app').onclick=async()=>{if(installPrompt){installPrompt.prompt();installPrompt=null}else{toast('iPhone: Safari → Share → Add to Home Screen. Android: browser menu → Install app. Open once online to cache the PWA.')}};

async function resetDemo(){if(!apiConnected){data=structuredClone(demoSeed);render();toast('Local snapshot reset (offline).');return}if(!confirm('Reset synthetic incident and report data stored by this local demo?'))return;try{await request('/demo/reset',{method:'POST',body:'{}'});activeInc='INC-1042';await refresh();toast('Synthetic dataset reset.')}catch(e){toast(e.message)}}
$('#reset-demo').onclick=resetDemo;$('#judge-reset').onclick=resetDemo;
window.addEventListener('online',async()=>{await refresh();await syncReports()});window.addEventListener('offline',statusUI);
// Development-only offline QA toggle. Useful for judges demonstrating device queue without disabling WiFi.
window.GABA_DEMO={setOffline(v){forceOffline=!!v;apiConnected=apiConnected&&!v;statusUI();toast(v?'Offline QA mode enabled.':'Offline QA mode disabled.');if(!v)refresh()},getQueue:()=>queued(),getState:()=>data};
updateOperatorGate();const initial=qs.get('view')||(native?'community':'site');if(initial==='community'||initial==='resident')switchMode('community');else if(initial==='operator')switchMode('operator');else switchMode('site');if(qs.get('page'))showPage(qs.get('page'));if(qs.get('tab'))showMobile(qs.get('tab'));render();renderHealthGuides();refresh().then(()=>{if(queued().length)syncReports()});if('serviceWorker'in navigator&&!native&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
