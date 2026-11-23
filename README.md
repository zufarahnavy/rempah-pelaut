# Minuman Rempah Pelaut — Management System

Aplikasi kasir & pembukuan lapak minuman rempah: POS kasir (tampilan kartu atau daftar), pengeluaran operasional, Daily Closing berantai, belanja bahan, stok & opname, aset, rekap kas, analitik penjualan, laporan Excel/PDF dengan pratinjau, dan dokumen resmi ber-QR.

- **Frontend**: HTML/CSS/JS murni (PWA), dihosting di GitHub Pages. Repository ini.
- **Backend**: Google Apps Script sebagai REST API (Google Sheets + Drive). Kodenya **tidak** disimpan di sini.

Versi: **1.2.0** (bekerja dengan backend 1.1.x)

## Satu-satunya berkas yang perlu diubah

`js/config.js` → isi `GAS_URL` dengan URL Web App Apps Script (berakhiran `/exec`).

## Panduan

Langkah lengkap ada di [PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md): pasang backend, deploy, GitHub Pages, data demo, mulai data riil, serta cara update (bagian *Update ke v1.2* dan bagian 0). Token desain, animasi, dan `animateValue()` dijelaskan di bagian 19.

## Halaman

| Berkas | Fungsi |
|---|---|
| `index.html` | Aplikasi utama (login PIN, Owner & Kasir) |
| `verify.html` | Verifikasi publik dokumen ber-QR (tanpa login) |

## Update

```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
Tunggu 1–2 menit, lalu tekan Ctrl+Shift+R. Jangan menimpa `js/config.js` saat menyalin berkas versi baru.
