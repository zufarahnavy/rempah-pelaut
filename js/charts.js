/* =====================================================================
   Grafik SVG ringan — tanpa pustaka luar.
   Spesifikasi: garis 2px, area 12%, kolom ≤24px ujung membulat 4px, celah 2px,
   grid tipis, tooltip + crosshair saat disentuh/hover, warna kategori berurutan tetap.
   ===================================================================== */
'use strict';
const SERI = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; return n * e; }
function tipEl(el) { let t = $('.tip', el); if (!t) { t = document.createElement('div'); t.className = 'tip'; el.appendChild(t); } return t; }
function posTip(el, tip, x, y) {
  const w = el.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  let lx = x + 14; if (lx + tw > w) lx = x - tw - 14; if (lx < 0) lx = 4;
  tip.style.left = lx + 'px'; tip.style.top = Math.max(0, y - th / 2) + 'px';
}
/* Kunci linimasa grafik: id elemen (atau urutannya di halaman) + jenis grafik */
function kunciGrafik(el, jenis) { const v = el.closest('.content') || document; return 'g|' + jenis + '|' + (el.id || $$('.chart', v).indexOf(el)); }
function amatiUkuran(el, draw) {
  let w = el.clientWidth; draw(false);
  if (el._ro) el._ro.disconnect();
  el._ro = new ResizeObserver(debounce(() => { if (Math.abs(el.clientWidth - w) > 8) { w = el.clientWidth; draw(true); } }, 120));   // ubah ukuran layar: gambar ulang tanpa animasi
  el._ro.observe(el);
}
const lerpDeret = (a, b, e) => ({
  max: a.max + (b.max - a.max) * e,
  s: b.s.map((v, si) => { const p = Gerak.sampel(a.s[si] || v, v.length); return v.map((x, i) => p[i] + (x - p[i]) * e); }),
  baru: b.s.map((_, si) => !a.s[si])
});

