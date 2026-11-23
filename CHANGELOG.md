# Catatan perubahan

## 1.1.0 — 23 November 2026

**Tampilan**
- Gaya baru "kedai hangat & rapi": datar, tanpa gradasi dan efek kaca, satu keluarga huruf (Plus Jakarta Sans), label kalimat biasa.
- Angka Total masuk di beranda/POS tidak lagi terpotong.
- Grafik dan batang hanya beranimasi sekali per halaman; data yang diperbarui tampil tanpa kedip. Loader hanya muncul bila proses lebih dari 0,65 detik.
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
