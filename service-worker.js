// Service Worker for Hanny Montany Studio PWA
const CACHE_NAME = 'blur-mosaic-v23';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy: always fetch fresh assets, fallback to cache only when completely offline
self.addEventListener('fetch', (e) => {
  // Only intercept GET requests with http/https schemes
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(e.request, clone))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
