/* =====================================================================
   Halaman kasir: Beranda, POS, Pengeluaran, Daily Closing
   ===================================================================== */
'use strict';
function kepala({ eyebrow = '', judul = '', desc = '', acts = '', badge = '' }) {
  return `<div class="page-head"><div class="grow">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<div class="row wrap gap-8" style="margin-top:4px"><h1>${judul}</h1>${badge}</div>${desc ? `<p class="desc">${desc}</p>` : ''}</div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
}
function kpiHTML({ label, ikon = 'cash', cls = '', val = '', id = '', foot = '', hero = false, valCls = '' }) {
  return `<div class="card kpi lift ${hero ? 'hero' : ''}"><div class="top"><span class="lbl2">${label}</span><span class="icon-box s ${cls}">${ic(ikon, 'sm')}</span></div><div class="kpi-val ${valCls}" ${id ? `id="${id}"` : ''}>${val}</div><div class="foot">${foot}</div>${hero ? '<i class="deco"></i>' : ''}</div>`;
}
const ikonBiaya = (k) => /listrik/i.test(k) ? 'bolt' : /galon|air/i.test(k) ? 'drop' : /gaji|bonus/i.test(k) ? 'users1' : /konsumsi|makan/i.test(k) ? 'food' : /gas|lpg/i.test(k) ? 'flame' : 'truck';
function trxPending() {
  const t = hariIni();
  return Antrean.list().filter((x) => x.action === 'penjualan.simpan' && (x.data.tanggal || t) === t).map((x) => ({ id: x.data.id, tanggal: x.data.tanggal, jam: x.data.jam, cup: x.data._cup || 0, omset: x.data._omset || 0, tips: num(x.data.tips), acara: num(x.data.acara), masuk: (x.data._omset || 0) + num(x.data.tips) + num(x.data.acara), metode: x.data.metode, jenis: x.data.jenis, kasir: Store.me.nama, catatan: x.data.catatan || '', items: x.data._items || [], pending: true }));
}
function biayaPending() {
  const t = hariIni();
  return Antrean.list().filter((x) => x.action === 'biaya.simpan' && (x.data.tanggal || t) === t).map((x) => ({ id: x.data.id, tanggal: t, jam: x.data.jam, kategori: x.data.kategori, keterangan: x.data.keterangan, nominal: num(x.data.nominal), kasir: Store.me.nama, pending: true }));
}
function ringkasLokal() {
  const h = Store.hariIni || { trx: [], biaya: [], ringkas: {} };
  const trx = trxPending().concat(h.trx || []), biaya = biayaPending().concat(h.biaya || []);
  const r = { cup: 0, omset: 0, tips: 0, acara: 0, masuk: 0, ops: 0, trx: trx.length };
  trx.forEach((t) => { r.cup += t.cup; r.omset += t.omset; r.tips += t.tips; r.acara += t.acara; r.masuk += t.masuk; });
  biaya.forEach((b) => { r.ops += b.nominal; });
  r.bersih = r.masuk - r.ops; r.belanja = (h.ringkas || {}).belanja || 0;
  return { trx, biaya, r, h };
}
function trxRowHTML(t, opt = {}) {
  const items = t.items.length ? t.items.map((i) => i.qty + 'x ' + i.nama.replace(/^Minuman /, '')).join(', ') : (t.acara ? 'Pesanan acara' : '-');
  return `<tr class="${t.pending ? 'pending' : ''} ${opt.flash === t.id ? 'flash' : ''}" data-id="${esc(t.id)}">
    <td data-l="Jam & ID" class="main-cell"><b class="tnum">${esc(t.jam)} ${esc((Store.app || {}).zona || 'WITA')}</b><div class="id">#${esc(t.id)}</div></td>
    <td data-l="Pesanan"><div class="strong" style="max-width:260px;white-space:normal">${esc(items)}</div><div class="xs muted">${esc(t.jenis || '')}${t.catatan ? ' • ' + esc(t.catatan) : ''}</div></td>
    <td data-l="Cup" class="c"><span class="badge gold plain">${t.cup} Cup</span></td>
    <td data-l="Omset" class="r">${rp(t.omset)}</td>
    <td data-l="Tips/Acara" class="r">${t.tips || t.acara ? `<span class="ok">+${rp(t.tips + t.acara)}</span>` : '<span class="muted">-</span>'}</td>
    <td data-l="Total Masuk" class="r"><b>${rp(t.masuk)}</b><div class="xs muted">${esc(t.metode || '')}</div></td>
    <td data-l="Status" class="c">${t.pending ? badgeStatus('Antrean') : badgeStatus(t.terkunci || (Store.hariIni && Store.hariIni.terkunci && t.tanggal === Store.hariIni.tanggal) ? 'Terkunci' : 'Tersimpan')}</td>
    ${opt.aksi ? `<td data-l="Aksi" class="r"><button class="btn ghost icon-only sm" data-act="lihat" data-id="${esc(t.id)}" aria-label="Detail">${ic('eye', 'sm')}</button>${opt.hapus && !t.pending ? `<button class="btn ghost icon-only sm" data-act="hapus" data-id="${esc(t.id)}" aria-label="Hapus" style="color:var(--c-danger)">${ic('trash', 'sm')}</button>` : ''}</td>` : ''}
  </tr>`;
}
function detailTrx(t) {
  Modal.open({
    title: 'Transaksi #' + esc(t.id), sub: tgl(t.tanggal, 'EEEE, d MMMM yyyy') + ' • ' + esc(t.jam) + ' • ' + esc(t.kasir || ''), size: 'sm',
    body: `<div class="inset">${t.items.map((i) => `<div class="sum-row"><span>${i.qty}× ${esc(i.nama)}</span><span class="v">${rp(i.subtotal || i.qty * i.harga)}</span></div>`).join('') || '<div class="muted">Tanpa item cup</div>'}</div>
      <div class="mt-12">${[['Total cup', t.cup + ' cup'], ['Omset kotor', rp(t.omset)], ['Tips', rp(t.tips)], ['Omset acara', rp(t.acara)], ['Metode', t.metode], ['Jenis pesanan', t.jenis], ['Catatan', t.catatan || '-']].map((r) => `<div class="sum-row"><span class="muted">${r[0]}</span><span class="v">${esc(r[1])}</span></div>`).join('')}</div>
      <div class="big-total mt-12"><span class="strong">Total Masuk</span><span class="v">${rp(t.masuk)}</span></div>`
  });
}
async function hapusTrx(id) {
  if (!(await konfirmasi({ title: 'Hapus transaksi?', text: 'Transaksi <b>#' + esc(id) + '</b> akan dihapus dari buku hari ini. Tindakan tercatat di log audit.', ok: 'Hapus', danger: true }))) return;
  const r = await tulis('penjualan.hapus', { id }, { teks: 'Menghapus transaksi…' });
  if (r.success) { await App.muatHariIni(); }
}

/* ============================== BERANDA KASIR ============================== */
Pages.beranda = {
  render(el) {
    let tab = 'Semua', cari = '', hal = 1;
    const gambar = () => {
      const { trx, biaya, r, h } = ringkasLokal();
      const target = (Store.opsi || {}).targetCup || 80, app = Store.app || {};
      el.innerHTML = `<div class="stack anim">
        <div class="card hello">
          <div style="z-index:1"><div class="row wrap gap-8"><span class="badge ${h.terkunci ? 'success' : 'warning'} pulse">Hari Ini: ${h.terkunci ? 'Terkunci (Sudah Closing)' : 'Terbuka (Belum Closing)'}</span><span class="small muted row gap-4">${ic('calendar', 'sm')}${tgl(hariIni(), 'EEEE, d MMMM yyyy')} • Buka ${esc(app.jamBuka || '09:00')} ${esc(app.zona || 'WITA')}</span></div>
            <h1 class="mt-12">${sapaan()}, ${esc(Store.me.nama)}! <span class="wave">👋</span></h1>
            <p class="muted mt-8" style="max-width:560px">${esc(/^lapak\b/i.test(app.lapak || '') ? app.lapak : 'Lapak ' + (app.lapak || ''))} siap melayani pesanan. ${r.cup ? `Hari ini sudah terjual <b style="color:var(--c-text)">${r.cup} cup</b>${r.cup >= target ? ' — target harian tercapai! 🎉' : ', ' + (target - r.cup) + ' cup lagi menuju target ' + target + ' cup.'}` : 'Belum ada transaksi — semangat membuka lapak!'}</p>
            <span class="quote">${ic('anchor', 'sm')}"${esc(app.tagline || '')}" — ${esc(app.singkat || '')}</span></div>
          <div class="center" style="z-index:1">${Store.punya('pos') ? `<a class="btn primary lg" href="#/pos">${ic('plus')}Transaksi Baru (POS)</a><div class="xs muted mt-8 hide-m">Tekan <span class="badge plain">F2</span> untuk buka kasir</div>` : ''}</div>
        </div>
        <div class="row between"><h2>Ringkasan Kasir Hari Ini</h2><button class="link-btn small" data-act="segar">${ic('refresh', 'sm')}Perbarui Data</button></div>
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Omset Hari Ini', ikon: 'cash', cls: 'success', val: rp(r.masuk), id: 'k-omset', foot: `${r.trx} transaksi • tips ${rp(r.tips)}` })}
          ${kpiHTML({ label: 'Cup Terjual', ikon: 'cup', cls: 'warning', val: `${r.cup} <small>Cup</small>`, foot: `<div class="grow"><div class="meter s"><i data-w="${Math.min(100, r.cup / target * 100)}"></i></div><div class="xs mt-4">${Math.round(r.cup / target * 100)}% dari target ${target} cup</div></div>` })}
          ${kpiHTML({ label: 'Biaya Operasional', ikon: 'receipt', cls: 'danger', val: `<span class="bad">${rp(r.ops)}</span>`, foot: `<span class="badge info plain">${biaya.length} catatan</span> ${esc([...new Set(biaya.map((b) => b.kategori.split(' ')[0]))].slice(0, 3).join(', '))}` })}
          ${kpiHTML({ label: 'Omset Bersih Kasir', ikon: 'check-c', cls: 'wood', val: `<span class="ok">${rp(r.bersih)}</span>`, hero: true, foot: 'Omset − biaya (siap setor)' })}
        </div>
        <div class="row between"><h2>Menu Aksi Cepat Kasir</h2><span class="small muted hide-m">Sentuh tombol untuk langsung memproses</span></div>
        <div class="grid g-4">
          ${Store.punya('pos') ? `<a class="qa" href="#/pos"><span class="icon-box solid">${ic('plus')}</span><div><div class="t">Transaksi Baru</div><div class="s">Input order cup rempah & kasir POS</div></div>${ic('chev-r', 'chev')}</a>` : ''}
          ${Store.punya('biaya') ? `<a class="qa" href="#/biaya"><span class="icon-box danger">${ic('receipt')}</span><div><div class="t">Catat Biaya Lapak</div><div class="s">Listrik, galon, konsumsi gerobak</div></div>${ic('chev-r', 'chev')}</a>` : ''}
          ${Store.punya('closing') ? `<a class="qa" href="#/closing"><span class="icon-box wood">${ic('shield')}</span><div><div class="t">Daily Closing</div><div class="s">Rekap tutup kasir & kunci hari ini</div></div>${ic('chev-r', 'chev')}</a>` : ''}
          <a class="qa" href="#/pos?riwayat=1"><span class="icon-box info">${ic('history')}</span><div><div class="t">Riwayat Transaksi</div><div class="s">Daftar struk & bukti pesanan</div></div>${ic('chev-r', 'chev')}</a>
        </div>
        <div class="grid g-main">
          <div class="card">
            <div class="card-head"><div><h2>Transaksi Penjualan Hari Ini</h2><div class="sub">Menampilkan ${trx.length} pesanan (${tgl(hariIni(), 'EEEE, d MMMM yyyy')})</div></div><div id="tab-j"></div></div>
            <div class="row wrap mb-12"><div class="search grow">${ic('search')}<input class="input" id="cari" placeholder="Cari ID trx, nama rempah, atau catatan…" value="${esc(cari)}"></div></div>
            <div id="tbl"></div>
          </div>
          <div class="stack">
            <div class="card"><div class="card-head"><div><h3>Biaya Operasional Lapak</h3><div class="sub">Pengeluaran kas kecil hari ini</div></div>${Store.punya('biaya') ? `<a class="btn sm danger icon-only" href="#/biaya" aria-label="Tambah biaya">${ic('plus', 'sm')}</a>` : ''}</div>
              ${biaya.length ? biaya.slice(0, 6).map((b) => `<div class="li li-box"><span class="icon-box s warning">${ic(ikonBiaya(b.kategori), 'sm')}</span><div class="grow"><div class="t">${esc(b.kategori)}</div><div class="s truncate">${esc(b.keterangan || '-')}</div></div><b class="bad tnum">${rp(b.nominal)}</b></div>`).join('') : kosongHTML('Belum ada biaya hari ini', 'receipt')}
              <div class="row between mt-12"><span class="muted small">Total Biaya Hari Ini:</span><b class="bad" style="font-family:var(--font-head);font-size:20px">${rp(r.ops)}</b></div></div>
            ${(Store.notif || []).filter((n) => n.jenis === 'stok').length ? `<div class="card card-accent" style="border-left-color:var(--c-warning)"><div class="card-head"><h3 class="row gap-8"><i class="sw" style="background:var(--c-warning);border-radius:50%"></i>Peringatan Stok Gerobak</h3><span class="badge warning plain">${(Store.notif || []).filter((n) => n.jenis === 'stok').length} item</span></div><p class="small muted mb-12">Bahan di bawah batas minimal lapak. Beritahu Owner saat Daily Closing:</p>${(Store.notif || []).filter((n) => n.jenis === 'stok').slice(0, 4).map((n) => `<div class="li li-box"><div class="grow"><div class="t">${esc(n.judul.replace(/ (menipis|kritis|habis)$/i, ''))}</div><div class="s">${esc(n.isi)}</div></div>${badgeStatus(/habis/i.test(n.judul) ? 'Habis' : /kritis/i.test(n.judul) ? 'Kritis' : 'Menipis')}</div>`).join('')}</div>` : ''}
            <div class="card card-dark"><div class="eyebrow" style="color:var(--c-primary)">Catatan Lapak</div><h3 class="mt-8">Catat setiap cup sebelum closing</h3><p class="small mt-8" style="opacity:.85">Transaksi tetap tersimpan walau sinyal hilang. Pastikan banner offline sudah hilang sebelum menekan Daily Closing agar angka kas akurat.</p></div>
          </div>
        </div></div>`;
      animasiBatang(el);
      const tj = $('#tab-j', el);
      const jenis = ['Semua'].concat((Store.opsi.jenisPesanan || []));
      tj.innerHTML = segHTML(jenis.map((j) => ({ v: j, l: j + ' (' + (j === 'Semua' ? trx.length : trx.filter((t) => t.jenis === j).length) + ')' })), tab);
      pasangSeg($('.seg', tj), (v) => { tab = v; hal = 1; tabel(); });
      $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; tabel(); }, 200));
      const tabel = () => {
        const rows = trx.filter((t) => (tab === 'Semua' || t.jenis === tab) && (!cari || (t.id + ' ' + t.catatan + ' ' + t.items.map((i) => i.nama).join(' ')).toLowerCase().includes(cari)));
        const per = 8, page = rows.slice((hal - 1) * per, hal * per);
        $('#tbl', el).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Jam & ID</th><th>Pesanan Rempah</th><th class="c">Jumlah Cup</th><th class="r">Omset</th><th class="r">Tips / Acara</th><th class="r">Total Masuk</th><th class="c">Status</th><th class="r">Aksi</th></tr></thead><tbody class="fade-swap">${page.map((t) => trxRowHTML(t, { aksi: true })).join('')}</tbody></table></div>${pagerHTML(rows.length, hal, per, 'transaksi hari ini')}` : kosongHTML('Belum ada transaksi yang cocok.', 'receipt');
      };
      tabel();
      el.onclick = (e) => {
        const a = e.target.closest('[data-act], [data-pg]'); if (!a) return;
        if (a.dataset.pg) { hal = +a.dataset.pg; tabel(); return; }
        if (a.dataset.act === 'lihat') { const t = trx.find((x) => x.id === a.dataset.id); t && detailTrx(t); }
        if (a.dataset.act === 'segar') { App.muatHariIni().then(() => toast('Data hari ini diperbarui.', 'success')); }
      };
    };
    gambar();
    const on = () => gambar(); document.addEventListener('hariIni', on); document.addEventListener('antrean', on); document.addEventListener('boot', on);
    pakai('hariIni', {}, (d) => { Store.hariIni = d; Store.set({ hariIni: d }); gambar(); }, { maxAge: 20000 });
    return () => { document.removeEventListener('hariIni', on); document.removeEventListener('antrean', on); document.removeEventListener('boot', on); };
  }
};

