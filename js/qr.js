/* QR code mandiri (sama persis dengan QrLib di DocEngine.gs) + renderer SVG untuk browser */
'use strict';
var QR_ = (function () {
  var ECC_CW = [[-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]];
  var NUM_BLK = [[-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]];
  var FMT = [1, 0, 3, 2];
  function utf8(s) { var o = []; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c < 0x80) o.push(c); else if (c < 0x800) o.push(0xC0 | c >> 6, 0x80 | c & 63); else if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length) { var c2 = s.charCodeAt(++i), cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00); o.push(0xF0 | cp >> 18, 0x80 | cp >> 12 & 63, 0x80 | cp >> 6 & 63, 0x80 | cp & 63); } else o.push(0xE0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63); } return o; }
  function raw(v) { var r = (16 * v + 128) * v + 64; if (v >= 2) { var na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; } return r; }
  function dataCw(v, e) { return Math.floor(raw(v) / 8) - ECC_CW[e][v] * NUM_BLK[e][v]; }
  function align(v) { if (v === 1) return []; var na = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, r = [6]; for (var p = v * 4 + 10; r.length < na; p -= step) r.splice(1, 0, p); return r; }
  function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function divisor(d) { var r = []; for (var i = 0; i < d - 1; i++) r.push(0); r.push(1); var root = 1; for (var i2 = 0; i2 < d; i2++) { for (var j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
  function rem(data, div) { var r = div.map(function () { return 0; }); data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= mul(c, f); }); }); return r; }
  function ecc(data, v, e) {
    var nb = NUM_BLK[e][v], el = ECC_CW[e][v], rw = Math.floor(raw(v) / 8), ns = nb - rw % nb, sl = Math.floor(rw / nb), dv = divisor(el), bl = [], k = 0;
    for (var i = 0; i < nb; i++) { var dat = data.slice(k, k + sl - el + (i < ns ? 0 : 1)); k += dat.length; var ec = rem(dat, dv); if (i < ns) dat.push(0); bl.push(dat.concat(ec)); }
    var res = []; for (var i3 = 0; i3 < bl[0].length; i3++) for (var j = 0; j < bl.length; j++) if (i3 !== sl - el || j >= ns) res.push(bl[j][i3]);
    return res;
  }
  function encode(text, e) {
    e = e === undefined ? 1 : e;
    var data = utf8(String(text)), v, cap;
    for (v = 1; v <= 40; v++) { cap = dataCw(v, e) * 8; if (4 + (v < 10 ? 8 : 16) + data.length * 8 <= cap) break; }
    if (v > 40) throw new Error('Teks terlalu panjang untuk QR.');
    var bits = []; function ap(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    ap(4, 4); ap(data.length, v < 10 ? 8 : 16); data.forEach(function (b) { ap(b, 8); });
    ap(0, Math.min(4, cap - bits.length)); ap(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) ap(pad, 8);
    var cw = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cw.push(b); }
    var all = ecc(cw, v, e), n = v * 4 + 17, m = [], fn = [];
    for (var y = 0; y < n; y++) { m.push([]); fn.push([]); for (var x = 0; x < n; x++) { m[y].push(false); fn[y].push(false); } }
    function sf(x, y, d) { m[y][x] = d; fn[y][x] = true; }
    for (var t = 0; t < n; t++) { sf(6, t, t % 2 === 0); sf(t, 6, t % 2 === 0); }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(function (p) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var dd = Math.max(Math.abs(dx), Math.abs(dy)), xx = p[0] + dx, yy = p[1] + dy; if (xx >= 0 && xx < n && yy >= 0 && yy < n) sf(xx, yy, dd !== 2 && dd !== 4); } });
    var al = align(v), na = al.length;
    for (var a = 0; a < na; a++) for (var c = 0; c < na; c++) { if ((a === 0 && c === 0) || (a === 0 && c === na - 1) || (a === na - 1 && c === 0)) continue; for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) sf(al[a] + dx2, al[c] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1); }
    function fmt(mask) {
      var d = FMT[e] << 3 | mask, r = d; for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bb = (d << 10 | r) ^ 0x5412; function g(i) { return ((bb >>> i) & 1) !== 0; }
      for (var i1 = 0; i1 <= 5; i1++) sf(8, i1, g(i1)); sf(8, 7, g(6)); sf(8, 8, g(7)); sf(7, 8, g(8));
      for (var i2 = 9; i2 < 15; i2++) sf(14 - i2, 8, g(i2));
      for (var i3 = 0; i3 < 8; i3++) sf(n - 1 - i3, 8, g(i3));
      for (var i4 = 8; i4 < 15; i4++) sf(8, n - 15 + i4, g(i4));
      sf(8, n - 8, true);
    }
    fmt(0);
    if (v >= 7) { var r2 = v; for (var q = 0; q < 12; q++) r2 = (r2 << 1) ^ ((r2 >>> 11) * 0x1F25); var vb = v << 12 | r2; for (var q2 = 0; q2 < 18; q2++) { var bit = ((vb >>> q2) & 1) !== 0, aa = n - 11 + q2 % 3, bb2 = Math.floor(q2 / 3); sf(aa, bb2, bit); sf(bb2, aa, bit); } }
    var bi = 0;
    for (var right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < n; vert++) for (var jj = 0; jj < 2; jj++) {
        var xx2 = right - jj, up = ((right + 1) & 2) === 0, yy2 = up ? n - 1 - vert : vert;
        if (!fn[yy2][xx2] && bi < all.length * 8) { m[yy2][xx2] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
      }
    }
    function mask(k) { for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { if (fn[y][x]) continue; var inv; switch (k) { case 0: inv = (x + y) % 2 === 0; break; case 1: inv = y % 2 === 0; break; case 2: inv = x % 3 === 0; break; case 3: inv = (x + y) % 3 === 0; break; case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break; case 5: inv = x * y % 2 + x * y % 3 === 0; break; case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break; default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0; } if (inv) m[y][x] = !m[y][x]; } }
    function line(get) {
      var p = 0, run = 1, prev = get(0);
      for (var i = 1; i < n; i++) { var c = get(i); if (c === prev) run++; else { if (run >= 5) p += run - 2; run = 1; prev = c; } }
      if (run >= 5) p += run - 2;
      for (var i2 = 0; i2 + 6 < n; i2++) if (get(i2) && !get(i2 + 1) && get(i2 + 2) && get(i2 + 3) && get(i2 + 4) && !get(i2 + 5) && get(i2 + 6)) { var bf = true, af = true; for (var k = 1; k <= 4; k++) { if (i2 - k >= 0 && get(i2 - k)) bf = false; if (i2 + 6 + k < n && get(i2 + 6 + k)) af = false; } if (bf || af) p += 40; }
      return p;
    }
    function penalty() {
      var p = 0, dark = 0;
      for (var y = 0; y < n; y++) p += line(function (i) { return m[y][i]; });
      for (var x = 0; x < n; x++) p += line(function (i) { return m[i][x]; });
      for (var y2 = 0; y2 < n - 1; y2++) for (var x2 = 0; x2 < n - 1; x2++) { var c = m[y2][x2]; if (c === m[y2][x2 + 1] && c === m[y2 + 1][x2] && c === m[y2 + 1][x2 + 1]) p += 3; }
      for (var y3 = 0; y3 < n; y3++) for (var x3 = 0; x3 < n; x3++) if (m[y3][x3]) dark++;
      var tot = n * n, kk = Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1; return p + Math.max(0, kk) * 10;
    }
    var best = 0, bp = Infinity;
    for (var mk = 0; mk < 8; mk++) { mask(mk); fmt(mk); var pp = penalty(); if (pp < bp) { bp = pp; best = mk; } mask(mk); }
    mask(best); fmt(best);
    return { size: n, mod: m, versi: v };
  }
  function crcTable() { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t.push(c >>> 0); } return t; }
  var CRC = null;
  function crc32(bytes) { CRC = CRC || crcTable(); var c = 0xFFFFFFFF; for (var i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u32(v) { return [v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255]; }
  function pngBytes(text, scale, margin) {
    scale = scale || 4; margin = margin === undefined ? 2 : margin;
    var q = encode(text, 1), w = (q.size + margin * 2) * scale, rb = Math.ceil(w / 8), rawb = [];
    for (var y = 0; y < w; y++) {
      rawb.push(0); var my = Math.floor(y / scale) - margin;
      for (var bx = 0; bx < rb; bx++) { var byte = 0; for (var bit = 0; bit < 8; bit++) { var x = bx * 8 + bit, white = 1; if (x < w) { var mx = Math.floor(x / scale) - margin; if (mx >= 0 && my >= 0 && mx < q.size && my < q.size && q.mod[my][mx]) white = 0; } byte = (byte << 1) | white; } rawb.push(byte); }
    }
    var z = [0x78, 0x01], pos = 0;
    while (pos < rawb.length) { var len = Math.min(65535, rawb.length - pos), fin = pos + len >= rawb.length ? 1 : 0; z.push(fin, len & 255, len >>> 8, (~len) & 255, ((~len) >>> 8) & 255); for (var i = 0; i < len; i++) z.push(rawb[pos + i]); pos += len; }
    var a = 1, b2 = 0; for (var i2 = 0; i2 < rawb.length; i2++) { a = (a + rawb[i2]) % 65521; b2 = (b2 + a) % 65521; }
    z = z.concat(u32(((b2 << 16) | a) >>> 0));
    var out = [137, 80, 78, 71, 13, 10, 26, 10];
    function chunk(type, data) { var tb = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)], cd = tb.concat(data); out = out.concat(u32(data.length), cd, u32(crc32(cd))); }
    chunk('IHDR', u32(w).concat(u32(w), [1, 0, 0, 0, 0]));
    chunk('IDAT', z); chunk('IEND', []);
    return out.map(function (x) { return x > 127 ? x - 256 : x; });
  }
  return { encode: encode, pngBytes: pngBytes };
})();

QR_.svg = function (text, scale, margin) {
  scale = scale || 4; margin = margin === undefined ? 2 : margin;
  var q = QR_.encode(text, 1), n = q.size + margin * 2, d = '';
  for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.mod[y][x]) d += 'M' + (x + margin) + ',' + (y + margin) + 'h1v1h-1z';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" width="' + n * scale + '" height="' + n * scale + '" shape-rendering="crispEdges" role="img" aria-label="Kode QR verifikasi"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#1B2A3B"/></svg>';
};
