const CACHE = 'arise-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Notifiche push (promemoria missioni): mostrate anche ad app chiusa.
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data ? e.data.json() : {}
  } catch {
    data = { body: e.data?.text() }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'ARISE', {
      body: data.body || 'Completa le missioni giornaliere, Hunter.',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((ws) => (ws[0] ? ws[0].focus() : self.clients.openWindow('./'))),
  )
})

// Network-first con fallback alla cache: l'app resta usabile offline
// ma prende subito gli aggiornamenti quando c'è rete.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(e.request, { ignoreSearch: false }).then((m) => m || caches.match('./index.html'))),
  )
})
