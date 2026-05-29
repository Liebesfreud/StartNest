const VERSION = 'startnest-static-v5'
const RUNTIME_CACHE = `runtime-${VERSION}`
const ICON_CACHE = `icons-${VERSION}`
const FONT_CACHE = `fonts-${VERSION}`
const PRECACHE_URLS = ['/', '/index.html']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil((async () => {
    const cache = await caches.open(RUNTIME_CACHE)
    await Promise.all(PRECACHE_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { credentials: 'same-origin' })
        if (response.ok) {
          await cache.put(url, response)
        }
      } catch {}
    }))
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => ![RUNTIME_CACHE, ICON_CACHE, FONT_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )
    await self.clients.claim()
  })())
})

function isGoogleFont(url) {
  return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com'
}

function isIconRequest(url) {
  return url.origin === self.location.origin && url.pathname === '/api/icon'
}

function isStaticAssetRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/assets/')
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        void cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    void networkPromise
    return cached
  }

  const response = await networkPromise
  if (response) return response
  throw new Error('Network unavailable')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (isIconRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, ICON_CACHE))
    return
  }

  if (request.mode === 'navigate' || isStaticAssetRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }

  if (isGoogleFont(url)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE))
  }
})
