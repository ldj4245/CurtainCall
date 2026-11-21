// Cache only public static assets. Never cache API responses or record documents.
const CACHE = 'curtaincall-static-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(Promise.all([
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('curtaincall-static-') && k !== CACHE).map(k => caches.delete(k)))),
  self.clients.claim(),
])))
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/assets/') || !/\.(js|css|woff2?)$/.test(url.pathname)) return
  event.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(event.request)
    if (saved) return saved
    const response = await fetch(event.request)
    if (response.ok) await cache.put(event.request, response.clone())
    return response
  }))
})
