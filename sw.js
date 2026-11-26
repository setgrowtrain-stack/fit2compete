// Fit 2 Compete service worker: keeps the app shell for fast starts. Never caches data or AI requests.
const SHELL="f2c-shell-1795673415
1795641449";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(SHELL).then(c=>c.addAll(["./","manifest.webmanifest","icons/icon-192.png"])))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
 if(e.request.method!=="GET"||u.origin!==location.origin)return; // API calls go straight to the network
 e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(SHELL).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("./"))))});
