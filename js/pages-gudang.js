/* =====================================================================
   Halaman gudang: Belanja Bahan, Stok & Opname, Aset & Inventaris
   ===================================================================== */
'use strict';
/* Pilih foto → pratinjau → unggah ke Drive (foto langsung tampil, unggah berjalan di latar) */
function unggahFotoUI(jenis, id, onUrl, opt = {}) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    try {
      const dataUrl = await kompresFoto(f);
      if (!(await Pratinjau.gambar(dataUrl, { judul: 'Pratinjau foto', ket: 'Foto dikecilkan otomatis sebelum disimpan ke Google Drive.', ok: 'Unggah foto' }))) return;
      opt.sebelum && opt.sebelum(dataUrl);
      const r = await tulis('foto.unggah', { jenis, id, dataUrl }, { teks: 'Mengunggah foto…', sub: 'Menyimpan ke Google Drive', ok: 'Foto tersimpan.' });
      if (r.success) onUrl(r.data.url, dataUrl); else opt.gagal && opt.gagal();
    } catch (e) { toast(e.message, 'error'); }
  };
  inp.click();
}
/* angka desimal ≥ 0 dari input (kg, liter…) */
function angkaDesimal(v) { const s = String(v === undefined || v === null ? '' : v).trim().replace(',', '.'); if (s === '') return NaN; const x = Number(s); return isFinite(x) ? x : NaN; }

