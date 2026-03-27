/* ═══════════════════════════════════════════════
   ERP Readiness Evaluator — Service Worker
   Caches all assets for full offline operation
   ═══════════════════════════════════════════════ */

const CACHE = 'erp-eval-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/ios-install.html',
  '/style.css',
  '/app.js',
  '/jspdf.min.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icons/apple-touch-icon.png',
  '/apple-icons/apple-touch-icon-120.png',
  '/apple-icons/apple-touch-icon-152.png',
  '/apple-icons/apple-touch-icon-167.png',
  '/apple-icons/apple-touch-icon-180.png',
];

// Install: cache everything
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        // Offline fallback for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
