/* =====================================================================
   MINUMAN REMPAH PELAUT — core.js
   Utilitas, ikon, API (dedupe + batch otomatis + cache SWR + antrean offline),
   toast, modal, PIN pad, loader, pratinjau dokumen, checklist, status sinkron.
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
const sapaan = () => { const h = +jamKini().slice(0, 2); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; };
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
  users1: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  'check-sq': '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>'
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
const VERSI_APP = '1.2.0';
/* Versi 1.2 hanya mengubah tampilan: tetap memakai API server 1.1 (berkas .gs tidak perlu diganti).
   Server dianggap cocok bila versinya >= VERSI_API_MIN (mayor.minor). */
const VERSI_API_MIN = '1.1';
function serverCocok(sv) {
  if (!sv) return true;
  const a = String(sv).split('.').map(Number), b = VERSI_API_MIN.split('.').map(Number);
  return a[0] > b[0] || (a[0] === b[0] && (a[1] || 0) >= b[1]);
}
const READ_RE = /(\.(list|get|status)$)|^(boot|hariIni|dashboard|analitik|ping|publik\.boot|de\.ringkas|pengaturan\.get|sistem\.status|audit\.list|de\.dokumen\.prefill)$/;
const API = {
  url: ((window.APP_CONFIG || {}).GAS_URL || '').trim(),
  token: localStorage.getItem('rp:tok') || '',
  epoch: 0, inflight: {}, q: null,
  status: { t: 0, ok: null, sebab: '' },                 // kontak terakhir dengan server (untuk indikator & Tes Koneksi)
  versiServer: '',
  // URL /exec akun Gmail (…/macros/s/ID/exec) & Workspace (…/a/macros/domain/s/ID/exec); placeholder GANTI/XXXX ditolak
  siap() { const u = String(this.url || '').trim(); if (/GANTI|XXXX/i.test(u)) return false; return /^https:\/\/script\.google\.com\/(a\/macros\/[^/]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(u) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u); },
  setToken(t) { this.token = t || ''; if (t) localStorage.setItem('rp:tok', t); else localStorage.removeItem('rp:tok'); },
  catat(ok, sebab) { this.status = { t: Date.now(), ok, sebab: sebab || '' }; document.dispatchEvent(new CustomEvent('server')); },
  /* Satu-satunya pintu ke Google Apps Script: fetch POST ke URL /exec (redirect Google diikuti otomatis).
     Galat dibedakan: (a) jaringan/tidak terjangkau → offline:true (boleh diantre), (b) server membalas
     bukan JSON → code 'SERVER' (TIDAK diantre diam-diam; biasanya salah deploy/URL). */
  async raw(action, data) {
    if (!Net.up) throw Object.assign(new Error('Perangkat sedang offline.'), { offline: true });
    const t0 = performance.now(), ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 60000);
    let res;
    try {
      res = await fetch(this.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: this.token, data: data || {} }), signal: ctrl.signal, redirect: 'follow', cache: 'no-store' });
    } catch (e) {
      clearTimeout(to);
      if (e.name === 'AbortError') { this.catat(false, 'lambat'); throw Object.assign(new Error('Server terlalu lama merespons. Periksa sinyal lalu coba lagi.'), { offline: true }); }
      this.catat(false, 'jaringan');
      throw Object.assign(new Error('Server Google tidak dapat dihubungi.'), { offline: true });
    }
    clearTimeout(to);
    let teks = '', j = null;
    try { teks = await res.text(); j = JSON.parse(teks); } catch (e) { j = null; }
    if (!j || typeof j !== 'object') {
      this.catat(false, 'bukan-json');
      throw Object.assign(new Error(res.ok ? 'Server membalas halaman, bukan data aplikasi. Periksa deploy Web App (Execute as: Me, Who has access: Anyone) dan URL /exec di js/config.js.' : 'Server membalas galat HTTP ' + res.status + '. Periksa URL /exec dan deploy Web App.'), { code: 'SERVER' });
    }
    this.catat(true);
    if (j.v && j.v !== this.versiServer) { this.versiServer = j.v; document.dispatchEvent(new CustomEvent('versi')); }
    Perf.add({ a: action, t: Math.round(performance.now() - t0), s: j.ms, c: j.cached });
    if (j.code === 'AUTH' && !/^(auth\.login|publik\.boot)$/.test(action)) setTimeout(() => App.sesiHabis(), 0);
    return j;
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
    if (res && res.success) { const baru = Cache.set(k, res.data); if (!c || c.h !== baru.h) render(res.data, { cached: false }); return res.data; }
    if (!c && opt.onError) opt.onError(res ? res.message : 'Gagal memuat');
    else if (res && res.code !== 'AUTH') toast(res.message || 'Gagal memuat data', 'error');
  }).catch((e) => { if (!c && opt.onError) opt.onError(e.message); else if (!c) toast(e.message, 'error'); }).finally(() => Topline.done());
}
function prefetch(list) { list.forEach(([a, d]) => { const k = Cache.key(a, d), c = Cache.get(k); if (c && Date.now() - c.t < 60000) return; API.batch(a, d).then((r) => { if (r && r.success) Cache.set(k, r.data); }).catch(() => { }); }); }

/* Aksi tulis.
   - Proses cepat tidak memunculkan layar loading (hanya garis progres + tombol sibuk) → tidak ada kedipan.
     Layar loading muncul hanya bila proses > 0,65 detik.
   - Bila server meminta PIN (aturan "aksi wajib PIN") atau alasan koreksi hari terkunci,
     dialog muncul lalu permintaan diulang otomatis.
   - Gagal jaringan + opt.antre → disimpan di antrean perangkat (status Pending). */
