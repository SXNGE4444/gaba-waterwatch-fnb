'use strict';
/** GABA WaterWatch secure competition demo (synthetic data ONLY).
 * One Node.js process, local JSON persistence. Not an authenticated production water-control platform.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { randomUUID, randomBytes, timingSafeEqual } = crypto;
const ROOT=path.join(__dirname,'public');
const DATA_PATH=process.env.GABA_DATA_PATH||path.join(__dirname,'data/state.json');
const SEED_PATH=path.join(__dirname,'data/seed.json');
if(!fs.existsSync(DATA_PATH)){fs.mkdirSync(path.dirname(DATA_PATH),{recursive:true});fs.copyFileSync(SEED_PATH,DATA_PATH)}
const PREFIX='/gabafnbhackaton';
const PORT=Number(process.env.PORT||4173);
const HOST=process.env.HOST||'127.0.0.1';
const IS_LOCAL=HOST==='127.0.0.1'||HOST==='::1'||HOST==='localhost';
const IS_PRODUCTION=process.env.NODE_ENV==='production';
const PUBLIC_OPERATOR_ORIGIN=process.env.GABA_PUBLIC_ORIGIN||'';
const ALLOWED_ORIGINS=(process.env.GABA_ALLOWED_ORIGINS||'https://www.lastdicesptyltd.co.za,https://lastdicesptyltd.co.za').split(',').map(x=>x.trim()).filter(Boolean);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const sessions=new Map(); const attempts=new Map(); const submissions=new Map();
const DEMO_REVIEW_ENABLED=!IS_PRODUCTION || process.env.GABA_ENABLE_DEMO_REVIEW==='1';
const reviewerPassword=process.env.GABA_DEMO_REVIEW_PASSWORD||(IS_LOCAL&&!IS_PRODUCTION?randomBytes(12).toString('base64url'):null);
const reviewerHash=crypto.createHash('sha256').update(reviewerPassword||'').digest();
if(DEMO_REVIEW_ENABLED&&(!reviewerPassword||reviewerPassword.length<12)){console.error('Set GABA_DEMO_REVIEW_PASSWORD (12+ chars)');if(require.main===module)process.exit(1)}
const REPORT_CAUSES={unknown:'Cause not yet confirmed',planned:'Planned maintenance (simulation)',pipe:'Pipe failure (simulation)',reservoir:'Reservoir supply constraint (simulation)',quality:'Water quality investigation (simulation)'};
const HEALTH_GUIDES=[
{id:'microbial',title:'Microbial contamination',detail:'Contaminated drinking water can spread diarrhoeal illness including cholera and typhoid. Follow public-health and water-provider advisories; a flow or pressure reading cannot establish drinking-water safety.',source:'World Health Organization',url:'https://www.who.int/news-room/fact-sheets/detail/drinking-water',verifiedGuidance:true},
{id:'boil',title:'When officials issue a boil-water advisory',detail:'Use bottled water or bring clear water to a rolling boil for 1 minute, then cool. At elevations above 1,981 m, boil for 3 minutes. Only use this advice when appropriate to the stated official advisory.',source:'US Centers for Disease Control and Prevention',url:'https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html',verifiedGuidance:true},
{id:'chemical',title:'Chemical contamination is different',detail:'Boiling water does not remove chemical toxins. If the responsible authorities issue a do-not-drink or do-not-use advisory, follow their specific instructions and use a safe alternative supply.',source:'US Centers for Disease Control and Prevention',url:'https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html',verifiedGuidance:true},
{id:'symptoms',title:'If you feel unwell',detail:'If you develop diarrhoea or vomiting after potential exposure, seek clinical advice, especially for infants, older adults and anyone with signs of dehydration. Seek urgent help for serious symptoms. The app cannot diagnose illness.',source:'World Health Organization',url:'https://www.who.int/news-room/fact-sheets/detail/drinking-water',verifiedGuidance:true}
];
const OFFICIAL_CHANNELS={name:'City of Cape Town Water and Sanitation',scope:'Cape Town only',phone:'0860 103 089',sms:'31373',whatsapp:'060 018 1505',email:'water@capetown.gov.za',website:'https://www.capetown.gov.za/City-Connect/report/municipal-services-and-maintenance/submit-a-service-request',source:'City of Cape Town official website',authorityStatus:'Contact information only. GABA is not connected to this municipality.'};

const bootPassword=process.env.GABA_OPERATOR_PASSWORD|| (IS_LOCAL&&!IS_PRODUCTION?randomBytes(12).toString('base64url'):null);
if (!bootPassword||bootPassword.length<12) { console.error('SECURITY BLOCK: Set GABA_OPERATOR_PASSWORD (minimum 12 characters) before exposing this API.');if(require.main===module)process.exit(1); }
const credentialHash=crypto.createHash('sha256').update(bootPassword||'').digest();
const jsonHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const authCookie='gaba_ops_session';
function now(){return new Date().toISOString()}
function read(){return JSON.parse(fs.readFileSync(DATA_PATH,'utf8'))}
function save(data){const tmp=DATA_PATH+'.'+process.pid+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2),{mode:0o600});fs.renameSync(tmp,DATA_PATH)}
function clean(value,max=280){return String(value??'').trim().slice(0,max).replace(/[<>]/g,'')}
function ipOf(req){return req.socket.remoteAddress||'unknown'} // Do NOT trust user-controlled X-Forwarded-For
function csrfOriginOK(req){
  const origin=req.headers.origin;
  if(!origin)return !req.headers['sec-fetch-site']||['same-origin','none'].includes(req.headers['sec-fetch-site']);
  const expectedHost=req.headers.host||'';
  const proto=IS_PRODUCTION?'https':'http';
  return (!!PUBLIC_OPERATOR_ORIGIN && origin===PUBLIC_OPERATOR_ORIGIN) || origin===`${proto}://${expectedHost}` || (IS_LOCAL && origin===`http://localhost:${PORT}`) || (IS_LOCAL && origin===`http://127.0.0.1:${PORT}`);
}
function commonHeaders(res){
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://www.lastdicesptyltd.co.za; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
  if(IS_PRODUCTION)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
}
function cors(req,res,endpoint){
  const origin=req.headers.origin||'';
  const isPublic=endpoint.startsWith('/public/')||endpoint==='/reports'||endpoint==='/health';
  // Native-capacitor and the intended domain may use public-only endpoints; NO cookie authorisation cross-origin.
  if(isPublic && origin && (ALLOWED_ORIGINS.includes(origin)||origin==='capacitor://localhost'||origin==='ionic://localhost'||(IS_LOCAL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)))){
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  }
}
function reply(req,res,status,obj,endpoint=''){cors(req,res,endpoint);res.writeHead(status,jsonHeaders);res.end(status===204?'':JSON.stringify(obj))}
function cookieHeader(req){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(authCookie+'='))?.slice(authCookie.length+1)||''}
function currentSession(req){const tok=cookieHeader(req);if(!tok||!sessions.has(tok))return null;const s=sessions.get(tok);if(s.expiresAt<Date.now()){sessions.delete(tok);return null}return {token:tok,...s}}
function requireOps(req,res,endpoint,mutation=false){const auth=currentSession(req);if(!auth||auth.role!=='operator'){reply(req,res,401,{error:'Operator sign-in required'},endpoint);return null}if(mutation){
  if(!csrfOriginOK(req)){reply(req,res,403,{error:'Cross-origin operator action rejected'},endpoint);return null}
  const presented=req.headers['x-gaba-csrf']; if(!presented||presented!==auth.csrf){reply(req,res,403,{error:'Missing or invalid CSRF token'},endpoint);return null}
}return auth}
function requireReviewer(req,res,endpoint,mutation=false){const a=currentSession(req);if(!DEMO_REVIEW_ENABLED||!a||a.role!=='demo_reviewer'){reply(req,res,401,{error:'Demo review sign-in required'},endpoint);return null}if(mutation&&(!csrfOriginOK(req)||req.headers['x-gaba-csrf']!==a.csrf)){reply(req,res,403,{error:'Invalid review CSRF or origin'},endpoint);return null}return a}
function limited(map,key,max,windowMs){const t=Date.now();const b=(map.get(key)||[]).filter(x=>x>t-windowMs);b.push(t);map.set(key,b);return b.length>max}
async function parseBody(req){if(!/^application\/json\b/i.test(req.headers['content-type']||''))throw new Error('Expected application/json');const pieces=[];let total=0;for await(const part of req){total+=part.length;if(total>8192)throw new Error('Request exceeds 8 KB');pieces.push(part)}const val=JSON.parse(Buffer.concat(pieces).toString('utf8')||'{}');if(!val||typeof val!=='object'||Array.isArray(val))throw new Error('Expected JSON object');return val}
function audit(s,action,detail){s.audit.unshift({id:'AUD-'+randomUUID().slice(0,8),action,detail,time:now()});s.audit=s.audit.slice(0,200)}
async function handleApi(req,res,endpoint,url){
  if(req.method==='OPTIONS'){
    cors(req,res,endpoint);
    if(!res.getHeader('Access-Control-Allow-Origin'))return reply(req,res,403,{error:'CORS origin not allowed'},endpoint);
    res.writeHead(204,jsonHeaders);res.end();return;
  }
  if(endpoint==='/health'&&req.method==='GET'){return reply(req,res,200,{ok:true,mode:'protected-synthetic-demo',storage:'single-process-local-json',officialFeedConnected:false},endpoint)}
  if(endpoint==='/auth/session'&&req.method==='GET'){
    const a=currentSession(req);return reply(req,res,200,a?{authenticated:true,role:a.role,csrfToken:a.csrf,expiresAt:new Date(a.expiresAt).toISOString()}:{authenticated:false,role:'visitor'},endpoint);
  }
  if(endpoint==='/auth/login'&&req.method==='POST'){
    if(!csrfOriginOK(req))return reply(req,res,403,{error:'Invalid request origin'},endpoint);
    const ip=ipOf(req);
    if(limited(attempts,ip,8,15*60_000))return reply(req,res,429,{error:'Too many sign-in attempts. Try again later.'},endpoint);
    let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const supplied=crypto.createHash('sha256').update(String(b.password||'')).digest();
    if(!timingSafeEqual(supplied,credentialHash))return reply(req,res,401,{error:'Invalid operator password'},endpoint);
    attempts.delete(ip);
    const token=randomBytes(32).toString('base64url'); const csrf=randomBytes(24).toString('base64url');const expiresAt=Date.now()+8*60*60_000;
    sessions.set(token,{csrf,expiresAt,role:'operator'});
    const secure=IS_PRODUCTION?'; Secure':'';
    res.setHeader('Set-Cookie',`${authCookie}=${token}; HttpOnly; SameSite=Strict; Path=${PREFIX}; Max-Age=28800${secure}`);
    return reply(req,res,200,{authenticated:true,role:'operator',csrfToken:csrf,expiresAt:new Date(expiresAt).toISOString()},endpoint);
  }
  if(endpoint==='/auth/reviewer-login'&&req.method==='POST'){
    if(!DEMO_REVIEW_ENABLED)return reply(req,res,404,{error:'Demo reviewer is disabled'},endpoint);
    if(!csrfOriginOK(req))return reply(req,res,403,{error:'Invalid origin'},endpoint);
    if(limited(attempts,'review:'+ipOf(req),8,15*60_000))return reply(req,res,429,{error:'Too many attempts'},endpoint);
    let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const supplied=crypto.createHash('sha256').update(String(b.password||'')).digest();
    if(!timingSafeEqual(supplied,reviewerHash))return reply(req,res,401,{error:'Invalid review password'},endpoint);
    attempts.delete('review:'+ipOf(req));const token=randomBytes(32).toString('base64url');const csrf=randomBytes(24).toString('base64url');const expiresAt=Date.now()+8*60*60_000;
    sessions.set(token,{csrf,expiresAt,role:'demo_reviewer'});
    res.setHeader('Set-Cookie',`${authCookie}=${token}; HttpOnly; SameSite=Strict; Path=${PREFIX}; Max-Age=28800${IS_PRODUCTION?'; Secure':''}`);
    return reply(req,res,200,{authenticated:true,role:'demo_reviewer',csrfToken:csrf,expiresAt:new Date(expiresAt).toISOString()},endpoint);
  }
  if(endpoint==='/auth/logout'&&req.method==='POST'){
    const a=currentSession(req);if(!a||!csrfOriginOK(req)||req.headers['x-gaba-csrf']!==a.csrf)return reply(req,res,403,{error:'Invalid logout session'},endpoint);
    sessions.delete(a.token);res.setHeader('Set-Cookie',`${authCookie}=; HttpOnly; SameSite=Strict; Path=${PREFIX}; Max-Age=0${IS_PRODUCTION?'; Secure':''}`);
    return reply(req,res,200,{authenticated:false},endpoint);
  }
  if(endpoint==='/public/health-guides'&&req.method==='GET')return reply(req,res,200,{guides:HEALTH_GUIDES,notice:'General educational guidance only. No live water-quality testing or medical diagnosis.'},endpoint);
  if(endpoint==='/public/municipal-help'&&req.method==='GET')return reply(req,res,200,{contacts:[OFFICIAL_CHANNELS],connectionStatus:'No municipal integration or dispatch connected. Use official channels directly.'},endpoint);
  if(endpoint==='/public/feed'&&req.method==='GET'){
    const s=read();const areas=['Khayelitsha East','Mitchells Plain','Bellville South','Cape Flats West'];const area=clean(url.searchParams.get('area'),80);
    if(area&&!areas.includes(area))return reply(req,res,400,{error:'Unknown demonstration area'},endpoint);
    const incidents=s.incidents.filter(i=>!area||i.zone===area).map(i=>({id:i.id,area:i.zone,title:i.type,status:i.status,severity:i.severity,sourceType:'synthetic_sensor',sourceLabel:'SIMULATION — not a utility advisory',verifiedByUtility:false,updatedAt:i.createdAt||null,restorationEstimate:null,waterQualityVerified:false}));
    const communityUpdates=(s.reports||[]).filter(r=>(!area||r.zone===area)&&r.review?.decision==='confirmed').map(r=>({reportId:r.id,area:r.zone,category:r.category,reason:REPORT_CAUSES[r.review.cause]||REPORT_CAUSES.unknown,restorationEstimate:r.review.eta||null,sourceType:'simulated_review',verificationLabel:'SIMULATED municipal review — NOT official confirmation',verifiedByUtility:false,reviewedAt:r.review.reviewedAt}));
    return reply(req,res,200,{mode:'synthetic',officialFeedConnected:false,areas,area:area||null,incidents,communityUpdates,notice:'Synthetic demonstration only. This feed does not establish current water availability or safety.'},endpoint);
  }
  if(endpoint==='/public/report-status'&&req.method==='GET'){
    const token=clean(url.searchParams.get('clientId'),100);
    if(!/^local-[0-9a-fA-F-]{36}$/.test(token))return reply(req,res,400,{error:'Invalid local report token'},endpoint);
    if(limited(submissions,'lookup:'+ipOf(req),120,60*60_000))return reply(req,res,429,{error:'Too many lookup requests'},endpoint);
    const report=read().reports.find(r=>r.clientId===token);if(!report)return reply(req,res,404,{error:'Report not found'},endpoint);
    return reply(req,res,200,{id:report.id,status:report.status,createdAt:report.createdAt,updatedAt:report.updatedAt||null,operatorNote:report.operatorNote||null,routingStage:report.routingStage||'Not routed',review:report.review?{decision:report.review.decision,cause:report.review.cause,reason:REPORT_CAUSES[report.review.cause]||REPORT_CAUSES.unknown,eta:report.review.eta||null,verificationLabel:'SIMULATED REVIEW — NOT MUNICIPAL CONFIRMATION'}:null,verifiedByMunicipality:false,source:'GABA synthetic demo',disclaimer:'Not an official municipal case reference'},endpoint);
  }
  if(endpoint==='/reports'&&req.method==='POST'){
    if(req.headers.origin&&!resAllowedPublic(req.headers.origin,endpoint))return reply(req,res,403,{error:'Origin not allowed'},endpoint);
    if(limited(submissions,'report:'+ipOf(req),15,60*60_000))return reply(req,res,429,{error:'Report limit reached for this demonstration'},endpoint);
    let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const category=clean(b.category,60),zone=clean(b.zone,80),details=clean(b.details,500),clientId=clean(b.clientId,100);
    if(!['Leak or burst pipe','No water','Low pressure','Water quality','Other'].includes(category)||!['Khayelitsha East','Mitchells Plain','Bellville South','Cape Flats West'].includes(zone)||details.length<8||!/^local-[0-9a-fA-F-]{36}$/.test(clientId))return reply(req,res,400,{error:'Invalid area, category, description or report ID'},endpoint);
    const s=read();const existing=s.reports.find(r=>r.clientId===clientId);
    if(existing)return reply(req,res,200,{report:{id:existing.id,clientId:existing.clientId,status:existing.status,createdAt:existing.createdAt},duplicate:true},endpoint);
    const report={id:'REP-'+randomUUID().slice(0,8).toUpperCase(),category,zone,details,createdAt:now(),status:'Received',routingStage:'Not routed',review:null,fieldEvidence:null,source:'Resident demonstration',clientId};
    s.reports.unshift(report);audit(s,'Community report received',`${report.id} · ${zone}`);s.revision++;save(s);
    return reply(req,res,201,{report:{id:report.id,clientId,createdAt:report.createdAt,status:report.status},duplicate:false},endpoint);
  }
  if(endpoint==='/review/queue'&&req.method==='GET'){
    if(!requireReviewer(req,res,endpoint))return;const s=read();const pending=s.reports.filter(r=>r.routingStage==='Awaiting demo review');
    return reply(req,res,200,{mode:'simulation_only',reports:pending.map(r=>({id:r.id,zone:r.zone,category:r.category,details:r.details,status:r.status,routingStage:r.routingStage,sourceType:'community_report',relatedEvidence:s.incidents.filter(i=>i.zone===r.zone).map(i=>({id:i.id,headline:i.type,source:'synthetic_sensor',evidence:i.evidence}))}))},endpoint);
  }
  const reviewMatch=endpoint.match(/^\/review\/reports\/(REP-[A-Za-z0-9-]+)\/confirm$/);
  if(reviewMatch&&req.method==='POST'){
    if(!requireReviewer(req,res,endpoint,true))return;let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const decision=clean(b.decision,20),cause=clean(b.cause,24),eta=clean(b.eta,32);
    if(!['confirmed','needs_more_evidence'].includes(decision)||!Object.hasOwn(REPORT_CAUSES,cause)||eta&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(eta))return reply(req,res,400,{error:'Invalid review decision, cause or ETA'},endpoint);
    const s=read(),r=s.reports.find(x=>x.id===reviewMatch[1]);if(!r)return reply(req,res,404,{error:'Unknown report'},endpoint);
    if(r.routingStage!=='Awaiting demo review')return reply(req,res,409,{error:'Case not awaiting review'},endpoint);
    r.review={decision,cause,eta:eta||null,reviewedAt:now(),authority:'demo_reviewer_only',verifiedByMunicipality:false};r.routingStage=decision==='confirmed'?'Demo review completed':'More information requested';r.updatedAt=now();
    audit(s,'Simulated municipal review',`${r.id} → ${decision}; not an official water utility response`);s.revision++;save(s);
    return reply(req,res,200,{report:{id:r.id,routingStage:r.routingStage,review:r.review},officialMunicipalVerification:false},endpoint);
  }
  const routeMatch=endpoint.match(/^\/reports\/(REP-[A-Za-z0-9-]+)\/route$/);
  if(routeMatch&&req.method==='POST'){
    if(!requireOps(req,res,endpoint,true))return;const s=read(),r=s.reports.find(x=>x.id===routeMatch[1]);if(!r)return reply(req,res,404,{error:'Report not found'},endpoint);
    if(r.status!=='Investigating'||r.routingStage&&r.routingStage!=='Not routed')return reply(req,res,409,{error:'Review the report before routing; duplicate routing blocked'},endpoint);
    r.routingStage='Awaiting demo review';r.routedAt=now();r.updatedAt=now();r.outbox={channel:'INTERNAL SIMULATION ONLY',externalDelivery:false,municipalReference:null};
    audit(s,'Handoff queued (simulation)',`${r.id} queued to demo review; no message delivered to a municipality`);s.revision++;save(s);
    return reply(req,res,200,{report:{id:r.id,routingStage:r.routingStage},municipalityNotified:false},endpoint);
  }
  const fieldMatch=endpoint.match(/^\/reports\/(REP-[A-Za-z0-9-]+)\/field-evidence$/);
  if(fieldMatch&&req.method==='POST'){
    if(!requireOps(req,res,endpoint,true))return;let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const note=clean(b.note,400);if(note.length<12)return reply(req,res,400,{error:'Field evidence note must have at least 12 characters'},endpoint);
    const s=read(),r=s.reports.find(x=>x.id===fieldMatch[1]);if(!r)return reply(req,res,404,{error:'Report not found'},endpoint);
    if(r.review?.decision!=='confirmed')return reply(req,res,409,{error:'Demo review required before field closure'},endpoint);
    r.fieldEvidence={note,recordedAt:now(),source:'SIMULATED INSPECTION — NOT FIELD VERIFIED'};r.updatedAt=now();audit(s,'Simulation field evidence recorded',`${r.id} · demo note, no physical inspection confirmed`);s.revision++;save(s);return reply(req,res,200,{id:r.id,evidence:r.fieldEvidence},endpoint);
  }
  if(endpoint==='/overview'&&req.method==='GET'){
    if(!requireOps(req,res,endpoint))return;
    const s=read();return reply(req,res,200,{incidents:s.incidents,reports:s.reports,audit:s.audit.slice(0,40),revision:s.revision,metadata:{mode:'synthetic',sites:4,sensors:18,storage:68,pressure:421,telemetry:'simulation'}},endpoint);
  }
  const rep=endpoint.match(/^\/reports\/(REP-[A-Za-z0-9-]+)\/status$/);
  if(rep&&req.method==='PATCH'){
    if(!requireOps(req,res,endpoint,true))return;
    let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const s=read(),r=s.reports.find(x=>x.id===rep[1]);if(!r)return reply(req,res,404,{error:'Report not found'},endpoint);
    const status=clean(b.status,24),states={'Received':['Investigating'],'Investigating':['Resolved'],'Resolved':[]};
    if(status==='Resolved'&&(!r.fieldEvidence||r.review?.decision!=='confirmed'))return reply(req,res,409,{error:'Require demo reviewer confirmation and recorded field evidence before closure'},endpoint);
    if(!(states[r.status]||[]).includes(status))return reply(req,res,409,{error:'Invalid report status transition'},endpoint);
    r.status=status;r.updatedAt=now();r.operatorNote=status==='Resolved'?'Simulation closed with recorded demo field note. No municipal dispatch or field visit occurred.':'Demo operator review started.';
    audit(s,'Community report updated',`${r.id} → ${status}`);s.revision++;save(s);return reply(req,res,200,{report:r},endpoint);
  }
  const inc=endpoint.match(/^\/incidents\/(INC-[A-Za-z0-9-]+)\/status$/);
  if(inc&&req.method==='PATCH'){
    if(!requireOps(req,res,endpoint,true))return;
    let b;try{b=await parseBody(req)}catch(e){return reply(req,res,400,{error:e.message},endpoint)}
    const s=read(),item=s.incidents.find(x=>x.id===inc[1]);if(!item)return reply(req,res,404,{error:'Incident not found'},endpoint);
    const status=clean(b.status,30),states={'Open':['Investigating'],'Investigating':['Inspection approved','Resolved'],'Monitoring':['Investigating'],'Inspection approved':['Resolved'],'Resolved':[]};
    if(!(states[item.status]||[]).includes(status))return reply(req,res,409,{error:'Invalid incident status transition'},endpoint);
    item.status=status;item.audit.push(`${now()} · ${status} (authorised demonstration operator)`);audit(s,'Operator decision',`${item.id} → ${status}`);s.revision++;save(s);return reply(req,res,200,{incident:item},endpoint);
  }
  if(endpoint==='/demo/reset'&&req.method==='POST'){
    if(!requireOps(req,res,endpoint,true))return;const s=JSON.parse(fs.readFileSync(SEED_PATH,'utf8'));save(s);return reply(req,res,200,{ok:true},endpoint);
  }
  return reply(req,res,404,{error:'Unknown API endpoint'},endpoint);
}
function resAllowedPublic(origin,endpoint){return ALLOWED_ORIGINS.includes(origin)||origin==='capacitor://localhost'||origin==='ionic://localhost'||(IS_LOCAL&&/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))}
const server=http.createServer(async(req,res)=>{
  commonHeaders(res);
  let u;try{u=new URL(req.url,'http://localhost')}catch{return reply(req,res,400,{error:'Bad URL'})}
  let pathname;try{pathname=decodeURIComponent(u.pathname)}catch{return reply(req,res,400,{error:'Bad URL encoding'})}
  const endpoint=pathname.replace(new RegExp(`^${PREFIX}/api`),'').replace(/^\/api/,'');
  if(pathname.startsWith(`${PREFIX}/api/`)||pathname.startsWith('/api/')){
    try{await handleApi(req,res,endpoint,u)}catch(e){console.error('GABA API internal error',e);reply(req,res,500,{error:'Service error'},endpoint)}return;
  }
  if(pathname===PREFIX){res.writeHead(308,{Location:PREFIX+'/'+u.search});return res.end()}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
  pathname=pathname.replace(new RegExp(`^${PREFIX}(?=/|$)`),'')||'/';
  if(pathname==='/'||pathname==='/index.html')pathname='/index.html';if(pathname==='/preview')pathname='/preview.html';if(pathname==='/review')pathname='/review.html';
  const full=path.resolve(ROOT,'.'+pathname);if(!full.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end()}
  try{if(!fs.statSync(full).isFile())throw Error('not a file');const headers={'Content-Type':MIME[path.extname(full)]||'application/octet-stream','Cache-Control':/^(\/sw\.js|\/index\.html|\/config\.js)$/.test(pathname)?'no-cache':'public, max-age=300','X-Content-Type-Options':'nosniff'};
  res.writeHead(200,headers);if(req.method==='HEAD')return res.end();fs.createReadStream(full).pipe(res)}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}
});
if(require.main===module){server.listen(PORT,HOST,()=>{
  console.log(`GABA secure competition demo: http://${IS_LOCAL?'localhost':HOST}:${PORT}${PREFIX}/`);
  if(!process.env.GABA_OPERATOR_PASSWORD)console.log(`LOCAL OPERATOR PASSWORD (this launch only): ${bootPassword}`);
  if(DEMO_REVIEW_ENABLED&&!process.env.GABA_DEMO_REVIEW_PASSWORD)console.log(`LOCAL DEMO REVIEW PASSWORD (this launch only): ${reviewerPassword}`);
  console.log('SYNTHETIC DEMO ONLY. No field systems connected.');
})}
module.exports={server,clean,read};
