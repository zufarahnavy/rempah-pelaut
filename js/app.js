/* =====================================================================
   app.js — Store, login PIN, kerangka aplikasi, router, pencarian, notifikasi,
            status sinkron, PIN tanda tangan, kunci layar otomatis
   ===================================================================== */
'use strict';
const Pages = {};
const Store = {
  me: null, perm: [], aturan: {}, app: null, opsi: {}, menu: [], hariIni: null, notif: [], dashboard: null, demo: false, modul: [], aturanPin: {}, versi: '',
  set(d) {
    ['me', 'perm', 'aturan', 'app', 'opsi', 'menu', 'hariIni', 'notif', 'dashboard', 'demo', 'modul', 'serverHariIni', 'aturanPin', 'versi'].forEach((k) => { if (d[k] !== undefined) this[k] = d[k]; });
    try { localStorage.setItem('rp:boot', JSON.stringify({ me: this.me, perm: this.perm, aturan: this.aturan, app: this.app, opsi: this.opsi, menu: this.menu, hariIni: this.hariIni, notif: this.notif, dashboard: this.dashboard, demo: this.demo, modul: this.modul, aturanPin: this.aturanPin, versi: this.versi, t: Date.now() })); } catch (e) { }
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
  { grp: 'Harian', items: [{ k: 'beranda', l: 'Beranda', i: 'home' }, { k: 'dashboard', l: 'Dashboard', i: 'grid' }, { k: 'analitik', l: 'Analitik penjualan', i: 'chart' }] },
  { grp: 'Kasir', items: [{ k: 'pos', l: 'Penjualan (POS)', i: 'pos' }, { k: 'biaya', l: 'Pengeluaran lapak', i: 'receipt' }, { k: 'closing', l: 'Daily closing', i: 'lock' }] },
  { grp: 'Gudang & kas', items: [{ k: 'belanja', l: 'Belanja bahan', i: 'bag' }, { k: 'stok', l: 'Stok & opname', i: 'box' }, { k: 'aset', l: 'Aset & inventaris', i: 'stall' }, { k: 'rekap', l: 'Rekap kas', i: 'book' }, { k: 'laporan', l: 'Laporan & unduh', i: 'file' }] },
  { grp: 'Administrasi', items: [{ k: 'dokumen', l: 'Dokumen resmi', i: 'doc' }, { k: 'menu', l: 'Master menu', i: 'cup' }, { k: 'pengguna', l: 'Pengguna & PIN', i: 'users' }, { k: 'pengaturan', l: 'Pengaturan', i: 'settings' }] }
];
const bolehNav = (k) => !!Pages[k] && (Pages[k].izin ? Pages[k].izin() : Store.punya(k));
const navItem = (k) => { for (const g of NAV) for (const i of g.items) if (i.k === k) return i; return null; };

const App = {
  cur: null, cleanup: null,
  async init() {
    const boot = $('#boot-screen'); if (boot) setTimeout(() => { boot.classList.add('hide'); setTimeout(() => boot.remove(), 300); }, 120);
    if (!API.siap()) return this.layarKonfigurasi();
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('net', () => this.updateNet());
    document.addEventListener('antrean', () => this.updateBanner());
    document.addEventListener('server', () => this.updateNet());
    document.addEventListener('versi', () => this.updateBanner());
    addEventListener('keydown', (e) => { if (e.key === 'F2' && API.token && Store.punya('pos')) { e.preventDefault(); location.hash = '#/pos'; } });
    Kunci.pasang();
    const cached = (() => { try { return JSON.parse(localStorage.getItem('rp:boot') || 'null'); } catch (e) { return null; } })();
    if (API.token && cached && cached.me) {
      Store.set(cached); this.shell(); this.route();
      this.segarkanBoot();
    } else if (API.token) {
      Loader.show('Membuka aplikasi…');
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
        if (r.data.me && r.data.me.wajibGanti) setTimeout(() => this.gantiPin(true), 300);
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
    document.body.innerHTML = `<div class="login"><div class="card login-card" style="max-width:560px"><div class="icon-box warning" style="margin:0 auto 12px">${ic('settings')}</div><h1>Konfigurasi belum lengkap</h1><p class="muted center mt-8">Isi alamat Web App Google Apps Script (berakhiran <code>/exec</code>) di berkas <b>js/config.js</b>, lalu unggah ulang ke GitHub Pages.</p><div class="formula mt-16">window.APP_CONFIG = {<br>&nbsp;&nbsp;GAS_URL: 'https://script.google.com/macros/s/ID_DEPLOYMENT/exec'<br>};</div><p class="muted small center mt-16">Panduan lengkap ada di PANDUAN-INSTALASI.md</p></div></div>`;
  },

  /* ---------------- Login PIN ---------------- */
  async login() {
    API.warm('pub');
    Kunci.lepas();
    document.body.classList.remove('in-app');
    let pub = null; try { pub = JSON.parse(localStorage.getItem('rp:pub') || 'null'); } catch (e) { }
    const root = document.createElement('div');
    document.body.innerHTML = ''; document.body.appendChild(root);
    document.body.insertAdjacentHTML('beforeend', '<div id="topline" class="topline"></div><div id="toasts" class="toasts"></div>');
    let pilih = localStorage.getItem('rp:lastUser') || '', sibuk = false;
    const gambar = (p) => {
      const app = (p && p.app) || Store.app || { nama: 'Minuman Rempah Pelaut', subjudul: 'Kasir & buku kas lapak', tagline: 'Mencari Rezeki dengan Hidup Sehat', lokasiSingkat: 'Bugis, Tj. Redeb, Berau, Kaltim' };
      if (p && p.app) terapkanTema(p.app);
      const users = (p && p.pengguna) || [];
      if (!users.some((u) => u.id === pilih)) pilih = users[0] ? users[0].id : '';
      const u = users.find((x) => x.id === pilih), panjang = (u && u.panjangPin) || 6;
      const demo = p && p.demo && p.demoPin ? p.demoPin.find((d) => d.id === pilih) : null;
      root.innerHTML = `<div class="login">
        <div class="login-top">
          <div class="small muted row gap-4">${ic('pin', 'sm')}${esc(app.lokasiSingkat || '')}</div>
          <div class="row gap-8"><span class="badge ${Net.up ? 'success' : 'danger'}" id="net-badge">${Net.up ? 'Online' : 'Offline'}</span></div>
        </div>
        <div class="card login-card">
          <div class="login-logo"><img src="${esc(app.logo || 'assets/logo.svg')}" alt="Logo" onerror="this.src='assets/logo.svg'"></div>
          <h1>${esc(app.nama)}</h1>
          <p class="tag">${esc(app.subjudul || '')}</p>
          <div class="mt-20"><div class="lbl mb-8">Siapa yang bertugas?</div>
            <div class="user-pick" id="up">${users.length ? users.map((x) => `<button type="button" data-u="${esc(x.id)}" class="${x.id === pilih ? 'on' : ''}"><span class="avatar s">${esc(x.inisial)}</span><span class="nm">${esc(x.nama)}</span><span class="rl">${esc(x.labelPeran)}</span></button>`).join('') : '<div class="skel h-36" style="flex:1"></div><div class="skel h-36" style="flex:1"></div>'}</div>
          </div>
          <div class="center mt-16 small muted" id="pin-lbl">Masukkan ${panjang} digit PIN</div>
          <div class="pin-dots"></div>
          ${pinPadHTML()}
          ${demo ? `<div class="demo-hint"><span>Data demo — PIN ${esc(demo.nama.split(' ')[0])}: <b class="tnum">${esc(demo.pin)}</b></span><button class="link-btn" id="isi-demo">Isi otomatis</button></div>` : ''}
        </div>
        <div class="login-foot"><span>${esc(app.nama)} · versi ${esc(VERSI_APP)}</span><span>${esc(app.tagline || '')}</span></div>
      </div>`;
      $$('#up button', root).forEach((b) => b.onclick = () => { pilih = b.dataset.u; localStorage.setItem('rp:lastUser', pilih); gambar(p); });
      const pad = pasangPinPad(root, (pin) => masuk(pin, pad), panjang);
      const isi = $('#isi-demo', root); if (isi) isi.onclick = () => { let i = 0; const t = setInterval(() => { const b = $(`.pin-pad [data-k="${demo.pin[i]}"]`, root); b && b.click(); if (++i >= demo.pin.length) clearInterval(t); }, 70); };
    };
    const masuk = async (pin, pad) => {
      if (sibuk) return;
      if (!pilih) return toast('Pilih pengguna terlebih dahulu.', 'warning');
      if (!Net.up) { pad.reset(true); return toast('Masuk pertama kali membutuhkan koneksi internet.', 'error', 'Offline'); }
      sibuk = true; Topline.start();
      const lambat = setTimeout(() => Loader.show('Memeriksa PIN…'), 700);
      try {
        const r = await API.raw('auth.login', { idUser: pilih, pin });
        clearTimeout(lambat); Loader.hide();
        if (!r.success) { pad.reset(true); return toast(r.message, 'error', r.code === 'LOCKED' ? 'Akun terkunci' : 'Belum bisa masuk'); }
        API.setToken(r.data.token); Cache.hapusSemua(); Store.set(r.data);
        this.shell(); location.hash = '#/' + this.beranda(); this.route();
        toast(r.message, 'success');
        if (r.data.me.wajibGanti) setTimeout(() => this.gantiPin(true), 300);
        this.prefetch(); API.warm('app'); Antrean.sinkron({ diam: true }); Kunci.aktif();
      } catch (e) { clearTimeout(lambat); Loader.hide(); pad.reset(true); toast(e.message, 'error', e.code === 'SERVER' ? 'Server bermasalah' : 'Gagal terhubung'); }
      finally { sibuk = false; Topline.done(); }
    };
    gambar(pub);
    try {
      const r = await API.raw('publik.boot', {});
      if (r.success) { localStorage.setItem('rp:pub', JSON.stringify(r.data)); pub = r.data; gambar(pub); }
    } catch (e) { if (!pub) toast(e.message, 'error', 'Tidak dapat menghubungi server'); }
  },
  beranda() { return Store.punya('dashboard') ? 'dashboard' : Store.punya('beranda') ? 'beranda' : (Store.perm[0] || 'pos'); },
  sesiHabis() {
    if (!API.token) return;
    API.setToken(''); Cache.hapusSemua(); toast('Sesi berakhir. Silakan masuk kembali.', 'warning'); this.login();
  },
  async keluar() {
    const q = Antrean.list().length;
    if (q && !(await konfirmasi({ title: 'Masih ada data belum terkirim', text: q + ' data berstatus Pending/Gagal. Jika keluar, data tetap tersimpan di perangkat ini dan dikirim saat masuk berikutnya.', ok: 'Tetap keluar' }))) return;
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
        <div class="brand"><img class="logo" src="${esc(app.logo || 'assets/logo.svg')}" alt="" onerror="this.src='assets/logo.svg'"><div class="grow"><div class="nm">${esc(app.singkat || app.nama)}</div><div class="sb truncate">${esc(app.lapak || app.lokasiSingkat || '')}</div></div></div>
        <nav class="nav" id="nav">${nav}</nav>
        <div class="foot">
          <button class="net-chip" id="net-chip" type="button" title="Status sinkron"><span class="row gap-8"><i class="dot"></i><span id="net-lbl">Online</span></span><span class="muted" id="net-q"></span></button>
        </div>
      </aside>
      <div class="main">
        <div id="banner"></div>
        <header class="topbar">
          <button class="btn ghost icon-only burger" id="burger" aria-label="Menu">${ic('menu')}</button>
          <div class="search pos-rel" id="gsearch">${ic('search')}<input class="input" placeholder="Cari menu, transaksi, nota, bahan, aset…" aria-label="Pencarian"></div>
          <div class="grow"></div>
          ${Store.demo ? `<a class="badge warning hide-m" href="#/pengaturan?tab=data" title="Data demo aktif">Data demo</a>` : ''}
          ${Store.punya('belanja') ? `<a class="btn hide-m" href="#/belanja">${ic('bag', 'sm')}Catat belanja</a>` : ''}
          ${Store.punya('pos') ? `<a class="btn primary hide-m" href="#/pos">${ic('plus', 'sm')}Transaksi baru <span class="kbd">F2</span></a>` : ''}
          <div class="pos-rel"><button class="btn ghost icon-only bell" id="bell" aria-label="Notifikasi">${ic('bell')}<span class="cnt hidden" id="bell-cnt"></span></button></div>
          <div class="pos-rel"><button class="who" id="who" type="button"><span class="avatar">${esc(me.inisial)}</span><div><div class="nm">${esc(me.nama)}</div><div class="rl">${esc(me.labelPeran)}</div></div>${ic('chev-d', 'sm hide-m')}</button></div>
        </header>
        <main class="content" id="view"></main>
        <footer class="foot-bar"><span>${esc(app.nama)} · ${esc(app.lokasi || '')}</span><span>Server: <b id="foot-net" class="ok">online</b> · versi ${esc(VERSI_APP)}</span></footer>
      </div>
    </div>
    <nav class="bottom-nav" id="bnav">${bawah.map((k) => { const n = navItem(k); return `<a href="#/${k}" data-nav="${k}">${ic(n.i)}<span>${({ pos: 'Kasir', closing: 'Closing', biaya: 'Biaya', dashboard: 'Dashboard', analitik: 'Analitik', rekap: 'Rekap', beranda: 'Beranda' })[k] || n.l.split(' ')[0]}</span></a>`; }).join('')}<a href="#" id="bnav-more">${ic('grid')}<span>Menu</span><span class="cnt hidden" id="bnav-cnt"></span></a></nav>
    ${Store.punya('pos') ? `<button class="fab" id="fab" aria-label="Transaksi baru">${ic('plus', 'lg')}</button>` : ''}`;
    $('#burger').onclick = () => this.drawer(true);
    $('#bnav-more').onclick = (e) => { e.preventDefault(); this.menuSheet(); };
    $('#fab') && ($('#fab').onclick = () => { location.hash = '#/pos'; });
    $('#net-chip').onclick = () => bukaStatusSinkron();
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
  aksiAkun() {
    const ap = Store.aturanPin || {};
    return [
      { a: 'pin', i: 'key', l: 'Ganti PIN saya' },
      ap.pinTtdTerpisah || (Store.me && Store.me.pinTtdAda) ? { a: 'ttd', i: 'sign', l: (Store.me && Store.me.pinTtdAda) ? 'Ganti PIN tanda tangan' : 'Buat PIN tanda tangan' } : null,
      { a: 'sinkron', i: 'cloud', l: 'Status sinkron' },
      { a: 'tes', i: 'wifi', l: 'Tes koneksi server' },
      { a: 'sim', i: Net.sim ? 'wifi' : 'wifi-off', l: Net.sim ? 'Matikan uji mode offline' : 'Uji mode offline' },
      { a: 'refresh', i: 'refresh', l: 'Muat ulang data' },
      { a: 'out', i: 'logout', l: 'Keluar', bad: true }
    ].filter(Boolean);
  },
  jalankanAksi(a) {
    if (a === 'pin') this.gantiPin(); if (a === 'ttd') this.pinTtd(); if (a === 'sinkron') bukaStatusSinkron(); if (a === 'tes') tesKoneksi();
    if (a === 'sim') { Net.set(!Net.sim); toast(Net.sim ? 'Uji mode offline aktif: data disimpan di perangkat sebagai Pending.' : 'Uji mode offline dimatikan.', 'info'); }
    if (a === 'out') this.keluar();
    if (a === 'refresh') { Cache.basi(); this.segarkanBoot().then(() => this.route()); toast('Data dimuat ulang dari server.', 'success'); }
  },
  menuSheet() {
    const items = []; NAV.forEach((g) => g.items.forEach((i) => { if (bolehNav(i.k)) items.push(i); }));
    const m = Modal.open({ title: 'Semua menu', sub: esc(Store.me.nama) + ' · ' + esc(Store.me.labelPeran), body: `<div class="sheet-menu"><div class="grid-menu">${items.map((i) => `<a href="#/${i.k}" class="${this.cur === i.k ? 'on' : ''}">${ic(i.i, 'lg')}${i.l}</a>`).join('')}</div><div class="mt-16">${this.aksiAkun().map((x) => `<button class="btn ghost block" style="justify-content:flex-start${x.bad ? ';color:var(--c-danger)' : ''}" data-a="${x.a}">${ic(x.i, 'sm')}${x.l}</button>`).join('')}</div></div>` });
    $$('a', m.el).forEach((a) => a.addEventListener('click', () => m.close()));
    $$('[data-a]', m.el).forEach((b) => b.onclick = () => { m.close(); this.jalankanAksi(b.dataset.a); });
  },
  userMenu() {
    $$('.dropdown').forEach((d) => d.remove());
    const d = document.createElement('div'); d.className = 'dropdown'; d.style.width = '270px';
    d.innerHTML = `<div class="li" style="padding:6px 8px"><span class="avatar">${esc(Store.me.inisial)}</span><div><div class="t">${esc(Store.me.nama)}</div><div class="s">${esc(Store.me.labelPeran)}${Store.me.jabatan ? ' · ' + esc(Store.me.jabatan) : ''}</div></div></div><hr class="divider" style="margin:6px 0">${this.aksiAkun().map((x) => `<button class="btn ghost block" style="justify-content:flex-start${x.bad ? ';color:var(--c-danger)' : ''}" data-a="${x.a}">${ic(x.i, 'sm')}${x.l}</button>`).join('')}`;
    $('#who').parentElement.appendChild(d);
    d.onclick = (e) => { e.stopPropagation(); const a = e.target.closest('[data-a]'); if (!a) return; d.remove(); this.jalankanAksi(a.dataset.a); };
  },
  notifMenu() {
    $$('.dropdown').forEach((d) => d.remove());
    const q = Antrean.jumlah();
    const list = [].concat(q.pending ? [{ level: 'warning', judul: q.pending + ' data Pending', isi: 'Belum terkirim ke Google Sheets. Ketuk untuk melihat.', aksi: 'sync' }] : [], q.gagal ? [{ level: 'danger', judul: q.gagal + ' data Gagal disinkron', isi: 'Ditolak server. Ketuk untuk melihat sebabnya.', aksi: 'sync' }] : [], Store.notif || []);
    const d = document.createElement('div'); d.className = 'dropdown';
    d.innerHTML = `<div class="row between" style="padding:6px 8px 8px"><h3>Notifikasi</h3><span class="badge plain">${list.length}</span></div>` + (list.length ? list.map((n, i) => `<a class="li" href="${esc(n.link || '#')}" data-i="${i}" style="padding:8px"><div class="icon-box s ${n.level === 'danger' ? 'danger' : n.level === 'warning' ? 'warning' : 'info'}">${ic(n.jenis === 'stok' ? 'box' : n.jenis === 'closing' ? 'lock' : n.jenis === 'dokumen' ? 'doc' : n.aksi ? 'cloud' : 'alert', 'sm')}</div><div class="grow"><div class="t">${esc(n.judul)}</div><div class="s">${esc(n.isi)}</div></div></a>`).join('') : kosongHTML('Tidak ada notifikasi.', 'check-c'));
    $('#bell').parentElement.appendChild(d);
    d.onclick = (e) => { e.stopPropagation(); const a = e.target.closest('[data-i]'); if (!a) return; const n = list[+a.dataset.i]; if (n.aksi === 'sync') { e.preventDefault(); bukaStatusSinkron(); } d.remove(); };
  },
  updateNet() {
    const up = Net.up, st = API.status, gagalServer = st.t && st.ok === false && up;
    const q = Antrean.jumlah();
    const chip = $('#net-chip');
    if (chip) {
      chip.classList.toggle('off', !up || (gagalServer && st.sebab !== 'lambat'));
      chip.classList.toggle('warn', up && !gagalServer && q.pending + q.gagal > 0);
      $('#net-lbl').textContent = !up ? (Net.sim ? 'Uji offline' : 'Offline') : gagalServer ? 'Server tidak menjawab' : q.gagal ? q.gagal + ' gagal sinkron' : q.pending ? q.pending + ' pending' : 'Tersinkron';
      $('#net-q').textContent = (Store.app || {}).zona || 'WITA';
    }
    const f = $('#foot-net'); if (f) { f.textContent = !up ? 'offline' : gagalServer ? 'tidak menjawab' : 'online'; f.className = up && !gagalServer ? 'ok' : 'bad'; }
    const nb = $('#net-badge'); if (nb) { nb.className = 'badge ' + (up ? 'success' : 'danger'); nb.textContent = up ? 'Online' : 'Offline'; }
    this.updateBanner();
  },
  updateBanner() {
    const b = $('#banner'); if (!b) return;
    const q = Antrean.jumlah(), sv = API.versiServer;
    let h = '';
    if (sv && sv !== VERSI_APP) h += `<div class="banner">${ic('alert', 'sm')}<div class="grow"><b>Versi server (${esc(sv)}) berbeda dengan tampilan (${esc(VERSI_APP)}).</b> ${Store.owner() ? 'Perbarui berkas .gs lalu Deploy → Manage deployments → Edit → New version.' : 'Beberapa fitur mungkin belum berjalan — beri tahu Owner.'}</div></div>`;
    if (q.pending || q.gagal) h += `<div class="banner">${ic(q.gagal ? 'alert' : 'cloud', 'sm')}<div class="grow"><b>${q.pending ? q.pending + ' data Pending' : ''}${q.pending && q.gagal ? ', ' : ''}${q.gagal ? q.gagal + ' data Gagal' : ''}</b> — ${q.gagal ? 'ditolak server, perlu ditinjau.' : 'tersimpan di perangkat, belum terkirim ke Google Sheets.'}</div><button class="btn xs" id="lihat-sync">Lihat</button>${Net.up && q.pending ? `<button class="btn xs dark" id="sync-now">${Antrean.busy ? '<span class="spin"></span>' : ic('refresh', 'sm')}Kirim sekarang</button>` : ''}</div>`;
    else if (!Net.up) h += `<div class="banner">${ic('wifi-off', 'sm')}<div class="grow"><b>Perangkat offline.</b> Penjualan & biaya tetap bisa dicatat sebagai Pending, lalu dikirim otomatis saat sinyal kembali.</div></div>`;
    b.innerHTML = h;
    const s = $('#sync-now'); if (s) s.onclick = () => Antrean.sinkron();
    const l = $('#lihat-sync'); if (l) l.onclick = () => bukaStatusSinkron();
    this.updateNotif();
    const lbl = $('#net-lbl'); if (lbl && Net.up && !(API.status.ok === false)) lbl.textContent = q.gagal ? q.gagal + ' gagal sinkron' : q.pending ? q.pending + ' pending' : 'Tersinkron';
  },
  updateNotif() {
    const q = Antrean.jumlah();
    const n = (Store.notif || []).length + (q.pending ? 1 : 0) + (q.gagal ? 1 : 0);
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
      NAV.forEach((g) => g.items.forEach((i) => { if (bolehNav(i.k) && i.l.toLowerCase().includes(q)) hasil.push({ g: 'Halaman', t: i.l, s: 'Buka halaman', ic: i.i, href: '#/' + i.k }); }));
      (Store.menu || []).forEach((m) => { if (m.nama.toLowerCase().includes(q)) hasil.push({ g: 'Menu', t: m.nama, s: rp(m.harga) + ' · ' + m.kategori, img: m.foto, href: Store.punya('pos') ? '#/pos?tambah=' + m.id : '#/menu' }); });
      ((Store.hariIni || {}).trx || []).forEach((t) => { if ((t.id + ' ' + t.items.map((x) => x.nama).join(' ') + ' ' + t.catatan).toLowerCase().includes(q)) hasil.push({ g: 'Transaksi hari ini', t: t.id, s: t.jam + ' · ' + t.cup + ' cup · ' + rp(t.masuk), ic: 'receipt', href: '#/pos' }); });
      const stok = Cache.get(Cache.key('stok.list', {})); if (stok) stok.d.rows.forEach((s) => { if ((s.nama + ' ' + s.id).toLowerCase().includes(q)) hasil.push({ g: 'Bahan & stok', t: s.nama, s: fmtDec(s.stok) + ' ' + s.satuan + ' · ' + s.status, img: s.foto, href: '#/stok?q=' + encodeURIComponent(s.nama) }); });
      const aset = Cache.get(Cache.key('aset.list', {})); if (aset) aset.d.rows.forEach((a) => { if ((a.nama + ' ' + a.id).toLowerCase().includes(q)) hasil.push({ g: 'Aset', t: a.nama, s: a.id + ' · ' + a.kondisi, img: a.foto, href: '#/aset?q=' + encodeURIComponent(a.nama) }); });
      const blj = Cache.get(Cache.key('belanja.list', Param.bulan30())); if (blj) blj.d.rows.forEach((n) => { if ((n.id + ' ' + n.sumber + ' ' + n.items.map((i) => i.nama).join(' ')).toLowerCase().includes(q)) hasil.push({ g: 'Nota belanja', t: n.id, s: n.sumber + ' · ' + rp(n.total), ic: 'bag', href: '#/belanja' }); });
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
    this.drawer(false); Modal.stack.slice().forEach((m) => { if (!m.kunci) m.close(); });
    if (this.cleanup) { try { this.cleanup(); } catch (e) { } this.cleanup = null; }
    const pindah = this.cur !== name;
    this.cur = name;
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === name));
    const fab = $('#fab'); if (fab) fab.style.display = name === 'pos' ? 'none' : '';
    const lama = $('#view'); if (!lama) return;
    const view = lama.cloneNode(false);           // elemen baru = listener halaman lama tidak menumpuk
    view.className = 'content' + (pindah ? ' view' : ''); view.innerHTML = '';   // fade hanya saat pindah halaman, bukan saat segarkan
    lama.replaceWith(view);
    Gerak.pasang(view, pindah);
    const it = navItem(name); document.title = (it ? it.l + ' — ' : '') + ((Store.app || {}).nama || '');
    try { this.cleanup = Pages[name].render(view, q) || null; } catch (e) { console.error(e); view.innerHTML = `<div class="card">${kosongHTML('Terjadi kesalahan saat menampilkan halaman: ' + e.message, 'alert')}</div>`; }
    if (pindah) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  },
  segarkan() { if ($('.app')) this.route(); },

  /* ---------------- Ganti PIN (panjang mengikuti aturan Owner) ---------------- */
  gantiPin(wajib) {
    if ($('[data-gantipin]')) return;
    const nLama = (Store.me && Store.me.panjangPin) || 6, nBaru = (Store.aturanPin && Store.aturanPin.panjang) || 6;
    let tahap = 0, lama = '', baru = '';
    const judul = ['Masukkan PIN lama (' + nLama + ' digit)', 'Buat PIN baru (' + nBaru + ' digit)', 'Ulangi PIN baru'];
    const m = Modal.open({ title: wajib ? 'Ganti PIN dulu' : 'Ganti PIN saya', sub: wajib ? (nLama !== nBaru ? 'Owner menetapkan PIN ' + nBaru + ' digit. Ganti PIN sebelum mencatat data.' : 'Demi keamanan, ganti PIN sebelum mencatat data.') : 'PIN dipakai untuk masuk' + ((Store.aturanPin || {}).pinTtdTerpisah ? '.' : ' dan menandatangani dokumen.'), size: 'sm', tutupLuar: !wajib, body: `<div data-gantipin class="center strong" id="gp-l">${judul[0]}</div>${(Store.aturanPin || {}).tolakLemah !== false ? '<div class="center xs muted mt-4">PIN mudah ditebak (123456, 111111, 121212…) akan ditolak.</div>' : ''}<div class="pin-dots"></div><div id="gp-pad">${pinPadHTML()}</div>` });
    let pad;
    const pasang = (n) => { $('#gp-pad', m.el).innerHTML = pinPadHTML(); pad = pasangPinPad(m.el, selesai, n); };
    const selesai = async (pin) => {
      if (tahap === 0) { lama = pin; tahap = 1; $('#gp-l', m.el).textContent = judul[1]; return pasang(nBaru); }
      if (tahap === 1) { baru = pin; tahap = 2; $('#gp-l', m.el).textContent = judul[2]; return pad.reset(); }
      if (pin !== baru) { toast('Konfirmasi PIN tidak sama.', 'error'); tahap = 1; $('#gp-l', m.el).textContent = judul[1]; return pad.reset(true); }
      const r = await tulis('auth.gantiPin', { pinLama: lama, pinBaru: baru }, { teks: 'Mengganti PIN…' });
      if (r.success) { Store.me.wajibGanti = false; Store.me.panjangPin = baru.length; Store.set({ me: Store.me }); m.close(); return; }
      tahap = 0; $('#gp-l', m.el).textContent = judul[0]; pasang(nLama);
    };
    pasang(nLama);
  },
  /* ---------------- PIN tanda tangan (terpisah dari PIN login, bila diwajibkan Owner) ---------------- */
  pinTtd() {
    const nLogin = (Store.me && Store.me.panjangPin) || 6, nBaru = (Store.aturanPin && Store.aturanPin.panjang) || 6;
    let tahap = 0, login = '', baru = '';
    const judul = ['Konfirmasi dengan PIN login', 'Buat PIN tanda tangan (' + nBaru + ' digit)', 'Ulangi PIN tanda tangan'];
    const m = Modal.open({ title: (Store.me && Store.me.pinTtdAda) ? 'Ganti PIN tanda tangan' : 'Buat PIN tanda tangan', sub: 'Dipakai khusus untuk menandatangani slip & dokumen resmi. Harus berbeda dari PIN login.', size: 'sm', body: `<div class="center strong" id="pt-l">${judul[0]}</div><div class="pin-dots"></div><div id="pt-pad"></div>` });
    let pad;
    const pasang = (n) => { $('#pt-pad', m.el).innerHTML = pinPadHTML(); pad = pasangPinPad(m.el, selesai, n); };
    const selesai = async (pin) => {
      if (tahap === 0) { login = pin; tahap = 1; $('#pt-l', m.el).textContent = judul[1]; return pasang(nBaru); }
      if (tahap === 1) { baru = pin; tahap = 2; $('#pt-l', m.el).textContent = judul[2]; return pad.reset(); }
      if (pin !== baru) { toast('Konfirmasi PIN tidak sama.', 'error'); tahap = 1; $('#pt-l', m.el).textContent = judul[1]; return pad.reset(true); }
      const r = await tulis('auth.pinTtd', { pinLogin: login, pinBaru: baru }, { teks: 'Menyimpan PIN tanda tangan…' });
      if (r.success) { Store.me.pinTtdAda = true; Store.set({ me: Store.me }); m.close(); return; }
      tahap = 0; $('#pt-l', m.el).textContent = judul[0]; pasang(nLogin);
    };
    pasang(nLogin);
  }
};

/* ---------------- Kunci layar otomatis (Pengaturan → Keamanan & PIN) ---------------- */
const Kunci = {
  t: Date.now(), m: null, timer: null,
  pasang() {
    ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, () => { if (!this.m) this.t = Date.now(); }, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.cek(); });
    this.timer = setInterval(() => this.cek(), 20000);
  },
  aktif() { this.t = Date.now(); },
  lepas() { if (this.m) { const m = this.m; this.m = null; m.close(); } },
  cek() {
    const n = num((Store.aturanPin || {}).kunciOtomatisMenit);
    if (!n || !API.token || !Store.me || this.m || !$('.app')) return;
    if (Date.now() - this.t >= n * 60000) this.kunci();
  },
  kunci() {
    const panjang = (Store.me && Store.me.panjangPin) || 6;
    const m = Modal.open({ title: 'Layar terkunci', sub: 'Tidak ada aktivitas selama ' + (Store.aturanPin || {}).kunciOtomatisMenit + ' menit. Masukkan PIN ' + esc(Store.me.nama) + ' untuk melanjutkan.', size: 'sm', tutupLuar: false, body: `<div class="row" style="justify-content:center"><span class="avatar">${esc(Store.me.inisial)}</span></div><div class="pin-dots"></div>${pinPadHTML()}<button class="btn ghost block mt-12" data-ganti>Bukan ${esc(Store.me.nama.split(' ')[0])}? Keluar</button>` });
    m.kunci = true; this.m = m;
    const x = $('[data-x]', m.el); if (x) x.remove();
    const pad = pasangPinPad(m.el, async (pin) => {
      try {
        const r = await API.raw('auth.verifikasiPin', { pin });
        if (r.success) { this.m = null; this.t = Date.now(); m.close(); return; }
        pad.reset(true); toast(r.message, 'error');
      } catch (e) { pad.reset(true); toast(e.message, 'error'); }
    }, panjang);
    $('[data-ganti]', m.el).onclick = () => { this.m = null; m.close(); API.setToken(''); Cache.hapusSemua(); Store.me = null; location.hash = ''; App.login(); };
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
