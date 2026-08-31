const CACHE_NAME = 'lunch365-web-v5';
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './logo-lunch365.png',
  './menu-01-calentado-paisa.jpg',
  './menu-02-huevos-rancheros.jpg',
  './menu-03-boyacense.jpg',
  './menu-05-calentado-opita.jpg',
  './menu-07-arroz-oriental.jpg',
  './menu-08-huevos-pericos.jpg',
  './menu-09-churrasco-cerdo.jpg',
  './menu-15-bandeja-paisa.jpg',
  './menu-21-chop-suey.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
