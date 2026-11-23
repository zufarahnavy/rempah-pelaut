# Catatan perubahan

## 1.2.0 — 24 November 2026

**Hanya frontend.** Backend tetap 1.1.0 (tidak perlu mengganti berkas `.gs`, menjalankan `perbaruiSkema`, atau deploy ulang). Logika bisnis, rumus kas, struktur data, variabel state, dan sinkronisasi ke Apps Script tidak diubah.

**Tampilan (Clean SaaS dashboard)**
- Token baru: latar `#F8FAFC`, kartu `#FFFFFF` bergaris `#E2E8F0`, sudut 16 px, bayangan `0 1px 3px rgba(0,0,0,.04)`, aksen `#059669` / `#047857`, teks `#0F172A` / `#64748B`, huruf Plus Jakarta Sans.
- Sidebar: logo baru (jangkar + daun rempah), menu aktif berupa kapsul hijau muda dengan garis penanda, penghitung merah untuk stok menipis & dokumen menunggu.
- Header: pencarian global dengan pintasan **Ctrl K** / ⌘ K, lonceng dengan titik merah, chip profil dengan avatar inisial.
- HP: navigasi bawah berupa kapsul mengambang; sidebar menjadi laci; dialog membuka dari bawah.
- Kartu metrik: angka besar menghitung naik, status persen, dan sparkline hijau dengan area gradien (dasbor, beranda kasir, rekap kas, analitik). Deret diambil dari data yang sudah dimuat, tanpa panggilan server tambahan.
- Tab & filter berupa kapsul dengan penanda yang bergeser, tanpa kedip.
- Palet grafik baru yang lolos uji buta warna; grafik laba-rugi memakai hijau (laba) dan merah (rugi).
- Ikon aplikasi (PWA) dan warna bilah browser diperbarui.

**Animasi (CSS `transform` + `opacity`, tanpa pustaka luar)**
- `pageEnter`: halaman masuk dengan pudar + geser 8 px, 0,25 detik, kurva `cubic-bezier(.16,1,.3,1)`. Memakai `backwards` agar elemen tetap (bar keranjang POS) tidak ikut tergeser setelah animasi.
- Kartu terangkat 2 px saat diarahkan kursor (0,2 detik).
- Dialog: latar `rgba(15,23,42,.4)` + blur 4 px, kotak membesar dari 96%.
- Utilitas baru `animateValue(el, awal, akhir, durasi = 800)` di `js/gerak.js` (requestAnimationFrame, ease-out cubic, format `id-ID`, awalan "Rp" dipertahankan).

**Kompatibilitas**
- Bekerja dengan backend 1.1.x. Pita "versi server berbeda" hanya muncul bila backend lebih lama dari 1.1.
- Tema bawaan lama (v1.0 dan v1.1) otomatis tampil dengan warna baru tanpa mengubah spreadsheet. Tema yang sudah diatur sendiri tetap dipakai. Preset baru **Hijau rempah (bawaan)** di Pengaturan → Warna & font; slider sudut kini 6–20 px.
- Nama menu: Penjualan (POS) → Kasir (POS), Pengeluaran lapak → Biaya lapak, Stok & opname → Stok bahan, Aset & inventaris → Aset inventaris. Alamat halaman tetap.

**Perbaikan**
- Garis pembanding "periode sebelumnya" di Analitik kini benar-benar putus-putus (sebelumnya tertimpa animasi gambar garis).

## 1.1.0 — 23 November 2026

**Tampilan**
- Gaya baru "kedai hangat & rapi": datar, tanpa gradasi dan efek kaca, satu keluarga huruf (Plus Jakarta Sans), label kalimat biasa.
- Angka Total masuk di beranda/POS tidak lagi terpotong.
- Sistem gerak baru (`js/gerak.js`): kartu masuk bertahap, baris tabel menyusul, angka KPI menghitung naik, garis tergambar, kolom tumbuh, donat menyapu melingkar.
- Morph: saat rentang/data berubah, garis, kolom, donat, batang, dan angka bergerak mulus dari nilai lama ke nilai baru (tidak digambar ulang dari nol).
- Anti-kedip: animasi terikat ke linimasa, bukan elemen. Bila data segar datang di tengah animasi, animasi dilanjutkan dari titik yang sama.
- Sentuhan kecil: kartu terangkat saat diarahkan kursor, tombol mengecil saat ditekan, jumlah di POS berdenyut, baris pesanan baru meluncur masuk.
- Menghormati setelan "kurangi gerakan" di perangkat. Loader hanya muncul bila proses lebih dari 0,65 detik.
- Gambar `assets/img/ilustrasi-cangkir.svg` (404) dihapus; ikon digambar langsung oleh aplikasi.

**POS**
- Pilihan tampilan kartu (grid) atau daftar (list), tersimpan per perangkat.
- Ringkasan pesanan menampilkan nama, jumlah, dan harga setiap menu.
- POS terkunci setelah Daily closing: tombol + mati, bar keranjang disembunyikan, catatan "Kasir hari ini sudah ditutup".

**Pembatalan & koreksi**
- Kotak centang + aksi massal di transaksi, biaya, nota belanja, opname, menu, bahan, aset, pengguna, dan draf dokumen.
- Pembatalan (void) dengan alasan; data tidak dihapus dan tidak dihitung di laporan.
- Owner mengoreksi hari yang sudah closing langsung (alasan wajib), saldo berantai dihitung ulang, dokumen terbit ditandai "dikoreksi".

**Keamanan**
- Pengaturan aturan PIN: panjang 4–8, batas salah & lama kunci, lama sesi, kunci layar otomatis, tolak PIN lemah, wajib ganti berkala, aksi yang meminta PIN ulang, PIN tanda tangan terpisah.
- Slot tanda tangan dokumen terikat ke akun yang login; tidak ada pilihan nama.
- Angka dokumen dihitung server dan dicek ulang saat tanda tangan dan saat verifikasi publik.

**Kecepatan & sinkron**
- PDF dokumen dibuat di latar setelah tanda tangan terakhir.
- Status antrean Pending / Berhasil / Gagal, Tes koneksi server, pita peringatan bila versi server berbeda.
- Service worker mengambil HTML/CSS/JS dari jaringan dulu sehingga update langsung terpakai.

**Validasi**
- Angka minus ditolak di belanja, aset, biaya, dan opname; nama bahan baru wajib diisi.

**Pratinjau**
- Semua unduhan laporan dan PDF dokumen dipratinjau di dalam aplikasi; foto dipratinjau sebelum diunggah; impor data punya pratinjau.

## 1.0.0
- Rilis pertama.
