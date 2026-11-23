/* =====================================================================
   Gerak — semua animasi aplikasi.
   Prinsip: animasi terikat ke "linimasa" per kunci, BUKAN ke elemen DOM.
   - Saat halaman dibuka: kartu masuk bertahap, angka menghitung naik, grafik tergambar.
   - Saat data diperbarui (cache → data segar dari server): animasi yang sedang berjalan
     DILANJUTKAN, bukan diulang dari nol, sehingga tidak ada kedip/lompatan.
   - Saat nilai berubah (ganti rentang, transaksi baru): angka & grafik ber-MORPH
     dari nilai lama ke nilai baru.
   ===================================================================== */
'use strict';
const Gerak = {
  kunjungan: 0, mulai: 0, tadiSkel: false, aksiT: 0, _obs: null,
  data: new Map(),                                   // kunci → linimasa { dari, ke, t0, dur, ... }
  JENDELA: 2500,                                     // lama "fase masuk" setelah pindah halaman (ms)
  diam: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  ease: (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3),
  sekarang: () => performance.now(),
  masukAktif() { const n = this.sekarang() - this.mulai; return n < this.JENDELA || (this.tadiSkel && n < 15000); },
  nilaiKini(st, now) {
    if (now <= st.t0) return st.dari; if (now >= st.t0 + st.dur) return st.ke;
    return st.dari + (st.ke - st.dari) * this.ease((now - st.t0) / st.dur);
  },

  /* Dipanggil router setiap kali isi halaman dibuat ulang */
  pasang(view, halamanBaru) {
    if (halamanBaru) { this.kunjungan++; this.mulai = this.sekarang(); this.data.clear(); this.tadiSkel = false; }
    if (this._obs) this._obs.disconnect();
    this._obs = new MutationObserver((ms) => this.proses(view, ms));
    this._obs.observe(view, { childList: true, subtree: true });
  },

  proses(view, ms) {
    if (!view.isConnected) return;
    const now = this.sekarang(), diam = this.diam(), skelSebelum = this.tadiSkel;
    /* 1. Kartu masuk bertahap — hanya pada fase masuk */
    if (!diam && this.masukAktif()) {
      let urut = 0;
      $$('.card', view).forEach((c, i) => {
        if (c._gerak || c.closest('.modal')) return; c._gerak = 1;
        if (c.children.length && [...c.children].every((x) => x.classList.contains('skel'))) { c._gerak = 0; return; }   // kerangka muat
        const k = 'kartu' + i; let st = this.data.get(k);
        if (!st) { st = { t0: now, d: Math.min(urut++, 9) * 45 }; this.data.set(k, st); }
        const sisa = st.t0 + st.d - now;                // < 0 = animasi sudah berjalan → dilanjutkan dari titik yang sama
        if (sisa + 900 <= 0) return;
        c.style.setProperty('--d', Math.round(sisa) + 'ms'); c.classList.add('masuk');
        setTimeout(() => { c.classList.remove('masuk'); c.style.removeProperty('--d'); }, Math.max(0, sisa) + 950);
      });
    }
    this.tadiSkel = !!view.querySelector('.skel');
    /* 2. Perubahan karena klik pengguna (filter, tab, halaman tabel) → isi baru memudar masuk */
    if (!diam && (now - this.aksiT < 450 || (skelSebelum && now - this.aksiT < 15000))) {   // termasuk isi yang baru tiba dari server setelah kerangka muat
      ms.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1 || n._gerak || n.closest('.chart, .modal') || n.matches('svg, .tip, .chip, .chips, .seg, .card, .bulk-bar, .ck') || n.querySelector('.seg')) return;
        n.classList.add('ganti'); setTimeout(() => n.classList.remove('ganti'), 320);
      }));
    }
    /* 3. Angka (KPI, total, tengah donat): hitung naik saat masuk, morph saat berubah */
    const SEL = '.kpi-val, .big-total .v, .struk-total .v, .donut-center .v, [data-angka]';
    const target = new Set();
    ms.forEach((m) => {
      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const a = t && t.closest && t.closest(SEL); if (a) target.add(a);
      m.addedNodes.forEach((n) => { if (n.nodeType !== 1) return; if (n.matches(SEL)) target.add(n); n.querySelectorAll && n.querySelectorAll(SEL).forEach((x) => target.add(x)); });
    });
    if (target.size) { const semua = $$(SEL, view); target.forEach((el) => { if (el.isConnected && !el.closest('.modal')) this.angka(el, el.id || 'angka' + semua.indexOf(el), diam); }); }
  },

  angka(el, kunci, diam) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let tn = null;
    while (w.nextNode()) { if (/\d/.test(w.currentNode.nodeValue)) { tn = w.currentNode; break; } }
    if (!tn) return;
    const m = tn.nodeValue.match(/^([^\d]*?)(\d{1,3}(?:\.\d{3})+|\d+)(?![\d,])(.*)$/s); if (!m) return;
    const n = +m[2].replace(/\./g, ''); if (!isFinite(n)) return;
    const now = this.sekarang(); let st = this.data.get('n|' + kunci);
    if (!st) { st = { dari: !diam && this.masukAktif() ? 0 : n, ke: n, t0: now, dur: 750 }; this.data.set('n|' + kunci, st); }
    else if (st.ke !== n) { st.dari = this.nilaiKini(st, now); st.ke = n; st.t0 = now; st.dur = 350; }
    if (diam || now >= st.t0 + st.dur || st.dari === st.ke) return;
    const awal = m[1], akhir = m[3], ke = st.ke;
    const langkah = () => {
      if (!tn.isConnected || st.ke !== ke) return;
      const t = this.sekarang();
      tn.nodeValue = awal + fmtNum(Math.round(this.nilaiKini(st, t))) + akhir;
      if (t < st.t0 + st.dur) requestAnimationFrame(langkah); else tn.nodeValue = awal + fmtNum(ke) + akhir;
    };
    langkah();
  },

  /* Linimasa grafik. Mengembalikan cara menggambar:
     - { jenis:'masuk', lewat }  : gambar dengan animasi masuk, mulai dari detik ke-`lewat`
     - { jenis:'morph', st }      : gambar akhir lalu morph dari st.dari ke st.ke
     - { jenis:'diam' }           : gambar akhir tanpa animasi */
  grafik(kunci, ke, lerp, opt = {}) {
    const now = this.sekarang(); let st = this.data.get(kunci);
    const sama = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (this.diam()) { this.data.set(kunci, { kunci, jenis: 'diam', ke, t0: 0, dur: 0, lerp }); return { jenis: 'diam' }; }
    if (!st) {
      if (opt.awal) { st = { kunci, jenis: 'morph', dari: opt.awal, ke, t0: now, dur: opt.durMasuk || 800, lerp }; this.data.set(kunci, st); return { jenis: 'morph', st }; }
      st = { kunci, jenis: 'masuk', ke, t0: now, dur: opt.durMasuk || 900, lerp }; this.data.set(kunci, st); return { jenis: 'masuk', lewat: 0 };
    }
    const lewat = now - st.t0, jalan = lewat < st.dur;
    if (st.jenis === 'masuk' && jalan) { st.ke = ke; return { jenis: 'masuk', lewat }; }
    if (st.jenis === 'morph' && jalan && sama(st.ke, ke)) return { jenis: 'morph', st };
    if (sama(st.ke, ke) && !jalan) return { jenis: 'diam' };
    const dari = st.jenis === 'morph' && jalan ? st.lerp(st.dari, st.ke, this.ease(lewat / st.dur)) : st.ke;
    st = { kunci, jenis: 'morph', dari, ke, t0: now, dur: opt.durMorph || 550, lerp }; this.data.set(kunci, st);
    return { jenis: 'morph', st };
  },
  /* jalankan fungsi gambar per frame sampai linimasa selesai */
  putar(st, svg, gambar) {
    const langkah = () => {
      if (!svg.isConnected || this.data.get(st.kunci) !== st) return;   // grafik sudah diganti / linimasa baru
      const e = this.ease((this.sekarang() - st.t0) / st.dur);
      gambar(st.lerp(st.dari, st.ke, e), e);
      if (e < 1) requestAnimationFrame(langkah);
    };
    langkah();
  },
  /* ubah panjang deret (mis. 7 hari → 30 hari) agar bisa di-morph titik demi titik */
  sampel(arr, n) {
    if (!arr || !arr.length) return new Array(n).fill(0);
    if (arr.length === n) return arr.slice();
    if (n === 1) return [arr[arr.length - 1]];
    return Array.from({ length: n }, (_, i) => { const p = i * (arr.length - 1) / (n - 1), a = Math.floor(p), b = Math.min(arr.length - 1, a + 1); return arr[a] + (arr[b] - arr[a]) * (p - a); });
  },
  /* efek "denyut" kecil, mis. angka jumlah di POS */
  pop(el) { if (!el || this.diam()) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
};
/* klik yang mengganti isi (tab, filter, halaman tabel, segmen) → isi baru memudar masuk */
document.addEventListener('click', (e) => { if (e.target.closest('[data-tab], [data-pg], [data-st], [data-kat], [data-j], [data-r], .seg button, .chips .chip, .tabs-v button')) Gerak.aksiT = Gerak.sekarang(); }, true);
