/* Service worker: cangkang aplikasi tersedia offline (PWA).
   Permintaan ke Apps Script (lintas domain) tidak disentuh — antrean offline diurus js/core.js. */
const VERSI = 'rp-1.0.0';
const CANGKANG = ['./', 'index.html', 'verify.html', 'css/style.css?v=1.0.0', 'js/config.js?v=1.0.0', 'js/core.js?v=1.0.0', 'js/charts.js?v=1.0.0', 'js/qr.js?v=1.0.0', 'js/app.js?v=1.0.0', 'js/pages-kasir.js?v=1.0.0', 'js/pages-owner.js?v=1.0.0', 'js/pages-gudang.js?v=1.0.0', 'js/pages-admin.js?v=1.0.0', 'assets/logo.svg', 'assets/kompas.svg', 'assets/ilustrasi-cangkir.svg', 'assets/img/menu/default.svg', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSI).then((c) => c.addAll(CANGKANG)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSI).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSI).then((ca) => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok && /\/assets\//.test(u.pathname)) { const c = r.clone(); caches.open(VERSI).then((ca) => ca.put(e.request, c)); } return r; })));
});
