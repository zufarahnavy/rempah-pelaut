/* =====================================================================
   Halaman administrasi: Master Menu, Pengguna & PIN, Pengaturan, Dokumen Resmi
   ===================================================================== */
'use strict';

/* ============================== MASTER MENU ============================== */
Pages.menu = {
  render(el) {
    let kat = 'Semua', cari = '', data = null;
    el.innerHTML = `${kepala({ eyebrow: 'Katalog Lapak • Master_Menu', judul: 'Master Menu Rempah', desc: 'Atur nama, kategori, harga, foto, dan status aktif menu. Menu nonaktif tidak tampil di POS.', acts: `<button class="btn primary" data-act="baru">${ic('plus')}Tambah Menu</button>` })}<div id="isi"></div>`;
    const isi = $('#isi', el);
    const gambar = (d) => {
      data = d; const kats = ['Semua'].concat(Store.opsi.kategoriMenu || []);
      const rows = d.rows.filter((m) => (kat === 'Semua' || m.kategori === kat) && (!cari || m.nama.toLowerCase().includes(cari)));
      isi.innerHTML = `<div class="card mb-16"><div class="row wrap between"><div class="chips scroll" id="kat">${kats.map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)} <span class="n">${k === 'Semua' ? d.rows.length : d.rows.filter((m) => m.kategori === k).length}</span></button>`).join('')}</div><div class="search" style="min-width:220px">${ic('search')}<input class="input" id="cari" placeholder="Cari menu…" value="${esc(cari)}"></div></div></div>
        <div class="menu-grid">${rows.map((m, i) => `<div class="card mcard lift" style="--i:${i};${m.aktif ? '' : 'opacity:.6'}" data-edit="${m.id}"><div class="ph"><img src="${esc(fotoUrl(m.foto))}" alt="" loading="lazy" onerror="this.src='assets/img/menu/default.svg'"><span class="kat">${esc(m.id)}</span></div><div class="nm">${esc(m.nama)}</div><div class="row between"><span class="hg">${m.dinamis ? rp(m.hargaMin) + ' – ' + fmtNum(m.hargaMaks) : rp(m.harga)}</span>${m.aktif ? '<span class="badge success plain">Aktif</span>' : '<span class="badge danger plain">Nonaktif</span>'}</div><div class="xs muted">${esc(m.kategori)}${m.dinamis ? ' • harga dinamis' : ''}</div></div>`).join('') || `<div class="card span-all">${kosongHTML('Menu tidak ditemukan', 'cup')}</div>`}</div>`;
      $('#cari', isi).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); gambar(data); $('#cari', isi).focus(); $('#cari', isi).setSelectionRange(99, 99); }, 250));
    };
    const edit = (m) => {
      const baru = !m; m = m || { nama: '', kategori: (Store.opsi.kategoriMenu || [])[2] || '', harga: 15000, aktif: true, dinamis: false, hargaMin: 15000, hargaMaks: 20000, urutan: 99, deskripsi: '', foto: '' };
      const md = Modal.open({ title: baru ? 'Tambah Menu Baru' : 'Ubah Menu ' + esc(m.id), size: 'lg', body: `<div class="row top wrap gap-20"><div class="photo-up" id="foto" style="width:160px;height:160px"><img src="${esc(fotoUrl(m.foto))}" alt="" onerror="this.src='assets/img/menu/default.svg'"><span class="ov">${ic('upload', 'sm')} ${baru ? 'Simpan dulu' : 'Ganti foto'}</span></div><div class="grow form-grid"><div class="field span-2"><label>Nama Menu</label><input class="input" id="m-n" value="${esc(m.nama)}"></div><div class="field"><label>Kategori</label><select class="input" id="m-k">${(Store.opsi.kategoriMenu || []).map((k) => `<option ${k === m.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Harga Standar</label><div class="input-rp"><span>Rp</span><input class="input" id="m-h" inputmode="numeric" value="${fmtNum(m.harga)}"></div></div><div class="field span-2"><label class="check" style="padding:8px 0"><input type="checkbox" id="m-d" ${m.dinamis ? 'checked' : ''}><div><b>Harga dapat diubah saat transaksi</b><div class="xs muted">Untuk menu seperti Reluxest / Wellnest atau Rempah Custom</div></div></label></div><div class="field dyn"><label>Harga Minimum</label><div class="input-rp"><span>Rp</span><input class="input" id="m-min" inputmode="numeric" value="${fmtNum(m.hargaMin)}"></div></div><div class="field dyn"><label>Harga Maksimum</label><div class="input-rp"><span>Rp</span><input class="input" id="m-max" inputmode="numeric" value="${fmtNum(m.hargaMaks)}"></div></div><div class="field"><label>Urutan Tampil</label><input class="input" id="m-u" inputmode="numeric" value="${m.urutan}"></div><div class="field"><label>Status</label><label class="row gap-8" style="min-height:44px"><span class="switch"><input type="checkbox" id="m-a" ${m.aktif ? 'checked' : ''}><span></span></span>Aktif di POS</label></div><div class="field span-2"><label>Deskripsi (opsional)</label><input class="input" id="m-ds" value="${esc(m.deskripsi)}"></div></div></div>`, foot: `${baru ? '' : `<button class="btn danger" data-h>${ic('trash', 'sm')}Hapus</button>`}<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check')}Simpan Menu</button>` });
      const dyn = () => $$('.dyn', md.el).forEach((x) => { x.style.display = $('#m-d', md.el).checked ? '' : 'none'; }); dyn(); $('#m-d', md.el).onchange = dyn;
      $$('[inputmode=numeric]', md.el).forEach((inp) => inp.addEventListener('input', () => { if (inp.id === 'm-u') return; const v = parseRp(inp.value); inp.value = v ? fmtNum(v) : ''; }));
      $('#foto', md.el).onclick = () => { if (baru) return toast('Simpan menu dulu, lalu unggah fotonya.', 'info'); unggahFotoUI('menu', m.id, (url, prev) => { $('#foto img', md.el).src = prev; muat(true); App.segarkanBoot(); }); };
      $('[data-b]', md.el).onclick = () => md.close();
      const h = $('[data-h]', md.el); if (h) h.onclick = async () => { if (await konfirmasi({ title: 'Hapus menu?', text: 'Menu yang sudah punya riwayat penjualan hanya akan dinonaktifkan.', danger: true, ok: 'Hapus' })) { if ((await tulis('menu.hapus', { id: m.id }, { teks: 'Menghapus menu…' })).success) { md.close(); muat(true); App.segarkanBoot(); } } };
      $('[data-ok]', md.el).onclick = async () => { const r = await tulis('menu.simpan', { id: m.id, nama: $('#m-n', md.el).value, kategori: $('#m-k', md.el).value, harga: parseRp($('#m-h', md.el).value), dinamis: $('#m-d', md.el).checked, hargaMin: parseRp($('#m-min', md.el).value), hargaMaks: parseRp($('#m-max', md.el).value), urutan: num($('#m-u', md.el).value), aktif: $('#m-a', md.el).checked, deskripsi: $('#m-ds', md.el).value }, { teks: 'Menyimpan menu…' }); if (r.success) { md.close(); muat(true); App.segarkanBoot(); } };
    };
    el.onclick = (e) => {
      const k = e.target.closest('[data-kat]'); if (k) { kat = k.dataset.kat; gambar(data); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) return edit(data.rows.find((x) => x.id === ed.dataset.edit));
      const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'baru') edit(null);
    };
    const muat = (force) => pakai('menu.list', {}, gambar, { maxAge: force ? 0 : 60000, force });
    if (Store.menu && Store.menu.length && !Cache.get(Cache.key('menu.list', {}))) gambar({ rows: Store.menu });
    else isi.innerHTML = '<div class="menu-grid">' + '<div class="skel h-200"></div>'.repeat(8) + '</div>';
    muat(false);
  }
};