/* ---------- Grafik garis / area ---------- */
function grafikGaris(el, cfg) {
  el.classList.add('chart');
  const kunci = kunciGrafik(el, 'garis');
  const draw = (ukuran) => {
    const W = Math.max(280, el.clientWidth), H = cfg.height || 240, pl = 54, pr = cfg.endLabel === false ? 14 : 62, pt = 16, pb = 28;
    const n = cfg.labels.length, all = [].concat(...cfg.series.map((s) => s.values));
    const max = niceMax(Math.max(1, ...all));
    const X = (i) => pl + (n <= 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1));
    const Yv = (v, mx) => pt + (H - pt - pb) * (1 - v / (mx || 1)), Y = (v) => Yv(v, max);
    const fy = cfg.fmtY || kompak, fx = cfg.fmtX || ((l) => l);
    let g = '<g class="grid">';
    for (let i = 0; i <= 4; i++) { const v = max / 4 * i; g += `<line x1="${pl}" x2="${W - pr + 6}" y1="${Y(v)}" y2="${Y(v)}"/>`; }
    g += '</g><g class="axis">';
    for (let i = 0; i <= 4; i++) { const v = max / 4 * i; g += `<text x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end">${esc(fy(v))}</text>`; }
    const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - pl - pr) / 70))));
    for (let i = 0; i < n; i += step) g += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(fx(cfg.labels[i], i))}</text>`;
    g += '</g>';
    const jalur = (vals, mx) => vals.map((v, i) => { if (i === 0) return `M${X(0)},${Yv(v, mx)}`; const x0 = X(i - 1), x1 = X(i), dx = (x1 - x0) / 3; return `C${x0 + dx},${Yv(vals[i - 1], mx)} ${x1 - dx},${Yv(v, mx)} ${x1},${Yv(v, mx)}`; }).join('');
    const areaDari = (vals, mx) => jalur(vals, mx) + `L${X(n - 1)},${Yv(0, mx)}L${X(0)},${Yv(0, mx)}Z`;
    const mode = ukuran ? { jenis: 'diam' } : Gerak.grafik(kunci, { max, s: cfg.series.map((x) => x.values.slice()) }, lerpDeret);
    const masuk = mode.jenis === 'masuk', tunda = (ms) => masuk ? `animation-delay:${Math.round(ms - mode.lewat)}ms` : '';
    let p = '';
    cfg.series.forEach((s, si) => {
      const c = s.color || SERI[si], d = jalur(s.values, max);
      if (s.area !== false && cfg.series.length <= 2) p += `<path class="ar ${masuk ? 'draw' : ''}" data-s="${si}" d="${areaDari(s.values, max)}" fill="${c}" style="${tunda(150)}"/>`;
      p += `<path class="ln ${masuk ? 'draw' : ''}" data-s="${si}" d="${d}" stroke="${c}" ${s.dash ? 'stroke-dasharray="5 5"' : ''} style="${s.dash ? '' : tunda(0)}"/>`;
      const lv = s.values[n - 1];
      if (!s.dash) p += `<circle class="akhir ${masuk ? 'draw' : ''}" data-s="${si}" cx="${X(n - 1)}" cy="${Y(lv)}" r="4.5" fill="${c}" stroke="var(--c-card)" stroke-width="2" style="${tunda(700)}"/>`;
      if (cfg.endLabel !== false && !s.dash) p += `<text class="endlbl akhir ${masuk ? 'draw' : ''}" data-s="${si}" x="${X(n - 1) + 9}" y="${Y(lv) + 4}" style="${tunda(750)}">${esc(fy(lv))}</text>`;
    });
    const mk = cfg.series.map((s, si) => `<circle class="mk" r="5" fill="${s.color || SERI[si]}"/>`).join('');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(cfg.aria || 'Grafik garis')}">${g}${p}<line class="xhair" y1="${pt}" y2="${H - pb}"/>${mk}<rect class="hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}"/></svg>`;
    const svg = $('svg', el);
    if (masuk) $$('.ln.draw', el).forEach((ln) => { const L = ln.getTotalLength ? ln.getTotalLength() : 1000; ln.style.setProperty('--len', L); });
    if (mode.jenis === 'morph') Gerak.putar(mode.st, svg, (k, e) => {
      k.s.forEach((vals, si) => {
        const ln = $(`.ln[data-s="${si}"]`, svg), ar = $(`.ar[data-s="${si}"]`, svg), c = $(`circle.akhir[data-s="${si}"]`, svg), t = $(`text.akhir[data-s="${si}"]`, svg);
        if (ln) ln.setAttribute('d', jalur(vals, k.max)); if (ar) ar.setAttribute('d', areaDari(vals, k.max));
        if (c) c.setAttribute('cy', Yv(vals[n - 1], k.max)); if (t) { t.setAttribute('y', Yv(vals[n - 1], k.max) + 4); t.textContent = fy(vals[n - 1]); }
        if (k.baru && k.baru[si]) [ln, ar, c, t].forEach((x) => { if (x) x.style.opacity = e; });
      });
    });
    const tip = tipEl(el), xh = $('.xhair', el), mks = $$('.mk', el), hit = $('.hit', el);
    const gerak = (ev) => {
      const r = svg.getBoundingClientRect(), sx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const i = Math.max(0, Math.min(n - 1, Math.round((sx * (W / r.width) - pl) / ((W - pl - pr) / Math.max(1, n - 1)))));
      xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); xh.style.opacity = .35;
      mks.forEach((m, si) => { m.setAttribute('cx', X(i)); m.setAttribute('cy', Y(cfg.series[si].values[i])); m.style.opacity = 1; });
      tip.innerHTML = `<div class="h">${esc(cfg.tipX ? cfg.tipX(cfg.labels[i], i) : cfg.labels[i])}</div>` + cfg.series.map((s, si) => `<div class="r"><span><i class="sw ln2" style="background:${s.color || SERI[si]}"></i>${esc(s.name)}</span><b>${esc((cfg.fmtTip || rp)(s.values[i]))}</b></div>`).join('') + (cfg.tipExtra ? cfg.tipExtra(i) : '');
      tip.classList.add('on'); posTip(el, tip, X(i) * r.width / W, Y(cfg.series[0].values[i]) * r.height / H);
    };
    const keluar = () => { xh.style.opacity = 0; mks.forEach((m) => { m.style.opacity = 0; }); tip.classList.remove('on'); };
    hit.addEventListener('mousemove', gerak); hit.addEventListener('touchstart', gerak, { passive: true }); hit.addEventListener('touchmove', gerak, { passive: true });
    hit.addEventListener('mouseleave', keluar); hit.addEventListener('touchend', () => setTimeout(keluar, 1800));
  };
  amatiUkuran(el, draw);
}

