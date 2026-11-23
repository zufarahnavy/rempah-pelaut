/* =====================================================================
   Halaman administrasi: Menu, Pengguna & PIN, Pengaturan, Dokumen Resmi
   ===================================================================== */
'use strict';

/* ============================== MENU ============================== */
Pages.menu = {
  render(el) {
    let kat = 'Semua', cari = '', stat = 'semua', data = null;
    const P = Pilih(el, { onChange: () => bar() });
    const bar = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm" data-bulk="aktif">Aktifkan</button><button class="btn sm" data-bulk="nonaktif">Nonaktifkan</button><button class="btn sm danger" data-bulk="hapus">${ic('trash', 'sm')}Hapus</button>`); };
    el.innerHTML = `${kepala({ judul: 'Menu', desc: 'Nama, kategori, harga, foto, dan urutan tampil di POS. Menu nonaktif tidak muncul di kasir. Menu yang sudah pernah terjual tidak bisa dihapus, hanya dinonaktifkan.', acts: `<button class="btn primary" data-act="baru">${ic('plus', 'sm')}Menu baru</button>` })}
      <div class="card"><div class="row wrap between gap-8 mb-12"><div class="chips scroll" id="kat"></div><div class="row gap-8"><div id="stat"></div><div class="search" style="min-width:200px">${ic('search')}<input class="input" id="cari" placeholder="Cari menu…"></div></div></div><div id="bulk"></div><div id="tbl"><div class="skel h-200"></div></div></div>`;
    $('#stat', el).innerHTML = segHTML([{ v: 'semua', l: 'Semua' }, { v: 'aktif', l: 'Aktif' }, { v: 'nonaktif', l: 'Nonaktif' }], stat, 'mini');
    pasangSeg($('#stat .seg', el), (v) => { stat = v; tabel(); });
    $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); tabel(); }, 180));
    const tabel = () => {
      if (!data) return;
      const kats = ['Semua'].concat(Store.opsi.kategoriMenu || [...new Set(data.rows.map((m) => m.kategori))]);
      $('#kat', el).innerHTML = kats.map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)} <span class="n">${k === 'Semua' ? data.rows.length : data.rows.filter((m) => m.kategori === k).length}</span></button>`).join('');
      const rows = data.rows.filter((m) => (kat === 'Semua' || m.kategori === kat) && (stat === 'semua' || (stat === 'aktif') === !!m.aktif) && (!cari || (m.nama + ' ' + m.id).toLowerCase().includes(cari))).sort((a, b) => (a.urutan - b.urutan) || a.nama.localeCompare(b.nama));
      $('#tbl', el).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${P.th()}<th>Menu</th><th>Kategori</th><th class="r">Harga</th><th class="r">Urutan</th><th class="c">Aktif di POS</th><th></th></tr></thead><tbody>${rows.map((m) => `<tr class="${m.aktif ? '' : 'redup'}">${P.td(m.id)}<td data-l="Menu" class="main-cell"><div class="row gap-8"><img class="thumb" src="${esc(fotoUrl(m.foto))}" alt="" loading="lazy" onerror="this.src='assets/img/menu/default.svg'"><div><b>${esc(m.nama)}</b><div class="id">${esc(m.id)}${m.deskripsi ? ' · ' + esc(m.deskripsi).slice(0, 60) : ''}</div></div></div></td><td data-l="Kategori">${esc(m.kategori)}</td><td data-l="Harga" class="r"><b class="tnum">${m.dinamis ? rp(m.hargaMin) + ' – ' + rp(m.hargaMaks) : rp(m.harga)}</b>${m.dinamis ? '<div class="xs muted">harga bisa diubah kasir</div>' : ''}</td><td data-l="Urutan" class="r tnum">${m.urutan}</td><td data-l="Aktif" class="c"><label class="switch" title="${m.aktif ? 'Nonaktifkan' : 'Aktifkan'}"><input type="checkbox" data-aktif="${esc(m.id)}" ${m.aktif ? 'checked' : ''} aria-label="Aktif di POS"><span></span></label></td><td data-l="" class="r"><button class="btn ghost icon-only sm" data-edit="${esc(m.id)}" aria-label="Ubah ${esc(m.nama)}">${ic('edit', 'sm')}</button></td></tr>`).join('')}</tbody></table></div>` : kosongHTML('Menu tidak ditemukan.', 'cup');
      P.segar(); bar();
    };
    const edit = (m) => {
      const baru = !m; m = m || { nama: '', kategori: (Store.opsi.kategoriMenu || [])[0] || '', harga: 0, aktif: true, dinamis: false, hargaMin: 0, hargaMaks: 0, urutan: 99, deskripsi: '', foto: '' };
      const md = Modal.open({ title: baru ? 'Menu baru' : 'Ubah menu ' + esc(m.id), size: 'lg', body: `<div class="row top wrap gap-20"><div class="photo-up" id="foto" role="button" aria-label="Ganti foto" style="width:140px;height:140px"><img src="${esc(fotoUrl(m.foto))}" alt="" onerror="this.src='assets/img/menu/default.svg'"><span class="ov">${baru ? 'Foto setelah disimpan' : 'Ganti foto'}</span></div>
        <div class="grow form-grid"><div class="field span-2"><label>Nama menu <span class="hint">wajib</span></label><input class="input" id="m-n" value="${esc(m.nama)}"></div><div class="field"><label>Kategori</label><select class="input" id="m-k">${(Store.opsi.kategoriMenu || []).map((k) => `<option ${k === m.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Harga</label><div class="input-rp"><span>Rp</span><input class="input" id="m-h" inputmode="numeric" value="${m.harga ? fmtNum(m.harga) : ''}" placeholder="0"></div></div>
        <div class="field span-2"><label class="check"><input type="checkbox" id="m-d" ${m.dinamis ? 'checked' : ''}><div><b>Kasir boleh mengubah harga saat transaksi</b><div class="xs muted">Untuk menu dengan harga menyesuaikan, mis. racikan custom. Harga dibatasi minimum–maksimum.</div></div></label></div>
        <div class="field dyn"><label>Harga minimum</label><div class="input-rp"><span>Rp</span><input class="input" id="m-min" inputmode="numeric" value="${m.hargaMin ? fmtNum(m.hargaMin) : ''}"></div></div><div class="field dyn"><label>Harga maksimum</label><div class="input-rp"><span>Rp</span><input class="input" id="m-max" inputmode="numeric" value="${m.hargaMaks ? fmtNum(m.hargaMaks) : ''}"></div></div>
        <div class="field"><label>Urutan tampil</label><input class="input" id="m-u" type="number" min="1" step="1" value="${m.urutan}"></div><div class="field"><label>Status</label><label class="row gap-8" style="min-height:40px"><span class="switch"><input type="checkbox" id="m-a" ${m.aktif ? 'checked' : ''}><span></span></span>Tampil di POS</label></div>
        <div class="field span-2"><label>Deskripsi <span class="hint">opsional</span></label><input class="input" id="m-ds" value="${esc(m.deskripsi)}"></div></div></div>`, foot: `${baru ? '' : `<button class="btn danger" data-h>${ic('trash', 'sm')}Hapus</button>`}<span class="grow"></span><button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Simpan menu</button>` });
      const dyn = () => $$('.dyn', md.el).forEach((x) => { x.style.display = $('#m-d', md.el).checked ? '' : 'none'; }); dyn(); $('#m-d', md.el).onchange = dyn;
      ['#m-h', '#m-min', '#m-max'].forEach((s) => $(s, md.el).addEventListener('input', (e) => angkaRp(e.target, 'Harga')));
      $('#foto', md.el).onclick = () => { if (baru) return toast('Simpan menu dulu, lalu unggah fotonya.', 'info'); const box = $('#foto', md.el); unggahFotoUI('menu', m.id, () => { box.classList.remove('up'); muat(true); App.segarkanBoot(); }, { sebelum: (prev) => { $('img', box).src = prev; box.classList.add('up'); }, gagal: () => box.classList.remove('up') }); };
      $('[data-b]', md.el).onclick = () => md.close();
      const h = $('[data-h]', md.el); if (h) h.onclick = async () => { if (!(await konfirmasi({ title: 'Hapus ' + m.nama + '?', text: 'Bila menu ini sudah pernah terjual, menu hanya dinonaktifkan agar riwayat penjualan tetap utuh.', danger: true, ok: 'Hapus' }))) return; if ((await tulis('menu.hapus', { ids: [m.id] }, { btn: h, teks: 'Menghapus menu…' })).success) { md.close(); muat(true); App.segarkanBoot(); } };
      $('[data-ok]', md.el).onclick = async (e) => {
        const nama = $('#m-n', md.el).value.trim(); if (!nama) { $('#m-n', md.el).classList.add('err'); $('#m-n', md.el).focus(); return toast('Nama menu wajib diisi.', 'warning'); }
        const harga = parseRp($('#m-h', md.el).value), dinamis = $('#m-d', md.el).checked, hMin = parseRp($('#m-min', md.el).value), hMaks = parseRp($('#m-max', md.el).value);
        if (!dinamis && harga <= 0) { $('#m-h', md.el).classList.add('err'); return toast('Harga menu harus lebih dari 0.', 'warning'); }
        if (dinamis && (hMin <= 0 || hMaks < hMin)) return toast('Isi harga minimum (> 0) dan maksimum (≥ minimum).', 'warning');
        const urutan = Math.max(1, Math.round(num($('#m-u', md.el).value)) || 99);
        const r = await tulis('menu.simpan', { id: m.id, nama, kategori: $('#m-k', md.el).value, harga: dinamis ? (harga || hMin) : harga, dinamis, hargaMin: hMin, hargaMaks: hMaks, urutan, aktif: $('#m-a', md.el).checked, deskripsi: $('#m-ds', md.el).value.trim() }, { btn: e.currentTarget, teks: 'Menyimpan menu…' });
        if (r.success) { md.close(); muat(true); App.segarkanBoot(); }
      };
    };
    el.addEventListener('change', async (e) => {
      const sw = e.target.closest('[data-aktif]'); if (!sw) return;
      const r = await tulis('menu.hapus', { ids: [sw.dataset.aktif], aktif: sw.checked }, { teks: 'Menyimpan…', loader: false });
      if (r.success) { const m = data.rows.find((x) => x.id === sw.dataset.aktif); if (m) m.aktif = sw.checked; sw.closest('tr').classList.toggle('redup', !sw.checked); App.segarkanBoot(); } else sw.checked = !sw.checked;
    });
    el.onclick = async (e) => {
      if (e.target.closest('td.ck, th.ck, .switch')) return;
      const k = e.target.closest('[data-kat]'); if (k) { kat = k.dataset.kat; tabel(); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) return edit(data.rows.find((x) => x.id === ed.dataset.edit));
      const b = e.target.closest('[data-bulk]');
      if (b && b.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (b && (b.dataset.bulk === 'aktif' || b.dataset.bulk === 'nonaktif')) { if ((await tulis('menu.hapus', { ids: P.ids(), aktif: b.dataset.bulk === 'aktif' }, { btn: b, teks: 'Menyimpan…' })).success) { P.kosongkan(); muat(true); App.segarkanBoot(); } return; }
      if (b && b.dataset.bulk === 'hapus') { if (!(await konfirmasi({ title: 'Hapus ' + P.ids().length + ' menu?', text: 'Menu yang sudah pernah terjual hanya dinonaktifkan agar riwayat penjualan tetap utuh.', danger: true, ok: 'Hapus' }))) return; if ((await tulis('menu.hapus', { ids: P.ids() }, { btn: b, teks: 'Menghapus menu…' })).success) { P.kosongkan(); muat(true); App.segarkanBoot(); } return; }
      const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'baru') edit(null);
    };
    const muat = (force) => pakai('menu.list', {}, (d) => { data = d; tabel(); }, { maxAge: force ? 0 : 60000, force, onError: (m) => { $('#tbl', el).innerHTML = kosongHTML(m, 'alert'); } });
    if (Store.menu && Store.menu.length) { data = { rows: Store.menu.slice() }; tabel(); }
    muat(false);
  }
};

/* ============================== PENGGUNA & PIN ============================== */
Pages.pengguna = {
  render(el) {
    let data = null;
    const ap = () => Store.aturanPin || {};
    const P = Pilih(el, { onChange: () => bar() });
    const bar = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm" data-bulk="aktif">Aktifkan</button><button class="btn sm danger" data-bulk="nonaktif">Nonaktifkan</button>`); };
    el.innerHTML = `${kepala({ judul: 'Pengguna & PIN', desc: 'Akun Owner dan Kasir. PIN disimpan sebagai hash, tidak pernah bisa dilihat siapa pun. Akun tidak dihapus agar riwayat transaksinya tetap jelas; nonaktifkan bila sudah tidak bekerja.', acts: `<a class="btn" href="#/pengaturan?tab=keamanan">${ic('shield', 'sm')}Aturan PIN</a><button class="btn primary" data-act="baru">${ic('plus', 'sm')}Pengguna baru</button>` })}
      <div class="card"><div id="ring" class="small muted mb-12"></div><div id="bulk"></div><div id="tbl"><div class="skel h-200"></div></div></div>`;
    const gambar = (d) => {
      data = d; const a = ap();
      $('#ring', el).innerHTML = `PIN ${a.panjang || 6} digit · terkunci ${a.kunciMenit || 15} menit setelah ${a.maksGagal || 5}× salah · sesi ${a.sesiJam || 14} jam${a.masaBerlakuHari ? ' · wajib ganti tiap ' + a.masaBerlakuHari + ' hari' : ''}${a.pinTtdTerpisah ? ' · PIN tanda tangan terpisah' : ''}`;
      $('#tbl', el).innerHTML = d.rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${P.th()}<th>Pengguna</th><th>Peran</th><th>PIN</th><th>Login terakhir</th><th class="c">Status</th><th></th></tr></thead><tbody>${d.rows.map((u) => `<tr class="${u.aktif ? '' : 'redup'}">${P.td(u.id, u.id !== Store.me.id)}<td data-l="Pengguna" class="main-cell"><div class="row gap-8"><span class="avatar">${esc(u.inisial)}</span><div><b>${esc(u.nama)}</b>${u.id === Store.me.id ? ' <span class="badge plain">Anda</span>' : ''}<div class="id">${esc(u.id)}${u.jabatan ? ' · ' + esc(u.jabatan) : ''}</div></div></div></td><td data-l="Peran"><span class="badge ${u.peran === 'OWNER' ? 'gold' : 'info'} plain">${esc(u.labelPeran)}</span></td><td data-l="PIN" class="small"><div>${u.panjangPin} digit${u.panjangPin !== (ap().panjang || 6) ? ' <span class="badge warning plain">beda aturan</span>' : ''}</div><div class="xs muted">${u.terkunci ? '<span class="bad strong">Terkunci</span> · ' : ''}${u.wajibGanti ? 'Wajib ganti · ' : ''}${ap().pinTtdTerpisah || u.pinTtdAda ? (u.pinTtdAda ? 'PIN tanda tangan ada' : 'Belum punya PIN tanda tangan') : 'Tanda tangan pakai PIN login'}</div></td><td data-l="Login terakhir" class="small">${u.loginTerakhir ? esc(tgl(u.loginTerakhir, 'd MMM yyyy, HH:mm')) : '<span class="muted">belum pernah</span>'}</td><td data-l="Status" class="c">${u.aktif ? '<span class="badge success">Aktif</span>' : '<span class="badge">Nonaktif</span>'}</td><td data-l="" class="r"><div class="row gap-4" style="justify-content:flex-end"><button class="btn xs" data-pin="${esc(u.id)}">${ic('key', 'sm')}Reset PIN</button>${u.pinTtdAda ? `<button class="btn xs ghost" data-pinttd="${esc(u.id)}" title="Hapus PIN tanda tangan">${ic('sign', 'sm')}</button>` : ''}<button class="btn ghost icon-only sm" data-edit="${esc(u.id)}" aria-label="Ubah ${esc(u.nama)}">${ic('edit', 'sm')}</button></div></td></tr>`).join('')}</tbody></table></div>
        <p class="xs muted mt-12">Hak akses Kasir (modul yang boleh dibuka dan aturan tambahan) diatur di <a href="#/pengaturan?tab=peran">Pengaturan → Peran & hak akses</a>.</p>` : kosongHTML('Belum ada pengguna.', 'users');
      P.segar(); bar();
    };
    const pinBaru = (judul) => new Promise((res) => {
      let p1 = ''; const n = ap().panjang || 6;
      const m = Modal.open({ title: judul, sub: 'PIN ' + n + ' digit. Pengguna wajib menggantinya saat login berikutnya.', size: 'sm', body: `<div class="center strong" id="l">PIN baru</div>${ap().tolakLemah !== false ? '<div class="center xs muted mt-4">PIN mudah ditebak (123456, 111111…) akan ditolak.</div>' : ''}<div class="pin-dots"></div>${pinPadHTML()}`, onClose: (v) => res(v || null) });
      const pad = pasangPinPad(m.el, (pin) => { if (!p1) { p1 = pin; $('#l', m.el).textContent = 'Ulangi PIN'; pad.reset(); } else if (pin === p1) m.close(pin); else { p1 = ''; $('#l', m.el).textContent = 'Tidak sama. Masukkan PIN baru lagi'; pad.reset(true); } }, n);
    });
    const simpanUser = (u, patch) => tulis('pengguna.simpan', Object.assign({ id: u.id, nama: u.nama, jabatan: u.jabatan, peran: u.peran, aktif: u.aktif }, patch), { teks: 'Menyimpan pengguna…', toast: false });
    const edit = (u) => {
      const baru = !u; u = u || { nama: '', jabatan: '', peran: 'KASIR', aktif: true };
      const md = Modal.open({ title: baru ? 'Pengguna baru' : 'Ubah ' + esc(u.nama), body: `<div class="form-grid"><div class="field span-2"><label>Nama lengkap <span class="hint">wajib</span></label><input class="input" id="u-n" value="${esc(u.nama)}"></div><div class="field"><label>Jabatan</label><input class="input" id="u-j" placeholder="Kasir gerobak, barista…" value="${esc(u.jabatan)}"></div><div class="field"><label>Peran</label><select class="input" id="u-p"><option value="KASIR" ${u.peran === 'KASIR' ? 'selected' : ''}>${esc(Store.app.labelKasir)}</option><option value="OWNER" ${u.peran === 'OWNER' ? 'selected' : ''}>${esc(Store.app.labelOwner)}</option></select></div><div class="field span-2"><label class="row gap-8"><span class="switch"><input type="checkbox" id="u-a" ${u.aktif ? 'checked' : ''} ${u.id === Store.me.id ? 'disabled' : ''}><span></span></span>Akun aktif (bisa masuk)</label></div></div>${baru ? '<p class="xs muted mt-8">Setelah menekan Simpan, Anda membuat PIN awal. Pengguna wajib menggantinya saat login pertama.</p>' : '<p class="xs muted mt-8">Mengubah peran atau menonaktifkan akun langsung mengeluarkan pengguna dari semua perangkat.</p>'}`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Simpan</button>` });
      $('[data-b]', md.el).onclick = () => md.close();
      $('[data-ok]', md.el).onclick = async () => {
        const d = { id: u.id, nama: $('#u-n', md.el).value.trim(), jabatan: $('#u-j', md.el).value.trim(), peran: $('#u-p', md.el).value, aktif: $('#u-a', md.el).checked };
        if (!d.nama) { $('#u-n', md.el).classList.add('err'); return toast('Nama pengguna wajib diisi.', 'warning'); }
        md.close();
        if (baru) { const pin = await pinBaru('PIN awal untuk ' + d.nama); if (!pin) return; d.pin = pin; }
        if ((await tulis('pengguna.simpan', d, { teks: 'Menyimpan pengguna…' })).success) muat(true);
      };
    };
    el.onclick = async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const ed = e.target.closest('[data-edit]'); if (ed) return edit(data.rows.find((x) => x.id === ed.dataset.edit));
      const pn = e.target.closest('[data-pin]'); if (pn) { const u = data.rows.find((x) => x.id === pn.dataset.pin); const pin = await pinBaru('Reset PIN ' + u.nama); if (pin && (await tulis('pengguna.resetPin', { id: u.id, pinBaru: pin }, { teks: 'Mereset PIN…' })).success) muat(true); return; }
      const pt = e.target.closest('[data-pinttd]'); if (pt) { const u = data.rows.find((x) => x.id === pt.dataset.pinttd); if (await konfirmasi({ title: 'Hapus PIN tanda tangan ' + u.nama + '?', text: 'Pakai bila pengguna lupa PIN tanda tangannya. Ia perlu membuat PIN tanda tangan baru dari menu akunnya sebelum bisa menandatangani dokumen.', ok: 'Hapus PIN tanda tangan' })) { if ((await tulis('pengguna.resetPinTtd', { id: u.id }, { btn: pt, teks: 'Menghapus PIN tanda tangan…' })).success) muat(true); } return; }
      const b = e.target.closest('[data-bulk]');
      if (b && b.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (b && (b.dataset.bulk === 'aktif' || b.dataset.bulk === 'nonaktif')) {
        const aktif = b.dataset.bulk === 'aktif', pilih = data.rows.filter((u) => P.ids().includes(u.id));
        if (!aktif && !(await konfirmasi({ title: 'Nonaktifkan ' + pilih.length + ' akun?', text: 'Akun tidak bisa masuk dan langsung keluar dari semua perangkat. Riwayat transaksinya tetap tersimpan.', ok: 'Nonaktifkan', danger: true }))) return;
        b.classList.add('busy'); let ok = 0, gagal = '';
        for (const u of pilih) { const r = await simpanUser(u, { aktif }); if (r.success) ok++; else gagal = gagal || r.message; }
        b.classList.remove('busy'); toast(ok + ' akun ' + (aktif ? 'diaktifkan.' : 'dinonaktifkan.') + (gagal ? ' ' + gagal : ''), gagal ? 'warning' : 'success');
        P.kosongkan(); muat(true); return;
      }
      const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'baru') edit(null);
    };
    const muat = (force) => pakai('pengguna.list', {}, gambar, { maxAge: force ? 0 : 30000, force, onError: (m) => { $('#tbl', el).innerHTML = kosongHTML(m, 'alert'); } });
    muat(false);
  }
};

