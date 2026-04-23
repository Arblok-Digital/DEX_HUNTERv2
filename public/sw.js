const CACHE_NAME = 'dex-hunter-v2-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/chart.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Network first, falling back to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});