/* ---------- Grafik kolom ---------- */
function grafikKolom(el, cfg) {
  el.classList.add('chart');
  const kunci = kunciGrafik(el, 'kolom');
  const draw = (ukuran) => {
    const W = Math.max(260, el.clientWidth), H = cfg.height || 220, pl = 50, pr = 10, pt = 22, pb = 28;
    const n = cfg.labels.length, vals = cfg.values, vmax = Math.max(0, ...vals), vmin = Math.min(0, ...vals);
    // skala mendukung nilai negatif: garis nol tetap jadi dasar batang, batang negatif tumbuh ke bawah
    let lo = 0, hi, step;
    if (vmin < 0) { step = niceMax((vmax - vmin) / 4); lo = -Math.ceil(-vmin / step) * step; hi = Math.max(step, Math.ceil(vmax / step) * step); }
    else { hi = niceMax(Math.max(1, vmax)); step = hi / 4; }
    const ticks = []; for (let t = lo; t <= hi + step / 1e6; t += step) ticks.push(Math.abs(t) < step / 1e6 ? 0 : t);
    const band = (W - pl - pr) / n, bw = Math.min(24, band * .62), Ys = (v, l, h) => pt + (H - pt - pb) * (h - v) / ((h - l) || 1), Y = (v) => Ys(v, lo, hi), fy = cfg.fmtY || kompak;
    let g = '<g class="grid">'; ticks.forEach((t) => { g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}"${t === 0 && lo < 0 ? ' class="nol"' : ''}/>`; }); g += '</g><g class="axis">';
    ticks.forEach((t) => { g += `<text x="${pl - 8}" y="${Y(t) + 4}" text-anchor="end">${esc(fy(t))}</text>`; });
    const lompat = Math.max(1, Math.ceil(n / Math.floor((W - pl) / 44)));
    cfg.labels.forEach((l, i) => { if (i % lompat === 0) g += `<text x="${pl + band * i + band / 2}" y="${H - 8}" text-anchor="middle">${esc(cfg.fmtX ? cfg.fmtX(l, i) : l)}</text>`; });
    g += '</g>';
    const bentuk = (i, v, l, h) => {
      const x = pl + band * i + (band - bw) / 2, y = Ys(v, l, h), y0 = Ys(0, l, h), r = Math.min(4, bw / 2, Math.abs(y0 - y));
      return v > 0 ? `M${x},${y0}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y0}Z`
        : v < 0 ? `M${x},${y0}V${y - r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y - r}V${y0}Z` : `M${x},${y0}H${x + bw}`;
    };
    const mode = ukuran ? { jenis: 'diam' } : Gerak.grafik(kunci, { v: vals.slice(), lo, hi }, (a, b, e) => { const p = Gerak.sampel(a.v, b.v.length); return { lo: a.lo + (b.lo - a.lo) * e, hi: a.hi + (b.hi - a.hi) * e, v: b.v.map((x, i) => p[i] + (x - p[i]) * e) }; });
    const masuk = mode.jenis === 'masuk', tunda = (ms) => masuk ? `animation-delay:${Math.round(ms - mode.lewat)}ms` : '';
    const imax = vals.indexOf(Math.max(...vals));
    let b = '';
    vals.forEach((v, i) => {
      const warna = cfg.colorFn ? cfg.colorFn(v, i) : (cfg.color || 'var(--s1)');
      b += `<path class="bar ${masuk ? 'draw' : ''}" data-i="${i}" d="${bentuk(i, v, lo, hi)}" fill="${warna}" style="${tunda(Math.min(i, 40) * 18)}${v < 0 ? ';transform-origin:top' : ''}"/>`;
    });
    if (vals[imax] > 0 && cfg.labelMax !== false) b += `<text class="endlbl akhir ${masuk ? 'draw' : ''}" x="${pl + band * imax + band / 2}" y="${Y(vals[imax]) - 7}" text-anchor="middle" style="${tunda(550)}">${esc(fy(vals[imax]))}</text>`;
    vals.forEach((v, i) => { b += `<rect class="hit" data-i="${i}" x="${pl + band * i}" y="${pt}" width="${band}" height="${H - pt - pb}"/>`; });
    if (cfg.garisTarget) { const yt = Y(cfg.garisTarget); b += `<line x1="${pl}" x2="${W - pr}" y1="${yt}" y2="${yt}" stroke="var(--c-secondary)" stroke-dasharray="4 4" opacity=".55"/><text x="${W - pr}" y="${yt - 5}" text-anchor="end" class="endlbl" style="font-size:10.5px;fill:var(--c-muted)">target ${esc(fy(cfg.garisTarget))}</text>`; }
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(cfg.aria || 'Grafik kolom')}">${g}${b}</svg>`;
    const tip = tipEl(el), svg = $('svg', el), batang = $$('.bar', el), lbl = $('text.akhir', el);
    if (mode.jenis === 'morph') Gerak.putar(mode.st, svg, (k) => {
      batang.forEach((p, i) => p.setAttribute('d', bentuk(i, k.v[i], k.lo, k.hi)));
      if (lbl) { lbl.setAttribute('y', Ys(k.v[imax], k.lo, k.hi) - 7); lbl.textContent = fy(k.v[imax]); }
    });
    $$('.hit', el).forEach((h) => {
      const tampil = () => {
        const i = +h.dataset.i, r = svg.getBoundingClientRect();
        batang.forEach((x) => x.classList.toggle('dim', x.dataset.i !== h.dataset.i));
        tip.innerHTML = `<div class="h">${esc(cfg.tipX ? cfg.tipX(cfg.labels[i], i) : cfg.labels[i])}</div><div class="r"><span>${esc(cfg.nama || 'Nilai')}</span><b>${esc((cfg.fmtTip || rp)(vals[i]))}</b></div>${cfg.tipExtra ? cfg.tipExtra(i) : ''}`;
        tip.classList.add('on'); posTip(el, tip, (pl + band * i + band / 2) * r.width / W, Y(vals[i]) * r.height / H);
      };
      h.addEventListener('mouseenter', tampil); h.addEventListener('touchstart', tampil, { passive: true });
      h.addEventListener('mouseleave', () => { tip.classList.remove('on'); batang.forEach((x) => x.classList.remove('dim')); });
    });
  };
  amatiUkuran(el, draw);
}