/* ============================== PENGATURAN ============================== */
const PRESET_TEMA = [
  { n: 'Hijau rempah (bawaan)', t: { primary: '#059669', primaryHover: '#047857', secondary: '#0F172A', bg: '#F8FAFC', card: '#FFFFFF', text: '#0F172A', muted: '#64748B', border: '#E2E8F0', success: '#16A34A', danger: '#DC2626', warning: '#D97706', radius: 16 } },
  { n: 'Kedai hangat', t: { primary: '#A8782A', primaryHover: '#8E6420', secondary: '#5B3E26', bg: '#F6F1E7', card: '#FFFFFF', text: '#2A2118', muted: '#776B5C', border: '#E6DDCC', success: '#2F7A4D', danger: '#B23A2A', warning: '#B7791F' } },
  { n: 'Kopi tubruk', t: { primary: '#8A5A3B', primaryHover: '#714A30', secondary: '#3B2A20', bg: '#F3EEE8', card: '#FFFFFF', text: '#261C16', muted: '#75685E', border: '#E2D8CE', success: '#2F7A4D', danger: '#B23A2A', warning: '#B7791F' } },
  { n: 'Daun pandan', t: { primary: '#4E7A3A', primaryHover: '#3F6430', secondary: '#2F4A26', bg: '#F1F4EC', card: '#FFFFFF', text: '#1E2A1B', muted: '#66705C', border: '#DCE3D2', success: '#2F7A4D', danger: '#B23A2A', warning: '#B7791F' } },
  { n: 'Laut pagi', t: { primary: '#2F6EA8', primaryHover: '#275C8C', secondary: '#1E3A55', bg: '#EEF2F6', card: '#FFFFFF', text: '#17222E', muted: '#5F6B78', border: '#D8E0E8', success: '#2F7A4D', danger: '#B23A2A', warning: '#B7791F' } },
  { n: 'Bata merah', t: { primary: '#B5532F', primaryHover: '#964426', secondary: '#5A2E22', bg: '#F6EEE9', card: '#FFFFFF', text: '#2B1B16', muted: '#7D6359', border: '#EBDAD0', success: '#2F7A4D', danger: '#9E2F22', warning: '#B7791F' } }
];
const LABEL_WARNA = { primary: 'Tombol & aksen utama', primaryHover: 'Tombol saat disentuh', secondary: 'Aksen gelap (pilihan aktif)', bg: 'Latar halaman', card: 'Kartu', text: 'Teks', muted: 'Teks keterangan', border: 'Garis tepi', success: 'Positif', danger: 'Negatif / bahaya', warning: 'Waspada' };
Pages.pengaturan = {
  render(el, q) {
    let tab = q.tab || 'identitas', cfg = null, tema = null, sys = null;
    const TABS = [['identitas', 'Identitas & logo', 'stall'], ['tampilan', 'Warna & font', 'palette'], ['keamanan', 'Keamanan & PIN', 'shield'], ['peran', 'Peran & hak akses', 'users'], ['operasional', 'Operasional', 'sliders'], ['kategori', 'Kategori & daftar', 'layers'], ['data', 'Data & sistem', 'database']];
    if (!TABS.some((t) => t[0] === tab)) tab = 'identitas';
    el.innerHTML = `${kepala({ judul: 'Pengaturan', desc: 'Identitas usaha, tampilan, aturan PIN, hak akses Kasir, operasional lapak, dan pengelolaan data. Hanya Owner yang bisa membuka halaman ini.' })}
      <div class="grid g-set"><div class="card pad-s set-tabs"><div class="tabs-v" id="tabs">${TABS.map((t) => `<button data-tab="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${ic(t[2], 'sm')}${t[1]}</button>`).join('')}</div></div><div id="isi"></div></div>`;
    const isi = $('#isi', el);
    const N = () => cfg.nilai, J = (k) => { try { return JSON.parse(N()[k]); } catch (e) { return null; } };
    const simpan = async (nilai, teks, btn) => {
      const r = await tulis('pengaturan.simpan', { nilai }, { teks: teks || 'Menyimpan pengaturan…', btn });
      if (r.success) { Object.keys(nilai).forEach((k) => { N()[k] = typeof nilai[k] === 'string' ? nilai[k] : JSON.stringify(nilai[k]); }); await App.segarkanBoot(); }
      return r.success;
    };
    const tombolSimpan = (act, l) => `<div class="row mt-16" style="justify-content:flex-end"><button class="btn primary" data-act="${act}">${ic('check', 'sm')}${l}</button></div>`;
    const tabIdentitas = () => {
      isi.innerHTML = `<div class="stack"><div class="card"><div class="card-head"><div><h2>Identitas usaha</h2><div class="sub">Tampil di menu samping, halaman masuk, laporan, dan dokumen resmi</div></div></div>
        <div class="row top wrap gap-20"><div class="col" style="align-items:center"><div class="photo-up" id="logo" role="button" aria-label="Ganti logo" style="width:120px;height:120px;border-radius:50%"><img src="${esc(N().LOGO_URL || 'assets/logo.svg')}" alt="" onerror="this.src='assets/logo.svg'"><span class="ov">Ganti logo</span></div>${N().LOGO_URL ? '<button class="link-btn xs" data-act="logo-reset">Pakai logo bawaan</button>' : ''}</div>
        <div class="grow form-grid">${[['APP_NAMA', 'Nama aplikasi / usaha'], ['APP_SINGKAT', 'Nama singkat (menu samping)'], ['APP_SUBJUDUL', 'Keterangan di halaman masuk'], ['APP_TAGLINE', 'Tagline'], ['LAPAK_NAMA', 'Nama lapak'], ['KOTA', 'Kota (untuk tanggal di dokumen)'], ['LOKASI', 'Alamat lengkap'], ['LOKASI_SINGKAT', 'Lokasi singkat'], ['ZONA_LABEL', 'Label zona waktu'], ['URL_PUBLIK', 'Alamat aplikasi (GitHub Pages) untuk QR verifikasi']].map((f) => `<div class="field ${f[0] === 'LOKASI' || f[0] === 'URL_PUBLIK' ? 'span-2' : ''}"><label>${f[1]}</label><input class="input" data-k="${f[0]}" value="${esc(N()[f[0]])}" ${f[0] === 'URL_PUBLIK' ? `placeholder="${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}"` : ''}></div>`).join('')}</div></div>
        ${tombolSimpan('simpan-id', 'Simpan identitas')}</div></div>`;
      $('#logo', isi).onclick = () => { const box = $('#logo', isi); unggahFotoUI('logo', '', async (url) => { box.classList.remove('up'); N().LOGO_URL = url; await App.segarkanBoot(); tabIdentitas(); }, { sebelum: (prev) => { $('img', box).src = prev; box.classList.add('up'); }, gagal: () => box.classList.remove('up') }); };
    };
    const tabTampilan = () => {
      tema = tema || Object.assign({}, temaEfektif(J('TEMA')));
      const fj = cfg.fontJudul, fi = cfg.fontIsi;
      isi.innerHTML = `<div class="stack"><div class="card"><div class="card-head"><div><h2>Warna</h2><div class="sub">Perubahan langsung terlihat sebagai pratinjau. Tekan Simpan agar berlaku untuk semua pengguna.</div></div><button class="btn sm" data-act="tema-reset">${ic('refresh', 'sm')}Batalkan perubahan</button></div>
          <div class="grid g-3" style="gap:8px">${PRESET_TEMA.map((p, i) => `<button class="preset" data-preset="${i}"><span class="dots">${['primary', 'secondary', 'bg', 'success', 'danger'].map((k) => `<i style="background:${p.t[k]}"></i>`).join('')}</span><b class="small">${p.n}</b></button>`).join('')}</div>
          <div class="grid g-2 mt-16" style="gap:8px">${Object.keys(LABEL_WARNA).map((k) => `<label class="color-row"><input type="color" data-w="${k}" value="${esc(tema[k] || '#000000')}"><div class="grow"><div class="small strong">${LABEL_WARNA[k]}</div><div class="xs muted tnum" data-wv="${k}">${esc(tema[k] || '')}</div></div></label>`).join('')}</div>
          <div class="field mt-16" style="max-width:360px"><label>Kelengkungan sudut kartu <span class="hint" id="rv">${tema.radius || 16}px</span></label><input type="range" min="6" max="20" id="radius" value="${Math.max(6, Math.min(20, tema.radius || 16))}" style="accent-color:var(--c-primary)"></div></div>
        <div class="card"><div class="card-head"><div><h2>Font</h2><div class="sub">Font judul dan font isi. Satu keluarga font untuk keduanya biasanya paling rapi.</div></div></div>
          <div class="form-grid"><div class="field"><label>Font judul</label><select class="input" id="fj">${cfg.fontJudulOpsi.map((f) => `<option ${f === fj ? 'selected' : ''}>${f}</option>`).join('')}</select></div><div class="field"><label>Font isi</label><select class="input" id="fi">${cfg.fontIsiOpsi.map((f) => `<option ${f === fi ? 'selected' : ''}>${f}</option>`).join('')}</select></div></div>
          <div class="theme-preview mt-16"><h2>${esc(N().APP_NAMA)}</h2><p class="muted small mt-4">Total masuk hari ini <b class="tnum" style="color:var(--c-text)">Rp 1.257.000</b> dari 71 cup.</p><div class="row wrap mt-12 gap-8"><button class="btn primary sm" type="button">Simpan</button><button class="btn sm" type="button">Batal</button><span class="badge success">Terkunci</span><span class="badge warning">Menipis</span><span class="badge danger">Habis</span></div></div>
          ${tombolSimpan('simpan-tema', 'Simpan tampilan')}</div></div>`;
      const pratinjau = () => terapkanTema(Object.assign({}, Store.app, { tema, fontJudul: $('#fj', isi).value, fontIsi: $('#fi', isi).value }));
      $$('[data-w]', isi).forEach((inp) => inp.addEventListener('input', () => { tema[inp.dataset.w] = inp.value.toUpperCase(); $(`[data-wv="${inp.dataset.w}"]`, isi).textContent = tema[inp.dataset.w]; pratinjau(); }));
      $('#radius', isi).addEventListener('input', (e) => { tema.radius = +e.target.value; $('#rv', isi).textContent = tema.radius + 'px'; pratinjau(); });
      $('#fj', isi).onchange = pratinjau; $('#fi', isi).onchange = pratinjau;
    };
    const tabKeamanan = () => {
      const a = cfg.aturanPin, aksi = cfg.aturanPinAksi;
      const angka = (id, l, v, min, max, sat, hint) => `<div class="field"><label for="${id}">${l}</label><div class="row gap-8"><input class="input" type="number" id="${id}" min="${min}" max="${max}" step="1" value="${v}" style="max-width:110px"><span class="small muted">${sat}${hint ? ' · ' + hint : ''}</span></div></div>`;
      isi.innerHTML = `<div class="stack">
        <div class="card"><div class="card-head"><div><h2>Masuk & sesi</h2><div class="sub">Berlaku untuk semua akun, termasuk Owner</div></div></div>
          <div class="form-grid">${angka('ap-pj', 'Panjang PIN', a.panjang, 4, 8, 'digit', '4–8')}${angka('ap-mg', 'Batas salah PIN', a.maksGagal, 3, 10, 'kali', '3–10')}${angka('ap-km', 'Lama dikunci setelah batas', a.kunciMenit, 1, 1440, 'menit')}${angka('ap-sj', 'Lama sesi masuk', a.sesiJam, 1, 72, 'jam', 'lalu wajib masuk lagi')}${angka('ap-ko', 'Kunci layar otomatis', a.kunciOtomatisMenit, 0, 240, 'menit tanpa aktivitas', '0 = mati')}</div>
          <div class="notice info mt-12" id="ap-pj-info" style="display:none">${ic('info')}<div class="small">Pengguna yang PIN-nya belum sesuai panjang baru tetap bisa masuk dengan PIN lamanya, lalu langsung diminta membuat PIN baru.</div></div></div>
        <div class="card"><div class="card-head"><div><h2>Kekuatan PIN</h2></div></div>
          <label class="check"><input type="checkbox" id="ap-tl" ${a.tolakLemah ? 'checked' : ''}><div><b>Tolak PIN yang mudah ditebak</b><div class="xs muted">Angka sama (111111), berurutan (123456 / 654321), pola berulang (121212), dan tanggal umum.</div></div></label>
          <div class="form-grid mt-12">${angka('ap-mb', 'Wajib ganti PIN setiap', a.masaBerlakuHari, 0, 365, 'hari', '0 = tidak wajib')}</div></div>
        <div class="card"><div class="card-head"><div><h2>Aksi yang meminta PIN ulang</h2><div class="sub">Walau sudah masuk, pengguna harus memasukkan PIN lagi sebelum melakukan aksi berikut</div></div></div>
          <div class="perm-grid">${Object.keys(aksi).map((k) => `<label class="check" style="background:var(--c-inset)"><input type="checkbox" data-aksi="${k}" ${a.aksi.includes(k) ? 'checked' : ''}><span class="small">${esc(aksi[k])}</span></label>`).join('')}</div>
          <p class="xs muted mt-8">Tanda tangan dokumen, mengubah aturan PIN ini, dan "Mulai data riil" selalu meminta PIN dan tidak bisa dimatikan.</p></div>
        <div class="card"><div class="card-head"><div><h2>PIN tanda tangan</h2></div></div>
          <label class="check"><input type="checkbox" id="ap-tt" ${a.pinTtdTerpisah ? 'checked' : ''}><div><b>Pakai PIN khusus untuk menandatangani dokumen</b><div class="xs muted">Setiap pengguna membuat PIN tanda tangan sendiri (harus berbeda dari PIN masuk) lewat menu akun. Berguna bila PIN masuk kasir sering diketahui rekan kerja. Bila dimatikan, tanda tangan memakai PIN masuk.</div></div></label>
          ${tombolSimpan('simpan-pin', 'Simpan aturan PIN')}</div></div>`;
      $('#ap-pj', isi).addEventListener('input', (e) => { $('#ap-pj-info', isi).style.display = +e.target.value !== a.panjang ? '' : 'none'; });
    };
    const tabPeran = () => {
      const perm = J('PERM_KASIR') || [], at = J('ATURAN_KASIR') || {};
      isi.innerHTML = `<div class="stack"><div class="card"><div class="card-head"><div><h2>Nama peran</h2><div class="sub">Owner punya akses penuh. Akses Kasir diatur di bawah.</div></div></div>
          <div class="form-grid"><div class="field"><label>Sebutan Owner</label><input class="input" id="lo" value="${esc(N().LABEL_OWNER)}"></div><div class="field"><label>Sebutan Kasir</label><input class="input" id="lk" value="${esc(N().LABEL_KASIR)}"></div></div></div>
        <div class="card"><div class="card-head"><div><h2>Halaman yang boleh dibuka ${esc(N().LABEL_KASIR)}</h2><div class="sub">Pengguna & Pengaturan selalu khusus Owner</div></div><button class="btn sm" data-act="perm-default">${ic('refresh', 'sm')}Kembali ke bawaan</button></div>
          <div class="perm-grid">${cfg.modul.map((m) => { const khusus = cfg.khususOwner.includes(m.k); return `<label class="check" style="background:var(--c-inset);${khusus ? 'opacity:.55' : ''}"><input type="checkbox" data-perm="${m.k}" ${perm.includes(m.k) ? 'checked' : ''} ${khusus ? 'disabled' : ''}><div><b class="small">${esc(m.n)}</b>${khusus ? '<div class="xs muted">Khusus Owner</div>' : ''}</div></label>`; }).join('')}</div></div>
        <div class="card"><div class="card-head"><div><h2>Aturan ${esc(N().LABEL_KASIR)}</h2><div class="sub">Dicek server pada setiap transaksi, tidak bisa diakali dari perangkat kasir</div></div></div>
          ${Object.keys(cfg.aturanInfo).map((k) => `<label class="row between li" style="cursor:pointer"><div class="grow small">${esc(cfg.aturanInfo[k])}</div><span class="switch"><input type="checkbox" data-at="${k}" ${at[k] ? 'checked' : ''}><span></span></span></label>`).join('')}
          ${tombolSimpan('simpan-peran', 'Simpan peran & hak akses')}</div></div>`;
    };
    const tabOperasional = () => {
      isi.innerHTML = `<div class="stack"><div class="card"><div class="card-head"><div><h2>Target & batas harian</h2><div class="sub">Dipakai di beranda, POS, dan pengecekan biaya kasir</div></div></div>
        <div class="form-grid"><div class="field"><label>Target cup harian</label><input class="input" id="o-t" type="number" min="1" step="1" value="${esc(N().TARGET_CUP)}"></div><div class="field"><label>Batas biaya operasional kasir per hari <span class="hint">0 = tanpa batas</span></label><div class="input-rp"><span>Rp</span><input class="input rpi" id="o-p" inputmode="numeric" value="${fmtNum(N().PLAFON_BIAYA)}"></div></div><div class="field"><label>Jam buka</label><input class="input" type="time" id="o-b" value="${esc(N().JAM_BUKA)}"></div><div class="field"><label>Jam tutup</label><input class="input" type="time" id="o-c" value="${esc(N().JAM_TUTUP)}"></div></div></div>
        <div class="card"><div class="card-head"><div><h2>Saldo kas awal</h2><div class="sub">Saldo sebelum closing pertama. Mengubahnya menghitung ulang seluruh rantai saldo.</div></div></div>
        <div class="form-grid"><div class="field"><label>Saldo awal</label><div class="input-rp"><span>Rp</span><input class="input rpi" id="o-s" inputmode="numeric" value="${fmtNum(N().SALDO_AWAL_PERTAMA)}"></div></div><div class="field"><label>Tanggal mulai pembukuan <span class="hint">hari sebelumnya diabaikan</span></label><input class="input" type="date" id="o-m" value="${esc(N().TANGGAL_MULAI)}" max="${hariIni()}"></div></div>
        ${tombolSimpan('simpan-op', 'Simpan operasional')}</div></div>`;
      $$('.rpi', isi).forEach((i) => i.addEventListener('input', () => angkaRp(i, 'Nominal')));
    };
    const daftarEditor = (k, judul, sub) => `<div class="card" data-list="${k}"><div class="card-head"><div><h3>${judul}</h3><div class="sub">${sub}</div></div></div><div class="chips" data-chips>${(J(k) || []).map((v) => `<span class="chip" style="cursor:default">${esc(v)}<button class="link-btn" data-hapus-item aria-label="Hapus ${esc(v)}">${ic('x', 'sm')}</button></span>`).join('')}</div><div class="row mt-12"><input class="input grow" data-baru placeholder="Tambah…"><button class="btn" data-tambah-item>${ic('plus', 'sm')}Tambah</button></div></div>`;
    const tabKategori = () => {
      const kb = J('KATEGORI_BIAYA') || [], tc = J('TOMBOL_CEPAT_BIAYA') || [];
      isi.innerHTML = `<div class="stack">
        <div class="card"><div class="card-head"><div><h3>Kategori biaya operasional</h3><div class="sub">Nominal acuan hanya petunjuk di form kasir</div></div><button class="btn sm" data-act="kb-tambah">${ic('plus', 'sm')}Kategori</button></div><div id="kb">${kb.map((x) => `<div class="row li" data-kb><input class="input grow" data-f="nama" value="${esc(x.nama)}" aria-label="Nama kategori"><div class="input-rp" style="width:150px"><span>Rp</span><input class="input" data-f="acuan" inputmode="numeric" value="${fmtNum(x.acuan)}" aria-label="Nominal acuan"></div><button class="btn ghost icon-only sm" data-hapus-li aria-label="Hapus">${ic('trash', 'sm')}</button></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><div><h3>Tombol cepat biaya</h3><div class="sub">Satu ketukan di form pengeluaran kasir</div></div><button class="btn sm" data-act="tc-tambah">${ic('plus', 'sm')}Tombol</button></div><div id="tc">${tc.map((x) => tcBaris(x, kb.map((k) => k.nama))).join('')}</div></div>
        <div class="grid g-2">${daftarEditor('METODE_BAYAR', 'Metode pembayaran', 'Pilihan di POS')}${daftarEditor('JENIS_PESANAN', 'Jenis pesanan', 'Dine in, bungkus, dll.')}${daftarEditor('KATEGORI_MENU', 'Kategori menu', 'Filter POS & daftar menu')}${daftarEditor('KATEGORI_STOK', 'Kategori stok', 'Rempah, pelengkap, kemasan')}${daftarEditor('KATEGORI_ASET', 'Kategori aset', 'Pengelompokan inventaris')}${daftarEditor('SATUAN', 'Satuan', 'kg, botol, pcs…')}</div>
        <div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="simpan-kat">${ic('check', 'sm')}Simpan kategori & daftar</button></div></div>`;
    };
    const tcBaris = (x, kats) => `<div class="row wrap li" data-tc><input class="input" style="width:120px" data-f="label" value="${esc(x.label || '')}" placeholder="Label" aria-label="Label"><select class="input" style="width:210px" data-f="kategori" aria-label="Kategori">${kats.map((k) => `<option ${k === x.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select><div class="input-rp" style="width:140px"><span>Rp</span><input class="input" data-f="nominal" inputmode="numeric" value="${x.nominal ? fmtNum(x.nominal) : ''}" aria-label="Nominal"></div><input class="input grow" data-f="ket" value="${esc(x.ket || '')}" placeholder="Keterangan otomatis" aria-label="Keterangan"><button class="btn ghost icon-only sm" data-hapus-li aria-label="Hapus">${ic('trash', 'sm')}</button></div>`;
    const tabData = () => {
      isi.innerHTML = `<div class="stack">
        <div class="card"><div class="card-head"><div><h2>Status sistem</h2><div class="sub">Server, cache, dan isi database</div></div><button class="btn sm" data-act="sys">${ic('refresh', 'sm')}Periksa</button></div><div id="sys">${sys ? '' : '<div class="skel h-120"></div>'}</div></div>
        <div class="card"><div class="card-head"><div><h2>Impor dari spreadsheet lain</h2><div class="sub">Untuk memasukkan buku lama. Sumber hanya dibaca dan impor aman diulang (tidak dobel).</div></div></div>
          <div class="field"><label>URL atau ID Google Sheets sumber</label><input class="input" id="im-src" placeholder="https://docs.google.com/spreadsheets/d/…"></div>
          <div class="perm-grid mt-12">${['Master_Menu', 'Master_Stok', 'Aset_Inventaris', 'Trx_Penjualan', 'Trx_Penjualan_Detail', 'Trx_Pengeluaran_Operasional', 'Trx_Belanja_Bahan', 'Log_Stok_Opname', 'Rekap_Kas_Harian'].map((s) => `<label class="check" style="background:var(--c-inset)"><input type="checkbox" data-im="${s}" checked><span class="small">${s}</span></label>`).join('')}</div>
          <label class="check mt-8"><input type="checkbox" id="im-timpa"><div><b class="small">Timpa data master yang sudah ada</b><div class="xs muted">Hanya menu, stok, dan aset. Transaksi tidak pernah ditimpa.</div></div></label>
          <p class="xs muted mt-8">Nama sheet & judul kolom sumber harus sama dengan database aplikasi. Sheet Pengguna tidak diimpor.</p>
          <div class="row mt-12 gap-8"><button class="btn" data-act="im-pindai">${ic('eye', 'sm')}Pratinjau impor</button><button class="btn primary" data-act="im-jalan">${ic('upload', 'sm')}Jalankan impor</button></div><div id="im-hasil" class="mt-12"></div></div>
        <div class="card"><div class="card-head"><div><h2>Riwayat aktivitas</h2><div class="sub">Semua aksi penting tercatat (tanpa PIN atau rahasia)</div></div><div class="row gap-8"><div class="search" style="min-width:190px">${ic('search')}<input class="input" id="au-q" placeholder="Cari aksi / nama…"></div><button class="btn sm" data-act="au-unduh">${ic('eye', 'sm')}Pratinjau & unduh</button></div></div><div id="audit"><div class="skel h-120"></div></div></div>
        <div class="card" style="border-color:color-mix(in srgb,var(--c-danger) 35%,var(--c-border))"><div class="card-head"><div><h2 class="bad">Mulai data riil</h2><div class="sub">Kosongkan data contoh (transaksi, biaya, belanja, rekap, opname, dokumen) lalu mulai pembukuan sungguhan.</div></div>${cfg.demo ? '<span class="badge warning">Data contoh aktif</span>' : '<span class="badge success">Data riil</span>'}</div>
          <div class="form-grid"><div class="field"><label>Saldo kas riil saat ini</label><div class="input-rp"><span>Rp</span><input class="input" id="mr-s" inputmode="numeric" placeholder="0"></div></div><div class="field"><label>Tanggal mulai</label><input class="input" type="date" id="mr-t" value="${hariIni()}" max="${hariIni()}"></div></div>
          <label class="check mt-8"><input type="checkbox" id="mr-st"><span class="small">Nolkan stok semua bahan (lalu isi lewat opname)</span></label><label class="check"><input type="checkbox" id="mr-as"><span class="small">Hapus data aset contoh</span></label><label class="check"><input type="checkbox" id="mr-k"><span class="small">Nonaktifkan akun kasir contoh</span></label>
          <div class="notice danger mt-12">${ic('alert')}<div class="small">Tidak dapat dibatalkan. Semua pengguna lain wajib mengganti PIN dan masuk ulang. Unduh laporan yang diperlukan terlebih dahulu.</div></div>
          <div class="row mt-12" style="justify-content:flex-end"><button class="btn danger" data-act="mulai-riil">${ic('database', 'sm')}Kosongkan data contoh</button></div></div>
      </div>`;
      $('#mr-s', isi).addEventListener('input', (e) => angkaRp(e.target, 'Saldo'));
      muatSys(); muatAudit('');
      $('#au-q', isi).addEventListener('input', debounce((e) => muatAudit(e.target.value), 350));
    };
    let auditRows = [];
    const muatSys = async (force) => {
      const box = $('#sys', isi); if (!box) return;
      if (!sys || force) { const r = await API.call('sistem.status', {}).catch((e) => ({ success: false, message: e.message })); if (!r.success) { box.innerHTML = kosongHTML(r.message, 'alert'); return; } sys = r.data; }
      const b = sys.baris;
      box.innerHTML = `<div class="grid g-4 kpis">${[['Versi server', sys.versi + (sys.versi !== VERSI_APP ? ' · tampilan ' + VERSI_APP : '')], ['Cache server', sys.cacheHangat ? 'Hangat' : 'Dingin'], ['Pemanas otomatis', sys.keepWarm === 'off' ? 'Mati' : 'Aktif'], ['Script Properties', sys.propsKB + ' KB']].map((x) => `<div class="inset"><div class="xs muted">${x[0]}</div><b>${esc(x[1])}</b></div>`).join('')}</div>
        <div class="table-wrap mt-12" style="max-height:260px"><table class="tbl"><thead><tr><th>Sheet</th><th class="r">Baris</th></tr></thead><tbody>${Object.keys(b).map((k) => `<tr><td>${esc(k)}</td><td class="r">${fmtNum(b[k])}</td></tr>`).join('')}</tbody></table></div>
        <div class="row wrap gap-8 mt-12"><a class="btn sm" href="${esc(sys.spreadsheetUrl)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka spreadsheet</a>${sys.folderUrl ? `<a class="btn sm" href="${esc(sys.folderUrl)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Folder Drive</a>` : ''}<span class="badge ${sys.rahasia.sessionSecret ? 'success' : 'danger'} plain">Kunci sesi ${sys.rahasia.sessionSecret ? 'ada' : 'belum ada'}</span><span class="badge ${sys.rahasia.verifSecret ? 'success' : 'danger'} plain">Kunci verifikasi ${sys.rahasia.verifSecret ? 'ada' : 'belum ada'}</span><span class="xs muted">Pemanasan terakhir: ${sys.warmTerakhir ? esc(relatif(sys.warmTerakhir.at)) : '—'}</span></div>`;
    };
    const muatAudit = async (qq) => {
      const r = await API.call('audit.list', { q: qq, limit: 100 }).catch((e) => ({ success: false, message: e.message })); const box = $('#audit', isi); if (!box) return;
      auditRows = r.success ? r.data.rows : [];
      box.innerHTML = r.success ? (auditRows.length ? `<div class="table-wrap" style="max-height:380px"><table class="tbl cards"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${auditRows.map((a) => `<tr><td data-l="Waktu" class="main-cell"><span class="tnum small">${esc(tgl(a.waktu, 'd MMM yyyy HH:mm'))}</span></td><td data-l="Pengguna">${esc(a.nama)}</td><td data-l="Aksi"><span class="badge plain ${/GAGAL|HAPUS|BATAL|BUKA|TARIK|BYPASS|KOREKSI|TERKUNCI/.test(a.aksi) ? 'danger' : ''}">${esc(labelAksi(a.aksi))}</span></td><td data-l="Detail" class="small muted" style="white-space:normal">${esc(a.entitas)} · ${esc(a.detail)}</td></tr>`).join('')}</tbody></table></div>` : kosongHTML('Tidak ada catatan.', 'history')) : kosongHTML(r.message, 'alert');
    };
    const laporanImpor = (d) => `<div class="inset"><div class="strong small">${d.dryRun ? 'Pratinjau (belum ada yang ditulis)' : 'Hasil impor'} · ${esc(d.sumber.nama)}</div><div class="table-wrap mt-8"><table class="tbl"><thead><tr><th>Sheet</th><th class="r">Di sumber</th><th class="r">Ditambah</th><th class="r">Diperbarui</th><th class="r">Dilewati</th></tr></thead><tbody>${Object.keys(d.laporan).map((k) => { const x = d.laporan[k]; return `<tr><td>${esc(k)}${x.catatan ? `<div class="xs muted">${esc(x.catatan)}</div>` : ''}</td><td class="r">${x.sumber}</td><td class="r ok">${x.ditambah}</td><td class="r">${x.diperbarui}</td><td class="r muted">${x.dilewati}</td></tr>`; }).join('')}</tbody></table></div>${d.peringatan.length ? `<ul class="small warn mt-8">${d.peringatan.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>`;
    const gambar = () => { $$('#tabs button', el).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); ({ identitas: tabIdentitas, tampilan: tabTampilan, keamanan: tabKeamanan, peran: tabPeran, operasional: tabOperasional, kategori: tabKategori, data: tabData })[tab](); };
    el.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { if (tab === 'tampilan') terapkanTema(Store.app); tab = t.dataset.tab; tema = null; history.replaceState(null, '', '#/pengaturan?tab=' + tab); gambar(); return; }
      const pr = e.target.closest('[data-preset]'); if (pr) { tema = Object.assign({}, tema, PRESET_TEMA[+pr.dataset.preset].t); tabTampilan(); terapkanTema(Object.assign({}, Store.app, { tema, fontJudul: $('#fj', isi).value, fontIsi: $('#fi', isi).value })); return; }
      const hi = e.target.closest('[data-hapus-item]'); if (hi) { hi.closest('.chip').remove(); return; }
      const ti = e.target.closest('[data-tambah-item]'); if (ti) { const card = ti.closest('[data-list]'), inp = $('[data-baru]', card), v = inp.value.trim(); if (!v) return; if ($$('[data-chips] .chip', card).some((c) => c.textContent.trim().toLowerCase() === v.toLowerCase())) return toast(v + ' sudah ada.', 'warning'); $('[data-chips]', card).insertAdjacentHTML('beforeend', `<span class="chip" style="cursor:default">${esc(v)}<button class="link-btn" data-hapus-item aria-label="Hapus ${esc(v)}">${ic('x', 'sm')}</button></span>`); inp.value = ''; return; }
      const hl = e.target.closest('[data-hapus-li]'); if (hl) { hl.closest('.li').remove(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'simpan-id') { const nilai = {}; $$('[data-k]', isi).forEach((i) => { nilai[i.dataset.k] = i.value.trim(); }); if (!nilai.APP_NAMA) return toast('Nama aplikasi wajib diisi.', 'warning'); if (nilai.URL_PUBLIK && !/^https:\/\//.test(nilai.URL_PUBLIK)) return toast('Alamat aplikasi harus diawali https://', 'warning'); simpan(nilai, 'Menyimpan identitas…', a); }
      if (act === 'logo-reset') { if (await simpan({ LOGO_URL: '' }, 'Menyimpan…', a)) tabIdentitas(); }
      if (act === 'tema-reset') { tema = Object.assign({}, temaEfektif(J('TEMA'))); terapkanTema(Store.app); tabTampilan(); }
      if (act === 'simpan-tema') { if (await simpan({ TEMA: Object.assign({}, tema, { gaya: 2 }), FONT_JUDUL: $('#fj', isi).value, FONT_ISI: $('#fi', isi).value }, 'Menerapkan tampilan…', a)) { cfg.fontJudul = $('#fj', isi).value; cfg.fontIsi = $('#fi', isi).value; } }
      if (act === 'simpan-pin') {
        const v = (id) => Math.round(num($('#' + id, isi).value));
        const baru = { panjang: v('ap-pj'), maksGagal: v('ap-mg'), kunciMenit: v('ap-km'), sesiJam: v('ap-sj'), kunciOtomatisMenit: v('ap-ko'), masaBerlakuHari: v('ap-mb'), tolakLemah: $('#ap-tl', isi).checked, pinTtdTerpisah: $('#ap-tt', isi).checked, aksi: $$('[data-aksi]:checked', isi).map((c) => c.dataset.aksi) };
        const batas = [['panjang', 4, 8, 'Panjang PIN'], ['maksGagal', 3, 10, 'Batas salah PIN'], ['kunciMenit', 1, 1440, 'Lama dikunci'], ['sesiJam', 1, 72, 'Lama sesi'], ['kunciOtomatisMenit', 0, 240, 'Kunci layar otomatis'], ['masaBerlakuHari', 0, 365, 'Masa berlaku PIN']];
        const salah = batas.find((b) => !(baru[b[0]] >= b[1] && baru[b[0]] <= b[2])); if (salah) return toast(salah[3] + ' harus ' + salah[1] + '–' + salah[2] + '.', 'warning');
        if (await simpan({ ATURAN_PIN: baru }, 'Menyimpan aturan PIN…', a)) { cfg.aturanPin = Object.assign({}, cfg.aturanPin, baru); tabKeamanan(); }
      }
      if (act === 'perm-default') { $$('[data-perm]', isi).forEach((c) => { c.checked = ['beranda', 'pos', 'biaya', 'closing'].includes(c.dataset.perm); }); }
      if (act === 'simpan-peran') { const perm = $$('[data-perm]:checked', isi).map((c) => c.dataset.perm); if (!perm.length) return toast('Pilih minimal satu halaman untuk Kasir.', 'warning'); const at = {}; $$('[data-at]', isi).forEach((c) => { at[c.dataset.at] = c.checked; }); simpan({ LABEL_OWNER: $('#lo', isi).value.trim() || 'Owner', LABEL_KASIR: $('#lk', isi).value.trim() || 'Kasir', PERM_KASIR: perm, ATURAN_KASIR: at }, 'Menyimpan hak akses…', a); }
      if (act === 'simpan-op') {
        const target = Math.round(num($('#o-t', isi).value)); if (!(target >= 1)) return toast('Target cup minimal 1.', 'warning');
        const buka = $('#o-b', isi).value, tutup = $('#o-c', isi).value; if (buka && tutup && buka >= tutup) return toast('Jam tutup harus setelah jam buka.', 'warning');
        simpan({ TARGET_CUP: String(target), PLAFON_BIAYA: String(parseRp($('#o-p', isi).value)), JAM_BUKA: buka, JAM_TUTUP: tutup, SALDO_AWAL_PERTAMA: String(parseRp($('#o-s', isi).value)), TANGGAL_MULAI: $('#o-m', isi).value }, 'Menyimpan & menghitung ulang saldo…', a);
      }
      if (act === 'kb-tambah') { $('#kb', isi).insertAdjacentHTML('beforeend', `<div class="row li" data-kb><input class="input grow" data-f="nama" placeholder="Nama kategori" aria-label="Nama kategori"><div class="input-rp" style="width:150px"><span>Rp</span><input class="input" data-f="acuan" inputmode="numeric" placeholder="0" aria-label="Nominal acuan"></div><button class="btn ghost icon-only sm" data-hapus-li aria-label="Hapus">${ic('trash', 'sm')}</button></div>`); $$('#kb [data-f=nama]', isi).pop().focus(); }
      if (act === 'tc-tambah') { const kb = $$('#kb [data-kb]', isi).map((r) => $('[data-f=nama]', r).value.trim()).filter(Boolean); $('#tc', isi).insertAdjacentHTML('beforeend', tcBaris({}, kb)); }
      if (act === 'simpan-kat') {
        const lama = J('KATEGORI_BIAYA') || [];
        const kb = $$('#kb [data-kb]', isi).map((r) => { const nm = $('[data-f=nama]', r).value.trim(); const o = lama.find((x) => x.nama === nm) || {}; return { nama: nm, acuan: parseRp($('[data-f=acuan]', r).value), ikon: o.ikon || 'truck' }; }).filter((x) => x.nama);
        const tc = $$('#tc [data-tc]', isi).map((r) => ({ label: $('[data-f=label]', r).value.trim(), kategori: $('[data-f=kategori]', r).value, nominal: parseRp($('[data-f=nominal]', r).value), ket: $('[data-f=ket]', r).value.trim() })).filter((x) => x.label && x.nominal > 0);
        if (!kb.length) return toast('Minimal satu kategori biaya.', 'warning');
        if (new Set(kb.map((x) => x.nama.toLowerCase())).size !== kb.length) return toast('Ada nama kategori biaya yang sama.', 'warning');
        const nilai = { KATEGORI_BIAYA: kb, TOMBOL_CEPAT_BIAYA: tc };
        let kosong = '';
        $$('[data-list]', isi).forEach((c) => { nilai[c.dataset.list] = $$('[data-chips] .chip', c).map((x) => x.textContent.trim()); if (!nilai[c.dataset.list].length) kosong = kosong || $('h3', c).textContent; });
        if (kosong) return toast(kosong + ' minimal berisi satu pilihan.', 'warning');
        simpan(nilai, 'Menyimpan kategori…', a);
      }
      if (act === 'sys') muatSys(true);
      if (act === 'au-unduh') unduhPDF('Riwayat-Aktivitas-' + hariIni(), 'Riwayat aktivitas', [{ k: 'waktu', l: 'Waktu' }, { k: 'nama', l: 'Pengguna' }, { k: 'aksiL', l: 'Aksi' }, { k: 'entitas', l: 'Data' }, { k: 'detail', l: 'Detail' }], auditRows.map((x) => Object.assign({}, x, { aksiL: labelAksi(x.aksi) })), [], { landscape: true });
      if (act === 'im-pindai' || act === 'im-jalan') {
        const src = $('#im-src', isi).value.trim(); if (!src) return toast('Tempel URL spreadsheet sumber.', 'warning');
        const sheets = $$('[data-im]:checked', isi).map((c) => c.dataset.im); if (!sheets.length) return toast('Pilih minimal satu sheet.', 'warning');
        const dryRun = act === 'im-pindai';
        if (!dryRun && !(await konfirmasi({ title: 'Jalankan impor?', text: 'Data dari sumber ditambahkan ke database. Data yang sudah ada tidak digandakan. Sebaiknya lihat Pratinjau impor dulu.', ok: 'Jalankan impor' }))) return;
        a.classList.add('busy'); Loader.show(dryRun ? 'Membaca sumber…' : 'Mengimpor data…', 'Membaca spreadsheet sumber');
        const r = await API.call('import.jalankan', { sumber: src, sheets, dryRun, timpa: $('#im-timpa', isi).checked }).catch((e2) => ({ success: false, message: e2.message }));
        a.classList.remove('busy');
        if (r.success) { Loader.hide(); toast(r.message, 'success'); $('#im-hasil', isi).innerHTML = laporanImpor(r.data); if (!dryRun) { Cache.basi(); App.segarkanBoot(); } } else { Loader.hide(); toast(r.message, 'error'); }
      }
      if (act === 'mulai-riil') {
        if (!(await konfirmasi({ title: 'Kosongkan data contoh?', text: 'Semua transaksi, biaya, belanja, rekap, opname, dan dokumen contoh dihapus permanen.', ok: 'Ya, lanjutkan', danger: true }))) return;
        const pin = await mintaPin({ title: 'Konfirmasi PIN Owner', sub: 'Tindakan ini tidak dapat dibatalkan' }); if (!pin) return;
        const r = await tulis('data.mulaiRiil', { pin, saldoAwal: parseRp($('#mr-s', isi).value), tanggalMulai: $('#mr-t', isi).value, kosongkanStok: $('#mr-st', isi).checked, hapusAset: $('#mr-as', isi).checked, nonaktifKasirDemo: $('#mr-k', isi).checked }, { btn: a, teks: 'Mengosongkan data contoh…', sub: 'Menyiapkan pembukuan riil', segera: true });
        if (r.success) { Cache.hapusSemua(); await App.segarkanBoot(); location.hash = '#/dashboard'; }
      }
    });
    isi.innerHTML = '<div class="skel h-200"></div>';
    API.call('pengaturan.get', {}).then((r) => { if (!r.success) { isi.innerHTML = `<div class="card">${kosongHTML(r.message, 'alert')}</div>`; return; } cfg = { nilai: r.data.nilai, modul: r.data.modul, khususOwner: r.data.khususOwner, aturanInfo: r.data.aturanInfo, aturanPin: r.data.aturanPin || {}, aturanPinAksi: r.data.aturanPinAksi || {}, fontJudulOpsi: r.data.fontJudul, fontIsiOpsi: r.data.fontIsi, fontJudul: r.data.nilai.FONT_JUDUL, fontIsi: r.data.nilai.FONT_ISI, demo: r.data.demo }; gambar(); }).catch((e) => { isi.innerHTML = `<div class="card">${kosongHTML(e.message, 'alert')}</div>`; });
    return () => { if (tab === 'tampilan' && Store.app) terapkanTema(Store.app); };
  }
};

/* ============================== DOKUMEN RESMI (Doc Engine) ==============================
   Penanda tangan TIDAK dipilih dari daftar nama: setiap slot terikat ke akun.
   - Slot "Pembuat"  → akun yang membuat dokumen (mis. kasir yang closing)
   - Slot "Owner"    → akun Owner mana pun yang sedang masuk
   Angka dokumen yang bersumber dari pembukuan dihitung ulang server (tidak bisa diketik). */
const PERAN_SLOT = { PEMBUAT: 'Pembuat dokumen', OWNER: 'Owner' };
Pages.dokumen = {
  izin: () => Store.punya('dokumen') || !!Store.aturan.ajukanDokumen,
  render(el, q) {
    let tab = 'dokumen', status = 'Semua', tpl = [], docs = [];
    const penuh = Store.punya('dokumen');
    const P = Pilih(el, { onChange: () => bar() });
    const bar = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm danger" data-bulk="hapus">${ic('trash', 'sm')}Hapus draf</button>`); };
    const milik = (d) => Store.owner() || d.idPembuat === Store.me.id;
    const giliranDari = (d) => (d.penandatangan || []).filter((s) => s.status !== 'DISETUJUI').sort((a, b) => a.slot - b.slot)[0] || null;
    const bolehSlot = (s) => !!s && (s.peran === 'OWNER' ? Store.owner() : s.idUser === Store.me.id);
    const baseUrl = () => location.origin + location.pathname.replace(/[^/]*$/, '');
    el.innerHTML = `${kepala({ judul: 'Dokumen resmi', desc: 'Slip tutup kasir, nota belanja, berita acara opname, dan laporan bulanan. Angka diambil dari pembukuan, ditandatangani dengan PIN akun masing-masing, lalu terbit sebagai PDF ber-QR yang bisa dicek keasliannya.', acts: `<button class="btn primary" data-act="buat">${ic('plus', 'sm')}Buat dokumen</button>` })}
      <div class="row wrap between gap-8 mb-12"><div id="tabs"></div><div id="ring" class="row wrap gap-8"></div></div><div id="isi"></div>`;
    const isi = $('#isi', el);
    $('#tabs', el).innerHTML = penuh ? segHTML([{ v: 'dokumen', l: 'Dokumen' }, { v: 'template', l: 'Template' }], tab) : '';
    if (penuh) pasangSeg($('#tabs .seg', el), (v) => { tab = v; P.kosongkan(); gambar(); });
    const gambar = () => {
      const st = { Semua: docs.length, MENUNGGU_TTD: 0, DRAF: 0, TERBIT: 0, DITARIK: 0 }; docs.forEach((d) => { st[d.status] = (st[d.status] || 0) + 1; });
      $('#ring', el).innerHTML = '';
      if (tab === 'dokumen') {
        const rows = docs.filter((d) => status === 'Semua' || d.status === status);
        isi.innerHTML = `<div class="card"><div class="chips scroll mb-12">${['Semua', 'MENUNGGU_TTD', 'DRAF', 'TERBIT', 'DITARIK'].map((s) => `<button class="chip ${s === status ? 'on' : ''}" data-st="${s}">${s === 'Semua' ? 'Semua' : { MENUNGGU_TTD: 'Menunggu tanda tangan', DRAF: 'Draf', TERBIT: 'Terbit', DITARIK: 'Ditarik' }[s]} <span class="n">${st[s] || 0}</span></button>`).join('')}</div><div id="bulk"></div>
          ${rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${P.th()}<th>Dokumen</th><th>Nomor</th><th class="c">Tanda tangan</th><th>Dibuat</th><th class="c">Status</th><th></th></tr></thead><tbody>${rows.map((d) => { const ok = d.penandatangan.filter((s) => s.status === 'DISETUJUI').length; const g = d.status === 'MENUNGGU_TTD' && bolehSlot(giliranDari(d)); const kor = (d.koreksi || []).length; return `<tr data-buka="${esc(d.id)}" style="cursor:pointer">${P.td(d.id, d.status === 'DRAF' && milik(d))}<td data-l="Dokumen" class="main-cell"><b>${esc(d.judul)}</b><div class="xs muted">${esc(d.templateNama)} · <span class="id">${esc(d.id)}</span></div>${kor ? '<div class="xs warn strong mt-4">Data pembukuan dikoreksi setelah terbit</div>' : ''}${d.status === 'TERBIT' && !d.pdfSiap ? '<div class="xs muted mt-4">PDF sedang disiapkan</div>' : ''}</td><td data-l="Nomor" class="tnum small">${esc(d.nomor || '—')}</td><td data-l="Tanda tangan" class="c"><span class="badge ${ok === d.penandatangan.length ? 'success' : ''} plain">${ok}/${d.penandatangan.length}</span>${g ? '<div class="xs warn strong mt-4">Giliran Anda</div>' : ''}</td><td data-l="Dibuat" class="small">${esc(d.oleh)}<div class="xs muted">${esc(relatif(d.dibuat))}</div></td><td data-l="Status" class="c">${badgeStatus(d.status)}${kor ? ' ' + badgeStatus('DIKOREKSI') : ''}</td><td class="r" data-l="">${ic('chev-r', 'sm')}</td></tr>`; }).join('')}</tbody></table></div>` : kosongHTML(status === 'Semua' ? 'Belum ada dokumen. Tekan "Buat dokumen" untuk mulai.' : 'Tidak ada dokumen dengan status ini.', 'doc')}</div>`;
        P.segar(); bar();
      } else {
        isi.innerHTML = `<div class="stack"><div class="grid g-2">${tpl.map((t) => `<div class="card"><div class="row top"><span class="icon-box s">${ic(t.engine === 'sheets' ? 'grid' : t.engine === 'slides' ? 'image' : 'file', 'sm')}</span><div class="grow"><h3>${esc(t.nama)}</h3><div class="xs muted"><span class="id">${esc(t.kode)}</span> · Google ${t.engine === 'docs' ? 'Docs' : t.engine === 'sheets' ? 'Sheets' : 'Slides'} · versi ${t.versi}</div></div>${t.aktif ? '<span class="badge success plain">Aktif</span>' : '<span class="badge plain">Nonaktif</span>'}</div>
          ${t.deskripsi ? `<p class="small muted mt-8">${esc(t.deskripsi)}</p>` : ''}
          <div class="mt-12">${t.slotTtd.map((s) => `<div class="sum-row small"><span>Tanda tangan ${s.slot}: ${esc(s.label)}</span><span class="muted">${PERAN_SLOT[s.peran] || s.peran}</span></div>`).join('') || '<div class="xs muted">Tanpa tanda tangan</div>'}</div>
          <div class="xs muted mt-8">${t.skema.bidang.length} isian · ${t.skema.blok.length} tabel berulang${t.sumberData ? ' · angka dari pembukuan' : ''} · nomor <span class="tnum">${esc(t.formatNomor)}</span></div>
          <div class="row wrap gap-8 mt-12"><a class="btn sm" href="${esc(t.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka di Google</a><button class="btn sm" data-pindai="${esc(t.id)}">${ic('refresh', 'sm')}Pindai ulang</button><button class="btn sm" data-skema="${esc(t.id)}">${ic('list', 'sm')}Isian</button>${Store.owner() ? `<button class="btn sm" data-tpl-edit="${esc(t.id)}">${ic('edit', 'sm')}Ubah</button>` : ''}</div></div>`).join('')}</div>
          ${Store.owner() ? `<div class="card"><div class="card-head"><div><h3>Daftarkan template baru</h3><div class="sub">Desain di Google Docs/Sheets/Slides dengan penanda {{…}}, lalu tempel alamatnya di sini.</div></div><button class="btn primary sm" data-act="daftar">${ic('plus', 'sm')}Daftarkan</button></div>
            <div class="formula">{{NAMA_FIELD}} · {{TOTAL|rupiah}} · {{TOTAL|terbilang:rupiah}} · {{TANGGAL_X|tanggal:dd MMMM yyyy}} · {{CATATAN|bawaan:-}}<br>{{#ITEM}}{{ITEM.NAMA}} … {{/ITEM}} untuk baris tabel berulang · {{?SYARAT}}…{{/SYARAT}} untuk bagian opsional<br>Diisi sistem: {{NOMOR}} {{TANGGAL}} {{INSTITUSI_NAMA}} {{KOTA}} {{QR}} {{KODE_VERIFIKASI}} {{URL_VERIFIKASI}} · tanda tangan: {{JABATAN_1}} {{TTD_1}} {{NAMA_PEJABAT_1}}</div></div>` : ''}</div>`;
      }
    };
    /* PDF dokumen terbit dibuat di latar setelah tanda tangan terakhir — pengguna tidak menunggu */
    const siapkanPdf = (id, diam) => {
      API.call('de.dokumen.render', { id }).then((r) => {
        if (r.success) { Cache.basi(); if (!diam) toast('PDF dokumen siap diunduh.', 'success'); muat(true); }
        else if (r.code !== 'PROSES' && !diam) toast(r.message, 'warning', 'PDF belum jadi');
      }).catch(() => { });
    };
    const lihatPdf = async (d, btn, aksi) => {
      btn && btn.classList.add('busy'); Topline.start(); const lambat = setTimeout(() => Loader.show(aksi === 'pratinjau' ? 'Menyusun pratinjau…' : 'Mengambil PDF…', 'Dari template Google'), 650);
      const rr = await API.call(aksi === 'pratinjau' ? 'de.dokumen.pratinjau' : 'de.dokumen.unduh', { id: d.id }).catch((e2) => ({ success: false, message: e2.message }));
      clearTimeout(lambat); Loader.hide(); Topline.done(); btn && btn.classList.remove('busy');
      if (!rr.success) return toast(rr.message, rr.code === 'PROSES' ? 'info' : 'error');
      Pratinjau.pdfBase64(rr.data.base64, rr.data.nama, aksi === 'pratinjau' ? 'Pratinjau (belum sah)' : d.judul, aksi === 'pratinjau' ? 'Tanda air PRATINJAU. Nomor & QR muncul setelah semua tanda tangan.' : 'No. ' + d.nomor + (rr.data.hash ? ' · SHA-256 ' + rr.data.hash.slice(0, 16) + '…' : ''));
    };
    const detail = async (id) => {
      Topline.start(); const lambat = setTimeout(() => Loader.show('Membuka dokumen…'), 650);
      const r = await API.call('de.dokumen.get', { id }).catch((e) => ({ success: false, message: e.message })); clearTimeout(lambat); Loader.hide(); Topline.done();
      if (!r.success) return toast(r.message, 'error');
      const d = r.data, giliran = giliranDari(d);
      const sayaGiliran = d.status === 'MENUNGGU_TTD' && bolehSlot(giliran);
      const nilai = (d.data && d.data.nilai) || {};
      if (d.urlVerifikasi && !/^https?:/.test(d.urlVerifikasi)) d.urlVerifikasi = baseUrl() + d.urlVerifikasi;
      const qrSvg = d.status === 'TERBIT' && d.urlVerifikasi && window.QR_ ? QR_.svg(d.urlVerifikasi, 4) : '';
      const siapa = (s) => s.status === 'DISETUJUI' ? esc(s.nama) + (s.atasNama ? ' <span class="xs muted">(bypass, atas nama ' + esc(s.atasNama) + ')</span>' : '') : s.peran === 'OWNER' ? 'Owner yang menandatangani' : s.idUser === Store.me.id ? esc(s.nama) + ' (Anda)' : esc(s.nama || 'Pembuat dokumen');
      const kor = d.koreksi || [];
      const m = Modal.open({
        title: esc(d.judul), sub: `${esc(d.templateNama)} · ${d.nomor ? 'No. ' + esc(d.nomor) : 'belum bernomor'} · dibuat ${esc(d.oleh)}`, size: 'lg',
        body: `<div class="row wrap gap-8 mb-12">${badgeStatus(d.status)}${kor.length ? badgeStatus('DIKOREKSI') : ''}</div>
          ${d.catatan ? `<div class="notice ${d.status === 'DITARIK' ? 'danger' : ''} mb-12">${ic('info')}<div class="small">${esc(d.catatan)}</div></div>` : ''}
          ${kor.length ? `<div class="notice mb-12">${ic('alert')}<div class="small"><b>Data pembukuan dikoreksi setelah dokumen terbit.</b> Dokumen tetap sah sebagai bukti saat diterbitkan; halaman verifikasi menampilkan catatan ini.<ul>${kor.slice(-4).map((k) => `<li>${esc(tgl(k.waktu, 'd MMM yyyy HH:mm'))} · ${esc(k.oleh)}: ${esc(k.alasan)}</li>`).join('')}</ul></div></div>` : ''}
          <div class="grid g-2"><div><h3 class="mb-8">Tanda tangan</h3>${d.penandatangan.map((s) => `<div class="sig"><span class="icon-box s ${s.status === 'DISETUJUI' ? 'success' : giliran && giliran.slot === s.slot && d.status === 'MENUNGGU_TTD' ? 'warning' : ''}">${ic(s.status === 'DISETUJUI' ? 'check' : 'sign', 'sm')}</span><div class="grow"><div class="small strong">${esc(s.label)}</div><div class="xs muted">${siapa(s)}</div>${s.status === 'DISETUJUI' ? `<div class="xs ok">Ditandatangani ${esc(tgl(s.waktu, 'd MMM yyyy HH:mm'))}${s.metode === 'BYPASS' ? ' · bypass Owner' : ''}</div>` : giliran && giliran.slot === s.slot && d.status === 'MENUNGGU_TTD' ? '<div class="xs warn">Menunggu</div>' : ''}</div></div>`).join('') || '<div class="xs muted">Tanpa tanda tangan</div>'}
            ${d.riwayat.length ? `<h3 class="mt-16 mb-8">Riwayat</h3><div class="timeline">${d.riwayat.slice(-8).map((h) => `<div class="ev ${h.status === 'DISETUJUI' ? 'ok' : 'bad'}"><div class="small"><b>${esc({ DISETUJUI: 'Ditandatangani', DITOLAK: 'Ditolak', DIULANG: 'Diulang', DIKOREKSI: 'Dikoreksi', DITARIK: 'Ditarik' }[h.status] || h.status)}</b>${h.slot ? ' · slot ' + h.slot : ''} · ${esc(h.oleh)}</div><div class="xs muted">${esc(tgl(h.waktu, 'd MMM HH:mm'))} ${esc(h.catatan)}</div></div>`).join('')}</div>` : ''}</div>
            <div>${d.status === 'TERBIT' ? `<h3 class="mb-8">Cek keaslian</h3><div class="row top gap-12"><div class="qr-box">${qrSvg}</div><div class="grow small"><div class="muted xs">Kode verifikasi</div><b class="tnum">${esc(d.kodeVerifikasi)}</b>${d.hashPdf ? `<div class="muted xs mt-8">Sidik PDF (SHA-256)</div><div class="id" style="word-break:break-all">${esc(d.hashPdf)}</div>` : '<div class="xs muted mt-8">PDF sedang disiapkan…</div>'}<button class="btn xs mt-8" data-salin="${esc(d.urlVerifikasi)}">${ic('copy', 'sm')}Salin tautan</button></div></div>` : `<h3 class="mb-8">Isian utama</h3><div class="inset">${Object.keys(nilai).slice(0, 10).map((k) => `<div class="sum-row"><span class="muted small">${esc(k.replace(/_/g, ' ').toLowerCase())}</span><span class="v small">${esc(typeof nilai[k] === 'number' && /TOTAL|SALDO|OMSET|TIPS|BELANJA|PENGELUARAN|LABA|NOTA|BIAYA|MASUK/.test(k) ? rp(nilai[k]) : nilai[k])}</span></div>`).join('') || '<div class="xs muted">Belum ada isian.</div>'}</div>${d.sumberData ? '<p class="xs muted mt-8">Angka diambil langsung dari pembukuan dan dihitung ulang saat diajukan & ditandatangani.</p>' : ''}`}
              <div class="xs muted mt-8">${Object.keys((d.data && d.data.blok) || {}).map((b) => esc(b.toLowerCase()) + ': ' + d.data.blok[b].length + ' baris').join(' · ')}</div></div></div>`,
        foot: [
          d.status === 'DRAF' && milik(d) ? `<button class="btn danger" data-a="hapus">${ic('trash', 'sm')}Hapus</button><span class="grow"></span><button class="btn" data-a="ubah">${ic('edit', 'sm')}Ubah</button><button class="btn" data-a="pratinjau">${ic('eye', 'sm')}Pratinjau</button><button class="btn primary" data-a="ajukan">${ic('send', 'sm')}Ajukan tanda tangan</button>` : '',
          d.status === 'DRAF' && !milik(d) ? `<button class="btn" data-a="pratinjau">${ic('eye', 'sm')}Pratinjau</button>` : '',
          d.status === 'MENUNGGU_TTD' ? `<button class="btn" data-a="pratinjau">${ic('eye', 'sm')}Pratinjau</button><span class="grow"></span>${sayaGiliran || Store.owner() ? `<button class="btn danger" data-a="tolak">${ic('x', 'sm')}Kembalikan ke draf</button>` : ''}${!sayaGiliran && Store.owner() && giliran ? `<button class="btn" data-a="bypass">${ic('key', 'sm')}Bypass Owner</button>` : ''}${sayaGiliran ? `<button class="btn primary" data-a="ttd">${ic('sign', 'sm')}Tanda tangani</button>` : ''}` : '',
          d.status === 'TERBIT' ? `${Store.owner() ? `<button class="btn danger" data-a="tarik">${ic('ban', 'sm')}Tarik</button>` : ''}<span class="grow"></span><a class="btn" href="${esc(d.urlVerifikasi)}" target="_blank" rel="noopener">${ic('shield', 'sm')}Halaman verifikasi</a>${d.pdfSiap ? `<button class="btn primary" data-a="lihat">${ic('eye', 'sm')}Lihat & unduh PDF</button>` : `<button class="btn primary" data-a="siapkan">${ic('refresh', 'sm')}Siapkan PDF</button>`}` : '',
          d.status === 'DITARIK' && d.pdfSiap ? `<button class="btn" data-a="lihat">${ic('eye', 'sm')}Lihat PDF</button>` : ''
        ].join('')
      });
      m.el.addEventListener('click', async (e) => {
        const s = e.target.closest('[data-salin]'); if (s) { navigator.clipboard.writeText(s.dataset.salin).then(() => toast('Tautan verifikasi disalin.', 'success'), () => toast('Tidak bisa menyalin otomatis. Tautan: ' + s.dataset.salin, 'info')); return; }
        const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a;
        if (act === 'hapus') { if (!(await konfirmasi({ title: 'Hapus draf?', text: 'Draf yang belum diajukan dihapus permanen.', danger: true, ok: 'Hapus' }))) return; if ((await tulis('de.dokumen.hapus', { id }, { btn: a, teks: 'Menghapus draf…' })).success) { m.close(); muat(true); } }
        if (act === 'ubah') { m.close(); editor(tpl.find((t) => t.id === d.templateId) || d.template, d); }
        if (act === 'ajukan') { if ((await tulis('de.dokumen.ajukan', { id }, { btn: a, teks: 'Mengajukan dokumen…' })).success) { m.close(); muat(true); detail(id); } }
        if (act === 'pratinjau') lihatPdf(d, a, 'pratinjau');
        if (act === 'lihat') lihatPdf(d, a, 'unduh');
        if (act === 'siapkan') { a.classList.add('busy'); const rr = await API.call('de.dokumen.render', { id }).catch((e2) => ({ success: false, message: e2.message })); a.classList.remove('busy'); if (rr.success) { m.close(); muat(true); detail(id); } else toast(rr.message, rr.code === 'PROSES' ? 'info' : 'error'); }
        if (act === 'ttd' || act === 'bypass') {
          let alasan = ''; if (act === 'bypass') { alasan = await mintaTeks({ title: 'Bypass tanda tangan', label: 'Alasan (tercatat di riwayat & dokumen)', placeholder: 'mis. kasir sakit, slip perlu segera diserahkan', min: 5, ok: 'Lanjut', area: true }); if (!alasan) return; }
          const pin = await mintaPin({ title: act === 'ttd' ? 'Tanda tangan' : 'PIN Owner untuk bypass', sub: act === 'ttd' ? giliran.label + ' · ' + Store.me.nama : '', ttd: true }); if (!pin) return;
          const rr = await tulis('de.dokumen.setujui', { id, slot: giliran ? giliran.slot : undefined, pin, bypass: act === 'bypass', alasan, baseUrl: baseUrl() }, { btn: a, teks: 'Menandatangani…', pinTtd: true });
          if (rr.code === 'DATA_BERUBAH') { m.close(); muat(true); detail(id); return; }
          if (rr.success) { m.close(); if (rr.data && rr.data.perluRender) siapkanPdf(id); muat(true); detail(id); }
        }
        if (act === 'tolak') { const cat = await mintaTeks({ title: 'Kembalikan ke draf', label: 'Alasan (dibaca pembuat dokumen)', min: 3, ok: 'Lanjut', area: true }); if (!cat) return; const pin = await mintaPin({ title: 'Konfirmasi PIN' }); if (!pin) return; if ((await tulis('de.dokumen.tolak', { id, catatan: cat, pin }, { btn: a, teks: 'Mengembalikan ke draf…' })).success) { m.close(); muat(true); } }
        if (act === 'tarik') { const al = await mintaTeks({ title: 'Tarik dokumen ' + d.nomor, label: 'Alasan penarikan', placeholder: 'Halaman verifikasi akan menyatakan dokumen tidak berlaku', min: 5, ok: 'Tarik dokumen', area: true }); if (!al) return; if ((await tulis('de.dokumen.tarik', { id, alasan: al }, { btn: a, teks: 'Menarik dokumen…' })).success) { m.close(); muat(true); } }
      });
    };
    const pilihTemplate = () => {
      const list = tpl.filter((t) => t.aktif);
      if (!list.length) return toast('Belum ada template aktif.', 'warning');
      const m = Modal.open({ title: 'Buat dokumen', sub: 'Pilih jenis dokumen', size: 'lg', body: `<div class="grid g-2">${list.map((t) => `<button class="qa" data-t="${esc(t.id)}"><span class="icon-box s">${ic('doc', 'sm')}</span><div><div class="t">${esc(t.nama)}</div><div class="s">${esc(t.deskripsi || t.kode)}</div></div>${ic('chev-r', 'sm chev')}</button>`).join('')}</div>` });
      $$('[data-t]', m.el).forEach((b) => b.onclick = () => { m.close(); pilihRef(tpl.find((t) => t.id === b.dataset.t)); });
    };
    const pilihRef = async (t) => {
      if (!t.sumberData) return editor(t, null);
      let input = '';
      if (t.sumberData === 'closing' || t.sumberData === 'opname') input = `<div class="field"><label>Tanggal ${t.sumberData === 'closing' ? 'closing' : 'stok opname'}</label><input type="date" class="input" id="ref" value="${addDays(hariIni(), t.sumberData === 'closing' ? -1 : 0)}" max="${hariIni()}"></div>`;
      else if (t.sumberData === 'bulanan') input = `<div class="field"><label>Bulan laporan</label><input type="month" class="input" id="ref" value="${addDays(awalBulan(), -1).slice(0, 7)}" max="${hariIni().slice(0, 7)}"></div>`;
      else if (t.sumberData === 'belanja') { const b = Cache.get(Cache.key('belanja.list', Param.bulan30())); const rr = b ? { success: true, data: b.d } : await API.call('belanja.list', Param.bulan30()).catch((e) => ({ success: false, message: e.message })); if (!rr.success) return toast(rr.message, 'error'); input = `<div class="field"><label>Nota belanja</label><select class="input" id="ref">${rr.data.rows.filter((n) => !n.batal).map((n) => `<option value="${esc(n.id)}">${esc(n.id)} · ${tgl(n.tanggal, 'd MMM')} · ${rp(n.total)}</option>`).join('')}</select></div>`; }
      const m = Modal.open({ title: esc(t.nama), sub: 'Angka diambil langsung dari pembukuan.', size: 'sm', body: input, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Lanjut</button>` });
      $('[data-b]', m.el).onclick = () => m.close();
      $('[data-ok]', m.el).onclick = async (e) => { const ref = $('#ref', m.el).value; if (!ref) return toast('Pilih data sumber.', 'warning'); const btn = e.currentTarget; btn.classList.add('busy'); const r = await API.call('de.dokumen.prefill', { templateId: t.id, ref }).catch((e2) => ({ success: false, message: e2.message })); btn.classList.remove('busy'); if (!r.success) return toast(r.message, 'error'); m.close(); editor(t, { data: r.data.data, judul: r.data.judul, refId: ref }, r.data.terkunci || []); };
    };
    const inputBidang = (b, v, kunci) => {
      const val = v === undefined || v === null ? '' : v;
      if (kunci) return `<div class="input" style="background:var(--c-inset);display:flex;align-items:center;gap:6px" title="Diambil dari pembukuan">${ic('lock', 'sm')}<span class="grow">${esc(b.tipe === 'uang' ? rp(val) : b.tipe === 'tanggal' && val ? tgl(String(val).slice(0, 10), 'd MMM yyyy') : val)}</span></div>`;
      if (b.tipe === 'teks_panjang') return `<textarea class="input" data-b="${b.kunci}">${esc(val)}</textarea>`;
      if (b.tipe === 'tanggal') return `<input type="date" class="input" data-b="${b.kunci}" value="${esc(String(val).slice(0, 10))}">`;
      if (b.tipe === 'uang') return `<div class="input-rp"><span>Rp</span><input class="input" data-b="${b.kunci}" data-uang inputmode="numeric" value="${val === '' ? '' : fmtNum(val)}"></div>`;
      if (b.tipe === 'angka') return `<input class="input" data-b="${b.kunci}" type="number" min="0" step="any" value="${esc(val)}">`;
      return `<input class="input" data-b="${b.kunci}" value="${esc(val)}" ${b.tipe === 'email' ? 'type="email"' : ''}>`;
    };
    const editor = async (t, dok, terkunci) => {
      if (!t) return toast('Template tidak ditemukan.', 'error');
      const data = (dok && dok.data) || { nilai: {}, blok: {}, kondisi: {} };
      if (t.sumberData && !terkunci && dok && dok.id) { const r = await API.call('de.dokumen.prefill', { templateId: t.id, ref: dok.refId }).catch(() => null); terkunci = r && r.success ? r.data.terkunci || [] : Object.keys(data.nilai); }
      terkunci = terkunci || [];
      const blokKunci = !!t.sumberData;
      const blokHTML = (bk) => { const rows = data.blok[bk.nama] || []; return `<div class="card flat pad-s mt-12" data-blok="${bk.nama}"><div class="row between mb-8"><b class="small">${esc(bk.label)} <span class="muted">(${rows.length} baris)</span></b>${blokKunci ? `<span class="xs muted">${ic('lock', 'sm')} dari pembukuan</span>` : `<button class="btn xs" data-tambah-baris>${ic('plus', 'sm')}Baris</button>`}</div><div class="table-wrap"><table class="tbl"><thead><tr>${bk.kolom.map((c) => `<th>${esc(c.label)}</th>`).join('')}${blokKunci ? '' : '<th></th>'}</tr></thead><tbody>${rows.map((r) => `<tr>${bk.kolom.map((c) => blokKunci ? `<td class="small">${esc(typeof r[c.kunci] === 'number' && /HARGA|TOTAL|SUBTOTAL|NOMINAL/.test(c.kunci) ? rp(r[c.kunci]) : r[c.kunci] === undefined ? '' : r[c.kunci])}</td>` : `<td><input class="input" data-c="${c.kunci}" value="${esc(r[c.kunci] === undefined ? '' : r[c.kunci])}"></td>`).join('')}${blokKunci ? '' : `<td><button class="btn ghost icon-only xs" data-hapus-baris aria-label="Hapus baris">${ic('x', 'sm')}</button></td>`}</tr>`).join('')}</tbody></table></div></div>`; };
      const bidangBebas = t.skema.bidang.filter((b) => !terkunci.includes(b.kunci)), bidangKunci = t.skema.bidang.filter((b) => terkunci.includes(b.kunci));
      const m = Modal.open({
        title: (dok && dok.id ? 'Ubah ' : '') + esc(t.nama), sub: t.sumberData ? 'Angka bergembok diambil dari pembukuan dan tidak bisa diubah di sini.' : 'Isian dibuat otomatis dari penanda di template (versi ' + t.versi + ')', size: 'xl',
        body: `<div class="field"><label>Judul dokumen</label><input class="input" id="judul" value="${esc((dok && dok.judul) || t.nama)}" ${t.sumberData ? 'readonly style="background:var(--c-inset)"' : ''}></div>
          ${bidangKunci.length ? `<div class="form-grid mt-12">${bidangKunci.map((b) => `<div class="field"><label>${esc(b.label)}</label>${inputBidang(b, data.nilai[b.kunci], true)}</div>`).join('')}</div>` : ''}
          ${bidangBebas.length ? `${bidangKunci.length ? '<h3 class="mt-16">Isian tambahan</h3>' : ''}<div class="form-grid mt-12">${bidangBebas.map((b) => `<div class="field ${b.tipe === 'teks_panjang' ? 'span-2' : ''}"><label>${esc(b.label)} ${b.wajib ? '' : '<span class="hint">opsional</span>'}</label>${inputBidang(b, data.nilai[b.kunci], false)}</div>`).join('')}</div>` : ''}
          ${t.skema.kondisi.map((k) => `<label class="check mt-8"><input type="checkbox" data-k="${k.kunci}" ${data.kondisi[k.kunci] ? 'checked' : ''}><span class="small">Tampilkan bagian: <b>${esc(k.label)}</b></span></label>`).join('')}
          ${t.skema.blok.map(blokHTML).join('')}
          <h3 class="mt-20 mb-8">Tanda tangan</h3>${t.slotTtd.map((s) => `<div class="sig"><span class="icon-box s">${ic('sign', 'sm')}</span><div class="grow"><div class="small strong">${esc(s.label)}</div><div class="xs muted">${s.peran === 'PEMBUAT' ? esc(dok && dok.id ? (dok.oleh || Store.me.nama) : Store.me.nama) + ' (akun pembuat), dengan PIN sendiri' : 'Owner yang masuk, dengan PIN sendiri'}</div></div></div>`).join('') || '<div class="xs muted">Template ini tanpa tanda tangan.</div>'}`,
        foot: `<button class="btn" data-x2>Batal</button><span class="grow"></span><button class="btn" data-simpan="draf">${ic('check', 'sm')}Simpan draf</button><button class="btn primary" data-simpan="ajukan">${ic('send', 'sm')}Simpan & ajukan</button>`
      });
      m.el.addEventListener('input', (e) => { if (e.target.matches('[data-uang]')) angkaRp(e.target, 'Nominal'); });
      m.el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-x2]')) return m.close();
        const tb = e.target.closest('[data-tambah-baris]'); if (tb) { const card = tb.closest('[data-blok]'); const bk = t.skema.blok.find((b) => b.nama === card.dataset.blok); $('tbody', card).insertAdjacentHTML('beforeend', `<tr>${bk.kolom.map((c) => `<td><input class="input" data-c="${c.kunci}"></td>`).join('')}<td><button class="btn ghost icon-only xs" data-hapus-baris aria-label="Hapus baris">${ic('x', 'sm')}</button></td></tr>`); return; }
        const hb = e.target.closest('[data-hapus-baris]'); if (hb) { hb.closest('tr').remove(); return; }
        const sv = e.target.closest('[data-simpan]'); if (!sv) return;
        const nilai = {}; bidangBebas.forEach((b) => { const inp = $(`[data-b="${b.kunci}"]`, m.el); if (!inp) return; nilai[b.kunci] = b.tipe === 'uang' ? parseRp(inp.value) : b.tipe === 'angka' ? (inp.value === '' ? '' : Math.max(0, num(inp.value.replace(',', '.')))) : inp.value.trim(); });
        const kosong = bidangBebas.filter((b) => b.wajib && (nilai[b.kunci] === '' || nilai[b.kunci] === undefined)).map((b) => b.label);
        if (sv.dataset.simpan === 'ajukan' && kosong.length) return toast('Lengkapi: ' + kosong.slice(0, 4).join(', ') + '.', 'warning');
        const blok = {}; if (!blokKunci) $$('[data-blok]', m.el).forEach((card) => { blok[card.dataset.blok] = $$('tbody tr', card).map((tr) => { const o = {}; $$('[data-c]', tr).forEach((i) => { o[i.dataset.c] = /^-?\d+(\.\d+)?$/.test(i.value) ? num(i.value) : i.value; }); return o; }).filter((o) => Object.values(o).some((v) => v !== '')); });
        const kondisi = {}; $$('[data-k]', m.el).forEach((c) => { kondisi[c.dataset.k] = c.checked; });
        const r = await tulis('de.dokumen.simpan', { id: dok && dok.id, templateId: t.id, data: { nilai, blok, kondisi }, judul: $('#judul', m.el).value.trim(), ref: dok && (dok.refId || dok.ref) || '' }, { btn: sv, teks: 'Menyimpan draf…', toast: sv.dataset.simpan === 'draf' });
        if (!r.success) return;
        const id = r.data.id; m.close();
        if (sv.dataset.simpan === 'ajukan') { const a = await tulis('de.dokumen.ajukan', { id }, { teks: 'Mengajukan…' }); if (!a.success) { muat(true); return detail(id); } }
        muat(true); detail(id);
      });
    };
    const daftarTpl = (t) => {
      const baru = !t;
      const slotHTML = (s) => `<div class="row wrap li" data-slotrow><span class="small strong" style="min-width:24px">${s.slot}</span><input class="input grow" data-sl="label" value="${esc(s.label)}" aria-label="Label tanda tangan ${s.slot}"><select class="input" style="width:200px" data-sl="peran" aria-label="Siapa yang menandatangani">${Object.keys(PERAN_SLOT).map((p) => `<option value="${p}" ${p === s.peran ? 'selected' : ''}>${PERAN_SLOT[p]}</option>`).join('')}</select></div>`;
      const m = Modal.open({ title: baru ? 'Daftarkan template' : 'Ubah template ' + esc(t.kode), size: 'lg', body: `<div class="form-grid">${baru ? `<div class="field span-2"><label>Alamat Google Docs / Sheets / Slides</label><input class="input" id="t-u" placeholder="https://docs.google.com/document/d/…/edit"></div><div class="field"><label>Kode (huruf besar, tanpa spasi)</label><input class="input" id="t-k" placeholder="SURAT_TUGAS"></div>` : ''}<div class="field ${baru ? '' : 'span-2'}"><label>Nama template</label><input class="input" id="t-n" value="${esc(t ? t.nama : '')}"></div><div class="field"><label>Format nomor</label><input class="input" id="t-f" value="${esc(t ? t.formatNomor : '{URUT}/KODE/{BULAN_ROMAWI}/{TAHUN}')}"></div><div class="field"><label>Keterangan</label><input class="input" id="t-d" value="${esc(t ? t.deskripsi : '')}"></div>${baru ? '' : `<div class="field"><label class="row gap-8"><span class="switch"><input type="checkbox" id="t-a" ${t.aktif ? 'checked' : ''}><span></span></span>Template aktif</label></div>`}</div>
        ${baru ? '<p class="xs muted mt-12">Template harus bisa dibuka akun Google pemilik aplikasi. Slot tanda tangan dibaca dari penanda {{TTD_1}}, {{TTD_2}}, … dan siapa yang menandatangani bisa diatur setelah didaftarkan.</p>' : `<h3 class="mt-16 mb-8">Siapa yang menandatangani</h3><p class="xs muted mb-8">Tidak ada pilihan nama: tanda tangan selalu memakai akun yang sedang masuk. "Pembuat dokumen" berarti akun yang membuat draf; "Owner" berarti akun Owner mana pun.</p><div id="t-slot">${t.slotTtd.map(slotHTML).join('') || '<div class="xs muted">Template tanpa penanda tanda tangan.</div>'}</div>`}`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}${baru ? 'Pindai & daftarkan' : 'Simpan'}</button>` });
      $('[data-b]', m.el).onclick = () => m.close();
      $('[data-ok]', m.el).onclick = async (e) => {
        const nama = $('#t-n', m.el).value.trim(); if (!nama) return toast('Nama template wajib diisi.', 'warning');
        let r;
        if (baru) { const url = $('#t-u', m.el).value.trim(), kode = $('#t-k', m.el).value.trim().toUpperCase(); if (!/docs\.google\.com/.test(url)) return toast('Tempel alamat Google Docs/Sheets/Slides.', 'warning'); if (!/^[A-Z0-9_]{3,}$/.test(kode)) return toast('Kode minimal 3 huruf besar/angka/garis bawah.', 'warning'); r = await tulis('de.template.daftar', { url, kode, nama, formatNomor: $('#t-f', m.el).value.trim(), deskripsi: $('#t-d', m.el).value.trim() }, { btn: e.currentTarget, teks: 'Memindai template…', sub: 'Mencari penanda {{…}}' }); }
        else { const slotTtd = $$('[data-slotrow]', m.el).map((row, i) => ({ slot: t.slotTtd[i].slot, label: $('[data-sl=label]', row).value.trim() || t.slotTtd[i].label, peran: $('[data-sl=peran]', row).value })); r = await tulis('de.template.simpan', { id: t.id, nama, formatNomor: $('#t-f', m.el).value.trim(), deskripsi: $('#t-d', m.el).value.trim(), aktif: $('#t-a', m.el).checked, slotTtd }, { btn: e.currentTarget, teks: 'Menyimpan template…' }); }
        if (r.success) { m.close(); muat(true); }
      };
    };
    el.addEventListener('click', async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const st = e.target.closest('[data-st]'); if (st) { status = st.dataset.st; P.kosongkan(); gambar(); return; }
      const b = e.target.closest('[data-bulk]');
      if (b && b.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (b && b.dataset.bulk === 'hapus') { if (!(await konfirmasi({ title: 'Hapus ' + P.ids().length + ' draf?', text: 'Hanya draf yang belum diajukan yang bisa dihapus.', danger: true, ok: 'Hapus' }))) return; if ((await tulis('de.dokumen.hapus', { ids: P.ids() }, { btn: b, teks: 'Menghapus draf…' })).success) { P.kosongkan(); muat(true); } return; }
      const bk = e.target.closest('[data-buka]'); if (bk) return detail(bk.dataset.buka);
      const pi = e.target.closest('[data-pindai]'); if (pi) { if ((await tulis('de.template.pindai', { id: pi.dataset.pindai }, { btn: pi, teks: 'Memindai ulang template…' })).success) muat(true); return; }
      const sk = e.target.closest('[data-skema]'); if (sk) { const t = tpl.find((x) => x.id === sk.dataset.skema); Modal.open({ title: 'Isian ' + esc(t.nama), size: 'lg', body: `<div class="table-wrap"><table class="tbl"><thead><tr><th>Penanda</th><th>Label</th><th>Jenis</th><th>Pengubah</th></tr></thead><tbody>${t.skema.bidang.map((x) => `<tr><td class="id">{{${esc(x.kunci)}}}</td><td>${esc(x.label)}</td><td><span class="badge plain">${esc(x.tipe)}</span></td><td class="small muted">${esc(x.pengubah.join(' | '))}</td></tr>`).join('')}</tbody></table></div>${t.skema.blok.map((x) => `<div class="mt-12 small"><b>Tabel {{#${esc(x.nama)}}}</b>: ${x.kolom.map((c) => esc(c.kunci)).join(', ')}</div>`).join('')}<div class="mt-12 xs muted">Diisi sistem: ${esc(t.skema.sistem.join(', '))}</div>` }); return; }
      const te = e.target.closest('[data-tpl-edit]'); if (te) return daftarTpl(tpl.find((x) => x.id === te.dataset.tplEdit));
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'buat') { if (!tpl.length) return toast('Daftar template belum termuat. Coba lagi sebentar.', 'info'); pilihTemplate(); }
      if (a.dataset.act === 'daftar') daftarTpl(null);
    });
    const muat = (force) => {
      const o = { maxAge: force ? 0 : 20000, force };
      pakai('de.dokumen.list', {}, (d) => { docs = d.rows; gambar(); }, Object.assign({ onError: (msg) => { isi.innerHTML = `<div class="card">${kosongHTML(msg, 'alert')}</div>`; } }, o));
      pakai('de.template.list', {}, (d) => { tpl = d.rows; if (tab === 'template') gambar(); }, o);
    };
    isi.innerHTML = '<div class="skel h-200"></div>';
    muat(false);
    if (q.id) setTimeout(() => detail(q.id), 150);
  }
};
