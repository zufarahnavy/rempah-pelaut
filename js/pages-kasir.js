/* =====================================================================
   Halaman kasir: Beranda, POS, Pengeluaran, Daily Closing
   ===================================================================== */
'use strict';
function kepala({ judul = '', desc = '', acts = '', badge = '' }) {
  return `<div class="page-head"><div class="grow"><div class="row wrap gap-8"><h1>${judul}</h1>${badge}</div>${desc ? `<p class="desc">${desc}</p>` : ''}</div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
}
/* Kartu metrik: label kecil · angka besar (dihitung naik oleh Gerak) · status/persentase · sparkline opsional */
function kpiHTML({ label, ikon = 'cash', cls = '', val = '', id = '', foot = '', hero = false, valCls = '', spark = null, sparkWarna = '' }) {
  const sp = spark && spark.length > 1 ? `<div class="spark">${sparkArea(spark, { warna: sparkWarna || (hero ? 'var(--c-primary-h)' : 'var(--c-primary)') })}</div>` : '';
  return `<div class="card kpi ${hero ? 'hero' : ''}"><div class="top"><span class="lbl2">${label}</span><span class="icon-box s ${cls}">${ic(ikon, 'sm')}</span></div><div class="kpi-val ${valCls}" ${id ? `id="${id}"` : ''}>${val}</div><div class="foot">${foot}</div>${sp}</div>`;
}
/* Deret kumulatif per jam hari ini (untuk sparkline kasir). sumber: [{ rows, ambil }] → array sejajar per sumber */
function deretPerJam(sumber, jamBuka) {
  const jam = (x) => parseInt(String(x.jam || '').slice(0, 2), 10);
  const semua = []; sumber.forEach((s) => s.rows.forEach((x) => { if (!x.batal && !isNaN(jam(x))) semua.push(jam(x)); }));
  if (!semua.length) return sumber.map(() => null);
  const awal = Math.min(parseInt(jamBuka, 10) || 9, ...semua) - 1, akhir = Math.max(new Date().getHours(), ...semua);   // −1: titik nol sebelum buka
  return sumber.map((s) => { const per = new Array(akhir - awal + 1).fill(0); s.rows.forEach((x) => { const h = jam(x) - awal; if (!x.batal && h >= 0 && h < per.length) per[h] += +s.ambil(x) || 0; }); let c = 0; return per.map((v) => (c += v)); });
}
const ikonBiaya = (k) => /listrik/i.test(k) ? 'bolt' : /galon|air/i.test(k) ? 'drop' : /gaji|bonus/i.test(k) ? 'users1' : /konsumsi|makan/i.test(k) ? 'food' : /gas|lpg/i.test(k) ? 'flame' : 'truck';
const zona = () => (Store.app || {}).zona || 'WITA';
/* Angka rupiah dari input: hanya digit; tanda minus ditolak dengan pesan */
function angkaRp(inp, label) {
  const mentah = String(inp.value || '');
  if (/-/.test(mentah)) { toast((label || 'Nilai') + ' tidak boleh minus.', 'warning'); inp.classList.add('err'); setTimeout(() => inp.classList.remove('err'), 1200); }
  const v = Math.max(0, num(mentah.replace(/[^\d]/g, '')));
  inp.value = v ? fmtNum(v) : '';
  return v;
}
const milikSaya = (x) => (x.idUser ? x.idUser === Store.me.id : x.kasir === Store.me.nama);
const hariTerkunci = (tg) => !!(Store.hariIni && Store.hariIni.tanggal === tg && Store.hariIni.terkunci);
/* Aturan pembatalan di sisi tampilan (server tetap memeriksa ulang) */
const bolehBatal = (x) => !!x && !x.batal && !x.pending && (Store.owner() || (Store.aturan.hapusTrx && x.tanggal === hariIni() && !hariTerkunci(x.tanggal) && milikSaya(x)));

function trxPending() {
  const t = hariIni();
  return Antrean.list().filter((x) => x.action === 'penjualan.simpan' && (x.data.tanggal || t) === t).map((x) => ({ id: x.data.id, tanggal: x.data.tanggal || t, jam: x.data.jam, cup: x.data._cup || 0, omset: x.data._omset || 0, tips: num(x.data.tips), acara: num(x.data.acara), masuk: (x.data._omset || 0) + num(x.data.tips) + num(x.data.acara), metode: x.data.metode, jenis: x.data.jenis, kasir: Store.me.nama, idUser: Store.me.id, catatan: x.data.catatan || '', items: x.data._items || [], pending: true, sync: x.galat ? 'gagal' : 'pending', galat: x.galat || '' }));
}
function biayaPending() {
  const t = hariIni();
  return Antrean.list().filter((x) => x.action === 'biaya.simpan' && (x.data.tanggal || t) === t).map((x) => ({ id: x.data.id, tanggal: t, jam: x.data.jam, kategori: x.data.kategori, keterangan: x.data.keterangan, nominal: num(x.data.nominal), kasir: Store.me.nama, idUser: Store.me.id, pending: true, sync: x.galat ? 'gagal' : 'pending', galat: x.galat || '' }));
}
function ringkasLokal() {
  const h = Store.hariIni || { trx: [], biaya: [], ringkas: {} };
  const idServer = new Set((h.trx || []).map((t) => t.id)), idBiaya = new Set((h.biaya || []).map((b) => b.id));
  const trx = trxPending().filter((t) => !idServer.has(t.id)).concat(h.trx || []), biaya = biayaPending().filter((b) => !idBiaya.has(b.id)).concat(h.biaya || []);
  const r = { cup: 0, omset: 0, tips: 0, acara: 0, masuk: 0, ops: 0, trx: 0, batal: 0 };
  trx.forEach((t) => { if (t.batal) { r.batal++; return; } r.trx++; r.cup += t.cup; r.omset += t.omset; r.tips += t.tips; r.acara += t.acara; r.masuk += t.masuk; });
  biaya.forEach((b) => { if (!b.batal) r.ops += b.nominal; });
  r.bersih = r.masuk - r.ops; r.belanja = (h.ringkas || {}).belanja || 0;
  return { trx, biaya, r, h };
}
const ringkasItem = (t) => (t.items.length ? t.items.map((i) => i.qty + '× ' + i.nama.replace(/^Minuman /, '')).join(', ') : (t.acara ? 'Pesanan acara' : '—'));
function trxRowHTML(t, opt = {}) {
  const P = opt.pilih;
  const st = t.pending ? syncHTML(t.sync) : t.batal ? badgeStatus('BATAL') : syncHTML('ok');
  return `<tr class="${t.pending ? 'pending' : ''} ${t.batal ? 'batal' : ''} ${opt.flash === t.id ? 'flash' : ''}" data-id="${esc(t.id)}">
    ${P ? P.td(t.id, bolehBatal(t)) : ''}
    <td data-l="Jam & ID" class="main-cell"><b class="tnum">${esc(t.jam)}</b>${opt.tanggal ? ` <span class="xs muted">${tgl(t.tanggal, 'd MMM')}</span>` : ''}<div class="id">#${esc(t.id)}</div></td>
    <td data-l="Pesanan"><div class="${t.batal ? 'coret' : ''}" style="max-width:280px;white-space:normal">${esc(ringkasItem(t))}</div><div class="xs muted">${esc(t.jenis || '')}${t.kasir ? ' · ' + esc(t.kasir) : ''}${t.catatan ? ' · ' + esc(t.catatan) : ''}</div>${t.batal ? `<div class="xs bad mt-4">Dibatalkan ${esc(t.dibatalkanOleh || '')}: ${esc(t.alasanBatal || '')}</div>` : ''}${t.galat ? `<div class="xs bad mt-4">${esc(t.galat)}</div>` : ''}</td>
    <td data-l="Cup" class="c tnum">${t.cup}</td>
    <td data-l="Total masuk" class="r"><b class="${t.batal ? 'coret' : ''}">${rp(t.masuk)}</b><div class="xs muted">${esc(t.metode || '')}${t.tips || t.acara ? ' · +' + rp(t.tips + t.acara) : ''}</div></td>
    <td data-l="Status">${st}</td>
    <td data-l="" class="r"><button class="btn ghost icon-only sm" data-act="lihat" data-id="${esc(t.id)}" aria-label="Detail transaksi">${ic('eye', 'sm')}</button>${Store.owner() && !t.batal && !t.pending ? `<button class="btn ghost icon-only sm" data-act="ubah" data-id="${esc(t.id)}" aria-label="Ubah transaksi">${ic('edit', 'sm')}</button>` : ''}</td>
  </tr>`;
}
const theadTrx = (P) => `<thead><tr>${P ? P.th() : ''}<th>Jam & ID</th><th>Pesanan</th><th class="c">Cup</th><th class="r">Total masuk</th><th>Status</th><th></th></tr></thead>`;
function detailTrx(t, onUbah) {
  const m = Modal.open({
    title: 'Transaksi #' + esc(t.id), sub: tgl(t.tanggal, 'EEEE, d MMMM yyyy') + ' · ' + esc(t.jam) + ' ' + zona() + ' · ' + esc(t.kasir || ''), size: 'sm',
    body: `${t.batal ? `<div class="notice danger mb-12">${ic('ban')}<div><b>Dibatalkan</b> oleh ${esc(t.dibatalkanOleh)} · ${esc(relatif(t.waktuBatal))}<div class="small">${esc(t.alasanBatal)}</div></div></div>` : ''}
      <div class="struk"><div class="cart-items" style="max-height:none">${t.items.map((i) => `<div class="cart-item"><span class="q">${i.qty}×</span><div><div class="nm">${esc(i.nama)}</div><div class="sub">${rp(i.harga)}</div></div><span class="v">${rp(i.subtotal || i.qty * i.harga)}</span><span></span></div>`).join('') || '<div class="cart-empty">Tanpa item cup</div>'}</div>
      <div class="struk-sum">${[['Subtotal menu (' + t.cup + ' cup)', rp(t.omset)], ['Tips', rp(t.tips)], ['Pesanan acara', rp(t.acara)], ['Metode bayar', t.metode], ['Jenis pesanan', t.jenis], ['Catatan', t.catatan || '—']].map((r) => `<div class="r"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div>
      <div class="struk-total"><span class="l">Total masuk</span><span class="v">${rp(t.masuk)}</span></div></div>
      ${t.diubah ? `<p class="xs muted mt-8">Diubah ${esc(t.diubahOleh)} · ${esc(relatif(t.diubah))}</p>` : ''}`,
    foot: `${bolehBatal(t) ? `<button class="btn danger" data-batal>${ic('ban', 'sm')}Batalkan</button>` : ''}${Store.owner() && !t.batal && !t.pending ? `<button class="btn" data-ubah>${ic('edit', 'sm')}Ubah</button>` : ''}<button class="btn primary" data-x2>Tutup</button>`
  });
  $('[data-x2]', m.el).onclick = () => m.close();
  const b = $('[data-batal]', m.el); if (b) b.onclick = async () => { m.close(); const r = await batalkanData([{ jenis: 'POS', id: t.id }]); if (r && r.success) { await App.muatHariIni(); onUbah && onUbah(); } };
  const u = $('[data-ubah]', m.el); if (u) u.onclick = () => { m.close(); ubahTrx(t, onUbah); };
}
/* Owner: ubah isi transaksi (menu, qty, harga dinamis, tips, acara, bayar, tanggal/jam). Hari terkunci → alasan diminta otomatis. */
function ubahTrx(t, selesai) {
  const qty = {}, harga = {}, nama = {};
  t.items.forEach((i) => { qty[i.id] = (qty[i.id] || 0) + i.qty; harga[i.id] = i.harga; nama[i.id] = i.nama; });
  const menu = (Store.menu || []).slice();
  t.items.forEach((i) => { if (!menu.some((m) => m.id === i.id)) menu.push({ id: i.id, nama: i.nama, harga: i.harga, kategori: i.kategori || '', dinamis: false, nonaktif: true }); });
  const hargaDari = (m) => (harga[m.id] !== undefined ? harga[m.id] : m.harga);
  const m = Modal.open({
    title: 'Ubah transaksi #' + esc(t.id), sub: 'Perubahan tercatat di riwayat audit. Saldo kas dihitung ulang otomatis.', size: 'lg',
    body: `<div class="form-grid"><div class="field"><label>Tanggal</label><input class="input" type="date" id="u-tg" value="${t.tanggal}" max="${hariIni()}"></div><div class="field"><label>Jam (${zona()})</label><input class="input" type="time" id="u-jm" value="${esc(t.jam)}"></div></div>
      <div class="field mt-12"><label>Menu & jumlah</label><div class="li-box" id="u-menu" style="max-height:320px;overflow:auto">${menu.map((x) => `<div class="li"><div class="grow"><div class="t">${esc(x.nama)}${x.nonaktif ? ' <span class="xs muted">(nonaktif)</span>' : ''}</div><div class="s">${x.dinamis ? `<span class="input-rp" style="display:inline-block;width:140px"><span>Rp</span><input class="input" style="min-height:32px" inputmode="numeric" data-uh="${x.id}" value="${fmtNum(hargaDari(x))}"></span>` : rp(hargaDari(x))}</div></div><div class="stepper"><button type="button" data-um="${x.id}" aria-label="Kurangi">${ic('minus', 'sm')}</button><span class="val" id="uq-${x.id}">${qty[x.id] || 0}</span><button type="button" class="plus" data-up="${x.id}" aria-label="Tambah">${ic('plus', 'sm')}</button></div></div>`).join('')}</div></div>
      <div class="form-grid mt-12"><div class="field"><label>Tips</label><div class="input-rp"><span>Rp</span><input class="input" inputmode="numeric" id="u-tips" value="${t.tips ? fmtNum(t.tips) : ''}" placeholder="0"></div></div><div class="field"><label>Pesanan acara</label><div class="input-rp"><span>Rp</span><input class="input" inputmode="numeric" id="u-acara" value="${t.acara ? fmtNum(t.acara) : ''}" placeholder="0"></div></div>
      <div class="field"><label>Metode bayar</label><select class="input" id="u-met">${(Store.opsi.metodeBayar || ['Tunai']).map((x) => `<option ${x === t.metode ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>Jenis pesanan</label><select class="input" id="u-jen">${(Store.opsi.jenisPesanan || ['Dine In']).map((x) => `<option ${x === t.jenis ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field span-2"><label>Catatan</label><input class="input" id="u-cat" value="${esc(t.catatan || '')}"></div></div>
      <div class="struk-total mt-12" style="border:1px solid var(--c-border);border-radius:var(--radius)"><span class="l">Total masuk baru</span><span class="v" id="u-tot"></span></div>`,
    foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Simpan perubahan</button>`
  });
  const hitung = () => { let o = 0; menu.forEach((x) => { o += (qty[x.id] || 0) * hargaDari(x); }); const tot = o + parseRp($('#u-tips', m.el).value) + parseRp($('#u-acara', m.el).value); $('#u-tot', m.el).textContent = rp(tot); return tot; };
  hitung();
  m.el.addEventListener('click', (e) => {
    const p = e.target.closest('[data-up]'), mi = e.target.closest('[data-um]');
    if (p || mi) { const id = (p || mi).dataset.up || (p || mi).dataset.um; qty[id] = Math.max(0, (qty[id] || 0) + (p ? 1 : -1)); $('#uq-' + id, m.el).textContent = qty[id]; hitung(); }
  });
  m.el.addEventListener('input', (e) => { const h = e.target.closest('[data-uh]'); if (h) { harga[h.dataset.uh] = angkaRp(h, 'Harga'); hitung(); } if (e.target.id === 'u-tips' || e.target.id === 'u-acara') { angkaRp(e.target, e.target.id === 'u-tips' ? 'Tips' : 'Pesanan acara'); hitung(); } });
  $('[data-b]', m.el).onclick = () => m.close();
  $('[data-ok]', m.el).onclick = async (e) => {
    const items = menu.filter((x) => qty[x.id]).map((x) => ({ idMenu: x.id, qty: qty[x.id], harga: hargaDari(x), ubahHargaOwner: true }));
    if (!items.length && !parseRp($('#u-acara', m.el).value)) return toast('Transaksi tidak boleh kosong. Gunakan "Batalkan" bila transaksi ini tidak terjadi.', 'warning');
    const r = await tulis('penjualan.ubah', { id: t.id, tanggal: $('#u-tg', m.el).value, jam: $('#u-jm', m.el).value, items, tips: parseRp($('#u-tips', m.el).value), acara: parseRp($('#u-acara', m.el).value), metode: $('#u-met', m.el).value, jenis: $('#u-jen', m.el).value, catatan: $('#u-cat', m.el).value.trim() }, { btn: e.currentTarget, teks: 'Menyimpan perubahan…' });
    if (r.success) { m.close(); await App.muatHariIni(); selesai && selesai(); }
  };
}

/* ============================== BERANDA KASIR ============================== */
Pages.beranda = {
  render(el) {
    let tab = 'Semua', cari = '', hal = 1;
    const P = Pilih(el, { onChange: () => bar() });
    const bar = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm danger" data-bulk="batal">${ic('ban', 'sm')}Batalkan</button>`); };
    const gambar = () => {
      const { trx, biaya, r, h } = ringkasLokal();
      const target = (Store.opsi || {}).targetCup || 80, app = Store.app || {};
      const stokPeringatan = (Store.notif || []).filter((n) => n.jenis === 'stok');
      const [sMasuk, sCup, sOps] = deretPerJam([{ rows: trx, ambil: (t) => t.masuk }, { rows: trx, ambil: (t) => t.cup }, { rows: biaya, ambil: (b) => b.nominal }], app.jamBuka);
      const sBersih = sMasuk && sOps ? sMasuk.map((v, i) => v - sOps[i]) : null;
      el.innerHTML = `<div class="stack">
        <div class="card hello">
          <div><h1>${sapaan()}, ${esc(Store.me.nama.split(' ')[0])}</h1>
            <p class="muted mt-4">${tgl(hariIni(), 'EEEE, d MMMM yyyy')} · ${esc(app.lapak || '')} · buka ${esc(app.jamBuka || '09:00')} ${zona()}</p>
            <p class="mt-8">${r.cup ? `Sudah terjual <b>${r.cup} cup</b> hari ini${r.cup >= target ? ' — target harian tercapai.' : '. ' + (target - r.cup) + ' cup lagi menuju target ' + target + '.'}` : 'Belum ada transaksi hari ini.'}</p></div>
          <div class="status-box"><span class="icon-box s ${h.terkunci ? 'success' : 'warning'}">${ic(h.terkunci ? 'lock' : 'unlock', 'sm')}</span><div><div class="small muted">Buku kas hari ini</div><b>${h.terkunci ? 'Sudah closing' : 'Masih terbuka'}</b></div>${Store.punya('pos') && !h.terkunci ? `<a class="btn primary" href="#/pos">${ic('plus', 'sm')}Transaksi baru</a>` : ''}</div>
        </div>
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Total masuk', ikon: 'cash', cls: 'accent', val: rp(r.masuk), foot: `${r.trx} transaksi · tips ${rp(r.tips)}`, spark: sMasuk })}
          ${kpiHTML({ label: 'Cup terjual', ikon: 'cup', spark: sCup, val: `${r.cup} <small>/ ${target}</small>`, foot: `<div class="grow"><div class="meter s"><i data-w="${Math.min(100, r.cup / target * 100)}"></i></div></div>` })}
          ${kpiHTML({ label: 'Biaya lapak', ikon: 'receipt', cls: 'danger', val: rp(r.ops), foot: `${biaya.filter((b) => !b.batal).length} catatan biaya`, spark: sOps, sparkWarna: 'var(--c-danger)' })}
          ${kpiHTML({ label: 'Omset bersih kasir', ikon: 'check-c', val: rp(r.bersih), hero: true, foot: 'Total masuk − biaya', spark: sBersih })}
        </div>
        <div class="grid g-main">
          <div class="card">
            <div class="card-head"><div><h2>Transaksi hari ini</h2><div class="sub">${r.trx} tersimpan${r.batal ? ' · ' + r.batal + ' dibatalkan' : ''}</div></div><div id="tab-j"></div></div>
            <div class="row wrap mb-12"><div class="search grow">${ic('search')}<input class="input" id="cari" placeholder="Cari ID, menu, atau catatan…" value="${esc(cari)}"></div><button class="btn sm ghost" data-act="segar">${ic('refresh', 'sm')}Perbarui</button></div>
            <div id="bulk"></div><div id="tbl"></div>
          </div>
          <div class="stack">
            ${Store.punya('pos') || Store.punya('biaya') || Store.punya('closing') ? `<div class="card"><h3 class="mb-12">Aksi cepat</h3><div class="col gap-8">
              ${Store.punya('pos') ? `<a class="qa" href="#/pos"><span class="icon-box s solid">${ic('plus', 'sm')}</span><div><div class="t">Transaksi baru</div><div class="s">Kasir POS · tekan F2</div></div>${ic('chev-r', 'sm chev')}</a>` : ''}
              ${Store.punya('biaya') ? `<a class="qa" href="#/biaya"><span class="icon-box s">${ic('receipt', 'sm')}</span><div><div class="t">Catat pengeluaran</div><div class="s">Listrik, galon, konsumsi</div></div>${ic('chev-r', 'sm chev')}</a>` : ''}
              ${Store.punya('closing') ? `<a class="qa" href="#/closing"><span class="icon-box s">${ic('lock', 'sm')}</span><div><div class="t">Daily closing</div><div class="s">Tutup buku & kunci hari ini</div></div>${ic('chev-r', 'sm chev')}</a>` : ''}
            </div></div>` : ''}
            <div class="card"><div class="card-head"><div><h3>Pengeluaran hari ini</h3><div class="sub">Kas kecil lapak</div></div>${Store.punya('biaya') ? `<a class="btn sm" href="#/biaya">${ic('plus', 'sm')}Catat</a>` : ''}</div>
              ${biaya.filter((b) => !b.batal).length ? biaya.filter((b) => !b.batal).slice(0, 6).map((b) => `<div class="li"><span class="icon-box s">${ic(ikonBiaya(b.kategori), 'sm')}</span><div class="grow"><div class="t">${esc(b.kategori)}</div><div class="s truncate">${esc(b.keterangan || '—')}</div></div><b class="tnum">${rp(b.nominal)}</b></div>`).join('') : kosongHTML('Belum ada pengeluaran hari ini.', 'receipt')}
              <div class="row between mt-8" style="border-top:1px solid var(--c-line);padding-top:10px"><span class="muted small">Total</span><b class="tnum">${rp(r.ops)}</b></div></div>
            ${stokPeringatan.length ? `<div class="card"><div class="card-head"><h3>Stok perlu perhatian</h3><span class="badge warning plain">${stokPeringatan.length}</span></div>${stokPeringatan.slice(0, 4).map((n) => `<div class="li"><div class="grow"><div class="t">${esc(n.judul.replace(/ (menipis|kritis|habis)$/i, ''))}</div><div class="s">${esc(n.isi)}</div></div>${badgeStatus(/habis/i.test(n.judul) ? 'Habis' : /kritis/i.test(n.judul) ? 'Kritis' : 'Menipis')}</div>`).join('')}</div>` : ''}
          </div>
        </div></div>`;
      animasiBatang(el);
      const tj = $('#tab-j', el);
      const jenis = ['Semua'].concat((Store.opsi.jenisPesanan || []));
      tj.innerHTML = segHTML(jenis.map((j) => ({ v: j, l: j })), tab, 'mini');
      pasangSeg($('.seg', tj), (v) => { tab = v; hal = 1; tabel(); });
      $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; tabel(); }, 200));
      const tabel = () => {
        const rows = trx.filter((t) => (tab === 'Semua' || t.jenis === tab) && (!cari || (t.id + ' ' + t.catatan + ' ' + t.items.map((i) => i.nama).join(' ')).toLowerCase().includes(cari)));
        const per = 10, page = rows.slice((hal - 1) * per, hal * per);
        $('#tbl', el).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards">${theadTrx(P)}<tbody>${page.map((t) => trxRowHTML(t, { pilih: P })).join('')}</tbody></table></div>${pagerHTML(rows.length, hal, per, 'transaksi')}` : kosongHTML(cari ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi hari ini.', 'receipt');
        P.segar();
      };
      tabel(); bar();
      el.onclick = async (e) => {
        const a = e.target.closest('[data-act], [data-pg], [data-bulk]'); if (!a) return;
        if (a.dataset.pg) { hal = +a.dataset.pg; tabel(); return; }
        if (a.dataset.bulk === 'batal-pilih') return P.kosongkan();
        if (a.dataset.bulk === 'batal') { const r = await batalkanData(P.ids().map((id) => ({ jenis: 'POS', id }))); if (r && r.success) { P.kosongkan(); await App.muatHariIni(); } return; }
        const t = trx.find((x) => x.id === a.dataset.id);
        if (a.dataset.act === 'lihat' && t) detailTrx(t, () => gambar());
        if (a.dataset.act === 'ubah' && t) ubahTrx(t, () => gambar());
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
    let kat = 'Semua', cari = '', tampilan = localStorage.getItem('rp:posView') === 'list' ? 'list' : 'grid', koreksi = false;
    const tglValid = (t) => Store.owner() && /^\d{4}-\d{2}-\d{2}$/.test(t || '') && t <= hariIni();
    let tglRiwayat = tglValid(q.t) ? q.t : hariIni(), riwayatLain = null;
    let cart = (() => { try { return JSON.parse(sessionStorage.getItem('rp:cart') || '{}'); } catch (e) { return {}; } })();
    if (!cart.items) cart = { items: {}, harga: {}, tips: 0, acara: 0, metode: (Store.opsi.metodeBayar || ['Tunai'])[0], jenis: (Store.opsi.jenisPesanan || ['Dine In'])[0], catatan: '' };
    const simpanCart = () => sessionStorage.setItem('rp:cart', JSON.stringify(cart));
    const menu = () => Store.menu || [];
    const terkunci = () => hariTerkunci(hariIni());
    if (q.tambah && !terkunci()) { cart.items[q.tambah] = (cart.items[q.tambah] || 0) + 1; simpanCart(); history.replaceState(null, '', '#/pos'); }
    const tutup = () => terkunci() && !koreksi;                 // katalog & keranjang nonaktif
    const hargaDari = (m) => (m.dinamis && cart.harga[m.id] ? num(cart.harga[m.id]) : m.harga);
    const total = () => { let cup = 0, omset = 0; menu().forEach((m) => { const qn = cart.items[m.id] || 0; cup += qn; omset += qn * hargaDari(m); }); return { cup, omset, masuk: omset + num(cart.tips) + num(cart.acara) }; };
    const kategori = ['Semua'].concat(Store.opsi.kategoriMenu || [...new Set(menu().map((m) => m.kategori))]);
    const P = Pilih(el, { onChange: () => barPilih() });
    const barPilih = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm danger" data-bulk="batal">${ic('ban', 'sm')}Batalkan</button>`); };

    el.innerHTML = `${kepala({ judul: 'Kasir (POS)', desc: tgl(hariIni(), 'EEEE, d MMMM yyyy') + ' · pilih menu, atur jumlah, lalu simpan. Tetap bisa dipakai saat sinyal lemah.', acts: `<a class="btn" href="#/biaya">${ic('receipt', 'sm')}Catat biaya</a><button class="btn" data-act="riwayat">${ic('history', 'sm')}Riwayat</button>` })}
      <div id="lock-note"></div>
      <div class="pos">
        <div class="stack">
          <div class="card pos-tools"><div class="row gap-8"><div class="search grow">${ic('search')}<input class="input" id="cari" placeholder="Cari menu…"></div><div id="vt">${segHTML([{ v: 'grid', i: 'grid', t: 'Tampilan kartu' }, { v: 'list', i: 'list', t: 'Tampilan daftar' }], tampilan, 'mini')}</div></div><div class="chips scroll mt-8" id="kat">${kategori.map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k.replace(' / Add-on', ''))} <span class="n">${k === 'Semua' ? menu().length : menu().filter((m) => m.kategori === k).length}</span></button>`).join('')}</div></div>
          <div id="katalog"></div>
        </div>
        <aside class="cart" id="cart"></aside>
      </div>
      <div class="cart-bar" id="cart-bar"></div>
      <div class="card mt-16" id="riwayat"></div>`;

    const katalog = $('#katalog', el), cartEl = $('#cart', el);
    const hargaHTML = (m, qn) => (m.dinamis && qn && (Store.aturan.ubahHarga || Store.owner()) ? `<div class="hg-edit input-rp"><span>Rp</span><input class="input" inputmode="numeric" data-harga="${m.id}" value="${fmtNum(hargaDari(m))}" aria-label="Harga ${esc(m.nama)}"></div><div class="xs muted">${rp(m.hargaMin)} – ${rp(m.hargaMaks)}</div>` : `<div class="hg">${m.dinamis ? rp(m.hargaMin) + (m.hargaMaks > m.hargaMin ? ' – ' + fmtNum(m.hargaMaks) : '') : rp(m.harga)}</div>`);
    const stepperHTML = (m, qn) => `<div class="stepper"><button type="button" data-min="${m.id}" aria-label="Kurangi ${esc(m.nama)}" ${tutup() || !qn ? 'disabled' : ''}>${ic('minus', 'sm')}</button><span class="val" id="v-${m.id}">${qn}</span><button type="button" class="plus" data-plus="${m.id}" aria-label="Tambah ${esc(m.nama)}" ${tutup() ? 'disabled' : ''}>${ic('plus', 'sm')}</button></div>`;
    const kartuMenu = (m) => {
      const qn = cart.items[m.id] || 0;
      return `<div class="card mcard ${qn ? 'has' : ''} ${tutup() ? 'off' : ''}" data-id="${m.id}">
        <div class="ph"><img src="${esc(fotoUrl(m.foto))}" alt="" loading="lazy" onerror="this.src='assets/img/menu/default.svg'"><span class="kat">${esc(m.kategori.replace(' / Add-on', ''))}</span><span class="qty-pill">${qn}×</span></div>
        <div class="nm">${esc(m.nama)}</div>${hargaHTML(m, qn)}${stepperHTML(m, qn)}</div>`;
    };
    const barisMenu = (m, last) => {
      const qn = cart.items[m.id] || 0;
      return `<div class="mrow ${qn ? 'has' : ''} ${tutup() ? 'off' : ''} ${last ? 'last' : ''}" data-id="${m.id}"><img class="thumb" src="${esc(fotoUrl(m.foto))}" alt="" loading="lazy" onerror="this.src='assets/img/menu/default.svg'"><div><div class="nm">${esc(m.nama)}</div><div class="xs muted">${esc(m.kategori.replace(' / Add-on', ''))}${m.dinamis ? ' · harga bisa diubah' : ''}</div></div><div class="hg-col">${hargaHTML(m, qn)}</div>${stepperHTML(m, qn)}</div>`;
    };
    const gambarKatalog = () => {
      const list = menu().filter((m) => (kat === 'Semua' || m.kategori === kat) && (!cari || m.nama.toLowerCase().includes(cari)));
      if (!list.length) { katalog.innerHTML = `<div class="card mt-12">${kosongHTML('Menu tidak ditemukan.', 'cup')}</div>`; return; }
      if (tampilan === 'grid') { katalog.innerHTML = `<div class="menu-grid">${list.map(kartuMenu).join('')}</div>`; return; }
      const grup = {}; list.forEach((m) => { (grup[m.kategori] = grup[m.kategori] || []).push(m); });
      katalog.innerHTML = `<div class="menu-list">${Object.keys(grup).map((g) => `${kat === 'Semua' ? `<div class="grp-h">${esc(g)}</div>` : ''}${grup[g].map((m, i) => barisMenu(m, i === grup[g].length - 1)).join('')}`).join('')}</div>`;
    };
    const itemsHTML = (dipilih) => dipilih.length ? dipilih.map((m) => `<div class="cart-item" data-cid="${m.id}"><span class="q">${cart.items[m.id]}×</span><div style="min-width:0"><div class="nm">${esc(m.nama)}</div><div class="sub">${rp(hargaDari(m))} / cup</div></div><span class="v">${rp(cart.items[m.id] * hargaDari(m))}</span><button class="x" data-hapus="${m.id}" aria-label="Hapus ${esc(m.nama)}">${ic('x', 'sm')}</button></div>`).join('') : `<div class="cart-empty">${ic('cup')}<div>Belum ada menu dipilih.</div></div>`;
    const gambarCart = () => {
      const t = total(), dipilih = menu().filter((m) => cart.items[m.id]);
      if (tutup()) {
        cartEl.innerHTML = `<div class="struk"><div class="struk-head"><b>Ringkasan pesanan</b>${badgeStatus('Terkunci')}</div><div class="cart-empty">${ic('lock')}<div>Kasir hari ini sudah ditutup.<br>Transaksi baru tidak dapat dicatat.</div></div></div>`;
        barMobile(); return;
      }
      cartEl.innerHTML = `<div class="struk">
        <div class="struk-head"><b>Ringkasan pesanan</b><span class="badge gold plain">${t.cup} cup</span></div>
        <div class="cart-items">${itemsHTML(dipilih)}</div>
        <div class="struk-sum"><div class="r"><span>Subtotal menu</span><b>${rp(t.omset)}</b></div>${num(cart.tips) ? `<div class="r"><span>Tips</span><b>${rp(cart.tips)}</b></div>` : ''}${num(cart.acara) ? `<div class="r"><span>Pesanan acara</span><b>${rp(cart.acara)}</b></div>` : ''}</div>
        <div class="cart-opts">
          <div class="field"><label>Metode bayar</label>${segHTML((Store.opsi.metodeBayar || ['Tunai']).map((x) => ({ v: x, l: x })), cart.metode, 'full')}</div>
          <div class="field"><label>Jenis pesanan</label>${segHTML((Store.opsi.jenisPesanan || ['Dine In']).map((x) => ({ v: x, l: x })), cart.jenis, 'full')}</div>
          <details ${num(cart.tips) || num(cart.acara) ? 'open' : ''}><summary class="small strong" style="cursor:pointer">Tips & pesanan acara</summary><div class="form-grid mt-8"><div class="field"><label>Tips</label><div class="input-rp"><span>Rp</span><input class="input" inputmode="numeric" id="tips" placeholder="0" value="${cart.tips ? fmtNum(cart.tips) : ''}"></div></div><div class="field"><label>Pesanan acara</label><div class="input-rp"><span>Rp</span><input class="input" inputmode="numeric" id="acara" placeholder="0" value="${cart.acara ? fmtNum(cart.acara) : ''}"></div></div></div></details>
          <input class="input" id="catatan" placeholder="Catatan (opsional)" value="${esc(cart.catatan)}">
        </div>
        <div class="cart-foot"><div class="struk-total"><span class="l">Total masuk</span><span class="v" id="tot">${rp(t.masuk)}</span></div>
          <div class="row" style="padding:0 12px 12px"><button class="btn" data-act="reset" ${t.cup || t.masuk ? '' : 'disabled'}>Kosongkan</button><button class="btn primary grow" data-act="simpan" ${!t.masuk ? 'disabled' : ''}>${ic('check', 'sm')}Simpan transaksi</button></div>
          ${!Net.up ? `<div class="small muted" style="padding:0 12px 12px">Offline — transaksi disimpan sebagai Pending lalu dikirim otomatis.</div>` : ''}${koreksi ? `<div class="small warn" style="padding:0 12px 12px">Mode koreksi Owner: transaksi masuk ke hari yang sudah closing.</div>` : ''}</div>
      </div>`;
      /* gerak kecil: baris menu baru meluncur masuk, jumlah yang berubah berdenyut */
      const lalu = cartEl._qty;
      if (lalu) dipilih.forEach((m) => { const r = $(`[data-cid="${m.id}"]`, cartEl); if (!r) return; if (!lalu[m.id]) r.classList.add('ganti'); else if (lalu[m.id] !== cart.items[m.id]) Gerak.pop($('.q', r)); });
      if (lalu && Object.values(lalu).reduce((a, x) => a + x, 0) !== t.cup) Gerak.pop($('.struk-head .badge', cartEl));
      cartEl._qty = Object.assign({}, cart.items);
      $$('.seg', cartEl).forEach((s, i) => pasangSeg(s, (v) => { if (i === 0) cart.metode = v; else cart.jenis = v; simpanCart(); }));
      ['tips', 'acara'].forEach((k) => { const inp = $('#' + k, cartEl); inp.addEventListener('input', () => { cart[k] = angkaRp(inp, k === 'tips' ? 'Tips' : 'Pesanan acara'); simpanCart(); segarTotal(); }); inp.addEventListener('change', () => gambarCart()); });
      $('#catatan', cartEl).addEventListener('input', (e) => { cart.catatan = e.target.value; simpanCart(); });
      barMobile();
    };
    const segarTotal = () => { const tt = total(), tot = $('#tot', cartEl); if (tot) tot.textContent = rp(tt.masuk); const s = $('[data-act=simpan]', cartEl); if (s) s.disabled = !tt.masuk; barMobile(); };
    const barMobile = () => {
      const t = total(), b = $('#cart-bar', el); if (!b) return;
      const dipilih = menu().filter((m) => cart.items[m.id]);
      b.classList.toggle('hidden', tutup() || !(t.cup || t.masuk));
      b.innerHTML = `<div class="grow" style="min-width:0"><div class="t">${t.cup} cup · ${rp(t.masuk)}</div><div class="xs truncate" style="opacity:.85">${esc(dipilih.map((m) => cart.items[m.id] + '× ' + m.nama).join(', ') || 'Pesanan acara')}</div></div><span class="btn sm" style="--bg:#FFFDF8;--fg:var(--c-secondary);--bd:#FFFDF8">Lihat & simpan</span>`;
    };
    const ubahQty = (id, d) => {
      if (tutup()) return toast('Kasir hari ini sudah ditutup (Daily Closing).', 'warning');
      const sebelum = cart.items[id] || 0;
      cart.items[id] = Math.max(0, sebelum + d); if (!cart.items[id]) delete cart.items[id];
      simpanCart();
      const qn = cart.items[id] || 0, m = menu().find((x) => x.id === id);
      const node = $(`[data-id="${id}"].mcard, [data-id="${id}"].mrow`, katalog);
      if (node && m) {
        if (m.dinamis && (Store.aturan.ubahHarga || Store.owner()) && (sebelum === 0 || qn === 0)) { const w = document.createElement('div'); w.innerHTML = tampilan === 'grid' ? kartuMenu(m) : barisMenu(m, node.classList.contains('last')); node.replaceWith(w.firstElementChild); }
        else { node.classList.toggle('has', !!qn); const pill = $('.qty-pill', node); if (pill) { pill.textContent = qn + '×'; Gerak.pop(pill); } $('#v-' + id, node).textContent = qn; Gerak.pop($('#v-' + id, node)); const mn = $('[data-min]', node); if (mn) mn.disabled = !qn; }
      }
      gambarCart();
    };
    const muatRiwayatLain = async () => {
      riwayatLain = null; riwayat();
      try { const r = await API.call('penjualan.list', { dari: tglRiwayat, sampai: tglRiwayat, batal: 'semua' }); if (r.success) riwayatLain = r.data.rows; else toast(r.message, 'error'); } catch (e) { toast(e.message, 'error'); }
      riwayat();
    };
    const riwayat = () => {
      const lain = tglRiwayat !== hariIni();
      const trx = lain ? (riwayatLain || []) : ringkasLokal().trx;
      const aktif = trx.filter((t) => !t.batal), masuk = aktif.reduce((a, t) => a + t.masuk, 0);
      $('#riwayat', el).innerHTML = `<div class="card-head"><div><h3>Riwayat transaksi</h3><div class="sub">${lain ? tgl(tglRiwayat, 'EEEE, d MMMM yyyy') : 'Hari ini'} · ${aktif.length} transaksi · ${rp(masuk)}</div></div><div class="row gap-8">${Store.owner() ? `<input type="date" class="input" style="max-width:170px;min-height:34px" id="tgl-r" value="${tglRiwayat}" max="${hariIni()}" aria-label="Tanggal riwayat">` : ''}${badgeStatus(lain ? (trx[0] && trx[0].terkunci ? 'Terkunci' : 'Terbuka') : terkunci() ? 'Terkunci' : 'Terbuka')}</div></div>
        <div id="bulk"></div>
        ${lain && !riwayatLain ? '<div class="skel h-120"></div>' : trx.length ? `<div class="table-wrap"><table class="tbl cards">${theadTrx(P)}<tbody>${trx.map((t) => trxRowHTML(t, { pilih: P, flash: Pages.pos._flash })).join('')}</tbody></table></div>` : kosongHTML('Belum ada transaksi.', 'receipt')}`;
      Pages.pos._flash = null; P.segar(); barPilih();
      const tr = $('#tgl-r', el); if (tr) tr.onchange = () => { tglRiwayat = tr.value || hariIni(); P.kosongkan(); if (tglRiwayat === hariIni()) { riwayatLain = null; riwayat(); } else muatRiwayatLain(); };
    };
    const lockNote = () => {
      const h = Store.hariIni || {};
      $('#lock-note', el).innerHTML = terkunci() ? `<div class="closed-note">${ic('lock')}<div class="grow"><b>Kasir hari ini sudah ditutup.</b><div class="small" style="opacity:.85">Daily closing${h.closing ? ' oleh ' + esc(h.closing.oleh) + ' pukul ' + esc(tgl(h.closing.waktu, 'HH:mm')) : ''}. ${koreksi ? 'Mode koreksi Owner aktif.' : Store.owner() ? 'Transaksi susulan bisa dicatat lewat mode koreksi.' : 'Hubungi Owner bila ada transaksi yang terlewat.'}</div></div>${Store.owner() ? `<button class="btn sm" data-act="koreksi">${koreksi ? 'Tutup mode koreksi' : 'Catat transaksi susulan'}</button>` : ''}</div>` : '';
    };

    const simpan = async (btn) => {
      const t = total(); if (!t.masuk) return;
      if (tutup()) return toast('Kasir hari ini sudah ditutup.', 'error');
      const tg = hariIni();
      const items = menu().filter((m) => cart.items[m.id]).map((m) => ({ idMenu: m.id, qty: cart.items[m.id], harga: m.dinamis ? hargaDari(m) : undefined }));
      const data = { id: 'TRX-' + tg.replace(/-/g, '') + '-' + uid(5), tanggal: tg, jam: jamKini(), items, tips: Math.max(0, num(cart.tips)), acara: Math.max(0, num(cart.acara)), metode: cart.metode, jenis: cart.jenis, catatan: cart.catatan };
      const lokal = { _cup: t.cup, _omset: t.omset, _items: items.map((i) => { const m = menu().find((x) => x.id === i.idMenu); return { id: i.idMenu, nama: m.nama, qty: i.qty, harga: hargaDari(m), subtotal: i.qty * hargaDari(m) }; }) };
      const cadangan = JSON.parse(JSON.stringify(cart));
      // optimis: keranjang langsung kosong, transaksi muncul di riwayat
      cart = { items: {}, harga: {}, tips: 0, acara: 0, metode: cart.metode, jenis: cart.jenis, catatan: '' }; simpanCart();
      cartEl.classList.remove('sheet-open'); $('.scrim') && $('.scrim').remove();
      gambarKatalog(); gambarCart();
      if (!Net.up) { Antrean.tambah('penjualan.simpan', Object.assign({}, data, lokal), 'Penjualan ' + t.cup + ' cup'); riwayat(); return; }
      Topline.start();
      const pulihkan = (pesan) => { cart = cadangan; simpanCart(); gambarKatalog(); gambarCart(); toast(pesan + ' Pesanan dikembalikan ke keranjang.', 'error', 'Transaksi belum tersimpan'); };
      try {
        let r = await API.call('penjualan.simpan', data);
        if (!r.success && r.code === 'ALASAN_KOREKSI') {
          const al = await mintaTeks({ title: 'Transaksi susulan untuk hari yang sudah closing', label: 'Alasan (tercatat di riwayat)', min: 5, area: true, ok: 'Simpan' });
          if (al) r = await API.call('penjualan.simpan', Object.assign({}, data, { alasan: al })); else return pulihkan('Dibatalkan.');
        }
        if (r.success) {
          const h = Store.hariIni; if (h && r.data.trx && h.tanggal === tg && !h.trx.some((x) => x.id === r.data.trx.id)) { h.trx.unshift(r.data.trx); ['cup', 'masuk', 'omset', 'tips', 'acara'].forEach((k) => { h.ringkas[k] += r.data.trx[k]; }); Store.set({ hariIni: h }); }
          Pages.pos._flash = data.id; Cache.basi(); riwayat();
          toast(t.cup + ' cup · ' + rp(t.masuk) + ' tercatat di Google Sheets.', 'success', 'Transaksi tersimpan');
        } else { pulihkan(r.message); if (r.code === 'TERKUNCI') App.muatHariIni().then(() => { lockNote(); gambarKatalog(); gambarCart(); }); }
      } catch (e) {
        if (e.offline) { Antrean.tambah('penjualan.simpan', Object.assign({}, data, lokal), 'Penjualan ' + t.cup + ' cup'); riwayat(); }
        else pulihkan(e.message);
      } finally { Topline.done(); }
    };

    lockNote(); gambarKatalog(); gambarCart(); riwayat(); if (tglRiwayat !== hariIni()) muatRiwayatLain();
    pasangSeg($('#vt .seg', el), (v) => { tampilan = v; localStorage.setItem('rp:posView', v); gambarKatalog(); });
    $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); gambarKatalog(); }, 150));
    $('#kat', el).addEventListener('click', (e) => { const c = e.target.closest('[data-kat]'); if (!c) return; kat = c.dataset.kat; $$('#kat .chip', el).forEach((x) => x.classList.toggle('on', x === c)); gambarKatalog(); });
    el.addEventListener('click', async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const p = e.target.closest('[data-plus]'), m = e.target.closest('[data-min]'), h = e.target.closest('[data-hapus]'), a = e.target.closest('[data-act], [data-bulk]');
      if (p) { e.stopPropagation(); return ubahQty(p.dataset.plus, 1); }
      if (m) { e.stopPropagation(); return ubahQty(m.dataset.min, -1); }
      if (h) { delete cart.items[h.dataset.hapus]; simpanCart(); gambarKatalog(); gambarCart(); return; }
      const kartu = e.target.closest('.mcard, .mrow'); if (kartu && !e.target.closest('input')) return ubahQty(kartu.dataset.id, 1);
      if (e.target.closest('#cart-bar')) { cartEl.classList.add('sheet-open'); const s = document.createElement('div'); s.className = 'scrim'; s.style.zIndex = 69; s.onclick = () => { cartEl.classList.remove('sheet-open'); s.remove(); }; cartEl.parentNode.insertBefore(s, cartEl); return; }
      if (!a) return;
      if (a.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (a.dataset.bulk === 'batal') { const r = await batalkanData(P.ids().map((id) => ({ jenis: 'POS', id }))); if (r && r.success) { P.kosongkan(); await App.muatHariIni(); if (tglRiwayat !== hariIni()) muatRiwayatLain(); } return; }
      if (a.dataset.act === 'reset') { cart.items = {}; cart.harga = {}; cart.tips = 0; cart.acara = 0; cart.catatan = ''; simpanCart(); gambarKatalog(); gambarCart(); }
      if (a.dataset.act === 'simpan') simpan(a);
      if (a.dataset.act === 'koreksi') { koreksi = !koreksi; lockNote(); gambarKatalog(); gambarCart(); }
      if (a.dataset.act === 'riwayat') $('#riwayat', el).scrollIntoView({ behavior: 'smooth' });
      const daftar = tglRiwayat !== hariIni() ? (riwayatLain || []) : ringkasLokal().trx, t = daftar.find((x) => x.id === a.dataset.id);
      const segar = () => { if (tglRiwayat !== hariIni()) muatRiwayatLain(); else riwayat(); };
      if (a.dataset.act === 'lihat' && t) detailTrx(t, segar);
      if (a.dataset.act === 'ubah' && t) ubahTrx(t, segar);
    });
    el.addEventListener('change', (e) => { const hInp = e.target.closest('[data-harga]'); if (!hInp) return; const mm = menu().find((x) => x.id === hInp.dataset.harga); let v = angkaRp(hInp, 'Harga'); if (!Store.owner()) v = Math.max(mm.hargaMin, Math.min(mm.hargaMaks, v)); cart.harga[mm.id] = v; hInp.value = fmtNum(v); simpanCart(); gambarCart(); });
    if (q.riwayat) setTimeout(() => $('#riwayat', el).scrollIntoView({ behavior: 'smooth' }), 200);
    let kunciLama = terkunci();
    const on = () => { const k = terkunci(); if (k !== kunciLama) { kunciLama = k; lockNote(); gambarKatalog(); } gambarCart(); if (tglRiwayat === hariIni()) riwayat(); };
    document.addEventListener('hariIni', on); document.addEventListener('antrean', on); document.addEventListener('net', on);
    pakai('hariIni', {}, (d) => { Store.hariIni = d; Store.set({ hariIni: d }); on(); }, { maxAge: 20000 });
    return () => { document.removeEventListener('hariIni', on); document.removeEventListener('antrean', on); document.removeEventListener('net', on); $('.scrim') && $('.scrim').remove(); };
  }
};

/* ============================== PENGELUARAN ============================== */
Pages.biaya = {
  render(el, q = {}) {
    const kats = Store.opsi.kategoriBiaya || [], cepat = Store.opsi.tombolCepat || [], plafon = Store.opsi.plafon || 0;
    let tab = 'Semua', cari = '', edit = null, tglList = Store.owner() && /^\d{4}-\d{2}-\d{2}$/.test(q.t || '') && q.t <= hariIni() ? q.t : hariIni(), listLain = null;
    const P = Pilih(el, { onChange: () => barPilih() });
    const barPilih = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm danger" data-bulk="batal">${ic('ban', 'sm')}Batalkan</button>`); };
    const dataList = () => (tglList === hariIni() ? ringkasLokal().biaya : (listLain || []));
    const gambar = () => {
      const { biaya, h } = ringkasLokal();
      const aktif = biaya.filter((b) => !b.batal), tot = aktif.reduce((a, b) => a + b.nominal, 0), lock = !!h.terkunci;
      const sisa = plafon ? plafon - tot : 0, persen = plafon ? Math.min(100, tot / plafon * 100) : 0;
      el.innerHTML = `${kepala({ judul: 'Biaya lapak', desc: 'Kas kecil harian ' + esc((Store.app || {}).lapak || '') + '. Pengeluaran ini mengurangi omset bersih kasir.', acts: `<button class="btn" data-act="cetak">${ic('printer', 'sm')}Rekap biaya</button>${Store.punya('closing') ? `<a class="btn" href="#/closing">${ic('lock', 'sm')}Ke closing</a>` : ''}` })}
      <div class="stack">
        ${lock ? `<div class="closed-note">${ic('lock')}<div class="grow"><b>Buku kas hari ini sudah ditutup.</b><div class="small" style="opacity:.85">${Store.owner() ? 'Anda tetap bisa mengoreksi; alasan koreksi akan diminta dan saldo dihitung ulang.' : 'Pengeluaran baru hari ini tidak bisa dicatat. Hubungi Owner untuk koreksi.'}</div></div></div>` : ''}
        <div class="grid g-side">
          <div class="stack">
            <div class="card" id="form"></div>
            <div class="card"><h3>Nominal acuan</h3><div class="mt-8">${kats.map((k) => `<div class="sum-row"><span class="row gap-8"><span class="icon-box s">${ic(ikonBiaya(k.nama), 'sm')}</span>${esc(k.nama)}</span><span class="v">${rp(k.acuan)}</span></div>`).join('')}</div><p class="xs muted mt-8">Hanya petunjuk — nominal tetap bisa diubah.</p></div>
          </div>
          <div class="stack">
            <div class="card"><div class="row between top"><div><div class="small muted">Total pengeluaran hari ini</div><div class="row wrap gap-8 mt-4"><span class="kpi-val">${rp(tot)}</span>${plafon ? `<span class="badge ${sisa < 0 ? 'danger' : persen > 80 ? 'warning' : 'success'}">${sisa < 0 ? 'Lewat ' + rp(-sisa) : 'Sisa plafon ' + rp(sisa)}</span>` : ''}</div><div class="small muted mt-4">${aktif.length} catatan · plafon harian kasir ${plafon ? rp(plafon) : 'tanpa batas'}</div></div><div id="spark" class="hide-m"></div></div>
              ${plafon ? `<div class="meter mt-12 ${persen > 100 ? 'danger' : persen > 80 ? 'warning' : ''}"><i data-w="${persen}"></i></div>` : ''}</div>
            <div class="card"><div class="card-head"><div><h3>Catatan pengeluaran</h3><div class="sub" id="sub-l"></div></div>${Store.owner() ? `<input type="date" class="input" style="max-width:170px;min-height:34px" id="tgl-l" value="${tglList}" max="${hariIni()}" aria-label="Tanggal">` : ''}</div>
              <div class="row wrap between mb-12 gap-8"><div class="chips scroll" id="tabs">${['Semua'].concat(kats.map((k) => k.nama)).map((k) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${esc(k)}">${esc(k.split(' / ')[0])}</button>`).join('')}</div><div class="search" style="min-width:200px">${ic('search')}<input class="input" id="cari" placeholder="Cari catatan…" value="${esc(cari)}"></div></div>
              <div id="bulk"></div><div id="list"></div></div>
          </div>
        </div></div>`;
      animasiBatang(el);
      form(lock); daftar();
      pakai('biaya.list', Param.bulan30(), (d) => { const per = {}; d.rows.forEach((b) => { per[b.tanggal] = (per[b.tanggal] || 0) + b.nominal; }); const v = []; for (let i = 6; i >= 0; i--) v.push(per[addDays(hariIni(), -i)] || 0); const s = $('#spark', el); if (s) s.innerHTML = `<div class="xs muted right">7 hari terakhir</div>${sparkSVG(v, 130, 40, 'var(--c-secondary)')}`; }, { maxAge: 60000 });
      $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); daftar(); }, 200));
      const tl = $('#tgl-l', el); if (tl) tl.onchange = async () => { tglList = tl.value || hariIni(); P.kosongkan(); if (tglList === hariIni()) { listLain = null; daftar(); return; } listLain = null; daftar(); const r = await API.call('biaya.list', { dari: tglList, sampai: tglList, batal: 'semua' }).catch((er) => ({ success: false, message: er.message })); if (r.success) listLain = r.data.rows; else toast(r.message, 'error'); daftar(); };
    };
    const form = (lock) => {
      const f = $('#form', el), b = edit || {};
      const katAwal = b.kategori || (kats[1] || kats[0] || {}).nama;
      const bolehTgl = Store.owner() || Store.aturan.tanggalMundur;
      const nonaktif = lock && !Store.owner() && !edit;
      f.innerHTML = `<div class="card-head"><div><h3>${edit ? 'Ubah pengeluaran' : 'Catat pengeluaran'}</h3><div class="sub">${edit ? '#' + esc(edit.id) : 'Petugas: ' + esc(Store.me.nama)}</div></div></div>
        <div class="col">
          ${cepat.length ? `<div class="field"><label>Isi cepat</label><div class="chips">${cepat.map((c, i) => `<button type="button" class="chip" data-cepat="${i}">${esc(c.label)} <span class="n">${rp(c.nominal)}</span></button>`).join('')}</div></div>` : ''}
          <div class="field"><label>Kategori</label><select class="input" id="kat">${kats.map((k) => `<option value="${esc(k.nama)}" ${k.nama === katAwal ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}</select></div>
          <div class="field"><label>Nominal <span class="hint" id="acuan"></span></label><div class="input-rp"><span>Rp</span><input class="input" id="nom" inputmode="numeric" placeholder="0" value="${b.nominal ? fmtNum(b.nominal) : ''}"></div></div>
          <div class="field"><label>Keterangan</label><textarea class="input" id="ket" placeholder="mis. isi ulang 4 galon air rebusan">${esc(b.keterangan || '')}</textarea></div>
          <div class="form-grid"><div class="field"><label>Tanggal</label><input class="input" type="date" id="tg" value="${esc(b.tanggal || hariIni())}" max="${hariIni()}" ${bolehTgl ? '' : 'disabled'}></div><div class="field"><label>Jam (${zona()})</label><input class="input" type="time" id="jm" value="${esc(b.jam || jamKini())}"></div></div>
          <div class="row"><button class="btn" data-act="reset">${edit ? 'Batal ubah' : 'Kosongkan'}</button><button class="btn primary grow" data-act="simpan" ${nonaktif ? 'disabled' : ''}>${ic('check', 'sm')}${edit ? 'Simpan perubahan' : 'Simpan pengeluaran'}</button></div>
        </div>`;
      const nom = $('#nom', f), kat = $('#kat', f);
      const acuan = () => { const k = kats.find((x) => x.nama === kat.value); $('#acuan', f).textContent = k ? 'acuan ' + rp(k.acuan) : ''; };
      acuan(); kat.onchange = acuan;
      nom.addEventListener('input', () => angkaRp(nom, 'Nominal'));
      $$('[data-cepat]', f).forEach((c) => c.onclick = () => { const x = cepat[+c.dataset.cepat]; kat.value = x.kategori; nom.value = fmtNum(x.nominal); $('#ket', f).value = x.ket || ''; acuan(); $$('[data-cepat]', f).forEach((y) => y.classList.toggle('on', y === c)); });
    };
    const daftar = () => {
      const lain = tglList !== hariIni(), semua = dataList();
      const sub = $('#sub-l', el); if (sub) sub.textContent = (lain ? tgl(tglList, 'EEEE, d MMMM yyyy') : 'Hari ini') + ' · ' + semua.filter((b) => !b.batal).length + ' catatan';
      if (lain && !listLain) { $('#list', el).innerHTML = '<div class="skel h-120"></div>'; return; }
      const rows = semua.filter((b) => (tab === 'Semua' || b.kategori === tab) && (!cari || (b.kategori + ' ' + b.keterangan).toLowerCase().includes(cari)));
      $('#list', el).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${P.th()}<th>Kategori & keterangan</th><th>Jam</th><th class="r">Nominal</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((b) => `<tr class="${b.batal ? 'batal' : ''} ${b.pending ? 'pending' : ''}">${P.td(b.id, bolehBatal(b))}<td class="main-cell"><div class="strong ${b.batal ? 'coret' : ''}">${esc(b.kategori)}</div><div class="small muted">${esc(b.keterangan || '—')}</div>${b.batal ? `<div class="xs bad mt-4">Dibatalkan ${esc(b.dibatalkanOleh || '')}: ${esc(b.alasanBatal || '')}</div>` : ''}${b.galat ? `<div class="xs bad mt-4">${esc(b.galat)}</div>` : ''}</td><td data-l="Jam" class="tnum">${esc(b.jam)} <span class="xs muted">${esc(b.kasir || '')}</span></td><td data-l="Nominal" class="r"><b class="${b.batal ? 'coret' : ''}">${rp(b.nominal)}</b></td><td data-l="Status">${b.pending ? syncHTML(b.sync) : b.batal ? badgeStatus('BATAL') : syncHTML('ok')}</td><td class="r" data-l="">${!b.batal && !b.pending && (Store.owner() || (b.tanggal === hariIni() && !hariTerkunci(b.tanggal) && milikSaya(b) && Store.aturan.hapusTrx)) ? `<button class="btn ghost icon-only sm" data-edit="${esc(b.id)}" aria-label="Ubah">${ic('edit', 'sm')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosongHTML('Belum ada catatan pengeluaran.', 'receipt');
      P.segar(); barPilih();
    };
    const simpan = async (btn) => {
      const nomInp = $('#nom', el), nominal = angkaRp(nomInp, 'Nominal');
      if (nominal <= 0) { nomInp.classList.add('err'); return toast('Isi nominal pengeluaran lebih dari 0.', 'warning'); }
      const data = { id: edit ? edit.id : 'EXP-' + hariIni().replace(/-/g, '') + '-' + uid(4), kategori: $('#kat', el).value, nominal, keterangan: $('#ket', el).value.trim(), tanggal: $('#tg', el).value || hariIni(), jam: $('#jm', el).value || jamKini() };
      const plafonNow = Store.opsi.plafon; const { biaya } = ringkasLokal();
      if (plafonNow && !Store.owner() && !Store.aturan.lewatiPlafon && data.tanggal === hariIni() && biaya.filter((b) => b.id !== data.id && !b.batal).reduce((a, b) => a + b.nominal, 0) + nominal > plafonNow) return toast('Melebihi plafon harian ' + rp(plafonNow) + '. Minta Owner untuk mencatat.', 'error', 'Plafon terlampaui');
      const r = await tulis('biaya.simpan', data, { btn, teks: 'Menyimpan pengeluaran…', antre: edit ? null : 'Biaya ' + data.kategori });
      if (r.success) { edit = null; if (!r.offline) await App.muatHariIni(); if (tglList !== hariIni()) { const lr = await API.call('biaya.list', { dari: tglList, sampai: tglList, batal: 'semua' }).catch(() => null); listLain = lr && lr.success ? lr.data.rows : listLain; } gambar(); }
    };
    el.onclick = async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; $$('#tabs .chip', el).forEach((x) => x.classList.toggle('on', x === t)); daftar(); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) { edit = dataList().find((b) => b.id === ed.dataset.edit); form(false); $('#form', el).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const a = e.target.closest('[data-act], [data-bulk]'); if (!a) return;
      if (a.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (a.dataset.bulk === 'batal') { const r = await batalkanData(P.ids().map((id) => ({ jenis: 'BIAYA', id })), { contoh: 'mis. biaya tercatat dua kali' }); if (r && r.success) { P.kosongkan(); await App.muatHariIni(); if (tglList !== hariIni()) { const lr = await API.call('biaya.list', { dari: tglList, sampai: tglList, batal: 'semua' }).catch(() => null); listLain = lr && lr.success ? lr.data.rows : listLain; } gambar(); } return; }
      if (a.dataset.act === 'simpan') simpan(a);
      if (a.dataset.act === 'reset') { edit = null; form(!!(Store.hariIni || {}).terkunci); }
      if (a.dataset.act === 'cetak') { const rows = dataList().filter((b) => !b.batal); unduhPDF('Rekap-Biaya-' + tglList, 'Rekap pengeluaran ' + tgl(tglList, 'd MMMM yyyy'), [{ k: 'jam', l: 'Jam' }, { k: 'kategori', l: 'Kategori' }, { k: 'keterangan', l: 'Keterangan' }, { k: 'kasir', l: 'Dicatat oleh' }, { k: 'nominal', l: 'Nominal', t: 'rp' }], rows, [['Total pengeluaran', rp(rows.reduce((x, b) => x + b.nominal, 0))], ['Plafon harian kasir', plafon ? rp(plafon) : 'Tanpa batas']]); }
    };
    gambar();
    if (tglList !== hariIni()) API.call('biaya.list', { dari: tglList, sampai: tglList, batal: 'semua' }).then((r) => { listLain = r.success ? r.data.rows : []; if (!r.success) toast(r.message, 'error'); daftar(); }).catch((e) => toast(e.message, 'error'));
    const on = () => { if (!edit) gambar(); }; document.addEventListener('hariIni', on); document.addEventListener('antrean', on);
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
      const pq = Antrean.jumlah(), adaPending = pq.pending + pq.gagal;
      const katCards = (d.kategori || []).sort((a, b) => b.omset - a.omset);
      const metode = Object.keys(d.metode || {}).map((k, i) => ({ name: k, value: d.metode[k], color: SERI[i] }));
      const tunai = num((d.metode || {}).Tunai);
      const koreksiCat = (d.closing && d.closing.catatan || '').match(/\[Dikoreksi[^\]]*\]/g) || [];
      el.innerHTML = `${kepala({ judul: 'Daily closing', desc: 'Periksa ringkasan uang kasir, lalu kunci pembukuan ' + tgl(tanggal, 'EEEE, d MMMM yyyy') + '.', acts: `${badgeStatus(lock ? 'Terkunci' : d.status === 'Dibuka' ? 'Dibuka' : 'Terbuka')}${Store.owner() || Store.aturan.tanggalMundur ? `<input type="date" class="input" style="max-width:170px" id="tgl" value="${tanggal}" max="${hariIni()}" aria-label="Tanggal closing">` : ''}` })}
      <div class="stack">
        ${d.belumClosing && d.belumClosing.length ? `<div class="notice">${ic('alert')}<div class="grow"><b>${d.belumClosing.length} hari sebelumnya belum closing.</b><div class="small">Closing harus berurutan agar rantai saldo kas benar.</div><div class="chips mt-8">${d.belumClosing.slice(0, 6).map((t) => `<a class="chip" href="#/closing?t=${t}">${tgl(t, 'EEE, d MMM')}</a>`).join('')}</div></div></div>` : ''}
        ${adaPending ? `<div class="notice danger">${ic('cloud')}<div class="grow"><b>${adaPending} data belum terkirim (Pending/Gagal).</b><div class="small">Kirim dulu sebelum closing agar angka lengkap.</div></div><button class="btn sm" data-act="sync">${ic('refresh', 'sm')}Lihat & kirim</button></div>` : ''}
        ${koreksiCat.length ? `<div class="notice info">${ic('edit')}<div><b>Hari ini pernah dikoreksi Owner setelah closing.</b><div class="small">${koreksiCat.map((c) => esc(c.replace(/^\[|\]$/g, ''))).join('<br>')}</div></div></div>` : ''}
        <div class="grid g-main-l">
          <div class="stack">
            <div class="card">
              <div class="card-head"><div><h3>Penjualan & arus kas</h3><div class="sub">${d.jumlahTrx} transaksi · target ${target} cup</div></div><span class="badge gold plain">${r.cup} cup</span></div>
              <div class="meter ${r.cup >= target ? 'success' : ''}"><i data-w="${Math.min(100, r.cup / target * 100)}"></i></div>
              <div class="mt-12">
                <div class="sum-row"><span>Omset penjualan (POS)</span><span class="v">${rp(r.omset)}</span></div>
                <div class="sum-row"><span>Tips customer</span><span class="v">${rp(r.tips)}</span></div>
                <div class="sum-row"><span>Pesanan acara</span><span class="v">${rp(r.acara)}</span></div>
                <div class="sum-row hl-ok"><span>Total pemasukan</span><span class="v">${rp(r.masuk)}</span></div>
                <div class="sum-row hl-bad"><span>Pengeluaran operasional <span class="xs muted">(${d.biaya.filter((b) => !b.batal).length} catatan)</span></span><span class="v">−${rp(r.ops)}</span></div>
              </div>
              <div class="big-total mt-12"><div><b>Omset bersih kasir</b><div class="xs muted">(POS + tips + acara) − pengeluaran</div></div><span class="v">${rp(r.bersih)}</span></div>
              ${katCards.length ? `<h3 class="mt-20 mb-8" style="font-size:14px">Per kategori minuman</h3><div class="grid g-3" style="gap:8px">${katCards.map((k) => `<div class="inset"><div class="row between"><span class="small strong">${esc(k.kategori)}</span><span class="xs muted">${k.cup} cup</span></div><div class="strong mt-4 tnum">${rp(k.omset)}</div></div>`).join('')}</div>` : ''}
            </div>
            <div class="card"><div class="card-head"><div><h3>Komposisi pembayaran</h3><div class="sub">Tunai ada di laci; QRIS/transfer masuk rekening</div></div></div>
              ${metode.length ? segbarHTML(metode, rp) : kosongHTML('Belum ada pembayaran.', 'cash')}
              <div class="sum-row mt-12"><span>Uang tunai penjualan di laci</span><b class="tnum">${rp(tunai)}</b></div>
              <div class="sum-row"><span>Perkiraan sisa tunai fisik (setelah biaya)</span><b class="tnum">${rp(tunai - r.ops)}</b></div>
            </div>
          </div>
          <div class="stack">
            ${d.saldoAwal !== undefined ? `<div class="card"><div class="card-head"><div><h3>Buku kas besar</h3><div class="sub">Saldo hari ini = saldo kemarin − belanja bahan + omset bersih</div></div></div>
              <div class="sum-row"><span>Saldo kemarin</span><span class="v">${rp(d.saldoAwal)}</span></div>
              <div class="sum-row bad"><span>Belanja bahan<div class="xs muted">${esc((d.belanjaList || []).map((n) => n.items.map((i) => i.nama).join(', ')).join(' · ').slice(0, 80) || 'Tidak ada belanja')}</div></span><span class="v">${r.belanja ? '−' + rp(r.belanja) : rp(0)}</span></div>
              <div class="sum-row ${r.bersih < 0 ? 'bad' : 'ok'}"><span>Omset bersih kasir</span><span class="v">${rpTanda(r.bersih)}</span></div>
              <div class="saldo-akhir mt-12"><div class="small muted">Saldo akhir ${tanggal === hariIni() ? 'hari ini' : tgl(tanggal, 'd MMM')}</div><div class="v" id="saldo-akhir">${rp(d.saldoAkhir)}</div><div class="xs muted">Menjadi saldo awal ${tgl(addDays(tanggal, 1), 'EEEE, d MMM')}</div></div></div>` : ''}
            ${lock ? `<div class="notice success">${ic('lock')}<div class="grow"><b>Sudah closing.</b><div class="small">Ditutup ${esc(d.closing.oleh)} · ${esc(tgl(d.closing.waktu, 'd MMM yyyy, HH:mm'))} ${zona()}. Transaksi baru untuk tanggal ini ditolak.</div></div></div>`
          : `<div class="notice">${ic('lock')}<div><b>Setelah closing:</b><ul class="small"><li>Transaksi & pengeluaran tanggal ini terkunci untuk kasir.</li>${d.saldoAkhir !== undefined ? `<li>Saldo akhir <b>${rp(d.saldoAkhir)}</b> menjadi saldo awal besok.</li>` : ''}<li>Hanya Owner yang dapat mengoreksi, dengan alasan tercatat.</li></ul></div></div>`}
            ${lock ? '' : `<button class="btn dark lg block" data-act="kunci" ${d.belumClosing && d.belumClosing.length ? 'disabled' : ''}>${ic('lock', 'sm')}Closing & kunci ${tanggal === hariIni() ? 'hari ini' : tgl(tanggal, 'd MMM')}</button>`}
            ${(Store.punya('dokumen') || Store.aturan.ajukanDokumen) ? `<button class="btn block" data-act="slip" ${lock ? '' : 'disabled title="Tersedia setelah closing"'}>${ic('qr', 'sm')}Terbitkan slip tutup kasir (PDF ber-QR)</button>` : ''}
            <button class="btn block" data-act="cetak">${ic('eye', 'sm')}Pratinjau ringkasan closing</button>
            ${lock && Store.owner() ? `<button class="btn danger block" data-act="buka">${ic('unlock', 'sm')}Buka kunci (Owner)</button>` : ''}
          </div>
        </div></div>`;
      animasiBatang(el);
      const tg = $('#tgl', el); if (tg) tg.onchange = () => { location.hash = '#/closing?t=' + tg.value; };
    };
    const muat = (force) => pakai('closing.status', { tanggal }, gambar, { maxAge: force ? 0 : 15000, force, onError: (m) => { el.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    el.onclick = async (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const d = (Cache.get(Cache.key('closing.status', { tanggal })) || {}).d;
      if (a.dataset.act === 'sync') { bukaStatusSinkron(); }
      if (a.dataset.act === 'kunci') {
        if (Antrean.list().length) { toast('Kirim dulu data Pending/Gagal sebelum closing.', 'warning'); return bukaStatusSinkron(); }
        if (!(await konfirmasi({ title: 'Closing ' + tgl(tanggal, 'd MMMM yyyy') + '?', text: `Omset bersih <b>${rp(d.ringkas.bersih)}</b>${d.saldoAkhir !== undefined ? ', saldo akhir <b>' + rp(d.saldoAkhir) + '</b>' : ''}. Satu hari hanya dapat di-closing satu kali.`, ok: 'Closing & kunci', ikon: 'lock' }))) return;
        const r = await tulis('closing.kunci', { tanggal }, { btn: a, teks: 'Mengunci buku harian…', sub: 'Menyusun rekap kas & saldo akhir' });
        if (r.success) { await App.muatHariIni(); App.segarkanBoot(); muat(true); }
        else if (r.code === 'SUDAH') muat(true);
      }
      if (a.dataset.act === 'buka') {
        const alasan = await mintaTeks({ title: 'Buka kunci ' + tgl(tanggal, 'd MMM yyyy'), label: 'Alasan (tercatat di riwayat)', placeholder: 'mis. kasir perlu menambah transaksi yang terlewat', min: 5, area: true, ok: 'Buka kunci', catatan: 'Untuk koreksi kecil, Owner bisa langsung mengubah data tanpa membuka kunci. Buka kunci bila kasir perlu menambah data lalu closing ulang.' });
        if (!alasan) return;
        const r = await tulis('closing.buka', { tanggal, alasan }, { btn: a, teks: 'Membuka kunci…' });
        if (r.success) { await App.muatHariIni(); muat(true); }
      }
      if (a.dataset.act === 'slip') terbitkanSlip(tanggal, a);
      if (a.dataset.act === 'cetak' && d) unduhPDF('Closing-' + tanggal, 'Ringkasan daily closing ' + tgl(tanggal, 'EEEE, d MMMM yyyy'), [{ k: 'l', l: 'Uraian' }, { k: 'v', l: 'Nilai', t: 'rp' }], [{ l: 'Total cup terjual', v: d.ringkas.cup }, { l: 'Omset penjualan (POS)', v: d.ringkas.omset }, { l: 'Tips', v: d.ringkas.tips }, { l: 'Pesanan acara', v: d.ringkas.acara }, { l: 'Total pemasukan', v: d.ringkas.masuk }, { l: 'Pengeluaran operasional', v: -d.ringkas.ops }, { l: 'Omset bersih', v: d.ringkas.bersih }].concat(d.saldoAwal !== undefined ? [{ l: 'Saldo awal', v: d.saldoAwal }, { l: 'Belanja bahan', v: -d.ringkas.belanja }, { l: 'Saldo akhir', v: d.saldoAkhir }] : []), [['Status', d.terkunci ? 'Terkunci' : 'Belum closing'], ['Dibuat oleh', Store.me.nama]]);
    };
    muat(false);
    const on = () => muat(true); document.addEventListener('antrean', on);
    return () => document.removeEventListener('antrean', on);
  }
};
/* Slip tutup kasir: angka diambil server dari pembukuan; penanda tangan = akun yang login */
async function terbitkanSlip(tanggal, btn) {
  if (btn) btn.classList.add('busy');
  Topline.start();
  const lambat = setTimeout(() => Loader.show('Menyiapkan slip tutup kasir…'), 650);
  const akhir = () => { clearTimeout(lambat); Loader.hide(); Topline.done(); if (btn) btn.classList.remove('busy'); };
  try {
    const tl = await API.call('de.template.list', {});
    const t = tl.success && tl.data.rows.find((x) => x.kode === 'SLIP_CLOSING');
    if (!t) { akhir(); return toast('Template slip tutup kasir tidak tersedia.', 'error'); }
    const p = await API.call('de.dokumen.prefill', { templateId: t.id, ref: tanggal });
    if (!p.success) { akhir(); return toast(p.message, 'error', 'Slip belum bisa dibuat'); }
    const s = await API.call('de.dokumen.simpan', { templateId: t.id, data: p.data.data, judul: p.data.judul, ref: tanggal });
    if (!s.success) { akhir(); return toast(s.message, 'error'); }
    const a = await API.call('de.dokumen.ajukan', { id: s.data.id });
    Cache.basi(); akhir();
    if (!a.success) toast(a.message, 'error'); else toast('Slip siap. Tanda tangani dengan PIN Anda.', 'success');
    location.hash = '#/dokumen?id=' + s.data.id;
  } catch (e) { akhir(); toast(e.message, 'error'); }
}
