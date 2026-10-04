// Misbahly service worker: offline shell + notification clicks.
const CACHE = 'misbahly-v1'
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/icon.svg']).catch(() => undefined))) })
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(
    fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  )
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => (list.length ? list[0].focus() : self.clients.openWindow('/'))))
})