/* ============================== POS ============================== */
Pages.pos = {
  render(el, q) {
    let kat = 'Semua', cari = '';
    let cart = (() => { try { return JSON.parse(sessionStorage.getItem('rp:cart') || '{}'); } catch (e) { return {}; } })();
    if (!cart.items) cart = { items: {}, harga: {}, tips: 0, acara: 0, metode: (Store.opsi.metodeBayar || ['Tunai'])[0], jenis: (Store.opsi.jenisPesanan || ['Dine In'])[0], catatan: '' };
    const simpanCart = () => sessionStorage.setItem('rp:cart', JSON.stringify(cart));
    if (q.tambah) { cart.items[q.tambah] = (cart.items[q.tambah] || 0) + 1; simpanCart(); history.replaceState(null, '', '#/pos'); }
    const menu = () => Store.menu || [];
    const hargaDari = (m) => (m.dinamis && cart.harga[m.id] ? num(cart.harga[m.id]) : m.harga);
    const total = () => { let cup = 0, omset = 0; menu().forEach((m) => { const qn = cart.items[m.id] || 0; cup += qn; omset += qn * hargaDari(m); }); return { cup, omset, masuk: omset + num(cart.tips) + num(cart.acara) }; };
    const terkunci = () => !!(Store.hariIni && Store.hariIni.terkunci && Store.hariIni.tanggal === hariIni());
    const kategori = ['Semua'].concat(Store.opsi.kategoriMenu || [...new Set(menu().map((m) => m.kategori))]);

    el.innerHTML = `${kepala({ eyebrow: 'Kasir Lapak • ' + tgl(hariIni(), 'EEEE, d MMMM yyyy'), judul: 'Penjualan (POS)', desc: 'Pilih menu, atur jumlah cup, lalu simpan. Tetap bisa dipakai saat sinyal lemah.', acts: `<a class="btn" href="#/biaya">${ic('receipt')}Catat Biaya</a><button class="btn" data-act="riwayat">${ic('history')}Riwayat Hari Ini</button>` })}
      <div id="lock-note"></div>
      <div class="pos">
        <div class="stack">
          <div class="card pos-tools"><div class="search">${ic('search')}<input class="input" id="cari" placeholder="Cari menu rempah…"></div><div class="chips scroll mt-12" id="kat">${kategori.map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)} <span class="n">${k === 'Semua' ? menu().length : menu().filter((m) => m.kategori === k).length}</span></button>`).join('')}</div></div>
          <div class="menu-grid" id="grid"></div>
        </div>
        <aside class="card cart" id="cart"></aside>
      </div>
      <div class="cart-bar" id="cart-bar"></div>
      <div class="card mt-20" id="riwayat"></div>`;

    const gridEl = $('#grid', el), cartEl = $('#cart', el);
    const kartuMenu = (m, i) => {
      const qn = cart.items[m.id] || 0;
      return `<div class="card mcard lift ${qn ? 'has' : ''}" data-id="${m.id}" style="--i:${i}">
        <div class="ph"><img src="${esc(fotoUrl(m.foto))}" alt="${esc(m.nama)}" loading="lazy" onerror="this.src='assets/img/menu/default.svg'"><span class="kat">${esc(m.kategori.replace(' / Add-on', ''))}</span><span class="qty-pill">${qn}×</span></div>
        <div class="nm">${esc(m.nama)}</div>
        ${m.dinamis && qn && (Store.aturan.ubahHarga) ? `<div class="hg-edit input-rp"><span>Rp</span><input class="input" inputmode="numeric" data-harga="${m.id}" value="${fmtNum(hargaDari(m))}" aria-label="Harga ${esc(m.nama)}"></div><div class="xs muted">${ic('edit', 'sm')} ${rp(m.hargaMin)} – ${rp(m.hargaMaks)}</div>` : `<div class="hg">${m.dinamis ? rp(m.hargaMin) + (m.hargaMaks > m.hargaMin ? ' – ' + fmtNum(m.hargaMaks) : '') : rp(m.harga)}</div>${m.dinamis ? `<div class="xs muted row gap-4">${ic('edit', 'sm')}Harga bisa diubah</div>` : ''}`}
        <div class="stepper"><button type="button" data-min="${m.id}" aria-label="Kurangi">${ic('minus')}</button><span class="val" id="v-${m.id}">${qn}</span><button type="button" class="plus" data-plus="${m.id}" aria-label="Tambah">${ic('plus')}</button></div>
      </div>`;
    };
    const gambarGrid = () => {
      const list = menu().filter((m) => (kat === 'Semua' || m.kategori === kat) && (!cari || m.nama.toLowerCase().includes(cari)));
      gridEl.innerHTML = list.length ? list.map(kartuMenu).join('') : `<div class="card span-all">${kosongHTML('Menu tidak ditemukan.', 'cup')}</div>`;
    };
    const gambarCart = () => {
      const t = total(), dipilih = menu().filter((m) => cart.items[m.id]);
      const lock = terkunci();
      cartEl.innerHTML = `<div class="row between"><h3 class="row gap-8">${ic('receipt')}Ringkasan Pesanan</h3><span class="badge gold plain">${t.cup} Cup</span></div>
        <div class="cart-items">${dipilih.length ? dipilih.map((m) => `<div class="cart-item"><span class="q">${cart.items[m.id]}×</span><span class="grow truncate">${esc(m.nama)}</span><b class="tnum">${rp(cart.items[m.id] * hargaDari(m))}</b><button class="btn ghost icon-only xs" data-hapus="${m.id}" aria-label="Hapus">${ic('x', 'sm')}</button></div>`).join('') : `<div class="cart-empty"><img src="assets/img/ilustrasi-cangkir.svg" alt=""><div>Belum ada menu dipilih.<br><span class="xs">Sentuh tombol + pada kartu menu.</span></div></div>`}</div>
        <div class="inset"><div class="sum-row"><span>Total Cup</span><span class="v">${t.cup} Cup</span></div><div class="sum-row"><span>Omset Kotor</span><span class="v">${rp(t.omset)}</span></div></div>
        <div class="form-grid"><div class="field"><label>Tips Customer</label><div class="input-rp"><span>Rp</span><input class="input" inputmode="numeric" id="tips" value="${fmtNum(cart.tips)}"></div></div><div class="field"><label>Omset Pesanan Acara</label><div class="input-rp"><span>Rp</span><input class="input" inputmode="numeric" id="acara" value="${fmtNum(cart.acara)}"></div></div></div>
        <div class="field"><label>Metode Bayar</label>${segHTML((Store.opsi.metodeBayar || ['Tunai']).map((x) => ({ v: x, l: x })), cart.metode, 'full')}</div>
        <div class="field"><label>Jenis Pesanan</label>${segHTML((Store.opsi.jenisPesanan || ['Dine In']).map((x) => ({ v: x, l: x })), cart.jenis, 'full')}</div>
        <div class="field"><input class="input" id="catatan" placeholder="Catatan (opsional): gula sedikit, pelanggan reguler…" value="${esc(cart.catatan)}"></div>
        <div class="big-total"><span class="strong">Total Masuk</span><span class="v" id="tot">${rp(t.masuk)}</span></div>
        <div class="row"><button class="btn" data-act="reset">${ic('refresh', 'sm')}Reset</button><button class="btn primary lg grow" data-act="simpan" ${!t.masuk || lock ? 'disabled' : ''}>${ic('check-c')}Simpan Transaksi</button></div>
        ${!Net.up ? `<div class="notice small">${ic('wifi-off', 'sm')}<div>Offline — transaksi disimpan di perangkat & dikirim otomatis.</div></div>` : ''}`;
      $$('.seg', cartEl).forEach((s, i) => pasangSeg(s, (v) => { if (i === 0) cart.metode = v; else cart.jenis = v; simpanCart(); }));
      ['tips', 'acara'].forEach((k) => { const inp = $('#' + k, cartEl); inp.addEventListener('input', () => { cart[k] = parseRp(inp.value); inp.value = cart[k] ? fmtNum(cart[k]) : ''; simpanCart(); const tt = total(); $('#tot', cartEl).textContent = rp(tt.masuk); $('[data-act=simpan]', cartEl).disabled = !tt.masuk || terkunci(); barMobile(); }); inp.addEventListener('focus', () => inp.select()); });
      $('#catatan', cartEl).addEventListener('input', (e) => { cart.catatan = e.target.value; simpanCart(); });
      barMobile();
    };
    const barMobile = () => { const t = total(), b = $('#cart-bar', el); if (!b) return; b.style.display = t.cup || t.masuk ? '' : 'none'; b.innerHTML = `<span class="icon-box s solid">${ic('receipt', 'sm')}</span><div class="grow"><div class="t">${t.cup} Cup • ${rp(t.masuk)}</div><div class="xs" style="opacity:.8">Ketuk untuk lihat & simpan pesanan</div></div>${ic('chev-r')}`; };
    const ubahQty = (id, d) => {
      cart.items[id] = Math.max(0, (cart.items[id] || 0) + d); if (!cart.items[id]) delete cart.items[id];
      simpanCart();
      const card = $(`.mcard[data-id="${id}"]`, gridEl), m = menu().find((x) => x.id === id);
      if (card && m) { if ((m.dinamis && Store.aturan.ubahHarga) && ((cart.items[id] || 0) <= 1)) { const nw = document.createElement('div'); nw.innerHTML = kartuMenu(m, 0); const n = nw.firstElementChild; n.style.animation = 'none'; card.replaceWith(n); } else { card.classList.toggle('has', !!cart.items[id]); $('.qty-pill', card).textContent = (cart.items[id] || 0) + '×'; const v = $('#v-' + id, card); v.textContent = cart.items[id] || 0; v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump'); } }
      gambarCart();
    };
    const riwayat = () => {
      const { trx } = ringkasLokal();
      $('#riwayat', el).innerHTML = `<div class="card-head"><div class="row"><span class="icon-box s">${ic('history', 'sm')}</span><div><h3>Riwayat Transaksi Hari Ini</h3><div class="sub">Catatan penjualan langsung di ${esc((Store.app || {}).lapak || 'lapak')}</div></div></div><span class="badge ${terkunci() ? 'success' : 'info'}">${terkunci() ? 'Terkunci' : 'Shift Aktif'}</span></div>${trx.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Jam & ID</th><th>Pesanan</th><th class="c">Total Cup</th><th class="r">Omset</th><th class="r">Tips / Acara</th><th class="r">Total Masuk</th><th class="c">Status</th><th class="r">Aksi</th></tr></thead><tbody>${trx.map((t) => trxRowHTML(t, { aksi: true, hapus: Store.aturan.hapusTrx && !terkunci(), flash: Pages.pos._flash })).join('')}</tbody></table></div>` : kosongHTML('Belum ada transaksi hari ini.', 'receipt')}`;
      Pages.pos._flash = null;
    };
    const lockNote = () => { $('#lock-note', el).innerHTML = terkunci() ? `<div class="notice danger mb-16">${ic('lock')}<div><b>Hari ini sudah Daily Closing dan terkunci.</b><div class="small">Transaksi baru ditolak. ${Store.owner() ? 'Buka kunci di menu Rekap Kas bila perlu koreksi.' : 'Hubungi Owner bila perlu koreksi.'}</div></div>${Store.owner() ? `<a class="btn sm" href="#/rekap">${ic('unlock', 'sm')}Rekap Kas</a>` : ''}</div>` : ''; };

    const simpan = async () => {
      const t = total(); if (!t.masuk) return;
      if (terkunci()) return toast('Hari ini sudah terkunci.', 'error');
      const tg = hariIni();
      const items = menu().filter((m) => cart.items[m.id]).map((m) => ({ idMenu: m.id, qty: cart.items[m.id], harga: m.dinamis ? hargaDari(m) : undefined }));
      const data = { id: 'TRX-' + tg.replace(/-/g, '') + '-' + uid(5), tanggal: tg, jam: jamKini(), items, tips: num(cart.tips), acara: num(cart.acara), metode: cart.metode, jenis: cart.jenis, catatan: cart.catatan };
      const lokal = { _cup: t.cup, _omset: t.omset, _items: items.map((i) => { const m = menu().find((x) => x.id === i.idMenu); return { id: i.idMenu, nama: m.nama, qty: i.qty, harga: hargaDari(m), subtotal: i.qty * hargaDari(m) }; }) };
      // optimis: kosongkan keranjang & tampilkan langsung
      cart = { items: {}, harga: {}, tips: 0, acara: 0, metode: cart.metode, jenis: cart.jenis, catatan: '' }; simpanCart();
      $('#cart', el).classList.remove('sheet-open'); $('.scrim') && $('.scrim').remove();
      gambarGrid(); gambarCart();
      const btn = $('[data-act=simpan]', cartEl);
      if (!Net.up) { Antrean.tambah('penjualan.simpan', Object.assign({}, data, lokal), 'Penjualan ' + t.cup + ' cup'); riwayat(); return; }
      Topline.start();
      try {
        const r = await API.call('penjualan.simpan', data);
        if (r.success) {
          const h = Store.hariIni; if (h && r.data.trx && h.tanggal === tg) { h.trx.unshift(r.data.trx); h.ringkas.cup += r.data.trx.cup; h.ringkas.masuk += r.data.trx.masuk; h.ringkas.omset += r.data.trx.omset; h.ringkas.tips += r.data.trx.tips; h.ringkas.acara += r.data.trx.acara; Store.set({ hariIni: h }); }
          Pages.pos._flash = data.id; Cache.basi(); riwayat();
          toast(r.message, 'success', 'Transaksi tersimpan');
        } else { toast(r.message, 'error', 'Transaksi ditolak'); if (/terkunci/i.test(r.message)) App.muatHariIni().then(() => { lockNote(); gambarCart(); }); }
      } catch (e) {
        if (e.offline) { Antrean.tambah('penjualan.simpan', Object.assign({}, data, lokal), 'Penjualan ' + t.cup + ' cup'); riwayat(); }
        else toast(e.message, 'error');
      } finally { Topline.done(); btn && (btn.disabled = false); }
    };

    lockNote(); gambarGrid(); gambarCart(); riwayat();
    $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); gambarGrid(); }, 150));
    $('#kat', el).addEventListener('click', (e) => { const c = e.target.closest('[data-kat]'); if (!c) return; kat = c.dataset.kat; $$('#kat .chip', el).forEach((x) => x.classList.toggle('on', x === c)); gambarGrid(); });
    el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-plus]'), m = e.target.closest('[data-min]'), h = e.target.closest('[data-hapus]'), a = e.target.closest('[data-act]');
      if (p) { e.stopPropagation(); return ubahQty(p.dataset.plus, 1); }
      if (m) { e.stopPropagation(); return ubahQty(m.dataset.min, -1); }
      if (h) { delete cart.items[h.dataset.hapus]; simpanCart(); gambarGrid(); gambarCart(); return; }
      const card = e.target.closest('.mcard'); if (card && !e.target.closest('input')) return ubahQty(card.dataset.id, 1);
      if (e.target.closest('#cart-bar')) { cartEl.classList.add('sheet-open'); const s = document.createElement('div'); s.className = 'scrim'; s.style.zIndex = 69; s.onclick = () => { cartEl.classList.remove('sheet-open'); s.remove(); }; cartEl.parentNode.insertBefore(s, cartEl); return; }
      if (!a) return;
      if (a.dataset.act === 'reset') { cart.items = {}; cart.harga = {}; cart.tips = 0; cart.acara = 0; cart.catatan = ''; simpanCart(); gambarGrid(); gambarCart(); }
      if (a.dataset.act === 'simpan') simpan();
      if (a.dataset.act === 'riwayat') $('#riwayat', el).scrollIntoView({ behavior: 'smooth' });
      if (a.dataset.act === 'lihat') { const t = ringkasLokal().trx.find((x) => x.id === a.dataset.id); t && detailTrx(t); }
      if (a.dataset.act === 'hapus') hapusTrx(a.dataset.id).then(() => riwayat());
    });
    el.addEventListener('change', (e) => { const hInp = e.target.closest('[data-harga]'); if (!hInp) return; const mm = menu().find((x) => x.id === hInp.dataset.harga); let v = parseRp(hInp.value); if (!Store.owner()) v = Math.max(mm.hargaMin, Math.min(mm.hargaMaks, v)); cart.harga[mm.id] = v; hInp.value = fmtNum(v); simpanCart(); gambarCart(); });
    if (q.riwayat) setTimeout(() => $('#riwayat', el).scrollIntoView({ behavior: 'smooth' }), 300);
    const on = () => { lockNote(); gambarCart(); riwayat(); }; document.addEventListener('hariIni', on); document.addEventListener('antrean', on); document.addEventListener('net', on);
    pakai('hariIni', {}, (d) => { Store.hariIni = d; Store.set({ hariIni: d }); on(); }, { maxAge: 20000 });
    return () => { document.removeEventListener('hariIni', on); document.removeEventListener('antrean', on); document.removeEventListener('net', on); $('.scrim') && $('.scrim').remove(); };
  }
};

