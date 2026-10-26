const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function auth(fetch){
 const map=new Map([['gaba.resident.access','saved'],['gaba.resident.refresh','refresh']]);
 const el={addEventListener(){},classList:{toggle(){},remove(){}},style:{},setAttribute(){}};
 const context=vm.createContext({fetch,URLSearchParams,window:{},location:{search:'',hash:''},document:{querySelector:()=>el,querySelectorAll:()=>[]},localStorage:{getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},sessionStorage:{},history:{}});
 let source=fs.readFileSync('native-judges/auth.js','utf8');source=source.replace('callback().catch(e=>note(e.message,true));','');vm.runInContext(source,context);
 return {map,current:()=>vm.runInContext('current()',context)};
}
test('temporary network failure preserves both session credentials',async()=>{
 const a=auth(async()=>{throw Error('Network unavailable')});await assert.rejects(a.current(),/saved login is retained/);assert.equal(a.map.get('gaba.resident.refresh'),'refresh');assert.equal(a.map.get('gaba.resident.access'),'saved');
});
test('auth server outage preserves credentials without refreshing',async()=>{
 let calls=0;const a=auth(async()=>{calls++;return {ok:false,status:503,json:async()=>({})}});await assert.rejects(a.current());assert.equal(calls,1);assert.equal(a.map.get('gaba.resident.access'),'saved');
});
test('expired access token refreshes and returns the verified account',async()=>{
 let calls=0;const a=auth(async()=>{calls++;return calls===1?{ok:false,status:401,json:async()=>({})}:{ok:true,status:200,json:async()=>calls===2?{access_token:'renewed',refresh_token:'rotated'}:{email:'synthetic@example.test',email_confirmed_at:'2026-10-24'}}});
 assert.equal((await a.current()).email,'synthetic@example.test');assert.equal(a.map.get('gaba.resident.access'),'renewed');
});
test('invalid refresh token clears rejected credentials',async()=>{
 let calls=0;const a=auth(async()=>({ok:false,status:++calls===1?401:400,json:async()=>({})}));assert.equal(await a.current(),null);assert.equal(a.map.size,0);
});
test('service worker never intercepts APK and ZIP downloads',()=>{
 let handler;const context=vm.createContext({URL,self:{addEventListener:(name,fn)=>{if(name==='fetch')handler=fn}},location:{origin:'https://example.test'}});vm.runInContext(fs.readFileSync('public/sw.js','utf8'),context);
 for(const ext of ['apk','zip']){let intercepted=false;handler({request:{method:'GET',url:'https://example.test/app.'+ext},respondWith(){intercepted=true}});assert.equal(intercepted,false)}
});