/* ============================== BELANJA BAHAN ============================== */
Pages.belanja = {
  render(el, q) {
    let baris = [], stok = [], nota = [], notaBatal = null, mode = 'aktif';
    const P = Pilih(el, { onChange: () => barPilih() });
    const barPilih = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, `<button class="btn sm danger" data-bulk="batal">${ic('ban', 'sm')}Batalkan nota</button>`); };
    const tambahBaris = (x = {}) => { baris.push({ nama: x.nama || '', qty: x.qty || '', satuan: x.satuan || '', harga: x.harga || '' }); };
    const total = () => baris.reduce((a, b) => a + Math.round(Math.max(0, angkaDesimal(b.qty) || 0) * num(b.harga)), 0);
    el.innerHTML = `${kepala({ judul: 'Belanja bahan', desc: 'Catat nota pasar atau supplier. Belanja memotong saldo kas lapak pada tanggal belanja dan menambah stok bahan otomatis.' })}
      <div class="stack">
      <div class="grid g-3" id="mini"></div>
      <div id="peringatan"></div>
      <div class="grid g-main-l">
        <div class="card" id="form"></div>
        <div class="stack"><div class="card"><div class="card-head"><div><h3>Nota 30 hari terakhir</h3><div class="sub" id="sub-n"></div></div><div id="mode-n"></div></div><div id="bulk"></div><div id="riwayat"></div></div>
          <div class="card"><div class="card-head"><div><h3>Komposisi belanja</h3><div class="sub">30 hari terakhir</div></div></div><div class="donut-wrap" id="dist"></div></div></div>
      </div></div>`;
    const formEl = $('#form', el);
    const barisHTML = (b, i, opsiSatuan) => `<div class="inset" style="padding:10px" data-row="${i}"><div class="row wrap gap-8"><input class="input grow" style="min-width:160px" list="dl-bahan" data-f="nama" placeholder="Nama bahan" value="${esc(b.nama)}" aria-label="Nama bahan"><input class="input" type="number" min="0.01" step="any" style="width:90px" data-f="qty" placeholder="Qty" value="${esc(b.qty)}" aria-label="Jumlah"><select class="input" style="width:96px" data-f="satuan" aria-label="Satuan">${opsiSatuan.map((s) => `<option ${s === b.satuan ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><div class="input-rp" style="width:130px"><span>Rp</span><input class="input" inputmode="numeric" data-f="harga" placeholder="Harga" value="${b.harga ? fmtNum(b.harga) : ''}" aria-label="Harga satuan"></div><b class="tnum" style="min-width:92px;text-align:right" data-tot="${i}">${rp(Math.max(0, angkaDesimal(b.qty) || 0) * num(b.harga))}</b><button class="btn ghost icon-only sm" data-del="${i}" aria-label="Hapus baris">${ic('trash', 'sm')}</button></div></div>`;
    const gambarForm = () => {
      const opsiSatuan = Store.opsi.satuan || ['kg', 'pcs'];
      formEl.innerHTML = `<div class="card-head"><div><h2>Nota baru</h2><div class="sub">Nomor nota dibuat otomatis oleh server</div></div></div>
        <div class="form-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="field"><label>Tanggal belanja</label><input type="date" class="input" id="tg" value="${q.t || hariIni()}" max="${hariIni()}"></div><div class="field"><label>Tempat belanja</label><input class="input" id="sumber" list="dl-sumber" placeholder="Pasar Subuh, petani…"><datalist id="dl-sumber">${[...new Set(nota.map((n) => n.sumber).filter(Boolean))].map((s) => `<option value="${esc(s)}">`).join('')}</datalist></div><div class="field"><label>Dibayar dari</label><select class="input" id="metode"><option>Kas Lapak</option><option>Transfer</option><option>Tunai Owner</option></select></div></div>
        <div class="row between mt-16 mb-8"><b>Rincian bahan</b><span class="xs muted">Qty boleh desimal (mis. 0,5 kg)</span></div>
        <datalist id="dl-bahan">${stok.map((s) => `<option value="${esc(s.nama)}">${esc(s.satuan)} · stok ${fmtDec(s.stok)}</option>`).join('')}</datalist>
        <div id="rows" class="col gap-8">${baris.map((b, i) => barisHTML(b, i, opsiSatuan)).join('')}</div>
        <button class="btn mt-12" data-act="tambah">${ic('plus', 'sm')}Tambah baris</button>
        <label class="check mt-12"><input type="checkbox" id="tambahStok" checked><div><b>Tambah jumlah ke stok bahan</b><div class="xs muted">Matikan bila bahan langsung habis dipakai dan tidak disimpan di gudang.</div></div></label>
        <div class="big-total mt-12"><div><b>Total nota</b><div class="xs muted">Memotong saldo kas tanggal belanja</div></div><span class="v" id="tot">${rp(total())}</span></div>
        <div class="row mt-12"><button class="btn" data-act="kosongkan">Kosongkan</button><button class="btn primary grow" data-act="simpan">${ic('check', 'sm')}Simpan nota & tambah stok</button></div>`;
    };
    const hitung = () => { baris.forEach((b, i) => { const t = $(`[data-tot="${i}"]`, formEl); if (t) t.textContent = rp(Math.max(0, angkaDesimal(b.qty) || 0) * num(b.harga)); }); $('#tot', formEl).textContent = rp(total()); };
    formEl.addEventListener('input', (e) => {
      const r = e.target.closest('[data-row]'); if (!r) return; const i = +r.dataset.row, f = e.target.dataset.f;
      if (f === 'harga') baris[i].harga = angkaRp(e.target, 'Harga');
      else if (f === 'qty') { if (/-/.test(e.target.value)) { toast('Qty tidak boleh minus.', 'warning'); e.target.value = e.target.value.replace(/-/g, ''); } baris[i].qty = e.target.value; }
      else if (f === 'nama') { baris[i].nama = e.target.value; const s = stok.find((x) => x.nama.toLowerCase() === e.target.value.trim().toLowerCase()); if (s) { baris[i].satuan = s.satuan; $('[data-f=satuan]', r).value = s.satuan; if (!baris[i].harga && s.harga) { baris[i].harga = s.harga; $('[data-f=harga]', r).value = fmtNum(s.harga); } } }
      hitung();
    });
    formEl.addEventListener('change', (e) => { const r = e.target.closest('[data-row]'); if (r && e.target.dataset.f === 'satuan') baris[+r.dataset.row].satuan = e.target.value; });
    /* validasi baris nota: nama wajib, qty > 0, harga > 0 */
    const validasiItems = (rows) => {
      const items = []; let galat = '';
      rows.forEach((b, i) => {
        const nama = String(b.nama || '').trim(), qty = angkaDesimal(b.qty), harga = num(b.harga);
        if (!nama && !b.qty && !b.harga) return;
        if (!nama) galat = galat || 'Nama bahan baris ' + (i + 1) + ' wajib diisi.';
        else if (!(qty > 0)) galat = galat || 'Qty ' + nama + ' harus lebih dari 0.';
        else if (!(harga > 0)) galat = galat || 'Harga ' + nama + ' harus lebih dari 0.';
        const s = stok.find((x) => x.nama.toLowerCase() === nama.toLowerCase());
        items.push({ idBahan: s ? s.id : '', nama, qty: Math.max(0, qty || 0), satuan: b.satuan || (s ? s.satuan : 'pcs'), harga: Math.max(0, harga) });
      });
      if (!galat && !items.length) galat = 'Isi minimal satu bahan.';
      return { items, galat };
    };
    const daftarNota = () => (mode === 'batal' ? (notaBatal || []) : nota);
    const gambarSisi = () => {
      const t = hariIni(), senin = addDays(t, -((dowOf(t) + 6) % 7)), bln = awalBulan(t);
      const hi = nota.filter((n) => n.tanggal === t), mg = nota.filter((n) => n.tanggal >= senin), bl = nota.filter((n) => n.tanggal >= bln);
      $('#mini', el).innerHTML = [['Hari ini', hi], ['Minggu ini', mg], [BULAN[+t.slice(5, 7) - 1], bl]].map((x, i) => `<div class="card kpi"><div class="lbl2">Belanja ${x[0].toLowerCase()}</div><div class="kpi-val ${i === 2 ? 'gold' : ''}">${rp(x[1].reduce((a, n) => a + n.total, 0))}</div><div class="foot">${x[1].length} nota</div></div>`).join('');
      const kritis = stok.filter((s) => s.status !== 'Aman').sort((a, b) => (a.stok / (a.minimal || 1)) - (b.stok / (b.minimal || 1))).slice(0, 3);
      $('#peringatan', el).innerHTML = kritis.length ? `<div class="notice">${ic('alert')}<div class="grow"><b>Stok menipis</b><div class="small">${kritis.map((s) => `${esc(s.nama)} sisa ${fmtDec(s.stok)} ${esc(s.satuan)}`).join(' · ')}</div></div><div class="row wrap gap-8">${kritis.map((s) => `<button class="btn sm" data-isi="${esc(s.id)}">${ic('plus', 'sm')}${esc(s.nama.split(' ').slice(0, 2).join(' '))}</button>`).join('')}</div></div>` : '';
      const mn = $('#mode-n', el); if (mn && !mn.innerHTML) { mn.innerHTML = segHTML([{ v: 'aktif', l: 'Aktif' }, { v: 'batal', l: 'Dibatalkan' }], mode, 'mini'); pasangSeg($('.seg', mn), async (v) => { mode = v; P.kosongkan(); if (v === 'batal' && !notaBatal) { gambarSisi(); const r = await API.call('belanja.list', Object.assign({ batal: 'saja' }, Param.bulan30())).catch((e) => ({ success: false, message: e.message })); notaBatal = r.success ? r.data.rows : []; if (!r.success) toast(r.message, 'error'); } gambarSisi(); }); }
      const list = daftarNota();
      $('#sub-n', el).textContent = mode === 'batal' ? 'Nota yang dibatalkan' : nota.length + ' nota · ' + rp(nota.reduce((a, n) => a + n.total, 0));
      $('#riwayat', el).innerHTML = mode === 'batal' && !notaBatal ? '<div class="skel h-120"></div>' : list.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${mode === 'aktif' ? P.th() : ''}<th>Nota</th><th class="r">Total</th><th></th></tr></thead><tbody>${list.slice(0, 30).map((n) => `<tr class="${n.batal ? 'batal' : ''}">${mode === 'aktif' ? P.td(n.id, Store.owner() || (n.tanggal === hariIni() && n.idUser === Store.me.id)) : ''}<td class="main-cell"><b>#${esc(n.id)}</b> <span class="xs muted">${tgl(n.tanggal, 'd MMM')} · ${esc(n.sumber || '—')}</span><div class="xs muted" style="white-space:normal">${esc(n.items.map((i) => i.nama + ' ' + fmtDec(i.qty) + ' ' + i.satuan).join(', '))}</div>${n.batal ? `<div class="xs bad mt-4">Dibatalkan ${esc(n.dibatalkanOleh || '')}: ${esc(n.alasanBatal || '')}</div>` : ''}${n.diubah ? `<div class="xs muted">Diubah ${esc(n.diubahOleh || '')}</div>` : ''}</td><td class="r" data-l="Total"><b class="${n.batal ? 'coret' : ''}">${rp(n.total)}</b></td><td class="r" data-l=""><div class="row gap-4" style="justify-content:flex-end">${!n.batal && (Store.owner() || (n.tanggal === hariIni() && n.idUser === Store.me.id)) ? `<button class="btn ghost icon-only sm" data-ubah="${esc(n.id)}" aria-label="Ubah nota">${ic('edit', 'sm')}</button>` : ''}${!n.batal && Store.punya('dokumen') ? `<button class="btn ghost icon-only sm" data-nota="${esc(n.id)}" aria-label="Terbitkan nota ber-QR" title="Terbitkan nota ber-QR">${ic('qr', 'sm')}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : kosongHTML(mode === 'batal' ? 'Tidak ada nota yang dibatalkan.' : 'Belum ada nota 30 hari terakhir.', 'bag');
      P.segar(); barPilih();
      const agg = {}; nota.forEach((n) => n.items.forEach((i) => { agg[i.nama] = (agg[i.nama] || 0) + i.total; }));
      const top = Object.keys(agg).map((k) => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
      const items = top.slice(0, 4).concat(top.length > 4 ? [{ name: 'Lainnya', value: top.slice(4).reduce((a, x) => a + x.value, 0) }] : []).map((x, i) => Object.assign(x, { color: SERI[i] }));
      const dist = $('#dist', el); dist.innerHTML = '<div id="d-dist"></div>' + legendaDonat(items, rpK);
      if (items.length) grafikDonat($('#d-dist', dist), { items, center: { v: rpK(top.reduce((a, x) => a + x.value, 0)).replace('Rp ', ''), l: '30 hari' }, size: 150, fmt: rp });
    };
    /* Ubah nota (Owner / pencatat hari ini). Hari terkunci → alasan koreksi diminta otomatis. */
    const ubahNota = (n) => {
      const opsiSatuan = Store.opsi.satuan || ['kg', 'pcs'];
      let rows = n.items.map((i) => ({ nama: i.nama, qty: String(i.qty), satuan: i.satuan, harga: i.harga }));
      const m = Modal.open({ title: 'Ubah nota #' + esc(n.id), sub: 'Stok dan saldo kas disesuaikan otomatis.', size: 'lg', body: `<div class="form-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="field"><label>Tanggal</label><input type="date" class="input" id="n-tg" value="${n.tanggal}" max="${hariIni()}"></div><div class="field"><label>Tempat belanja</label><input class="input" id="n-s" value="${esc(n.sumber)}"></div><div class="field"><label>Dibayar dari</label><select class="input" id="n-m">${['Kas Lapak', 'Transfer', 'Tunai Owner'].map((x) => `<option ${x === n.metode ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div><div id="n-rows" class="col gap-8 mt-12"></div><button class="btn mt-8" data-tb>${ic('plus', 'sm')}Tambah baris</button><div class="big-total mt-12"><b>Total nota</b><span class="v" id="n-tot"></span></div>`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Simpan perubahan</button>` });
      const gb = () => { $('#n-rows', m.el).innerHTML = rows.map((b, i) => barisHTML(b, i, opsiSatuan)).join(''); ht(); };
      const ht = () => { $('#n-tot', m.el).textContent = rp(rows.reduce((a, b) => a + Math.round(Math.max(0, angkaDesimal(b.qty) || 0) * num(b.harga)), 0)); };
      gb();
      m.el.addEventListener('input', (e) => { const r = e.target.closest('[data-row]'); if (!r) return; const i = +r.dataset.row, f = e.target.dataset.f; if (f === 'harga') rows[i].harga = angkaRp(e.target, 'Harga'); else if (f === 'qty') { e.target.value = e.target.value.replace(/-/g, ''); rows[i].qty = e.target.value; } else if (f === 'nama') rows[i].nama = e.target.value; ht(); });
      m.el.addEventListener('change', (e) => { const r = e.target.closest('[data-row]'); if (r && e.target.dataset.f === 'satuan') rows[+r.dataset.row].satuan = e.target.value; });
      m.el.addEventListener('click', (e) => { const d = e.target.closest('[data-del]'); if (d) { rows.splice(+d.dataset.del, 1); if (!rows.length) rows.push({ nama: '', qty: '', satuan: '', harga: '' }); gb(); } if (e.target.closest('[data-tb]')) { rows.push({ nama: '', qty: '', satuan: opsiSatuan[0], harga: '' }); gb(); } });
      $('[data-b]', m.el).onclick = () => m.close();
      $('[data-ok]', m.el).onclick = async (e) => {
        const v = validasiItems(rows); if (v.galat) return toast(v.galat, 'warning');
        const r = await tulis('belanja.ubah', { id: n.id, tanggal: $('#n-tg', m.el).value, sumber: $('#n-s', m.el).value.trim(), metode: $('#n-m', m.el).value, items: v.items, tambahStok: true }, { btn: e.currentTarget, teks: 'Menyimpan perubahan nota…' });
        if (r.success) { m.close(); muat(true); App.segarkanBoot(); }
      };
    };
    el.addEventListener('click', async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const isi = e.target.closest('[data-isi]'); if (isi) { const s = stok.find((x) => x.id === isi.dataset.isi); if (baris.length === 1 && !baris[0].nama) baris = []; tambahBaris({ nama: s.nama, satuan: s.satuan, harga: s.harga, qty: Math.max(1, Math.ceil(s.minimal * 2 - s.stok)) }); gambarForm(); formEl.scrollIntoView({ behavior: 'smooth' }); return; }
      const del = e.target.closest('#form [data-del]'); if (del) { baris.splice(+del.dataset.del, 1); if (!baris.length) tambahBaris(); gambarForm(); return; }
      const ub = e.target.closest('[data-ubah]'); if (ub) { const n = nota.find((x) => x.id === ub.dataset.ubah); if (n) ubahNota(n); return; }
      const nt = e.target.closest('[data-nota]'); if (nt) { buatDokumenDari('NOTA_BELANJA', nt.dataset.nota, nt); return; }
      const b = e.target.closest('[data-bulk]');
      if (b && b.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (b && b.dataset.bulk === 'batal') { const r = await batalkanData(P.ids().map((id) => ({ jenis: 'BELANJA', id })), { contoh: 'mis. nota tercatat dua kali' }); if (r && r.success) { P.kosongkan(); notaBatal = null; muat(true); App.segarkanBoot(); } return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'tambah') { tambahBaris(); gambarForm(); $$('[data-f=nama]', formEl).pop().focus(); }
      if (a.dataset.act === 'kosongkan') { baris = []; tambahBaris(); gambarForm(); }
      if (a.dataset.act === 'simpan') {
        const v = validasiItems(baris); if (v.galat) return toast(v.galat, 'warning', 'Periksa nota');
        const baru = v.items.filter((i) => !i.idBahan).map((i) => i.nama);
        if (baru.length && !(await konfirmasi({ title: 'Bahan baru', text: 'Bahan berikut belum ada di daftar stok dan akan dibuat otomatis: <b>' + esc(baru.join(', ')) + '</b>.', ok: 'Lanjutkan' }))) return;
        const r = await tulis('belanja.simpan', { tanggal: $('#tg', formEl).value, sumber: $('#sumber', formEl).value.trim(), metode: $('#metode', formEl).value, items: v.items, tambahStok: $('#tambahStok', formEl).checked }, { btn: a, teks: 'Menyimpan nota…', sub: 'Memotong saldo kas & menambah stok' });
        if (r.success) { baris = []; tambahBaris(); muat(true); App.segarkanBoot(); }
      }
    });
    const muat = (force) => {
      pakai('stok.list', {}, (d) => { stok = d.rows; gambarSisi(); const dl = $('#dl-bahan', formEl); if (dl) dl.innerHTML = stok.map((s) => `<option value="${esc(s.nama)}">`).join(''); if (force) gambarForm(); }, { maxAge: force ? 0 : 30000, force });
      pakai('belanja.list', Param.bulan30(), (d) => { nota = d.rows; gambarSisi(); }, { maxAge: force ? 0 : 30000, force });
    };
    tambahBaris(); gambarForm(); muat(false);
  }
};
/* Buat draf dokumen dari data pembukuan (angka diisi server) */
async function buatDokumenDari(kode, ref, btn) {
  if (btn) btn.classList.add('busy');
  Topline.start(); const lambat = setTimeout(() => Loader.show('Menyiapkan dokumen…'), 650);
  const akhir = () => { clearTimeout(lambat); Loader.hide(); Topline.done(); if (btn) btn.classList.remove('busy'); };
  try {
    const tl = await API.call('de.template.list', {}); const t = tl.success && tl.data.rows.find((x) => x.kode === kode);
    if (!t) { akhir(); return toast('Template ' + kode + ' tidak tersedia.', 'error'); }
    const p = await API.call('de.dokumen.prefill', { templateId: t.id, ref }); if (!p.success) { akhir(); return toast(p.message, 'error'); }
    const s = await API.call('de.dokumen.simpan', { templateId: t.id, data: p.data.data, judul: p.data.judul, ref }); akhir();
    if (!s.success) return toast(s.message, 'error');
    Cache.basi(); toast('Draf dokumen dibuat. Periksa, lalu ajukan tanda tangan.', 'success'); location.hash = '#/dokumen?id=' + s.data.id;
  } catch (e) { akhir(); toast(e.message, 'error'); }
}

