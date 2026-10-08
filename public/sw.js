const CACHE = 'cashlendar-public-v2';
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
self.addEventListener('push',event=>{
  let data;
  try { data=event.data?.json(); } catch { return; }
  if(!data) return;
  event.waitUntil(self.registration.showNotification('Cashlendar',{
    body:typeof data.body==='string' ? data.body : '',
    icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',
    tag:typeof data.tag==='string' ? data.tag : 'family-reminder',data:{url:'/board'}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(client=>new URL(client.url).origin===self.location.origin);
    if(existing) { await existing.navigate('/board');return existing.focus(); }
    return self.clients.openWindow('/board');
  })());
});
