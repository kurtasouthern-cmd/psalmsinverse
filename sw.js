// Psalms in Verse: offline support. Pages and images are cached; videos stream online.
const CACHE = 'piv-v2';
const CORE = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png',
  '/videos/psalm-1.jpg', '/videos/psalm-2.jpg', '/videos/psalm-3.jpg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range') || /\.mp4$/.test(new URL(req.url).pathname)) return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    // newest page when online, saved copy when offline
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('/index.html', c)); return r; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  // images, fonts, icons: saved copy first, refreshed in the background
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
