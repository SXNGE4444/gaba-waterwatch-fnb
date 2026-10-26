const CACHE='gaba-waterwatch-v097';
const ASSETS=['./','./index.html','./styles.css','./brand-v07.css','./app.js','./config.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('gaba-waterwatch-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/api/')||/\.(apk|zip|aab|json|txt)$/i.test(u.pathname))return;
 e.respondWith(fetch(e.request).then(r=>{
  if(r.ok&&ASSETS.some(a=>new URL(a,self.registration.scope).pathname===u.pathname)){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}
  return r;
 }).catch(async()=>{
  const cached=await caches.match(e.request);if(cached)return cached;
  if(e.request.mode==='navigate'&&!/\.[a-z0-9]+$/i.test(u.pathname))return (await caches.match('./index.html'))||Response.error();
  return Response.error();
 }));
});
