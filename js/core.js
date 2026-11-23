/* =====================================================================
   MINUMAN REMPAH PELAUT — core.js
   Utilitas, ikon, API (dedupe + batch otomatis + cache SWR + antrean offline),
   router, toast, modal, PIN pad, loader.
   ===================================================================== */
'use strict';

/* ---------------- DOM & format ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (v) => String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const x = Number(v); return isFinite(x) ? x : 0; };
const fmtNum = (v, d = 0) => num(v).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDec = (v) => { const x = Math.round(num(v) * 1000) / 1000; return x.toLocaleString('id-ID', { maximumFractionDigits: 3 }); };
const rp = (v) => (num(v) < 0 ? '-Rp ' : 'Rp ') + fmtNum(Math.abs(Math.round(num(v))));
const rpTanda = (v) => (num(v) < 0 ? '−Rp ' : '+Rp ') + fmtNum(Math.abs(Math.round(num(v))));   // selalu bertanda, untuk arus kas
const rpK = (v) => { const x = Math.abs(num(v)), s = num(v) < 0 ? '-' : ''; if (x >= 1e9) return s + 'Rp ' + fmtNum(x / 1e9, 1) + ' M'; if (x >= 1e6) return s + 'Rp ' + fmtNum(x / 1e6, x >= 1e7 ? 1 : 2) + ' jt'; if (x >= 1e3) return s + 'Rp ' + fmtNum(x / 1e3) + ' rb'; return s + 'Rp ' + fmtNum(x); };
const kompak = (v) => { const x = Math.abs(num(v)), s = num(v) < 0 ? '-' : ''; if (x >= 1e9) return s + fmtNum(x / 1e9, 1) + 'M'; if (x >= 1e6) return s + fmtNum(x / 1e6, 1) + 'jt'; if (x >= 1e3) return s + fmtNum(x / 1e3) + 'rb'; return s + fmtNum(x); };
const pct = (a, b) => (!b ? null : Math.round((a - b) / Math.abs(b) * 1000) / 10);
const parseRp = (s) => num(String(s || '').replace(/[^\d-]/g, ''));
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const uid = (n = 5) => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint8Array(n)); r.forEach((b) => { s += a[b % a.length]; }); return s; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- Tanggal WITA ---------------- */
const TZ = 'Asia/Makassar';
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const hariIni = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const jamKini = () => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(/^24/, '00');
const addDays = (ymd, k) => { const [y, m, d] = ymd.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + k)); return t.toISOString().slice(0, 10); };
const dowOf = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
function tgl(ymd, fmt = 'd MMM yyyy') {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); if (!m) return ymd || '-';
  const y = +m[1], mo = +m[2], d = +m[3], dw = dowOf(m[1] + '-' + m[2] + '-' + m[3]);
  return fmt.replace(/yyyy|MMMM|MMM|MM|dd|d|EEEE|EEE|HH|mm/g, (t) => ({ yyyy: y, MMMM: BULAN[mo - 1], MMM: BULAN[mo - 1].slice(0, 3), MM: String(mo).padStart(2, '0'), dd: String(d).padStart(2, '0'), d, EEEE: HARI[dw], EEE: HARI[dw].slice(0, 3), HH: m[4] || '00', mm: m[5] || '00' }[t]));
}
const sapaan = () => { const h = +jamKini().slice(0, 2); return h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam'; };
const awalBulan = (ymd = hariIni()) => ymd.slice(0, 8) + '01';
const relatif = (iso) => { if (!iso) return '-'; const t = Date.parse(iso.length === 19 ? iso + '+08:00' : iso); const d = (Date.now() - t) / 60000; if (d < 1) return 'baru saja'; if (d < 60) return Math.round(d) + ' mnt lalu'; if (d < 1440) return Math.round(d / 60) + ' jam lalu'; return tgl(iso, 'd MMM, HH:mm'); };

/* ---------------- Ikon (garis 24px, digambar khusus) ---------------- */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  grid: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  pos: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><path d="M8 15h.01M12 15h.01M16 15h.01M8 18h8"/>',
  cup: '<path d="M5 8h12l-1.2 11.2A2 2 0 0 1 13.8 21H8.2a2 2 0 0 1-2-1.8z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 2.5c-.6 1 .6 1.6 0 2.6M11.5 2.5c-.6 1 .6 1.6 0 2.6"/>',
  receipt: '<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15.5" r="1.3"/>',
  unlock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.6-1.8"/>',
  bag: '<path d="M5 8h14l-1 12.2a1 1 0 0 1-1 .8H7a1 1 0 0 1-1-.8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  box: '<path d="m21 8-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  stall: '<path d="M3 10h18l-2-5H5z"/><path d="M5 10v7h14v-7"/><circle cx="8" cy="19.5" r="1.5"/><circle cx="16" cy="19.5" r="1.5"/><path d="M12 10v7"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/><path d="M9 8h7M9 11.5h5"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M14 3v5h5v4"/><path d="m15 18 2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18.5 14.8c1.6.8 2.7 2.6 3 5.2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'chev-r': '<path d="m9 6 6 6-6 6"/>', 'chev-l': '<path d="m15 6-6 6 6 6"/>', 'chev-d': '<path d="m6 9 6 6 6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>', upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 3v3M16 3v3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'trend-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>', 'trend-down': '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  'arr-up': '<path d="M12 19V5M6 11l6-6 6 6"/>', 'arr-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  food: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18"/><path d="M17 3c-2 1.5-3 4-3 7h3v11"/>', truck: '<path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.8-2.6-6-4.2-8.7-.6 2-1.6 3-2.8 3.4C12.8 7 11 4.3 9 2.5 9 6 5 9 5 15.2 5 19.3 8 22 12 22z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 21v-5h-5"/>',
  wifi: '<path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5.5 12a10 10 0 0 1 13 0"/><path d="M9 15.5a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/>',
  'wifi-off': '<path d="m3 3 18 18"/><path d="M9 15.5a5 5 0 0 1 6 0M5.5 12a10 10 0 0 1 4-2.2M14.5 9.8a10 10 0 0 1 4 2.2M2 8.5a15 15 0 0 1 4.5-3M11 5.1a15 15 0 0 1 11 3.4"/>',
  cloud: '<path d="M7 18h10.5a4.5 4.5 0 0 0 .6-9 6 6 0 0 0-11.4 1.5A3.75 3.75 0 0 0 7 18z"/>', shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14.5 8.5l2 2"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>', more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>', anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14"/><path d="M5 13H3a9 9 0 0 0 18 0h-2"/><path d="M8.5 10h7"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.5h.01"/>', 'check-c': '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
  backspace: '<path d="M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="m11 9 6 6M17 9l-6 6"/>', copy: '<rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
  send: '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>', sign: '<path d="M3 21c3-1 4.5-3 6-3s1.5 2 3 2 3-2 4.5-2"/><path d="M14 4l4 4-8 8H6v-4z"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.2 0 2-.8 2-2 0-.6-.3-1-.6-1.4-.3-.4-.5-.8-.5-1.3 0-1 .9-1.8 2-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  type: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>', sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  scale: '<path d="M12 3v18M7 21h10"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>', history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  leaf: '<path d="M5 19c10 0 15-6 15-15C10 4 4 9 4 15c0 1.5.4 3 1 4z"/><path d="M5 19c3-5 6-8 10-10"/>', cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>',
  pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>', bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', cart: '<circle cx="8" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M2.5 3.5H5l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 8H6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', 'ext': '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>',
  users1: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'
};
const ic = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.info}</svg>`;

/* ---------------- Status jaringan ---------------- */
const Net = {
  online: navigator.onLine, sim: localStorage.getItem('rp:simoff') === '1',
  get up() { return this.online && !this.sim; },
  set(sim) { this.sim = sim; localStorage.setItem('rp:simoff', sim ? '1' : '0'); document.dispatchEvent(new CustomEvent('net')); }
};
addEventListener('online', () => { Net.online = true; document.dispatchEvent(new CustomEvent('net')); Antrean.sinkron({ diam: true }); });
addEventListener('offline', () => { Net.online = false; document.dispatchEvent(new CustomEvent('net')); });

/* ---------------- Pengukur kinerja (console: Perf.table()) ---------------- */
const Perf = {
  log: [], add(e) { this.log.push(e); if (this.log.length > 200) this.log.shift(); },
  table() { console.table(this.log.map((x) => ({ aksi: x.a, total_ms: x.t, server_ms: x.s, jaringan_ms: x.t - (x.s || 0), cache: x.c ? '✓' : '' }))); },
  summary() { const m = {}; this.log.forEach((x) => { const k = m[x.a] || (m[x.a] = { n: 0, t: 0 }); k.n++; k.t += x.t; }); console.table(Object.keys(m).map((k) => ({ aksi: k, panggilan: m[k].n, rata_ms: Math.round(m[k].t / m[k].n) }))); }
};
window.Perf = Perf;

/* ---------------- Garis progres atas ---------------- */
const Topline = {
  n: 0, el: null,
  start() { this.el = this.el || $('#topline'); if (!this.el) return; this.n++; this.el.classList.add('on'); this.el.style.width = '35%'; clearTimeout(this.t); this.t = setTimeout(() => { if (this.n) this.el.style.width = '75%'; }, 500); },
  done() { if (!this.el) return; this.n = Math.max(0, this.n - 1); if (!this.n) { this.el.style.width = '100%'; setTimeout(() => { if (!this.n) { this.el.classList.remove('on'); this.el.style.width = '0'; } }, 300); } }
};

/* ---------------- API ---------------- */
const READ_RE = /(\.(list|get|status)$)|^(boot|hariIni|dashboard|analitik|ping|publik\.boot|de\.ringkas|pengaturan\.get|sistem\.status|audit\.list|de\.dokumen\.prefill)$/;
const API = {
  url: ((window.APP_CONFIG || {}).GAS_URL || '').trim(),
  token: localStorage.getItem('rp:tok') || '',
  epoch: 0, inflight: {}, q: null,
  // URL /exec akun Gmail (…/macros/s/ID/exec) & Workspace (…/a/macros/domain/s/ID/exec); placeholder GANTI/XXXX ditolak
  siap() { const u = String(this.url || '').trim(); if (/GANTI|XXXX/i.test(u)) return false; return /^https:\/\/script\.google\.com\/(a\/macros\/[^/]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(u) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u); },
  setToken(t) { this.token = t || ''; if (t) localStorage.setItem('rp:tok', t); else localStorage.removeItem('rp:tok'); },
  async raw(action, data) {
    if (!Net.up) throw Object.assign(new Error('Perangkat sedang offline.'), { offline: true });
    const t0 = performance.now(), ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch(this.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: this.token, data: data || {} }), signal: ctrl.signal, redirect: 'follow' });
      const j = await res.json();
      Perf.add({ a: action, t: Math.round(performance.now() - t0), s: j.ms, c: j.cached });
      if (j.code === 'AUTH' && !/^(auth\.login|publik\.boot)$/.test(action)) setTimeout(() => App.sesiHabis(), 0);
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Server terlalu lama merespons. Periksa sinyal lalu coba lagi.');
      throw Object.assign(new Error('Gagal terhubung ke server.'), { offline: true });
    } finally { clearTimeout(to); }
  },
  /* baca identik yang sedang berjalan → menumpang; epoch tulis mencegah baca basi */
  call(action, data) {
    if (!READ_RE.test(action)) { this.epoch++; return this.raw(action, data); }
    const k = this.epoch + '|' + action + '|' + JSON.stringify(data || {});
    if (this.inflight[k]) return this.inflight[k];
    const p = this.raw(action, data); this.inflight[k] = p;
    p.then(() => delete this.inflight[k], () => delete this.inflight[k]);
    return p;
  },
  /* penggabung batch otomatis: baca dalam tik yang sama → 1 eksekusi server */
  batch(action, data) {
    return new Promise((resolve, reject) => {
      if (!this.q) { this.q = []; setTimeout(() => this.flush(), 0); }
      this.q.push({ action, data: data || {}, resolve, reject });
    });
  },
  async flush() {
    const q = this.q; this.q = null;
    const uniq = []; const map = {};
    q.forEach((x) => { const k = x.action + '|' + JSON.stringify(x.data); if (!map[k]) { map[k] = []; uniq.push(x); } map[k].push(x); });
    for (let i = 0; i < uniq.length; i += 12) {
      const part = uniq.slice(i, i + 12);
      try {
        if (part.length === 1) { const r = await this.call(part[0].action, part[0].data); map[part[0].action + '|' + JSON.stringify(part[0].data)].forEach((x) => x.resolve(r)); continue; }
        const r = await this.call('batch', { calls: part.map((x) => ({ action: x.action, data: x.data })) });
        part.forEach((x, j) => { const v = r.success ? r.data[j] : r; map[x.action + '|' + JSON.stringify(x.data)].forEach((y) => y.resolve(v)); });
      } catch (e) { part.forEach((x) => map[x.action + '|' + JSON.stringify(x.data)].forEach((y) => y.reject(e))); }
    }
  },
  warm(scope) { if (!this.siap() || !Net.up) return; const k = 'rp:warm:' + scope; if (Date.now() - num(sessionStorage.getItem(k)) < 240000) return; sessionStorage.setItem(k, Date.now()); fetch(this.url + '?w=' + scope, { mode: 'no-cors' }).catch(() => { }); }
};

/* ---------------- Cache SWR (localStorage + memori) ---------------- */
const Cache = {
  mem: {},
  key: (a, d) => a + '|' + JSON.stringify(d || {}),
  get(k) { if (this.mem[k]) return this.mem[k]; try { const v = JSON.parse(localStorage.getItem('rp:c:' + k)); if (v) this.mem[k] = v; return v; } catch (e) { return null; } },
  set(k, d) {
    const v = { t: Date.now(), d, h: hashStr(JSON.stringify(d)) }; this.mem[k] = v;
    try { localStorage.setItem('rp:c:' + k, JSON.stringify(v)); } catch (e) { this.prune(); try { localStorage.setItem('rp:c:' + k, JSON.stringify(v)); } catch (e2) { } }
    return v;
  },
  basi() { Object.keys(this.mem).forEach((k) => { this.mem[k].t = 0; }); Object.keys(localStorage).filter((k) => k.startsWith('rp:c:')).forEach((k) => { try { const v = JSON.parse(localStorage.getItem(k)); v.t = 0; localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }); },
  prune() { Object.keys(localStorage).filter((k) => k.startsWith('rp:c:')).forEach((k) => localStorage.removeItem(k)); },
  hapusSemua() { this.mem = {}; this.prune(); localStorage.removeItem('rp:boot'); }
};
/* pakai(): tampilkan cache seketika, segarkan di latar bila basi, render ulang hanya bila data berubah */
function pakai(action, data, render, opt = {}) {
  const k = Cache.key(action, data), c = Cache.get(k), maxAge = opt.maxAge === undefined ? 30000 : opt.maxAge;
  if (c) render(c.d, { cached: true });
  if (c && !opt.force && Date.now() - c.t < maxAge) return Promise.resolve(c.d);
  Topline.start();
  return API.batch(action, data).then((res) => {
    if (res && res.success) { const baru = Cache.set(k, res.data); if (!c || c.h !== baru.h || opt.force) render(res.data, { cached: false }); return res.data; }
    if (!c && opt.onError) opt.onError(res ? res.message : 'Gagal memuat');
    else if (res && res.code !== 'AUTH') toast(res.message || 'Gagal memuat data', 'error');
  }).catch((e) => { if (!c && opt.onError) opt.onError(e.message); else if (!c) toast(e.message, 'error'); }).finally(() => Topline.done());
}
function prefetch(list) { list.forEach(([a, d]) => { const k = Cache.key(a, d), c = Cache.get(k); if (c && Date.now() - c.t < 60000) return; API.batch(a, d).then((r) => { if (r && r.success) Cache.set(k, r.data); }).catch(() => { }); }); }

/* Aksi tulis dengan loader + toast + invalidasi cache */
async function tulis(action, data, opt = {}) {
  if (opt.loader !== false) Loader.show(opt.teks || 'Menyimpan data…', opt.sub || 'Menyinkronkan ke Google Sheets');
  try {
    const r = await API.call(action, data);
    if (r.success) {
      Cache.basi();
      if (opt.loader !== false) await Loader.sukses(opt.ok || r.message); else if (opt.toast !== false) toast(r.message, 'success');
      return r;
    }
    if (opt.loader !== false) Loader.hide();
    if (r.code !== 'AUTH') toast(r.message, 'error', opt.judulGagal || 'Belum berhasil');
    return r;
  } catch (e) {
    if (opt.loader !== false) Loader.hide();
    if (e.offline && opt.antre) { Antrean.tambah(action, data, opt.antre); return { success: true, offline: true, data: null }; }
    toast(e.message, 'error', 'Gagal terhubung');
    return { success: false, message: e.message };
  }
}

/* ---------------- Antrean offline (POS & biaya) ---------------- */
const Antrean = {
  busy: false,
  list() { try { return JSON.parse(localStorage.getItem('rp:q') || '[]'); } catch (e) { return []; } },
  simpan(l) { localStorage.setItem('rp:q', JSON.stringify(l)); document.dispatchEvent(new CustomEvent('antrean')); },
  tambah(action, data, label) {
    const l = this.list(); data = Object.assign({}, data, { offline: true });
    if (!l.some((x) => x.data.id === data.id)) l.push({ action, data, label: label || action, t: Date.now(), coba: 0 });
    this.simpan(l);
    toast('Tersimpan di perangkat. Akan dikirim otomatis saat sinyal kembali.', 'warning', 'Mode offline');
  },
  async sinkron(opt = {}) {
    if (this.busy || !Net.up || !API.token) return;
    let l = this.list(); if (!l.length) return;
    this.busy = true; document.dispatchEvent(new CustomEvent('antrean'));
    let ok = 0, gagal = 0;
    for (const it of l.slice()) {
      try {
        const r = await API.raw(it.action, it.data);
        if (r.success) { ok++; l = l.filter((x) => x !== it); }
        else if (r.code === 'AUTH') break;
        else { it.coba++; it.galat = r.message; gagal++; if (it.coba >= 5) { l = l.filter((x) => x !== it); const g = JSON.parse(localStorage.getItem('rp:qgagal') || '[]'); g.push(it); localStorage.setItem('rp:qgagal', JSON.stringify(g)); } }
      } catch (e) { break; }
      this.simpan(l);
    }
    this.busy = false; this.simpan(l);
    if (ok) { Cache.basi(); toast(ok + ' data offline berhasil dikirim ke server.', 'success', 'Sinkron selesai'); App.segarkan && App.segarkan(); }
    if (gagal && !opt.diam) toast(gagal + ' data ditolak server: ' + (l[0] && l[0].galat || ''), 'error');
  }
};
setInterval(() => { if (Antrean.list().length) Antrean.sinkron({ diam: true }); }, 20000);

/* ---------------- Toast ---------------- */
function toast(msg, type = 'info', judul) {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; document.body.appendChild(box); }
  const ikon = { success: 'check-c', error: 'alert', warning: 'alert', info: 'info' }[type] || 'info';
  const dur = type === 'error' ? 5200 : 3400;
  const el = document.createElement('div'); el.className = 'toast ' + type; el.setAttribute('role', 'status');
  el.innerHTML = `${ic(ikon)}<div class="tx">${judul ? '<b>' + esc(judul) + '</b>' : ''}${esc(msg)}</div><i class="bar" style="animation-duration:${dur}ms"></i>`;
  el.onclick = () => tutup(); box.appendChild(el);
  const tutup = () => { el.classList.add('out'); setTimeout(() => el.remove(), 260); };
  setTimeout(tutup, dur);
  while (box.children.length > 4) box.firstChild.remove();
}

/* ---------------- Loader proses (kompas + uap rempah) ---------------- */
const KOMPAS_SVG = `<svg viewBox="0 0 64 64" class="rose"><circle cx="32" cy="32" r="29" fill="none" stroke="var(--c-border)" stroke-width="2"/><path d="M32 6 37 32 32 58 27 32Z" fill="var(--c-primary)"/><path d="M32 6 37 32H27Z" fill="var(--c-danger)"/><path d="M6 32 32 27 58 32 32 37Z" fill="var(--c-secondary)" opacity=".55"/><circle cx="32" cy="32" r="4" fill="var(--c-card)" stroke="var(--c-secondary)" stroke-width="2"/></svg>`;
const Loader = {
  el: null, t0: 0, subTimer: null,
  show(teks = 'Memproses…', sub = '') {
    if (!this.el) { this.el = document.createElement('div'); this.el.className = 'loader'; document.body.appendChild(this.el); }
    this.el.className = 'loader'; this.t0 = Date.now();
    this.el.innerHTML = `<div class="loader-box" role="alert" aria-busy="true"><div class="loader-art"><div class="ring"></div><div class="ring r2"></div>${KOMPAS_SVG}<div class="steam"><i></i><i></i><i></i></div></div><div class="loader-text">${esc(teks)}</div><div class="loader-sub">${esc(sub)}</div><div class="loader-prog"><i></i></div></div>`;
    const subs = ['Menghubungi server Google…', 'Mencatat ke Google Sheets…', 'Merapikan pembukuan…', 'Hampir selesai…'];
    let i = 0; clearInterval(this.subTimer);
    this.subTimer = setInterval(() => { const s = $('.loader-sub', this.el); if (s) { s.style.opacity = 0; setTimeout(() => { s.textContent = subs[i++ % subs.length]; s.style.opacity = 1; }, 250); } }, 2600);
  },
  async sukses(teks) {
    if (!this.el) return; clearInterval(this.subTimer);
    const minimal = 450 - (Date.now() - this.t0); if (minimal > 0) await sleep(minimal);
    const box = $('.loader-box', this.el); if (!box) return;
    box.classList.add('loader-done');
    $('.loader-art', box).innerHTML = `<div class="ring" style="border-color:var(--c-success)"></div><svg viewBox="0 0 64 64" class="rose cek-svg" style="animation:none"><circle cx="32" cy="32" r="22" fill="var(--c-success-t)"/><path d="m21 33 7 7 15-16" fill="none" stroke="var(--c-success)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    $('.loader-text', box).textContent = 'Berhasil'; $('.loader-sub', box).textContent = teks ? String(teks).slice(0, 90) : ''; $('.loader-prog', box).style.display = 'none';
    await sleep(650); this.hide();
  },
  hide() { clearInterval(this.subTimer); if (!this.el) return; const el = this.el; this.el = null; el.classList.add('out'); setTimeout(() => el.remove(), 300); }
};

