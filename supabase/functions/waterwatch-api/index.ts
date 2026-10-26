import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** GABA WaterWatch FNB isolated STAGING demo API.
 * Public: curated SYNTHETIC feed. Verified resident auth required for submissions and owner-scoped report status.
 * Staff: Supabase Auth JWT + explicit fnb_staff_roles; never trust client role claims.
 * No municipal integration, safety determination, or external dispatch.
 */
const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "";
const ADMIN_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PUBLIC_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const admin = createClient(PROJECT_URL, ADMIN_KEY, { auth: { persistSession: false } });
const ALLOWED = new Set([
  "https://sxnge4444.github.io",
  "https://www.lastdicesptyltd.co.za",
  "https://lastdicesptyltd.co.za",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
]);
const AREAS = ["Khayelitsha East","Mitchells Plain","Bellville South","Cape Flats West"];
const CATEGORIES = ["Leak or burst pipe","No water","Low pressure","Water quality","Other"];
const CAUSES: Record<string,string> = {
  unknown:"Cause not yet confirmed", planned:"Planned maintenance (simulation)",
  pipe:"Pipe failure (simulation)", reservoir:"Reservoir supply constraint (simulation)",
  quality:"Water quality investigation (simulation)"
};
const clean = (x: unknown, len=280) => String(x ?? "").trim().slice(0,len).replace(/[<>]/g,"");
const eq = (s:unknown,list:string[]) => list.includes(String(s||""));
const fail = (msg:string,status=400) => {throw { status, message:msg };};
const out=(req:Request,data:unknown,status=200)=>{
  const origin=req.headers.get("origin")||"";
  const allow=ALLOWED.has(origin);
  return new Response(JSON.stringify(data),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
    "Vary":"Origin",...(allow?{"Access-Control-Allow-Origin":origin}:{})
  }});
};
async function body(req:Request) {
  if(!req.headers.get("content-type")?.includes("application/json"))fail("JSON body required",415);
  const raw=await req.text();if(raw.length>8192)fail("Request too large",413);
  let obj;try{obj=JSON.parse(raw)}catch{fail("Invalid JSON")};
  if(!obj||Array.isArray(obj)||typeof obj!=="object")fail("Object required");
  return obj as Record<string,unknown>;
}
async function resident(req:Request) {
  const bearer=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(bearer))fail("Verified resident login required",401);
  const {data:{user},error}=await admin.auth.getUser(bearer.slice(7));
  if(error||!user)fail("Resident session expired; please sign in again",401);
  if(!user.email_confirmed_at)fail("Email confirmation required",403);
  return {id:user.id,email:user.email};
}
async function role(req:Request,allowed:string[]) {
  const bearer=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(bearer))fail("Staff login required",401);
  const token=bearer.slice(7);
  const {data:{user},error}=await admin.auth.getUser(token);
  if(error||!user)fail("Invalid or expired staff session",401);
  const {data:r,error:re}=await admin.from("fnb_staff_roles").select("role").eq("user_id",user.id).maybeSingle();
  if(re||!r||!allowed.includes(r.role))fail("Authorised staff role required",403);
  return { id:user.id, role:r.role };
}
async function audit(action:string,detail:string,report_id:string|null,actor_id:string|null) {
  const {error}=await admin.from("fnb_audit_events").insert({action,detail,report_id,actor_id});
  if(error)throw Error("Audit storage failed");
}
async function quota(req:Request,action:string,limit:number) {
  // Demonstration throttle only. Not a substitute for a gateway/WAF rate limiter.
  const fingerprint=(req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
  const input=fingerprint+"|"+action+"|fnb-v1";
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(input));
  const key=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
  const cutoff=new Date(Date.now()-3600000).toISOString();
  const {count,error}=await admin.from("fnb_rate_events").select("id",{count:"exact",head:true})
    .eq("client_key_hash",key).eq("action",action).gte("created_at",cutoff);
  if(error)fail("Traffic controls unavailable",503);
  if((count||0)>=limit)fail("Rate limit exceeded",429);
  const {error:e}=await admin.from("fnb_rate_events").insert({client_key_hash:key,action});
  if(e)fail("Traffic controls unavailable",503);
}
async function getReports() {
  const {data,error}=await admin.from("fnb_reports").select("*").order("created_at",{ascending:false}).limit(200);
  if(error)throw Error("Report query failed");
  return (data||[]) as any[];
}
async function getIncidents(){
  const {data,error}=await admin.from("fnb_incidents").select("id,payload").limit(100);
  if(error)throw Error("Incident query failed");
  return (data||[]).map((r:any)=>r.payload);
}
async function getReport(id:string){
  const {data,error}=await admin.from("fnb_reports").select("*").eq("id",id).maybeSingle();
  if(error)throw Error("Report lookup failed");
  if(!data)fail("Unknown report",404);
  return data as any;
}
async function updateReport(id:string,patch:Record<string,unknown>){
  const {data,error}=await admin.from("fnb_reports").update({...patch,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  if(error||!data)throw Error("Report update failed");
  return data as any;
}
function normalize(r:any) {
  return {...r,clientId:r.client_id,routingStage:r.routing_stage,
    createdAt:r.created_at,updatedAt:r.updated_at,operatorNote:r.operator_note,fieldEvidence:r.field_evidence};
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(origin&&!ALLOWED.has(origin))return out(req,{error:"Origin not allowed"},403);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
    "Access-Control-Allow-Origin":origin||"https://sxnge4444.github.io",
    "Access-Control-Allow-Headers":"authorization, content-type, apikey",
    "Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS",
    "Access-Control-Max-Age":"600","Vary":"Origin"
  }});
  try{
    if(!PROJECT_URL||!ADMIN_KEY||!PUBLIC_KEY)fail("Backend configuration incomplete",503);
    const u=new URL(req.url);
    const endpoint=u.pathname.replace(/^.*\/waterwatch-api(?=\/|$)/,"").replace(/^\/api(?=\/|$)/,"")||"/";
    if(req.method==="GET"&&endpoint==="/health")
      return out(req,{ok:true,mode:"supabase-synthetic-demo",storage:"supabase-postgres",officialFeedConnected:false});
    if(req.method==="POST"&&(endpoint==="/auth/login"||endpoint==="/auth/reviewer-login")){
      await quota(req,"login",12);
      const b=await body(req);
      const email=clean(b.email,200),password=String(b.password||"");
      if(!email||!password)fail("Enter email and password");
      const publicAuth=createClient(PROJECT_URL,PUBLIC_KEY,{auth:{persistSession:false}});
      const {data,error}=await publicAuth.auth.signInWithPassword({email,password});
      if(error||!data.user||!data.session)fail("Invalid staff credentials",401);
      const {data:staff,error:e}=await admin.from("fnb_staff_roles").select("role").eq("user_id",data.user.id).maybeSingle();
      const expected=endpoint.includes("reviewer")?"demo_reviewer":"operator";
      if(e||staff?.role!==expected)fail("Staff role not authorised",403);
      return out(req,{authenticated:true,role:staff.role,accessToken:data.session.access_token,
        expiresAt:new Date(data.session.expires_at!*1000).toISOString()});
    }
    if(req.method==="GET"&&endpoint==="/auth/session"){
      try{const a=await role(req,["operator","demo_reviewer"]);return out(req,{authenticated:true,role:a.role})}
      catch{return out(req,{authenticated:false,role:"visitor"})}
    }
    if(req.method==="POST"&&endpoint==="/auth/logout")return out(req,{authenticated:false});
    if(req.method==="GET"&&endpoint==="/public/feed"){
      const area=clean(u.searchParams.get("area"),80);
      if(area&&!AREAS.includes(area))fail("Invalid area");
      const [incidents,reports]=await Promise.all([getIncidents(),getReports()]);
      const readable=incidents.filter((i:any)=>!area||i.zone===area).map((i:any)=>({
        id:i.id,area:i.zone,title:i.type,status:i.status,severity:i.severity,
        sourceType:"synthetic_sensor",sourceLabel:"SIMULATION — not a utility advisory",
        verifiedByUtility:false,updatedAt:null,restorationEstimate:null,waterQualityVerified:false
      }));
      const updates=reports.filter(r=>(!area||r.zone===area)&&r.review?.decision==="confirmed")
        .map(r=>({reportId:r.id,area:r.zone,category:r.category,reason:CAUSES[r.review.cause]||CAUSES.unknown,
          restorationEstimate:null,sourceType:"simulated_review",
          verificationLabel:"SIMULATED REVIEW — NOT MUNICIPAL CONFIRMATION",verifiedByMunicipality:false}));
      return out(req,{mode:"synthetic",officialFeedConnected:false,areas:AREAS,area:area||null,
        incidents:readable,communityUpdates:updates,
        notice:"SYNTHETIC DEMO. No information represents real municipal incidents or water quality."});
    }
    if(req.method==="GET"&&endpoint==="/public/report-status"){
      const account=await resident(req);
      await quota(req,"report-status",120);
      const clientId=clean(u.searchParams.get("clientId"),100);
      if(!/^local-[0-9a-f-]{36}$/i.test(clientId))fail("Invalid tracking token");
      const {data:r,error}=await admin.from("fnb_reports")
        .select("id,status,created_at,updated_at,operator_note,routing_stage,review")
        .eq("client_id",clientId).eq("resident_user_id",account.id).maybeSingle();
      if(error)throw Error("Status lookup failed");
      if(!r)fail("Report not found",404);
      return out(req,{id:r.id,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,
        operatorNote:r.operator_note,routingStage:r.routing_stage,
        review:r.review?{decision:r.review.decision,cause:r.review.cause,reason:CAUSES[r.review.cause]||CAUSES.unknown,
          verifiedByMunicipality:false}:null});
    }
    if(req.method==="POST"&&endpoint==="/reports"){
      const account=await resident(req);
      await quota(req,"report-create",15);
      const b=await body(req),category=clean(b.category,60),zone=clean(b.zone,80),
        details=clean(b.details,500),clientId=clean(b.clientId,100);
      if(!eq(category,CATEGORIES)||!eq(zone,AREAS)||details.length<8||
        !/^local-[0-9a-f-]{36}$/i.test(clientId))fail("Invalid report category, area, description or token");
      const {data:prior}=await admin.from("fnb_reports").select("id,status,created_at,resident_user_id").eq("client_id",clientId).maybeSingle();
      if(prior&&prior.resident_user_id!==account.id)fail("This report belongs to another account",403);
      if(prior)return out(req,{report:{id:prior.id,clientId,status:prior.status,createdAt:prior.created_at},duplicate:true});
      const id="REP-"+crypto.randomUUID().slice(0,8).toUpperCase();
      const {data:r,error}=await admin.from("fnb_reports").insert({id,client_id:clientId,category,zone,details,resident_user_id:account.id})
        .select("id,status,created_at").single();
      if(error){if(error.code==="23505")fail("Duplicate report, check your reports",409);throw Error("Unable to store report")}
      await audit("Community report received","Synthetic intake: "+id+" · "+zone,id,null);
      return out(req,{report:{id:r.id,clientId,status:r.status,createdAt:r.created_at},duplicate:false},201);
    }
    // Every route below this line must authenticate staff using verified Supabase Auth.
    if(req.method==="GET"&&endpoint==="/overview"){
      const a=await role(req,["operator"]);
      const [incidents,reports]=await Promise.all([getIncidents(),getReports()]);
      const {data:auditRows}=await admin.from("fnb_audit_events")
        .select("id,action,detail,created_at").order("created_at",{ascending:false}).limit(40);
      return out(req,{incidents,reports:reports.map(normalize),
        audit:(auditRows||[]).map((x:any)=>({...x,time:x.created_at})),
        revision:(auditRows||[]).length,
        metadata:{mode:"synthetic",sites:4,sensors:18,storage:68,pressure:421,telemetry:"simulation",
          staffRole:a.role}});
    }
    if(req.method==="GET"&&endpoint==="/review/queue"){
      await role(req,["demo_reviewer"]);
      const [reports,incidents]=await Promise.all([getReports(),getIncidents()]);
      return out(req,{mode:"simulation_only",reports:reports.filter(r=>r.routing_stage==="Awaiting demo review")
        .map(r=>({...normalize(r),relatedEvidence:incidents.filter((i:any)=>i.zone===r.zone)
          .map((i:any)=>({id:i.id,headline:i.type,source:"synthetic_sensor",evidence:i.evidence||[]}))}))});
    }
    const route=endpoint.match(/^\/reports\/(REP-[A-Za-z0-9-]+)\/route$/);
    if(route&&req.method==="POST"){
      const a=await role(req,["operator"]),r=await getReport(route[1]);
      if(r.status!=="Investigating"||r.routing_stage!=="Not routed")fail("Report must be investigated before a single handoff",409);
      const saved=await updateReport(r.id,{routing_stage:"Awaiting demo review",routed_at:new Date().toISOString()});
      await audit("Simulated handoff queued","No real municipality contacted",r.id,a.id);
      return out(req,{report:{id:r.id,routingStage:saved.routing_stage},municipalityNotified:false});
    }
    const review=endpoint.match(/^\/review\/reports\/(REP-[A-Za-z0-9-]+)\/confirm$/);
    if(review&&req.method==="POST"){
      const a=await role(req,["demo_reviewer"]),b=await body(req),r=await getReport(review[1]);
      const decision=clean(b.decision,32),cause=clean(b.cause,24);
      if(r.routing_stage!=="Awaiting demo review")fail("Case not awaiting demo review",409);
      if(!["confirmed","needs_more_evidence"].includes(decision)||!(cause in CAUSES))fail("Invalid simulated review");
      const data={decision,cause,eta:null,reviewedAt:new Date().toISOString(),
        authority:"demo_reviewer_only",verifiedByMunicipality:false};
      const saved=await updateReport(r.id,{review:data,routing_stage:decision==="confirmed"?
        "Demo review completed":"More information requested"});
      await audit("Simulated municipal review",r.id+" reviewed by demo role; NOT official",r.id,a.id);
      return out(req,{report:{id:r.id,routingStage:saved.routing_stage,review:data},
        officialMunicipalVerification:false});
    }
    const evidence=endpoint.match(/^\/reports\/(REP-[A-Za-z0-9-]+)\/field-evidence$/);
    if(evidence&&req.method==="POST"){
      const a=await role(req,["operator"]),b=await body(req),r=await getReport(evidence[1]);
      const note=clean(b.note,400);
      if(note.length<12)fail("At least 12 characters of inspection note required");
      if(r.review?.decision!=="confirmed")fail("Demo review must finish before evidence",409);
      const entry={note,recordedAt:new Date().toISOString(),source:"SIMULATED INSPECTION — NOT FIELD VERIFIED"};
      await updateReport(r.id,{field_evidence:entry});
      await audit("Simulated inspection recorded",r.id+" has demo field note",r.id,a.id);
      return out(req,{id:r.id,evidence:entry});
    }
    const report=endpoint.match(/^\/reports\/(REP-[A-Za-z0-9-]+)\/status$/);
    if(report&&req.method==="PATCH"){
      const a=await role(req,["operator"]),b=await body(req),r=await getReport(report[1]);
      const next=clean(b.status,24);
      const transitions:Record<string,string[]>={Received:["Investigating"],Investigating:["Resolved"],Resolved:[]};
      if(!transitions[r.status]?.includes(next))fail("Invalid report status transition",409);
      if(next==="Resolved"&&(!r.field_evidence||r.review?.decision!=="confirmed"))
        fail("Simulated review and field evidence required before closure",409);
      const saved=await updateReport(r.id,{status:next,operator_note:next==="Resolved"?
        "Simulation closed with demo evidence; municipality NOT notified":"Demo operator review started"});
      await audit("Report status updated",r.id+" → "+next,r.id,a.id);
      return out(req,{report:normalize(saved)});
    }
    const incident=endpoint.match(/^\/incidents\/(INC-[A-Za-z0-9-]+)\/status$/);
    if(incident&&req.method==="PATCH"){
      const a=await role(req,["operator"]),b=await body(req),status=clean(b.status,30);
      const {data:row}=await admin.from("fnb_incidents").select("payload").eq("id",incident[1]).maybeSingle();
      if(!row)fail("Unknown incident",404);
      const transitions:Record<string,string[]>={Open:["Investigating"],Investigating:["Inspection approved","Resolved"],
        Monitoring:["Investigating"],"Inspection approved":["Resolved"],Resolved:[]};
      if(!transitions[row.payload.status]?.includes(status))fail("Invalid incident transition",409);
      const payload={...row.payload,status,audit:[...(row.payload.audit||[]),
        new Date().toISOString()+" · "+status+" (demo operator)"]};
      const {error}=await admin.from("fnb_incidents").update({payload,updated_at:new Date().toISOString()})
        .eq("id",incident[1]);if(error)throw Error("Incident save failed");
      await audit("Simulated incident updated",incident[1]+" → "+status,null,a.id);
      return out(req,{incident:payload});
    }
    if(endpoint==="/demo/reset")fail("Cloud demo reset disabled to preserve submitted reports",409);
    return out(req,{error:"Unknown endpoint"},404);
  }catch(e:any){
    const status=Number(e?.status)||500;
    if(status>=500)console.error("GABA demo API error:",e?.message||"unknown");
    return out(req,{error:status<500?e.message:"Server error. Please retry."},status);
  }
});