/* ---------- Donat: masuk dengan sapuan melingkar, berubah dengan morph porsi ---------- */
function grafikDonat(el, cfg) {
  el.classList.add('chart');
  const S = cfg.size || 170, R = S / 2 - 12, sw = cfg.tebal || 20, c = S / 2, total = cfg.items.reduce((a, x) => a + Math.max(0, x.value), 0) || 1;
  const gapA = 2 / R, nama = (it, i) => it.name || String(i);
  const ke = { sapu: 1, f: Object.fromEntries(cfg.items.map((it, i) => [nama(it, i), Math.max(0, it.value) / total])) };
  const busur = (s, e) => `M${c + R * Math.cos(s)},${c + R * Math.sin(s)}A${R},${R} 0 ${e - s > Math.PI ? 1 : 0} 1 ${c + R * Math.cos(e)},${c + R * Math.sin(e)}`;
  const gambarBusur = (k) => {
    let a0 = -Math.PI / 2; const d = [];
    const jumlah = cfg.items.filter((it, i) => (k.f[nama(it, i)] || 0) > 0.0005).length;
    cfg.items.forEach((it, i) => {
      const frac = (k.f[nama(it, i)] || 0) * k.sapu;
      if (frac <= 0.0005) { d.push(''); return; }
      const a1 = a0 + frac * Math.PI * 2, pisah = jumlah > 1 && frac < 1;
      const s = a0 + (pisah ? gapA / 2 : 0), e = Math.max(s + 0.0001, a1 - (pisah ? gapA / 2 : 0.0001));
      d.push(busur(s, e)); a0 = a1;
    });
    return d;
  };
  const mode = Gerak.grafik(kunciGrafik(el, 'donat'), ke, (a, b, e) => {
    const f = {}; new Set(Object.keys(a.f).concat(Object.keys(b.f))).forEach((k) => { f[k] = (a.f[k] || 0) + ((b.f[k] || 0) - (a.f[k] || 0)) * e; });
    return { sapu: a.sapu + (b.sapu - a.sapu) * e, f };
  }, { awal: { sapu: 0, f: ke.f }, durMasuk: 850, durMorph: 600 });
  const akhir = gambarBusur(ke);
  el.style.width = S + 'px';
  el.innerHTML = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${esc(cfg.aria || 'Grafik donat')}"><circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="var(--c-inset)" stroke-width="${sw}"/><g>${cfg.items.map((it, i) => `<path data-i="${i}" d="${akhir[i]}" fill="none" stroke="${it.color || SERI[i]}" stroke-width="${sw}" stroke-linecap="butt" style="transition:stroke-width .2s;cursor:pointer"/>`).join('')}</g></svg>${cfg.center ? `<div class="donut-center"><div><div class="v">${esc(cfg.center.v)}</div><div class="l">${esc(cfg.center.l)}</div></div></div>` : ''}`;
  const svg = $('svg', el), jalur = $$('path', svg);
  if (mode.jenis === 'morph') Gerak.putar(mode.st, svg, (k) => { gambarBusur(k).forEach((d, i) => jalur[i].setAttribute('d', d)); });
  const tip = tipEl(el);
  jalur.forEach((pa) => {
    const it = cfg.items[+pa.dataset.i];
    const on = () => { pa.setAttribute('stroke-width', sw + 5); tip.innerHTML = `<div class="h">${esc(it.name)}</div><div class="r"><span>Nilai</span><b>${esc((cfg.fmt || fmtNum)(it.value))}</b></div><div class="r"><span>Porsi</span><b>${fmtNum(it.value / total * 100, 1)}%</b></div>`; tip.classList.add('on'); tip.style.left = (S / 2 - 70) + 'px'; tip.style.top = (S / 2 - 30) + 'px'; };
    pa.addEventListener('mouseenter', on); pa.addEventListener('touchstart', on, { passive: true });
    pa.addEventListener('mouseleave', () => { pa.setAttribute('stroke-width', sw); tip.classList.remove('on'); });
  });
}
function legendaDonat(items, fmt = fmtNum, total) {
  const t = total || items.reduce((a, x) => a + Math.max(0, x.value), 0) || 1;
  return `<div class="donut-legend">${items.map((it, i) => `<div class="r"><i class="sw" style="background:${it.color || SERI[i]}"></i><span>${esc(it.name)}</span><b>${esc(fmt(it.value))}</b><span class="muted xs" style="min-width:40px;text-align:right">${fmtNum(it.value / t * 100, 0)}%</span></div>`).join('')}</div>`;
}
/* ---------- Batang horizontal (daftar peringkat) ---------- */
function hbarHTML(items, opt = {}) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return `<div class="hbar">${items.map((it, i) => `<div class="r"><div class="nm">${it.foto ? `<img class="thumb s" src="${esc(it.foto)}" alt="" loading="lazy">` : `<i class="sw" style="background:${it.color || opt.color || 'var(--s1)'}"></i>`}<span class="truncate">${esc(it.name)}</span>${it.badge || ''}</div><div class="v">${esc((opt.fmt || fmtNum)(it.value))}${it.sub ? ` <span class="xs">${esc(it.sub)}</span>` : ''}</div><div class="track"><i data-w="${(it.value / max * 100).toFixed(1)}" style="background:${it.color || opt.color || 'var(--s1)'}"></i></div></div>`).join('')}</div>`;
}
/* Batang horizontal & meter: tumbuh saat pertama tampil, bergeser mulus dari lebar lama saat nilainya berubah */
function animasiBatang(root) {
  const view = (root.closest && root.closest('.content')) || root, SEL = '.track i[data-w], .meter > i[data-w]';
  const el = $$(SEL, root); if (!el.length) return;
  const semua = $$(SEL, view), now = Gerak.sekarang(), diam = Gerak.diam();
  let urut = 0;
  el.forEach((i) => {
    const ke = Math.max(0, Math.min(100, +i.dataset.w || 0)), kunci = 'bar|' + semua.indexOf(i);
    let st = Gerak.data.get(kunci);
    if (!st) { st = { dari: diam ? ke : 0, ke, t0: now + Math.min(urut++, 10) * 40 + 120, dur: 750 }; Gerak.data.set(kunci, st); }
    else if (st.ke !== ke) { st.dari = Gerak.nilaiKini(st, now); st.ke = ke; st.t0 = now; st.dur = 500; }
    const kini = Gerak.nilaiKini(st, now), selesai = st.t0 + st.dur;
    i.style.transition = 'none'; i.style.width = kini + '%';
    if (!diam && now < selesai && kini !== ke) {
      void i.offsetWidth;
      const tunda = Math.max(0, st.t0 - now);
      i.style.transition = `width ${Math.round(selesai - Math.max(now, st.t0))}ms cubic-bezier(.2,.7,.2,1) ${Math.round(tunda)}ms`;
      i.style.width = ke + '%';
    }
  });
}
/* ---------- Batang tersegmen (satu keseluruhan dibagi bagian) ---------- */
function segbarHTML(items, fmt = fmtNum) {
  const t = items.reduce((a, x) => a + Math.max(0, x.value), 0) || 1;
  return `<div class="segbar" role="img" aria-label="${esc(items.map((x) => x.name + ' ' + Math.round(x.value / t * 100) + '%').join(', '))}">${items.filter((x) => x.value > 0).map((x, i) => { const p = x.value / t * 100; return `<div style="flex-grow:${p};background:${x.color || SERI[i]}" title="${esc(x.name)}: ${esc(fmt(x.value))} (${fmtNum(p, 1)}%)">${p >= 12 ? fmtNum(p, 0) + '%' : ''}</div>`; }).join('')}</div><div class="legend mt-8">${items.map((x, i) => `<span><i class="sw" style="background:${x.color || SERI[i]}"></i>${esc(x.name)} • ${esc(fmt(x.value))}</span>`).join('')}</div>`;
}
/* ---------- Heatmap jam × hari ---------- */
function heatmapHTML(heat, jamDari = 8, jamSampai = 22) {
  const urut = [1, 2, 3, 4, 5, 6, 0], nm = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  let max = 1; urut.forEach((d) => { for (let h = jamDari; h <= jamSampai; h++) max = Math.max(max, heat[d][h] || 0); });
  const kol = jamSampai - jamDari + 1;
  let s = `<div class="heat" style="grid-template-columns:44px repeat(${kol},minmax(0,1fr))"><div></div>`;
  for (let h = jamDari; h <= jamSampai; h++) s += `<div class="hd">${h % 2 === 0 ? String(h).padStart(2, '0') : ''}</div>`;
  urut.forEach((d) => {
    s += `<div class="lb">${nm[d]}</div>`;
    for (let h = jamDari; h <= jamSampai; h++) { const v = heat[d][h] || 0, k = v / max; s += `<div class="c" title="${HARI[d]} ${String(h).padStart(2, '0')}.00 — ${v} cup" style="background:${v ? `color-mix(in srgb, var(--c-primary) ${Math.round(12 + k * 88)}%, var(--c-card))` : 'var(--c-inset)'}"></div>`; }
  });
  return s + `</div><div class="row between mt-8 xs muted"><span>Sepi</span><div style="flex:1;max-width:160px;height:8px;border-radius:99px;background:linear-gradient(90deg,color-mix(in srgb,var(--c-primary) 12%,var(--c-card)),var(--c-primary))"></div><span>Ramai (${max} cup)</span></div>`;
}
/* ---------- Sparkline ---------- */
function sparkSVG(vals, w = 120, h = 36, warna = 'var(--s1)') {
  if (!vals.length) return ''; const max = Math.max(1, ...vals), min = Math.min(...vals);
  const X = (i) => i * (w - 6) / Math.max(1, vals.length - 1) + 3, Y = (v) => h - 4 - (h - 8) * ((v - min) / Math.max(1, max - min));
  const d = vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${warna}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${X(vals.length - 1)}" cy="${Y(vals[vals.length - 1])}" r="3.5" fill="${warna}" stroke="var(--c-card)" stroke-width="2"/></svg>`;
}
