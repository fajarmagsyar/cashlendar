const CACHE = 'cashlendar-public-v1';
const PUBLIC_ASSETS = ['/offline.html','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cashlendar-public-') && key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url = new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) return;
  if(event.request.mode==='navigate') {
    event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/offline.html'))));
  } else if(PUBLIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname)) || fetch(event.request)));
  }
});
