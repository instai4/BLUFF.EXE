const CACHE = 'bluff-cache-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/game.css',
  '/js/game.js',
  '/js/voice.js',
  '/js/avatars.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});