# Panduan Instalasi — Minuman Rempah Pelaut Management System

Versi 1.1.0 · Zona waktu WITA (Asia/Makassar)

> **Sudah memasang versi 1.0?** Langsung ke [bagian 0 — Update dari v1.0 ke v1.1](#0-update-dari-v10-ke-v11). Data Anda tidak berubah.

Panduan ini ditulis untuk pemula. Ikuti urutannya dari atas ke bawah. Setiap tahap ditutup dengan tanda **✅ Berhasil bila…** agar Anda tahu kapan boleh lanjut.

---

## Daftar isi

0. [Update dari v1.0 ke v1.1](#0-update-dari-v10-ke-v11)
1. [Isi paket & ke mana setiap berkas pergi](#1-isi-paket--ke-mana-setiap-berkas-pergi)
2. [Gambaran cara kerja aplikasi](#2-gambaran-cara-kerja-aplikasi)
3. [Tahap A — Pasang backend di Google Apps Script](#3-tahap-a--pasang-backend-di-google-apps-script)
4. [Tahap B — Isi alamat backend di `js/config.js`](#4-tahap-b--isi-alamat-backend-di-jsconfigjs)
5. [Tahap C — Unggah frontend ke GitHub Pages](#5-tahap-c--unggah-frontend-ke-github-pages)
6. [Tahap D — Login pertama & uji coba data demo](#6-tahap-d--login-pertama--uji-coba-data-demo)
7. [Tahap E — Mulai memakai data riil](#7-tahap-e--mulai-memakai-data-riil)
8. [Pengaturan Owner (Superadmin)](#8-pengaturan-owner-superadmin)
9. [Dokumen resmi ber-QR & halaman verifikasi](#9-dokumen-resmi-ber-qr--halaman-verifikasi)
10. [Import data dari spreadsheet lama](#10-import-data-dari-spreadsheet-lama)
11. [Script Properties — apa yang otomatis, apa yang manual](#11-script-properties--apa-yang-otomatis-apa-yang-manual)
12. [Performa, pemanasan server & kuota](#12-performa-pemanasan-server--kuota)
13. [Cara update aplikasi di kemudian hari](#13-cara-update-aplikasi-di-kemudian-hari)
14. [Fungsi yang bisa dijalankan dari editor](#14-fungsi-yang-bisa-dijalankan-dari-editor)
15. [Batasan yang perlu diketahui](#15-batasan-yang-perlu-diketahui)
16. [Kendala umum & solusinya](#16-kendala-umum--solusinya)
17. [Pembatalan, koreksi & aturan PIN (v1.1)](#17-pembatalan-koreksi--aturan-pin-v11)
18. [Status sinkron: Pending, Berhasil, Gagal](#18-status-sinkron-pending-berhasil-gagal)

---

## 0. Update dari v1.0 ke v1.1

Bagian ini untuk Anda yang **sudah** memakai versi 1.0. Semua data (transaksi, closing, stok, aset, dokumen) tetap utuh. Update hanya **menambah** kolom baru dan tidak menghapus apa pun.

**Urutan wajib: backend dulu, baru frontend.** Frontend v1.1 membutuhkan alamat-alamat API baru yang hanya ada di backend v1.1.

### 0a. Backend (Apps Script)
1. Buka proyek Apps Script Anda. Cadangkan dulu: salin isi `Kode.gs`, `Setup.gs`, dan `DocEngine.gs` lama ke Notepad.
2. Ganti isi ketiga berkas dengan versi 1.1 (salin-tempel seluruhnya), lalu **Ctrl+S**.
3. Pilih fungsi `perbaruiSkema` di dropdown editor → **▶ Run**. Contoh log yang benar:
   `✅ Master_Menu ✓ • … • Pengguna (+5 kolom) • DE_Dokumen (+1 kolom) • Tema diperbarui ke v1.1 (warna) (font)`
   - Kolom baru yang ditambahkan: PIN tanda tangan & panjang PIN di sheet **Pengguna**, kolom pembatalan (status, alasan, oleh, waktu) di sheet transaksi, dan kolom **koreksi** di **DE_Dokumen**.
   - Warna & font hanya diganti ke tampilan baru **bila masih bawaan v1.0**. Bila Anda sudah mengubahnya sendiri, tidak disentuh. Nilai lama disimpan di baris `TEMA_SEBELUM_V11` pada sheet Pengaturan.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
   > Pakai **Edit**, bukan *New deployment*, agar alamat `/exec` tetap sama dan `config.js` tidak perlu diubah.
5. Buka alamat `/exec` di browser. Harus muncul tulisan JSON yang memuat `"versi":"1.1.0"`.

### 0b. Frontend (GitHub Pages)
1. Ekstrak `rempah-pelaut-frontend.zip` v1.1 ke folder sementara.
2. Salin semua isinya ke folder repository Anda (timpa yang lama), **kecuali `js/config.js`**. Jangan timpa `config.js` karena di situ alamat `/exec` Anda.
3. Hapus dua berkas lama yang tidak dipakai lagi:
   ```bash
   git rm assets/ilustrasi-cangkir.svg assets/kompas.svg
   ```
   (Bila muncul pesan *did not match any files*, berarti sudah tidak ada. Lanjutkan saja.)
4. Kirim ke GitHub:
   ```bash
   git add .
   git commit -m "Update ke v1.1"
   git push
   ```
5. Tunggu 1–2 menit, buka aplikasi, lalu tekan **Ctrl+Shift+R**. Di HP: tutup aplikasi sepenuhnya, lalu buka lagi. Versi tampil di kaki halaman: **versi 1.1.0**.

> Bila frontend sudah 1.1 tetapi backend masih 1.0, aplikasi menampilkan pita peringatan "versi server berbeda". Ulangi langkah 0a.

### 0c. Setelah update (5 menit, sebagai Owner)
1. **Pengaturan → Keamanan & PIN**: periksa panjang PIN, batas salah, lama sesi, kunci layar otomatis, dan daftar aksi yang meminta PIN ulang. Tekan **Simpan aturan PIN** (akan diminta PIN Owner).
2. **Pengaturan → Peran & hak akses**: tentukan apakah Kasir boleh membatalkan transaksinya sendiri (aturan *Boleh membatalkan transaksi & biaya miliknya sendiri*).
3. Coba satu transaksi POS, lalu batalkan lewat kotak centang di **Riwayat** (bagian 17).

### Apa yang baru di v1.1
| Area | Perubahan |
|---|---|
| Tampilan | Gaya baru "kedai hangat & rapi": datar, tanpa gradasi & efek kaca, huruf Plus Jakarta Sans. Animasi hanya sekali per halaman, tidak berkedip saat data diperbarui |
| POS | Pilihan tampilan **kartu** atau **daftar**; ringkasan pesanan menyebut nama setiap menu; angka Total masuk tidak terpotong; POS terkunci otomatis setelah closing |
| Pembatalan | Kotak centang di setiap daftar transaksi, biaya, nota belanja, opname, menu, bahan, aset, pengguna, dan draf dokumen. Data dibatalkan dengan alasan, **tidak dihapus** |
| Koreksi Owner | Hari yang sudah closing bisa langsung dikoreksi Owner (dengan alasan). Saldo hari itu dan sesudahnya dihitung ulang, slip yang sudah terbit ditandai **dikoreksi** |
| PIN | Pengaturan lengkap aturan PIN, PIN tanda tangan terpisah (opsional), kunci layar otomatis |
| Dokumen | Slot tanda tangan mengikuti akun yang login (tidak ada pilihan nama). PDF dibuat di latar sehingga tanda tangan terasa cepat |
| Pratinjau | Semua unduhan (laporan, aset, log opname, riwayat aktivitas) dan dokumen PDF dipratinjau dulu di dalam aplikasi. Foto dipratinjau sebelum diunggah |
| Validasi | Angka minus ditolak di semua form (belanja, aset, biaya, opname); nama bahan wajib diisi |
| Sinkron | Status **Pending / Berhasil / Gagal** untuk transaksi yang tersimpan saat sinyal lemah, plus **Tes koneksi server** |

---

## 1. Isi paket & ke mana setiap berkas pergi

Anda menerima **dua kelompok berkas**. Keduanya dipasang di tempat yang berbeda, jadi jangan dicampur.

| Berkas | Dipasang di | Cara |
|---|---|---|
| `Kode.gs` | Editor Google Apps Script | Salin-tempel isinya |
| `Setup.gs` | Editor Google Apps Script | Salin-tempel isinya |
| `DocEngine.gs` | Editor Google Apps Script | Salin-tempel isinya |
| `appsscript.json` | Editor Google Apps Script (manifest) | Salin-tempel isinya |
| `rempah-pelaut-frontend.zip` | GitHub Pages | Ekstrak, lalu unggah lewat Git |

Isi ZIP frontend setelah diekstrak:

```
rempah-pelaut-frontend/        ← folder ini yang nanti di-"git init"
├── index.html                 ← aplikasi utama
├── verify.html                ← halaman verifikasi publik dokumen ber-QR
├── manifest.webmanifest       ← agar bisa dipasang seperti aplikasi di HP
├── sw.js                      ← mode offline (PWA)
├── README.md
├── PANDUAN-INSTALASI.md       ← salinan panduan ini
├── css/style.css
├── js/config.js               ← SATU-SATUNYA berkas yang perlu Anda ubah
├── js/core.js, app.js, charts.js, qr.js, pages-*.js
└── assets/                    ← logo, ikon, ilustrasi menu, bahan, dan aset (tanpa gambar ilustrasi besar; ikon digambar langsung oleh aplikasi)
```

> ⚠️ Berkas `.gs` sengaja **tidak** ada di dalam ZIP. Jangan pernah mengunggah berkas `.gs` ke GitHub, karena repository GitHub Pages bersifat publik.

---

## 2. Gambaran cara kerja aplikasi

```
 HP / Laptop kasir & owner
        │  (buka https://USERNAME.github.io/NAMA-REPO/)
        ▼
 Frontend di GitHub Pages  ──fetch JSON──►  Google Apps Script (Web App /exec)
 (tampilan, cache lokal,                        │
  antrean offline)                              ├─ Google Sheets  → database (13 sheet + 6 sheet DE_*)
                                                ├─ Google Drive   → foto, template, PDF dokumen
                                                └─ Script Properties → rahasia (kunci sesi, kunci QR)
```

- **Frontend** hanya menyimpan satu alamat, yaitu URL `/exec`. Tidak ada token atau sandi di sana.
- **Login memakai PIN 6 digit** per pengguna. PIN disimpan dalam bentuk *hash* (tidak bisa dibaca balik).
- Hanya ada **dua peran**: **Owner** (sekaligus Superadmin, akses penuh) dan **Kasir** (hak aksesnya diatur Owner).
- Data ditampilkan dari cache lokal terlebih dulu, lalu diperbarui diam-diam dari server. Karena itu perpindahan menu terasa instan.

---

## 3. Tahap A — Pasang backend di Google Apps Script

> Gunakan **akun Google pemilik usaha**. Spreadsheet, folder Drive, dan PDF dokumen akan dibuat di Drive akun ini.

### A1. Buat proyek baru
1. Buka **https://script.google.com** lalu klik **New project** (Proyek baru).
2. Klik judul "Untitled project" di kiri atas dan ganti menjadi **Minuman Rempah Pelaut API**.

### A2. Tempel manifest `appsscript.json`
1. Klik ikon **⚙️ Project Settings** (Setelan proyek) di panel kiri.
2. Centang **Show "appsscript.json" manifest file in editor**.
3. Kembali ke **Editor** (ikon `< >`), lalu buka berkas `appsscript.json`.
4. Hapus seluruh isinya, tempel isi `appsscript.json` dari paket, lalu tekan **Ctrl+S**.

Manifest ini mengatur zona waktu **Asia/Makassar (WITA)**. Semua tanggal transaksi, closing, dan dokumen mengikuti jam lapak.

### A3. Tempel tiga berkas kode
1. Buka berkas `Code.gs` yang sudah ada, hapus isinya, lalu tempel isi **`Kode.gs`**. Ganti namanya menjadi `Kode` (klik ⋮ → Rename).
2. Klik **＋** di samping "Files" → **Script**, beri nama `Setup`, lalu tempel isi **`Setup.gs`**.
3. Klik **＋** → **Script**, beri nama `DocEngine`, lalu tempel isi **`DocEngine.gs`**.
4. Tekan **Ctrl+S** untuk menyimpan semuanya.

> 💡 Urutan berkas di editor tidak berpengaruh. Pastikan saja ketiganya tersimpan tanpa tanda titik merah.

### A4. Jalankan `setupAplikasi` (sekali saja)
1. Di toolbar atas, pilih fungsi **`setupAplikasi`** dari dropdown, lalu klik **▶ Run**.
2. Akan muncul jendela izin. Klik **Review permissions**, lalu pilih akun Anda.
3. Kemungkinan besar muncul peringatan **"Google hasn't verified this app"**. Ini **normal** untuk skrip buatan sendiri. Klik **Advanced**, lalu **Go to Minuman Rempah Pelaut API (unsafe)**, lalu **Allow**.
4. Tunggu sekitar **1–3 menit**. Setup membuat spreadsheet, folder, 84 hari data demo, dan 4 template dokumen.

Log eksekusi (panel bawah) akan berakhir kurang lebih seperti ini:

```
✅ SETUP SELESAI dalam 74 detik
   Spreadsheet : https://docs.google.com/spreadsheets/d/…
   Folder Drive: https://drive.google.com/drive/folders/…
   Akun demo   : Haji Ridwan (Owner) PIN 123456 • Budi Pratama (Kasir) PIN 111111 • Dimas Saputra (Kasir) PIN 222222
   ⚠️ Setelah uji coba, buka Pengaturan → "Mulai Data Riil" untuk mengosongkan data demo & mengganti PIN.
   Langkah berikut: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone)
```

`setupAplikasi` **aman dijalankan ulang**. Ia tidak menimpa data, tidak membuat spreadsheet kedua, dan tidak mengganti kunci rahasia yang sudah ada.

> Ingin langsung mulai **tanpa** data demo? Sebelum menjalankan setup, buka `Setup.gs` dan ubah `const SETUP_DENGAN_DEMO = true;` menjadi `false`. PIN Owner acak akan tampil sekali di log; catat sebelum menutupnya.

### A5. Deploy sebagai Web App
1. Klik **Deploy** (kanan atas), lalu **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" dan pilih **Web app**.
3. Isi:
   - **Description**: `v1.0.0`
   - **Execute as**: **Me** (email Anda)
   - **Who has access**: **Anyone**
4. Klik **Deploy**, lalu salin **Web app URL**. Bentuknya seperti ini:
   `https://script.google.com/macros/s/AKfycb…panjang…/exec`
   (Akun Google Workspace: `https://script.google.com/a/macros/domain-anda/s/AKfycb…/exec`)

> **"Anyone" aman.** Siapa pun bisa *menghubungi* alamat ini, tetapi semua data hanya keluar setelah login PIN yang sah. Hak tiap peran dicek ulang di server pada setiap permintaan.

### ✅ Berhasil bila…
Buka URL `/exec` tadi di tab browser baru. Anda akan melihat teks JSON kira-kira seperti ini:

```json
{"success":true,"data":{"aplikasi":"Minuman Rempah Pelaut API","versi":"1.0.0",…},"message":"API aktif. Gunakan POST."}
```

---

## 4. Tahap B — Isi alamat backend di `js/config.js`

1. Ekstrak `rempah-pelaut-frontend.zip`. Contoh lokasi: `C:\Users\NamaAnda\Documents\rempah-pelaut-frontend`.
2. Buka `js/config.js` dengan Notepad (atau VS Code).
3. Ganti teks `GANTI_DENGAN_ID_DEPLOYMENT` sehingga barisnya berisi URL lengkap dari langkah A5:

```js
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycb…panjang…/exec'
};
```

4. Simpan. **Hanya berkas ini yang perlu diubah.**

> Bila URL belum diisi atau formatnya salah, aplikasi menampilkan layar **"Konfigurasi belum lengkap"**. Dengan begitu kesalahan ini langsung terlihat dan tidak menjadi error tersembunyi.

---

## 5. Tahap C — Unggah frontend ke GitHub Pages

> **Jangan memakai tombol "Upload files" di situs GitHub.** Cara itu meratakan semua berkas ke satu folder, sehingga `css/` dan `js/` hilang dan tampilan rusak. Selalu pakai Git dari terminal seperti di bawah.

### C1. Pasang Git (sekali seumur komputer)
- **Windows**: unduh dari **https://git-scm.com/download/win** lalu install dengan pilihan bawaan.
- **Mac**: buka Terminal dan ketik `git --version`. Bila belum ada, macOS akan menawarkan instalasi.

Cek hasilnya:
```bash
git --version
```

### C2. Atur identitas Git (sekali saja)
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```
`user.name` bebas, hanya label pada riwayat perubahan. Isi `user.email` dengan email akun GitHub Anda.

### C3. Buat repository di GitHub
1. Daftar atau masuk di **https://github.com**.
2. Klik **＋**, lalu **New repository**.
3. Isi nama, misalnya `rempah-pelaut`. Pilih **Public**, karena GitHub Pages gratis hanya untuk repository publik.
4. **Jangan** centang README, .gitignore, maupun license. Klik **Create repository**.

### C4. Masuk ke folder yang BENAR
Folder kerjanya adalah **`rempah-pelaut-frontend`**, yaitu folder hasil ekstrak ZIP yang langsung berisi `index.html`.

Cara cepat di Windows: buka folder itu di File Explorer, klik address bar, ketik `powershell`, lalu tekan Enter.

Lalu periksa isinya:
```powershell
dir
```
**Wajib** terlihat `index.html`, `verify.html`, folder `css`, `js`, dan `assets` di daftar teratas. Kalau yang terlihat justru satu folder lain, Anda berada satu tingkat terlalu tinggi. Masuk dulu dengan `cd nama-folder`, lalu periksa lagi.

### C5. Kirim ke GitHub
Jalankan **satu per satu**:
```bash
git init
git add .
git commit -m "Upload pertama Minuman Rempah Pelaut"
git branch -M main
git remote add origin https://github.com/USERNAME/rempah-pelaut.git
git push -u origin main
```
- Perhatikan **titik** di `git add .`.
- Saat `git push` meminta **Password**, yang diisi adalah **Personal Access Token**, bukan sandi akun GitHub. Saat token ditempel, layar **tidak menampilkan karakter apa pun**. Ini normal, langsung tekan Enter.
- Membuat token: buka **https://github.com/settings/tokens**, pilih **Generate new token (classic)**, centang **repo**, lalu **Generate**. Salin token `ghp_…` karena hanya tampil sekali.

Tanda berhasil: muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### C6. Aktifkan GitHub Pages
1. Di halaman repository: **Settings**, lalu **Pages**.
2. Pada **Source** pilih **Deploy from a branch**, lalu **Branch: main / (root)**, lalu **Save**.
3. Centang **Enforce HTTPS**. Ini wajib, karena mode offline dan pemasangan sebagai aplikasi di HP hanya berjalan di HTTPS.
4. Tunggu 1–2 menit lalu muat ulang halaman. Akan muncul: *"Your site is live at https://USERNAME.github.io/rempah-pelaut/"*.

### ✅ Berhasil bila…
Alamat tersebut menampilkan layar login dengan logo kompas, tiga kartu pengguna demo, dan papan PIN.

---

## 6. Tahap D — Login pertama & uji coba data demo

| Pengguna | Peran | PIN demo |
|---|---|---|
| Haji Ridwan | Owner / Pemilik (Superadmin) | `123456` |
| Budi Pratama | Kasir Gerobak | `111111` |
| Dimas Saputra | Kasir Gerobak | `222222` |

Data demo mencakup:
- 84 hari transaksi (sekitar 1.450 transaksi);
- 19 menu lengkap dengan ilustrasi foto, 24 bahan baku, dan 44 aset (total Rp 15.199.929);
- riwayat opname, closing harian berantai, serta 3 contoh dokumen resmi (Terbit, Menunggu TTD, Draf).

Hari pertama data demo sama persis dengan contoh di PRD: 71 cup, saldo Rp 8.575.000 → Rp 9.245.500.

Saran uji coba (sekitar 10 menit):
1. **Kasir (Budi)**: tekan **F2** atau **Transaksi baru**, pilih menu (coba tombol tampilan **kartu/daftar** di samping kotak cari), lalu **Simpan transaksi**. Ringkasan pesanan menampilkan nama setiap menu.
2. **Batalkan transaksi**: buka **Riwayat**, centang transaksi tadi → **Batalkan** → tulis alasan. Transaksi tetap terlihat dengan tanda *Dibatalkan* dan tidak dihitung di omset.
3. **Mode offline**: menu akun → **Uji mode offline**, lalu simpan transaksi. Transaksi berstatus **Pending**. Matikan uji offline; transaksi terkirim otomatis tanpa data ganda.
4. **Pengeluaran**: catat biaya. Bila melewati plafon harian, kasir ditolak, kecuali Owner mengizinkannya.
5. **Owner (Haji Ridwan)**: buka **Dashboard** dan **Analitik penjualan** (ganti 7/30/90 hari, arahkan kursor ke grafik).
6. **Laporan & unduh**: tekan **Pratinjau & unduh**, periksa tabel/PDF-nya, lalu unduh Excel atau PDF.
7. **Daily closing**: periksa rumus saldo, lalu **Closing & kunci**. Setelah itu POS terkunci dan tombol + mati.
8. **Dokumen resmi**: buka dokumen "Menunggu tanda tangan", tanda tangani dengan PIN, lalu buka **Halaman verifikasi**.

> Di HP, buka alamat GitHub Pages di Chrome, lalu ⋮ → **Add to Home screen** (Tambahkan ke layar utama). Aplikasi akan terbuka layar penuh seperti aplikasi biasa.

---

## 7. Tahap E — Mulai memakai data riil

Setelah selesai mencoba, login sebagai **Owner** lalu buka **Pengaturan → Data & Sistem → Mulai Data Riil**:

1. Isi **saldo kas riil** saat ini dan **tanggal mulai**.
2. Pilih opsi tambahan bila perlu: hapus aset demo, nolkan stok, nonaktifkan kasir demo.
3. Konfirmasi dengan **PIN Owner**.

Yang terjadi:
- Transaksi, pengeluaran, belanja, opname, rekap, dan dokumen demo dikosongkan. Master menu dan bahan tetap ada sehingga bisa langsung diedit.
- Semua pengguna lain **wajib mengganti PIN** saat login berikutnya, dan sesi mereka diakhiri.
- Informasi PIN demo dihapus dari layar login.

Setelah itu, segera:
- ganti PIN Owner (menu profil → **Ganti PIN**);
- buka **Pengguna & PIN** untuk mengganti nama kasir demo dengan kasir sebenarnya;
- buka **Master Menu** untuk menyesuaikan harga dan foto produk asli (unggah foto langsung dari HP; foto disimpan di Drive).

---

## 8. Pengaturan Owner (Superadmin)

Menu **Pengaturan Aplikasi** hanya bisa dibuka Owner:

| Tab | Yang bisa diubah |
|---|---|
| **Identitas & Logo** | Nama aplikasi, nama singkat, tagline, nama lapak, alamat, kota, logo, dan **URL publik** (lihat bagian 9) |
| **Warna & font** | 5 preset tema, 11 warna (aksen, latar, kartu, teks, status), font judul & isi (Google Fonts), kelengkungan sudut. Pratinjau langsung sebelum disimpan |
| **Keamanan & PIN** | Panjang PIN (4–8), batas salah & lama dikunci, lama sesi, kunci layar otomatis, tolak PIN lemah, wajib ganti berkala, aksi yang meminta PIN ulang, PIN tanda tangan terpisah (lihat bagian 17) |
| **Peran & hak akses** | Nama tampilan peran Owner/Kasir, centang menu yang boleh dibuka Kasir, serta 6 aturan Kasir: ubah harga dinamis, batalkan transaksi sendiri, tanggal mundur, lihat saldo kas, lewati plafon, ajukan slip dokumen |
| **Operasional Lapak** | Target cup harian, plafon biaya operasional kasir per hari, jam buka/tutup, saldo awal pertama, tanggal mulai pembukuan |
| **Kategori & Master** | Kategori biaya (dengan nominal acuan), tombol cepat biaya, metode pembayaran, jenis pesanan, kategori menu, kategori stok, kategori aset, satuan |
| **Data & sistem** | Status sistem, impor dari spreadsheet lama (dengan pratinjau), riwayat aktivitas (bisa dipratinjau & diunduh), Mulai data riil |

Menu **Pengguna & PIN** dan **Pengaturan** selalu khusus Owner dan tidak bisa diberikan ke Kasir. Ini disengaja, agar Kasir tidak bisa menaikkan hak aksesnya sendiri.

---

## 9. Dokumen resmi ber-QR & halaman verifikasi

### Template bawaan
Setup membuat empat template Google Docs di folder Drive **Minuman Rempah Pelaut — Sistem / Template Dokumen**:

| Kode | Dokumen | Penanda tangan |
|---|---|---|
| `SLIP_CLOSING` | Slip Tutup Kasir Harian | Kasir yang melakukan closing → Owner |
| `NOTA_BELANJA` | Nota Belanja Bahan | Owner |
| `BA_OPNAME` | Berita Acara Stok Opname | Owner |
| `LAP_BULANAN` | Laporan Kas Bulanan | Owner |

**Tidak ada pilihan nama penanda tangan.** Setiap slot terikat ke akun:
- **Pembuat dokumen** — akun yang membuat draf, dengan PIN-nya sendiri. Slip tutup kasir hanya bisa dibuat oleh kasir yang melakukan closing hari itu (atau Owner).
- **Owner** — akun Owner mana pun yang sedang login, dengan PIN-nya sendiri.

Owner dapat mengubah label slot dan siapa yang menandatanganinya (Pembuat/Owner) di **Dokumen resmi → Template → Ubah**.

Anda boleh mendesain ulang template langsung di Google Docs: font, kop surat, tata letak, dan logo. Setelah itu buka **Dokumen Resmi → tab Template → Pindai Ulang**. Bidang isian baru otomatis menjadi form. Tombol **Edit di Google** membuka templatenya langsung.

Format penanda yang dikenali:
- `{{NAMA}}` — isian biasa.
- `{{TOTAL|rupiah}}`, `{{TOTAL|terbilang:rupiah}}`, `{{TANGGAL|tanggal:d MMMM yyyy}}`, `{{X|bawaan:-}}`, `{{NAMA|kapital}}` — isian dengan pengubah.
- `{{#MENU}} … {{/MENU}}` — baris tabel berulang.
- `{{?CATATAN}} … {{/CATATAN}}` — bagian yang hanya tampil bila ada isinya.
- `{{NOMOR}}`, `{{QR}}`, `{{KODE_VERIFIKASI}}` — diisi server saat terbit.

### Alur
**Draf → Menunggu TTD → Terbit** (atau **Ditarik**).
- Setiap penanda tangan menyetujui dengan **sesi login + PIN** sesuai urutan slot. Bila Owner mengaktifkan *PIN tanda tangan terpisah*, yang diminta adalah PIN tanda tangan.
- Owner dapat **melewati** slot dengan alasan wajib, yang tercatat di riwayat dan di dokumen ("atas nama").
- Saat tanda tangan terakhir, server memberi nomor surat dan kode verifikasi. **PDF ber-QR dibuat di latar** (sekitar 10 detik) sehingga Anda tidak perlu menunggu; daftar dokumen menulis "PDF sedang disiapkan" sampai selesai. Bila HP terputus, server menyelesaikannya otomatis dalam beberapa menit.
- Tombol **Pratinjau** (draf) dan **Lihat & unduh PDF** (terbit) menampilkan PDF di dalam aplikasi sebelum diunduh.

**Anti-pemalsuan.** Angka di slip, nota, berita acara, dan laporan bulanan **selalu dihitung server dari pembukuan**; kasir tidak bisa mengetik angkanya. Saat diajukan, server menyimpan sidik data. Bila pembukuan berubah sebelum semua tanda tangan selesai, tanda tangan diulang dari awal dengan angka terbaru. Bila berubah setelah terbit (koreksi Owner), dokumen tetap sah sebagai bukti saat terbit tetapi diberi tanda **Dikoreksi** di aplikasi dan di halaman verifikasi.

### URL publik untuk QR (penting)
QR berisi tautan ke `verify.html` di situs GitHub Pages Anda. Isi alamatnya sekali di **Pengaturan → Identitas & Logo → URL publik aplikasi**, misalnya `https://USERNAME.github.io/rempah-pelaut/`.

Bila belum diisi, aplikasi mengisinya otomatis pada penandatanganan pertama dari situs GitHub Pages.

Halaman verifikasi:
- dapat dibuka siapa saja tanpa login;
- menampilkan status **Asli & berlaku**, **Asli, data sudah dikoreksi** (beserta riwayat koreksinya), atau **Ditarik, tidak berlaku**;
- dapat mencocokkan berkas PDF yang diterima. Sidik jari dihitung di perangkat pemeriksa, jadi berkas tidak diunggah ke mana pun.

---

## 10. Import data dari spreadsheet lama

Bila sebelumnya Anda mencatat di Google Sheets lain dengan **nama kolom yang sama** seperti sheet aplikasi ini:

1. **Pengaturan → Data & Sistem → Import**.
2. Tempel URL atau ID spreadsheet lama. Spreadsheet lama **hanya dibaca**, tidak pernah diubah.
3. Pilih sheet yang ingin diimpor, lalu klik **Pindai (Dry-run)**. Anda akan melihat jumlah data yang akan *ditambah / diperbarui / dilewati* tanpa ada yang ditulis.
4. Bila sudah sesuai, klik **Jalankan Import**.

Import **aman diulang**. Data dicocokkan berdasarkan ID atau tanggal, sehingga menjalankan dua kali tidak menghasilkan data ganda. Kolom diambil berdasarkan **nama header**, bukan urutan, jadi urutan kolom boleh berbeda. Spreadsheet lama harus bisa dibuka oleh akun Google yang sama.

Sheet database aplikasi: `Master_Menu`, `Trx_Penjualan`, `Trx_Penjualan_Detail`, `Trx_Pengeluaran_Operasional`, `Trx_Belanja_Bahan`, `Master_Stok`, `Aset_Inventaris`, `Rekap_Kas_Harian`, `Pengguna`, `Log_Stok_Opname`, `Pengaturan`, `Audit_Log`, `AppConfig`, ditambah 6 sheet Doc Engine berawalan `DE_`.

> ⚠️ Hindari mengedit spreadsheet database secara langsung saat aplikasi sedang dipakai. Bila terpaksa, tekan **Perbarui Data** di aplikasi sesudahnya. Jangan mengganti nama sheet atau judul kolom.

---

## 11. Script Properties — apa yang otomatis, apa yang manual

Lokasi: editor Apps Script → **⚙️ Project Settings → Script Properties**. **Semuanya diisi otomatis oleh `setupAplikasi`.** Anda tidak perlu mengetik apa pun di sini.

| Kunci | Isi | Keterangan |
|---|---|---|
| `SPREADSHEET_ID` | ID spreadsheet database | Otomatis |
| `ROOT_FOLDER_ID`, `FOLDER_TEMPLATE`, `FOLDER_DOKUMEN`, `FOLDER_FOTO`, `FOLDER_EKSPOR` | ID folder Drive | Otomatis |
| `SESSION_SECRET` | Kunci tanda tangan sesi login | Otomatis, **rahasia**. Jangan dihapus atau dibagikan |
| `VERIF_SECRET` | Kunci tanda tangan tautan QR | Otomatis, **rahasia**. Bila diganti, QR lama tidak lagi valid |
| `KEEP_WARM` | `on` / `off` | Diatur lewat `matikanKeepWarm()` / `nyalakanKeepWarm()` |
| `DEMO_PIN_INFO` | Daftar PIN demo untuk layar login | Terhapus otomatis saat **Mulai Data Riil** |
| `KUNCI_PIN_…`, `REV_…` | Penguncian PIN & pencabutan sesi | Dikelola aplikasi |

Aturan keamanan yang diterapkan:
- Tidak ada token, sandi, atau kunci di kode, di spreadsheet, maupun di GitHub. PIN hanya tersimpan sebagai *hash* bergaram.
- Salah PIN **5 kali** mengunci akun tersebut selama **15 menit**.
- Sesi login berlaku 14 jam. Sesi dicabut otomatis bila Owner mereset PIN pengguna, menonaktifkannya, atau mengubah perannya, dan semua sesi berakhir bila `rotasiSecretSesi()` dijalankan.
- Siapa pun yang punya akses **edit** ke proyek Apps Script bisa melihat Script Properties. Jangan menambahkan editor sembarangan.

---

## 12. Performa, pemanasan server & kuota

Optimasi yang sudah terpasang:
- **Cache berlapis**: cache lokal di browser, cache server berversi, dan indeks harian. Saat diuji, berpindah 13 menu hanya memicu **5 panggilan server**, dengan waktu tampil 20–170 ms per halaman.
- **Gabung permintaan**: beberapa data dibaca dalam satu panggilan.
- **Simpan optimis**: tampilan berubah seketika, sementara server bekerja di belakang.
- **Antrean offline**: transaksi tidak hilang saat sinyal putus.
- **Pemanasan server (keepWarm)**: trigger tiap 1 menit, **hanya aktif pada jam operasional** (90 menit sebelum buka hingga 60 menit setelah tutup), supaya server tidak "dingin" saat kasir mulai bekerja.

Kuota Google:
- Akun Gmail biasa punya batas waktu trigger sekitar **90 menit per hari**; Workspace sekitar 6 jam per hari. keepWarm memakai kira-kira 10–20 menit per hari.
- Bila kuota mendekati batas, jalankan `matikanKeepWarm()`. Aplikasi tetap berjalan, hanya permintaan pertama di pagi hari mungkin 2–4 detik lebih lambat.
- Pemanasan menjamin cache data terisi, tetapi tidak bisa menjamin mesin Google selalu menyala.

Cek kondisi kapan saja dengan menjalankan `cekPerforma()` di editor, atau buka **Pengaturan → Data & Sistem → Status Sistem**.

---

## 13. Cara update aplikasi di kemudian hari

**Backend** (bila ada versi baru berkas `.gs`):
1. Cadangkan dulu: salin isi berkas lama ke Notepad.
2. Tempel kode baru, lalu **Ctrl+S**.
3. Jalankan `perbaruiSkema()`. Fungsi ini hanya **menambah** sheet atau kolom baru dan tidak menghapus apa pun.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
   > Pakai **Edit**, bukan *New deployment*. Dengan begitu URL `/exec` tetap sama dan `config.js` tidak perlu diubah.

**Frontend**: salin berkas baru ke folder `rempah-pelaut-frontend` (timpa yang lama, **kecuali `js/config.js`**), lalu:
```bash
git add .
git commit -m "Update ke versi baru"
git push
```
Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R** di browser. Di HP, tutup dan buka lagi aplikasinya.

---

## 14. Fungsi yang bisa dijalankan dari editor

Pilih nama fungsi di dropdown editor, lalu klik **▶ Run**.

| Fungsi | Kegunaan |
|---|---|
| `setupAplikasi` | Pemasangan awal. Aman diulang |
| `perbaruiSkema` | Menambah sheet/kolom baru setelah update (aditif), serta mengganti tema bawaan v1.0 ke tampilan v1.1 bila belum pernah diubah |
| `cekPerforma` | Status cache, trigger, dan ukuran Script Properties |
| `matikanKeepWarm` / `nyalakanKeepWarm` | Mematikan/menyalakan pemanasan server |
| `installTriggers` | Memasang ulang trigger bila terhapus |
| `resetPinPengguna` | Owner lupa PIN. Ubah `ID_USER` di dalam fungsi (bawaan `USR-001`). PIN baru tampil **sekali** di log dan wajib diganti setelah login |
| `rotasiSecretSesi` | Mengeluarkan semua orang dari aplikasi, misalnya bila HP kasir hilang |
| `hapusDataDemo` | Versi editor dari **Mulai Data Riil**. Isi `SALDO_AWAL_RIIL` di dalam fungsi dulu |

---

## 15. Batasan yang perlu diketahui

- **Tanda tangan dokumen memakai sesi login + PIN** (atau PIN tanda tangan terpisah), bukan login Google per pejabat, karena kasir dan owner masuk dengan PIN. Setiap tanda tangan tetap tercatat lengkap (siapa, kapan, metode) dan dicek server.
- **Pengguna tidak dihapus**, hanya dinonaktifkan, agar nama di riwayat transaksi dan dokumen tetap jelas.
- **Data yang dibatalkan tidak hilang.** Ia tetap tersimpan di sheet dengan status *BATAL* beserta alasannya, dan tetap tampil di daftar dengan tanda *Dibatalkan*.
- **Penerbitan dokumen massal** (antrean `DE_Antrean`) belum diaktifkan. Dokumen diterbitkan satu per satu.
- **Template Google Slides** didukung untuk isian biasa, tetapi baris berulang `{{#BLOK}}` hanya untuk Google Docs dan Sheets.
- **Dokumen demo** dibuat sebelum alamat GitHub Pages diketahui, sehingga QR-nya memakai alamat relatif. Dokumen baru setelah URL publik diisi memakai alamat lengkap. Dokumen demo ikut terhapus saat **Mulai Data Riil**.
- **Saldo kas besar demo terus naik** hingga sekitar Rp 55 juta. Ini karena PRD tidak memiliki konsep pengambilan uang oleh pemilik (prive). Bila Anda ingin mencatatnya, sampaikan dan fitur itu bisa ditambahkan.
- **Deskripsi menu demo dikosongkan** agar tidak mengarang klaim khasiat. Silakan isi sendiri di Master Menu.
- **Closing harus berurutan tanggal.** Membuka kunci closing lama akan menghitung ulang saldo hari-hari setelahnya secara otomatis.

---

## 16. Kendala umum & solusinya

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| Layar "Konfigurasi belum lengkap" | `js/config.js` belum diisi atau salah format | Isi URL `/exec` lengkap (bagian 4), lalu `git add .` → `commit` → `push` |
| GitHub Pages menampilkan **404** | `git init` dijalankan di folder yang salah | Pastikan root repository berisi `index.html`. Push ulang dari folder `rempah-pelaut-frontend` dengan `git push -u origin main --force` |
| Tampilan polos tanpa warna | Berkas diunggah lewat web GitHub sehingga folder `css/` hilang | Unggah ulang lewat Git (bagian 5) |
| "Tidak dapat terhubung ke server" | Deploy belum diatur **Anyone**, atau URL salah | Periksa langkah A5. Buka URL `/exec` di browser; harus muncul JSON |
| Data baru tidak muncul setelah update backend | Lupa membuat **New version** saat deploy | **Manage deployments → Edit → New version** |
| "PIN dikunci sementara" | Salah PIN 5 kali | Tunggu 15 menit, atau Owner menjalankan `resetPinPengguna` |
| Owner lupa PIN | — | Jalankan `resetPinPengguna` (bagian 14) |
| Jam transaksi selisih 1 jam | Zona waktu manifest bukan Asia/Makassar | Periksa `appsscript.json` (bagian A2) |
| `Password authentication is not supported` saat `git push` | GitHub tidak menerima sandi akun | Gunakan Personal Access Token (bagian C5) |
| Halaman masih versi lama | Cache browser | **Ctrl+Shift+R**, atau buka di jendela Incognito |
| QR dokumen membuka alamat yang salah | URL publik belum diisi atau salah | Isi di **Pengaturan → Identitas → URL publik** |
| Pita "versi server berbeda" | Frontend dan backend tidak sama versinya | Ulangi bagian 0a (Deploy → **Edit → New version**) |
| Tombol + di POS mati | Hari ini sudah Daily closing | Benar sesuai aturan. Transaksi susulan dicatat Owner lewat **Catat transaksi susulan** |
| Diminta PIN saat membatalkan/mengubah data | Aksi itu dicentang di **Keamanan & PIN → Aksi yang meminta PIN ulang** | Masukkan PIN, atau Owner menghapus centangnya |
| "Anda belum membuat PIN tanda tangan" | Owner mengaktifkan PIN tanda tangan terpisah | Menu akun → **Buat PIN tanda tangan** |
| Transaksi berstatus **Gagal** | Server menolak data (mis. hari sudah closing) | Menu akun → **Status sinkron** → lihat alasannya, lalu **Coba lagi** atau **Buang** (bagian 18) |
| Tampilan masih versi lama setelah update | Aplikasi lama masih terbuka di tab lain | Tutup semua tab aplikasi, buka lagi, tekan **Ctrl+Shift+R** |
| Muncul "PDF sedang disiapkan" lama | Pembuatan PDF di latar terputus | Buka dokumennya → **Siapkan PDF** |

---

## 17. Pembatalan, koreksi & aturan PIN (v1.1)

### Batalkan (void), bukan hapus
Setiap daftar data punya kotak centang. Centang satu atau beberapa baris → muncul bilah aksi → **Batalkan** → tulis alasan.
Data yang dibatalkan **tetap tersimpan** dengan tanda *Dibatalkan*, alasan, nama pembatal, dan waktu, lalu **tidak dihitung** di omset, saldo, stok, maupun laporan.

| Data | Kasir | Owner |
|---|---|---|
| Transaksi POS & pengeluaran | Hanya miliknya sendiri, **hari ini**, **sebelum closing**, dan hanya bila aturan *Boleh membatalkan transaksi sendiri* aktif | Semua, termasuk hari yang sudah closing (dengan alasan koreksi) |
| Nota belanja, stok opname | Tidak punya akses (kecuali diberi akses halaman) | Semua. Membatalkan nota mengurangi stok lagi; membatalkan opname mengembalikan stok sistem |
| Menu, bahan, aset | — | Menu yang sudah pernah terjual hanya dinonaktifkan; bahan diarsipkan; aset dihapus dari daftar aktif. Semua bisa dipulihkan |
| Draf dokumen | Draf miliknya | Semua draf. Dokumen yang sudah terbit tidak dihapus, hanya bisa **ditarik** |

Server memeriksa ulang semua aturan ini, jadi tidak bisa diakali dari HP kasir.

### Koreksi hari yang sudah closing (Owner)
Buka **Rekap kas** → baris tanggalnya → **Transaksi** atau **Biaya** → ubah atau batalkan → tulis alasan koreksi saat diminta.
- Hari itu **tetap terkunci**; kasir tetap tidak bisa menambah data.
- Saldo hari itu dan **semua hari sesudahnya** dihitung ulang otomatis.
- Slip tutup kasir yang sudah terbit untuk tanggal itu diberi tanda **Dikoreksi** (siapa, kapan, alasan). Halaman verifikasinya menyatakan "Asli, data sudah dikoreksi".
- Tombol 🔓 (buka kunci) tetap ada bila kasir perlu mencatat sendiri transaksi yang terlewat.

### Aturan PIN (Pengaturan → Keamanan & PIN)
| Pengaturan | Bawaan | Keterangan |
|---|---|---|
| Panjang PIN | 6 digit | 4–8. Pengguna yang PIN-nya beda panjang tetap bisa login dengan PIN lama, lalu langsung diminta membuat PIN baru |
| Batas salah PIN | 5 kali | Lalu dikunci selama *lama dikunci* (bawaan 15 menit) |
| Lama sesi | 14 jam | Setelah itu wajib login ulang |
| Kunci layar otomatis | 0 (mati) | Layar terkunci setelah sekian menit tanpa aktivitas; buka dengan PIN |
| Tolak PIN lemah | Aktif | 111111, 123456, 654321, 121212, dan pola mudah lainnya ditolak |
| Wajib ganti PIN | 0 (tidak wajib) | Mis. 90 hari |
| Aksi yang meminta PIN ulang | Batal, ubah transaksi, buka kunci closing, tarik dokumen, reset PIN | Owner bebas menambah/mengurangi. Tanda tangan dokumen, mengubah aturan PIN, dan Mulai data riil **selalu** meminta PIN |
| PIN tanda tangan terpisah | Mati | Bila aktif, setiap pengguna membuat PIN khusus tanda tangan dari menu akun. Owner bisa menghapusnya di **Pengguna & PIN** bila pengguna lupa |

---

## 18. Status sinkron: Pending, Berhasil, Gagal

Transaksi POS dan pengeluaran yang disimpan saat sinyal hilang tetap tersimpan di HP:

| Status | Arti | Yang perlu dilakukan |
|---|---|---|
| **Pending** | Tersimpan di HP, belum sampai ke server | Tidak perlu apa-apa. Dikirim otomatis begitu sinyal kembali |
| **Berhasil** | Sudah tercatat di Google Sheets | — |
| **Gagal** | Server menolak (mis. hari sudah closing, menu nonaktif) | Menu akun → **Status sinkron** → baca alasannya → **Coba lagi** atau **Buang** |

Pilihan lain di menu akun:
- **Tes koneksi server** — memeriksa alamat `/exec`, versi server, dan lama respons.
- **Uji mode offline** — mensimulasikan sinyal hilang untuk latihan.

Daily closing menolak dijalankan selama masih ada data Pending/Gagal, agar tidak ada transaksi yang tertinggal.

---

*Minuman Rempah Pelaut — "Mencari Rezeki dengan Hidup Sehat" · Bugis, Tj. Redeb, Berau, Kalimantan Timur*