/* ---------------- Modal / sheet ---------------- */
const Modal = {
  stack: [],
  open({ title = '', sub = '', body = '', foot = '', size = '', onMount, onClose, tutupLuar = true } = {}) {
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true"><div class="modal-head"><div class="grow"><h2>${title}</h2>${sub ? `<div class="muted small mt-4">${sub}</div>` : ''}</div><button class="drawer-x" data-x aria-label="Tutup">${ic('x')}</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
    document.body.appendChild(ov); document.body.style.overflow = 'hidden';
    const m = { el: $('.modal', ov), ov, close: (v) => { if (m.closed) return; m.closed = true; ov.classList.add('out'); setTimeout(() => { ov.remove(); if (!$('.overlay')) document.body.style.overflow = ''; }, 220); this.stack = this.stack.filter((x) => x !== m); onClose && onClose(v); } };
    $('[data-x]', ov).onclick = () => m.close();
    ov.addEventListener('mousedown', (e) => { if (e.target === ov && tutupLuar) m.close(); });
    this.stack.push(m);
    onMount && onMount(m.el, m);
    setTimeout(() => { const f = $('input:not([type=hidden]):not([readonly]), select, textarea', m.el); if (f && innerWidth > 768) f.focus(); }, 80);
    return m;
  },
  closeTop() { const m = this.stack[this.stack.length - 1]; if (m) m.close(); }
};
addEventListener('keydown', (e) => { if (e.key === 'Escape') Modal.closeTop(); });
function konfirmasi({ title = 'Yakin?', text = '', ok = 'Ya, lanjutkan', batal = 'Batal', danger = false, ikon = 'alert' } = {}) {
  return new Promise((res) => {
    const m = Modal.open({ title, size: 'sm', body: `<div class="row top"><div class="icon-box ${danger ? 'danger' : 'warning'}">${ic(ikon)}</div><div class="muted">${text}</div></div>`, foot: `<button class="btn" data-b>${esc(batal)}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button>`, onClose: (v) => res(!!v) });
    $('[data-b]', m.el).onclick = () => m.close(false); $('[data-ok]', m.el).onclick = () => m.close(true);
  });
}
function mintaTeks({ title, label, placeholder = '', ok = 'Simpan', min = 0, area = false } = {}) {
  return new Promise((res) => {
    const m = Modal.open({ title, size: 'sm', body: `<div class="field"><label>${esc(label)}</label>${area ? `<textarea class="input" id="mt" placeholder="${esc(placeholder)}"></textarea>` : `<input class="input" id="mt" placeholder="${esc(placeholder)}">`}</div>`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${esc(ok)}</button>`, onClose: (v) => res(v === undefined ? null : v) });
    $('[data-b]', m.el).onclick = () => m.close(null);
    $('[data-ok]', m.el).onclick = () => { const v = $('#mt', m.el).value.trim(); if (v.length < min) { $('#mt', m.el).classList.add('err'); return; } m.close(v); };
  });
}

/* ---------------- PIN pad ---------------- */
function pinPadHTML() {
  const huruf = ['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
  let s = '<div class="pin-pad">';
  for (let i = 1; i <= 9; i++) s += `<button type="button" data-k="${i}">${i}<small>${huruf[i - 1] || '&nbsp;'}</small></button>`;
  s += `<button type="button" class="alt" data-k="C">Reset</button><button type="button" data-k="0">0<small>&nbsp;</small></button><button type="button" class="alt" data-k="B" aria-label="Hapus">${ic('backspace')}</button></div>`;
  return s;
}
function pasangPinPad(root, onDone, panjang = 6) {
  let pin = '';
  const dots = $('.pin-dots', root);
  const gambar = () => { dots.innerHTML = Array.from({ length: panjang }, (_, i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join(''); };
  const tekan = (k) => {
    if (k === 'C') pin = ''; else if (k === 'B') pin = pin.slice(0, -1); else if (pin.length < panjang) pin += k;
    gambar(); if (navigator.vibrate) navigator.vibrate(8);
    if (pin.length === panjang) { const v = pin; setTimeout(() => onDone(v, api), 120); }
  };
  const api = { reset(err) { pin = ''; gambar(); if (err) { dots.classList.add('err'); setTimeout(() => dots.classList.remove('err'), 500); } }, get: () => pin };
  $$('.pin-pad button', root).forEach((b) => b.addEventListener('click', () => tekan(b.dataset.k)));
  const onKey = (e) => { if (!root.isConnected) return removeEventListener('keydown', onKey); if (/^\d$/.test(e.key)) tekan(e.key); else if (e.key === 'Backspace') tekan('B'); };
  addEventListener('keydown', onKey);
  gambar();
  return api;
}
function mintaPin({ title = 'Konfirmasi PIN', sub = 'Masukkan 6 digit PIN Anda' } = {}) {
  return new Promise((res) => {
    const m = Modal.open({ title, sub, size: 'sm', body: `<div class="pin-dots"></div>${pinPadHTML()}`, onClose: (v) => res(v || null) });
    pasangPinPad(m.el, (pin) => m.close(pin));
  });
}

/* ---------------- Efek riak & segmented control ---------------- */
document.addEventListener('pointerdown', (e) => {
  const t = e.target.closest('.btn, .chip, .qa, .nav a, .bottom-nav a'); if (!t) return;
  const r = t.getBoundingClientRect(), s = Math.max(r.width, r.height);
  const sp = document.createElement('span'); sp.className = 'ripple';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
  t.style.overflow = 'hidden'; t.appendChild(sp); setTimeout(() => sp.remove(), 650);
}, { passive: true });
function segHTML(opsi, nilai, cls = '') { return `<div class="seg ${cls}" role="tablist"><span class="ind"></span>${opsi.map((o) => `<button type="button" data-v="${esc(o.v)}" class="${String(o.v) === String(nilai) ? 'on' : ''}">${esc(o.l)}</button>`).join('')}</div>`; }
function pasangSeg(el, onChange) {
  const ind = $('.ind', el);
  const geser = () => { const on = $('button.on', el); if (on && ind) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; } };
  $$('button', el).forEach((b) => b.addEventListener('click', () => { $$('button', el).forEach((x) => x.classList.remove('on')); b.classList.add('on'); geser(); onChange && onChange(b.dataset.v); }));
  requestAnimationFrame(geser); new ResizeObserver(geser).observe(el);
}
function animasiAngka(el, ke, fmt = rp, dur = 900) {
  if (!el) return; const dari = num(el.dataset.v || 0); el.dataset.v = ke; if (dari === ke) { el.textContent = fmt(ke); return; }
  const t0 = performance.now(); const langkah = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(dari + (ke - dari) * e); if (p < 1) requestAnimationFrame(langkah); };
  requestAnimationFrame(langkah);
}
function deltaHTML(p, kebalik) {
  if (p === null || p === undefined || !isFinite(p)) return '<span class="delta flat">—</span>';
  const naik = p >= 0, baik = kebalik ? !naik : naik;
  return `<span class="delta ${p === 0 ? 'flat' : baik ? 'up' : 'down'}">${ic(naik ? 'arr-up' : 'arr-down', 'sm')}${fmtNum(Math.abs(p), 1)}%</span>`;
}
function badgeStatus(s) {
  const m = { 'Terkunci': 'success', 'Tersimpan': 'info', 'Terbuka': 'warning', 'Dibuka': 'danger', 'Aman': 'success', 'Menipis': 'warning', 'Kritis': 'danger', 'Habis': 'danger', 'Baik': 'success', 'Perlu Ganti': 'warning', 'Rusak': 'danger', 'Belanja': 'danger', 'TERBIT': 'success', 'MENUNGGU_TTD': 'warning', 'DRAF': 'info', 'DITARIK': 'danger', 'Antrean': 'warning' };
  const lbl = { MENUNGGU_TTD: 'Menunggu TTD', TERBIT: 'Terbit', DRAF: 'Draf', DITARIK: 'Ditarik', Antrean: 'Antrean Lokal' }[s] || s;
  return `<span class="badge ${m[s] || ''}">${esc(lbl)}</span>`;
}
function kosongHTML(teks = 'Belum ada data', ikon = 'box') { return `<div class="tbl-empty">${ic(ikon)}<div>${esc(teks)}</div></div>`; }
function pagerHTML(total, hal, per, label = 'data') {
  const n = Math.max(1, Math.ceil(total / per)); if (total <= per) return `<div class="pager"><span class="muted small">Menampilkan ${total} ${label}</span></div>`;
  const awal = Math.max(1, Math.min(hal - 2, n - 4)), akhir = Math.min(n, awal + 4); let b = '';
  for (let i = awal; i <= akhir; i++) b += `<button class="pg ${i === hal ? 'on' : ''}" data-pg="${i}">${i}</button>`;
  return `<div class="pager"><span class="muted small">Menampilkan ${Math.min(per, total - (hal - 1) * per)} dari ${fmtNum(total)} ${label}</span><div class="pages"><button class="pg" data-pg="${Math.max(1, hal - 1)}" aria-label="Sebelumnya">‹</button>${b}<button class="pg" data-pg="${Math.min(n, hal + 1)}" aria-label="Berikutnya">›</button></div></div>`;
}
const fotoUrl = (f, cadangan = 'assets/img/menu/default.svg') => !f ? cadangan : /^(https?:|data:)/.test(f) ? f : f;

/* ---------------- Tema dinamis (warna, font, radius) ---------------- */
const FONT_URL = { 'Playfair Display': 'Playfair+Display:wght@500;600;700', Lora: 'Lora:wght@500;600;700', 'DM Serif Display': 'DM+Serif+Display', Merriweather: 'Merriweather:wght@400;700', 'Cormorant Garamond': 'Cormorant+Garamond:wght@500;600;700', Fraunces: 'Fraunces:wght@500;600;700', Poppins: 'Poppins:wght@400;500;600;700', Inter: 'Inter:wght@400;500;600;700;800', 'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800', Nunito: 'Nunito:wght@400;600;700;800', 'DM Sans': 'DM+Sans:wght@400;500;600;700', Manrope: 'Manrope:wght@400;500;600;700;800', Lato: 'Lato:wght@400;700;900', 'Source Sans 3': 'Source+Sans+3:wght@400;600;700' };
function terapkanTema(app) {
  if (!app) return;
  const t = app.tema || {}, r = document.documentElement.style;
  const peta = { primary: '--c-primary', primaryHover: '--c-primary-h', secondary: '--c-secondary', bg: '--c-bg', card: '--c-card', text: '--c-text', muted: '--c-muted', border: '--c-border', success: '--c-success', danger: '--c-danger', warning: '--c-warning' };
  Object.keys(peta).forEach((k) => { if (t[k]) r.setProperty(peta[k], t[k]); });
  if (t.primary) r.setProperty('--s1', t.primary);
  if (t.radius) { r.setProperty('--radius', t.radius + 'px'); r.setProperty('--radius-md', Math.max(8, t.radius - 6) + 'px'); r.setProperty('--radius-sm', Math.max(6, Math.round(t.radius * .6)) + 'px'); }
  document.documentElement.classList.toggle('tanpa-kaca', t.kaca === false);
  const fh = app.fontJudul || 'Playfair Display', fb = app.fontIsi || 'Inter';
  r.setProperty('--font-head', `'${fh}', Georgia, serif`); r.setProperty('--font-body', `'${fb}', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);
  const fam = [fh, fb].filter((v, i, a) => a.indexOf(v) === i).map((f) => FONT_URL[f]).filter(Boolean);
  let link = $('#gfont'); const href = 'https://fonts.googleapis.com/css2?' + fam.map((f) => 'family=' + f).join('&') + '&display=swap';
  if (!link) { link = document.createElement('link'); link.id = 'gfont'; link.rel = 'stylesheet'; document.head.appendChild(link); }
  if (link.href !== href) link.href = href;
  const meta = $('meta[name=theme-color]'); if (meta && t.bg) meta.content = t.bg;
  if (app.nama) document.title = app.nama;
  try { localStorage.setItem('rp:tema', JSON.stringify({ tema: t, fontJudul: fh, fontIsi: fb, nama: app.nama, logo: app.logo })); } catch (e) { }
}
(function temaAwal() { try { const s = JSON.parse(localStorage.getItem('rp:tema') || 'null'); if (s) terapkanTema(s); } catch (e) { } })();

/* ---------------- Ekspor Excel / PDF (pustaka dimuat saat dibutuhkan) ---------------- */
const Lib = {
  muat(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat pustaka ekspor. Periksa koneksi internet.')); document.head.appendChild(s); }); },
  xlsx() { return window.XLSX ? Promise.resolve() : this.muat('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); },
  async pdf() { if (!window.jspdf) await this.muat('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'); if (!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable)) await this.muat('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'); }
};
/* kolom: [{k, l, t:'rp'|'num'|'tgl'|'txt'}] */
async function unduhExcel(nama, judul, kolom, baris, ringkasan) {
  Loader.show('Menyiapkan Excel…', 'Menyusun ' + fmtNum(baris.length) + ' baris');
  try {
    await Lib.xlsx();
    const head = kolom.map((k) => k.l);
    const data = baris.map((r) => kolom.map((k) => { const v = typeof k.f === 'function' ? k.f(r) : r[k.k]; return k.t === 'rp' || k.t === 'num' ? num(v) : v === undefined || v === null ? '' : String(v); }));
    const aoa = [[judul], [Store.app ? Store.app.nama + ' — ' + Store.app.lokasi : ''], ['Diunduh ' + tgl(hariIni(), 'd MMMM yyyy') + ' ' + jamKini() + ' WITA'], [], head].concat(data);
    if (ringkasan && ringkasan.length) { aoa.push([]); ringkasan.forEach((r) => aoa.push(r)); }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = kolom.map((k) => ({ wch: Math.min(40, Math.max(10, k.l.length + 2, ...data.slice(0, 200).map((r) => String(r[kolom.indexOf(k)]).length + 2))) }));
    kolom.forEach((k, ci) => { if (k.t === 'rp') for (let ri = 5; ri < 5 + data.length; ri++) { const ref = XLSX.utils.encode_cell({ r: ri, c: ci }); if (ws[ref]) ws[ref].z = '"Rp" #,##0'; } });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, judul.slice(0, 28).replace(/[\\/?*[\]:]/g, ' '));
    XLSX.writeFile(wb, nama + '.xlsx');
    await Loader.sukses('Berkas ' + nama + '.xlsx diunduh');
  } catch (e) { Loader.hide(); toast(e.message, 'error'); }
}
async function unduhPDF(nama, judul, kolom, baris, ringkasan, opsi = {}) {
  Loader.show('Menyiapkan PDF…', 'Menyusun tabel laporan');
  try {
    await Lib.pdf();
    const doc = new window.jspdf.jsPDF({ orientation: opsi.landscape || kolom.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(107, 74, 43); doc.rect(0, 0, W, 64, 'F');
    doc.setTextColor(251, 246, 234); doc.setFont('times', 'bold'); doc.setFontSize(16); doc.text(Store.app ? Store.app.nama : 'Minuman Rempah Pelaut', 36, 30);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text((Store.app ? Store.app.lokasi : '') + '  •  "' + (Store.app ? Store.app.tagline : '') + '"', 36, 46);
    doc.setTextColor(27, 42, 59); doc.setFont('times', 'bold'); doc.setFontSize(13); doc.text(judul, 36, 90);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(122, 111, 93); doc.text('Diunduh ' + tgl(hariIni(), 'd MMMM yyyy') + ' ' + jamKini() + ' WITA oleh ' + (Store.me ? Store.me.nama : ''), 36, 104);
    doc.autoTable({
      startY: 114, head: [kolom.map((k) => k.l)], body: baris.map((r) => kolom.map((k) => { const v = typeof k.f === 'function' ? k.f(r) : r[k.k]; return k.t === 'rp' ? rp(v) : k.t === 'num' ? fmtDec(v) : k.t === 'tgl' ? tgl(v, 'dd/MM/yyyy') : String(v === undefined || v === null ? '' : v); })),
      styles: { fontSize: 8, cellPadding: 4, textColor: [27, 42, 59], lineColor: [227, 213, 181], lineWidth: .4 }, headStyles: { fillColor: [184, 134, 45], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 246, 234] }, columnStyles: Object.fromEntries(kolom.map((k, i) => [i, k.t === 'rp' || k.t === 'num' ? { halign: 'right' } : {}])),
      margin: { left: 36, right: 36 }, didDrawPage: () => { doc.setFontSize(8); doc.setTextColor(150); doc.text('Halaman ' + doc.internal.getNumberOfPages(), W - 90, doc.internal.pageSize.getHeight() - 18); }
    });
    if (ringkasan && ringkasan.length) {
      let y = doc.lastAutoTable.finalY + 18; doc.setFontSize(9.5); doc.setTextColor(27, 42, 59);
      ringkasan.forEach((r) => { if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 50; } doc.setFont('helvetica', 'bold'); doc.text(String(r[0]), 36, y); doc.setFont('helvetica', 'normal'); doc.text(String(r[1]), W - 36, y, { align: 'right' }); y += 15; });
    }
    doc.save(nama + '.pdf');
    await Loader.sukses('Berkas ' + nama + '.pdf diunduh');
  } catch (e) { Loader.hide(); toast(e.message, 'error'); }
}
function unduhBase64(nama, b64, mime = 'application/pdf') {
  const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([arr], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function bukaBase64(b64) {
  const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  window.open(URL.createObjectURL(new Blob([arr], { type: 'application/pdf' })), '_blank');
}
/* kompres foto sebelum diunggah (≤ 900 px, JPEG 0.82) */
function kompresFoto(file, maks = 900) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('Pilih berkas gambar.'));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, maks / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .82)); };
    img.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); img.src = url;
  });
}