async function tulis(action, data, opt = {}) {
  const btn = opt.btn || null; if (btn) btn.classList.add('busy');
  let tunda = null;
  const mulaiLoader = () => { if (opt.loader === false) return; clearTimeout(tunda); tunda = setTimeout(() => Loader.show(opt.teks || 'Menyimpan…', opt.sub || 'Mengirim ke Google Sheets'), opt.segera ? 0 : 650); };
  const jeda = () => { clearTimeout(tunda); Loader.hide(); };
  const selesai = () => { jeda(); Topline.done(); if (btn) btn.classList.remove('busy'); };
  Topline.start(); mulaiLoader();
  try {
    let r = await API.call(action, data), ulang = 0;
    while (r && !r.success && ulang < 4) {
      let tambah = null;
      if (r.code === 'PIN_DIPERLUKAN' || (r.code === 'PIN' && data && data.pin)) {
        jeda();
        const pin = await mintaPin({ title: opt.pinTtd ? 'Tanda tangan' : 'Konfirmasi dengan PIN', sub: r.code === 'PIN' ? r.message : (opt.pinSub || 'Tindakan ini perlu PIN Anda.'), ttd: !!opt.pinTtd });
        if (!pin) { selesai(); return { success: false, batal: true, message: 'Dibatalkan.' }; }
        tambah = { pin: pin, pinSaya: pin };
      } else if (r.code === 'ALASAN_KOREKSI') {
        jeda();
        const al = await mintaTeks({ title: 'Koreksi hari yang sudah closing', label: 'Alasan koreksi (tercatat di riwayat)', placeholder: 'mis. nota belanja sore terlambat dicatat', ok: 'Simpan koreksi', min: 5, area: true, catatan: 'Hari tetap terkunci. Saldo hari ini dan hari-hari berikutnya dihitung ulang otomatis, dan slip yang sudah terbit diberi tanda "dikoreksi".' });
        if (!al) { selesai(); return { success: false, batal: true, message: 'Dibatalkan.' }; }
        tambah = { alasan: al };
      } else break;
      data = Object.assign({}, data, tambah); ulang++;
      mulaiLoader();
      r = await API.call(action, data);
    }
    if (r.success) { Cache.basi(); selesai(); if (opt.toast !== false) toast(opt.ok || r.message, 'success'); return r; }
    selesai();
    if (r.code === 'GANTI_PIN' && App.gantiPin) App.gantiPin(true);
    if (r.code === 'PIN_TTD_BELUM' && App.pinTtd) { App.pinTtd(); return r; }
    if (r.code !== 'AUTH') toast(r.message, 'error', opt.judulGagal || 'Belum tersimpan');
    return r;
  } catch (e) {
    selesai();
    if (e.offline && opt.antre) { Antrean.tambah(action, data, opt.antre); return { success: true, offline: true, data: null }; }
    toast(e.message + (e.offline ? ' Periksa koneksi, lalu coba lagi.' : ''), 'error', e.code === 'SERVER' ? 'Server bermasalah' : 'Gagal terhubung');
    return { success: false, message: e.message, code: e.code };
  }
}

/* ---------------- Antrean offline (POS & biaya) — status Pending / Berhasil / Gagal ---------------- */
const Antrean = {
  busy: false, terakhir: 0,
  list() { try { return JSON.parse(localStorage.getItem('rp:q') || '[]'); } catch (e) { return []; } },
  simpan(l) { localStorage.setItem('rp:q', JSON.stringify(l)); document.dispatchEvent(new CustomEvent('antrean')); },
  /* 'pending' = menunggu dikirim, 'gagal' = ditolak server (menunggu keputusan pengguna), null = sudah di server */
  status(id) { const x = this.list().find((it) => it.data && it.data.id === id); return x ? (x.galat ? 'gagal' : 'pending') : null; },
  jumlah() { const l = this.list(); return { pending: l.filter((x) => !x.galat).length, gagal: l.filter((x) => x.galat).length }; },
  tambah(action, data, label) {
    const l = this.list(); data = Object.assign({}, data, { offline: true });
    if (!l.some((x) => x.data.id === data.id)) l.push({ action, data, label: label || action, t: Date.now(), coba: 0, galat: '' });
    this.simpan(l);
    toast('Disimpan di perangkat (Pending) dan dikirim otomatis begitu server dapat dihubungi.', 'warning', 'Belum terkirim');
    setTimeout(() => this.sinkron({ diam: true }), 5000);
  },
  async sinkron(opt = {}) {
    if (this.busy || !Net.up || !API.token) return;
    let l = this.list(); if (!l.some((x) => !x.galat || opt.ulangGagal)) return;
    this.busy = true; document.dispatchEvent(new CustomEvent('antrean'));
    let ok = 0, gagal = 0;
    for (const it of l.slice()) {
      if (it.galat && !opt.ulangGagal) continue;
      try {
        const r = await API.raw(it.action, it.data);
        if (r.success) { ok++; l = l.filter((x) => x !== it); }
        else if (r.code === 'AUTH') break;
        else { it.coba++; it.galat = r.message || 'Ditolak server'; gagal++; }
      } catch (e) { break; }
      this.simpan(l);
    }
    this.busy = false; this.terakhir = Date.now(); this.simpan(l);
    if (ok) { Cache.basi(); toast(ok + ' data berhasil dikirim ke Google Sheets.', 'success', 'Sinkron berhasil'); App.segarkan && App.segarkan(); }
    if (gagal) toast(gagal + ' data ditolak server. Buka Status Sinkron untuk melihat sebabnya.', 'error', 'Sinkron gagal');
  },
  buang(id) { this.simpan(this.list().filter((x) => x.data.id !== id)); },
  async ulangi(id) { const l = this.list(); l.forEach((x) => { if (!id || x.data.id === id) x.galat = ''; }); this.simpan(l); await this.sinkron(); }
};
setInterval(() => { if (Antrean.list().some((x) => !x.galat)) Antrean.sinkron({ diam: true }); }, 20000);
/* Label status sinkron untuk satu data */
function syncHTML(st) {
  if (st === 'pending') return '<span class="sync wait" title="Tersimpan di perangkat, menunggu dikirim ke Google Sheets">Pending</span>';
  if (st === 'gagal') return '<span class="sync fail" title="Ditolak server — buka Status Sinkron">Gagal</span>';
  return '<span class="sync ok" title="Sudah tercatat di Google Sheets">Berhasil</span>';
}

/* ---------------- Toast ---------------- */
function toast(msg, type = 'info', judul) {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; document.body.appendChild(box); }
  const ikon = { success: 'check-c', error: 'alert', warning: 'alert', info: 'info' }[type] || 'info';
  const dur = type === 'error' ? 6000 : 3200;
  const el = document.createElement('div'); el.className = 'toast ' + type; el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `${ic(ikon)}<div class="tx">${judul ? '<b>' + esc(judul) + '</b>' : ''}${esc(msg)}</div>`;
  el.onclick = () => tutup(); box.appendChild(el);
  const tutup = () => { el.classList.add('out'); setTimeout(() => el.remove(), 160); };
  setTimeout(tutup, dur);
  while (box.children.length > 3) box.firstChild.remove();
}

