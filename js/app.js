/* =====================================================================
   app.js — Store, login PIN, kerangka aplikasi, router, pencarian, notifikasi
   ===================================================================== */
'use strict';
const Pages = {};
const Store = {
  me: null, perm: [], aturan: {}, app: null, opsi: {}, menu: [], hariIni: null, notif: [], dashboard: null, demo: false, modul: [],
  set(d) {
    ['me', 'perm', 'aturan', 'app', 'opsi', 'menu', 'hariIni', 'notif', 'dashboard', 'demo', 'modul', 'serverHariIni'].forEach((k) => { if (d[k] !== undefined) this[k] = d[k]; });
    try { localStorage.setItem('rp:boot', JSON.stringify({ me: this.me, perm: this.perm, aturan: this.aturan, app: this.app, opsi: this.opsi, menu: this.menu, hariIni: this.hariIni, notif: this.notif, dashboard: this.dashboard, demo: this.demo, modul: this.modul, t: Date.now() })); } catch (e) { }
    if (d.app) terapkanTema(d.app);
  },
  punya(p) { return this.perm.indexOf(p) > -1; },
  owner() { return this.me && this.me.peran === 'OWNER'; }
};

/* Parameter kanonik (halaman & prefetch memakai kunci cache yang sama) */
const Param = {
  analitik: (preset = '30') => { const s = hariIni(); if (preset === 'bulan') return { dari: awalBulan(s), sampai: s }; const n = +preset || 30; return { dari: addDays(s, -(n - 1)), sampai: s }; },
  rekap: () => ({ dari: awalBulan(), sampai: hariIni() }),
  bulan30: () => ({ dari: addDays(hariIni(), -29), sampai: hariIni() }),
  minggu: () => ({ dari: addDays(hariIni(), -6), sampai: hariIni() })
};

const NAV = [
  { grp: 'Utama', items: [{ k: 'beranda', l: 'Beranda Kasir', i: 'home' }, { k: 'dashboard', l: 'Dashboard', i: 'grid' }, { k: 'analitik', l: 'Analitik Penjualan', i: 'chart' }] },
  { grp: 'Kasir Lapak', items: [{ k: 'pos', l: 'Penjualan (POS)', i: 'pos' }, { k: 'biaya', l: 'Pengeluaran Lapak', i: 'receipt' }, { k: 'closing', l: 'Daily Closing', i: 'lock' }] },
  { grp: 'Gudang & Kas', items: [{ k: 'belanja', l: 'Belanja Bahan', i: 'bag' }, { k: 'stok', l: 'Stok & Opname', i: 'box' }, { k: 'aset', l: 'Aset & Inventaris', i: 'stall' }, { k: 'rekap', l: 'Rekap Kas', i: 'book' }, { k: 'laporan', l: 'Laporan & Unduh', i: 'file' }] },
  { grp: 'Administrasi', items: [{ k: 'dokumen', l: 'Dokumen Resmi', i: 'doc' }, { k: 'menu', l: 'Master Menu', i: 'cup' }, { k: 'pengguna', l: 'Pengguna & PIN', i: 'users' }, { k: 'pengaturan', l: 'Pengaturan', i: 'settings' }] }
];
const bolehNav = (k) => !!Pages[k] && (Pages[k].izin ? Pages[k].izin() : Store.punya(k));
const navItem = (k) => { for (const g of NAV) for (const i of g.items) if (i.k === k) return i; return null; };

