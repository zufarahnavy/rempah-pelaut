/* =====================================================================
   Halaman gudang: Belanja Bahan, Stok & Opname, Aset & Inventaris
   ===================================================================== */
'use strict';
function unggahFotoUI(jenis, id, onUrl) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    try {
      const dataUrl = await kompresFoto(f);
      const r = await tulis('foto.unggah', { jenis, id, dataUrl }, { teks: 'Mengunggah foto…', sub: 'Menyimpan ke Google Drive' });
      if (r.success) onUrl(r.data.url, dataUrl);
    } catch (e) { toast(e.message, 'error'); }
  };
  inp.click();
}

/* ============================== BELANJA BAHAN ============================== */
Pages.belanja = {
  render(el, q) {
    let baris = [], stok = [], nota = [];
    const tambahBaris = (x = {}) => { baris.push({ nama: x.nama || '', qty: x.qty || '', satuan: x.satuan || '', harga: x.harga || '' }); };
    const total = () => baris.reduce((a, b) => a + Math.round(num(b.qty) * num(b.harga)), 0);
    el.innerHTML = `<div class="stack">
      <div class="card pad-l"><div class="grid g-main-l" style="align-items:center"><div><div class="row wrap gap-8"><span class="badge gold plain">Akses Khusus Pemilik</span><span class="badge success plain">Sync: Trx_Belanja_Bahan & Master_Stok</span></div><h1 class="mt-12">Pengadaan & Belanja Bahan Baku</h1><p class="muted mt-8">Pencatatan nota supplier & pasar. Belanja <b>memotong saldo kas lapak</b> pada tanggal belanja dan <b>menambah stok</b> bahan secara otomatis.</p></div><div class="grid g-3" id="mini"></div></div></div>
      <div id="peringatan"></div>
      <div class="grid g-main-l">
        <div class="card" id="form"></div>
        <div class="stack"><div class="card"><div class="card-head"><div><div class="eyebrow">Log Pembelian Terbaru</div><h3 class="mt-4">Riwayat Nota Belanja</h3></div><a class="link-btn small" href="#/laporan">Lihat Semua ${ic('chev-r', 'sm')}</a></div><div id="riwayat"></div></div>
          <div class="card"><div class="card-head"><div><div class="eyebrow">Komposisi Pengeluaran Bahan</div><h3 class="mt-4">Distribusi Komoditas (30 hari)</h3></div><span class="icon-box s">${ic('pie', 'sm')}</span></div><div class="donut-wrap" id="dist"></div></div></div>
      </div></div>`;
    const formEl = $('#form', el);
    const gambarForm = () => {
      const opsiSatuan = Store.opsi.satuan || ['kg', 'pcs'];
      formEl.innerHTML = `<div class="card-head"><div><div class="eyebrow">Entri Pengeluaran Kas Lapak</div><h2 class="mt-4">Input Nota Belanja Pasar / Supplier</h2></div><div class="right"><span class="badge gold plain">#BLJ-${hariIni().replace(/-/g, '')}-…</span><div class="xs muted mt-4">ID nota otomatis</div></div></div>
        <div class="inset"><div class="form-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="field"><label>Tanggal Belanja</label><input type="date" class="input" id="tg" value="${q.t || hariIni()}" max="${hariIni()}"></div><div class="field"><label>Sumber / Tempat Belanja</label><input class="input" id="sumber" list="dl-sumber" placeholder="Pasar Subuh, petani…"><datalist id="dl-sumber">${[...new Set(nota.map((n) => n.sumber).filter(Boolean))].map((s) => `<option value="${esc(s)}">`).join('')}</datalist></div><div class="field"><label>Metode Pembayaran</label><select class="input" id="metode"><option>Kas Lapak</option><option>Transfer</option><option>Tunai Owner</option></select></div></div></div>
        <div class="row between mt-20 mb-8"><b>Rincian Bahan Rempah & Kemasan</b><span class="xs muted">Item otomatis masuk stok gudang</span></div>
        <datalist id="dl-bahan">${stok.map((s) => `<option value="${esc(s.nama)}">${esc(s.satuan)} • stok ${fmtDec(s.stok)}</option>`).join('')}</datalist>
        <div id="rows" class="col gap-8">${baris.map((b, i) => `<div class="inset row wrap gap-8" style="padding:10px" data-row="${i}"><input class="input grow" style="min-width:160px" list="dl-bahan" data-f="nama" placeholder="Nama bahan" value="${esc(b.nama)}"><input class="input" style="width:80px" inputmode="decimal" data-f="qty" placeholder="Qty" value="${esc(b.qty)}"><select class="input" style="width:100px" data-f="satuan">${opsiSatuan.map((s) => `<option ${s === b.satuan ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><div class="input-rp" style="width:130px"><span>Rp</span><input class="input" inputmode="numeric" data-f="harga" placeholder="Harga" value="${b.harga ? fmtNum(b.harga) : ''}"></div><b class="tnum" style="min-width:96px;text-align:right" data-tot="${i}">${rp(num(b.qty) * num(b.harga))}</b><button class="btn ghost icon-only sm" data-del="${i}" style="color:var(--c-danger)" aria-label="Hapus baris">${ic('trash', 'sm')}</button></div>`).join('')}</div>
        <button class="btn mt-12" data-act="tambah">${ic('plus', 'sm')}Tambah Baris Bahan Lain</button>
        <div class="inset mt-16"><label class="check"><input type="checkbox" id="tambahStok" checked><div><b>Otomatis tambah kuantitas ke Master Stok</b><div class="xs muted">Kuantitas tiap bahan langsung ditambahkan ke inventaris aktif lapak</div></div></label><label class="check"><input type="checkbox" checked disabled><div><b>Potong langsung dari Saldo Kas Lapak</b><div class="xs muted">Tercatat di mutasi Rekap Kas tanggal belanja (<span id="tot2">${rp(total())}</span>)</div></div></label></div>
        <div class="big-total mt-16"><div><div class="eyebrow" style="color:var(--c-muted)">Total Nilai Belanja Nota</div><div class="v" id="tot">${rp(total())}</div></div><button class="btn dark lg" data-act="simpan">${ic('check-c')}Simpan & Mutasi Stok</button></div>`;
    };
    const hitung = () => { baris.forEach((b, i) => { const t = $(`[data-tot="${i}"]`, formEl); if (t) t.textContent = rp(num(b.qty) * num(b.harga)); }); $('#tot', formEl).textContent = rp(total()); $('#tot2', formEl).textContent = rp(total()); };
    formEl.addEventListener('input', (e) => {
      const r = e.target.closest('[data-row]'); if (!r) return; const i = +r.dataset.row, f = e.target.dataset.f;
      if (f === 'harga') { const v = parseRp(e.target.value); baris[i].harga = v; e.target.value = v ? fmtNum(v) : ''; }
      else if (f === 'qty') baris[i].qty = e.target.value.replace(',', '.');
      else if (f === 'nama') { baris[i].nama = e.target.value; const s = stok.find((x) => x.nama.toLowerCase() === e.target.value.toLowerCase()); if (s) { baris[i].satuan = s.satuan; $('[data-f=satuan]', r).value = s.satuan; if (!baris[i].harga && s.harga) { baris[i].harga = s.harga; $('[data-f=harga]', r).value = fmtNum(s.harga); } } }
      hitung();
    });
    formEl.addEventListener('change', (e) => { const r = e.target.closest('[data-row]'); if (r && e.target.dataset.f === 'satuan') baris[+r.dataset.row].satuan = e.target.value; });
    const gambarSisi = () => {
      const t = hariIni(), senin = addDays(t, -((dowOf(t) + 6) % 7)), bln = awalBulan(t);
      const hi = nota.filter((n) => n.tanggal === t), mg = nota.filter((n) => n.tanggal >= senin), bl = nota.filter((n) => n.tanggal >= bln);
      $('#mini', el).innerHTML = [['Belanja Hari Ini', hi, 'calendar', hi.length + ' nota masuk'], ['Belanja Minggu Ini', mg, 'calendar', mg.length + ' faktur pembelian'], ['Total Bulan ' + BULAN[+t.slice(5, 7) - 1], bl, 'wallet', bl.length + ' nota']].map((x, i) => `<div class="inset"><div class="xs muted row gap-4">${ic(x[2], 'sm')}${x[0]}</div><div class="strong mt-4 tnum" style="font-size:20px;${i === 2 ? 'color:var(--c-primary-h)' : ''}">${rp(x[1].reduce((a, n) => a + n.total, 0))}</div><div class="xs ${i === 0 ? 'ok' : 'muted'}">${x[3]}</div></div>`).join('');
      const kritis = stok.filter((s) => s.status !== 'Aman').sort((a, b) => (a.stok / (a.minimal || 1)) - (b.stok / (b.minimal || 1))).slice(0, 3);
      $('#peringatan', el).innerHTML = kritis.length ? `<div class="notice"><span class="icon-box warning">${ic('alert')}</span><div class="grow"><b>Peringatan Menipis: Stok Bahan Kritis</b><div class="small">${kritis.map((s) => `<b class="bad">${esc(s.nama)}</b> sisa ${fmtDec(s.stok)} ${esc(s.satuan)}`).join(' • ')}. Perlu pengadaan sebelum jam buka.</div></div><div class="row wrap gap-8">${kritis.map((s) => `<button class="btn sm" data-isi="${esc(s.id)}">${ic('plus', 'sm')}${esc(s.nama.split(' ').slice(0, 2).join(' '))}</button>`).join('')}</div></div>` : '';
      $('#riwayat', el).innerHTML = nota.length ? nota.slice(0, 8).map((n) => `<div class="li li-box" style="flex-direction:column;align-items:stretch;gap:4px"><div class="row between"><b class="small" style="color:var(--c-primary-h)">#${esc(n.id)}</b><span class="badge success plain">Stok Masuk</span></div><div class="row between small"><span class="muted">${tgl(n.tanggal, 'd MMM yyyy')} • ${esc(n.sumber || '-')}</span><b class="tnum">${rp(n.total)}</b></div><div class="xs muted truncate">${esc(n.items.map((i) => i.nama + ' ' + fmtDec(i.qty) + ' ' + i.satuan).join(', '))}</div><div class="row gap-8 mt-4">${Store.punya('dokumen') ? `<button class="btn xs" data-nota="${esc(n.id)}">${ic('qr', 'sm')}Terbitkan Nota</button>` : ''}<button class="btn xs danger" data-hapus="${esc(n.id)}">${ic('trash', 'sm')}Hapus</button></div></div>`).join('') : kosongHTML('Belum ada nota 30 hari terakhir.', 'bag');
      const agg = {}; nota.forEach((n) => n.items.forEach((i) => { agg[i.nama] = (agg[i.nama] || 0) + i.total; }));
      const top = Object.keys(agg).map((k) => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
      const items = top.slice(0, 4).concat(top.length > 4 ? [{ name: 'Lainnya', value: top.slice(4).reduce((a, x) => a + x.value, 0) }] : []).map((x, i) => Object.assign(x, { color: SERI[i] }));
      const dist = $('#dist', el); dist.innerHTML = '<div id="d-dist"></div>' + legendaDonat(items, rpK);
      if (items.length) grafikDonat($('#d-dist', dist), { items, center: { v: rpK(top.reduce((a, x) => a + x.value, 0)).replace('Rp ', ''), l: '30 hari' }, size: 150, fmt: rp });
    };
    el.addEventListener('click', async (e) => {
      const isi = e.target.closest('[data-isi]'); if (isi) { const s = stok.find((x) => x.id === isi.dataset.isi); if (baris.length === 1 && !baris[0].nama) baris = []; tambahBaris({ nama: s.nama, satuan: s.satuan, harga: s.harga, qty: Math.max(1, Math.ceil(s.minimal * 2 - s.stok)) }); gambarForm(); formEl.scrollIntoView({ behavior: 'smooth' }); return; }
      const del = e.target.closest('[data-del]'); if (del) { baris.splice(+del.dataset.del, 1); if (!baris.length) tambahBaris(); gambarForm(); return; }
      const hp = e.target.closest('[data-hapus]'); if (hp) { if (await konfirmasi({ title: 'Hapus nota ' + hp.dataset.hapus + '?', text: 'Nota dihapus dan stok yang ditambahkan nota ini dikembalikan (dikurangi).', ok: 'Hapus Nota', danger: true })) { const r = await tulis('belanja.hapus', { id: hp.dataset.hapus }, { teks: 'Menghapus nota…' }); if (r.success) muat(true); } return; }
      const nt = e.target.closest('[data-nota]'); if (nt) { buatDokumenDari('NOTA_BELANJA', nt.dataset.nota); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'tambah') { tambahBaris(); gambarForm(); $$('[data-f=nama]', formEl).pop().focus(); }
      if (a.dataset.act === 'simpan') {
        const items = baris.filter((b) => b.nama.trim()).map((b) => { const s = stok.find((x) => x.nama.toLowerCase() === b.nama.trim().toLowerCase()); return { idBahan: s ? s.id : '', nama: b.nama.trim(), qty: num(b.qty), satuan: b.satuan, harga: num(b.harga) }; });
        if (!items.length) return toast('Isi minimal satu bahan.', 'warning');
        if (items.some((i) => !i.qty || !i.harga)) return toast('Qty dan harga setiap baris wajib diisi.', 'warning');
        const baru = items.filter((i) => !i.idBahan).map((i) => i.nama);
        if (baru.length && !(await konfirmasi({ title: 'Bahan baru', text: 'Bahan berikut belum ada di Master Stok dan akan dibuat otomatis: <b>' + esc(baru.join(', ')) + '</b>.', ok: 'Lanjutkan' }))) return;
        const r = await tulis('belanja.simpan', { tanggal: $('#tg', formEl).value, sumber: $('#sumber', formEl).value.trim(), metode: $('#metode', formEl).value, items, tambahStok: $('#tambahStok', formEl).checked }, { teks: 'Menyimpan nota & mutasi stok…', sub: 'Memotong saldo kas & menambah stok' });
        if (r.success) { baris = []; tambahBaris(); muat(true); App.segarkanBoot(); }
      }
    });
    const muat = (force) => {
      pakai('stok.list', {}, (d) => { stok = d.rows; gambarSisi(); if (!formEl.innerHTML || force) gambarForm(); else { const dl = $('#dl-bahan', formEl); if (dl) dl.innerHTML = stok.map((s) => `<option value="${esc(s.nama)}">`).join(''); } }, { maxAge: force ? 0 : 30000, force });
      pakai('belanja.list', Param.bulan30(), (d) => { nota = d.rows; gambarSisi(); }, { maxAge: force ? 0 : 30000, force });
    };
    tambahBaris(); gambarForm(); muat(false);
  }
};
async function buatDokumenDari(kode, ref) {
  Loader.show('Menyiapkan dokumen…', 'Mengisi data otomatis');
  try {
    const tl = await API.call('de.template.list', {}); const t = tl.success && tl.data.rows.find((x) => x.kode === kode);
    if (!t) { Loader.hide(); return toast('Template ' + kode + ' tidak tersedia.', 'error'); }
    const p = await API.call('de.dokumen.prefill', { templateId: t.id, ref }); if (!p.success) { Loader.hide(); return toast(p.message, 'error'); }
    const s = await API.call('de.dokumen.simpan', { templateId: t.id, data: p.data.data, judul: p.data.judul, ref }); Loader.hide();
    if (!s.success) return toast(s.message, 'error');
    Cache.basi(); toast('Draf dokumen dibuat. Periksa lalu ajukan tanda tangan.', 'success'); location.hash = '#/dokumen?id=' + s.data.id;
  } catch (e) { Loader.hide(); toast(e.message, 'error'); }
}

/* ============================== STOK & OPNAME ============================== */
Pages.stok = {
  render(el, q) {
    let kat = 'Semua', cari = q.q ? q.q.toLowerCase() : '', data = null, pilih = '';
    el.innerHTML = `<div class="card pad-l mb-16"><div class="row wrap between"><div><div class="row wrap gap-8"><span class="badge gold plain">Hak Akses Khusus Pemilik</span><span class="badge success plain">Live Sync: Master_Stok • Log_Stok_Opname</span></div><h1 class="mt-12">Master Stok & Rekonsiliasi Opname</h1><p class="muted mt-8" style="max-width:640px">Kendali persediaan rempah basah, bahan pelengkap, dan kemasan. Stok bertambah lewat belanja dan dikoreksi lewat opname fisik.</p></div><div class="col gap-8"><button class="btn" data-act="unduh">${ic('download')}Unduh Log Opname (XLS/PDF)</button><button class="btn primary" data-act="massal">${ic('scale')}Catat Stok Opname Fisik</button></div></div></div><div id="isi"></div>`;
    const isi = $('#isi', el);
    const gambar = (d) => {
      data = d; const rows = d.rows, c = { Aman: 0, Menipis: 0, Kritis: 0, Habis: 0 }; rows.forEach((s) => c[s.status]++);
      const kats = ['Semua'].concat(Store.opsi.kategoriStok || [...new Set(rows.map((s) => s.kategori))]);
      const nilaiKat = {}; rows.forEach((s) => { nilaiKat[s.kategori] = (nilaiKat[s.kategori] || 0) + s.nilai; });
      const totalNilai = rows.reduce((a, s) => a + s.nilai, 0);
      isi.innerHTML = `<div class="stack anim">
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Total Bahan Terdaftar', ikon: 'box', val: rows.length + ' <small>Item</small>', foot: 'Katalog lapak • ' + (kats.length - 1) + ' kategori' })}
          ${kpiHTML({ label: 'Stok Dalam Batas Aman', ikon: 'check-c', cls: 'success', val: `<span class="ok">${c.Aman}</span> <small>Bahan</small>`, foot: `<span class="badge success plain">${Math.round(c.Aman / Math.max(1, rows.length) * 100)}% rasio</span> Stabil` })}
          ${kpiHTML({ label: 'Stok Menipis (≤ minimal)', ikon: 'alert', cls: 'warning', val: `<span class="warn">${c.Menipis}</span> <small>Bahan</small>`, foot: esc(rows.filter((s) => s.status === 'Menipis').map((s) => s.nama.split(' ')[0]).slice(0, 3).join(', ')) || 'Tidak ada' })}
          ${kpiHTML({ label: 'Kritis / Habis', ikon: 'alert', cls: 'danger', val: `<span class="bad">${c.Kritis + c.Habis}</span> <small>Bahan</small>`, foot: `<span class="badge danger plain">Beli hari ini</span>` })}
        </div>
        <div class="grid g-main">
          <div class="card">
            <div class="card-head"><div><h2>Inventaris Bahan & Logistik Lapak</h2><div class="sub">Stok tercatat sistem, tersinkron dengan belanja & opname</div></div><div class="row gap-8"><div class="search" style="min-width:200px">${ic('search')}<input class="input" id="cari" placeholder="Cari bahan…" value="${esc(cari)}"></div><button class="btn icon-only" data-act="baru" aria-label="Tambah bahan">${ic('plus')}</button></div></div>
            <div class="chips scroll mb-12" id="kat">${kats.map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)} <span class="n">(${k === 'Semua' ? rows.length : rows.filter((s) => s.kategori === k).length})</span></button>`).join('')}</div>
            <div id="tbl"></div>
          </div>
          <div class="stack">
            <div class="card" id="opname"></div>
            <div class="card"><div class="card-head"><div><h3>Riwayat Opname Terakhir</h3><div class="sub">Tab Google Sheets: Log_Stok_Opname</div></div><span class="badge info plain">Audit</span></div>${d.log.slice(0, 5).map((l) => `<div class="li li-box"><div class="grow"><div class="t">${esc(l.nama)}</div><div class="xs muted">${tgl(l.waktu || l.tanggal, 'd MMM yyyy, HH:mm')} • Sistem ${fmtDec(l.sistem)} → Fisik ${fmtDec(l.fisik)}</div><div class="xs muted">${esc(l.catatan || '-')} • ${esc(l.oleh)}</div></div><span class="badge ${l.selisih < 0 ? 'danger' : l.selisih > 0 ? 'info' : 'success'} plain">${l.selisih > 0 ? '+' : ''}${fmtDec(l.selisih)} ${esc(l.satuan)}</span></div>`).join('') || kosongHTML('Belum ada opname', 'scale')}${Store.punya('dokumen') && d.log.length ? `<button class="btn block mt-12" data-ba="${d.log[0].tanggal}">${ic('qr', 'sm')}Terbitkan BA Opname ${tgl(d.log[0].tanggal, 'd MMM')}</button>` : ''}</div>
          </div>
        </div>
        <div class="card"><div class="row wrap between"><div><h3>Distribusi Nilai Stok</h3><div class="sub muted small">Estimasi modal bahan tersimpan (stok × harga beli terakhir)</div></div><div class="right"><div class="xs muted">Estimasi Modal Stok</div><b style="font-family:var(--font-head);font-size:22px">${rp(totalNilai)}</b></div></div><div class="mt-12">${segbarHTML(Object.keys(nilaiKat).map((k, i) => ({ name: k, value: nilaiKat[k], color: SERI[i] })), rpK)}</div></div>
      </div>`;
      tabel(); formOpname();
      $('#cari', isi).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); tabel(); }, 180));
    };
    const tabel = () => {
      const rows = data.rows.filter((s) => (kat === 'Semua' || s.kategori === kat) && (!cari || (s.nama + ' ' + s.id + ' ' + s.kategori).toLowerCase().includes(cari)));
      $('#tbl', isi).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Bahan & ID</th><th>Kategori</th><th class="r">Stok Sistem</th><th class="r">Batas Min.</th><th class="c">Status</th><th class="r">Aksi</th></tr></thead><tbody class="stagger">${rows.map((s, i) => `<tr style="--i:${i}"><td data-l="Bahan" class="main-cell"><div class="row gap-8"><img class="thumb" src="${esc(fotoUrl(s.foto, 'assets/img/bahan/default.svg'))}" alt="" loading="lazy" onerror="this.src='assets/img/bahan/default.svg'"><div><b>${esc(s.nama)}</b><div class="id">${esc(s.id)} • ${rp(s.harga)}/${esc(s.satuan)}</div></div></div></td><td data-l="Kategori"><span class="badge plain">${esc(s.kategori)}</span></td><td data-l="Stok" class="r"><b class="${s.status === 'Aman' ? 'ok' : s.status === 'Menipis' ? 'warn' : 'bad'}">${fmtDec(s.stok)}</b> <span class="xs muted">${esc(s.satuan)}</span></td><td data-l="Minimal" class="r">${fmtDec(s.minimal)} <span class="xs muted">${esc(s.satuan)}</span></td><td data-l="Status" class="c">${badgeStatus(s.status)}</td><td data-l="Aksi" class="r"><button class="btn ghost icon-only sm" data-op="${esc(s.id)}" aria-label="Opname">${ic('scale', 'sm')}</button><button class="btn ghost icon-only sm" data-edit="${esc(s.id)}" aria-label="Ubah">${ic('edit', 'sm')}</button></td></tr>`).join('')}</tbody></table></div>` : kosongHTML('Bahan tidak ditemukan.', 'box');
    };
    const formOpname = () => {
      const s = data.rows.find((x) => x.id === pilih) || data.rows[0]; pilih = s ? s.id : '';
      $('#opname', isi).innerHTML = `<div class="card-head"><div class="row"><span class="icon-box solid">${ic('scale')}</span><div><h3>Rekonsiliasi Timbangan Fisik</h3><div class="sub">Audit opname mandiri • validasi susut & ampas</div></div></div></div>
        <div class="col"><div class="field"><label>Pilih Bahan / Rempah</label><select class="input" id="op-b">${data.rows.map((x) => `<option value="${esc(x.id)}" ${x.id === pilih ? 'selected' : ''}>${esc(x.nama)} (${esc(x.id)})</option>`).join('')}</select></div>
        <div class="grid g-2 keep" style="gap:10px"><div class="inset"><div class="xs muted">STOK SISTEM</div><div class="strong" style="font-size:20px">${fmtDec(s.stok)} <small class="muted">${esc(s.satuan)}</small></div><div class="xs muted">Tercatat di Google Sheets</div></div><div class="inset" style="background:var(--c-card)"><div class="xs muted">TIMBANGAN FISIK</div><input class="input mt-4" id="op-f" inputmode="decimal" placeholder="${fmtDec(s.stok)}" style="font-size:18px;font-weight:700"><div class="xs muted mt-4">Hasil ukur riil lapak (${esc(s.satuan)})</div></div></div>
        <div class="inset" id="op-sel" style="background:var(--c-warning-t)"><div class="row between"><div><div class="xs muted">KALKULASI SELISIH OPNAME</div><div class="strong" style="font-size:24px" id="op-v">—</div></div><span class="badge plain" id="op-p"></span></div></div>
        <div class="field"><label>Alasan / Catatan Rekonsiliasi</label><input class="input" id="op-c" placeholder="Penyusutan alami, ampas, tumpah…"></div>
        <div class="row between small"><span class="muted">Auditor Pelaksana:</span><span class="row gap-4">${ic('shield', 'sm')}<b>${esc(Store.me.nama)}</b></span></div>
        <button class="btn dark lg block" data-act="op-simpan">${ic('check-c')}Simpan & Bukukan ke Log_Stok_Opname</button></div>`;
      const hit = () => { const f = $('#op-f', isi).value.replace(',', '.'); if (f === '') { $('#op-v', isi).textContent = '—'; $('#op-p', isi).textContent = ''; return; } const sel = Math.round((num(f) - s.stok) * 1000) / 1000; $('#op-v', isi).textContent = (sel > 0 ? '+' : '') + fmtDec(sel) + ' ' + s.satuan; $('#op-v', isi).className = 'strong ' + (sel < 0 ? 'bad' : sel > 0 ? 'ok' : ''); $('#op-p', isi).textContent = s.stok ? (sel < 0 ? 'Penyusutan ' : 'Kelebihan ') + '(' + fmtNum(sel / s.stok * 100, 1) + '%)' : ''; $('#op-sel', isi).style.background = sel < 0 ? 'var(--c-danger-t)' : sel > 0 ? 'var(--c-info-t)' : 'var(--c-success-t)'; };
      $('#op-f', isi).addEventListener('input', hit);
      $('#op-b', isi).onchange = (e) => { pilih = e.target.value; formOpname(); };
    };
    const editBahan = (s) => {
      s = s || { nama: '', kategori: (Store.opsi.kategoriStok || [])[0], satuan: 'kg', minimal: 0, stok: 0, harga: 0, foto: '' };
      const m = Modal.open({ title: s.id ? 'Ubah Bahan ' + esc(s.id) : 'Tambah Bahan Baru', size: 'lg', body: `<div class="row top gap-20 wrap"><div class="photo-up" id="foto"><img src="${esc(fotoUrl(s.foto, 'assets/img/bahan/default.svg'))}" alt=""><span class="ov">${ic('upload', 'sm')} Ganti foto</span></div><div class="grow form-grid"><div class="field span-2"><label>Nama Bahan</label><input class="input" id="b-n" value="${esc(s.nama)}"></div><div class="field"><label>Kategori</label><select class="input" id="b-k">${(Store.opsi.kategoriStok || []).map((k) => `<option ${k === s.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Satuan</label><select class="input" id="b-s">${(Store.opsi.satuan || []).map((k) => `<option ${k === s.satuan ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Minimal Stok</label><input class="input" id="b-m" inputmode="decimal" value="${s.minimal}"></div><div class="field"><label>Harga Beli Terakhir</label><div class="input-rp"><span>Rp</span><input class="input" id="b-h" inputmode="numeric" value="${fmtNum(s.harga)}"></div></div>${s.id ? '' : '<div class="field"><label>Stok Awal</label><input class="input" id="b-st" inputmode="decimal" value="0"></div>'}</div></div>${s.id ? '<p class="xs muted mt-12">Jumlah stok diubah melalui Belanja (bertambah) atau Stok Opname (koreksi fisik).</p>' : ''}`, foot: `${s.id ? `<button class="btn danger" data-h>${ic('trash', 'sm')}Hapus</button>` : ''}<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check')}Simpan</button>` });
      let foto = s.foto;
      $('#foto', m.el).onclick = () => { if (!s.id) return toast('Simpan bahan dulu, lalu unggah fotonya.', 'info'); unggahFotoUI('stok', s.id, (url, prev) => { foto = url; $('#foto img', m.el).src = prev; muat(true); }); };
      $('[data-b]', m.el).onclick = () => m.close();
      const h = $('[data-h]', m.el); if (h) h.onclick = async () => { if (await konfirmasi({ title: 'Hapus bahan?', text: 'Riwayat belanja & opname tetap tersimpan.', danger: true, ok: 'Hapus' })) { if ((await tulis('stok.hapus', { id: s.id }, { teks: 'Menghapus bahan…' })).success) { m.close(); muat(true); } } };
      $('[data-ok]', m.el).onclick = async () => { const r = await tulis('stok.simpan', { id: s.id, nama: $('#b-n', m.el).value, kategori: $('#b-k', m.el).value, satuan: $('#b-s', m.el).value, minimal: num($('#b-m', m.el).value.replace(',', '.')), harga: parseRp($('#b-h', m.el).value), stok: s.id ? undefined : num(($('#b-st', m.el) || {}).value), foto }, { teks: 'Menyimpan bahan…' }); if (r.success) { m.close(); muat(true); } };
    };
    const massal = () => {
      const rows = data.rows;
      const m = Modal.open({ title: 'Stok Opname Fisik (banyak bahan)', sub: 'Isi hanya bahan yang ditimbang/dihitung. Kosongkan yang tidak diperiksa.', size: 'xl', body: `<div class="table-wrap" style="max-height:60vh"><table class="tbl cards"><thead><tr><th>Bahan</th><th class="r">Sistem</th><th>Fisik</th><th class="r">Selisih</th><th>Catatan</th></tr></thead><tbody>${rows.map((s) => `<tr data-id="${esc(s.id)}"><td data-l="Bahan" class="main-cell"><b>${esc(s.nama)}</b> <span class="xs muted">${esc(s.satuan)}</span></td><td data-l="Sistem" class="r">${fmtDec(s.stok)}</td><td data-l="Fisik"><input class="input" style="max-width:110px;min-height:38px" inputmode="decimal" data-fisik></td><td data-l="Selisih" class="r" data-sel>—</td><td data-l="Catatan"><input class="input" style="min-height:38px" data-cat placeholder="opsional"></td></tr>`).join('')}</tbody></table></div>`, foot: `<span class="grow muted small" id="m-n">0 bahan diisi</span><button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${ic('check')}Bukukan Opname</button>` });
      m.el.addEventListener('input', (e) => { const tr = e.target.closest('tr'); if (!tr || !e.target.matches('[data-fisik]')) return; const s = rows.find((x) => x.id === tr.dataset.id), v = e.target.value.replace(',', '.'); const sel = v === '' ? null : Math.round((num(v) - s.stok) * 1000) / 1000; const td = $('[data-sel]', tr); td.innerHTML = sel === null ? '—' : `<b class="${sel < 0 ? 'bad' : sel > 0 ? 'ok' : ''}">${sel > 0 ? '+' : ''}${fmtDec(sel)}</b>`; $('#m-n', m.el).textContent = $$('[data-fisik]', m.el).filter((i) => i.value !== '').length + ' bahan diisi'; });
      $('[data-b]', m.el).onclick = () => m.close();
      $('[data-ok]', m.el).onclick = async () => { const items = $$('tbody tr', m.el).map((tr) => ({ idBahan: tr.dataset.id, fisik: $('[data-fisik]', tr).value.replace(',', '.'), catatan: $('[data-cat]', tr).value })).filter((x) => x.fisik !== '').map((x) => Object.assign(x, { fisik: num(x.fisik) })); if (!items.length) return toast('Isi minimal satu stok fisik.', 'warning'); const r = await tulis('opname.simpan', { items }, { teks: 'Membukukan stok opname…', sub: items.length + ' bahan' }); if (r.success) { m.close(); muat(true); App.segarkanBoot(); } };
    };
    el.onclick = async (e) => {
      const k = e.target.closest('[data-kat]'); if (k) { kat = k.dataset.kat; $$('#kat .chip', isi).forEach((x) => x.classList.toggle('on', x === k)); tabel(); return; }
      const op = e.target.closest('[data-op]'); if (op) { pilih = op.dataset.op; formOpname(); $('#opname', isi).scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#op-f', isi).focus(), 400); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) return editBahan(data.rows.find((x) => x.id === ed.dataset.edit));
      const ba = e.target.closest('[data-ba]'); if (ba) return buatDokumenDari('BA_OPNAME', ba.dataset.ba);
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'baru') editBahan(null);
      if (a.dataset.act === 'massal') { if (!data) return; massal(); }
      if (a.dataset.act === 'unduh' && data) { const kol = LAPORAN.opname.kol; const m = Modal.open({ title: 'Unduh Log Opname', size: 'sm', body: `<p class="muted">${data.log.length} catatan opname.</p>`, foot: `<button class="btn" data-x1>${ic('download', 'sm')}Excel</button><button class="btn primary" data-x2>${ic('printer', 'sm')}PDF</button>` }); $('[data-x1]', m.el).onclick = () => { m.close(); unduhExcel('Log-Stok-Opname-' + hariIni(), 'Log Stok Opname', kol, data.log); }; $('[data-x2]', m.el).onclick = () => { m.close(); unduhPDF('Log-Stok-Opname-' + hariIni(), 'Log Stok Opname', kol, data.log); }; }
      if (a.dataset.act === 'op-simpan') {
        const f = $('#op-f', isi).value.replace(',', '.'); if (f === '' || num(f) < 0) { $('#op-f', isi).classList.add('err'); return toast('Isi hasil timbangan fisik (angka ≥ 0).', 'warning'); }
        const r = await tulis('opname.simpan', { items: [{ idBahan: pilih, fisik: num(f), catatan: $('#op-c', isi).value }] }, { teks: 'Membukukan opname…' });
        if (r.success) { muat(true); App.segarkanBoot(); }
      }
    };
    const muat = (force) => pakai('stok.list', {}, gambar, { maxAge: force ? 0 : 30000, force, onError: (m) => { isi.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    isi.innerHTML = '<div class="stack"><div class="grid g-4 kpis">' + '<div class="skel h-120"></div>'.repeat(4) + '</div><div class="skel h-200"></div></div>';
    muat(false);
    if (q.opname) setTimeout(() => { if (data) massal(); }, 700);
  }
};

/* ============================== ASET & INVENTARIS ============================== */
Pages.aset = {
  render(el, q) {
    let kond = 'Semua', kat = 'Semua', cari = q.q ? q.q.toLowerCase() : '', hal = 1, data = null;
    el.innerHTML = `${kepala({ eyebrow: 'Hak Akses Khusus Pemilik • Live Sync Aset_Inventaris', judul: 'Aset & Inventaris Lapak', desc: 'Manajemen dan audit fisik perlengkapan gerobak, peralatan memasak rempah, dan sarana operasional lapak.', acts: `<button class="btn" data-act="unduh">${ic('download')}Unduh Laporan Aset</button><button class="btn primary" data-act="baru">${ic('plus')}Tambah Aset Baru</button>` })}<div id="isi"></div>`;
    const isi = $('#isi', el);
    const gambar = (d) => {
      data = d; const s = d.ringkas;
      const kats = Store.opsi.kategoriAset || Object.keys(s.kategori);
      isi.innerHTML = `<div class="stack anim">
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Total Nilai Aset Terdaftar', ikon: 'wallet', val: rp(s.total), foot: `<span class="badge gold plain">${s.item} item • ${fmtNum(s.unit)} unit</span>` })}
          ${kpiHTML({ label: 'Kondisi Baik (Siap Pakai)', ikon: 'check-c', cls: 'success', val: `<span class="ok">${s.Baik || 0}</span> <small>Item</small>`, foot: `<span class="badge success plain">${fmtNum((s.Baik || 0) / Math.max(1, s.item) * 100, 1)}% prima</span>` })}
          ${kpiHTML({ label: 'Perlu Ganti / Perawatan', ikon: 'settings', cls: 'warning', val: `<span class="warn">${s['Perlu Ganti'] || 0}</span> <small>Item</small>`, foot: esc(d.rows.filter((a) => a.kondisi === 'Perlu Ganti').map((a) => a.nama.split(' ').slice(0, 2).join(' ')).slice(0, 2).join(', ')) })}
          ${kpiHTML({ label: 'Rusak', ikon: 'alert', cls: 'danger', val: `<span class="bad">${s.Rusak || 0}</span> <small>Item</small>`, foot: '<span class="badge danger plain">Ganti segera</span>' })}
        </div>
        <div class="grid g-main">
          <div class="card">
            <div class="card-head"><div><h2>Daftar Perlengkapan & Sarana Lapak</h2><div class="sub">Pencatatan inventaris gerobak & dapur rempah</div></div><div id="kond"></div></div>
            <div class="search mb-12">${ic('filter')}<input class="input" id="cari" placeholder="Cari nama barang, kode aset, atau lokasi…" value="${esc(cari)}"></div>
            <div class="chips scroll mb-12" id="kat">${['Semua'].concat(kats).map((k) => `<button class="chip ${k === kat ? 'on' : ''}" data-kat="${esc(k)}">${esc(k)} <span class="n">(${k === 'Semua' ? d.rows.length : d.rows.filter((a) => a.kategori === k).length})</span></button>`).join('')}</div>
            <div id="tbl"></div>
          </div>
          <div class="stack">
            <div class="card"><div class="card-head"><h3 class="row gap-8">${ic('plus', 'sm')}Formulir Registrasi Aset</h3><span class="badge plain" id="next-id"></span></div><div id="form"></div></div>
            <div class="card"><div class="card-head"><h3>Distribusi Investasi</h3><span class="xs muted">Total ${rpK(s.total)}</span></div>${segbarHTML(Object.keys(s.kategori).sort((a, b) => s.kategori[b] - s.kategori[a]).map((k, i) => ({ name: k, value: s.kategori[k], color: SERI[i % 5] })), rpK)}</div>
            <div class="card"><div class="row top"><span class="icon-box">${ic('shield')}</span><div><b>Prosedur Audit Fisik Lapak</b><p class="xs muted mt-4">Audit kondisi peralatan dilakukan berkala tiap akhir bulan untuk memantau kelayakan alat godokan, kebocoran gas kompor, dan kebersihan mesin cup sealer.</p></div></div></div>
          </div>
        </div></div>`;
      $('#kond', isi).innerHTML = segHTML(['Semua', 'Baik', 'Perlu Ganti', 'Rusak'].map((k) => ({ v: k, l: k === 'Semua' ? 'Semua' : k + ' (' + (s[k] || 0) + ')' })), kond);
      pasangSeg($('#kond .seg', isi), (v) => { kond = v; hal = 1; tabel(); });
      $('#cari', isi).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; tabel(); }, 180));
      tabel(); form(null);
    };
    const tabel = () => {
      const rows = data.rows.filter((a) => (kond === 'Semua' || a.kondisi === kond) && (kat === 'Semua' || a.kategori === kat) && (!cari || (a.nama + ' ' + a.id + ' ' + a.lokasi + ' ' + a.catatan).toLowerCase().includes(cari)));
      const per = 10, page = rows.slice((hal - 1) * per, hal * per);
      $('#tbl', isi).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Kode & Nama Barang</th><th>Kategori</th><th>Tgl Beli</th><th class="r">Qty</th><th class="r">Harga Beli</th><th class="c">Kondisi</th><th class="r">Aksi</th></tr></thead><tbody class="stagger">${page.map((a, i) => `<tr style="--i:${i}"><td data-l="Barang" class="main-cell"><div class="row gap-8"><img class="thumb" src="${esc(fotoUrl(a.foto, 'assets/img/aset/lainnya.svg'))}" alt="" loading="lazy" onerror="this.src='assets/img/aset/lainnya.svg'"><div><b>${esc(a.nama)}</b><div class="id">${esc(a.id)} • ${esc(a.lokasi || '-')}</div>${a.catatan ? `<div class="xs ${a.kondisi === 'Baik' ? 'muted' : 'bad'}">${esc(a.catatan)}</div>` : ''}</div></div></td><td data-l="Kategori"><span class="badge plain">${esc(a.kategori)}</span></td><td data-l="Tgl Beli">${tgl(a.tanggal, 'd MMM yyyy')}</td><td data-l="Qty" class="r">${fmtNum(a.qty)} ${esc(a.satuan)}</td><td data-l="Harga" class="r"><b>${rp(a.harga)}</b>${a.qty > 1 ? `<div class="xs muted">Nilai ${rp(a.nilai)}</div>` : ''}</td><td data-l="Kondisi" class="c">${badgeStatus(a.kondisi)}</td><td data-l="Aksi" class="r"><button class="btn ghost icon-only sm" data-edit="${esc(a.id)}" aria-label="Ubah">${ic('edit', 'sm')}</button></td></tr>`).join('')}</tbody></table></div>${pagerHTML(rows.length, hal, per, 'aset terdaftar')}` : kosongHTML('Aset tidak ditemukan.', 'stall');
    };
    const form = (a) => {
      const f = $('#form', isi), baru = !a; a = a || { tanggal: hariIni(), qty: 1, satuan: 'unit', harga: 0, kondisi: 'Baik', kategori: (Store.opsi.kategoriAset || [])[0], nama: '', lokasi: '', catatan: '' };
      const maxId = Math.max(0, ...data.rows.map((x) => +String(x.id).replace(/\D/g, '') || 0));
      $('#next-id', isi).textContent = baru ? 'AST-' + String(maxId + 1).padStart(3, '0') : a.id;
      f.innerHTML = `<div class="col"><div class="form-grid"><div class="field span-2"><label>Nama Peralatan / Barang</label><input class="input" id="a-n" placeholder="Cth: Panci Godokan Kuningan 30 cm" value="${esc(a.nama)}"></div><div class="field"><label>Tanggal Perolehan</label><input class="input" type="date" id="a-t" value="${esc(a.tanggal)}"></div><div class="field"><label>Kategori Aset</label><select class="input" id="a-k">${(Store.opsi.kategoriAset || []).map((k) => `<option ${k === a.kategori ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Jumlah (Qty)</label><input class="input" id="a-q" inputmode="numeric" value="${a.qty}"></div><div class="field"><label>Satuan</label><select class="input" id="a-s">${['unit', 'buah', 'set', 'tabung', 'pcs'].map((k) => `<option ${k === a.satuan ? 'selected' : ''}>${k}</option>`).join('')}</select></div><div class="field span-2"><label>Harga Beli / Biaya Perolehan (per satuan)</label><div class="input-rp"><span>Rp</span><input class="input" id="a-h" inputmode="numeric" value="${fmtNum(a.harga)}"></div></div></div>
        <div class="field"><label>Kondisi Barang</label>${segHTML(['Baik', 'Perlu Ganti', 'Rusak'].map((k) => ({ v: k, l: k })), a.kondisi, 'full')}</div>
        <div class="field"><label>Lokasi Penyimpanan Lapak</label><input class="input" id="a-l" placeholder="Cth: Gerobak Depan / Lemari Bawah" value="${esc(a.lokasi)}"></div>
        <div class="field"><label>Catatan</label><input class="input" id="a-c" placeholder="Opsional" value="${esc(a.catatan)}"></div>
        <div class="row">${baru ? '' : `<button class="btn" data-act="batal-edit">Batal</button><button class="btn icon-only" data-act="foto" aria-label="Foto">${ic('image')}</button><button class="btn danger icon-only" data-act="hapus" aria-label="Hapus">${ic('trash')}</button>`}<button class="btn dark grow" data-act="simpan-aset">${ic('check-c')}${baru ? 'Simpan & Bukukan ke Tab Aset' : 'Simpan Perubahan'}</button></div></div>`;
      let kondisi = a.kondisi; pasangSeg($('.seg', f), (v) => { kondisi = v; });
      $('#a-h', f).addEventListener('input', (e) => { const v = parseRp(e.target.value); e.target.value = v ? fmtNum(v) : ''; });
      f.dataset.id = baru ? '' : a.id; f._kondisi = () => kondisi;
    };
    el.onclick = async (e) => {
      const k = e.target.closest('[data-kat]'); if (k) { kat = k.dataset.kat; hal = 1; $$('#kat .chip', isi).forEach((x) => x.classList.toggle('on', x === k)); tabel(); return; }
      const pg = e.target.closest('[data-pg]'); if (pg) { hal = +pg.dataset.pg; tabel(); return; }
      const ed = e.target.closest('[data-edit]'); if (ed) { form(data.rows.find((x) => x.id === ed.dataset.edit)); $('#form', isi).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const a = e.target.closest('[data-act]'); if (!a) return; const f = $('#form', isi);
      if (a.dataset.act === 'baru') { form(null); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#a-n', f).focus(), 400); }
      if (a.dataset.act === 'batal-edit') form(null);
      if (a.dataset.act === 'foto') unggahFotoUI('aset', f.dataset.id, () => muat(true));
      if (a.dataset.act === 'hapus') { const alasan = await mintaTeks({ title: 'Hapus aset ' + f.dataset.id, label: 'Alasan penghapusan (dijual, hilang, rusak total…)', min: 3, ok: 'Hapus Aset' }); if (alasan && (await tulis('aset.hapus', { id: f.dataset.id, alasan }, { teks: 'Menghapus aset…' })).success) muat(true); }
      if (a.dataset.act === 'simpan-aset') { const nama = $('#a-n', f).value.trim(); if (!nama) { $('#a-n', f).classList.add('err'); return toast('Nama barang wajib diisi.', 'warning'); } const r = await tulis('aset.simpan', { id: f.dataset.id, nama, tanggal: $('#a-t', f).value, kategori: $('#a-k', f).value, qty: num($('#a-q', f).value), satuan: $('#a-s', f).value, harga: parseRp($('#a-h', f).value), kondisi: f._kondisi(), lokasi: $('#a-l', f).value, catatan: $('#a-c', f).value }, { teks: 'Menyimpan aset…' }); if (r.success) muat(true); }
      if (a.dataset.act === 'unduh' && data) { const m = Modal.open({ title: 'Unduh Laporan Aset', size: 'sm', body: `<p class="muted">${data.rows.length} aset • total ${rp(data.ringkas.total)}</p>`, foot: `<button class="btn" data-x1>${ic('download', 'sm')}Excel</button><button class="btn primary" data-x2>${ic('printer', 'sm')}PDF</button>` }); const ring = [['Total nilai aset', rp(data.ringkas.total)], ['Baik / Perlu Ganti / Rusak', (data.ringkas.Baik || 0) + ' / ' + (data.ringkas['Perlu Ganti'] || 0) + ' / ' + (data.ringkas.Rusak || 0)]]; $('[data-x1]', m.el).onclick = () => { m.close(); unduhExcel('Aset-Inventaris-' + hariIni(), 'Aset & Inventaris Lapak', LAPORAN.aset.kol, data.rows, ring); }; $('[data-x2]', m.el).onclick = () => { m.close(); unduhPDF('Aset-Inventaris-' + hariIni(), 'Aset & Inventaris Lapak', LAPORAN.aset.kol, data.rows, ring, { landscape: true }); }; }
    };
    const muat = (force) => pakai('aset.list', {}, gambar, { maxAge: force ? 0 : 60000, force, onError: (m) => { isi.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    isi.innerHTML = '<div class="stack"><div class="grid g-4 kpis">' + '<div class="skel h-120"></div>'.repeat(4) + '</div><div class="skel h-200"></div></div>';
    muat(false);
  }
};