/* ---------------- Loader proses (tenang: cincin kecil + teks) ---------------- */
const Loader = {
  el: null, t0: 0,
  show(teks = 'Memproses…', sub = '') {
    if (!this.el) { this.el = document.createElement('div'); this.el.className = 'loader'; document.body.appendChild(this.el); }
    this.el.className = 'loader'; this.t0 = Date.now();
    this.el.innerHTML = `<div class="loader-box" role="alert" aria-busy="true"><div class="loader-art"><div class="ring"></div></div><div><div class="loader-text">${esc(teks)}</div>${sub ? `<div class="loader-sub">${esc(sub)}</div>` : ''}</div></div>`;
  },
  async sukses(teks) { this.hide(); if (teks) toast(teks, 'success'); },
  hide() { if (!this.el) return; const el = this.el; this.el = null; el.classList.add('out'); setTimeout(() => el.remove(), 130); }
};

/* ---------------- Modal / sheet ---------------- */
const Modal = {
  stack: [],
  open({ title = '', sub = '', body = '', foot = '', size = '', onMount, onClose, tutupLuar = true } = {}) {
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true"><div class="modal-head"><div class="grow"><h2>${title}</h2>${sub ? `<div class="muted small mt-4">${sub}</div>` : ''}</div><button class="drawer-x" data-x aria-label="Tutup">${ic('x')}</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
    document.body.appendChild(ov); document.body.style.overflow = 'hidden';
    const m = { el: $('.modal', ov), ov, close: (v) => { if (m.closed) return; m.closed = true; ov.classList.add('out'); setTimeout(() => { ov.remove(); if (!$('.overlay')) document.body.style.overflow = ''; }, 150); this.stack = this.stack.filter((x) => x !== m); onClose && onClose(v); } };
    $('[data-x]', ov).onclick = () => m.close();
    ov.addEventListener('mousedown', (e) => { if (e.target === ov && tutupLuar) m.close(); });
    this.stack.push(m);
    onMount && onMount(m.el, m);
    setTimeout(() => { const f = $('input:not([type=hidden]):not([readonly]):not([type=checkbox]), select, textarea', m.el); if (f && innerWidth > 768) f.focus(); }, 60);
    return m;
  },
  closeTop() { const m = this.stack[this.stack.length - 1]; if (m && !m.kunci) m.close(); }
};
addEventListener('keydown', (e) => { if (e.key === 'Escape') Modal.closeTop(); });
function konfirmasi({ title = 'Yakin?', text = '', ok = 'Ya, lanjutkan', batal = 'Batal', danger = false, ikon = 'alert' } = {}) {
  return new Promise((res) => {
    const m = Modal.open({ title, size: 'sm', body: `<div class="row top"><div class="icon-box ${danger ? 'danger' : 'warning'}">${ic(ikon)}</div><div class="muted">${text}</div></div>`, foot: `<button class="btn" data-b>${esc(batal)}</button><button class="btn ${danger ? 'danger solid' : 'primary'}" data-ok>${esc(ok)}</button>`, onClose: (v) => res(!!v) });
    $('[data-b]', m.el).onclick = () => m.close(false); $('[data-ok]', m.el).onclick = () => m.close(true);
  });
}
function mintaTeks({ title, label, placeholder = '', ok = 'Simpan', min = 0, area = false, catatan = '', nilai = '' } = {}) {
  return new Promise((res) => {
    const m = Modal.open({ title, size: 'sm', body: `${catatan ? `<p class="small muted mb-12">${esc(catatan)}</p>` : ''}<div class="field"><label>${esc(label)}</label>${area ? `<textarea class="input" id="mt" placeholder="${esc(placeholder)}">${esc(nilai)}</textarea>` : `<input class="input" id="mt" placeholder="${esc(placeholder)}" value="${esc(nilai)}">`}${min ? `<div class="help">Minimal ${min} karakter.</div>` : ''}</div>`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${esc(ok)}</button>`, onClose: (v) => res(v === undefined ? null : v) });
    $('[data-b]', m.el).onclick = () => m.close(null);
    $('[data-ok]', m.el).onclick = () => { const v = $('#mt', m.el).value.trim(); if (v.length < min) { $('#mt', m.el).classList.add('err'); $('#mt', m.el).focus(); return; } m.close(v); };
  });
}

/* ---------------- PIN pad (panjang 4–8 digit) ---------------- */
function pinPadHTML(denganOk = false) {
  let s = '<div class="pin-pad">';
  for (let i = 1; i <= 9; i++) s += `<button type="button" data-k="${i}">${i}</button>`;
  s += `<button type="button" class="alt" data-k="C">Ulang</button><button type="button" data-k="0">0</button><button type="button" class="alt" data-k="B" aria-label="Hapus satu angka">${ic('backspace')}</button></div>`;
  if (denganOk) s += '<button type="button" class="btn dark block mt-12" data-k="OK" style="max-width:300px;margin-left:auto;margin-right:auto;display:flex">Lanjut</button>';
  return s;
}
/* panjang = angka → kirim otomatis saat penuh. panjang = 0 → bebas 4–8 digit, kirim dengan tombol Lanjut / Enter. */
function pasangPinPad(root, onDone, panjang = 6) {
  let pin = '';
  const bebas = !panjang, maks = bebas ? 8 : panjang;
  const dots = $('.pin-dots', root);
  const gambar = () => { const n = bebas ? Math.max(4, pin.length) : panjang; dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join(''); };
  const kirim = () => { if (pin.length < 4) { api.reset(true); return; } const v = pin; setTimeout(() => onDone(v, api), 60); };
  const tekan = (k) => {
    if (k === 'OK') return kirim();
    if (k === 'C') pin = ''; else if (k === 'B') pin = pin.slice(0, -1); else if (pin.length < maks) pin += k;
    gambar(); if (navigator.vibrate) navigator.vibrate(6);
    if (!bebas && pin.length === panjang) kirim();
  };
  const api = { reset(err) { pin = ''; gambar(); if (err) { dots.classList.add('err'); setTimeout(() => dots.classList.remove('err'), 400); } }, get: () => pin };
  const tombol = $$('[data-k]', root);
  tombol.forEach((b) => b.addEventListener('click', () => tekan(b.dataset.k)));
  const onKey = (e) => { if (!tombol[0] || !tombol[0].isConnected) return removeEventListener('keydown', onKey); if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (/^\d$/.test(e.key)) tekan(e.key); else if (e.key === 'Backspace') tekan('B'); else if (e.key === 'Enter' && bebas) tekan('OK'); };
  addEventListener('keydown', onKey);
  gambar();
  return api;
}
/* PIN akun yang sedang login (panjangnya diketahui) atau PIN tanda tangan (bebas 4–8) */
function mintaPin({ title = 'Konfirmasi PIN', sub = '', panjang, ttd = false } = {}) {
  const ap = (Store && Store.aturanPin) || {};
  const n = panjang !== undefined ? panjang : ttd && ap.pinTtdTerpisah ? 0 : ((Store && Store.me && Store.me.panjangPin) || 6);
  return new Promise((res) => {
    const m = Modal.open({ title, sub: sub || (n ? 'Masukkan ' + n + ' digit PIN Anda' : 'Masukkan PIN tanda tangan Anda'), size: 'sm', body: `<div class="pin-dots"></div>${pinPadHTML(!n)}`, onClose: (v) => res(v || null) });
    pasangPinPad(m.el, (pin) => m.close(pin), n);
  });
}

/* ---------------- Segmented control, angka, badge ---------------- */
function segHTML(opsi, nilai, cls = '') { return `<div class="seg ${cls}" role="tablist"><span class="ind"></span>${opsi.map((o) => `<button type="button" data-v="${esc(o.v)}" class="${String(o.v) === String(nilai) ? 'on' : ''}"${o.t ? ` title="${esc(o.t)}" aria-label="${esc(o.t)}"` : ''}>${o.i ? ic(o.i, 'sm') : ''}${o.l ? esc(o.l) : ''}</button>`).join('')}</div>`; }
function pasangSeg(el, onChange) {
  const ind = $('.ind', el);
  const geser = () => { const on = $('button.on', el); if (on && ind) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; } };
  $$('button', el).forEach((b) => b.addEventListener('click', () => { $$('button', el).forEach((x) => x.classList.remove('on')); b.classList.add('on'); geser(); onChange && onChange(b.dataset.v); }));
  ind && (ind.style.transition = 'none'); geser(); requestAnimationFrame(() => { if (ind) ind.style.transition = ''; });
  new ResizeObserver(geser).observe(el);
}
/* Angka berubah hanya beranimasi bila nilainya memang berganti di elemen yang sama
   (tidak "menghitung dari nol" setiap kali halaman/ data cache ditampilkan ulang). */
function animasiAngka(el, ke, fmt = rp, dur = 450) {
  if (!el) return; const ada = el.dataset.v !== undefined && el.dataset.v !== '' && el.dataset.v !== '0', dari = num(el.dataset.v); el.dataset.v = ke;
  if (!ada || dari === ke || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(ke); return; }
  const t0 = performance.now(); const langkah = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(dari + (ke - dari) * e); if (p < 1) requestAnimationFrame(langkah); };
  requestAnimationFrame(langkah);
}
function deltaHTML(p, kebalik) {
  if (p === null || p === undefined || !isFinite(p)) return '<span class="delta flat">—</span>';
  const naik = p >= 0, baik = kebalik ? !naik : naik;
  return `<span class="delta ${p === 0 ? 'flat' : baik ? 'up' : 'down'}">${ic(naik ? 'arr-up' : 'arr-down', 'sm')}${fmtNum(Math.abs(p), 1)}%</span>`;
}
function badgeStatus(s) {
  const m = { 'Terkunci': 'success', 'Tersimpan': 'info', 'Terbuka': 'warning', 'Dibuka': 'danger', 'Aman': 'success', 'Menipis': 'warning', 'Kritis': 'danger', 'Habis': 'danger', 'Baik': 'success', 'Perlu Ganti': 'warning', 'Rusak': 'danger', 'Belanja': 'danger', 'TERBIT': 'success', 'MENUNGGU_TTD': 'warning', 'DRAF': 'info', 'DITARIK': 'danger', 'Antrean': 'warning', 'BATAL': 'danger', 'DIKOREKSI': 'warning', 'ARSIP': '' };
  const lbl = { MENUNGGU_TTD: 'Menunggu TTD', TERBIT: 'Terbit', DRAF: 'Draf', DITARIK: 'Ditarik', Antrean: 'Pending', BATAL: 'Dibatalkan', DIKOREKSI: 'Dikoreksi', ARSIP: 'Diarsipkan' }[s] || s;
  return `<span class="badge ${m[s] || ''}">${esc(lbl)}</span>`;
}
function kosongHTML(teks = 'Belum ada data', ikon = 'box') { return `<div class="tbl-empty">${ic(ikon)}<div>${esc(teks)}</div></div>`; }
function pagerHTML(total, hal, per, label = 'data') {
  const n = Math.max(1, Math.ceil(total / per)); if (total <= per) return `<div class="pager"><span class="muted small">${total} ${label}</span></div>`;
  const awal = Math.max(1, Math.min(hal - 2, n - 4)), akhir = Math.min(n, awal + 4); let b = '';
  for (let i = awal; i <= akhir; i++) b += `<button class="pg ${i === hal ? 'on' : ''}" data-pg="${i}">${i}</button>`;
  return `<div class="pager"><span class="muted small">${Math.min(per, total - (hal - 1) * per)} dari ${fmtNum(total)} ${label}</span><div class="pages"><button class="pg" data-pg="${Math.max(1, hal - 1)}" aria-label="Sebelumnya">‹</button>${b}<button class="pg" data-pg="${Math.min(n, hal + 1)}" aria-label="Berikutnya">›</button></div></div>`;
}
const fotoUrl = (f, cadangan = 'assets/img/menu/default.svg') => !f ? cadangan : f;

/* ---------------- Pilih banyak (checklist) untuk tabel ----------------
   Pemakaian: const P = Pilih(el, { onChange }); P.th(), P.td(id, boleh) di markup; P.ids() */
function Pilih(root, opt = {}) {
  const sel = new Set();
  const api = {
    th: () => '<th class="ck"><input type="checkbox" class="ck" data-ck-all aria-label="Pilih semua"></th>',
    td: (id, boleh = true) => `<td class="ck" data-l="">${boleh ? `<input type="checkbox" class="ck" data-ck="${esc(id)}" aria-label="Pilih"${sel.has(String(id)) ? ' checked' : ''}>` : ''}</td>`,
    ids: () => Array.from(sel), ada: () => sel.size > 0, kosongkan() { sel.clear(); api.segar(); },
    segar() {
      $$('[data-ck]', root).forEach((c) => { c.checked = sel.has(c.dataset.ck); const tr = c.closest('tr'); if (tr) tr.classList.toggle('sel', c.checked); });
      const semua = $$('[data-ck]', root), all = $('[data-ck-all]', root);
      if (all) { all.checked = semua.length > 0 && semua.every((c) => c.checked); all.indeterminate = !all.checked && semua.some((c) => c.checked); }
      opt.onChange && opt.onChange(api.ids());
    }
  };
  root.addEventListener('change', (e) => {
    const c = e.target.closest('[data-ck]'), all = e.target.closest('[data-ck-all]');
    if (c) { if (c.checked) sel.add(c.dataset.ck); else sel.delete(c.dataset.ck); api.segar(); }
    if (all) { $$('[data-ck]', root).forEach((x) => { if (all.checked) sel.add(x.dataset.ck); else sel.delete(x.dataset.ck); }); api.segar(); }
  });
  root.addEventListener('click', (e) => { if (e.target.closest('td.ck, th.ck')) e.stopPropagation(); }, true);
  return api;
}
function bulkBarHTML(n, tombol) { return n ? `<div class="bulk-bar"><span class="grow"><b>${n}</b> dipilih</span>${tombol}<button class="btn sm ghost" data-bulk="batal-pilih">Batal pilih</button></div>` : ''; }
/* Pembatalan (void) massal: data tidak dihapus — diberi status BATAL + alasan, tercatat di audit. */
async function batalkanData(items, opt = {}) {
  if (!items.length) return null;
  const al = await mintaTeks({ title: 'Batalkan ' + items.length + ' data', label: 'Alasan pembatalan', placeholder: opt.contoh || 'mis. salah input menu', ok: 'Batalkan data', min: 3, area: true, catatan: 'Data tidak dihapus: ditandai "Dibatalkan" beserta alasan dan nama Anda, lalu tidak dihitung dalam omset dan saldo.' });
  if (!al) return null;
  const r = await tulis('trx.batal', { items, alasan: al }, { teks: 'Membatalkan data…', toast: false });
  if (r.success) {
    const d = r.data || {};
    toast((d.ok || 0) + ' data dibatalkan' + (d.gagal ? ', ' + d.gagal + ' dilewati' : '') + '.', d.gagal ? 'warning' : 'success');
    if (d.gagal) { const alasan = (d.hasil || []).filter((h) => !h.ok).map((h) => h.id + ': ' + h.pesan).slice(0, 4).join(' • '); toast(alasan, 'warning', 'Dilewati'); }
  }
  return r;
}

/* ---------------- Tema dinamis (warna, font, sudut) ---------------- */
const FONT_URL = { 'Playfair Display': 'Playfair+Display:wght@500;600;700', Lora: 'Lora:wght@500;600;700', 'DM Serif Display': 'DM+Serif+Display', Merriweather: 'Merriweather:wght@400;700', 'Cormorant Garamond': 'Cormorant+Garamond:wght@500;600;700', Fraunces: 'Fraunces:wght@500;600;700', Poppins: 'Poppins:wght@400;500;600;700', Inter: 'Inter:wght@400;500;600;700', 'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800', Nunito: 'Nunito:wght@400;600;700;800', 'DM Sans': 'DM+Sans:wght@400;500;600;700', Manrope: 'Manrope:wght@400;500;600;700;800', Lato: 'Lato:wght@400;700;900', 'Source Sans 3': 'Source+Sans+3:wght@400;600;700' };
const FONT_SERIF = ['Playfair Display', 'Lora', 'DM Serif Display', 'Merriweather', 'Cormorant Garamond', 'Fraunces'];
/* Tema bawaan v1.2 "Clean SaaS · hijau rempah". */
const TEMA_BAWAAN = { primary: '#059669', primaryHover: '#047857', secondary: '#0F172A', bg: '#F8FAFC', card: '#FFFFFF', text: '#0F172A', muted: '#64748B', border: '#E2E8F0', success: '#16A34A', danger: '#DC2626', warning: '#D97706', radius: 16, gaya: 2 };
/* Tema bawaan versi lama yang tersimpan di Sheets diganti tampilan v1.2.
   Tema yang sengaja diubah Owner (atau disimpan dari v1.2, bertanda gaya:2) tidak disentuh. */
function temaEfektif(t) {
  const lama = [['#B8862D', '#F5EBD7'], ['#A8782A', '#F5F3EF'], ['#A8782A', '#F6F1E7']];
  if (!t || !t.primary) return Object.assign({}, TEMA_BAWAAN);
  if (!t.gaya && lama.some((x) => String(t.primary).toUpperCase() === x[0] && String(t.bg || '').toUpperCase() === x[1])) return Object.assign({}, TEMA_BAWAAN);
  return t;
}
function terapkanTema(app) {
  if (!app) return;
  const t = temaEfektif(app.tema), r = document.documentElement.style;
  const peta = { primary: '--c-primary', primaryHover: '--c-primary-h', secondary: '--c-secondary', bg: '--c-bg', card: '--c-card', text: '--c-text', muted: '--c-muted', border: '--c-border', success: '--c-success', danger: '--c-danger', warning: '--c-warning' };
  Object.keys(peta).forEach((k) => { if (t[k]) r.setProperty(peta[k], t[k]); });
  if (t.primary) r.setProperty('--s1', t.primary);
  const rad = Math.max(6, Math.min(20, num(t.radius) || 16));
  r.setProperty('--radius', rad + 'px'); r.setProperty('--radius-md', Math.round(rad * .75) + 'px'); r.setProperty('--radius-sm', Math.max(4, Math.round(rad * .625)) + 'px'); r.setProperty('--radius-xs', Math.max(3, Math.round(rad * .375)) + 'px'); r.setProperty('--radius-lg', (rad + 4) + 'px');
  let fh = app.fontJudul || 'Plus Jakarta Sans', fb = app.fontIsi || 'Plus Jakarta Sans';
  if (fh === 'Playfair Display' && fb === 'Inter') { fh = 'Plus Jakarta Sans'; fb = 'Plus Jakarta Sans'; }   // pasangan font bawaan v1.0
  r.setProperty('--font-head', `'${fh}', ${FONT_SERIF.includes(fh) ? 'Georgia, serif' : 'system-ui, sans-serif'}`); r.setProperty('--font-body', `'${fb}', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);
  const fam = [fh, fb].filter((v, i, a) => a.indexOf(v) === i).map((f) => FONT_URL[f]).filter(Boolean);
  let link = $('#gfont'); const href = 'https://fonts.googleapis.com/css2?' + fam.map((f) => 'family=' + f).join('&') + '&display=swap';
  if (!link) { link = document.createElement('link'); link.id = 'gfont'; link.rel = 'stylesheet'; document.head.appendChild(link); }
  if (link.href !== href) link.href = href;
  const meta = $('meta[name=theme-color]'); if (meta && t.bg) meta.content = t.bg;
  if (app.nama) document.title = app.nama;
  try { localStorage.setItem('rp:tema', JSON.stringify({ tema: t, fontJudul: fh, fontIsi: fb, nama: app.nama, logo: app.logo })); } catch (e) { }
}
(function temaAwal() { try { const s = JSON.parse(localStorage.getItem('rp:tema') || 'null'); if (s) terapkanTema(s); } catch (e) { } })();

/* ---------------- Ekspor & PRATINJAU dokumen ---------------- */
const Lib = {
  muat(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat pustaka ekspor. Periksa koneksi internet.')); document.head.appendChild(s); }); },
  xlsx() { return window.XLSX ? Promise.resolve() : this.muat('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); },
  async pdf() { if (!window.jspdf) await this.muat('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'); if (!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable)) await this.muat('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'); }
};
/* nilai sel untuk tampilan/berkas. kolom: [{k, l, t:'rp'|'num'|'tgl'|'txt', f?}] */
const nilaiSel = (k, r) => (typeof k.f === 'function' ? k.f(r) : r[k.k]);
const teksSel = (k, r) => { const v = nilaiSel(k, r); return k.t === 'rp' ? rp(v) : k.t === 'num' ? fmtDec(v) : k.t === 'tgl' ? tgl(v, 'dd/MM/yyyy') : String(v === undefined || v === null ? '' : v); };
const hexRgb = (h, cad) => { const m = String(h || '').match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : cad; };
async function simpanExcel(nama, judul, kolom, baris, ringkasan) {
  await Lib.xlsx();
  const head = kolom.map((k) => k.l);
  const data = baris.map((r) => kolom.map((k) => { const v = nilaiSel(k, r); return k.t === 'rp' || k.t === 'num' ? num(v) : v === undefined || v === null ? '' : String(v); }));
  const aoa = [[judul], [Store.app ? Store.app.nama + ' — ' + Store.app.lokasi : ''], ['Diunduh ' + tgl(hariIni(), 'd MMMM yyyy') + ' ' + jamKini() + ' WITA'], [], head].concat(data);
  if (ringkasan && ringkasan.length) { aoa.push([]); ringkasan.forEach((r) => aoa.push(r)); }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = kolom.map((k, ci) => ({ wch: Math.min(40, Math.max(10, k.l.length + 2, ...data.slice(0, 200).map((r) => String(r[ci]).length + 2))) }));
  kolom.forEach((k, ci) => { if (k.t === 'rp') for (let ri = 5; ri < 5 + data.length; ri++) { const ref = XLSX.utils.encode_cell({ r: ri, c: ci }); if (ws[ref]) ws[ref].z = '"Rp" #,##0'; } });
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, judul.slice(0, 28).replace(/[\\/?*[\]:]/g, ' '));
  XLSX.writeFile(wb, nama + '.xlsx');
}
async function buatPDF(judul, kolom, baris, ringkasan, opsi = {}) {
  await Lib.pdf();
  const cs = getComputedStyle(document.documentElement);
  const emas = hexRgb(cs.getPropertyValue('--c-primary').trim(), [168, 120, 42]), kayu = hexRgb(cs.getPropertyValue('--c-secondary').trim(), [91, 62, 38]);
  const doc = new window.jspdf.jsPDF({ orientation: opsi.landscape || kolom.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  doc.setTextColor(42, 33, 24); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(Store.app ? Store.app.nama : 'Minuman Rempah Pelaut', 36, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(119, 107, 92); doc.text(Store.app ? Store.app.lokasi || '' : '', 36, 54);
  doc.setDrawColor(emas[0], emas[1], emas[2]); doc.setLineWidth(1.2); doc.line(36, 64, W - 36, 64);
  doc.setTextColor(42, 33, 24); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(judul, 36, 86);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(119, 107, 92); doc.text('Dibuat ' + tgl(hariIni(), 'd MMMM yyyy') + ' ' + jamKini() + ' WITA oleh ' + (Store.me ? Store.me.nama : ''), 36, 100);
  doc.autoTable({
    startY: 110, head: [kolom.map((k) => k.l)], body: baris.map((r) => kolom.map((k) => teksSel(k, r))),
    styles: { fontSize: 8, cellPadding: 4, textColor: [42, 33, 24], lineColor: [230, 221, 204], lineWidth: .4 }, headStyles: { fillColor: kayu, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 247, 241] }, columnStyles: Object.fromEntries(kolom.map((k, i) => [i, k.t === 'rp' || k.t === 'num' ? { halign: 'right' } : {}])),
    margin: { left: 36, right: 36 }, didDrawPage: () => { doc.setFontSize(8); doc.setTextColor(150); doc.text('Halaman ' + doc.internal.getNumberOfPages(), W - 90, doc.internal.pageSize.getHeight() - 18); }
  });
  if (ringkasan && ringkasan.length) {
    let y = doc.lastAutoTable.finalY + 18; doc.setFontSize(9.5); doc.setTextColor(42, 33, 24);
    ringkasan.forEach((r) => { if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 50; } doc.setFont('helvetica', 'bold'); doc.text(String(r[0]), 36, y); doc.setFont('helvetica', 'normal'); doc.text(String(r[1]), W - 36, y, { align: 'right' }); y += 15; });
  }
  return doc;
}
const b64Blob = (b64, mime) => { const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); };
const pdfInline = () => navigator.pdfViewerEnabled !== false && innerWidth > 768;
const Pratinjau = {
  tabelHTML(judul, kolom, baris, ringkasan, maks = 300) {
    const isi = baris.slice(0, maks).map((r) => `<tr>${kolom.map((k) => `<td class="${k.t === 'rp' || k.t === 'num' ? 'r' : ''}">${esc(teksSel(k, r))}</td>`).join('')}</tr>`).join('');
    return `<div class="pv-sheet"><h3>${esc(judul)}</h3><div class="meta">${esc(Store.app ? Store.app.nama + ' · ' + (Store.app.lokasi || '') : '')}</div><div class="table-wrap"><table><thead><tr>${kolom.map((k) => `<th class="${k.t === 'rp' || k.t === 'num' ? 'r' : ''}">${esc(k.l)}</th>`).join('')}</tr></thead><tbody>${isi || `<tr><td colspan="${kolom.length}">Tidak ada data pada rentang ini.</td></tr>`}</tbody></table></div>${baris.length > maks ? `<p class="pv-note">Menampilkan ${maks} dari ${fmtNum(baris.length)} baris. Berkas unduhan memuat semua baris.</p>` : ''}${ringkasan && ringkasan.length ? `<div class="ring">${ringkasan.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div>` : ''}</div>`;
  },
  /* Laporan tabel: pratinjau tabel / PDF lalu unduh Excel atau PDF */
  laporan({ nama, judul, kolom, baris, ringkasan, opsi = {}, awal = 'tabel' }) {
    let url = null, mode = pdfInline() ? awal : 'tabel';
    const m = Modal.open({
      title: 'Pratinjau dokumen', sub: esc(judul) + ' · ' + fmtNum(baris.length) + ' baris', size: 'xl',
      body: `${pdfInline() ? `<div class="mb-12">${segHTML([{ v: 'tabel', l: 'Tabel' }, { v: 'pdf', l: 'Tampilan PDF' }], mode, 'mini')}</div>` : ''}<div id="pv"></div>`,
      foot: `<button class="btn" data-pv="cetak">${ic('printer', 'sm')}Cetak</button><button class="btn" data-pv="xls">${ic('download', 'sm')}Unduh Excel</button><button class="btn primary" data-pv="pdf">${ic('download', 'sm')}Unduh PDF</button>`,
      onClose: () => { if (url) URL.revokeObjectURL(url); }
    });
    const pv = $('#pv', m.el);
    const tampil = async () => {
      if (mode === 'tabel') { pv.innerHTML = this.tabelHTML(judul, kolom, baris, ringkasan); return; }
      pv.innerHTML = '<div class="skel h-200"></div>';
      try { if (!url) { const doc = await buatPDF(judul, kolom, baris, ringkasan, opsi); url = URL.createObjectURL(doc.output('blob')); } pv.innerHTML = `<iframe class="pv-frame" src="${url}#toolbar=0&view=FitH" title="Pratinjau PDF"></iframe>`; }
      catch (e) { pv.innerHTML = `<div class="notice danger">${ic('alert')}<div>${esc(e.message)}</div></div>`; }
    };
    const seg = $('.seg', m.el); if (seg) pasangSeg(seg, (v) => { mode = v; tampil(); });
    tampil();
    m.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-pv]'); if (!b) return;
      b.classList.add('busy');
      try {
        if (b.dataset.pv === 'xls') { await simpanExcel(nama, judul, kolom, baris, ringkasan); toast(nama + '.xlsx diunduh.', 'success'); }
        if (b.dataset.pv === 'pdf') { const doc = await buatPDF(judul, kolom, baris, ringkasan, opsi); doc.save(nama + '.pdf'); toast(nama + '.pdf diunduh.', 'success'); }
        if (b.dataset.pv === 'cetak') { const doc = await buatPDF(judul, kolom, baris, ringkasan, opsi); doc.autoPrint(); window.open(URL.createObjectURL(doc.output('blob')), '_blank'); }
      } catch (er) { toast(er.message, 'error'); } finally { b.classList.remove('busy'); }
    });
    return m;
  },
  /* PDF dari server (dokumen resmi): tampil di dalam aplikasi sebelum diunduh */
  pdfBase64(b64, nama, judul = 'Pratinjau PDF', ket = '') {
    const url = URL.createObjectURL(b64Blob(b64, 'application/pdf'));
    const m = Modal.open({
      title: judul, sub: ket, size: 'xl',
      body: pdfInline() ? `<iframe class="pv-frame" src="${url}#view=FitH" title="${esc(judul)}"></iframe>` : `<div class="notice info">${ic('info')}<div>Peramban di perangkat ini tidak bisa menampilkan PDF di dalam aplikasi. Tekan <b>Buka</b> untuk melihatnya di tab baru, atau <b>Unduh</b>.</div></div>`,
      foot: `<a class="btn" href="${url}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka</a><button class="btn primary" data-dl>${ic('download', 'sm')}Unduh</button>`,
      onClose: () => setTimeout(() => URL.revokeObjectURL(url), 60000)
    });
    $('[data-dl]', m.el).onclick = () => { const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); toast(nama + ' diunduh.', 'success'); };
    return m;
  },
  /* Gambar sebelum diunggah (foto menu, bahan, aset, logo) */
  gambar(src, { judul = 'Pratinjau foto', ok = 'Unggah foto', ket = '' } = {}) {
    return new Promise((res) => {
      const m = Modal.open({ title: judul, sub: ket, size: 'sm', body: `<img class="pv-img" src="${esc(src)}" alt="Pratinjau">`, foot: `<button class="btn" data-b>Batal</button><button class="btn primary" data-ok>${esc(ok)}</button>`, onClose: (v) => res(!!v) });
      $('[data-b]', m.el).onclick = () => m.close(false); $('[data-ok]', m.el).onclick = () => m.close(true);
    });
  }
};
/* Semua tombol unduh laporan melewati pratinjau terlebih dahulu */
function unduhExcel(nama, judul, kolom, baris, ringkasan) { return Pratinjau.laporan({ nama, judul, kolom, baris, ringkasan, awal: 'tabel' }); }
function unduhPDF(nama, judul, kolom, baris, ringkasan, opsi = {}) { return Pratinjau.laporan({ nama, judul, kolom, baris, ringkasan, opsi, awal: 'pdf' }); }
function unduhBase64(nama, b64, mime = 'application/pdf') {
  const url = URL.createObjectURL(b64Blob(b64, mime)); const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function bukaBase64(b64, nama = 'dokumen.pdf', judul) { return Pratinjau.pdfBase64(b64, nama, judul || 'Pratinjau dokumen'); }
/* kompres foto sebelum diunggah (≤ 900 px, JPEG 0.82) */
function kompresFoto(file, maks = 900) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('Pilih berkas gambar (JPG/PNG).'));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, maks / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .82)); };
    img.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); img.src = url;
  });
}