/* ============================== PENGGUNA & PIN ============================== */
Pages.pengguna = {
  render(el) {
    let data = null;
    el.innerHTML = `${kepala({ eyebrow: 'Keamanan Akses • Pengguna', judul: 'Pengguna & PIN', desc: 'Kelola akun kasir dan owner. PIN disimpan sebagai hash, terkunci 15 menit setelah 5 kali salah.', acts: `<button class="btn primary" data-act="baru">${ic('plus')}Tambah Pengguna</button>` })}<div id="isi"></div>`;
    const isi = $('#isi', el);
    const gambar = (d) => {
      data = d;
      isi.innerHTML = `<div class="grid g-3 anim">${d.rows.map((u) => `<div class="card lift"><div class="row"><span class="avatar" style="width:52px;height:52px;font-size:17px">${esc(u.inisial)}</span><div class="grow"><h3>${esc(u.nama)}</h3><div class="small muted">${esc(u.jabatan || '-')} • <span class="id">${esc(u.id)}</span></div></div></div>
        <div class="row wrap gap-8 mt-12"><span class="badge ${u.peran === 'OWNER' ? 'gold' : 'info'}">${esc(u.labelPeran)}</span>${u.aktif ? '<span class="badge success">Aktif</span>' : '<span class="badge danger">Nonaktif</span>'}${u.terkunci ? '<span class="badge danger">PIN terkunci</span>' : ''}${u.wajibGanti ? '<span class="badge warning">Wajib ganti PIN</span>' : ''}</div>
        <div class="xs muted mt-12">Login terakhir: ${u.loginTerakhir ? esc(tgl(u.loginTerakhir, 'd MMM yyyy, HH:mm')) : 'belum pernah'}</div>
        <div class="row mt-12 gap-8"><button class="btn sm grow" data-edit="${esc(u.id)}">${ic('edit', 'sm')}Ubah</button><button class="btn sm grow" data-pin="${esc(u.id)}">${ic('key', 'sm')}Reset PIN</button></div></div>`).join('')}</div>
        <div class="notice info mt-20">${ic('info')}<div class="small">Hak akses tiap peran (modul yang boleh dibuka Kasir & aturan tambahan) diatur di <a href="#/pengaturan?tab=peran"><b>Pengaturan → Peran & Hak Akses</b></a>. Owner selalu memiliki akses penuh termasuk Pengaturan.</div></div>`;
    };
    const pinBaru = (judul) => new Promise((res) => {
      let p1 = '';
      const m = Modal.open({ title: judul, sub: 'Masukkan 6 digit PIN', size: 'sm', body: `<div class="center strong" id="l">PIN baru</div><div class="pin-dots"></div>${pinPadHTML()}`, onClose: (v) => res(v || null) });
      const pad = pasangPinPad(m.el, (pin) => { if (!p1) { p1 = pin; $('#l', m.el).textContent = 'Ulangi PIN'; pad.reset(); } else if (pin === p1) m.close(pin); else { p1 = ''; $('#l', m.el).textContent = 'Tidak sama — ulangi PIN baru'; pad.reset(true); } });
    });
    const edit = async (u) => {
      const baru = !u; u = u || { nama: '', jabatan: '', peran: 'KASIR', aktif: true };
      const md = Modal.open({ title: baru ? 'Tambah Pengguna' : 'Ubah ' + esc(u.nama), body: `<div class="form-grid"><div class="field span-2"><label>Nama Lengkap</label><input class="input" id="u-n" value="${esc(u.nama)}"></div><div class="field"><label>Jabatan</label><input class="input" id="u-j" placeholder="Kasir Gerobak, Barista…" value="${esc(u.jabatan)}"></div><div class="field"><label>Peran</label><select class="input" id="u-p"><option value="KASIR" ${u.peran === 'KASIR' ? 'selected' : ''}>${esc(Store.app.labelKasir)}</option><option value="OWNER" ${u.peran === 'OWNER' ? 'selected' : ''}>${esc(Store.app.labelOwner)}</option></select></div><div class="field span-2"><label class="row gap-8"><span class="switch"><input type="checkbox" id="u-a" ${u.aktif ? 'checked' : ''}><span></span></span>Akun aktif (bisa login)</label></div></div>${baru ? '<p class="xs muted mt-8">Setelah menekan Simpan, Anda akan diminta membuat PIN awal. Pengguna wajib menggantinya saat login pertama.</p>' : ''}`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check')}Simpan</button>` });
      $('[data-b]', md.el).onclick = () => md.close();
      $('[data-ok]', md.el).onclick = async () => {
        const d = { id: u.id, nama: $('#u-n', md.el).value, jabatan: $('#u-j', md.el).value, peran: $('#u-p', md.el).value, aktif: $('#u-a', md.el).checked };
        if (!d.nama.trim()) return $('#u-n', md.el).classList.add('err');
        md.close();
        if (baru) { const pin = await pinBaru('PIN awal untuk ' + d.nama); if (!pin) return; d.pin = pin; }
        if ((await tulis('pengguna.simpan', d, { teks: 'Menyimpan pengguna…' })).success) muat(true);
      };
    };
    el.onclick = async (e) => {
      const ed = e.target.closest('[data-edit]'); if (ed) return edit(data.rows.find((x) => x.id === ed.dataset.edit));
      const pn = e.target.closest('[data-pin]'); if (pn) { const u = data.rows.find((x) => x.id === pn.dataset.pin); const pin = await pinBaru('Reset PIN ' + u.nama); if (pin && (await tulis('pengguna.resetPin', { id: u.id, pin }, { teks: 'Mereset PIN…' })).success) muat(true); return; }
      const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'baru') edit(null);
    };
    const muat = (force) => pakai('pengguna.list', {}, gambar, { maxAge: force ? 0 : 30000, force });
    isi.innerHTML = '<div class="grid g-3">' + '<div class="skel h-200"></div>'.repeat(3) + '</div>';
    muat(false);
  }
};

/* ============================== PENGATURAN ============================== */
const PRESET_TEMA = [
  { n: 'Rempah Klasik', t: { primary: '#B8862D', primaryHover: '#9A6F1F', secondary: '#6B4A2B', bg: '#F5EBD7', card: '#FBF6EA', text: '#1B2A3B', muted: '#7A6F5D', border: '#E3D5B5', success: '#4E7A3A', danger: '#B5442F', warning: '#D9A21B' } },
  { n: 'Samudra Pelaut', t: { primary: '#2F6EA8', primaryHover: '#24578A', secondary: '#1B3A5B', bg: '#EAF1F8', card: '#F8FBFE', text: '#14233A', muted: '#5E6E82', border: '#CFDDEC', success: '#3E7D5A', danger: '#B5442F', warning: '#D9A21B' } },
  { n: 'Hijau Pandan', t: { primary: '#4E7A3A', primaryHover: '#3D622D', secondary: '#2F4A26', bg: '#EEF3E6', card: '#FAFCF6', text: '#1E2A1B', muted: '#66705C', border: '#D5E0C6', success: '#3E8A4A', danger: '#B5442F', warning: '#C9961A' } },
  { n: 'Kayu Manis', t: { primary: '#C77B30', primaryHover: '#A86424', secondary: '#5B3A22', bg: '#F4E6D8', card: '#FFF8F0', text: '#2A1D12', muted: '#7B6550', border: '#E6CFB2', success: '#4E7A3A', danger: '#B5442F', warning: '#D9A21B' } },
  { n: 'Merah Bata', t: { primary: '#B5442F', primaryHover: '#963624', secondary: '#5A2E22', bg: '#F6E9E2', card: '#FDF7F3', text: '#2B1B16', muted: '#7D6359', border: '#EBD3C8', success: '#4E7A3A', danger: '#9E2F22', warning: '#D9A21B' } }
];
const LABEL_WARNA = { primary: 'Aksen utama / tombol', primaryHover: 'Aksen saat disentuh', secondary: 'Aksen sekunder (kayu)', bg: 'Latar utama', card: 'Kartu', text: 'Teks & judul', muted: 'Teks redup', border: 'Garis tepi', success: 'Positif / sukses', danger: 'Peringatan / negatif', warning: 'Waspada' };
Pages.pengaturan = {
  render(el, q) {
    let tab = q.tab || 'identitas', cfg = null, tema = null, sys = null;
    const TABS = [['identitas', 'Identitas & Logo', 'stall'], ['tampilan', 'Warna & Font', 'palette'], ['peran', 'Peran & Hak Akses', 'shield'], ['operasional', 'Operasional Lapak', 'sliders'], ['kategori', 'Kategori & Master', 'layers'], ['data', 'Data & Sistem', 'database']];
    el.innerHTML = `${kepala({ eyebrow: 'Owner • Kendali Superadmin', judul: 'Pengaturan Aplikasi', desc: 'Ubah nama aplikasi, warna, font, nama peran, hak akses tiap peran, aturan operasional, dan kelola data.' })}
      <div class="grid g-set"><div class="card pad-s set-tabs"><div class="tabs-v" id="tabs">${TABS.map((t) => `<button data-tab="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${ic(t[2], 'sm')}${t[1]}</button>`).join('')}</div></div><div id="isi"></div></div>`;
    const isi = $('#isi', el);
    const N = () => cfg.nilai, J = (k) => { try { return JSON.parse(N()[k]); } catch (e) { return null; } };
    const simpan = async (nilai, teks) => {
      const r = await tulis('pengaturan.simpan', { nilai }, { teks: teks || 'Menyimpan pengaturan…' });
      if (r.success) { Object.keys(nilai).forEach((k) => { N()[k] = typeof nilai[k] === 'string' ? nilai[k] : JSON.stringify(nilai[k]); }); await App.segarkanBoot(); }
      return r.success;
    };
    const tabIdentitas = () => {
      isi.innerHTML = `<div class="stack fade-swap"><div class="card"><div class="card-head"><div><h2>Identitas Usaha</h2><div class="sub">Tampil di sidebar, halaman login, laporan, dan dokumen resmi</div></div></div>
        <div class="row top wrap gap-20"><div class="col" style="align-items:center"><div class="photo-up" id="logo" style="width:130px;height:130px;border-radius:50%"><img src="${esc(N().LOGO_URL || 'assets/logo.svg')}" alt="" onerror="this.src='assets/logo.svg'"><span class="ov">${ic('upload', 'sm')} Logo</span></div><button class="link-btn xs" data-act="logo-reset">Pakai logo bawaan</button></div>
        <div class="grow form-grid">${[['APP_NAMA', 'Nama aplikasi / usaha'], ['APP_SINGKAT', 'Nama singkat (sidebar)'], ['APP_SUBJUDUL', 'Subjudul login'], ['APP_TAGLINE', 'Tagline'], ['LAPAK_NAMA', 'Nama lapak'], ['KOTA', 'Kota (untuk tanda tangan dokumen)'], ['LOKASI', 'Alamat lengkap'], ['LOKASI_SINGKAT', 'Lokasi singkat'], ['ZONA_LABEL', 'Label zona waktu'], ['URL_PUBLIK', 'URL aplikasi (GitHub Pages) untuk QR verifikasi']].map((f) => `<div class="field ${f[0] === 'LOKASI' || f[0] === 'URL_PUBLIK' ? 'span-2' : ''}"><label>${f[1]}</label><input class="input" data-k="${f[0]}" value="${esc(N()[f[0]])}" ${f[0] === 'URL_PUBLIK' ? `placeholder="${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}"` : ''}></div>`).join('')}</div></div>
        <div class="row mt-16" style="justify-content:flex-end"><button class="btn primary" data-act="simpan-id">${ic('check')}Simpan Identitas</button></div></div></div>`;
    };
    const tabTampilan = () => {
      tema = tema || Object.assign({}, J('TEMA'));
      const fj = cfg.fontJudul, fi = cfg.fontIsi;
      isi.innerHTML = `<div class="stack fade-swap"><div class="card"><div class="card-head"><div><h2>Tema Warna</h2><div class="sub">Perubahan langsung terlihat sebagai pratinjau. Tekan Simpan agar berlaku untuk semua pengguna.</div></div><button class="btn sm" data-act="tema-reset">${ic('refresh', 'sm')}Kembalikan</button></div>
          <div class="grid g-3" style="gap:10px">${PRESET_TEMA.map((p, i) => `<button class="preset" data-preset="${i}"><span class="dots">${['primary', 'secondary', 'bg', 'success', 'danger'].map((k) => `<i style="background:${p.t[k]}"></i>`).join('')}</span><b class="small">${p.n}</b></button>`).join('')}</div>
          <div class="grid g-2 mt-16" style="gap:10px">${Object.keys(LABEL_WARNA).map((k) => `<label class="color-row"><input type="color" data-w="${k}" value="${esc(tema[k] || '#000000')}"><div class="grow"><div class="small strong">${LABEL_WARNA[k]}</div><div class="xs muted tnum" data-wv="${k}">${esc(tema[k] || '')}</div></div></label>`).join('')}</div>
          <div class="form-grid mt-16"><div class="field"><label>Kelengkungan sudut kartu <span class="hint" id="rv">${tema.radius || 20}px</span></label><input type="range" min="8" max="28" id="radius" value="${tema.radius || 20}" style="accent-color:var(--c-primary)"></div><div class="field"><label>Efek kaca (glassmorphism)</label><label class="row gap-8" style="min-height:44px"><span class="switch"><input type="checkbox" id="kaca" ${tema.kaca !== false ? 'checked' : ''}><span></span></span>Kartu tembus pandang halus</label></div></div></div>
        <div class="card"><div class="card-head"><div><h2>Tipografi</h2><div class="sub">Font judul (serif tegas selaras logo) & font isi (sans-serif bersih untuk data)</div></div></div>
          <div class="form-grid"><div class="field"><label>Font Judul</label><select class="input" id="fj">${cfg.fontJudulOpsi.map((f) => `<option ${f === fj ? 'selected' : ''}>${f}</option>`).join('')}</select></div><div class="field"><label>Font Isi</label><select class="input" id="fi">${cfg.fontIsiOpsi.map((f) => `<option ${f === fi ? 'selected' : ''}>${f}</option>`).join('')}</select></div></div>
          <div class="theme-preview mt-16"><div class="eyebrow">Pratinjau</div><h2 class="mt-4">${esc(N().APP_NAMA)}</h2><p class="muted small mt-4">Omset hari ini <b class="tnum" style="color:var(--c-text)">Rp 1.257.000</b> dari 71 cup.</p><div class="row wrap mt-12 gap-8"><button class="btn primary sm">Tombol Utama</button><button class="btn sm">Sekunder</button><span class="badge success">Terkunci</span><span class="badge warning">Menipis</span><span class="badge danger">Habis</span></div></div>
          <div class="row mt-16" style="justify-content:flex-end"><button class="btn primary" data-act="simpan-tema">${ic('check')}Simpan Tampilan</button></div></div></div>`;
      const pratinjau = () => terapkanTema(Object.assign({}, Store.app, { tema, fontJudul: $('#fj', isi).value, fontIsi: $('#fi', isi).value }));
      $$('[data-w]', isi).forEach((inp) => inp.addEventListener('input', () => { tema[inp.dataset.w] = inp.value.toUpperCase(); $(`[data-wv="${inp.dataset.w}"]`, isi).textContent = tema[inp.dataset.w]; pratinjau(); }));
      $('#radius', isi).addEventListener('input', (e) => { tema.radius = +e.target.value; $('#rv', isi).textContent = tema.radius + 'px'; pratinjau(); });
      $('#kaca', isi).onchange = (e) => { tema.kaca = e.target.checked; pratinjau(); };
      $('#fj', isi).onchange = pratinjau; $('#fi', isi).onchange = pratinjau;
    };
    const tabPeran = () => {
      const perm = J('PERM_KASIR') || [], at = J('ATURAN_KASIR') || {};
      isi.innerHTML = `<div class="stack fade-swap"><div class="card"><div class="card-head"><div><h2>Nama Peran</h2><div class="sub">Dua peran: Owner (merangkap Superadmin, akses penuh) dan Kasir (dapat diatur)</div></div></div>
          <div class="form-grid"><div class="field"><label>Label peran Owner</label><input class="input" id="lo" value="${esc(N().LABEL_OWNER)}"></div><div class="field"><label>Label peran Kasir</label><input class="input" id="lk" value="${esc(N().LABEL_KASIR)}"></div></div></div>
        <div class="card"><div class="card-head"><div><h2>Modul yang Boleh Dibuka ${esc(N().LABEL_KASIR)}</h2><div class="sub">Default sesuai PRD: Beranda, POS, Pengeluaran, Daily Closing. Pengguna & Pengaturan selalu khusus Owner.</div></div><button class="btn sm" data-act="perm-default">${ic('refresh', 'sm')}Default PRD</button></div>
          <div class="perm-grid">${cfg.modul.map((m) => { const khusus = cfg.khususOwner.includes(m.k); return `<label class="check" style="background:var(--c-inset);${khusus ? 'opacity:.55' : ''}"><input type="checkbox" data-perm="${m.k}" ${perm.includes(m.k) ? 'checked' : ''} ${khusus ? 'disabled' : ''}><div><b class="small">${esc(m.n)}</b>${khusus ? '<div class="xs muted">Khusus Owner</div>' : ''}</div></label>`; }).join('')}</div></div>
        <div class="card"><div class="card-head"><div><h2>Aturan Peran ${esc(N().LABEL_KASIR)}</h2><div class="sub">Rule tambahan yang dicek server pada setiap transaksi</div></div></div>
          ${Object.keys(cfg.aturanInfo).map((k) => `<div class="row between li"><div class="grow small">${esc(cfg.aturanInfo[k])}</div><span class="switch"><input type="checkbox" data-at="${k}" ${at[k] ? 'checked' : ''}><span></span></span></div>`).join('')}
          <div class="row mt-16" style="justify-content:flex-end"><button class="btn primary" data-act="simpan-peran">${ic('check')}Simpan Peran & Hak Akses</button></div></div>
        <div class="notice info">${ic('info')}<div class="small">Perubahan hak akses langsung berlaku untuk sesi kasir yang sedang aktif (menu menyesuaikan saat aplikasi memuat ulang data).</div></div></div>`;
    };
    const tabOperasional = () => {
      isi.innerHTML = `<div class="stack fade-swap"><div class="card"><div class="card-head"><div><h2>Target & Batas Harian</h2><div class="sub">Dipakai di dashboard, POS, dan validasi biaya kasir</div></div></div>
        <div class="form-grid"><div class="field"><label>Target cup harian</label><input class="input" id="o-t" inputmode="numeric" value="${esc(N().TARGET_CUP)}"></div><div class="field"><label>Plafon biaya operasional kasir / hari <span class="hint">0 = tanpa batas</span></label><div class="input-rp"><span>Rp</span><input class="input rpi" id="o-p" inputmode="numeric" value="${fmtNum(N().PLAFON_BIAYA)}"></div></div><div class="field"><label>Jam buka</label><input class="input" type="time" id="o-b" value="${esc(N().JAM_BUKA)}"></div><div class="field"><label>Jam tutup</label><input class="input" type="time" id="o-c" value="${esc(N().JAM_TUTUP)}"></div></div></div>
        <div class="card"><div class="card-head"><div><h2>Saldo Kas Awal</h2><div class="sub">Saldo sebelum closing pertama (PRD 8.1.4). Mengubahnya menghitung ulang seluruh rantai saldo.</div></div></div>
        <div class="form-grid"><div class="field"><label>Saldo awal pertama</label><div class="input-rp"><span>Rp</span><input class="input rpi" id="o-s" inputmode="numeric" value="${fmtNum(N().SALDO_AWAL_PERTAMA)}"></div></div><div class="field"><label>Tanggal mulai pembukuan <span class="hint">hari sebelumnya diabaikan</span></label><input class="input" type="date" id="o-m" value="${esc(N().TANGGAL_MULAI)}"></div></div>
        <div class="row mt-16" style="justify-content:flex-end"><button class="btn primary" data-act="simpan-op">${ic('check')}Simpan Operasional</button></div></div></div>`;
      $$('.rpi', isi).forEach((i) => i.addEventListener('input', () => { const v = parseRp(i.value); i.value = v ? fmtNum(v) : '0'; }));
    };
    const daftarEditor = (k, judul, sub) => `<div class="card" data-list="${k}"><div class="card-head"><div><h3>${judul}</h3><div class="sub">${sub}</div></div></div><div class="chips" data-chips>${(J(k) || []).map((v) => `<span class="chip" style="cursor:default">${esc(v)}<button class="link-btn" data-hapus-item="${esc(v)}" aria-label="Hapus">${ic('x', 'sm')}</button></span>`).join('')}</div><div class="row mt-12"><input class="input grow" data-baru placeholder="Tambah item…"><button class="btn" data-tambah-item>${ic('plus', 'sm')}Tambah</button></div></div>`;
    const tabKategori = () => {
      const kb = J('KATEGORI_BIAYA') || [], tc = J('TOMBOL_CEPAT_BIAYA') || [];
      isi.innerHTML = `<div class="stack fade-swap">
        <div class="card"><div class="card-head"><div><h3>Kategori Biaya Operasional</h3><div class="sub">Nominal acuan hanya petunjuk di form kasir</div></div><button class="btn sm" data-act="kb-tambah">${ic('plus', 'sm')}Kategori</button></div><div id="kb">${kb.map((x, i) => `<div class="row li" data-kb="${i}"><input class="input grow" data-f="nama" value="${esc(x.nama)}"><div class="input-rp" style="width:150px"><span>Rp</span><input class="input" data-f="acuan" inputmode="numeric" value="${fmtNum(x.acuan)}"></div><button class="btn ghost icon-only sm" data-kb-del="${i}" style="color:var(--c-danger)">${ic('trash', 'sm')}</button></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><div><h3>Tombol Cepat Biaya</h3><div class="sub">Satu klik di form pengeluaran kasir</div></div><button class="btn sm" data-act="tc-tambah">${ic('plus', 'sm')}Tombol</button></div><div id="tc">${tc.map((x, i) => `<div class="row wrap li" data-tc="${i}"><input class="input" style="width:120px" data-f="label" value="${esc(x.label)}" placeholder="Label"><select class="input" style="width:220px" data-f="kategori">${kb.map((k) => `<option ${k.nama === x.kategori ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}</select><div class="input-rp" style="width:140px"><span>Rp</span><input class="input" data-f="nominal" inputmode="numeric" value="${fmtNum(x.nominal)}"></div><input class="input grow" data-f="ket" value="${esc(x.ket || '')}" placeholder="Keterangan otomatis"><button class="btn ghost icon-only sm" data-tc-del="${i}" style="color:var(--c-danger)">${ic('trash', 'sm')}</button></div>`).join('')}</div></div>
        <div class="grid g-2">${daftarEditor('METODE_BAYAR', 'Metode Pembayaran', 'Pilihan di POS')}${daftarEditor('JENIS_PESANAN', 'Jenis Pesanan', 'Dine In, Bungkus, dll.')}${daftarEditor('KATEGORI_MENU', 'Kategori Menu', 'Filter POS & master menu')}${daftarEditor('KATEGORI_STOK', 'Kategori Stok', 'Rempah mentah, pelengkap, kemasan')}${daftarEditor('KATEGORI_ASET', 'Kategori Aset', 'Pengelompokan inventaris')}${daftarEditor('SATUAN', 'Satuan', 'kg, botol, pcs, …')}</div>
        <div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="simpan-kat">${ic('check')}Simpan Kategori & Master</button></div></div>`;
    };
    const tabData = () => {
      isi.innerHTML = `<div class="stack fade-swap">
        <div class="card"><div class="card-head"><div><h2>Status Sistem</h2><div class="sub">Kesehatan server, cache, dan database</div></div><button class="btn sm" data-act="sys">${ic('refresh', 'sm')}Periksa</button></div><div id="sys">${sys ? '' : '<div class="skel h-120"></div>'}</div></div>
        <div class="card"><div class="card-head"><div><h2>Impor Data dari Spreadsheet Lain</h2><div class="sub">Untuk memasukkan buku lama. Sumber hanya dibaca; aman diulang (tidak dobel).</div></div><span class="badge info plain">gas-migrasi-database</span></div>
          <div class="field"><label>URL atau ID Google Sheets sumber</label><input class="input" id="im-src" placeholder="https://docs.google.com/spreadsheets/d/…"></div>
          <div class="perm-grid mt-12">${['Master_Menu', 'Master_Stok', 'Aset_Inventaris', 'Trx_Penjualan', 'Trx_Penjualan_Detail', 'Trx_Pengeluaran_Operasional', 'Trx_Belanja_Bahan', 'Log_Stok_Opname', 'Rekap_Kas_Harian'].map((s) => `<label class="check" style="background:var(--c-inset)"><input type="checkbox" data-im="${s}" checked><span class="small">${s}</span></label>`).join('')}</div>
          <label class="check mt-8"><input type="checkbox" id="im-timpa"><div><b class="small">Timpa data master yang sudah ada</b><div class="xs muted">Hanya untuk menu, stok, dan aset. Transaksi tidak pernah ditimpa.</div></div></label>
          <p class="xs muted mt-8">Nama sheet & judul kolom sumber harus sama dengan database aplikasi (unduh templat: Laporan → Excel). Sheet Pengguna tidak diimpor.</p>
          <div class="row mt-12 gap-8"><button class="btn" data-act="im-pindai">${ic('search', 'sm')}Pindai (Dry-run)</button><button class="btn primary" data-act="im-jalan">${ic('upload', 'sm')}Jalankan Import</button></div><div id="im-hasil" class="mt-12"></div></div>
        <div class="card"><div class="card-head"><div><h2>Log Audit</h2><div class="sub">Semua aksi penting tercatat (tanpa PIN/rahasia)</div></div><div class="search" style="min-width:200px">${ic('search')}<input class="input" id="au-q" placeholder="Cari aksi / nama…"></div></div><div id="audit"><div class="skel h-120"></div></div></div>
        <div class="card" style="border-color:color-mix(in srgb,var(--c-danger) 35%,transparent)"><div class="card-head"><div><h2 class="bad">Mulai Data Riil</h2><div class="sub">Kosongkan data demo (transaksi, biaya, belanja, rekap, opname, dokumen) lalu mulai pembukuan sungguhan.</div></div>${cfg.demo ? '<span class="badge warning">Data demo aktif</span>' : '<span class="badge success">Data riil</span>'}</div>
          <div class="form-grid"><div class="field"><label>Saldo kas riil saat ini</label><div class="input-rp"><span>Rp</span><input class="input" id="mr-s" inputmode="numeric" placeholder="0"></div></div><div class="field"><label>Tanggal mulai</label><input class="input" type="date" id="mr-t" value="${hariIni()}"></div></div>
          <label class="check mt-8"><input type="checkbox" id="mr-st"><span class="small">Nolkan jumlah stok semua bahan (lalu isi lewat stok opname)</span></label><label class="check"><input type="checkbox" id="mr-as"><span class="small">Hapus data aset demo</span></label><label class="check"><input type="checkbox" id="mr-k"><span class="small">Nonaktifkan akun kasir demo (Budi & Dimas)</span></label>
          <div class="notice danger mt-12">${ic('alert')}<div class="small">Tindakan ini tidak dapat dibatalkan. Semua pengguna lain wajib mengganti PIN dan login ulang. Disarankan unduh laporan Excel terlebih dahulu bila perlu.</div></div>
          <div class="row mt-12" style="justify-content:flex-end"><button class="btn danger" data-act="mulai-riil">${ic('database', 'sm')}Kosongkan Demo & Mulai Riil</button></div></div>
      </div>`;
      $('#mr-s', isi).addEventListener('input', (e) => { const v = parseRp(e.target.value); e.target.value = v ? fmtNum(v) : ''; });
      muatSys(); muatAudit('');
      $('#au-q', isi).addEventListener('input', debounce((e) => muatAudit(e.target.value), 350));
    };
    const muatSys = async (force) => {
      const box = $('#sys', isi); if (!box) return;
      if (!sys || force) { const r = await API.call('sistem.status', {}); if (!r.success) { box.innerHTML = kosongHTML(r.message, 'alert'); return; } sys = r.data; }
      const b = sys.baris;
      box.innerHTML = `<div class="grid g-4 kpis">${[['Versi backend', sys.versi], ['Cache server', sys.cacheHangat ? 'Hangat ✓' : 'Dingin'], ['Keep-warm', sys.keepWarm === 'off' ? 'Mati' : 'Aktif'], ['Script Properties', sys.propsKB + ' KB']].map((x) => `<div class="inset"><div class="xs muted">${x[0]}</div><b>${esc(x[1])}</b></div>`).join('')}</div>
        <div class="table-wrap mt-12"><table class="tbl"><thead><tr><th>Sheet</th><th class="r">Baris</th></tr></thead><tbody>${Object.keys(b).map((k) => `<tr><td>${esc(k)}</td><td class="r">${fmtNum(b[k])}</td></tr>`).join('')}</tbody></table></div>
        <div class="row wrap gap-8 mt-12"><a class="btn sm" href="${esc(sys.spreadsheetUrl)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka Spreadsheet</a>${sys.folderUrl ? `<a class="btn sm" href="${esc(sys.folderUrl)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Folder Drive</a>` : ''}<span class="badge ${sys.rahasia.sessionSecret ? 'success' : 'danger'}">SESSION_SECRET ${sys.rahasia.sessionSecret ? 'ada' : 'belum'}</span><span class="badge ${sys.rahasia.verifSecret ? 'success' : 'danger'}">VERIF_SECRET ${sys.rahasia.verifSecret ? 'ada' : 'belum'}</span><span class="xs muted">Pemanasan terakhir: ${sys.warmTerakhir ? esc(relatif(sys.warmTerakhir.at)) : '-'}</span></div>`;
    };
    const muatAudit = async (qq) => {
      const r = await API.call('audit.list', { q: qq, limit: 60 }); const box = $('#audit', isi); if (!box) return;
      box.innerHTML = r.success ? (r.data.rows.length ? `<div class="table-wrap" style="max-height:380px"><table class="tbl cards"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${r.data.rows.map((a) => `<tr><td data-l="Waktu" class="main-cell"><span class="tnum small">${esc(tgl(a.waktu, 'd MMM yyyy HH:mm'))}</span></td><td data-l="Pengguna">${esc(a.nama)}</td><td data-l="Aksi"><span class="badge plain ${/GAGAL|HAPUS|BUKA|TARIK|BYPASS/.test(a.aksi) ? 'danger' : ''}">${esc(labelAksi(a.aksi))}</span></td><td data-l="Detail" class="small muted" style="white-space:normal">${esc(a.entitas)} • ${esc(a.detail)}</td></tr>`).join('')}</tbody></table></div>` : kosongHTML('Tidak ada log.', 'history')) : kosongHTML(r.message, 'alert');
    };
    const laporanImpor = (d) => `<div class="inset"><div class="strong small">${d.dryRun ? 'Hasil pindai (belum ditulis)' : 'Hasil impor'} — ${esc(d.sumber.nama)}</div><div class="table-wrap mt-8"><table class="tbl"><thead><tr><th>Sheet</th><th class="r">Di sumber</th><th class="r">Ditambah</th><th class="r">Diperbarui</th><th class="r">Dilewati</th></tr></thead><tbody>${Object.keys(d.laporan).map((k) => { const x = d.laporan[k]; return `<tr><td>${esc(k)}${x.catatan ? `<div class="xs muted">${esc(x.catatan)}</div>` : ''}</td><td class="r">${x.sumber}</td><td class="r ok">${x.ditambah}</td><td class="r">${x.diperbarui}</td><td class="r muted">${x.dilewati}</td></tr>`; }).join('')}</tbody></table></div>${d.peringatan.length ? `<ul class="small warn mt-8">${d.peringatan.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>`;
    const gambar = () => { $$('#tabs button', el).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); ({ identitas: tabIdentitas, tampilan: tabTampilan, peran: tabPeran, operasional: tabOperasional, kategori: tabKategori, data: tabData })[tab](); };
    el.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { if (tab === 'tampilan') terapkanTema(Store.app); tab = t.dataset.tab; tema = null; history.replaceState(null, '', '#/pengaturan?tab=' + tab); gambar(); return; }
      const pr = e.target.closest('[data-preset]'); if (pr) { tema = Object.assign({}, tema, PRESET_TEMA[+pr.dataset.preset].t); tabTampilan(); terapkanTema(Object.assign({}, Store.app, { tema })); return; }
      const hi = e.target.closest('[data-hapus-item]'); if (hi) { hi.closest('.chip').remove(); return; }
      const ti = e.target.closest('[data-tambah-item]'); if (ti) { const card = ti.closest('[data-list]'), inp = $('[data-baru]', card), v = inp.value.trim(); if (!v) return; $('[data-chips]', card).insertAdjacentHTML('beforeend', `<span class="chip" style="cursor:default">${esc(v)}<button class="link-btn" data-hapus-item="${esc(v)}">${ic('x', 'sm')}</button></span>`); inp.value = ''; return; }
      const kd = e.target.closest('[data-kb-del]'); if (kd) { kd.closest('.li').remove(); return; }
      const td = e.target.closest('[data-tc-del]'); if (td) { td.closest('.li').remove(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'simpan-id') { const nilai = {}; $$('[data-k]', isi).forEach((i) => { nilai[i.dataset.k] = i.value.trim(); }); if (!nilai.APP_NAMA) return toast('Nama aplikasi wajib diisi.', 'warning'); simpan(nilai, 'Menyimpan identitas…'); }
      if (act === 'logo-reset') { if (await simpan({ LOGO_URL: '' })) tabIdentitas(); }
      if (act === 'tema-reset') { tema = Object.assign({}, J('TEMA')); terapkanTema(Store.app); tabTampilan(); }
      if (act === 'simpan-tema') simpan({ TEMA: tema, FONT_JUDUL: $('#fj', isi).value, FONT_ISI: $('#fi', isi).value }, 'Menerapkan tema…').then((ok) => { if (ok) { cfg.fontJudul = $('#fj', isi) ? $('#fj', isi).value : cfg.fontJudul; } });
      if (act === 'perm-default') { $$('[data-perm]', isi).forEach((c) => { c.checked = ['beranda', 'pos', 'biaya', 'closing'].includes(c.dataset.perm); }); }
      if (act === 'simpan-peran') { const perm = $$('[data-perm]:checked', isi).map((c) => c.dataset.perm); if (!perm.length) return toast('Pilih minimal satu modul untuk Kasir.', 'warning'); const at = {}; $$('[data-at]', isi).forEach((c) => { at[c.dataset.at] = c.checked; }); simpan({ LABEL_OWNER: $('#lo', isi).value.trim() || 'Owner', LABEL_KASIR: $('#lk', isi).value.trim() || 'Kasir', PERM_KASIR: perm, ATURAN_KASIR: at }, 'Menyimpan hak akses…'); }
      if (act === 'simpan-op') simpan({ TARGET_CUP: String(num($('#o-t', isi).value)), PLAFON_BIAYA: String(parseRp($('#o-p', isi).value)), JAM_BUKA: $('#o-b', isi).value, JAM_TUTUP: $('#o-c', isi).value, SALDO_AWAL_PERTAMA: String(parseRp($('#o-s', isi).value)), TANGGAL_MULAI: $('#o-m', isi).value }, 'Menyimpan & menghitung ulang saldo…');
      if (act === 'kb-tambah') { $('#kb', isi).insertAdjacentHTML('beforeend', `<div class="row li" data-kb="n"><input class="input grow" data-f="nama" placeholder="Nama kategori"><div class="input-rp" style="width:150px"><span>Rp</span><input class="input" data-f="acuan" inputmode="numeric" value="0"></div><button class="btn ghost icon-only sm" data-kb-del="n" style="color:var(--c-danger)">${ic('trash', 'sm')}</button></div>`); }
      if (act === 'tc-tambah') { const kb = $$('#kb [data-kb]', isi).map((r) => $('[data-f=nama]', r).value).filter(Boolean); $('#tc', isi).insertAdjacentHTML('beforeend', `<div class="row wrap li" data-tc="n"><input class="input" style="width:120px" data-f="label" placeholder="Label"><select class="input" style="width:220px" data-f="kategori">${kb.map((k) => `<option>${esc(k)}</option>`).join('')}</select><div class="input-rp" style="width:140px"><span>Rp</span><input class="input" data-f="nominal" inputmode="numeric" value="0"></div><input class="input grow" data-f="ket" placeholder="Keterangan otomatis"><button class="btn ghost icon-only sm" data-tc-del="n" style="color:var(--c-danger)">${ic('trash', 'sm')}</button></div>`); }
      if (act === 'simpan-kat') {
        const lama = J('KATEGORI_BIAYA') || [];
        const kb = $$('#kb [data-kb]', isi).map((r) => { const nm = $('[data-f=nama]', r).value.trim(); const o = lama.find((x) => x.nama === nm) || {}; return { nama: nm, acuan: parseRp($('[data-f=acuan]', r).value), ikon: o.ikon || 'truck' }; }).filter((x) => x.nama);
        const tc = $$('#tc [data-tc]', isi).map((r) => ({ label: $('[data-f=label]', r).value.trim(), kategori: $('[data-f=kategori]', r).value, nominal: parseRp($('[data-f=nominal]', r).value), ket: $('[data-f=ket]', r).value.trim() })).filter((x) => x.label && x.nominal);
        const nilai = { KATEGORI_BIAYA: kb, TOMBOL_CEPAT_BIAYA: tc };
        $$('[data-list]', isi).forEach((c) => { nilai[c.dataset.list] = $$('[data-chips] .chip', c).map((x) => x.textContent.trim()); });
        if (!kb.length) return toast('Minimal satu kategori biaya.', 'warning');
        simpan(nilai, 'Menyimpan kategori…');
      }
      if (act === 'sys') muatSys(true);
      if (act === 'im-pindai' || act === 'im-jalan') {
        const src = $('#im-src', isi).value.trim(); if (!src) return toast('Tempel URL spreadsheet sumber.', 'warning');
        const sheets = $$('[data-im]:checked', isi).map((c) => c.dataset.im); const dryRun = act === 'im-pindai';
        if (!dryRun && !(await konfirmasi({ title: 'Jalankan impor?', text: 'Data dari sumber akan ditambahkan ke database. Data yang sudah ada tidak digandakan.', ok: 'Jalankan Import' }))) return;
        Loader.show(dryRun ? 'Memindai sumber…' : 'Mengimpor data…', 'Membaca spreadsheet sumber');
        const r = await API.call('import.jalankan', { sumber: src, sheets, dryRun, timpa: $('#im-timpa', isi).checked }).catch((e2) => ({ success: false, message: e2.message }));
        if (r.success) { await Loader.sukses(r.message); $('#im-hasil', isi).innerHTML = laporanImpor(r.data); if (!dryRun) { Cache.basi(); App.segarkanBoot(); } } else { Loader.hide(); toast(r.message, 'error'); }
      }
      if (act === 'mulai-riil') {
        if (!(await konfirmasi({ title: 'Kosongkan data demo?', text: 'Semua transaksi, biaya, belanja, rekap, opname, dan dokumen demo akan dihapus permanen.', ok: 'Ya, lanjutkan', danger: true }))) return;
        const pin = await mintaPin({ title: 'Konfirmasi PIN Owner', sub: 'Tindakan berisiko tinggi' }); if (!pin) return;
        const r = await tulis('data.mulaiRiil', { pin, saldoAwal: parseRp($('#mr-s', isi).value), tanggalMulai: $('#mr-t', isi).value, kosongkanStok: $('#mr-st', isi).checked, hapusAset: $('#mr-as', isi).checked, nonaktifKasirDemo: $('#mr-k', isi).checked }, { teks: 'Mengosongkan data demo…', sub: 'Menyiapkan pembukuan riil' });
        if (r.success) { Cache.hapusSemua(); await App.segarkanBoot(); location.hash = '#/dashboard'; }
      }
    });
    isi.innerHTML = '<div class="skel h-200"></div>';
    API.call('pengaturan.get', {}).then((r) => { if (!r.success) { isi.innerHTML = `<div class="card">${kosongHTML(r.message, 'alert')}</div>`; return; } cfg = { nilai: r.data.nilai, modul: r.data.modul, khususOwner: r.data.khususOwner, aturanInfo: r.data.aturanInfo, fontJudulOpsi: r.data.fontJudul, fontIsiOpsi: r.data.fontIsi, fontJudul: r.data.nilai.FONT_JUDUL, fontIsi: r.data.nilai.FONT_ISI, demo: r.data.demo }; gambar(); }).catch((e) => { isi.innerHTML = `<div class="card">${kosongHTML(e.message, 'alert')}</div>`; });
    return () => { if (tab === 'tampilan' && Store.app) terapkanTema(Store.app); };
  }
};

/* ============================== DOKUMEN RESMI (Doc Engine) ============================== */
Pages.dokumen = {
  izin: () => Store.punya('dokumen') || !!Store.aturan.ajukanDokumen,
  render(el, q) {
    let tab = 'dokumen', status = 'Semua', tpl = [], docs = [], pj = [];
    const penuh = Store.punya('dokumen');
    el.innerHTML = `${kepala({ eyebrow: 'Doc Engine • Template Google Docs → PDF ber-QR', judul: 'Dokumen Resmi', desc: 'Slip tutup kasir, nota belanja, berita acara opname, dan laporan bulanan — diisi otomatis dari data, ditandatangani dengan PIN, terbit sebagai PDF ber-QR yang dapat diverifikasi.', acts: `<button class="btn primary" data-act="buat">${ic('plus')}Buat Dokumen</button>` })}
      <div class="row wrap between mb-16"><div id="tabs"></div><div id="ring" class="row wrap gap-8"></div></div><div id="isi"></div>`;
    const isi = $('#isi', el);
    $('#tabs', el).innerHTML = segHTML([{ v: 'dokumen', l: 'Dokumen' }].concat(penuh ? [{ v: 'template', l: 'Template' }, { v: 'pejabat', l: 'Penanda Tangan' }] : []), tab);
    pasangSeg($('#tabs .seg', el), (v) => { tab = v; gambar(); });
    const gambar = () => {
      const st = { Semua: docs.length, MENUNGGU_TTD: 0, DRAF: 0, TERBIT: 0, DITARIK: 0 }; docs.forEach((d) => { st[d.status]++; });
      $('#ring', el).innerHTML = ['TERBIT', 'MENUNGGU_TTD', 'DRAF', 'DITARIK'].map((s) => `${badgeStatus(s).replace('</span>', ' ' + st[s] + '</span>')}`).join('');
      if (tab === 'dokumen') {
        const rows = docs.filter((d) => status === 'Semua' || d.status === status);
        isi.innerHTML = `<div class="card fade-swap"><div class="chips scroll mb-16">${['Semua', 'MENUNGGU_TTD', 'DRAF', 'TERBIT', 'DITARIK'].map((s) => `<button class="chip ${s === status ? 'on' : ''}" data-st="${s}">${s === 'Semua' ? 'Semua' : { MENUNGGU_TTD: 'Menunggu TTD', DRAF: 'Draf', TERBIT: 'Terbit', DITARIK: 'Ditarik' }[s]} <span class="n">${st[s]}</span></button>`).join('')}</div>
          ${rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Dokumen</th><th>Nomor</th><th class="c">Tanda Tangan</th><th>Dibuat</th><th class="c">Status</th><th class="r"></th></tr></thead><tbody class="stagger">${rows.map((d, i) => { const ok = d.penandatangan.filter((s) => s.status === 'DISETUJUI').length; const giliran = d.status === 'MENUNGGU_TTD' && (d.penandatangan.find((s) => s.status !== 'DISETUJUI') || {}).idUser === Store.me.id; return `<tr style="--i:${i}" data-buka="${esc(d.id)}" class="${giliran ? 'flash' : ''}"><td data-l="Dokumen" class="main-cell"><div class="row gap-8"><span class="icon-box s ${d.status === 'TERBIT' ? 'success' : d.status === 'DITARIK' ? 'danger' : d.status === 'MENUNGGU_TTD' ? 'warning' : 'info'}">${ic('doc', 'sm')}</span><div><b>${esc(d.judul)}</b><div class="xs muted">${esc(d.templateNama)} • <span class="id">${esc(d.id)}</span></div></div></div></td><td data-l="Nomor" class="tnum small">${esc(d.nomor || '—')}</td><td data-l="TTD" class="c"><span class="badge ${ok === d.penandatangan.length ? 'success' : 'plain'}">${ok}/${d.penandatangan.length}</span>${giliran ? '<div class="xs warn strong mt-4">Giliran Anda</div>' : ''}</td><td data-l="Dibuat" class="small">${esc(d.oleh)}<div class="xs muted">${esc(relatif(d.dibuat))}</div></td><td data-l="Status" class="c">${badgeStatus(d.status)}</td><td class="r">${ic('chev-r', 'sm')}</td></tr>`; }).join('')}</tbody></table></div>` : kosongHTML('Belum ada dokumen.', 'doc')}</div>`;
      } else if (tab === 'template') {
        isi.innerHTML = `<div class="stack fade-swap"><div class="grid g-2">${tpl.map((t) => `<div class="card lift"><div class="row top"><span class="icon-box">${ic(t.engine === 'sheets' ? 'grid' : t.engine === 'slides' ? 'image' : 'file')}</span><div class="grow"><h3>${esc(t.nama)}</h3><div class="xs muted"><span class="id">${esc(t.kode)}</span> • Google ${t.engine === 'docs' ? 'Docs' : t.engine === 'sheets' ? 'Sheets' : 'Slides'} • versi ${t.versi}</div></div>${t.aktif ? '<span class="badge success plain">Aktif</span>' : '<span class="badge danger plain">Nonaktif</span>'}</div>
          <p class="small muted mt-8">${esc(t.deskripsi || '')}</p>
          <div class="row wrap gap-8 mt-12"><span class="badge plain">${t.skema.bidang.length} field</span><span class="badge plain">${t.skema.blok.length} blok berulang</span><span class="badge plain">${t.slotTtd.length} slot TTD</span>${t.sumberData ? '<span class="badge gold plain">Isi otomatis</span>' : ''}</div>
          <div class="xs muted mt-8">Format nomor: <span class="tnum">${esc(t.formatNomor)}</span></div>
          <div class="row wrap gap-8 mt-12"><a class="btn sm" href="${esc(t.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Edit di Google</a><button class="btn sm" data-pindai="${esc(t.id)}">${ic('refresh', 'sm')}Pindai Ulang</button><button class="btn sm" data-skema="${esc(t.id)}">${ic('eye', 'sm')}Skema</button>${Store.owner() ? `<button class="btn sm" data-tpl-edit="${esc(t.id)}">${ic('edit', 'sm')}</button>` : ''}</div></div>`).join('')}</div>
          ${Store.owner() ? `<div class="card"><div class="card-head"><div><h3>Daftarkan Template Baru</h3><div class="sub">Desain sendiri di Google Docs/Sheets/Slides memakai placeholder, lalu tempel URL-nya di sini.</div></div><button class="btn primary sm" data-act="daftar">${ic('plus', 'sm')}Daftarkan</button></div>
            <div class="formula small">{{NAMA_FIELD}} • {{TOTAL|rupiah}} • {{TOTAL|terbilang:rupiah}} • {{TANGGAL_X|tanggal:dd MMMM yyyy}} • {{CATATAN|bawaan:-}}<br>{{#ITEM}}{{ITEM.NAMA}} … {{/ITEM}} (baris tabel berulang) • {{?SYARAT}}…{{/SYARAT}}<br>Sistem: {{NOMOR}} {{TANGGAL}} {{INSTITUSI_NAMA}} {{KOTA}} {{QR}} {{KODE_VERIFIKASI}} {{URL_VERIFIKASI}} • TTD: {{JABATAN_1}} {{TTD_1}} {{NAMA_PEJABAT_1}}</div></div>` : ''}</div>`;
      } else {
        isi.innerHTML = `<div class="card fade-swap"><div class="card-head"><div><h3>Penanda Tangan (Pejabat)</h3><div class="sub">Tiap penanda tangan terhubung ke akun pengguna — tanda tangan memakai PIN akun tersebut.</div></div>${Store.owner() ? `<button class="btn primary sm" data-act="pj-baru">${ic('plus', 'sm')}Tambah</button>` : ''}</div>${pj.map((p) => `<div class="li"><span class="avatar s">${esc(p.nama.split(' ').map((w) => w[0]).slice(0, 2).join(''))}</span><div class="grow"><div class="t">${esc((p.gelar ? p.gelar + ' ' : '') + p.nama)}</div><div class="s">${esc(p.jabatan)} • akun ${esc(p.idUser)} • <span class="id">${esc(p.id)}</span></div></div>${p.aktif ? '<span class="badge success plain">Aktif</span>' : '<span class="badge danger plain">Nonaktif</span>'}${Store.owner() ? `<button class="btn ghost icon-only sm" data-pj="${esc(p.id)}">${ic('edit', 'sm')}</button>` : ''}</div>`).join('') || kosongHTML('Belum ada penanda tangan', 'users')}</div>`;
      }
    };
    const detail = async (id) => {
      Loader.show('Membuka dokumen…');
      const r = await API.call('de.dokumen.get', { id }).catch((e) => ({ success: false, message: e.message })); Loader.hide();
      if (!r.success) return toast(r.message, 'error');
      const d = r.data, giliran = d.penandatangan.find((s) => s.status !== 'DISETUJUI');
      const sayaGiliran = d.status === 'MENUNGGU_TTD' && giliran && giliran.idUser === Store.me.id;
      const nilai = d.data.nilai || {};
      if (d.urlVerifikasi && !/^https?:/.test(d.urlVerifikasi)) d.urlVerifikasi = location.origin + location.pathname.replace(/[^/]*$/, '') + d.urlVerifikasi;
      const qrSvg = d.status === 'TERBIT' && d.urlVerifikasi && window.QR_ ? QR_.svg(d.urlVerifikasi, 4) : '';
      const m = Modal.open({
        title: esc(d.judul), sub: `${esc(d.templateNama)} • ${d.nomor ? 'No. ' + esc(d.nomor) : 'belum bernomor'} • dibuat ${esc(d.oleh)}`, size: 'lg',
        body: `<div class="row wrap gap-8 mb-12">${badgeStatus(d.status)}${d.catatan ? `<span class="badge ${d.status === 'DITARIK' ? 'danger' : 'warning'} plain">${esc(d.catatan).slice(0, 120)}</span>` : ''}</div>
          <div class="grid g-2"><div><div class="eyebrow mb-8">Penanda Tangan</div>${d.penandatangan.map((s) => `<div class="sig"><span class="icon-box s ${s.status === 'DISETUJUI' ? 'success' : giliran && giliran.slot === s.slot && d.status === 'MENUNGGU_TTD' ? 'warning' : ''}">${ic(s.status === 'DISETUJUI' ? 'check' : 'sign', 'sm')}</span><div class="grow"><div class="small strong">${esc(s.label)}</div><div class="xs muted">${esc(s.nama)} • ${esc(s.jabatan)}</div>${s.status === 'DISETUJUI' ? `<div class="xs ok">Disahkan ${esc(tgl(s.waktu, 'd MMM yyyy HH:mm'))} • ${esc(s.metode)}</div>` : ''}</div></div>`).join('')}
            ${d.riwayat.length ? `<div class="eyebrow mt-16 mb-8">Riwayat</div><div class="timeline">${d.riwayat.map((h) => `<div class="ev ${h.status === 'DISETUJUI' ? 'ok' : 'bad'}"><div class="small"><b>${esc(h.status)}</b> slot ${h.slot} oleh ${esc(h.oleh)}</div><div class="xs muted">${esc(tgl(h.waktu, 'd MMM HH:mm'))} ${esc(h.catatan)}</div></div>`).join('')}</div>` : ''}</div>
            <div>${d.status === 'TERBIT' ? `<div class="eyebrow mb-8">Verifikasi Publik</div><div class="row top gap-12"><div class="qr-box">${qrSvg}</div><div class="grow small"><div class="muted xs">Kode</div><b class="tnum">${esc(d.kodeVerifikasi)}</b><div class="muted xs mt-8">SHA-256 PDF</div><div class="id" style="word-break:break-all">${esc(d.hashPdf)}</div><button class="btn xs mt-8" data-salin="${esc(d.urlVerifikasi)}">${ic('copy', 'sm')}Salin tautan</button></div></div>` : `<div class="eyebrow mb-8">Isian Utama</div><div class="inset">${Object.keys(nilai).slice(0, 10).map((k) => `<div class="sum-row"><span class="muted small">${esc(k.replace(/_/g, ' ').toLowerCase())}</span><span class="v small">${esc(typeof nilai[k] === 'number' && /TOTAL|SALDO|OMSET|TIPS|BELANJA|PENGELUARAN|LABA|NOTA/.test(k) ? rp(nilai[k]) : nilai[k])}</span></div>`).join('')}</div>`}
              <div class="xs muted mt-8">${Object.keys(d.data.blok || {}).map((b) => b + ': ' + d.data.blok[b].length + ' baris').join(' • ')}</div></div></div>`,
        foot: [
          d.status === 'DRAF' ? `<button class="btn danger" data-a="hapus">${ic('trash', 'sm')}Hapus</button><button class="btn" data-a="ubah">${ic('edit', 'sm')}Ubah Isian</button><button class="btn" data-a="pratinjau">${ic('eye', 'sm')}Pratinjau PDF</button><button class="btn primary" data-a="ajukan">${ic('send', 'sm')}Ajukan TTD</button>` : '',
          d.status === 'MENUNGGU_TTD' ? `<button class="btn" data-a="pratinjau">${ic('eye', 'sm')}Pratinjau</button>${sayaGiliran || Store.owner() ? `<button class="btn danger" data-a="tolak">${ic('x', 'sm')}Tolak</button>` : ''}${sayaGiliran ? `<button class="btn primary" data-a="ttd">${ic('sign', 'sm')}Tanda Tangani (PIN)</button>` : ''}${!sayaGiliran && Store.owner() && giliran ? `<button class="btn" data-a="bypass">${ic('key', 'sm')}Bypass Owner</button>` : ''}${!giliran && Store.owner() ? `<button class="btn primary" data-a="ulang">${ic('refresh', 'sm')}Terbitkan Ulang</button>` : ''}` : '',
          d.status === 'TERBIT' ? `${Store.owner() ? `<button class="btn danger" data-a="tarik">${ic('x', 'sm')}Tarik</button>` : ''}${d.berkas && d.berkas.url ? `<a class="btn" href="${esc(d.berkas.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Drive</a>` : ''}<a class="btn" href="${esc(d.urlVerifikasi)}" target="_blank" rel="noopener">${ic('shield', 'sm')}Cek Verifikasi</a><button class="btn primary" data-a="unduh">${ic('download', 'sm')}Unduh PDF</button>` : ''
        ].join('')
      });
      m.el.addEventListener('click', async (e) => {
        const s = e.target.closest('[data-salin]'); if (s) { navigator.clipboard.writeText(s.dataset.salin).then(() => toast('Tautan verifikasi disalin.', 'success')); return; }
        const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a;
        if (act === 'hapus' && await konfirmasi({ title: 'Hapus draf?', danger: true, ok: 'Hapus' })) { if ((await tulis('de.dokumen.hapus', { id }, { teks: 'Menghapus draf…' })).success) { m.close(); muat(true); } }
        if (act === 'ubah') { m.close(); editor(tpl.find((t) => t.id === d.templateId), d); }
        if (act === 'ajukan') { if ((await tulis('de.dokumen.ajukan', { id }, { teks: 'Mengajukan dokumen…' })).success) { m.close(); muat(true); detail(id); } }
        if (act === 'pratinjau' || act === 'unduh') { Loader.show(act === 'unduh' ? 'Mengunduh PDF…' : 'Membuat pratinjau PDF…', 'Menyusun dokumen dari template Google'); const rr = await API.call(act === 'unduh' ? 'de.dokumen.unduh' : 'de.dokumen.pratinjau', { id }).catch((e2) => ({ success: false, message: e2.message })); if (rr.success) { await Loader.sukses(); if (act === 'unduh') unduhBase64(rr.data.nama, rr.data.base64); else bukaBase64(rr.data.base64); } else { Loader.hide(); toast(rr.message, 'error'); } }
        if (act === 'ttd' || act === 'bypass' || act === 'ulang') {
          let alasan = ''; if (act === 'bypass') { alasan = await mintaTeks({ title: 'Bypass tanda tangan', label: 'Alasan bypass (tercatat di audit & dokumen)', min: 5, ok: 'Lanjut' }); if (!alasan) return; }
          const pin = await mintaPin({ title: act === 'ttd' ? 'Tanda tangan elektronik' : 'Konfirmasi PIN Owner', sub: act === 'ttd' ? 'Slot: ' + giliran.label : '' }); if (!pin) return;
          const rr = await tulis('de.dokumen.setujui', { id, slot: giliran ? giliran.slot : undefined, pin, bypass: act === 'bypass', alasan, baseUrl: location.origin + location.pathname.replace(/[^/]*$/, '') }, { teks: 'Menandatangani…', sub: 'Bila ini tanda tangan terakhir, PDF ber-QR sedang dibuat (±10 detik)' });
          if (rr.success) { m.close(); muat(true); detail(id); }
        }
        if (act === 'tolak') { const cat = await mintaTeks({ title: 'Tolak dokumen', label: 'Alasan penolakan', min: 3, ok: 'Lanjut' }); if (!cat) return; const pin = await mintaPin({ title: 'Konfirmasi PIN' }); if (!pin) return; if ((await tulis('de.dokumen.tolak', { id, catatan: cat, pin }, { teks: 'Mengembalikan ke draf…' })).success) { m.close(); muat(true); } }
        if (act === 'tarik') { const al = await mintaTeks({ title: 'Tarik dokumen ' + d.nomor, label: 'Alasan penarikan (verifikasi akan menyatakan tidak berlaku)', min: 5, ok: 'Lanjut' }); if (!al) return; const pin = await mintaPin({ title: 'Konfirmasi PIN Owner' }); if (!pin) return; const rr = await tulis('de.dokumen.tarik', { id, alasan: al, pin }, { teks: 'Menarik dokumen…' }); if (rr.success) { m.close(); muat(true); } }
      });
    };
    const pilihTemplate = () => {
      const list = tpl.filter((t) => t.aktif);
      const m = Modal.open({ title: 'Buat Dokumen Baru', sub: 'Pilih template', size: 'lg', body: `<div class="grid g-2">${list.map((t) => `<button class="qa" data-t="${esc(t.id)}"><span class="icon-box">${ic('doc')}</span><div><div class="t">${esc(t.nama)}</div><div class="s">${esc(t.deskripsi || t.kode)}</div></div>${ic('chev-r', 'chev')}</button>`).join('')}</div>` });
      $$('[data-t]', m.el).forEach((b) => b.onclick = () => { m.close(); pilihRef(tpl.find((t) => t.id === b.dataset.t)); });
    };
    const pilihRef = async (t) => {
      if (!t.sumberData) return editor(t, null);
      let input = '';
      if (t.sumberData === 'closing' || t.sumberData === 'opname') input = `<div class="field"><label>Tanggal ${t.sumberData === 'closing' ? 'closing' : 'stok opname'}</label><input type="date" class="input" id="ref" value="${addDays(hariIni(), t.sumberData === 'closing' ? -1 : 0)}" max="${hariIni()}"></div>`;
      else if (t.sumberData === 'bulanan') input = `<div class="field"><label>Bulan laporan</label><input type="month" class="input" id="ref" value="${addDays(awalBulan(), -1).slice(0, 7)}"></div>`;
      else if (t.sumberData === 'belanja') { const b = Cache.get(Cache.key('belanja.list', Param.bulan30())); const r = b ? b.d.rows : (await API.call('belanja.list', Param.bulan30())).data.rows; input = `<div class="field"><label>Nota belanja</label><select class="input" id="ref">${r.map((n) => `<option value="${esc(n.id)}">${esc(n.id)} • ${tgl(n.tanggal, 'd MMM')} • ${rp(n.total)}</option>`).join('')}</select></div>`; }
      const m = Modal.open({ title: esc(t.nama), sub: 'Data diambil otomatis dari buku kas, lalu bisa Anda sunting.', size: 'sm', body: input, foot: `<button class="btn" data-kosong>Isi manual</button><button class="btn primary" data-ok>${ic('sparkle', 'sm')}Isi Otomatis</button>` });
      $('[data-kosong]', m.el).onclick = () => { m.close(); editor(t, null); };
      $('[data-ok]', m.el).onclick = async () => { const ref = $('#ref', m.el).value; m.close(); Loader.show('Mengambil data…', 'Menyusun isian dari pembukuan'); const r = await API.call('de.dokumen.prefill', { templateId: t.id, ref }).catch((e) => ({ success: false, message: e.message })); Loader.hide(); if (!r.success) return toast(r.message, 'error'); editor(t, { data: r.data.data, judul: r.data.judul, refId: ref }); };
    };
    const inputBidang = (b, v) => {
      const val = v === undefined || v === null ? '' : v;
      if (b.tipe === 'teks_panjang') return `<textarea class="input" data-b="${b.kunci}">${esc(val)}</textarea>`;
      if (b.tipe === 'tanggal') return `<input type="date" class="input" data-b="${b.kunci}" value="${esc(String(val).slice(0, 10))}">`;
      if (b.tipe === 'uang') return `<div class="input-rp"><span>Rp</span><input class="input" data-b="${b.kunci}" data-uang inputmode="numeric" value="${val === '' ? '' : fmtNum(val)}"></div>`;
      if (b.tipe === 'angka') return `<input class="input" data-b="${b.kunci}" inputmode="decimal" value="${esc(val)}">`;
      return `<input class="input" data-b="${b.kunci}" value="${esc(val)}" ${b.tipe === 'email' ? 'type="email"' : ''}>`;
    };
    const editor = (t, dok) => {
      if (!t) return toast('Template tidak ditemukan.', 'error');
      const data = (dok && dok.data) || { nilai: {}, blok: {}, kondisi: {} };
      const pjAktif = pj.filter((p) => p.aktif);
      const blokHTML = (bk) => { const rows = data.blok[bk.nama] || []; return `<div class="card flat pad-s mt-12" data-blok="${bk.nama}"><div class="row between mb-8"><b class="small">${esc(bk.label)} <span class="muted">(${rows.length} baris)</span></b><button class="btn xs" data-tambah-baris>${ic('plus', 'sm')}Baris</button></div><div class="table-wrap blok-tbl"><table class="tbl"><thead><tr>${bk.kolom.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r) => `<tr>${bk.kolom.map((c) => `<td><input class="input" data-c="${c.kunci}" value="${esc(r[c.kunci] === undefined ? '' : r[c.kunci])}"></td>`).join('')}<td><button class="btn ghost icon-only xs" data-hapus-baris>${ic('x', 'sm')}</button></td></tr>`).join('')}</tbody></table></div></div>`; };
      const m = Modal.open({
        title: (dok && dok.id ? 'Ubah ' : 'Isi ') + esc(t.nama), sub: 'Form dibangun otomatis dari placeholder template (versi ' + t.versi + ')', size: 'xl',
        body: `<div class="field"><label>Judul dokumen</label><input class="input" id="judul" value="${esc((dok && dok.judul) || t.nama)}"></div>
          <div class="form-grid mt-12">${t.skema.bidang.map((b) => `<div class="field ${b.tipe === 'teks_panjang' ? 'span-2' : ''}"><label>${esc(b.label)} ${b.wajib ? '' : '<span class="hint">opsional</span>'}</label>${inputBidang(b, data.nilai[b.kunci])}</div>`).join('')}</div>
          ${t.skema.kondisi.map((k) => `<label class="check mt-8"><input type="checkbox" data-k="${k.kunci}" ${data.kondisi[k.kunci] ? 'checked' : ''}><span class="small">Tampilkan bagian: <b>${esc(k.label)}</b></span></label>`).join('')}
          ${t.skema.blok.map(blokHTML).join('')}
          <div class="eyebrow mt-20 mb-8">Penanda Tangan</div><div class="form-grid">${t.slotTtd.map((s) => { const cur = (dok && dok.penandatangan || []).find((x) => x.slot === s.slot); const def = cur ? cur.pejabatId : s.pejabatId === 'PEMBUAT' ? (pjAktif.find((p) => p.idUser === Store.me.id) || {}).id : s.pejabatId; return `<div class="field"><label>Slot ${s.slot}: ${esc(s.label)}</label><select class="input" data-slot="${s.slot}">${pjAktif.map((p) => `<option value="${esc(p.id)}" ${p.id === def ? 'selected' : ''}>${esc(p.nama)} — ${esc(p.jabatan)}</option>`).join('')}</select></div>`; }).join('')}</div>`,
        foot: `<button class="btn" data-x2>Batal</button><button class="btn" data-simpan="draf">${ic('check', 'sm')}Simpan Draf</button><button class="btn primary" data-simpan="ajukan">${ic('send', 'sm')}Simpan & Ajukan TTD</button>`
      });
      m.el.addEventListener('input', (e) => { if (e.target.matches('[data-uang]')) { const v = parseRp(e.target.value); e.target.value = v ? fmtNum(v) : ''; } });
      m.el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-x2]')) return m.close();
        const tb = e.target.closest('[data-tambah-baris]'); if (tb) { const card = tb.closest('[data-blok]'); const bk = t.skema.blok.find((b) => b.nama === card.dataset.blok); $('tbody', card).insertAdjacentHTML('beforeend', `<tr>${bk.kolom.map((c) => `<td><input class="input" data-c="${c.kunci}"></td>`).join('')}<td><button class="btn ghost icon-only xs" data-hapus-baris>${ic('x', 'sm')}</button></td></tr>`); return; }
        const hb = e.target.closest('[data-hapus-baris]'); if (hb) { hb.closest('tr').remove(); return; }
        const sv = e.target.closest('[data-simpan]'); if (!sv) return;
        const nilai = {}; t.skema.bidang.forEach((b) => { const inp = $(`[data-b="${b.kunci}"]`, m.el); if (!inp) return; nilai[b.kunci] = b.tipe === 'uang' ? parseRp(inp.value) : b.tipe === 'angka' ? (inp.value === '' ? '' : num(inp.value.replace(',', '.'))) : inp.value; });
        const blok = {}; $$('[data-blok]', m.el).forEach((card) => { blok[card.dataset.blok] = $$('tbody tr', card).map((tr) => { const o = {}; $$('[data-c]', tr).forEach((i) => { o[i.dataset.c] = /^-?\d+(\.\d+)?$/.test(i.value) ? num(i.value) : i.value; }); return o; }); });
        const kondisi = {}; $$('[data-k]', m.el).forEach((c) => { kondisi[c.dataset.k] = c.checked; });
        const pen = $$('[data-slot]', m.el).map((s) => ({ slot: +s.dataset.slot, pejabatId: s.value }));
        const r = await tulis('de.dokumen.simpan', { id: dok && dok.id, templateId: t.id, data: { nilai, blok, kondisi }, judul: $('#judul', m.el).value, ref: dok && (dok.refId || dok.ref) || '', penandatangan: pen }, { teks: 'Menyimpan draf…' });
        if (!r.success) return;
        const id = r.data.id; m.close();
        if (sv.dataset.simpan === 'ajukan') { const a = await tulis('de.dokumen.ajukan', { id }, { teks: 'Mengajukan…' }); if (!a.success) { muat(true); return detail(id); } }
        muat(true); detail(id);
      });
    };
    const daftarTpl = (t) => {
      const baru = !t;
      const m = Modal.open({ title: baru ? 'Daftarkan Template Baru' : 'Ubah Template ' + esc(t.kode), size: 'lg', body: `<div class="form-grid">${baru ? `<div class="field span-2"><label>URL Google Docs / Sheets / Slides</label><input class="input" id="t-u" placeholder="https://docs.google.com/document/d/…/edit"></div><div class="field"><label>Kode (huruf besar)</label><input class="input" id="t-k" placeholder="SURAT_TUGAS"></div>` : ''}<div class="field ${baru ? '' : 'span-2'}"><label>Nama template</label><input class="input" id="t-n" value="${esc(t ? t.nama : '')}"></div><div class="field"><label>Format nomor</label><input class="input" id="t-f" value="${esc(t ? t.formatNomor : '{URUT}/KODE/{BULAN_ROMAWI}/{TAHUN}')}"></div><div class="field"><label>Deskripsi</label><input class="input" id="t-d" value="${esc(t ? t.deskripsi : '')}"></div>${baru ? '' : `<div class="field"><label class="row gap-8"><span class="switch"><input type="checkbox" id="t-a" ${t.aktif ? 'checked' : ''}><span></span></span>Template aktif</label></div>`}</div><p class="xs muted mt-12">Template harus bisa diakses akun Google pemilik aplikasi. Slot tanda tangan dideteksi dari placeholder {{TTD_1}}, {{TTD_2}}, … dan bisa diatur penanda tangannya saat membuat dokumen.</p>`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check')}${baru ? 'Pindai & Daftarkan' : 'Simpan'}</button>` });
      $('[data-b]', m.el).onclick = () => m.close();
      $('[data-ok]', m.el).onclick = async () => { const r = baru ? await tulis('de.template.daftar', { url: $('#t-u', m.el).value, kode: $('#t-k', m.el).value, nama: $('#t-n', m.el).value, formatNomor: $('#t-f', m.el).value, deskripsi: $('#t-d', m.el).value }, { teks: 'Memindai template…', sub: 'Mencari placeholder {{…}}' }) : await tulis('de.template.simpan', { id: t.id, nama: $('#t-n', m.el).value, formatNomor: $('#t-f', m.el).value, deskripsi: $('#t-d', m.el).value, aktif: $('#t-a', m.el).checked }, { teks: 'Menyimpan template…' }); if (r.success) { m.close(); muat(true); } };
    };
    const editPj = (p) => {
      API.call('pengguna.list', {}).then((ru) => {
        const users = ru.success ? ru.data.rows : []; p = p || { nama: '', gelar: '', jabatan: '', nip: '', idUser: '', aktif: true };
        const m = Modal.open({ title: p.id ? 'Ubah Penanda Tangan' : 'Tambah Penanda Tangan', body: `<div class="form-grid"><div class="field"><label>Nama</label><input class="input" id="p-n" value="${esc(p.nama)}"></div><div class="field"><label>Gelar (opsional)</label><input class="input" id="p-g" value="${esc(p.gelar)}"></div><div class="field"><label>Jabatan</label><input class="input" id="p-j" value="${esc(p.jabatan)}"></div><div class="field"><label>NIP / ID (opsional)</label><input class="input" id="p-i" value="${esc(p.nip)}"></div><div class="field span-2"><label>Akun pengguna (PIN dipakai untuk tanda tangan)</label><select class="input" id="p-u">${users.map((u) => `<option value="${esc(u.id)}" ${u.id === p.idUser ? 'selected' : ''}>${esc(u.nama)} — ${esc(u.labelPeran)}</option>`).join('')}</select></div><div class="field"><label class="row gap-8"><span class="switch"><input type="checkbox" id="p-a" ${p.aktif ? 'checked' : ''}><span></span></span>Aktif</label></div></div>`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>Simpan</button>` });
        $('[data-b]', m.el).onclick = () => m.close();
        $('[data-ok]', m.el).onclick = async () => { if ((await tulis('de.pejabat.simpan', { id: p.id, nama: $('#p-n', m.el).value, gelar: $('#p-g', m.el).value, jabatan: $('#p-j', m.el).value, nip: $('#p-i', m.el).value, idUser: $('#p-u', m.el).value, aktif: $('#p-a', m.el).checked }, { teks: 'Menyimpan…' })).success) { m.close(); muat(true); } };
      });
    };
    el.addEventListener('click', async (e) => {
      const st = e.target.closest('[data-st]'); if (st) { status = st.dataset.st; gambar(); return; }
      const bk = e.target.closest('[data-buka]'); if (bk) return detail(bk.dataset.buka);
      const pi = e.target.closest('[data-pindai]'); if (pi) { const r = await tulis('de.template.pindai', { id: pi.dataset.pindai }, { teks: 'Memindai ulang template…' }); if (r.success) muat(true); return; }
      const sk = e.target.closest('[data-skema]'); if (sk) { const t = tpl.find((x) => x.id === sk.dataset.skema); Modal.open({ title: 'Skema ' + esc(t.nama), size: 'lg', body: `<table class="tbl"><thead><tr><th>Placeholder</th><th>Label</th><th>Tipe</th><th>Pengubah</th></tr></thead><tbody>${t.skema.bidang.map((b) => `<tr><td class="id">{{${esc(b.kunci)}}}</td><td>${esc(b.label)}</td><td><span class="badge plain">${esc(b.tipe)}</span></td><td class="small muted">${esc(b.pengubah.join(' | '))}</td></tr>`).join('')}</tbody></table>${t.skema.blok.map((b) => `<div class="mt-12"><b>Blok {{#${esc(b.nama)}}}</b>: ${b.kolom.map((c) => esc(c.kunci)).join(', ')}</div>`).join('')}<div class="mt-12 small muted">Sistem: ${esc(t.skema.sistem.join(', '))} • Slot TTD: ${t.skema.slot.join(', ')}</div>` }); return; }
      const te = e.target.closest('[data-tpl-edit]'); if (te) return daftarTpl(tpl.find((x) => x.id === te.dataset.tplEdit));
      const pe = e.target.closest('[data-pj]'); if (pe) return editPj(pj.find((x) => x.id === pe.dataset.pj));
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'buat') { if (!tpl.length) return toast('Template belum dimuat.', 'warning'); pilihTemplate(); }
      if (a.dataset.act === 'daftar') daftarTpl(null);
      if (a.dataset.act === 'pj-baru') editPj(null);
    });
    const muat = (force) => {
      const o = { maxAge: force ? 0 : 20000, force };
      pakai('de.dokumen.list', {}, (d) => { docs = d.rows; gambar(); }, o);
      pakai('de.template.list', {}, (d) => { tpl = d.rows; if (tab === 'template') gambar(); }, o);
      pakai('de.pejabat.list', {}, (d) => { pj = d.rows; if (tab === 'pejabat') gambar(); }, o);
    };
    isi.innerHTML = '<div class="skel h-200"></div>';
    muat(false);
    if (q.id) setTimeout(() => detail(q.id), 200);
  }
};
