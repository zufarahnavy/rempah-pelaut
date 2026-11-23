/* =====================================================================
   Halaman Owner: Dashboard, Analitik Penjualan, Rekap Kas, Laporan & Unduh
   ===================================================================== */
'use strict';
const ikonBuku = { POS: ['receipt', 'warning'], BIAYA: ['receipt', 'danger'], BELANJA: ['bag', 'danger'], CLOSING: ['lock', 'info'] };
function shiftLabel() { const h = +jamKini().slice(0, 2); return h < 11 ? 'Shift Pagi' : h < 15 ? 'Shift Siang' : h < 19 ? 'Shift Sore' : 'Shift Malam'; }

/* ============================== DASHBOARD OWNER ============================== */
Pages.dashboard = {
  render(el) {
    let tab = 'Semua', cari = '', hal = 1, rentang = '7';
    const gambar = (d) => {
      if (!d) { el.innerHTML = `<div class="stack"><div class="skel h-120"></div><div class="grid g-4 kpis">${'<div class="skel h-120"></div>'.repeat(4)}</div><div class="skel h-200"></div></div>`; return; }
      const k = d.kpi, app = Store.app || {};
      const dOm = pct(k.omset, k.omsetKemarin), dLaba = pct(k.labaBulan, k.labaBulanLalu);
      el.innerHTML = `<div class="stack anim">
        <div class="card hello">
          <div><h1>${sapaan()}, ${esc(Store.me.nama)}</h1>
            <p class="muted mt-4">${tgl(hariIni(), 'EEEE, d MMMM yyyy')} · ${esc(app.lapak || '')} · ${esc(app.lokasiSingkat || '')}</p></div>
          <div class="status-box"><span class="icon-box s ${d.status === 'Terkunci' ? 'success' : 'warning'}">${ic(d.status === 'Terkunci' ? 'lock' : 'cup', 'sm')}</span><div><div class="small muted">Gerobak hari ini</div><b>${d.status === 'Terkunci' ? 'Sudah closing' : shiftLabel().replace('Shift', 'Shift') + ' berjalan'}</b><div class="xs muted">${d.kasirAktif ? 'Kasir: ' + esc(d.kasirAktif) : 'Belum ada transaksi'}</div></div></div>
        </div>
        ${d.belumClosing && d.belumClosing.length ? `<div class="notice">${ic('alert')}<div class="grow"><b>${d.belumClosing.length} hari belum Daily Closing</b><div class="small">${d.belumClosing.slice(0, 5).map((t) => tgl(t, 'd MMM')).join(', ')} — saldo kas belum final.</div></div><a class="btn sm" href="#/closing?t=${d.belumClosing[0]}">${ic('lock', 'sm')}Closing sekarang</a></div>` : ''}
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Total masuk hari ini', ikon: 'cash', val: rp(k.omset), id: 'k1', foot: deltaHTML(dOm) + ' vs kemarin' })}
          ${kpiHTML({ label: 'Cup terjual', ikon: 'cup', val: `${k.cup} <small>/ ${k.target}</small>`, foot: `<div class="grow"><div class="meter s"><i data-w="${Math.min(100, k.cup / (k.target || 80) * 100)}"></i></div></div>` })}
          ${kpiHTML({ label: 'Saldo kas lapak', ikon: 'wallet', val: rp(k.saldo), id: 'k3', foot: `Awal ${rpK(k.saldoAwal)} · belanja ${rpK(k.belanja)}` })}
          ${kpiHTML({ label: 'Laba kas ' + BULAN[+hariIni().slice(5, 7) - 1], ikon: 'trend-up', hero: true, val: rp(k.labaBulan), foot: deltaHTML(dLaba) + ' vs bulan lalu' })}
        </div>
        <div class="grid g-main">
          <div class="stack">
            <div class="card">
              <div class="card-head"><div><h2>Pembukuan 7 hari terakhir</h2><div class="sub">Penjualan, pengeluaran, belanja bahan, dan closing</div></div><div class="search" style="min-width:220px">${ic('search')}<input class="input" id="cari" placeholder="Cari ID / jenis nota…" value="${esc(cari)}"></div></div>
              <div class="chips scroll mb-12" id="tabs"></div>
              <div id="buku"></div>
            </div>
            <div class="grid g-2">
              <div class="card"><div class="card-head"><div><h3>Stok bahan</h3><div class="sub">${d.stok.total} bahan baku terdaftar</div></div><a class="link-btn small" href="#/stok">Kelola ${ic('chev-r', 'sm')}</a></div>
                <div class="donut-wrap"><div id="donut-stok"></div>${legendaDonat([{ name: 'Aman', value: d.stok.hitung.Aman, color: 'var(--c-success)' }, { name: 'Menipis', value: d.stok.hitung.Menipis, color: 'var(--c-warning)' }, { name: 'Kritis/habis', value: d.stok.hitung.Kritis + d.stok.hitung.Habis, color: 'var(--c-danger)' }], (v) => v + ' bahan')}</div>
                <div class="chips mt-12">${d.stok.perhatian.slice(0, 4).map((s) => `<span class="badge ${s.status === 'Menipis' ? 'warning' : 'danger'}">${esc(s.nama)} (${fmtDec(s.stok)} ${esc(s.satuan)})</span>`).join('')}</div></div>
              <div class="card"><div class="card-head"><h3>Aktivitas terbaru</h3></div>
                <div class="timeline">${d.aktivitas.map((a) => `<div class="ev ${/CLOSING|TERBIT|SIMPAN/.test(a.aksi) ? 'ok' : /HAPUS|BUKA|TOLAK/.test(a.aksi) ? 'bad' : ''}"><div class="row between"><b class="small">${esc(labelAksi(a.aksi))}</b><span class="xs muted">${esc(relatif(a.waktu))}</span></div><div class="xs muted">${esc(a.nama)} • ${esc(a.detail).slice(0, 110)}</div></div>`).join('') || kosongHTML('Belum ada aktivitas', 'history')}</div></div>
            </div>
          </div>
          <div class="stack">
            <div class="card"><h3>Aksi cepat</h3><div class="col mt-12 gap-8">
              <a class="qa" href="#/belanja"><span class="icon-box s">${ic('bag', 'sm')}</span><div><div class="t">Catat belanja bahan</div><div class="s">Nota pasar atau supplier</div></div>${ic('chev-r', 'sm chev')}</a>
              <a class="qa" href="#/stok?opname=1"><span class="icon-box s">${ic('scale', 'sm')}</span><div><div class="t">Opname stok</div><div class="s">Hitung fisik bahan</div></div>${ic('chev-r', 'sm chev')}</a>
              <a class="qa" href="#/rekap"><span class="icon-box s">${ic('edit', 'sm')}</span><div><div class="t">Koreksi hari yang sudah closing</div><div class="s">Dari rekap kas per tanggal</div></div>${ic('chev-r', 'sm chev')}</a>
              <a class="qa" href="#/laporan"><span class="icon-box s">${ic('file', 'sm')}</span><div><div class="t">Laporan & unduh</div><div class="s">Pratinjau lalu unduh Excel/PDF</div></div>${ic('chev-r', 'sm chev')}</a></div></div>
            <div class="card"><div class="card-head"><div><h3>Tren pemasukan</h3><div class="sub" id="tren-sub"></div></div><div id="rg"></div></div><div class="kpi-val" id="tren-tot" style="font-size:26px"></div><div class="small mt-4" id="tren-delta"></div><div id="tren" class="mt-12"></div></div>
            <div class="card"><div class="card-head"><h3>Menu terlaris</h3><a class="link-btn small" href="#/analitik">Semua ${ic('chev-r', 'sm')}</a></div>${hbarHTML(d.menuTop.slice(0, 5).map((m, i) => ({ name: m.nama, value: m.qty, foto: m.foto, sub: fmtNum(m.pct, 0) + '%', color: SERI[i % 5] })), { fmt: (v) => v + ' cup' })}<div class="xs muted mt-12">30 hari terakhir</div></div>
            <div class="card"><div class="row"><span class="icon-box s">${ic('database', 'sm')}</span><div class="grow"><b>Database Google Sheets</b><div class="xs muted">Aset tercatat ${rp(d.aset.total)} (${d.aset.item} item)</div></div><button class="btn sm" data-act="sheet">${ic('ext', 'sm')}Buka</button></div></div>
          </div>
        </div></div>`;
      animasiBatang(el);
      ['k1', 'k3'].forEach((id) => { const e2 = $('#' + id, el); if (e2) { const v = id === 'k1' ? k.omset : k.saldo; e2.dataset.v = 0; animasiAngka(e2, v); } });
      grafikDonat($('#donut-stok', el), { items: [{ name: 'Aman', value: d.stok.hitung.Aman, color: 'var(--c-success)' }, { name: 'Menipis', value: d.stok.hitung.Menipis, color: 'var(--c-warning)' }, { name: 'Kritis/Habis', value: d.stok.hitung.Kritis + d.stok.hitung.Habis, color: 'var(--c-danger)' }], center: { v: d.stok.total, l: 'bahan' }, size: 150, fmt: (v) => v + ' bahan' });
      $('#rg', el).innerHTML = segHTML([{ v: '7', l: '7 Hari' }, { v: '30', l: '30 Hari' }], rentang);
      pasangSeg($('#rg .seg', el), (v) => { rentang = v; tren(d); });
      tren(d); buku(d);
      $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; buku(d); }, 200));
    };
    const tren = (d) => {
      const data = rentang === '7' ? d.tren.slice(-7) : d.tren;
      const tot = data.reduce((a, x) => a + x.masuk, 0), lalu = rentang === '7' ? d.kpi.mingguLalu : null;
      $('#tren-tot', el).textContent = rp(tot);
      $('#tren-sub', el).textContent = rentang === '7' ? '7 hari terakhir' : '30 hari terakhir';
      $('#tren-delta', el).innerHTML = lalu !== null ? deltaHTML(pct(tot, lalu)) + ' <span class="muted xs">vs 7 hari sebelumnya</span>' : '<span class="muted xs">Rata-rata ' + rp(tot / data.length) + ' / hari</span>';
      grafikGaris($('#tren', el), { labels: data.map((x) => x.t), series: [{ name: 'Pemasukan', values: data.map((x) => x.masuk) }], height: 170, fmtX: (t) => rentang === '7' ? HARI[dowOf(t)].slice(0, 3) : tgl(t, 'd/M'), tipX: (t) => tgl(t, 'EEEE, d MMM'), endLabel: false, tipExtra: (i) => `<div class="r"><span>Cup</span><b>${data[i].cup}</b></div>` });
    };
    const buku = (d) => {
      const t = hariIni();
      const f = { Semua: () => true, 'Hari Ini': (b) => b.tanggal === t, 'Terkunci / Closing': (b) => b.status === 'Terkunci' || b.jenis === 'CLOSING', 'Belanja Bahan': (b) => b.jenis === 'BELANJA' };
      $('#tabs', el).innerHTML = Object.keys(f).map((k) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${k}">${k} <span class="n">(${d.buku.filter(f[k]).length})</span></button>`).join('');
      const rows = d.buku.filter(f[tab]).filter((b) => !cari || (b.id + ' ' + b.ket + ' ' + b.sub + ' ' + b.jenis).toLowerCase().includes(cari));
      const per = 7, page = rows.slice((hal - 1) * per, hal * per);
      $('#buku', el).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>ID Trx / Nota</th><th>Waktu</th><th>Jenis / Keterangan</th><th class="c">Volume</th><th class="r">Nominal</th><th class="c">Status</th></tr></thead><tbody class="fade-swap">${page.map((b) => { const ik = ikonBuku[b.jenis] || ['receipt', '']; return `<tr><td data-l="ID" class="main-cell"><div class="row gap-8"><span class="icon-box s ${ik[1]}">${ic(ik[0], 'sm')}</span><div><b class="id" style="color:var(--c-text)">#${esc(b.id)}</b><div class="xs muted">${{ POS: 'POS Kasir', BIAYA: 'Operasional', BELANJA: 'Restok Bahan', CLOSING: 'Tutup Buku' }[b.jenis]}</div></div></div></td><td data-l="Waktu"><b class="tnum">${esc(b.jam || '-')}</b><div class="xs muted">${tgl(b.tanggal, 'EEE, d MMM')}</div></td><td data-l="Keterangan"><div style="max-width:280px;white-space:normal" class="small strong">${esc(b.ket)}</div><div class="xs muted">${esc(b.sub)}</div></td><td data-l="Volume" class="c">${esc(b.volume)}</td><td data-l="Nominal" class="r"><b class="${b.nominal < 0 ? 'bad' : ''}">${b.nominal < 0 ? '- ' : ''}${rp(Math.abs(b.nominal))}</b></td><td data-l="Status" class="c">${badgeStatus(b.status === 'Tersimpan' ? 'Tersimpan' : b.status)}</td></tr>`; }).join('')}</tbody></table></div>${pagerHTML(rows.length, hal, per, 'catatan pembukuan')}` : kosongHTML('Tidak ada catatan yang cocok.', 'book');
    };
    el.onclick = async (e) => {
      const tb = e.target.closest('[data-tab]'); const d = Store.dashboard;
      if (tb && d) { tab = tb.dataset.tab; hal = 1; buku(d); return; }
      const pg = e.target.closest('[data-pg]'); if (pg && d) { hal = +pg.dataset.pg; buku(d); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'sheet') { const r = await API.call('sistem.status', {}); if (r.success) window.open(r.data.spreadsheetUrl, '_blank'); else toast(r.message, 'error'); }
    };
    gambar(Store.dashboard);
    pakai('dashboard', {}, (d) => { Store.dashboard = d; gambar(d); }, { maxAge: 30000 });
    const on = () => gambar(Store.dashboard); document.addEventListener('boot', on);
    return () => document.removeEventListener('boot', on);
  }
};
ICONS.wallet = '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6"/><path d="M16 14h.01"/>';
function labelAksi(a) { return ({ DE_PDF: 'PDF dokumen dibuat', DE_TTD_BYPASS: 'Tanda tangan bypass Owner', DE_UBAH_DRAF: 'Draf dokumen diubah', DE_HAPUS_DRAF: 'Draf dokumen dihapus', DE_KEMBALI_DRAF: 'Dokumen dikembalikan ke draf', DE_TOLAK: 'Dokumen ditolak', DE_DATA_BERUBAH: 'Tanda tangan diulang (data berubah)', DE_DAFTAR_TEMPLATE: 'Template didaftarkan', DE_PINDAI_TEMPLATE: 'Template dipindai ulang', DE_UBAH_TEMPLATE: 'Template diubah', HITUNG_ULANG_REKAP: 'Rekap kas dihitung ulang', PIN_TTD_TERKUNCI: 'PIN tanda tangan terkunci', LOGIN: 'Masuk', TAMBAH_BAHAN: 'Bahan ditambahkan', UBAH_BAHAN: 'Bahan diubah', TAMBAH_PENGGUNA: 'Pengguna ditambahkan', UBAH_PENGGUNA: 'Pengguna diubah', UNGGAH_FOTO: 'Foto diunggah', AKTIFKAN_MENU: 'Menu diaktifkan', NONAKTIF_MENU: 'Menu dinonaktifkan', BATAL_POS: 'Transaksi dibatalkan', BATAL_BIAYA: 'Pengeluaran dibatalkan', BATAL_BELANJA: 'Nota belanja dibatalkan', BATAL_OPNAME: 'Opname dibatalkan', UBAH_PENJUALAN: 'Transaksi diubah Owner', UBAH_BELANJA: 'Nota belanja diubah', KOREKSI_HARI_TERKUNCI: 'Koreksi hari yang sudah closing', BUKA_KUNCI_OTOMATIS: 'Kunci closing dibuka', DE_DATA_DIKOREKSI: 'Dokumen ditandai dikoreksi', DE_TARIK: 'Dokumen ditarik', BUAT_PIN_TTD: 'PIN tanda tangan dibuat', GANTI_PIN_TTD: 'PIN tanda tangan diganti', RESET_PIN_TTD: 'PIN tanda tangan direset', PIN_TERKUNCI: 'PIN terkunci', LOGIN_GAGAL: 'Login gagal', ARSIP_BAHAN: 'Bahan diarsipkan', PULIHKAN_BAHAN: 'Bahan dipulihkan', HAPUS_ASET: 'Aset dihapus', PULIHKAN_ASET: 'Aset dipulihkan', SIMPAN_PENJUALAN: 'Penjualan POS dicatat', HAPUS_PENJUALAN: 'Transaksi dihapus', SIMPAN_BIAYA: 'Biaya lapak dicatat', UBAH_BIAYA: 'Biaya diubah', HAPUS_BIAYA: 'Biaya dihapus', DAILY_CLOSING: 'Daily Closing', BUKA_KUNCI_CLOSING: 'Kunci closing dibuka', SIMPAN_BELANJA: 'Nota belanja dicatat', HAPUS_BELANJA: 'Nota belanja dihapus', STOK_OPNAME: 'Stok opname', TAMBAH_ASET: 'Aset ditambahkan', UBAH_ASET: 'Aset diperbarui', UBAH_PENGATURAN: 'Pengaturan diubah', DE_TERBIT: 'Dokumen terbit', DE_TTD: 'Dokumen ditandatangani', DE_AJUKAN: 'Dokumen diajukan', DE_BUAT_DRAF: 'Draf dokumen dibuat', SETUP_DEMO: 'Database disiapkan', IMPORT_RUN: 'Import data', MULAI_DATA_RIIL: 'Mulai data riil', UBAH_MENU: 'Menu diperbarui', TAMBAH_MENU: 'Menu ditambahkan', RESET_PIN: 'PIN direset', GANTI_PIN: 'PIN diganti' }[a] || a.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())); }

/* ============================== ANALITIK PENJUALAN ============================== */
Pages.analitik = {
  render(el, q) {
    let preset = q.p || '30', tampil = 'harian', dari = q.dari, sampai = q.sampai;
    const param = () => preset === 'kustom' && dari && sampai ? { dari, sampai } : Param.analitik(preset);
    el.innerHTML = `${kepala({ eyebrow: 'Wawasan Bisnis', judul: 'Analitik Penjualan', desc: 'Tren omset, menu terlaris, pola jam ramai, komposisi pembayaran, dan laba-rugi kas — semua dihitung otomatis dari buku kasir.', acts: `<div id="preset"></div><div class="row gap-8 hidden" id="kustom"><input type="date" class="input" id="d1" style="max-width:160px"><input type="date" class="input" id="d2" style="max-width:160px"><button class="btn primary sm" id="terap">Terapkan</button></div>` })}<div id="isi"></div>`;
    $('#preset', el).innerHTML = segHTML([{ v: '7', l: '7 Hari' }, { v: '30', l: '30 Hari' }, { v: '90', l: '90 Hari' }, { v: 'bulan', l: 'Bulan Ini' }, { v: 'kustom', l: 'Kustom' }], preset);
    pasangSeg($('#preset .seg', el), (v) => { preset = v; $('#kustom', el).classList.toggle('hidden', v !== 'kustom'); if (v !== 'kustom') muat(); });
    $('#d1', el).value = Param.analitik('30').dari; $('#d2', el).value = hariIni(); $('#d2', el).max = hariIni();
    $('#terap', el).onclick = () => { dari = $('#d1', el).value; sampai = $('#d2', el).value; if (!dari || !sampai || dari > sampai) return toast('Rentang tanggal tidak valid.', 'warning'); muat(); };
    const isi = $('#isi', el);
    const gambar = (d) => {
      const s = d.ringkas, p = d.ringkasPrev;
      const kartu = (lbl, ikon, cls, val, a, b, kebalik, sub) => `<div class="card kpi"><div class="top"><span class="lbl2">${lbl}</span><span class="icon-box s ${cls}">${ic(ikon, 'sm')}</span></div><div class="kpi-val">${val}</div><div class="foot">${deltaHTML(pct(a, b), kebalik)}<span>${sub || 'vs ' + d.periode.hari + ' hari sebelumnya'}</span></div></div>`;
      isi.innerHTML = `<div class="stack anim">
        <div class="row wrap gap-8 small muted">${ic('calendar', 'sm')}Periode <b style="color:var(--c-text)">${tgl(d.periode.dari, 'd MMM yyyy')} – ${tgl(d.periode.sampai, 'd MMM yyyy')}</b> (${d.periode.hari} hari) dibanding ${tgl(d.prev.dari, 'd MMM')} – ${tgl(d.prev.sampai, 'd MMM yyyy')}</div>
        <div class="grid g-4 kpis">
          ${kartu('Total Pemasukan', 'cash', 'warning', rp(s.masuk), s.masuk, p.masuk)}
          ${kartu('Cup Terjual', 'cup', 'info', fmtNum(s.cup) + ' <small>cup</small>', s.cup, p.cup, false, fmtNum(s.avgCupHari, 1) + ' cup/hari')}
          ${kartu('Laba Kas', 'trend-up', 'success', rp(s.laba), s.laba, p.laba, false, 'margin ' + fmtNum(s.margin, 1) + '%')}
          ${kartu('Rata-rata / Transaksi', 'receipt', 'wood', rp(s.avgTrx), s.avgTrx, p.avgTrx, false, fmtNum(s.trx) + ' trx • ' + fmtNum(s.avgCupTrx, 1) + ' cup/trx')}
        </div>
        <div class="grid g-main">
          <div class="card"><div class="card-head"><div><h2>Tren Pemasukan</h2><div class="sub">Garis putus-putus = periode sebelumnya (hanya tampilan harian)</div></div><div id="tg"></div></div><div id="g-tren"></div><div class="legend mt-8" id="lg-tren"></div></div>
          <div class="card"><div class="card-head"><div><h3>Wawasan Otomatis</h3><div class="sub">Disusun dari data periode ini</div></div><span class="icon-box s">${ic('bulb', 'sm')}</span></div>${d.insight.map((x, i) => `<div class="insight" style="animation-delay:${i * 60}ms"><span class="icon-box s ${x.ikon === 'down' ? 'danger' : x.ikon === 'up' ? 'success' : ''}">${ic({ up: 'trend-up', down: 'trend-down', calendar: 'calendar', clock: 'clock', star: 'star', trend: 'sparkle', target: 'target' }[x.ikon] || 'info', 'sm')}</span><div class="small">${esc(x.teks)}</div></div>`).join('') || kosongHTML('Belum cukup data', 'bulb')}</div>
        </div>
        <div class="grid g-2">
          <div class="card"><div class="card-head"><div><h3>Laba-Rugi Berbasis Kas</h3><div class="sub">Pemasukan − biaya operasional − belanja bahan (tanpa penyusutan)</div></div></div>
            ${[['Total pemasukan', s.masuk, 'var(--c-success)', 'POS ' + rpK(s.omset) + ' • acara ' + rpK(s.acara) + ' • tips ' + rpK(s.tips)], ['Biaya operasional', -s.ops, 'var(--c-danger)', fmtNum(s.masuk ? s.ops / s.masuk * 100 : 0, 1) + '% dari pemasukan'], ['Belanja bahan baku', -s.belanja, 'var(--c-warning)', fmtNum(s.masuk ? s.belanja / s.masuk * 100 : 0, 1) + '% dari pemasukan']].map((r) => `<div class="mt-12"><div class="row between small"><span class="strong">${r[0]}</span><b class="tnum ${r[1] < 0 ? 'bad' : 'ok'}">${r[1] < 0 ? '-' : ''}${rp(Math.abs(r[1]))}</b></div><div class="meter mt-4"><i data-w="${s.masuk ? Math.abs(r[1]) / s.masuk * 100 : 0}" style="background:${r[2]}"></i></div><div class="xs muted mt-4">${r[3]}</div></div>`).join('')}
            <div class="big-total mt-16"><div><b>Laba kas periode</b><div class="xs muted">Margin ${fmtNum(s.margin, 1)}%</div></div><span class="v">${rp(s.laba)}</span></div>
          </div>
          <div class="card"><div class="card-head"><div><h3>Laba Kas Harian</h3><div class="sub">Kolom per hari; kolom di bawah garis nol = rugi kas (biasanya hari gajian / belanja besar)</div></div></div><div id="g-laba"></div><div class="legend-row xs muted"><span><i style="background:var(--s3)"></i>Laba</span><span><i style="background:var(--s5)"></i>Rugi kas</span></div></div>
        </div>
        <div class="grid g-2">
          <div class="card"><div class="card-head"><div><h3>Menu Terlaris</h3><div class="sub">Peringkat berdasarkan cup terjual • tren vs periode sebelumnya</div></div><div id="mtab"></div></div><div id="menu-list"></div></div>
          <div class="stack">
            <div class="card"><div class="card-head"><h3>Kontribusi Kategori</h3><span class="badge plain">omset</span></div><div class="donut-wrap"><div id="d-kat"></div>${legendaDonat(d.kategori.map((k, i) => ({ name: k.nama, value: k.omset, color: SERI[i] })), rpK)}</div></div>
            <div class="card"><h3>Metode Pembayaran</h3><div class="mt-12">${segbarHTML(d.metode.map((m, i) => ({ name: m.nama, value: m.total, color: SERI[i] })), rpK)}</div><h3 class="mt-20">Jenis Pesanan</h3><div class="mt-12">${segbarHTML(d.jenis.map((m, i) => ({ name: m.nama, value: m.cup, color: SERI[(i + 1) % 5] })), (v) => fmtNum(v) + ' cup')}</div></div>
          </div>
        </div>
        <div class="grid g-main-l">
          <div class="card"><div class="card-head"><div><h3>Pola Jam Ramai</h3><div class="sub">Cup terjual per jam × hari (${esc((Store.app || {}).zona || 'WITA')}) — atur jadwal racik & shift</div></div></div>${heatmapHTML(d.heat)}</div>
          <div class="card"><div class="card-head"><div><h3>Rata-rata Pemasukan per Hari</h3><div class="sub">Hari buka dalam periode</div></div></div><div id="g-dow"></div></div>
        </div>
        <div class="grid g-3">
          <div class="card"><h3>Biaya per Kategori</h3><div class="mt-12">${d.biayaKategori.length ? hbarHTML(d.biayaKategori.map((b) => ({ name: b.nama, value: b.total, color: 'var(--c-danger)' })), { fmt: rpK }) : kosongHTML('Tidak ada biaya', 'receipt')}</div></div>
          <div class="card"><h3>Belanja per Bahan</h3><div class="mt-12">${d.belanjaBahan.length ? hbarHTML(d.belanjaBahan.slice(0, 7).map((b) => ({ name: b.nama, value: b.total, color: 'var(--s2)' })), { fmt: rpK }) : kosongHTML('Tidak ada belanja', 'bag')}</div></div>
          <div class="card"><h3>Pencapaian Target Cup</h3><div class="center mt-16"><div class="kpi-val" style="font-size:42px">${s.hariAktif ? Math.round(s.hariTarget / s.hariAktif * 100) : 0}%</div><div class="muted small">${s.hariTarget} dari ${s.hariAktif} hari buka mencapai ${d.target} cup</div></div><div class="meter mt-16 success"><i data-w="${s.hariAktif ? s.hariTarget / s.hariAktif * 100 : 0}"></i></div><div class="row between mt-16 small"><span class="muted">Rata-rata cup/hari</span><b>${fmtNum(s.avgCupHari, 1)}</b></div><div class="row between small mt-4"><span class="muted">Rata-rata pemasukan/hari</span><b>${rp(s.avgHari)}</b></div></div>
        </div>
        <div class="card"><div class="card-head"><div><h3>Data harian</h3><div class="sub">Angka yang sama dengan grafik di atas</div></div><button class="btn sm" data-act="pdf">${ic('eye', 'sm')}Pratinjau & unduh</button></div><div class="table-wrap" style="max-height:360px"><table class="tbl cards"><thead><tr><th>Tanggal</th><th class="r">Trx</th><th class="r">Cup</th><th class="r">Pemasukan</th><th class="r">Biaya</th><th class="r">Belanja</th><th class="r">Laba Kas</th></tr></thead><tbody>${d.harian.slice().reverse().map((h) => `<tr><td data-l="Tanggal" class="main-cell"><b>${tgl(h.t, 'EEE, d MMM yyyy')}</b></td><td data-l="Trx" class="r">${h.trx}</td><td data-l="Cup" class="r">${h.cup}</td><td data-l="Pemasukan" class="r">${rp(h.masuk)}</td><td data-l="Biaya" class="r bad">${rp(h.ops)}</td><td data-l="Belanja" class="r bad">${rp(h.belanja)}</td><td data-l="Laba" class="r"><b class="${h.laba < 0 ? 'bad' : 'ok'}">${rp(h.laba)}</b></td></tr>`).join('')}</tbody></table></div></div>
      </div>`;
      animasiBatang(isi);
      $('#tg', isi).innerHTML = segHTML([{ v: 'harian', l: 'Harian' }, { v: 'mingguan', l: 'Mingguan' }, { v: 'bulanan', l: 'Bulanan' }], tampil);
      pasangSeg($('#tg .seg', isi), (v) => { tampil = v; trenG(d); });
      trenG(d);
      grafikKolom($('#g-laba', isi), { labels: d.harian.map((h) => h.t), values: d.harian.map((h) => h.laba), nama: 'Laba kas', fmtX: (t) => tgl(t, 'd/M'), tipX: (t) => tgl(t, 'EEEE, d MMM'), height: 230, colorFn: (v) => v < 0 ? 'var(--s5)' : 'var(--s3)', fmtTip: rpTanda, tipExtra: (i) => `<div class="r"><span>Pemasukan</span><b>${rp(d.harian[i].masuk)}</b></div><div class="r"><span>Biaya + belanja</span><b>${rp(d.harian[i].ops + d.harian[i].belanja)}</b></div>` });
      grafikDonat($('#d-kat', isi), { items: d.kategori.map((k, i) => ({ name: k.nama, value: k.omset, color: SERI[i] })), center: { v: fmtNum(s.cup), l: 'cup' }, size: 160, fmt: rp });
      const urutHari = [1, 2, 3, 4, 5, 6, 0];
      grafikKolom($('#g-dow', isi), { labels: urutHari.map((i) => d.hariMinggu[i].hari.slice(0, 3)), values: urutHari.map((i) => d.hariMinggu[i].rata), nama: 'Rata-rata pemasukan', height: 220, color: 'var(--s2)', tipX: (l, i) => d.hariMinggu[urutHari[i]].hari + ' (' + d.hariMinggu[urutHari[i]].n + ' hari)' });
      let urutMenu = 'qty';
      const mtab = $('#mtab', isi); mtab.innerHTML = segHTML([{ v: 'qty', l: 'Cup' }, { v: 'omset', l: 'Omset' }], 'qty');
      const daftarMenu = () => { const L = d.menu.slice().sort((a, b) => b[urutMenu] - a[urutMenu]).slice(0, 10); $('#menu-list', isi).innerHTML = hbarHTML(L.map((m, i) => { const g = m.prev ? Math.round((m.qty - m.prev) / m.prev * 100) : null; return { name: m.nama, value: m[urutMenu], foto: m.foto, color: i < 3 ? 'var(--s1)' : 'color-mix(in srgb, var(--s1) 55%, var(--c-card))', badge: g === null ? '' : `<span class="delta ${g >= 0 ? 'up' : 'down'}" style="font-size:10.5px">${g >= 0 ? '▲' : '▼'}${Math.abs(g)}%</span>` }; }), { fmt: urutMenu === 'qty' ? (v) => v + ' cup' : rpK }); animasiBatang($('#menu-list', isi)); };
      pasangSeg($('.seg', mtab), (v) => { urutMenu = v; daftarMenu(); }); daftarMenu();
      isi.onclick = (e) => { const a = e.target.closest('[data-act]'); if (!a) return; const kol = [{ k: 't', l: 'Tanggal', t: 'tgl' }, { k: 'trx', l: 'Transaksi', t: 'num' }, { k: 'cup', l: 'Cup', t: 'num' }, { k: 'masuk', l: 'Pemasukan', t: 'rp' }, { k: 'ops', l: 'Biaya Operasional', t: 'rp' }, { k: 'belanja', l: 'Belanja Bahan', t: 'rp' }, { k: 'laba', l: 'Laba Kas', t: 'rp' }]; const ring = [['Total pemasukan', rp(s.masuk)], ['Biaya operasional', rp(s.ops)], ['Belanja bahan', rp(s.belanja)], ['Laba kas', rp(s.laba)], ['Margin', fmtNum(s.margin, 1) + '%']]; const nm = 'Analitik-' + d.periode.dari + '_' + d.periode.sampai; if (a.dataset.act === 'xls') unduhExcel(nm, 'Analitik Harian ' + tgl(d.periode.dari) + ' – ' + tgl(d.periode.sampai), kol, d.harian, ring); else unduhPDF(nm, 'Analitik Harian ' + tgl(d.periode.dari) + ' – ' + tgl(d.periode.sampai), kol, d.harian, ring); };
    };
    const trenG = (d) => {
      const g = $('#g-tren', isi);
      if (tampil === 'harian') {
        const prevVals = []; const peta = {}; (d.harianPrev || []).forEach((x) => { peta[x.t] = x.masuk; });
        grafikGaris(g, { labels: d.harian.map((h) => h.t), series: [{ name: 'Pemasukan', values: d.harian.map((h) => h.masuk) }].concat(d.harianPrev ? [{ name: 'Periode sebelumnya', values: d.harianPrev.map((h) => h.masuk), dash: true, color: 'var(--c-muted)', area: false }] : []), height: 260, fmtX: (t) => tgl(t, 'd/M'), tipX: (t) => tgl(t, 'EEEE, d MMM yyyy'), tipExtra: (i) => `<div class="r"><span>Cup</span><b>${d.harian[i].cup}</b></div><div class="r"><span>Transaksi</span><b>${d.harian[i].trx}</b></div>` });
        $('#lg-tren', isi).innerHTML = d.harianPrev ? `<span><i class="sw ln2" style="background:var(--s1)"></i>Periode ini</span><span><i class="sw ln2" style="background:var(--c-muted)"></i>Periode sebelumnya</span>` : '';
      } else {
        const L = tampil === 'mingguan' ? d.mingguan : d.bulanan;
        grafikKolom(g, { labels: L.map((x) => x.label), values: L.map((x) => x.masuk), nama: 'Pemasukan', height: 260, fmtX: (l) => tampil === 'mingguan' ? tgl(l, 'd/M') : BULAN[+l.slice(5) - 1].slice(0, 3), tipX: (l) => tampil === 'mingguan' ? 'Minggu mulai ' + tgl(l, 'd MMM') : BULAN[+l.slice(5) - 1] + ' ' + l.slice(0, 4), tipExtra: (i) => `<div class="r"><span>Cup</span><b>${fmtNum(L[i].cup)}</b></div><div class="r"><span>Laba kas</span><b>${rp(L[i].laba)}</b></div>` });
        $('#lg-tren', isi).innerHTML = '';
      }
    };
    const muat = () => {
      const pr = param();
      isi.innerHTML = Cache.get(Cache.key('analitik', pr)) ? '' : `<div class="stack"><div class="grid g-4 kpis">${'<div class="skel h-120"></div>'.repeat(4)}</div><div class="skel h-200"></div><div class="grid g-2"><div class="skel h-200"></div><div class="skel h-200"></div></div></div>`;
      pakai('analitik', pr, (d) => {
        // data periode sebelumnya untuk garis pembanding (tanpa panggilan tambahan bila sudah di cache)
        const prevKey = Cache.get(Cache.key('analitik', { dari: d.prev.dari, sampai: d.prev.sampai }));
        if (prevKey) d.harianPrev = prevKey.d.harian;
        gambar(d);
        if (!prevKey && d.periode.hari <= 92) API.batch('analitik', { dari: d.prev.dari, sampai: d.prev.sampai }).then((r) => { if (r.success) { Cache.set(Cache.key('analitik', { dari: d.prev.dari, sampai: d.prev.sampai }), r.data); d.harianPrev = r.data.harian; if (tampil === 'harian' && $('#g-tren', isi)) trenG(d); } });
      }, { maxAge: 60000, onError: (m) => { isi.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } });
    };
    muat();
  }
};

/* ============================== REKAP KAS ============================== */
Pages.rekap = {
  render(el) {
    let pr = Param.rekap(), tab = 'Semua', cari = '', hal = 1, label = 'Bulan Ini';
    el.innerHTML = `${kepala({ eyebrow: 'Akses Khusus Pemilik • Rekap_Kas_Harian', judul: 'Rekap kas', desc: 'Buku kas harian: saldo kas = saldo kemarin − belanja bahan + omset bersih. Koreksi hari yang sudah closing langsung dari baris tanggalnya.', acts: `<div id="rg"></div><button class="btn" data-act="pdf">${ic('eye', 'sm')}Pratinjau & unduh</button>` })}<div id="isi"></div>`;
    $('#rg', el).innerHTML = segHTML([{ v: 'bulan', l: BULAN[+hariIni().slice(5, 7) - 1] }, { v: '7', l: '7 Hari' }, { v: '30', l: '30 Hari' }, { v: 'lalu', l: 'Bulan Lalu' }], 'bulan');
    pasangSeg($('#rg .seg', el), (v) => { const t = hariIni(); if (v === 'bulan') { pr = Param.rekap(); label = 'Bulan Ini'; } else if (v === 'lalu') { const akhir = addDays(awalBulan(t), -1); pr = { dari: awalBulan(akhir), sampai: akhir }; label = BULAN[+akhir.slice(5, 7) - 1]; } else { pr = { dari: addDays(t, -(+v - 1)), sampai: t }; label = v + ' Hari'; } hal = 1; muat(); });
    const isi = $('#isi', el);
    let data = null;
    const gambar = (d) => {
      data = d; const s = d.ringkas;
      isi.innerHTML = `<div class="stack anim">
        <div class="grid g-4 kpis">
          ${kpiHTML({ label: 'Omset bersih · ' + esc(label), ikon: 'cash', val: rp(s.bersih), foot: `Masuk ${rpK(s.masuk)} · operasional ${rpK(s.ops)}` })}
          ${kpiHTML({ label: 'Belanja bahan', ikon: 'bag', val: rp(s.belanja), foot: `${fmtNum(s.masuk ? s.belanja / s.masuk * 100 : 0, 1)}% dari pemasukan` })}
          ${kpiHTML({ label: 'Laba kas', ikon: 'trend-up', val: rp(s.laba), foot: `Margin ${fmtNum(s.margin, 1)}%` })}
          ${kpiHTML({ label: 'Saldo kas sekarang', ikon: 'wallet', hero: true, val: rp(d.saldoSekarang), foot: 'Termasuk transaksi hari ini' })}
        </div>
        ${d.belumClosing && d.belumClosing.length ? `<div class="notice">${ic('alert')}<div class="grow"><b>${d.belumClosing.length} hari belum closing</b> — ${d.belumClosing.slice(0, 6).map((t) => `<a href="#/closing?t=${t}">${tgl(t, 'd MMM')}</a>`).join(', ')}</div></div>` : ''}
        <div class="stack">
          <div class="card">
            <div class="card-head"><div><h2>Buku kas harian</h2><div class="sub">Klik Transaksi / Biaya untuk mengoreksi tanggal tersebut</div></div><div class="search" style="min-width:200px">${ic('search')}<input class="input" id="cari" placeholder="Cari tanggal / catatan…" value="${esc(cari)}"></div></div>
            <div class="chips scroll mb-12" id="tabs"></div><div id="tbl"></div>
          </div>
          <div class="grid g-3">
            <div class="card"><div class="card-head"><h3>Laba-rugi kas</h3></div><p class="xs muted">Total masuk − biaya operasional − belanja bahan (tanpa penyusutan alat).</p>
              ${[['Total masuk', s.masuk, 'var(--c-success)', 'Penjualan POS, pesanan acara & tips'], ['Biaya operasional', -s.ops, 'var(--c-danger)', 'Listrik, galon, gaji, konsumsi'], ['Belanja bahan', -s.belanja, 'var(--c-warning)', 'Rempah, madu, kemasan & gas']].map((r) => `<div class="inset mt-12"><div class="row between small"><span class="strong row gap-4">${ic(r[1] < 0 ? 'arr-up' : 'arr-down', 'sm')}${r[0]}</span><b class="${r[1] < 0 ? 'bad' : 'ok'}">${r[1] < 0 ? '-' : ''}${rp(Math.abs(r[1]))}</b></div><div class="meter s mt-8"><i data-w="${s.masuk ? Math.abs(r[1]) / s.masuk * 100 : 0}" style="background:${r[2]}"></i></div><div class="xs muted mt-4">${r[3]} (${fmtNum(s.masuk ? Math.abs(r[1]) / s.masuk * 100 : 0, 1)}%)</div></div>`).join('')}
              <div class="big-total mt-12"><div><b>Laba kas</b><div class="xs muted">Margin ${fmtNum(s.margin, 1)}%</div></div><span class="v">${rp(s.laba)}</span></div></div>
            <div class="card"><h3>Sumber pemasukan</h3><div class="donut-wrap mt-12"><div id="d-src"></div>${legendaDonat([{ name: 'Penjualan POS', value: s.omset }, { name: 'Pesanan acara', value: s.acara }, { name: 'Tips', value: s.tips }], rpK)}</div>
              <div class="col mt-16 gap-8"><button class="btn block" data-act="hitung">${ic('refresh', 'sm')}Hitung ulang rantai saldo</button><a class="btn block" href="#/laporan">${ic('file', 'sm')}Laporan lengkap</a></div></div>
            <div class="card"><b>Cara mengoreksi hari yang sudah closing</b><ol class="small muted" style="margin:8px 0 0;padding-left:18px"><li>Klik <b>Transaksi</b> atau <b>Biaya</b> pada baris tanggalnya.</li><li>Ubah atau batalkan data; tulis alasan koreksi saat diminta.</li><li>Hari tetap terkunci. Saldo hari itu dan sesudahnya dihitung ulang otomatis, dan slip yang sudah terbit ditandai "dikoreksi".</li></ol></div>
          </div>
        </div></div>`;
      animasiBatang(isi);
      grafikDonat($('#d-src', isi), { items: [{ name: 'Penjualan POS', value: s.omset }, { name: 'Pesanan acara', value: s.acara }, { name: 'Tips', value: s.tips }], center: { v: fmtNum(s.masuk ? s.omset / s.masuk * 100 : 0) + '%', l: 'POS' }, size: 150, fmt: rp });
      tabel();
      $('#cari', isi).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; tabel(); }, 200));
    };
    const tabel = () => {
      const d = data, f = { Semua: () => true, 'Sudah Closing': (r) => r.status === 'Terkunci', 'Belum / Dibuka': (r) => r.status !== 'Terkunci', 'Ada Catatan': (r) => !!r.catatan };
      $('#tabs', isi).innerHTML = Object.keys(f).map((k) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${k}">${k} <span class="n">(${d.rows.filter(f[k]).length})</span></button>`).join('');
      const rows = d.rows.filter(f[tab]).filter((r) => !cari || (r.tanggal + ' ' + tgl(r.tanggal, 'd MMMM yyyy EEEE') + ' ' + r.catatan + ' ' + r.oleh).toLowerCase().includes(cari));
      const per = 10, page = rows.slice((hal - 1) * per, hal * per);
      $('#tbl', isi).innerHTML = rows.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Tanggal</th><th class="r">Belanja bahan</th><th class="r">Omset bersih</th><th class="r">Saldo akhir</th><th></th></tr></thead><tbody>${page.map((r) => `<tr><td data-l="Tanggal" class="main-cell"><b>${tgl(r.tanggal, 'EEE, d MMM yyyy')}</b> ${badgeStatus(r.status)}${r.tanggal === hariIni() ? ' <span class="badge gold plain">Hari ini</span>' : ''}<div class="id">#CLS-${r.tanggal.replace(/-/g, '')}${r.oleh ? ' · ' + esc(r.oleh) : ''}</div>${r.catatan ? `<div class="xs muted" style="max-width:300px;white-space:normal">${esc(r.catatan).slice(0, 110)}</div>` : ''}</td><td data-l="Belanja bahan" class="r nowrap ${r.belanja ? 'bad' : 'muted'}">${r.belanja ? '−' + rp(r.belanja) : '—'}</td><td data-l="Omset bersih" class="r nowrap"><b class="${r.bersih < 0 ? 'bad' : 'ok'}">${rpTanda(r.bersih)}</b><div class="xs muted">${r.cup} cup · ops ${rpK(r.ops)}</div></td><td data-l="Saldo akhir" class="r nowrap"><b>${rp(r.saldoAkhir)}</b><div class="xs muted">awal ${rp(r.saldoAwal)}</div></td><td data-l="" class="r"><div class="row gap-4" style="justify-content:flex-end;flex-wrap:wrap"><a class="btn xs" href="#/pos?riwayat=1&t=${r.tanggal}">Transaksi</a><a class="btn xs" href="#/biaya?t=${r.tanggal}">Biaya</a>${r.status === 'Terkunci' ? `<button class="btn xs ghost icon-only" data-buka="${r.tanggal}" title="Buka kunci agar kasir bisa menambah data" aria-label="Buka kunci">${ic('unlock', 'sm')}</button>` : `<a class="btn xs dark" href="#/closing?t=${r.tanggal}">Closing</a>`}</div></td></tr>`).join('')}</tbody></table></div>${pagerHTML(rows.length, hal, per, 'hari')}` : kosongHTML('Tidak ada data pada rentang ini.', 'book');
    };
    const muat = () => { isi.innerHTML = Cache.get(Cache.key('rekap.list', pr)) ? '' : '<div class="stack"><div class="grid g-4 kpis">' + '<div class="skel h-120"></div>'.repeat(4) + '</div><div class="skel h-200"></div></div>'; pakai('rekap.list', pr, gambar, { maxAge: 30000, onError: (m) => { isi.innerHTML = `<div class="card">${kosongHTML(m, 'alert')}</div>`; } }); };
    el.onclick = async (e) => {
      const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; hal = 1; tabel(); return; }
      const pg = e.target.closest('[data-pg]'); if (pg) { hal = +pg.dataset.pg; tabel(); return; }
      const bk = e.target.closest('[data-buka]');
      if (bk) { const alasan = await mintaTeks({ title: 'Buka kunci ' + tgl(bk.dataset.buka, 'd MMMM yyyy'), label: 'Alasan (tercatat di riwayat)', placeholder: 'mis. kasir perlu menambah transaksi yang terlewat', min: 5, ok: 'Buka kunci', area: true, catatan: 'Untuk koreksi biasa tidak perlu membuka kunci: buka Transaksi/Biaya tanggal itu lalu ubah langsung.' }); if (alasan && (await tulis('closing.buka', { tanggal: bk.dataset.buka, alasan }, { teks: 'Membuka kunci…' })).success) { muat(); App.muatHariIni(); } return; }
      const a = e.target.closest('[data-act]'); if (!a || !data) return;
      const kol = [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'saldoAwal', l: 'Saldo Awal', t: 'rp' }, { k: 'masuk', l: 'Total Masuk', t: 'rp' }, { k: 'ops', l: 'Operasional', t: 'rp' }, { k: 'bersih', l: 'Omset Bersih', t: 'rp' }, { k: 'belanja', l: 'Belanja Bahan', t: 'rp' }, { k: 'saldoAkhir', l: 'Saldo Akhir', t: 'rp' }, { k: 'cup', l: 'Cup', t: 'num' }, { k: 'status', l: 'Status' }];
      const ring = [['Total pemasukan', rp(data.ringkas.masuk)], ['Biaya operasional', rp(data.ringkas.ops)], ['Belanja bahan', rp(data.ringkas.belanja)], ['Laba kas', rp(data.ringkas.laba) + ' (margin ' + data.ringkas.margin + '%)']];
      const nm = 'Rekap-Kas-' + pr.dari + '_' + pr.sampai, jd = 'Rekap Kas Harian ' + tgl(pr.dari) + ' – ' + tgl(pr.sampai);
      const rows = data.rows.slice().sort((a2, b) => a2.tanggal < b.tanggal ? -1 : 1);
      if (a.dataset.act === 'xls') unduhExcel(nm, jd, kol, rows, ring);
      if (a.dataset.act === 'pdf') unduhPDF(nm, jd, kol, rows, ring, { landscape: true });
      if (a.dataset.act === 'hitung' && await konfirmasi({ title: 'Hitung ulang rantai saldo?', text: 'Semua baris rekap dihitung ulang dari data transaksi. Gunakan setelah impor data atau koreksi massal.', ok: 'Hitung Ulang' })) { if ((await tulis('rekap.hitungUlang', {}, { teks: 'Menghitung ulang rekap kas…' })).success) muat(); }
    };
    muat();
  }
};

/* ============================== LAPORAN & UNDUH ============================== */
const LAPORAN = {
  penjualan: { l: 'Penjualan (per transaksi)', ikon: 'receipt', a: 'penjualan.list', kol: [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'jam', l: 'Jam' }, { k: 'id', l: 'ID Trx' }, { k: 'cup', l: 'Cup', t: 'num' }, { k: 'omset', l: 'Omset Kotor', t: 'rp' }, { k: 'tips', l: 'Tips', t: 'rp' }, { k: 'acara', l: 'Omset Acara', t: 'rp' }, { k: 'masuk', l: 'Total Masuk', t: 'rp' }, { k: 'metode', l: 'Metode' }, { k: 'jenis', l: 'Jenis' }, { k: 'kasir', l: 'Kasir' }], cari: (r) => r.id + ' ' + r.kasir + ' ' + r.catatan + ' ' + r.items.map((i) => i.nama).join(' '), sum: (rows) => [['Total transaksi', fmtNum(rows.length)], ['Total cup', fmtNum(rows.reduce((a, r) => a + r.cup, 0))], ['Total masuk', rp(rows.reduce((a, r) => a + r.masuk, 0))]] },
  detail: { l: 'Detail Menu Terjual', ikon: 'cup', a: 'penjualan.list', ubah: (d) => [].concat(...d.rows.map((t) => t.items.map((i) => ({ tanggal: t.tanggal, jam: t.jam, id: t.id, nama: i.nama, kategori: i.kategori, qty: i.qty, harga: i.harga, subtotal: i.subtotal })))), kol: [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'id', l: 'ID Trx' }, { k: 'nama', l: 'Menu' }, { k: 'kategori', l: 'Kategori' }, { k: 'qty', l: 'Qty', t: 'num' }, { k: 'harga', l: 'Harga', t: 'rp' }, { k: 'subtotal', l: 'Subtotal', t: 'rp' }], cari: (r) => r.nama + ' ' + r.kategori + ' ' + r.id, sum: (rows) => [['Total cup', fmtNum(rows.reduce((a, r) => a + r.qty, 0))], ['Total omset', rp(rows.reduce((a, r) => a + r.subtotal, 0))]] },
  biaya: { l: 'Pengeluaran Operasional', ikon: 'receipt', a: 'biaya.list', kol: [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'jam', l: 'Jam' }, { k: 'kategori', l: 'Kategori' }, { k: 'keterangan', l: 'Keterangan' }, { k: 'kasir', l: 'Dicatat' }, { k: 'nominal', l: 'Nominal', t: 'rp' }], cari: (r) => r.kategori + ' ' + r.keterangan + ' ' + r.kasir, sum: (rows) => [['Total biaya', rp(rows.reduce((a, r) => a + r.nominal, 0))]] },
  belanja: { l: 'Belanja Bahan (per item)', ikon: 'bag', a: 'belanja.list', ubah: (d) => [].concat(...d.rows.map((n) => n.items.map((i) => ({ tanggal: n.tanggal, nota: n.id, sumber: n.sumber, nama: i.nama, qty: i.qty, satuan: i.satuan, harga: i.harga, total: i.total })))), kol: [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'nota', l: 'No. Nota' }, { k: 'sumber', l: 'Sumber' }, { k: 'nama', l: 'Bahan' }, { k: 'qty', l: 'Qty', t: 'num' }, { k: 'satuan', l: 'Satuan' }, { k: 'harga', l: 'Harga', t: 'rp' }, { k: 'total', l: 'Total', t: 'rp' }], cari: (r) => r.nota + ' ' + r.nama + ' ' + r.sumber, sum: (rows) => [['Total belanja', rp(rows.reduce((a, r) => a + r.total, 0))]] },
  rekap: { l: 'Rekap Kas Harian', ikon: 'book', a: 'rekap.list', kol: [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'saldoAwal', l: 'Saldo Awal', t: 'rp' }, { k: 'masuk', l: 'Masuk', t: 'rp' }, { k: 'ops', l: 'Operasional', t: 'rp' }, { k: 'bersih', l: 'Omset Bersih', t: 'rp' }, { k: 'belanja', l: 'Belanja', t: 'rp' }, { k: 'saldoAkhir', l: 'Saldo Akhir', t: 'rp' }, { k: 'status', l: 'Status' }], cari: (r) => r.tanggal + ' ' + r.status + ' ' + r.catatan, sum: (rows) => [['Hari', rows.length], ['Total masuk', rp(rows.reduce((a, r) => a + r.masuk, 0))]] },
  stok: { l: 'Master Stok (posisi kini)', ikon: 'box', a: 'stok.list', tanpaTanggal: true, kol: [{ k: 'id', l: 'ID' }, { k: 'nama', l: 'Bahan' }, { k: 'kategori', l: 'Kategori' }, { k: 'stok', l: 'Stok', t: 'num' }, { k: 'satuan', l: 'Satuan' }, { k: 'minimal', l: 'Minimal', t: 'num' }, { k: 'harga', l: 'Harga Terakhir', t: 'rp' }, { k: 'nilai', l: 'Nilai Stok', t: 'rp' }, { k: 'status', l: 'Status' }], cari: (r) => r.nama + ' ' + r.kategori + ' ' + r.status, sum: (rows) => [['Estimasi nilai stok', rp(rows.reduce((a, r) => a + r.nilai, 0))]] },
  opname: { l: 'Log Stok Opname', ikon: 'scale', a: 'stok.list', tanpaTanggal: true, ubah: (d) => d.log, kol: [{ k: 'tanggal', l: 'Tanggal', t: 'tgl' }, { k: 'id', l: 'ID Log' }, { k: 'nama', l: 'Bahan' }, { k: 'sistem', l: 'Stok Sistem', t: 'num' }, { k: 'fisik', l: 'Stok Fisik', t: 'num' }, { k: 'selisih', l: 'Selisih', t: 'num' }, { k: 'satuan', l: 'Satuan' }, { k: 'catatan', l: 'Catatan' }, { k: 'oleh', l: 'Oleh' }], cari: (r) => r.nama + ' ' + r.catatan + ' ' + r.oleh },
  aset: { l: 'Aset & Inventaris', ikon: 'stall', a: 'aset.list', tanpaTanggal: true, kol: [{ k: 'id', l: 'ID' }, { k: 'nama', l: 'Barang' }, { k: 'kategori', l: 'Kategori' }, { k: 'tanggal', l: 'Tgl Beli', t: 'tgl' }, { k: 'qty', l: 'Qty', t: 'num' }, { k: 'satuan', l: 'Satuan' }, { k: 'harga', l: 'Harga Beli', t: 'rp' }, { k: 'nilai', l: 'Nilai', t: 'rp' }, { k: 'kondisi', l: 'Kondisi' }, { k: 'lokasi', l: 'Lokasi' }], cari: (r) => r.nama + ' ' + r.kategori + ' ' + r.kondisi + ' ' + r.lokasi, sum: (rows) => [['Total nilai aset', rp(rows.reduce((a, r) => a + r.nilai, 0))]] }
};
Pages.laporan = {
  render(el) {
    let jenis = 'penjualan', pr = Param.bulan30(), cari = '', hal = 1, rows = [];
    const izin = { penjualan: ['pos', 'laporan', 'rekap', 'dashboard'], detail: ['pos', 'laporan'], biaya: ['biaya', 'laporan', 'rekap'], belanja: ['belanja', 'laporan', 'rekap'], rekap: ['rekap', 'laporan'], stok: ['stok', 'belanja', 'laporan'], opname: ['stok', 'belanja', 'laporan'], aset: ['aset', 'laporan'] };
    const boleh = Object.keys(LAPORAN).filter((k) => izin[k].some((p) => Store.punya(p)));
    el.innerHTML = `${kepala({ eyebrow: 'Tabel Data & Unduhan', judul: 'Laporan & unduh', desc: 'Pilih jenis data dan rentang tanggal, periksa pratinjaunya, lalu unduh sebagai Excel atau PDF. Angkanya sama dengan tabel di bawah.' })}
      <div class="stack anim">
        <div class="card"><div class="chips" id="jenis">${boleh.map((k) => `<button class="chip ${k === jenis ? 'on' : ''}" data-j="${k}">${ic(LAPORAN[k].ikon, 'sm')}${LAPORAN[k].l}</button>`).join('')}</div>
          <div class="row wrap mt-16 gap-8" id="filter"><div class="field"><label>Dari</label><input type="date" class="input" id="d1" value="${pr.dari}" max="${hariIni()}"></div><div class="field"><label>Sampai</label><input type="date" class="input" id="d2" value="${pr.sampai}" max="${hariIni()}"></div><div class="field"><label>&nbsp;</label><div class="chips"><button class="chip" data-r="7">7 hari</button><button class="chip" data-r="30">30 hari</button><button class="chip" data-r="bulan">Bulan ini</button><button class="chip" data-r="90">90 hari</button></div></div><div class="grow"></div><div class="field" style="min-width:240px"><label>Pencarian</label><div class="search">${ic('search')}<input class="input" id="cari" placeholder="Kata kunci…"></div></div></div></div>
        <div class="card"><div class="card-head"><div><h2 id="judul"></h2><div class="sub" id="sub"></div></div><button class="btn primary" data-act="pdf">${ic('eye', 'sm')}Pratinjau & unduh</button></div><div id="tbl"></div><div id="sum" class="mt-12"></div></div>
      </div>`;
    const L = () => LAPORAN[jenis];
    const tabel = () => {
      const f = rows.filter((r) => !cari || L().cari(r).toLowerCase().includes(cari));
      const per = 15, page = f.slice((hal - 1) * per, hal * per);
      $('#judul', el).textContent = L().l;
      $('#sub', el).textContent = L().tanpaTanggal ? fmtNum(f.length) + ' baris • posisi terkini' : fmtNum(f.length) + ' baris • ' + tgl(pr.dari) + ' – ' + tgl(pr.sampai);
      $('#tbl', el).innerHTML = f.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr>${L().kol.map((k) => `<th class="${k.t === 'rp' || k.t === 'num' ? 'r' : ''}">${k.l}</th>`).join('')}</tr></thead><tbody class="fade-swap">${page.map((r) => `<tr>${L().kol.map((k, i) => { const v = r[k.k]; return `<td data-l="${k.l}" class="${k.t === 'rp' || k.t === 'num' ? 'r' : ''} ${i === 0 ? 'main-cell' : ''}">${k.t === 'rp' ? rp(v) : k.t === 'num' ? fmtDec(v) : k.t === 'tgl' ? tgl(v, 'd MMM yyyy') : /status|kondisi/.test(k.k) ? badgeStatus(v) : esc(v)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>${pagerHTML(f.length, hal, per, 'baris')}` : kosongHTML('Tidak ada data untuk filter ini.', 'file');
      const s = L().sum ? L().sum(f) : [];
      $('#sum', el).innerHTML = s.length ? `<div class="row wrap gap-8">${s.map((x) => `<span class="badge gold plain">${esc(x[0])}: <b>${esc(x[1])}</b></span>`).join('')}</div>` : '';
    };
    const muat = () => {
      $('#filter', el).style.display = L().tanpaTanggal ? 'none' : '';
      $('#tbl', el).innerHTML = '<div class="skel h-200"></div>';
      const data = L().tanpaTanggal ? {} : pr;
      pakai(L().a, data, (d) => { rows = L().ubah ? L().ubah(d) : d.rows; hal = 1; tabel(); }, { maxAge: 30000, onError: (m) => { $('#tbl', el).innerHTML = kosongHTML(m, 'alert'); } });
    };
    el.onclick = (e) => {
      const j = e.target.closest('[data-j]'); if (j) { jenis = j.dataset.j; $$('#jenis .chip', el).forEach((x) => x.classList.toggle('on', x === j)); muat(); return; }
      const r = e.target.closest('[data-r]'); if (r) { pr = r.dataset.r === 'bulan' ? Param.rekap() : { dari: addDays(hariIni(), -(+r.dataset.r - 1)), sampai: hariIni() }; $('#d1', el).value = pr.dari; $('#d2', el).value = pr.sampai; muat(); return; }
      const pg = e.target.closest('[data-pg]'); if (pg) { hal = +pg.dataset.pg; tabel(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      const f = rows.filter((x) => !cari || L().cari(x).toLowerCase().includes(cari));
      const nm = 'Laporan-' + jenis + (L().tanpaTanggal ? '-' + hariIni() : '-' + pr.dari + '_' + pr.sampai), jd = L().l + (L().tanpaTanggal ? ' per ' + tgl(hariIni()) : ' ' + tgl(pr.dari) + ' – ' + tgl(pr.sampai));
      if (a.dataset.act === 'xls') unduhExcel(nm, jd, L().kol, f, L().sum ? L().sum(f) : []);
      if (a.dataset.act === 'pdf') unduhPDF(nm, jd, L().kol, f, L().sum ? L().sum(f) : []);
    };
    ['d1', 'd2'].forEach((id) => $('#' + id, el).addEventListener('change', () => { const a = $('#d1', el).value, b = $('#d2', el).value; if (a && b && a <= b) { pr = { dari: a, sampai: b }; muat(); } }));
    $('#cari', el).addEventListener('input', debounce((e) => { cari = e.target.value.toLowerCase(); hal = 1; tabel(); }, 200));
    if (!boleh.includes(jenis)) jenis = boleh[0];
    muat();
  }
};
