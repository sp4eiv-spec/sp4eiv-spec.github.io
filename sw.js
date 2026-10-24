// drogiNKE — pamięć podręczna, żeby aplikacja otwierała się także bez zasięgu
const CACHE="drogiNKE-v2";
const SHELL=["./","index.html","manifest.json","icon-192.png","icon-512.png","https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return; // zapytania Overpass (POST) zawsze z sieci
  if(u.pathname.endsWith("/api/interpreter")){
    e.respondWith(caches.open("drogiNKE-trasy").then(async c=>{
      try{const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}
      catch(err){const hit=await c.match(e.request);if(hit)return hit;throw err}
    }));return;
  }
  if(u.hostname.endsWith("tile.openstreetmap.org")){
    e.respondWith(caches.open("drogiNKE-tiles").then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);
      return hit||net;
    }));return;
  }
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)));
});