/* ============================== PENGELUARAN ============================== */
Pages.biaya = {
  render(el) {
    const kats = Store.opsi.kategoriBiaya || [], cepat = Store.opsi.tombolCepat || [], plafon = Store.opsi.plafon || 0;
    let tab = 'Semua', cari = '', edit = null;
    const gambar = () => {
      const { biaya, h } = ringkasLokal();
      const tot = biaya.reduce((a, b) => a + b.nominal, 0), lock = !!h.terkunci;
      const sisa = plafon ? plafon - tot : 0, persen = plafon ? Math.min(100, tot / plafon * 100) : 0;
      el.innerHTML = `${kepala({ eyebrow: 'Pembukuan Kas • Kas Kecil Gerobak', judul: 'Pengeluaran Operasional', desc: 'Pencatatan kas kecil & biaya harian gerobak ' + esc((Store.app || {}).lapak || '') + '.', acts: `<div class="card pad-s flat row gap-8"><span class="icon-box s">${ic('users1', 'sm')}</span><div><div class="xs muted">Petugas</div><b>${esc(Store.me.nama)}</b></div></div>${plafon ? `<div class="card pad-s flat row gap-8"><span class="icon-box s warning">${ic('shield', 'sm')}</span><div><div class="xs muted">Plafon Harian</div><b>${rp(plafon)}</b></div></div>` : ''}` })}
      <div class="stack anim">
        <div class="notice ${lock ? 'danger' : 'info'}">${ic(lock ? 'lock' : 'unlock')}<div class="grow"><b>Status Buku Kas: ${lock ? 'Terkunci (Sudah Closing)' : 'Terbuka (Belum Closing)'}</b> ${lock ? '' : '<span class="badge success plain">Bisa Koreksi</span>'}<div class="small mt-4">${lock ? 'Biaya hari ini sudah dikunci. Koreksi hanya oleh Owner setelah membuka kunci.' : 'Seluruh data kas kecil hari ini masih dapat diubah. Setelah Daily Closing, semua pos biaya terkunci dan beralih ke wewenang audit Owner.'}</div></div><span class="small hide-m">Auto-sync: Google Sheets</span></div>
        <div class="grid g-side">
          <div class="stack">
            <div class="card" id="form"></div>
            <div class="card"><h3 class="row gap-8">${ic('info', 'sm')}Pedoman Standar Biaya</h3><div class="mt-12">${kats.map((k) => `<div class="sum-row"><span class="row gap-8"><span class="icon-box s warning">${ic(ikonBiaya(k.nama), 'sm')}</span>${esc(k.nama)}</span><span class="v">${rp(k.acuan)}</span></div>`).join('')}</div><p class="xs muted mt-8">Nominal acuan hanya petunjuk dan tetap dapat diubah.</p></div>
          </div>
          <div class="stack">
            <div class="card"><div class="row between top"><div><div class="eyebrow">Total Pengeluaran Hari Ini</div><div class="row wrap gap-8 mt-8"><span class="kpi-val bad">${rp(tot)}</span>${plafon ? `<span class="badge ${sisa < 0 ? 'danger' : persen > 80 ? 'warning' : 'success'}">${sisa < 0 ? 'Lewat ' + rp(-sisa) : 'Aman • Sisa ' + rp(sisa)}</span>` : ''}</div><div class="small muted mt-4">Akumulasi ${biaya.length} voucher kas kecil yang dikeluarkan lapak hari ini</div></div><div id="spark" class="hide-m"></div></div>
              ${plafon ? `<div class="row between small mt-16"><span>Terpakai: <b>${rp(tot)}</b></span><span class="muted">Batas Maksimal Kasir: ${rp(plafon)} / Hari</span></div><div class="meter mt-8 ${persen > 100 ? 'danger' : persen > 80 ? 'warning' : ''}"><i data-w="${persen}"></i></div>` : ''}</div>
            <div class="card"><div class="row wrap between mb-12"><div class="chips scroll" id="tabs">${['Semua'].concat(kats.map((k) => k.nama)).map((k) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${esc(k)}">${esc(k.split(' / ')[0])} <span class="n">${k === 'Semua' ? biaya.length : biaya.filter((b) => b.kategori === k).length}</span></button>`).join('')}</div><div class="search" style="min-width:220px">${ic('search')}<input class="input" id="cari" placeholder="Cari catatan biaya…" value="${esc(cari)}"></div></div><div id="list"></div></div>
            <div class="card row wrap between"><div class="row"><span class="icon-box s">${ic('receipt', 'sm')}</span><div><div class="small muted">Total Pengeluaran Kasir Hari Ini</div><b>${rp(tot)}${plafon ? ' / ' + rp(plafon) + ' Plafon' : ''}</b></div></div><div class="row wrap gap-8 aksi-m"><button class="btn" data-act="cetak">${ic('printer', 'sm')}Cetak Rekap Kasir</button>${Store.punya('closing') ? `<a class="btn primary" href="#/closing">${ic('shield', 'sm')}Bawa ke Closing</a>` : ''}</div></div>
          </div>
        </div></div>`;
      animasiBatang(el);
      form(lock); daftar(biaya, lock);
      pakai('biaya.list', Param.bulan30(), (d) => { const per = {}; d.rows.forEach((b) => { per[b.tanggal] = (per[b.tanggal] || 0) + b.nominal; }); const v = []; for (let i = 6; i >= 0; i--) v.push(per[addDays(hariIni(), -i)] || 0); const s = $('#spark', el); if (s) s.innerHTML = `<div class="xs muted right">Tren biaya 7 hari</div>${sparkSVG(v, 130, 40, 'var(--c-danger)')}`; }, { maxAge: 60000 });
      $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); daftar(ringkasLokal().biaya, lock); }, 200));
    };
    const form = (lock) => {
      const f = $('#form', el), b = edit || {};
      const katAwal = b.kategori || (kats[1] || kats[0] || {}).nama;
      const boleh = Store.owner() || Store.aturan.tanggalMundur;
      f.innerHTML = `<div class="card-head"><div class="row"><span class="icon-box">${ic('cart')}</span><div><h3>${edit ? 'Ubah Biaya' : 'Input Biaya Baru'}</h3><div class="sub">Voucher kasir ${esc((Store.app || {}).lapak || '')}</div></div></div><span class="badge plain">${esc(edit ? edit.id : '#EXP-' + hariIni().slice(5).replace('-', ''))}</span></div>
        <div class="col">
          <div class="field"><label>Kategori Biaya Operasional <span class="hint">Panduan acuan</span></label><select class="input" id="kat">${kats.map((k) => `<option value="${esc(k.nama)}" ${k.nama === katAwal ? 'selected' : ''}>${esc(k.nama)} (Acuan ${rp(k.acuan)})</option>`).join('')}</select></div>
          <div class="field"><label>Tombol Cepat Sering Dipakai <span class="hint">Satu klik</span></label><div class="chips">${cepat.map((c, i) => `<button type="button" class="chip" data-cepat="${i}">${ic(ikonBiaya(c.kategori), 'sm')}${rp(c.nominal)} <span class="n">${esc(c.label)}</span></button>`).join('')}</div></div>
          <div class="field"><label>Nominal Pengeluaran <span class="hint" id="acuan"></span></label><div class="input-rp"><span>Rp</span><input class="input" id="nom" inputmode="numeric" placeholder="0" value="${b.nominal ? fmtNum(b.nominal) : ''}"></div></div>
          <div class="field"><label>Keterangan / Catatan Spesifik</label><textarea class="input" id="ket" placeholder="Contoh: Isi ulang 4 galon air rebusan jahe merah…">${esc(b.keterangan || '')}</textarea></div>
          <div class="form-grid"><div class="field"><label>Tanggal</label><input class="input" type="date" id="tg" value="${esc(b.tanggal || hariIni())}" max="${hariIni()}" ${boleh ? '' : 'disabled'}></div><div class="field"><label>Waktu (${esc((Store.app || {}).zona || 'WITA')})</label><input class="input" type="time" id="jm" value="${esc(b.jam || jamKini())}"></div></div>
          <div class="row"><button class="btn" data-act="reset">${edit ? 'Batal' : 'Reset'}</button><button class="btn primary grow" data-act="simpan" ${lock && !edit ? 'disabled' : ''}>${ic('plus')}${edit ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}</button></div>
        </div>`;
      const nom = $('#nom', f), kat = $('#kat', f);
      const acuan = () => { const k = kats.find((x) => x.nama === kat.value); $('#acuan', f).textContent = k ? 'Acuan: ' + rp(k.acuan) : ''; };
      acuan(); kat.onchange = acuan;
      nom.addEventListener('input', () => { const v = parseRp(nom.value); nom.value = v ? fmtNum(v) : ''; });
      $$('[data-cepat]', f).forEach((c) => c.onclick = () => { const x = cepat[+c.dataset.cepat]; kat.value = x.kategori; nom.value = fmtNum(x.nominal); $('#ket', f).value = x.ket || ''; acuan(); $$('[data-cepat]', f).forEach((y) => y.classList.toggle('on', y === c)); });
    };
    const daftar = (biaya, lock) => {
      const rows = biaya.filter((b) => (tab === 'Semua' || b.kategori === tab) && (!cari || (b.kategori + ' ' + b.keterangan).toLowerCase().includes(cari)));
      $('#list', el).innerHTML = rows.length ? `<div class="stagger">${rows.map((b, i) => `<div class="li" style="--i:${i}"><span class="icon-box s ${b.pending ? 'warning' : 'wood'}">${ic(ikonBiaya(b.kategori), 'sm')}</span><div class="grow"><div class="t row wrap gap-8">${esc(b.kategori)} ${b.pending ? badgeStatus('Antrean') : ''}</div><div class="s">${esc(b.keterangan || '-')}</div><div class="xs muted row gap-4 mt-4">${ic('clock', 'sm')}${esc(b.jam)} ${esc((Store.app || {}).zona || 'WITA')} • ${esc(b.kasir || '')}</div></div><div class="right"><b class="bad tnum">-${rp(b.nominal)}</b>${!b.pending && !lock && (Store.owner() || Store.aturan.hapusTrx) ? `<div class="row gap-4 mt-4" style="justify-content:flex-end"><button class="btn ghost icon-only xs" data-edit="${esc(b.id)}" aria-label="Ubah">${ic('edit', 'sm')}</button><button class="btn ghost icon-only xs" data-del="${esc(b.id)}" style="color:var(--c-danger)" aria-label="Hapus">${ic('trash', 'sm')}</button></div>` : ''}</div></div>`).join('')}</div>` : kosongHTML('Belum ada catatan biaya.', 'receipt');
    };
    const simpan = async () => {
      const nominal = parseRp($('#nom', el).value);
      if (nominal <= 0) { $('#nom', el).classList.add('err'); return toast('Isi nominal pengeluaran.', 'warning'); }
      const data = { id: edit ? edit.id : 'EXP-' + hariIni().replace(/-/g, '') + '-' + uid(4), kategori: $('#kat', el).value, nominal, keterangan: $('#ket', el).value.trim(), tanggal: $('#tg', el).value || hariIni(), jam: $('#jm', el).value || jamKini() };
      const plafonNow = Store.opsi.plafon; const { biaya } = ringkasLokal();
      if (plafonNow && !Store.owner() && !Store.aturan.lewatiPlafon && biaya.filter((b) => b.id !== data.id).reduce((a, b) => a + b.nominal, 0) + nominal > plafonNow) return toast('Melebihi plafon harian ' + rp(plafonNow) + '. Minta Owner untuk mencatat.', 'error', 'Plafon terlampaui');
      const r = await tulis('biaya.simpan', data, { teks: 'Menyimpan pengeluaran…', antre: 'Biaya ' + data.kategori });
      if (r.success) { edit = null; if (!r.offline) await App.muatHariIni(); gambar(); }
    };
    el.onclick = (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; $$('#tabs .chip', el).forEach((x) => x.classList.toggle('on', x === t)); daftar(ringkasLokal().biaya, !!(Store.hariIni || {}).terkunci); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) { edit = ringkasLokal().biaya.find((b) => b.id === ed.dataset.edit); form(false); $('#form', el).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const dl = e.target.closest('[data-del]'); if (dl) { konfirmasi({ title: 'Hapus biaya?', text: 'Catatan biaya akan dihapus dari buku kas hari ini.', ok: 'Hapus', danger: true }).then(async (ok) => { if (ok && (await tulis('biaya.hapus', { id: dl.dataset.del }, { teks: 'Menghapus…' })).success) { await App.muatHariIni(); gambar(); } }); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'simpan') simpan();
      if (a.dataset.act === 'reset') { edit = null; form(!!(Store.hariIni || {}).terkunci); }
      if (a.dataset.act === 'cetak') { const { biaya, r } = ringkasLokal(); unduhPDF('Rekap-Biaya-' + hariIni(), 'Rekap Biaya Operasional ' + tgl(hariIni(), 'd MMMM yyyy'), [{ k: 'jam', l: 'Jam' }, { k: 'kategori', l: 'Kategori' }, { k: 'keterangan', l: 'Keterangan' }, { k: 'kasir', l: 'Kasir' }, { k: 'nominal', l: 'Nominal', t: 'rp' }], biaya, [['Total biaya', rp(r.ops)], ['Plafon harian', plafon ? rp(plafon) : 'Tanpa batas']]); }
    };
    gambar();
    const on = () => gambar(); document.addEventListener('hariIni', on); document.addEventListener('antrean', on);
    pakai('hariIni', {}, (d) => { Store.hariIni = d; Store.set({ hariIni: d }); if (!edit) gambar(); }, { maxAge: 20000 });
    return () => { document.removeEventListener('hariIni', on); document.removeEventListener('antrean', on); };
  }
};

/* ============================== DAILY CLOSING ============================== */
Pages.closing = {
  render(el, q) {
    const tanggal = q.t && /^\d{4}-\d{2}-\d{2}$/.test(q.t) ? q.t : hariIni();
    el.innerHTML = `<div class="stack"><div class="skel h-36 w-50"></div><div class="grid g-main-l"><div class="skel h-200"></div><div class="skel h-200"></div></div></div>`;
    const gambar = (d) => {
      const r = d.ringkas, target = d.target || 80, lock = d.terkunci, app = Store.app || {};
      const pq = Antrean.list().length;
      const katCards = (d.kategori || []).sort((a, b) => b.omset - a.omset);
      const metode = Object.keys(d.metode || {}).map((k, i) => ({ name: k, value: d.metode[k], color: SERI[i] }));
      const tunai = num((d.metode || {}).Tunai);
      el.innerHTML = `${kepala({ eyebrow: 'Rekonsiliasi Kas & Tutup Buku Harian', judul: 'Daily Closing Kasir Gerobak', desc: 'Verifikasi ringkasan uang kasir, kunci pembukuan harian ' + esc(app.lapak || '') + ', dan serahkan laporan terverifikasi ke Owner.', badge: '', acts: `<span class="badge ${lock ? 'success' : d.status === 'Dibuka' ? 'danger' : 'warning'} pulse">Status: ${lock ? 'Terkunci' : d.status === 'Dibuka' ? 'Dibuka Owner (Koreksi)' : 'Belum Closing (Draft Terbuka)'}</span>${Store.owner() || Store.aturan.tanggalMundur ? `<input type="date" class="input" style="max-width:180px" id="tgl" value="${tanggal}" max="${hariIni()}">` : `<span class="badge plain">${ic('calendar', 'sm')}${tgl(tanggal, 'EEEE, d MMMM yyyy')}</span>`}` })}
      <div class="stack anim">
        ${d.belumClosing && d.belumClosing.length ? `<div class="notice">${ic('alert')}<div class="grow"><b>Ada ${d.belumClosing.length} hari sebelumnya yang belum closing.</b><div class="small">Closing harus berurutan agar rantai saldo kas tetap benar.</div><div class="chips mt-8">${d.belumClosing.slice(0, 6).map((t) => `<a class="chip" href="#/closing?t=${t}">${tgl(t, 'EEE, d MMM')}</a>`).join('')}</div></div></div>` : ''}
        ${pq ? `<div class="notice danger">${ic('wifi-off')}<div class="grow"><b>${pq} transaksi offline belum terkirim.</b><div class="small">Kirim dulu sebelum closing agar angka lengkap.</div></div><button class="btn sm" data-act="sync">${ic('refresh', 'sm')}Sinkronkan</button></div>` : ''}
        <div class="grid g-main-l">
          <div class="stack">
            <div class="card">
              <div class="card-head"><div class="row"><span class="icon-box">${ic('pos')}</span><div><h3>Ringkasan Penjualan & Arus Kas</h3><div class="sub">Data POS lapak tersinkron dengan Google Sheets</div></div></div><span class="badge success plain">Tersinkron GAS</span></div>
              <div class="sum-row inset" style="border-radius:14px"><span class="row gap-8">${ic('cup', 'sm')}<b>Total Cup Terjual</b></span><span class="row gap-8"><span class="badge gold plain">Target: ${target} Cup (${fmtNum(r.cup / target * 100, 1)}%)</span><b style="font-family:var(--font-head);font-size:20px">${r.cup} Cup</b></span></div>
              <div class="meter mt-8 ${r.cup >= target ? 'success' : ''}"><i data-w="${Math.min(100, r.cup / target * 100)}"></i></div>
              <div class="mt-12">
                <div class="sum-row"><span>Omset Penjualan Kotor (POS) • ${d.jumlahTrx} trx</span><span class="v">${rp(r.omset)}</span></div>
                <div class="sum-row"><span>Tips Sukarela Customer</span><span class="v">${rp(r.tips)}</span></div>
                <div class="sum-row"><span>Omset Pesanan Khusus Acara</span><span class="v">${rp(r.acara)}</span></div>
                <div class="sum-row hl-ok"><span>Total Pemasukan Kotor Harian</span><span class="v">${rp(r.masuk)}</span></div>
                <div class="sum-row hl-bad"><span><b>Pengeluaran Kas Kecil Operasional</b><div class="xs">${d.biaya.length} voucher: ${esc(d.biaya.map((b) => b.kategori.split(' ')[0].toLowerCase()).slice(0, 5).join(', '))}</div></span><span class="v">-${rp(r.ops)}</span></div>
              </div>
              <div class="big-total mt-12"><div><div class="eyebrow">Omset Bersih Kasir Hari Ini</div><div class="xs muted">(Omset POS + Tips + Acara) − Kas Kecil Operasional</div></div><span class="v">${rp(r.bersih)}</span></div>
              <hr class="divider"><div class="row between mb-12"><span class="eyebrow" style="color:var(--c-muted)">Rincian Volume per Kategori Minuman</span></div>
              <div class="grid g-3">${katCards.map((k) => `<div class="inset"><div class="row between"><b class="small">${esc(k.kategori)}</b><span class="badge gold plain">${k.cup} Cup</span></div><div class="strong mt-8">${rp(k.omset)}</div></div>`).join('') || '<div class="muted small">Belum ada penjualan.</div>'}</div>
            </div>
            <div class="card"><div class="card-head"><div class="row"><span class="icon-box">${ic('cash')}</span><div><h3>Komposisi Pembayaran</h3><div class="sub">Tunai seharusnya ada di laci; QRIS/transfer masuk rekening</div></div></div></div>
              ${metode.length ? segbarHTML(metode, rp) : kosongHTML('Belum ada pembayaran.', 'cash')}
              <div class="sum-row mt-12 inset" style="border-radius:14px"><span>Uang tunai penjualan yang seharusnya di laci</span><b class="tnum">${rp(tunai)}</b></div>
              <div class="xs muted mt-8">Biaya kas kecil (${rp(r.ops)}) dibayar dari laci, sehingga sisa tunai fisik ≈ <b>${rp(tunai - r.ops)}</b>.</div>
            </div>
          </div>
          <div class="stack">
            ${d.saldoAwal !== undefined ? `<div class="card"><div class="card-head"><div><div class="eyebrow">${ic('book', 'sm')} Rekonsiliasi Kas Besar</div><h3 class="mt-4">Buku Kas Harian Lapak</h3><div class="sub">Akumulasi kas usaha sesuai standar audit Owner.</div></div><span class="badge info plain">Buku ${tanggal.slice(0, 7)}</span></div>
              <div class="formula">Saldo Kas Hari Ini = Saldo Kemarin − Belanja Bahan + Omset Bersih Harian</div>
              <div class="mt-12"><div class="sum-row"><span class="row gap-8">${ic('history', 'sm')}Saldo Kas Kemarin (Saldo Awal)</span><span class="v">${rp(d.saldoAwal)}</span></div>
              <div class="sum-row bad"><span class="row gap-8">${ic('cart', 'sm')}Belanja Bahan Baku (Nota Owner)<div class="xs muted">${esc((d.belanjaList || []).map((n) => n.items.map((i) => i.nama).join(', ')).join(' • ').slice(0, 80) || 'Tidak ada belanja')}</div></span><span class="v">${r.belanja ? '−' + rp(r.belanja) : rp(0)}</span></div>
              <div class="sum-row ${r.bersih < 0 ? 'bad' : 'ok'}"><span class="row gap-8">${ic(r.bersih < 0 ? 'minus' : 'plus', 'sm')}Omset Bersih Gerobak Hari Ini</span><span class="v">${rpTanda(r.bersih)}</span></div></div>
              <div class="saldo-akhir mt-12"><div class="eyebrow" style="color:var(--c-muted)">Saldo Akhir Kas Besar ${tanggal === hariIni() ? 'Hari Ini' : tgl(tanggal, 'd MMM')}</div><div class="v tnum" id="saldo-akhir">${rp(d.saldoAkhir)}</div><span class="badge success">${ic('check-c', 'sm')}Tervalidasi Sesuai Rumus PRD</span></div></div>` : ''}
            ${lock ? `<div class="notice success">${ic('lock')}<div class="grow"><b>Hari ini sudah TERKUNCI.</b><div class="small">Ditutup oleh ${esc(d.closing.oleh)} pada ${esc(tgl(d.closing.waktu, 'd MMM yyyy, HH:mm'))} ${esc(app.zona || 'WITA')}. Saldo akhir ${rp(d.closing.saldoAkhir)} menjadi saldo awal esok hari.</div></div></div>`
          : `<div class="notice">${ic('lock')}<div><b>Peringatan Penguncian Data Harian</b><div class="small mt-4">Setelah tombol "Konfirmasi Daily Closing" ditekan:</div><ul class="small"><li>Transaksi POS dan kas kecil tanggal ini akan <b>TERKUNCI</b> otomatis.</li><li>Kasir tidak dapat merevisi mutasi tanpa izin Owner.</li>${d.saldoAkhir !== undefined ? `<li>Saldo akhir <b>${rp(d.saldoAkhir)}</b> otomatis menjadi saldo awal ${tgl(addDays(tanggal, 1), 'EEEE, d MMM')}.</li>` : ''}<li>Rekap langsung tersimpan ke Google Sheets (Rekap_Kas_Harian).</li></ul></div></div>`}
            ${lock ? '' : `<button class="btn dark lg block" data-act="kunci" ${d.belumClosing && d.belumClosing.length ? 'disabled' : ''}>${ic('lock')}Konfirmasi Daily Closing & Kunci Hari Ini</button>`}
            ${(Store.punya('dokumen') || Store.aturan.ajukanDokumen) ? `<button class="btn block" data-act="slip" ${lock ? '' : 'disabled title="Tersedia setelah closing"'}>${ic('qr', 'sm')}Terbitkan Slip Tutup Kasir (PDF ber-QR)</button>` : ''}
            <button class="btn block" data-act="cetak">${ic('printer', 'sm')}Unduh Ringkasan Closing (PDF)</button>
            ${lock && Store.owner() ? `<button class="btn danger block" data-act="buka">${ic('unlock', 'sm')}Buka Kunci untuk Koreksi (Owner)</button>` : ''}
            <div class="small muted row gap-8">${ic('shield', 'sm')}Petugas: <b>${esc(Store.me.nama)}</b> (${esc(Store.me.id)}) • Sesi PIN terverifikasi</div>
          </div>
        </div></div>`;
      animasiBatang(el);
      const sa = $('#saldo-akhir', el); if (sa) { sa.dataset.v = 0; animasiAngka(sa, d.saldoAkhir); }
      const tg = $('#tgl', el); if (tg) tg.onchange = () => { location.hash = '#/closing?t=' + tg.value; };
    };
    const muat = (force) => pakai('closing.status', { tanggal }, gambar, { maxAge: force ? 0 : 15000, force, onError: (m) => { el.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    el.onclick = async (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const d = (Cache.get(Cache.key('closing.status', { tanggal })) || {}).d;
      if (a.dataset.act === 'sync') { await Antrean.sinkron(); muat(true); }
      if (a.dataset.act === 'kunci') {
        if (Antrean.list().length) return toast('Kirim dulu data offline sebelum closing.', 'warning');
        if (!(await konfirmasi({ title: 'Kunci hari ' + tgl(tanggal, 'd MMMM yyyy') + '?', text: `Omset bersih <b>${rp(d.ringkas.bersih)}</b>${d.saldoAkhir !== undefined ? ', saldo akhir <b>' + rp(d.saldoAkhir) + '</b>' : ''}. Satu hari hanya dapat di-closing satu kali.`, ok: 'Ya, Closing & Kunci', ikon: 'lock' }))) return;
        const r = await tulis('closing.kunci', { tanggal }, { teks: 'Mengunci buku harian…', sub: 'Menyusun rekap kas & saldo akhir' });
        if (r.success) { await App.muatHariIni(); App.segarkanBoot(); muat(true); }
        else if (r.code === 'SUDAH') muat(true);
      }
      if (a.dataset.act === 'buka') {
        const alasan = await mintaTeks({ title: 'Buka kunci ' + tgl(tanggal, 'd MMM yyyy'), label: 'Alasan koreksi (tercatat di log audit)', placeholder: 'Contoh: koreksi tips yang belum tercatat', min: 5, ok: 'Buka Kunci' });
        if (!alasan) return;
        const r = await tulis('closing.buka', { tanggal, alasan }, { teks: 'Membuka kunci…' });
        if (r.success) { await App.muatHariIni(); muat(true); }
      }
      if (a.dataset.act === 'slip') terbitkanSlip(tanggal);
      if (a.dataset.act === 'cetak' && d) unduhPDF('Closing-' + tanggal, 'Ringkasan Daily Closing ' + tgl(tanggal, 'EEEE, d MMMM yyyy'), [{ k: 'l', l: 'Uraian' }, { k: 'v', l: 'Nilai', t: 'rp' }], [{ l: 'Total cup terjual', v: d.ringkas.cup }, { l: 'Omset penjualan (POS)', v: d.ringkas.omset }, { l: 'Tips', v: d.ringkas.tips }, { l: 'Omset acara', v: d.ringkas.acara }, { l: 'Total pemasukan', v: d.ringkas.masuk }, { l: 'Pengeluaran operasional', v: -d.ringkas.ops }, { l: 'Omset bersih', v: d.ringkas.bersih }].concat(d.saldoAwal !== undefined ? [{ l: 'Saldo awal', v: d.saldoAwal }, { l: 'Belanja bahan', v: -d.ringkas.belanja }, { l: 'Saldo akhir', v: d.saldoAkhir }] : []), [['Status', d.terkunci ? 'Terkunci' : 'Belum closing'], ['Petugas', Store.me.nama]]);
    };
    muat(false);
    const on = () => muat(true); document.addEventListener('antrean', on);
    return () => document.removeEventListener('antrean', on);
  }
};
async function terbitkanSlip(tanggal) {
  Loader.show('Menyiapkan Slip Tutup Kasir…', 'Mengambil data closing');
  try {
    const tl = await API.call('de.template.list', {});
    const t = tl.success && tl.data.rows.find((x) => x.kode === 'SLIP_CLOSING');
    if (!t) { Loader.hide(); return toast('Template Slip Tutup Kasir tidak tersedia.', 'error'); }
    const p = await API.call('de.dokumen.prefill', { templateId: t.id, ref: tanggal });
    if (!p.success) { Loader.hide(); return toast(p.message, 'error'); }
    const s = await API.call('de.dokumen.simpan', { templateId: t.id, data: p.data.data, judul: p.data.judul, ref: tanggal });
    if (!s.success) { Loader.hide(); return toast(s.message, 'error'); }
    const a = await API.call('de.dokumen.ajukan', { id: s.data.id });
    Cache.basi(); Loader.hide();
    if (!a.success) toast(a.message, 'error'); else toast('Slip dibuat & diajukan. Tanda tangani dengan PIN Anda.', 'success');
    location.hash = '#/dokumen?id=' + s.data.id;
  } catch (e) { Loader.hide(); toast(e.message, 'error'); }
}
