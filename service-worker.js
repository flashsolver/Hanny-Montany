// Service Worker for Hanny Montany Studio PWA
// 100% Offline-First Architecture

const CACHE_NAME = 'hanny-montany-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/canvas-engine.js',
  './js/filters.js',
  './js/brush-engine.js',
  './js/sticker-engine.js',
  './js/ai-tools.js',
  './js/modal-manager.js',
  './js/manual-data.js',
  './js/sample-images.js',
  './js/sw-register.js',
  './images/logo.webp',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/realistic-person.webp',
  './images/sample-cat.webp',
  './images/sample-horse.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only intercept GET requests with http/https schemes
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  // Handle navigation requests (HTML pages / offline fallback)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const match = await caches.match(e.request, { ignoreSearch: true });
          if (match) return match;
          const indexFallback = await caches.match('./index.html', { ignoreSearch: true });
          return indexFallback || caches.match('./', { ignoreSearch: true });
        })
    );
    return;
  }

  // Cache-first with network revalidation for all static assets
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