/* ============================== STOK & OPNAME ============================== */
Pages.stok = {
  render(el, q) {
    let kat = 'Semua', cari = q.q ? q.q.toLowerCase() : '', data = null, pilih = '', arsip = false, dataArsip = null;
    const PS = Pilih(el, { onChange: () => barS() }), PL = { ids: () => [] };
    const barS = () => { const b = $('#bulk-s', el); if (b) b.innerHTML = bulkBarHTML(PS.ids().length, arsip ? `<button class="btn sm" data-bulk="pulih">${ic('refresh', 'sm')}Pulihkan</button>` : `<button class="btn sm danger" data-bulk="arsip">${ic('box', 'sm')}Arsipkan</button>`); };
    el.innerHTML = `${kepala({ judul: 'Stok & opname', desc: 'Stok bertambah lewat belanja dan dikoreksi lewat opname (hitung fisik). Bahan yang tidak dipakai lagi bisa diarsipkan; riwayatnya tetap tersimpan.', acts: `<button class="btn" data-act="unduh">${ic('eye', 'sm')}Log opname</button><button class="btn" data-act="baru">${ic('plus', 'sm')}Bahan baru</button><button class="btn primary" data-act="massal">${ic('scale', 'sm')}Opname banyak bahan</button>` })}<div id="isi"></div>`;
    const isi = $('#isi', el);
    const gambar = (d) => {
      data = d; const rows = d.rows.filter((s) => !s.arsip), c = { Aman: 0, Menipis: 0, Kritis: 0, Habis: 0 }; rows.forEach((s) => c[s.status]++);
      const kats = ['Semua'].concat(Store.opsi.kategoriStok || [...new Set(rows.map((s) => s.kategori))]);
      const nilaiKat = {}; rows.forEach((s) => { nilaiKat[s.kategori] = (nilaiKat[s.kategori] || 0) + s.nilai; });
      const totalNilai = rows.reduce((a, s) => a + s.nilai, 0);
      const log = d.log || [];
      isi.innerHTML = `<div class="stack">
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Bahan aktif', ikon: 'box', val: rows.length, foot: (kats.length - 1) + ' kategori' })}
          ${kpiHTML({ label: 'Stok aman', ikon: 'check-c', cls: 'success', val: c.Aman, foot: Math.round(c.Aman / Math.max(1, rows.length) * 100) + '% dari semua bahan' })}
          ${kpiHTML({ label: 'Menipis', ikon: 'alert', cls: 'warning', val: c.Menipis, foot: esc(rows.filter((s) => s.status === 'Menipis').map((s) => s.nama.split(' ')[0]).slice(0, 3).join(', ')) || 'Tidak ada' })}
          ${kpiHTML({ label: 'Kritis / habis', ikon: 'alert', cls: 'danger', val: c.Kritis + c.Habis, foot: c.Kritis + c.Habis ? 'Perlu dibeli' : 'Tidak ada' })}
        </div>
        <div class="grid g-main">
          <div class="card">
            <div class="card-head"><div><h2>Daftar bahan</h2><div class="sub">Nilai stok ${rp(totalNilai)} (stok × harga beli terakhir)</div></div><div class="row gap-8"><div id="mode-s"></div><div class="search" style="min-width:180px">${ic('search')}<input class="input" id="cari" placeholder="Cari bahan…" value="${esc(cari)}"></div></div></div>
            <div class="chips scroll mb-12" id="kat">${kats.map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)} <span class="n">${k === 'Semua' ? rows.length : rows.filter((s) => s.kategori === k).length}</span></button>`).join('')}</div>
            <div id="bulk-s"></div><div id="tbl"></div>
          </div>
          <div class="stack">
            <div class="card" id="opname"></div>
            <div class="card"><div class="card-head"><div><h3>Opname terakhir</h3><div class="sub">Pembatalan opname mengembalikan stok sistem</div></div></div><div id="log"></div>${Store.punya('dokumen') && log.some((l) => !l.batal) ? `<button class="btn block mt-12" data-ba="${log.find((l) => !l.batal).tanggal}">${ic('qr', 'sm')}Berita acara opname ${tgl(log.find((l) => !l.batal).tanggal, 'd MMM')}</button>` : ''}</div>
          </div>
        </div>
        <div class="card"><div class="row wrap between"><h3>Sebaran nilai stok</h3><b class="tnum">${rp(totalNilai)}</b></div><div class="mt-12">${segbarHTML(Object.keys(nilaiKat).map((k, i) => ({ name: k, value: nilaiKat[k], color: SERI[i] })), rpK)}</div></div>
      </div>`;
      const ms = $('#mode-s', isi); ms.innerHTML = segHTML([{ v: 'aktif', l: 'Aktif' }, { v: 'arsip', l: 'Arsip' }], arsip ? 'arsip' : 'aktif', 'mini');
      pasangSeg($('.seg', ms), async (v) => { arsip = v === 'arsip'; PS.kosongkan(); if (arsip && !dataArsip) { tabel(); const r = await API.call('stok.list', { arsip: true }).catch((e) => ({ success: false, message: e.message })); dataArsip = r.success ? r.data.rows.filter((s) => s.arsip) : []; if (!r.success) toast(r.message, 'error'); } tabel(); });
      tabel(); formOpname(); gambarLog();
      $('#cari', isi).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); tabel(); }, 180));
    };
    const tabel = () => {
      if (arsip && !dataArsip) { $('#tbl', isi).innerHTML = '<div class="skel h-120"></div>'; return; }
      const src = arsip ? dataArsip : data.rows.filter((s) => !s.arsip);
      const rows = src.filter((s) => (kat === 'Semua' || s.kategori === kat) && (!cari || (s.nama + ' ' + s.id + ' ' + s.kategori).toLowerCase().includes(cari)));
      const boleh = Store.owner() || Store.punya('stok');
      $('#tbl', isi).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${PS.th()}<th>Bahan</th><th class="r">Stok</th><th class="r">Minimal</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((s) => `<tr>${PS.td(s.id, boleh)}<td data-l="Bahan" class="main-cell"><div class="row gap-8"><img class="thumb" src="${esc(fotoUrl(s.foto, 'assets/img/bahan/default.svg'))}" alt="" loading="lazy" onerror="this.src='assets/img/bahan/default.svg'"><div><b>${esc(s.nama)}</b><div class="id">${esc(s.id)} · ${esc(s.kategori)} · ${rp(s.harga)}/${esc(s.satuan)}</div></div></div></td><td data-l="Stok" class="r"><b class="${s.status === 'Aman' ? '' : s.status === 'Menipis' ? 'warn' : 'bad'}">${fmtDec(s.stok)}</b> <span class="xs muted">${esc(s.satuan)}</span></td><td data-l="Minimal" class="r">${fmtDec(s.minimal)}</td><td data-l="Status">${arsip ? badgeStatus('ARSIP') : badgeStatus(s.status)}</td><td data-l="" class="r">${arsip ? '' : `<button class="btn ghost icon-only sm" data-op="${esc(s.id)}" aria-label="Opname ${esc(s.nama)}">${ic('scale', 'sm')}</button><button class="btn ghost icon-only sm" data-edit="${esc(s.id)}" aria-label="Ubah ${esc(s.nama)}">${ic('edit', 'sm')}</button>`}</td></tr>`).join('')}</tbody></table></div>` : kosongHTML(arsip ? 'Tidak ada bahan yang diarsipkan.' : 'Bahan tidak ditemukan.', 'box');
      PS.segar(); barS();
    };
    const gambarLog = () => {
      const log = (data.log || []).slice(0, 8);
      const bolehBatalLog = (l) => !l.batal && (Store.owner() || (Store.aturan.hapusTrx && l.tanggal === hariIni() && l.idUser === Store.me.id));
      $('#log', isi).innerHTML = log.length ? log.map((l) => `<div class="li"><div class="grow"><div class="t ${l.batal ? 'coret' : ''}">${esc(l.nama)}</div><div class="xs muted">${tgl(l.waktu || l.tanggal, 'd MMM, HH:mm')} · ${fmtDec(l.sistem)} → ${fmtDec(l.fisik)} ${esc(l.satuan)} · ${esc(l.oleh)}</div>${l.batal ? `<div class="xs bad">Dibatalkan: ${esc(l.alasanBatal || '')}</div>` : l.catatan ? `<div class="xs muted">${esc(l.catatan)}</div>` : ''}</div><span class="badge ${l.batal ? '' : l.selisih < 0 ? 'danger' : l.selisih > 0 ? 'info' : 'success'} plain">${l.selisih > 0 ? '+' : ''}${fmtDec(l.selisih)}</span>${bolehBatalLog(l) ? `<button class="btn ghost icon-only xs" data-batal-op="${esc(l.id)}" aria-label="Batalkan opname">${ic('ban', 'sm')}</button>` : ''}</div>`).join('') : kosongHTML('Belum ada opname.', 'scale');
    };
    const formOpname = () => {
      const aktif = data.rows.filter((s) => !s.arsip);
      const s = aktif.find((x) => x.id === pilih) || aktif[0]; pilih = s ? s.id : '';
      if (!s) { $('#opname', isi).innerHTML = kosongHTML('Belum ada bahan.', 'box'); return; }
      $('#opname', isi).innerHTML = `<div class="card-head"><div><h3>Opname satu bahan</h3><div class="sub">Bandingkan stok sistem dengan hasil timbang/hitung</div></div></div>
        <div class="col"><div class="field"><label>Bahan</label><select class="input" id="op-b">${aktif.map((x) => `<option value="${esc(x.id)}" ${x.id === pilih ? 'selected' : ''}>${esc(x.nama)}</option>`).join('')}</select></div>
        <div class="grid g-2 keep" style="gap:8px"><div class="inset"><div class="xs muted">Stok sistem</div><div class="strong tnum" style="font-size:18px">${fmtDec(s.stok)} <small class="muted">${esc(s.satuan)}</small></div></div><div class="field"><label>Hasil fisik (${esc(s.satuan)})</label><input class="input" id="op-f" type="number" min="0" step="any" placeholder="${fmtDec(s.stok)}"></div></div>
        <div class="inset" id="op-sel"><div class="row between"><span class="small muted">Selisih</span><b class="tnum" id="op-v">—</b></div><div class="xs muted" id="op-p"></div></div>
        <div class="field"><label>Catatan</label><input class="input" id="op-c" placeholder="mis. penyusutan, ampas, tumpah"></div>
        <div class="row between small"><span class="muted">Dicatat oleh</span><b>${esc(Store.me.nama)}</b></div>
        <button class="btn dark block" data-act="op-simpan">${ic('check', 'sm')}Simpan opname</button></div>`;
      const hit = () => { const f = angkaDesimal($('#op-f', isi).value); if (isNaN(f)) { $('#op-v', isi).textContent = '—'; $('#op-p', isi).textContent = ''; return; } const sel = Math.round((f - s.stok) * 1000) / 1000; $('#op-v', isi).textContent = (sel > 0 ? '+' : '') + fmtDec(sel) + ' ' + s.satuan; $('#op-v', isi).className = 'tnum ' + (sel < 0 ? 'bad' : sel > 0 ? 'ok' : ''); $('#op-p', isi).textContent = s.stok && sel ? (sel < 0 ? 'Penyusutan ' : 'Kelebihan ') + fmtNum(Math.abs(sel / s.stok * 100), 1) + '%' : ''; };
      $('#op-f', isi).addEventListener('input', (e) => { if (/-/.test(e.target.value)) { e.target.value = ''; toast('Hasil fisik tidak boleh minus.', 'warning'); } hit(); });
      $('#op-b', isi).onchange = (e) => { pilih = e.target.value; formOpname(); };
    };
    const editBahan = (s) => {
      const baru = !s;
      s = s || { nama: '', kategori: (Store.opsi.kategoriStok || [])[0], satuan: 'kg', minimal: 0, stok: 0, harga: 0, foto: '' };
      const m = Modal.open({ title: baru ? 'Bahan baru' : 'Ubah bahan ' + esc(s.id), size: 'lg', body: `<div class="row top gap-20 wrap"><div class="photo-up" id="foto" role="button" aria-label="Ganti foto"><img src="${esc(fotoUrl(s.foto, 'assets/img/bahan/default.svg'))}" alt=""><span class="ov">${baru ? 'Foto setelah disimpan' : 'Ganti foto'}</span></div><div class="grow form-grid"><div class="field span-2"><label>Nama bahan <span class="hint">wajib</span></label><input class="input" id="b-n" value="${esc(s.nama)}" required></div><div class="field"><label>Kategori</label><select class="input" id="b-k">${(Store.opsi.kategoriStok || []).map((k) => `<option ${k === s.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Satuan</label><select class="input" id="b-s">${(Store.opsi.satuan || []).map((k) => `<option ${k === s.satuan ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Minimal stok</label><input class="input" id="b-m" type="number" min="0" step="any" value="${s.minimal}"></div><div class="field"><label>Harga beli terakhir</label><div class="input-rp"><span>Rp</span><input class="input" id="b-h" inputmode="numeric" value="${s.harga ? fmtNum(s.harga) : ''}" placeholder="0"></div></div>${baru ? '<div class="field"><label>Stok awal</label><input class="input" id="b-st" type="number" min="0" step="any" value="0"></div>' : ''}</div></div>${baru ? '' : '<p class="xs muted mt-12">Jumlah stok diubah lewat belanja (bertambah) atau opname (koreksi fisik).</p>'}`, foot: `${baru ? '' : `<button class="btn danger" data-h>${ic('box', 'sm')}Arsipkan</button>`}<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Simpan</button>` });
      let foto = s.foto;
      $('#foto', m.el).onclick = () => { if (baru) return toast('Simpan bahan dulu, lalu unggah fotonya.', 'info'); const box = $('#foto', m.el); unggahFotoUI('stok', s.id, (url) => { foto = url; box.classList.remove('up'); muat(true); }, { sebelum: (prev) => { $('img', box).src = prev; box.classList.add('up'); }, gagal: () => box.classList.remove('up') }); };
      $('#b-h', m.el).addEventListener('input', (e) => angkaRp(e.target, 'Harga'));
      $('[data-b]', m.el).onclick = () => m.close();
      const h = $('[data-h]', m.el); if (h) h.onclick = async () => { const al = await mintaTeks({ title: 'Arsipkan ' + s.nama, label: 'Alasan', min: 3, ok: 'Arsipkan', catatan: 'Bahan tidak tampil di daftar aktif. Riwayat belanja & opname tetap tersimpan dan bisa dipulihkan.' }); if (al && (await tulis('stok.hapus', { ids: [s.id], alasan: al }, { btn: h, teks: 'Mengarsipkan…' })).success) { m.close(); dataArsip = null; muat(true); } };
      $('[data-ok]', m.el).onclick = async (e) => {
        const nama = $('#b-n', m.el).value.trim();
        if (!nama) { $('#b-n', m.el).classList.add('err'); $('#b-n', m.el).focus(); return toast('Nama bahan wajib diisi.', 'warning'); }
        const minimal = angkaDesimal($('#b-m', m.el).value || '0'), stokAwal = baru ? angkaDesimal($('#b-st', m.el).value || '0') : 0;
        if (!(minimal >= 0) || !(stokAwal >= 0)) return toast('Minimal stok dan stok awal harus angka 0 atau lebih.', 'warning');
        const r = await tulis('stok.simpan', { id: s.id, nama, kategori: $('#b-k', m.el).value, satuan: $('#b-s', m.el).value, minimal, harga: parseRp($('#b-h', m.el).value), stok: baru ? stokAwal : undefined, foto }, { btn: e.currentTarget, teks: 'Menyimpan bahan…' });
        if (r.success) { m.close(); muat(true); }
      };
    };
    const massal = () => {
      const rows = data.rows.filter((s) => !s.arsip);
      const m = Modal.open({ title: 'Opname banyak bahan', sub: 'Isi hanya bahan yang ditimbang/dihitung. Kosongkan yang tidak diperiksa.', size: 'xl', body: `<div class="table-wrap" style="max-height:60vh"><table class="tbl cards"><thead><tr><th>Bahan</th><th class="r">Sistem</th><th>Fisik</th><th class="r">Selisih</th><th>Catatan</th></tr></thead><tbody>${rows.map((s) => `<tr data-id="${esc(s.id)}"><td data-l="Bahan" class="main-cell"><b>${esc(s.nama)}</b> <span class="xs muted">${esc(s.satuan)}</span></td><td data-l="Sistem" class="r">${fmtDec(s.stok)}</td><td data-l="Fisik"><input class="input" style="max-width:110px;min-height:36px" type="number" min="0" step="any" data-fisik aria-label="Fisik ${esc(s.nama)}"></td><td data-l="Selisih" class="r" data-sel>—</td><td data-l="Catatan"><input class="input" style="min-height:36px" data-cat placeholder="opsional"></td></tr>`).join('')}</tbody></table></div>`, foot: `<span class="grow muted small" id="m-n">0 bahan diisi</span><button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check', 'sm')}Simpan opname</button>` });
      m.el.addEventListener('input', (e) => { const tr = e.target.closest('tr'); if (!tr || !e.target.matches('[data-fisik]')) return; if (/-/.test(e.target.value)) e.target.value = ''; const s = rows.find((x) => x.id === tr.dataset.id), v = angkaDesimal(e.target.value); const sel = isNaN(v) ? null : Math.round((v - s.stok) * 1000) / 1000; $('[data-sel]', tr).innerHTML = sel === null ? '—' : `<b class="${sel < 0 ? 'bad' : sel > 0 ? 'ok' : ''}">${sel > 0 ? '+' : ''}${fmtDec(sel)}</b>`; $('#m-n', m.el).textContent = $$('[data-fisik]', m.el).filter((i) => i.value !== '').length + ' bahan diisi'; });
      $('[data-b]', m.el).onclick = () => m.close();
      $('[data-ok]', m.el).onclick = async (e) => { const items = $$('tbody tr', m.el).map((tr) => ({ idBahan: tr.dataset.id, fisik: angkaDesimal($('[data-fisik]', tr).value), catatan: $('[data-cat]', tr).value })).filter((x) => !isNaN(x.fisik)); if (!items.length) return toast('Isi minimal satu hasil fisik.', 'warning'); if (items.some((x) => x.fisik < 0)) return toast('Hasil fisik tidak boleh minus.', 'warning'); const r = await tulis('opname.simpan', { items }, { btn: e.currentTarget, teks: 'Menyimpan opname…', sub: items.length + ' bahan' }); if (r.success) { m.close(); muat(true); App.segarkanBoot(); } };
    };
    el.onclick = async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const k = e.target.closest('[data-kat]'); if (k) { kat = k.dataset.kat; $$('#kat .chip', isi).forEach((x) => x.classList.toggle('on', x === k)); tabel(); return; }
      const op = e.target.closest('[data-op]'); if (op) { pilih = op.dataset.op; formOpname(); $('#opname', isi).scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#op-f', isi).focus(), 300); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) return editBahan(data.rows.find((x) => x.id === ed.dataset.edit));
      const ba = e.target.closest('[data-ba]'); if (ba) return buatDokumenDari('BA_OPNAME', ba.dataset.ba, ba);
      const bo = e.target.closest('[data-batal-op]'); if (bo) { const r = await batalkanData([{ jenis: 'OPNAME', id: bo.dataset.batalOp }], { contoh: 'mis. salah timbang' }); if (r && r.success) { muat(true); App.segarkanBoot(); } return; }
      const b = e.target.closest('[data-bulk]');
      if (b && b.dataset.bulk === 'batal-pilih') return PS.kosongkan();
      if (b && b.dataset.bulk === 'arsip') { const al = await mintaTeks({ title: 'Arsipkan ' + PS.ids().length + ' bahan', label: 'Alasan', min: 3, ok: 'Arsipkan', catatan: 'Riwayat belanja & opname tetap tersimpan. Bahan bisa dipulihkan dari tab Arsip.' }); if (al && (await tulis('stok.hapus', { ids: PS.ids(), alasan: al }, { btn: b, teks: 'Mengarsipkan…' })).success) { PS.kosongkan(); dataArsip = null; muat(true); } return; }
      if (b && b.dataset.bulk === 'pulih') { if ((await tulis('stok.hapus', { ids: PS.ids(), pulihkan: true }, { btn: b, teks: 'Memulihkan…' })).success) { PS.kosongkan(); dataArsip = null; arsip = false; muat(true); } return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'baru') editBahan(null);
      if (a.dataset.act === 'massal') { if (!data) return; massal(); }
      if (a.dataset.act === 'unduh' && data) unduhExcel('Log-Stok-Opname-' + hariIni(), 'Log stok opname', LAPORAN.opname.kol, (data.log || []).filter((l) => !l.batal));
      if (a.dataset.act === 'op-simpan') {
        const f = angkaDesimal($('#op-f', isi).value); if (isNaN(f) || f < 0) { $('#op-f', isi).classList.add('err'); return toast('Isi hasil fisik (angka 0 atau lebih).', 'warning'); }
        const r = await tulis('opname.simpan', { items: [{ idBahan: pilih, fisik: f, catatan: $('#op-c', isi).value }] }, { btn: a, teks: 'Menyimpan opname…' });
        if (r.success) { muat(true); App.segarkanBoot(); }
      }
    };
    const muat = (force) => pakai('stok.list', {}, gambar, { maxAge: force ? 0 : 30000, force, onError: (m) => { isi.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    isi.innerHTML = '<div class="stack"><div class="grid g-4 kpis">' + '<div class="skel h-120"></div>'.repeat(4) + '</div><div class="skel h-200"></div></div>';
    muat(false);
    if (q.opname) setTimeout(() => { if (data) massal(); }, 700);
    void PL;
  }
};

/* ============================== ASET & INVENTARIS ============================== */
Pages.aset = {
  render(el, q) {
    let kond = 'Semua', kat = 'Semua', cari = q.q ? q.q.toLowerCase() : '', hal = 1, data = null, dihapus = false, dataHapus = null;
    const P = Pilih(el, { onChange: () => bar() });
    const bar = () => { const b = $('#bulk', el); if (b) b.innerHTML = bulkBarHTML(P.ids().length, dihapus ? `<button class="btn sm" data-bulk="pulih">${ic('refresh', 'sm')}Pulihkan</button>` : `<button class="btn sm danger" data-bulk="hapus">${ic('trash', 'sm')}Hapus dari daftar</button>`); };
    el.innerHTML = `${kepala({ judul: 'Aset & inventaris', desc: 'Perlengkapan gerobak, alat masak rempah, dan sarana lapak. Aset yang dihapus tetap tersimpan untuk riwayat dan bisa dipulihkan.', acts: `<button class="btn" data-act="unduh">${ic('eye', 'sm')}Laporan aset</button><button class="btn primary" data-act="baru">${ic('plus', 'sm')}Aset baru</button>` })}<div id="isi"></div>`;
    const isi = $('#isi', el);
    const gambar = (d) => {
      data = d; const s = d.ringkas;
      const kats = Store.opsi.kategoriAset || Object.keys(s.kategori);
      isi.innerHTML = `<div class="stack">
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Nilai aset', ikon: 'coins', val: rp(s.total), foot: s.item + ' item · ' + fmtNum(s.unit) + ' unit' })}
          ${kpiHTML({ label: 'Kondisi baik', ikon: 'check-c', cls: 'success', val: s.Baik || 0, foot: fmtNum((s.Baik || 0) / Math.max(1, s.item) * 100, 0) + '% dari semua item' })}
          ${kpiHTML({ label: 'Perlu ganti', ikon: 'settings', cls: 'warning', val: s['Perlu Ganti'] || 0, foot: esc(d.rows.filter((a) => a.kondisi === 'Perlu Ganti').map((a) => a.nama.split(' ').slice(0, 2).join(' ')).slice(0, 2).join(', ')) || '—' })}
          ${kpiHTML({ label: 'Rusak', ikon: 'alert', cls: 'danger', val: s.Rusak || 0, foot: s.Rusak ? 'Perlu diganti' : '—' })}
        </div>
        <div class="grid g-main">
          <div class="card">
            <div class="card-head"><div><h2>Daftar aset</h2><div class="sub">${dihapus ? 'Aset yang dihapus dari daftar aktif' : s.item + ' item aktif'}</div></div><div class="row gap-8"><div id="mode-a"></div><div id="kond"></div></div></div>
            <div class="search mb-12">${ic('search')}<input class="input" id="cari" placeholder="Cari nama, kode, atau lokasi…" value="${esc(cari)}"></div>
            <div class="chips scroll mb-12" id="kat">${['Semua'].concat(kats).map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)}</button>`).join('')}</div>
            <div id="bulk"></div><div id="tbl"></div>
          </div>
          <div class="stack">
            <div class="card"><div class="card-head"><h3 id="f-judul">Aset baru</h3><span class="badge plain" id="next-id"></span></div><div id="form"></div></div>
            <div class="card"><div class="card-head"><h3>Sebaran nilai</h3><span class="xs muted">${rpK(s.total)}</span></div>${segbarHTML(Object.keys(s.kategori).sort((a, b) => s.kategori[b] - s.kategori[a]).map((k, i) => ({ name: k, value: s.kategori[k], color: SERI[i % 5] })), rpK)}</div>
          </div>
        </div></div>`;
      $('#kond', isi).innerHTML = segHTML(['Semua', 'Baik', 'Perlu Ganti', 'Rusak'].map((k) => ({ v: k, l: k })), kond, 'mini');
      pasangSeg($('#kond .seg', isi), (v) => { kond = v; hal = 1; tabel(); });
      $('#mode-a', isi).innerHTML = segHTML([{ v: 'aktif', l: 'Aktif' }, { v: 'hapus', l: 'Dihapus' }], dihapus ? 'hapus' : 'aktif', 'mini');
      pasangSeg($('#mode-a .seg', isi), async (v) => { dihapus = v === 'hapus'; P.kosongkan(); hal = 1; if (dihapus && !dataHapus) { tabel(); const r = await API.call('aset.list', { dihapus: true }).catch((e) => ({ success: false, message: e.message })); dataHapus = r.success ? r.data.rows : []; if (!r.success) toast(r.message, 'error'); } tabel(); });
      $('#cari', isi).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; tabel(); }, 180));
      tabel(); form(null);
    };
    const tabel = () => {
      if (dihapus && !dataHapus) { $('#tbl', isi).innerHTML = '<div class="skel h-120"></div>'; return; }
      const src = dihapus ? dataHapus : data.rows;
      const rows = src.filter((a) => (kond === 'Semua' || a.kondisi === kond) && (kat === 'Semua' || a.kategori === kat) && (!cari || (a.nama + ' ' + a.id + ' ' + a.lokasi + ' ' + a.catatan).toLowerCase().includes(cari)));
      const per = 12, page = rows.slice((hal - 1) * per, hal * per);
      $('#tbl', isi).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${P.th()}<th>Barang</th><th>Dibeli</th><th class="r">Qty</th><th class="r">Nilai</th><th>Kondisi</th><th></th></tr></thead><tbody>${page.map((a) => `<tr>${P.td(a.id, true)}<td data-l="Barang" class="main-cell"><div class="row gap-8"><img class="thumb" src="${esc(fotoUrl(a.foto, 'assets/img/aset/lainnya.svg'))}" alt="" loading="lazy" onerror="this.src='assets/img/aset/lainnya.svg'"><div><b>${esc(a.nama)}</b><div class="id">${esc(a.id)} · ${esc(a.kategori)} · ${esc(a.lokasi || '—')}</div>${a.catatan ? `<div class="xs ${a.kondisi === 'Baik' ? 'muted' : 'bad'}">${esc(a.catatan)}</div>` : ''}${a.alasanHapus ? `<div class="xs bad">Dihapus: ${esc(a.alasanHapus)}</div>` : ''}</div></div></td><td data-l="Dibeli">${tgl(a.tanggal, 'd MMM yyyy')}</td><td data-l="Qty" class="r">${fmtNum(a.qty)} ${esc(a.satuan)}</td><td data-l="Nilai" class="r"><b>${rp(a.nilai)}</b>${a.qty > 1 ? `<div class="xs muted">@ ${rp(a.harga)}</div>` : ''}</td><td data-l="Kondisi">${badgeStatus(a.kondisi)}</td><td data-l="" class="r">${dihapus ? '' : `<button class="btn ghost icon-only sm" data-edit="${esc(a.id)}" aria-label="Ubah ${esc(a.nama)}">${ic('edit', 'sm')}</button>`}</td></tr>`).join('')}</tbody></table></div>${pagerHTML(rows.length, hal, per, 'aset')}` : kosongHTML(dihapus ? 'Tidak ada aset yang dihapus.' : 'Aset tidak ditemukan.', 'stall');
      P.segar(); bar();
    };
    const form = (a) => {
      const f = $('#form', isi), baru = !a; a = a || { tanggal: hariIni(), qty: 1, satuan: 'unit', harga: 0, kondisi: 'Baik', kategori: (Store.opsi.kategoriAset || [])[0], nama: '', lokasi: '', catatan: '' };
      const maxId = Math.max(0, ...data.rows.map((x) => +String(x.id).replace(/\D/g, '') || 0));
      $('#next-id', isi).textContent = baru ? 'AST-' + String(maxId + 1).padStart(3, '0') : a.id;
      $('#f-judul', isi).textContent = baru ? 'Aset baru' : 'Ubah aset';
      f.innerHTML = `<div class="col"><div class="form-grid"><div class="field span-2"><label>Nama barang <span class="hint">wajib</span></label><input class="input" id="a-n" placeholder="mis. Panci godokan kuningan 30 cm" value="${esc(a.nama)}"></div><div class="field"><label>Tanggal beli</label><input class="input" type="date" id="a-t" value="${esc(a.tanggal)}" max="${hariIni()}"></div><div class="field"><label>Kategori</label><select class="input" id="a-k">${(Store.opsi.kategoriAset || []).map((k) => `<option ${k === a.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Jumlah</label><input class="input" id="a-q" type="number" min="1" step="1" value="${a.qty}"></div><div class="field"><label>Satuan</label><select class="input" id="a-s">${['unit', 'buah', 'set', 'tabung', 'pcs'].map((k) => `<option ${k === a.satuan ? 'selected' : ''}>${k}</option>`).join('')}</select></div><div class="field span-2"><label>Harga beli per satuan</label><div class="input-rp"><span>Rp</span><input class="input" id="a-h" inputmode="numeric" value="${a.harga ? fmtNum(a.harga) : ''}" placeholder="0"></div></div></div>
        <div class="field"><label>Kondisi</label>${segHTML(['Baik', 'Perlu Ganti', 'Rusak'].map((k) => ({ v: k, l: k })), a.kondisi, 'full')}</div>
        <div class="field"><label>Lokasi</label><input class="input" id="a-l" placeholder="mis. gerobak depan, lemari bawah" value="${esc(a.lokasi)}"></div>
        <div class="field"><label>Catatan</label><input class="input" id="a-c" placeholder="Opsional" value="${esc(a.catatan)}"></div>
        <div class="row wrap">${baru ? '' : `<button class="btn" data-act="batal-edit">Batal</button><button class="btn" data-act="foto">${ic('image', 'sm')}Foto</button>`}<button class="btn primary grow" data-act="simpan-aset">${ic('check', 'sm')}${baru ? 'Simpan aset' : 'Simpan perubahan'}</button></div></div>`;
      let kondisi = a.kondisi; pasangSeg($('.seg', f), (v) => { kondisi = v; });
      $('#a-h', f).addEventListener('input', (e) => angkaRp(e.target, 'Harga beli'));
      $('#a-q', f).addEventListener('input', (e) => { if (/-/.test(e.target.value)) { e.target.value = '1'; toast('Jumlah minimal 1.', 'warning'); } });
      f.dataset.id = baru ? '' : a.id; f._kondisi = () => kondisi;
    };
    el.onclick = async (e) => {
      if (e.target.closest('td.ck, th.ck')) return;
      const k = e.target.closest('[data-kat]'); if (k) { kat = k.dataset.kat; hal = 1; $$('#kat .chip', isi).forEach((x) => x.classList.toggle('on', x === k)); tabel(); return; }
      const pg = e.target.closest('[data-pg]'); if (pg) { hal = +pg.dataset.pg; tabel(); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) { form(data.rows.find((x) => x.id === ed.dataset.edit)); $('#form', isi).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const b = e.target.closest('[data-bulk]');
      if (b && b.dataset.bulk === 'batal-pilih') return P.kosongkan();
      if (b && b.dataset.bulk === 'hapus') { const al = await mintaTeks({ title: 'Hapus ' + P.ids().length + ' aset dari daftar', label: 'Alasan (dijual, hilang, rusak total…)', min: 3, ok: 'Hapus', catatan: 'Aset tidak dihitung lagi di nilai inventaris, tetapi tetap tersimpan dan bisa dipulihkan.' }); if (al && (await tulis('aset.hapus', { ids: P.ids(), alasan: al }, { btn: b, teks: 'Menghapus aset…' })).success) { P.kosongkan(); dataHapus = null; muat(true); } return; }
      if (b && b.dataset.bulk === 'pulih') { if ((await tulis('aset.hapus', { ids: P.ids(), pulihkan: true }, { btn: b, teks: 'Memulihkan aset…' })).success) { P.kosongkan(); dataHapus = null; dihapus = false; muat(true); } return; }
      const a = e.target.closest('[data-act]'); if (!a) return; const f = $('#form', isi);
      if (a.dataset.act === 'baru') { form(null); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#a-n', f).focus(), 300); }
      if (a.dataset.act === 'batal-edit') form(null);
      if (a.dataset.act === 'foto') unggahFotoUI('aset', f.dataset.id, () => muat(true));
      if (a.dataset.act === 'simpan-aset') {
        const nama = $('#a-n', f).value.trim(); if (!nama) { $('#a-n', f).classList.add('err'); return toast('Nama barang wajib diisi.', 'warning'); }
        const qty = Math.round(num($('#a-q', f).value)), harga = parseRp($('#a-h', f).value);
        if (!(qty >= 1)) { $('#a-q', f).classList.add('err'); return toast('Jumlah aset minimal 1.', 'warning'); }
        if (harga < 0) return toast('Harga beli tidak boleh minus.', 'warning');
        const r = await tulis('aset.simpan', { id: f.dataset.id, nama, tanggal: $('#a-t', f).value, kategori: $('#a-k', f).value, qty, satuan: $('#a-s', f).value, harga: Math.max(0, harga), kondisi: f._kondisi(), lokasi: $('#a-l', f).value, catatan: $('#a-c', f).value }, { btn: a, teks: 'Menyimpan aset…' });
        if (r.success) muat(true);
      }
      if (a.dataset.act === 'unduh' && data) { const ring = [['Total nilai aset', rp(data.ringkas.total)], ['Baik / Perlu ganti / Rusak', (data.ringkas.Baik || 0) + ' / ' + (data.ringkas['Perlu Ganti'] || 0) + ' / ' + (data.ringkas.Rusak || 0)]]; unduhPDF('Aset-Inventaris-' + hariIni(), 'Aset & inventaris lapak', LAPORAN.aset.kol, data.rows, ring, { landscape: true }); }
    };
    const muat = (force) => pakai('aset.list', {}, gambar, { maxAge: force ? 0 : 60000, force, onError: (m) => { isi.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    isi.innerHTML = '<div class="stack"><div class="grid g-4 kpis">' + '<div class="skel h-120"></div>'.repeat(4) + '</div><div class="skel h-200"></div></div>';
    muat(false);
  }
};
