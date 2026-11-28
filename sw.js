// Fit 2 Compete service worker: opens the app from the phone's saved copy right away, then refreshes that copy in the background.
// Never caches data or AI requests (those go to Google, a different site). version.json always comes from the network.
const SHELL="f2c-shell-1795836156";
const ROOT=new URL("./",self.registration.scope).href;
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(SHELL).then(c=>c.addAll([ROOT,"manifest.webmanifest","icons/icon-192.png"])))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const req=e.request,u=new URL(req.url);
 if(req.method!=="GET"||u.origin!==location.origin)return;   // API calls go straight to the network
 if(/version\.json$/.test(u.pathname))return;                 // the update check must see the live version
 if(req.cache==="no-store"||req.cache==="reload")return;      // the app asking for a fresh copy goes straight to the network
 const nav=req.mode==="navigate",key=nav?ROOT:req;
 e.respondWith(caches.open(SHELL).then(async c=>{
  const hit=await c.match(key,{ignoreSearch:nav});
  const net=fetch(req,nav?{cache:"no-store"}:undefined).then(r=>{if(r&&r.ok&&r.type==="basic")c.put(key,r.clone());return r});
  if(hit){e.waitUntil(net.catch(()=>{}));return hit}
  return net.catch(()=>c.match(ROOT))}))});
