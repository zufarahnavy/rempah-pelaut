/* Service worker: cangkang aplikasi tersedia offline (PWA).
   - Halaman, CSS & JS: ambil dari jaringan dulu (versi terbaru langsung terpakai setelah update),
     salinan cache hanya dipakai saat offline.
   - Gambar di assets/: cache dulu (jarang berubah).
   - Permintaan ke Apps Script (lintas domain) tidak disentuh — antrean offline diurus js/core.js. */
const VERSI = 'rp-1.1.0';
const CANGKANG = ['./', 'index.html', 'verify.html', 'css/style.css?v=1.1.0', 'js/config.js?v=1.1.0', 'js/core.js?v=1.1.0', 'js/charts.js?v=1.1.0', 'js/qr.js?v=1.1.0', 'js/app.js?v=1.1.0', 'js/pages-kasir.js?v=1.1.0', 'js/pages-owner.js?v=1.1.0', 'js/pages-gudang.js?v=1.1.0', 'js/pages-admin.js?v=1.1.0', 'assets/logo.svg', 'assets/img/menu/default.svg', 'assets/img/bahan/default.svg', 'assets/img/aset/lainnya.svg', 'manifest.webmanifest'];
/* satu berkas gagal (mis. 404) tidak boleh menggagalkan seluruh pemasangan */
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSI).then((c) => Promise.all(CANGKANG.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSI).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const simpan = (req, res) => { if (res && res.ok) { const c = res.clone(); caches.open(VERSI).then((ca) => ca.put(req, c)); } return res; };
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\/assets\//.test(u.pathname)) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => simpan(e.request, r))));
    return;
  }
  e.respondWith(fetch(e.request).then((r) => simpan(e.request, r)).catch(() => caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then((r) => r || (e.request.mode === 'navigate' ? caches.match('index.html') : undefined))));
});