/* ---------------- Tes koneksi server & status sinkron ---------------- */
async function tesKoneksi() {
  const m = Modal.open({ title: 'Tes koneksi server', size: 'sm', body: '<div id="tk"><div class="row"><span class="spin"></span><span>Menghubungi Google Apps Script…</span></div></div>', foot: '<button class="btn" data-x2>Tutup</button>' });
  $('[data-x2]', m.el).onclick = () => m.close();
  const u = API.url, samar = u.replace(/(\/s\/)([A-Za-z0-9_-]{6})[A-Za-z0-9_-]+([A-Za-z0-9_-]{4})(\/exec)$/, '$1$2…$3$4');
  const baris = (ok, t, s) => `<div class="li"><span class="icon-box s ${ok === true ? 'success' : ok === false ? 'danger' : 'warning'}">${ic(ok === true ? 'check' : ok === false ? 'x' : 'alert', 'sm')}</span><div class="grow"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div></div>`;
  let h = baris(API.siap(), 'Alamat server di js/config.js', esc(samar || '(kosong)'));
  h += baris(navigator.onLine, 'Perangkat terhubung internet', navigator.onLine ? '' : 'Nyalakan data seluler / Wi-Fi.');
  const t0 = performance.now();
  try {
    const r = await API.raw('ping', {});
    const ms = Math.round(performance.now() - t0);
    h += baris(true, 'Server Google Apps Script menjawab', 'Waktu respons ' + fmtNum(ms) + ' ms' + (r.data ? ' · server v' + esc(r.data.versi) + ' · tanggal server ' + esc(r.data.hariIni) : ''));
    if (r.data && !serverCocok(r.data.versi)) h += baris(null, 'Tampilan v' + VERSI_APP + ' membutuhkan server v' + VERSI_API_MIN + ' atau lebih baru (server: v' + esc(r.data.versi) + ')', 'Perbarui berkas .gs lalu Deploy → Manage deployments → Edit → New version.');
  } catch (e) {
    h += baris(false, 'Server tidak menjawab dengan benar', esc(e.message) + (e.offline && navigator.onLine ? ' Kemungkinan: URL salah, Web App belum di-deploy dengan akses "Anyone", atau jaringan memblokir script.google.com.' : ''));
  }
  const q = Antrean.jumlah();
  h += baris(!q.pending && !q.gagal ? true : q.gagal ? false : null, 'Antrean di perangkat', q.pending || q.gagal ? q.pending + ' pending · ' + q.gagal + ' gagal' : 'Kosong — semua data sudah di Google Sheets');
  const tk = $('#tk', m.el); if (tk) tk.innerHTML = h;
}
function bukaStatusSinkron() {
  const m = Modal.open({ title: 'Status sinkron', sub: 'Data yang belum tercatat di Google Sheets', size: 'lg', body: '<div id="ss"></div>', foot: `<button class="btn" data-tk>${ic('wifi', 'sm')}Tes koneksi</button><button class="btn primary" data-kirim>${ic('refresh', 'sm')}Kirim sekarang</button>` });
  const gambar = () => {
    const l = Antrean.list(), box = $('#ss', m.el); if (!box) return;
    const st = API.status;
    box.innerHTML = `<p class="small muted mb-12">Kontak server terakhir: ${st.t ? relatif(new Date(st.t).toISOString()) + (st.ok ? ' (berhasil)' : ' (gagal)') : 'belum ada'}.</p>` + (l.length ? `<div class="table-wrap"><table class="tbl cards"><thead><tr><th>Data</th><th>Waktu</th><th>Status</th><th class="r">Aksi</th></tr></thead><tbody>${l.map((it) => `<tr><td class="main-cell"><b>${esc(it.label)}</b><div class="xs muted">${esc(it.data.id || '')}</div>${it.galat ? `<div class="small bad mt-4">${esc(it.galat)}</div>` : ''}</td><td data-l="Waktu">${esc(relatif(new Date(it.t).toISOString()))}</td><td data-l="Status">${syncHTML(it.galat ? 'gagal' : 'pending')}</td><td class="r" data-l="Aksi"><div class="row gap-4" style="justify-content:flex-end">${it.galat ? `<button class="btn xs" data-ulang="${esc(it.data.id)}">Coba lagi</button>` : ''}<button class="btn xs danger" data-buang="${esc(it.data.id)}">Buang</button></div></td></tr>`).join('')}</tbody></table></div>` : `<div class="tbl-empty">${ic('check-c')}<div>Semua data sudah tercatat di Google Sheets.</div></div>`);
  };
  gambar();
  const h = () => gambar(); document.addEventListener('antrean', h);
  m.el.addEventListener('click', async (e) => {
    const u = e.target.closest('[data-ulang]'), b = e.target.closest('[data-buang]');
    if (u) await Antrean.ulangi(u.dataset.ulang);
    if (b && await konfirmasi({ title: 'Buang data ini?', text: 'Data yang dibuang tidak akan dikirim ke server dan hilang dari perangkat.', ok: 'Buang', danger: true })) { Antrean.buang(b.dataset.buang); toast('Data dibuang dari antrean.', 'info'); }
    if (e.target.closest('[data-kirim]')) { await Antrean.sinkron({ ulangGagal: true }); }
    if (e.target.closest('[data-tk]')) tesKoneksi();
  });
  const tutupAsli = m.close; m.close = (v) => { document.removeEventListener('antrean', h); tutupAsli(v); };
  return m;
}
