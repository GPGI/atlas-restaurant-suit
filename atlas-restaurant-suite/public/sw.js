// Service Worker for offline support
const CACHE_NAME = 'atlas-house-v1';
const urlsToCache = [
  '/',
  '/menu',
  '/index.html',
  '/src/main.tsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