const App = {
  cur: null, cleanup: null,
  async init() {
    const boot = $('#boot-screen'); if (boot) setTimeout(() => { boot.classList.add('hide'); setTimeout(() => boot.remove(), 600); }, 250);
    if (!API.siap()) return this.layarKonfigurasi();
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('net', () => this.updateNet());
    document.addEventListener('antrean', () => this.updateBanner());
    addEventListener('keydown', (e) => { if (e.key === 'F2' && API.token && Store.punya('pos')) { e.preventDefault(); location.hash = '#/pos'; } });
    const cached = (() => { try { return JSON.parse(localStorage.getItem('rp:boot') || 'null'); } catch (e) { return null; } })();
    if (API.token && cached && cached.me) {
      Store.set(cached); this.shell(); this.route();
      this.segarkanBoot();
    } else if (API.token) {
      Loader.show('Membuka aplikasi…', 'Memuat data lapak');
      const ok = await this.segarkanBoot(); Loader.hide();
      if (ok) { this.shell(); this.route(); } else this.login();
    } else this.login();
  },
  async segarkanBoot() {
    try {
      const r = await API.call('boot', {});
      if (r.success) {
        const lamaPerm = JSON.stringify(Store.perm), lamaApp = JSON.stringify(Store.app);
        Store.set(r.data);
        if ($('.app')) { if (lamaPerm !== JSON.stringify(Store.perm) || lamaApp !== JSON.stringify(Store.app)) { this.shell(); this.route(); } else { this.updateNotif(); document.dispatchEvent(new CustomEvent('boot')); } }
        if (r.data.me && r.data.me.wajibGanti) setTimeout(() => this.gantiPin(true), 400);
        this.prefetch();
        Antrean.sinkron({ diam: true });
        return true;
      }
      return false;
    } catch (e) { if ($('.app')) this.updateNet(); return !!Store.me; }
  },
  async muatHariIni() {
    try { const r = await API.call('hariIni', { _fresh: true }); if (r.success) { Store.hariIni = r.data; Store.set({ hariIni: r.data }); document.dispatchEvent(new CustomEvent('hariIni')); } } catch (e) { }
  },
  prefetch() {
    const p = Store.punya.bind(Store), L = [];
    if (p('stok') || p('belanja')) L.push(['stok.list', {}]);
    if (p('aset')) L.push(['aset.list', {}]);
    if (p('menu')) L.push(['menu.list', {}]);
    if (p('rekap')) L.push(['rekap.list', Param.rekap()]);
    if (p('belanja')) L.push(['belanja.list', Param.bulan30()]);
    if (p('analitik')) L.push(['analitik', Param.analitik('30')]);
    if (p('biaya')) L.push(['biaya.list', Param.bulan30()]);
    if (p('dokumen') || Store.aturan.ajukanDokumen) { L.push(['de.dokumen.list', {}]); L.push(['de.template.list', {}]); }
    if (p('closing')) L.push(['closing.status', { tanggal: hariIni() }]);
    if (p('pengguna')) L.push(['pengguna.list', {}]);
    const jalan = () => prefetch(L);
    if ('requestIdleCallback' in window) requestIdleCallback(jalan, { timeout: 2500 }); else setTimeout(jalan, 800);
  },

  /* ---------------- Layar konfigurasi (URL /exec belum diisi) ---------------- */
  layarKonfigurasi() {
    document.body.innerHTML = `<div class="login"><div class="card login-card" style="max-width:560px"><div class="icon-box warning" style="margin:0 auto 14px">${ic('settings')}</div><h1>Konfigurasi belum lengkap</h1><p class="muted center mt-8">Isi alamat Web App Google Apps Script (berakhiran <code>/exec</code>) di berkas <b>js/config.js</b>, lalu unggah ulang ke GitHub Pages.</p><div class="formula mt-16">window.APP_CONFIG = {<br>&nbsp;&nbsp;GAS_URL: 'https://script.google.com/macros/s/ID_DEPLOYMENT/exec'<br>};</div><p class="muted small center mt-16">Panduan lengkap ada di PANDUAN-INSTALASI.md</p></div></div>`;
  },

  /* ---------------- Login PIN ---------------- */
  async login() {
    API.warm('pub');
    document.body.classList.remove('in-app');
    let pub = null; try { pub = JSON.parse(localStorage.getItem('rp:pub') || 'null'); } catch (e) { }
    const root = document.createElement('div');
    document.body.innerHTML = ''; document.body.appendChild(root);
    document.body.insertAdjacentHTML('beforeend', '<div id="topline" class="topline"></div><div id="toasts" class="toasts"></div>');
    let pilih = localStorage.getItem('rp:lastUser') || '';
    const gambar = (p) => {
      const app = (p && p.app) || Store.app || { nama: 'Minuman Rempah Pelaut', subjudul: 'Management System & Kasir Lapak', tagline: 'Mencari Rezeki dengan Hidup Sehat', lokasiSingkat: 'Bugis, Tj. Redeb, Berau, Kaltim' };
      if (p && p.app) terapkanTema(p.app);
      const users = (p && p.pengguna) || [];
      if (!users.some((u) => u.id === pilih)) pilih = users[0] ? users[0].id : '';
      const demo = p && p.demo && p.demoPin ? p.demoPin.find((d) => d.id === pilih) : null;
      root.innerHTML = `<div class="login">
        <div class="login-top">
          <div class="row"><div class="icon-box" style="border-radius:50%">${ic('compass')}</div><div><div class="eyebrow" style="color:var(--c-secondary)">${esc(app.nama)}</div><div class="small muted row gap-4">${ic('pin', 'sm')}${esc(app.lokasiSingkat || '')}</div></div></div>
          <div class="row gap-8"><span class="badge ${Net.up ? 'success' : 'danger'} pulse" id="net-badge">${Net.up ? 'Online • Siap Kasir' : 'Offline'}</span><button class="btn sm" id="btn-sim">${ic(Net.sim ? 'wifi-off' : 'wifi', 'sm')}Simulasi Jaringan</button></div>
        </div>
        <div class="card login-card">
          <div class="login-logo"><img src="${esc(app.logo || 'assets/logo.svg')}" alt="Logo" onerror="this.src='assets/logo.svg'"><span class="anchor">${ic('anchor', 'sm')}</span></div>
          <h1>${esc(app.nama)}</h1>
          <p class="center muted mt-4">${esc(app.subjudul || '')}</p>
          <span class="tag">"${esc(app.tagline || '')}"</span>
          <div class="mt-20"><div class="lbl mb-8"><span class="row gap-8">${ic('users1', 'sm')}Pilih Pengguna Masuk</span></div>
            <div class="user-pick" id="up">${users.length ? users.map((u) => `<button type="button" data-u="${esc(u.id)}" class="${u.id === pilih ? 'on' : ''}"><span class="avatar s">${esc(u.inisial)}</span><span class="nm">${esc(u.nama)}</span><span class="rl">${esc(u.labelPeran)}</span></button>`).join('') : '<div class="skel h-36" style="flex:1"></div><div class="skel h-36" style="flex:1"></div>'}</div>
          </div>
          <div class="center mt-12 lbl" style="justify-content:center"><span class="row gap-8">${ic('lock', 'sm')}Masukkan 6 Digit PIN Pribadi</span></div>
          <div class="pin-dots"></div>
          ${pinPadHTML()}
          <button class="btn primary lg block mt-20" id="btn-masuk">${ic('login')}Masuk ke Sistem</button>
          ${demo ? `<div class="demo-hint"><span class="row gap-8">${ic('info', 'sm')}Mode demo — PIN ${esc(demo.nama.split(' ')[0])}: <b class="tnum">${esc(demo.pin)}</b></span><button class="link-btn" id="isi-demo">Isi otomatis</button></div>` : ''}
        </div>
        <div class="login-foot"><span>${esc(app.nama)} v${esc(app.versi || '1.0')}</span><span>${esc(app.lokasi || '')}</span><span class="row gap-4">${ic('shield', 'sm')}Serverless PWA (Google Sheets)</span></div>
      </div>`;
      $$('#up button', root).forEach((b) => b.onclick = () => { pilih = b.dataset.u; localStorage.setItem('rp:lastUser', pilih); gambar(p); });
      $('#btn-sim', root).onclick = () => { Net.set(!Net.sim); gambar(p); toast(Net.sim ? 'Simulasi offline aktif — aplikasi berperilaku seperti tanpa sinyal.' : 'Simulasi offline dimatikan.', 'info'); };
      const pad = pasangPinPad(root, (pin) => masuk(pin, pad));
      $('#btn-masuk', root).onclick = () => masuk(pad.get(), pad);
      const isi = $('#isi-demo', root); if (isi) isi.onclick = () => { let i = 0; const t = setInterval(() => { const b = $(`.pin-pad [data-k="${demo.pin[i]}"]`, root); b && b.click(); if (++i >= 6) clearInterval(t); }, 90); };
    };
    const masuk = async (pin, pad) => {
      if (!pilih) return toast('Pilih pengguna terlebih dahulu.', 'warning');
      if (!/^\d{6}$/.test(pin)) return toast('PIN harus 6 digit.', 'warning');
      if (!Net.up) { pad.reset(true); return toast('Login pertama membutuhkan koneksi internet.', 'error', 'Offline'); }
      Loader.show('Memverifikasi PIN…', 'Membuka buku kas lapak');
      try {
        const r = await API.raw('auth.login', { idUser: pilih, pin });
        if (!r.success) { Loader.hide(); pad.reset(true); return toast(r.message, 'error', r.code === 'LOCKED' ? 'Akun terkunci' : 'Gagal masuk'); }
        API.setToken(r.data.token); Cache.hapusSemua(); Store.set(r.data);
        await Loader.sukses(r.message);
        this.shell(); location.hash = '#/' + this.beranda(); this.route();
        if (r.data.me.wajibGanti) setTimeout(() => this.gantiPin(true), 500);
        this.prefetch(); API.warm('app'); Antrean.sinkron({ diam: true });
      } catch (e) { Loader.hide(); pad.reset(true); toast(e.message, 'error'); }
    };
    gambar(pub);
    try {
      const r = await API.raw('publik.boot', {});
      if (r.success) { localStorage.setItem('rp:pub', JSON.stringify(r.data)); pub = r.data; gambar(pub); }
    } catch (e) { if (!pub) toast('Tidak dapat menghubungi server. Periksa koneksi.', 'error'); }
  },
  beranda() { return Store.punya('dashboard') ? 'dashboard' : Store.punya('beranda') ? 'beranda' : (Store.perm[0] || 'pos'); },
  sesiHabis() {
    if (!API.token) return;
    API.setToken(''); Cache.hapusSemua(); toast('Sesi berakhir. Silakan masuk kembali.', 'warning'); this.login();
  },
  async keluar() {
    if (Antrean.list().length && !(await konfirmasi({ title: 'Masih ada data offline', text: 'Ada ' + Antrean.list().length + ' transaksi belum terkirim. Jika keluar, data tetap tersimpan di perangkat ini dan dikirim saat login berikutnya.', ok: 'Tetap keluar' }))) return;
    API.call('auth.logout', {}).catch(() => { });
    API.setToken(''); Cache.hapusSemua(); Store.me = null; location.hash = ''; this.login();
  },

  /* ---------------- Kerangka aplikasi ---------------- */
  shell() {
    const me = Store.me, app = Store.app || {};
    document.body.classList.add('in-app');
    const nav = NAV.map((g) => { const it = g.items.filter((i) => bolehNav(i.k)); return it.length ? `<div class="grp">${g.grp}</div>` + it.map((i) => `<a href="#/${i.k}" data-nav="${i.k}">${ic(i.i)}<span>${i.l}</span>${i.k === 'closing' || i.k === 'stok' || i.k === 'dokumen' ? `<span class="cnt hidden" data-cnt="${i.k}"></span>` : ''}</a>`).join('') : ''; }).join('');
    const prio = Store.owner() ? ['dashboard', 'pos', 'analitik', 'rekap'] : ['beranda', 'pos', 'biaya', 'closing'];
    const bawah = prio.filter((k) => Store.punya(k)).slice(0, 4);
    document.body.innerHTML = `<div id="topline" class="topline"></div><div id="toasts" class="toasts"></div>
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><img class="logo" src="${esc(app.logo || 'assets/logo.svg')}" alt="" onerror="this.src='assets/logo.svg'"><div><div class="nm">${esc(app.singkat || app.nama)}</div><div class="sb">Lapak Management System</div></div></div>
        <div class="lapak-card"><div class="icon-box s">${ic('stall', 'sm')}</div><div class="grow"><b>${esc(app.lapak || '')}</b><div class="muted xs truncate">${esc(app.lokasiSingkat || '')}</div></div></div>
        <nav class="nav" id="nav">${nav}</nav>
        <div class="foot">
          <div class="net-chip" id="net-chip" title="Ketuk untuk simulasi offline"><span class="row gap-8"><i class="dot"></i><span id="net-lbl">Sistem Online</span></span><span>${esc(app.zona || 'WITA')}</span></div>
        </div>
      </aside>
      <div class="main">
        <div id="banner"></div>
        <header class="topbar">
          <button class="btn ghost icon-only burger" id="burger" aria-label="Menu">${ic('menu')}</button>
          <div class="search pos-rel" id="gsearch">${ic('search')}<input class="input" placeholder="Cari menu, transaksi, nota, bahan, aset…" aria-label="Pencarian"></div>
          <div class="grow"></div>
          ${Store.demo ? `<a class="badge warning hide-m" href="#/pengaturan?tab=data" title="Data demo aktif">Mode Demo</a>` : ''}
          ${Store.punya('pos') ? `<a class="btn primary hide-m" href="#/pos">${ic('plus')}Transaksi Baru <span class="kbd">F2</span></a>` : ''}
          ${Store.punya('belanja') ? `<a class="btn hide-m" href="#/belanja">${ic('bag')}Rekam Belanja</a>` : ''}
          <div class="pos-rel"><button class="btn ghost icon-only bell" id="bell" aria-label="Notifikasi">${ic('bell')}<span class="cnt hidden" id="bell-cnt"></span></button></div>
          <div class="pos-rel"><div class="who" id="who"><span class="avatar">${esc(me.inisial)}</span><div><div class="nm">${esc(me.nama)}</div><div class="rl">${esc(me.labelPeran)}</div></div>${ic('chev-d', 'sm hide-m')}</div></div>
        </header>
        <main class="content" id="view"></main>
        <footer class="foot-bar"><span>© ${new Date().getFullYear()} ${esc(app.nama)} • ${esc(app.lokasi || '')}</span><span>Koneksi: <b id="foot-net" class="ok">Online GAS</b> • Versi ${esc(app.versi || '1.0.0')}</span></footer>
      </div>
    </div>
    <nav class="bottom-nav" id="bnav">${bawah.map((k) => { const n = navItem(k); return `<a href="#/${k}" data-nav="${k}">${ic(n.i)}<span>${({ pos: 'Kasir', closing: 'Closing', biaya: 'Pengeluaran', laporan: 'Laporan', dokumen: 'Dokumen' })[k] || n.l.split(' ')[0]}</span></a>`; }).join('')}<a href="#" id="bnav-more">${ic('grid')}<span>Menu</span><span class="cnt hidden" id="bnav-cnt"></span></a></nav>
    ${Store.punya('pos') ? `<button class="fab" id="fab" aria-label="Transaksi baru">${ic('plus', 'lg')}</button>` : ''}`;
    $('#burger').onclick = () => this.drawer(true);
    $('#bnav-more').onclick = (e) => { e.preventDefault(); this.menuSheet(); };
    $('#fab') && ($('#fab').onclick = () => { location.hash = '#/pos'; });
    $('#net-chip').onclick = () => { Net.set(!Net.sim); toast(Net.sim ? 'Simulasi offline aktif.' : 'Simulasi offline dimatikan — kembali online.', 'info'); };
    $('#who').onclick = (e) => { e.stopPropagation(); this.userMenu(); };
    $('#bell').onclick = (e) => { e.stopPropagation(); this.notifMenu(); };
    document.addEventListener('click', () => { $$('.dropdown, .search-res').forEach((d) => d.remove()); });
    this.pasangCari();
    this.updateNet(); this.updateBanner(); this.updateNotif();
  },
  drawer(buka) {
    const sb = $('#sidebar'); if (!sb) return;
    sb.classList.toggle('open', buka);
    $('.scrim') && $('.scrim').remove();
    if (buka) { const s = document.createElement('div'); s.className = 'scrim'; s.onclick = () => this.drawer(false); document.body.appendChild(s); }
  },
  menuSheet() {
    const items = []; NAV.forEach((g) => g.items.forEach((i) => { if (bolehNav(i.k)) items.push(i); }));
    const m = Modal.open({ title: 'Semua Menu', sub: esc(Store.me.nama) + ' • ' + esc(Store.me.labelPeran), body: `<div class="sheet-menu"><div class="grid-menu">${items.map((i) => `<a href="#/${i.k}" class="${this.cur === i.k ? 'on' : ''}">${ic(i.i, 'lg')}${i.l}</a>`).join('')}</div><div class="row mt-16 gap-8"><button class="btn block" data-pin>${ic('key')}Ganti PIN</button><button class="btn danger block" data-out>${ic('logout')}Keluar</button></div></div>` });
    $$('a', m.el).forEach((a) => a.addEventListener('click', () => m.close()));
    $('[data-pin]', m.el).onclick = () => { m.close(); this.gantiPin(); };
    $('[data-out]', m.el).onclick = () => { m.close(); this.keluar(); };
  },
  userMenu() {
    $$('.dropdown').forEach((d) => d.remove());
    const d = document.createElement('div'); d.className = 'dropdown'; d.style.width = '260px';
    d.innerHTML = `<div class="li"><span class="avatar">${esc(Store.me.inisial)}</span><div><div class="t">${esc(Store.me.nama)}</div><div class="s">${esc(Store.me.labelPeran)}${Store.me.jabatan ? ' • ' + esc(Store.me.jabatan) : ''}</div></div></div><hr class="divider" style="margin:6px 0"><button class="btn ghost block" style="justify-content:flex-start" data-a="pin">${ic('key')}Ganti PIN Saya</button>${Store.owner() ? `<a class="btn ghost block" style="justify-content:flex-start" href="#/pengaturan">${ic('settings')}Pengaturan Aplikasi</a>` : ''}<button class="btn ghost block" style="justify-content:flex-start" data-a="refresh">${ic('refresh')}Muat Ulang Data</button><button class="btn ghost block" style="justify-content:flex-start;color:var(--c-danger)" data-a="out">${ic('logout')}Keluar</button>`;
    $('#who').parentElement.appendChild(d);
    d.onclick = (e) => { e.stopPropagation(); const a = e.target.closest('[data-a]'); if (!a) return; d.remove(); if (a.dataset.a === 'pin') this.gantiPin(); if (a.dataset.a === 'out') this.keluar(); if (a.dataset.a === 'refresh') { Cache.basi(); this.segarkanBoot().then(() => this.route()); toast('Data dimuat ulang dari server.', 'success'); } };
  },
  notifMenu() {
    $$('.dropdown').forEach((d) => d.remove());
    const q = Antrean.list(), g = JSON.parse(localStorage.getItem('rp:qgagal') || '[]');
    const list = [].concat(q.length ? [{ level: 'warning', judul: q.length + ' data offline menunggu sinkron', isi: 'Ketuk untuk mengirim sekarang.', aksi: 'sync' }] : [], g.length ? [{ level: 'danger', judul: g.length + ' data offline ditolak server', isi: g[0].galat || '', aksi: 'gagal' }] : [], Store.notif || []);
    const d = document.createElement('div'); d.className = 'dropdown';
    d.innerHTML = `<div class="row between" style="padding:6px 8px 10px"><h3>Notifikasi</h3><span class="badge plain">${list.length}</span></div>` + (list.length ? list.map((n, i) => `<a class="li" href="${esc(n.link || '#')}" data-i="${i}"><div class="icon-box s ${n.level === 'danger' ? 'danger' : n.level === 'warning' ? 'warning' : 'info'}">${ic(n.jenis === 'stok' ? 'box' : n.jenis === 'closing' ? 'lock' : n.jenis === 'dokumen' ? 'doc' : 'alert', 'sm')}</div><div class="grow"><div class="t">${esc(n.judul)}</div><div class="s">${esc(n.isi)}</div></div></a>`).join('') : kosongHTML('Semua beres — tidak ada notifikasi.', 'check-c'));
    $('#bell').parentElement.appendChild(d);
    d.onclick = (e) => { e.stopPropagation(); const a = e.target.closest('[data-i]'); if (!a) return; const n = list[+a.dataset.i]; if (n.aksi === 'sync') { e.preventDefault(); Antrean.sinkron(); } if (n.aksi === 'gagal') { e.preventDefault(); this.lihatGagal(); } d.remove(); };
  },
  lihatGagal() {
    const g = JSON.parse(localStorage.getItem('rp:qgagal') || '[]');
    const m = Modal.open({ title: 'Data offline yang ditolak server', sub: 'Biasanya karena tanggal sudah di-closing. Catat ulang secara manual bila perlu.', size: 'lg', body: `<table class="tbl cards"><thead><tr><th>Data</th><th>Waktu</th><th>Alasan</th></tr></thead><tbody>${g.map((x) => `<tr><td data-l="Data">${esc(x.label)} <span class="id">${esc(x.data.id || '')}</span></td><td data-l="Waktu">${esc(new Date(x.t).toLocaleString('id-ID'))}</td><td data-l="Alasan" class="bad">${esc(x.galat || '')}</td></tr>`).join('')}</tbody></table>`, foot: '<button class="btn danger" data-h>Hapus daftar</button><button class="btn" data-x2>Tutup</button>' });
    $('[data-h]', m.el).onclick = () => { localStorage.removeItem('rp:qgagal'); m.close(); this.updateNotif(); };
    $('[data-x2]', m.el).onclick = () => m.close();
  },
  updateNet() {
    const up = Net.up;
    const chip = $('#net-chip'); if (chip) { chip.classList.toggle('off', !up); $('#net-lbl').textContent = up ? 'Sistem Online' : Net.sim ? 'Simulasi Offline' : 'Offline'; }
    const f = $('#foot-net'); if (f) { f.textContent = up ? 'Online GAS' : 'Offline'; f.className = up ? 'ok' : 'bad'; }
    const nb = $('#net-badge'); if (nb) { nb.className = 'badge pulse ' + (up ? 'success' : 'danger'); nb.textContent = up ? 'Online • Siap Kasir' : 'Offline'; }
    this.updateBanner();
    if (up) Antrean.sinkron({ diam: true });
  },
  updateBanner() {
    const b = $('#banner'); if (!b) return;
    const q = Antrean.list().length;
    if (q) b.innerHTML = `<div class="banner">${ic('alert', 'sm')}<div class="grow"><b>Mode Lapak ${esc((Store.app || {}).kota || '')}:</b> Ada ${q} transaksi offline tersimpan di memori perangkat.</div>${Net.up ? `<button class="btn xs primary" id="sync-now">${Antrean.busy ? '<span class="spin"></span>' : ic('refresh', 'sm')}Sinkronkan Sekarang</button>` : '<span class="badge danger">Menunggu sinyal</span>'}</div>`;
    else if (!Net.up) b.innerHTML = `<div class="banner">${ic('wifi-off', 'sm')}<div class="grow"><b>Anda sedang offline.</b> Penjualan & biaya tetap bisa dicatat — otomatis dikirim saat sinyal kembali.</div></div>`;
    else b.innerHTML = '';
    const s = $('#sync-now'); if (s) s.onclick = () => Antrean.sinkron();
    this.updateNotif();
  },
  updateNotif() {
    const n = (Store.notif || []).length + (Antrean.list().length ? 1 : 0);
    const c = $('#bell-cnt'); if (c) { c.textContent = n; c.classList.toggle('hidden', !n); }
    const bc = $('#bnav-cnt'); if (bc) { bc.textContent = n; bc.classList.toggle('hidden', !n); }
    const hit = { closing: (Store.notif || []).filter((x) => x.jenis === 'closing').length, stok: (Store.notif || []).filter((x) => x.jenis === 'stok').length, dokumen: (Store.notif || []).filter((x) => x.jenis === 'dokumen').length };
    Object.keys(hit).forEach((k) => { const e = $(`[data-cnt="${k}"]`); if (e) { e.textContent = hit[k]; e.classList.toggle('hidden', !hit[k]); } });
  },

  /* ---------------- Pencarian global ---------------- */
  pasangCari() {
    const box = $('#gsearch'), inp = $('input', box);
    const tutup = () => { const r = $('.search-res', box); r && r.remove(); };
    inp.addEventListener('click', (e) => e.stopPropagation());
    inp.addEventListener('input', debounce(() => {
      tutup(); const q = inp.value.trim().toLowerCase(); if (q.length < 2) return;
      const hasil = [];
      NAV.forEach((g) => g.items.forEach((i) => { if (bolehNav(i.k) && i.l.toLowerCase().includes(q)) hasil.push({ g: 'Halaman', t: i.l, s: 'Buka menu', ic: i.i, href: '#/' + i.k }); }));
      (Store.menu || []).forEach((m) => { if (m.nama.toLowerCase().includes(q)) hasil.push({ g: 'Menu Rempah', t: m.nama, s: rp(m.harga) + ' • ' + m.kategori, img: m.foto, href: Store.punya('pos') ? '#/pos?tambah=' + m.id : '#/menu' }); });
      ((Store.hariIni || {}).trx || []).forEach((t) => { if ((t.id + ' ' + t.items.map((x) => x.nama).join(' ') + ' ' + t.catatan).toLowerCase().includes(q)) hasil.push({ g: 'Transaksi Hari Ini', t: t.id, s: t.jam + ' • ' + t.cup + ' cup • ' + rp(t.masuk), ic: 'receipt', href: '#/pos' }); });
      const stok = Cache.get(Cache.key('stok.list', {})); if (stok) stok.d.rows.forEach((s) => { if ((s.nama + ' ' + s.id).toLowerCase().includes(q)) hasil.push({ g: 'Bahan & Stok', t: s.nama, s: fmtDec(s.stok) + ' ' + s.satuan + ' • ' + s.status, img: s.foto, href: '#/stok?q=' + encodeURIComponent(s.nama) }); });
      const aset = Cache.get(Cache.key('aset.list', {})); if (aset) aset.d.rows.forEach((a) => { if ((a.nama + ' ' + a.id).toLowerCase().includes(q)) hasil.push({ g: 'Aset', t: a.nama, s: a.id + ' • ' + a.kondisi, img: a.foto, href: '#/aset?q=' + encodeURIComponent(a.nama) }); });
      const blj = Cache.get(Cache.key('belanja.list', Param.bulan30())); if (blj) blj.d.rows.forEach((n) => { if ((n.id + ' ' + n.sumber + ' ' + n.items.map((i) => i.nama).join(' ')).toLowerCase().includes(q)) hasil.push({ g: 'Nota Belanja', t: n.id, s: n.sumber + ' • ' + rp(n.total), ic: 'bag', href: '#/belanja' }); });
      if (!hasil.length) hasil.push({ g: 'Hasil', t: 'Tidak ditemukan', s: 'Coba kata kunci lain', ic: 'search', href: '#' });
      const d = document.createElement('div'); d.className = 'search-res';
      let g0 = ''; d.innerHTML = hasil.slice(0, 14).map((h) => { const head = h.g !== g0 ? `<div class="grp">${esc(h.g)}</div>` : ''; g0 = h.g; return head + `<a href="${esc(h.href)}">${h.img ? `<img class="thumb s" src="${esc(h.img)}" alt="">` : `<span class="icon-box s">${ic(h.ic || 'search', 'sm')}</span>`}<div class="grow"><div class="strong">${esc(h.t)}</div><div class="xs muted">${esc(h.s)}</div></div></a>`; }).join('');
      d.addEventListener('click', (e) => { e.stopPropagation(); if (e.target.closest('a')) { tutup(); inp.value = ''; } });
      box.appendChild(d);
    }, 180));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = $('.search-res a', box); if (a) { location.hash = a.getAttribute('href'); tutup(); inp.value = ''; } } if (e.key === 'Escape') { tutup(); inp.blur(); } });
  },

  /* ---------------- Router ---------------- */
  route() {
    if (!API.token || !Store.me) return;
    const h = location.hash.replace(/^#\/?/, '');
    let [name, qs] = h.split('?'); name = name || this.beranda();
    const q = Object.fromEntries(new URLSearchParams(qs || ''));
    if (!Pages[name]) name = this.beranda();
    if (!bolehNav(name)) { toast('Peran Anda tidak memiliki akses ke halaman ini.', 'warning'); name = this.beranda(); history.replaceState(null, '', '#/' + name); }
    this.drawer(false); Modal.stack.slice().forEach((m) => m.close());
    if (this.cleanup) { try { this.cleanup(); } catch (e) { } this.cleanup = null; }
    this.cur = name;
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === name));
    const fab = $('#fab'); if (fab) fab.style.display = name === 'pos' ? 'none' : '';
    const lama = $('#view'); if (!lama) return;
    const view = lama.cloneNode(false);           // elemen baru = listener halaman lama tidak menumpuk
    view.className = 'content view'; view.innerHTML = '';
    lama.replaceWith(view);
    const it = navItem(name); document.title = (it ? it.l + ' — ' : '') + ((Store.app || {}).nama || '');
    try { this.cleanup = Pages[name].render(view, q) || null; } catch (e) { console.error(e); view.innerHTML = `<div class="card">${kosongHTML('Terjadi kesalahan saat menampilkan halaman: ' + e.message, 'alert')}</div>`; }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  },
  segarkan() { if ($('.app')) this.route(); },

  /* ---------------- Ganti PIN ---------------- */
  gantiPin(wajib) {
    let tahap = 0, lama = '', baru = '';
    const judul = ['Masukkan PIN lama', 'Buat PIN baru (6 digit)', 'Ulangi PIN baru'];
    const m = Modal.open({ title: wajib ? 'Wajib Ganti PIN' : 'Ganti PIN Saya', sub: wajib ? 'Demi keamanan, ganti PIN bawaan sebelum memakai aplikasi.' : 'PIN dipakai untuk masuk & menandatangani dokumen.', size: 'sm', tutupLuar: !wajib, body: `<div class="center strong" id="gp-l">${judul[0]}</div><div class="pin-dots"></div>${pinPadHTML()}` });
    const pad = pasangPinPad(m.el, async (pin) => {
      if (tahap === 0) { lama = pin; tahap = 1; } else if (tahap === 1) { baru = pin; tahap = 2; }
      else {
        if (pin !== baru) { toast('Konfirmasi PIN tidak sama.', 'error'); tahap = 1; $('#gp-l', m.el).textContent = judul[1]; return pad.reset(true); }
        const r = await tulis('auth.gantiPin', { pinLama: lama, pinBaru: baru }, { teks: 'Mengganti PIN…' });
        if (r.success) { Store.me.wajibGanti = false; m.close(); return; }
        tahap = 0;
      }
      $('#gp-l', m.el).textContent = judul[tahap]; pad.reset();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => App.init());
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
