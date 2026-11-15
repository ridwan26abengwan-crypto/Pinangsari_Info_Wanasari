# Panduan Pembelian Domain Resmi `.desa.id` & Pengaturan DNS — Desa Pinangsari

Panduan ini disusun untuk Administrator Pemerintah Desa Pinangsari (Kecamatan Ciasem, Kabupaten Subang, Jawa Barat) agar dapat mendaftarkan domain resmi pemerintahan desa berakhiran **`.desa.id`**, mengarahkan **DNS Record** ke server hosting, mengaktifkan **HTTPS (SSL/TLS)**, dan meluncurkan aplikasi ini sebagai portal resmi pemerintah desa.

---

## Ringkasan Alur Kerja

1. **Siapkan Dokumen Resmi Pemerintah Desa** (SK Kepala Desa, KTP, Surat Permohonan, Surat Kuasa).
2. **Daftarkan / Beli Domain `.desa.id`** melalui Registrar Resmi terakreditasi PANDI atau fasilitasi Dinas Kominfo Kab. Subang (`domain.go.id`).
3. **Siapkan Server Hosting Produksi** (VPS Ubuntu/Debian atau Google Cloud Run) dan catat IP publiknya.
4. **Arahkan DNS Records (`A`, `CNAME`, `TXT`)** pada panel DNS registrar menuju server hosting.
5. **Aktifkan Reverse Proxy Nginx & SSL/TLS (HTTPS)** dengan Let's Encrypt Certbot.
6. **Amankan Kredensial Admin & Lengkapi Data Resmi Desa**.

---

## Tahap 1 — Persyaratan Dokumen Resmi Domain `.desa.id`

Domain `.desa.id` dikelola oleh **PANDI** (Pengelola Nama Domain Internet Indonesia) bersama Kementerian Komunikasi dan Digital (Kemkomdigi). Untuk menjaga keabsahan instansi pemerintah desa, siapkan pindaian dokumen berikut (format PDF/JPG yang jelas):

1. **e-KTP Pemohon** (Kepala Desa atau Perangkat Desa yang ditunjuk).
2. **SK Pengangkatan Kepala Desa Pinangsari** yang masih berlaku (ditetapkan oleh Bupati Subang).
3. **Surat Permohonan Pendaftaran Domain `.desa.id`**:
   - Menggunakan Kop Surat resmi **Pemerintah Desa Pinangsari**.
   - Ditandatangani oleh Kepala Desa Pinangsari dan dibubuhi **stempel basah** desa.
   - Mencantumkan nama domain yang diajukan (misal: `pinangsari.desa.id`).
4. **SK Perangkat Desa & Surat Kuasa** (wajib jika pendaftaran diajukan oleh Sekretaris Desa atau Operator IT).

### Aturan Penamaan Domain
- Gunakan nama resmi desa: `pinangsari.desa.id`.
- Jika nama `pinangsari.desa.id` sudah digunakan oleh desa bernama sama di kabupaten/provinsi lain di Indonesia, tambahkan nama kecamatan atau kabupaten sebagai pembeda, misalnya:
  - `pinangsari-ciasem.desa.id`
  - `pinangsari-subang.desa.id`

> **Catatan:** Anda dapat langsung menyalin atau mengunduh **Draft Surat Permohonan Resmi** yang sudah disesuaikan untuk Desa Pinangsari melalui menu **Panduan Domain** di Dashboard Administrator (`/admin/panduan-domain`).

---

## Tahap 2 — Cara Membeli & Mendaftarkan Domain `.desa.id`

Anda dapat memilih salah satu dari dua jalur resmi berikut:

### Jalur A: Melalui Registrar Resmi Terakreditasi PANDI (Cepat & Mandiri)
1. Buka salah satu registrar mitra resmi PANDI (daftar lengkap tersedia di `https://pandi.id/registrar/`).
2. Cek ketersediaan domain `pinangsari.desa.id` (atau alternatifnya).
3. Lakukan pemesanan dengan durasi minimal 1 tahun (biaya tahunan domain `.desa.id` umumnya sekitar Rp55.000–Rp100.000/tahun tergantung registrar). **Gunakan email resmi desa** saat registrasi akun agar kepemilikan domain tetap melekat pada Pemerintah Desa.
4. Selesaikan pembayaran menggunakan anggaran operasional/APBDes.
5. Unggah seluruh berkas persyaratan (Tahap 1) pada menu **Verifikasi Dokumen** di dashboard registrar.
6. Tunggu verifikasi oleh PANDI/Registrar (biasanya **1–3 hari kerja**) hingga status domain menjadi **Active**.

### Jalur B: Melalui Dinas Kominfo Kab. Subang / Portal `domain.go.id`
1. Ajukan permohonan fasilitasi domain pemerintahan desa ke **Dinas Komunikasi dan Informatika (Diskominfo) Kabupaten Subang** atau melalui portal pendaftaran instansi pemerintah `https://domain.go.id`.
2. Setelah disetujui, pastikan pengelola IT desa diberikan akses **DNS Management** untuk mengarahkan domain ke server tempat aplikasi ini berjalan.

---

## Tahap 3 — Menyiapkan Server Hosting Produksi

Aplikasi **Sistem Informasi Desa Pinangsari** berjalan di atas **Node.js 22+ & Express** (port default `3000`) dengan database SQLite persisten (`desa_pinangsari.db`) atau dapat dimigrasikan ke MySQL 8+ menggunakan `/database/desa_pinangsari.sql`.

Pada server VPS (misalnya Ubuntu 24.04 LTS):
1. Pastikan Node.js 22+, Nginx, dan PM2 terpasang.
2. Atur file `.env` produksi di server:
   ```env
   NODE_ENV="production"
   PORT="3000"
   APP_URL="https://pinangsari.desa.id"
   SESSION_SECRET="isi_dengan_string_acak_panjang_minimal_64_karakter"
   ```
3. Bangun dan jalankan aplikasi secara permanen di latar belakang:
   ```bash
   npm install
   npm run build
   pm2 start "npm start" --name desa-pinangsari
   pm2 save
   ```
4. Catat **Alamat IP Publik IPv4** server VPS Anda (misal `103.150.10.25` — ganti dengan IP server Anda yang sebenarnya).

---

## Tahap 4 — Mengarahkan DNS Records ke Server Hosting

Masuk ke panel kontrol registrar domain Anda (atau panel Cloudflare jika menggunakan nameserver Cloudflare), buka menu **DNS Management / Zone Editor**, lalu tambahkan record berikut:

### Opsi 1: Hosting VPS / Server Mandiri
| Type | Host / Name | Value / Target | TTL | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `A` | `@` | `<IP_PUBLIK_VPS>` | `3600` | Mengarahkan `pinangsari.desa.id` ke IP server VPS |
| `CNAME` | `www` | `pinangsari.desa.id` | `3600` | Mengarahkan `www.pinangsari.desa.id` ke domain utama |
| `TXT` | `@` | `v=spf1 a mx ip4:<IP_PUBLIK_VPS> ~all` | `3600` | Kebijakan SPF dasar (opsional untuk email resmi desa) |

> Jika DNS provider Anda tidak mendukung `CNAME` pada `www`, gunakan **`A` record** dengan Host `www` dan Value `<IP_PUBLIK_VPS>`.

### Opsi 2: Hosting Google Cloud Run (Custom Domain Mapping)
1. Buka Google Cloud Console → **Cloud Run** → pilih layanan aplikasi → **Manage Custom Domains** → **Add Mapping**.
2. Ikuti verifikasi kepemilikan domain dengan menambahkan record **`TXT`** (`google-site-verification=...`) di DNS registrar.
3. Setelah terverifikasi, tambahkan record **`A`** (4 IP Google yang ditampilkan Cloud Run) untuk host `@`, dan **`CNAME`** ke `ghs.googlehosted.com` untuk host `www`.

### Memeriksa Propagasi DNS
Perubahan DNS membutuhkan waktu propagasi antara **15 menit hingga maksimal 24 jam**. Uji dengan perintah:
```bash
nslookup pinangsari.desa.id
dig +short A pinangsari.desa.id
```
Pastikan hasilnya sudah mengarah ke IP server hosting Anda.

---

## Tahap 5 — Mengaktifkan HTTPS (SSL/TLS) dengan Nginx & Certbot

Website resmi pemerintahan **wajib** memakai **HTTPS** untuk mengenkripsi data NIK, Nomor KK, dokumen layanan warga, serta sesi login administrator.

1. Buat file konfigurasi Nginx di `/etc/nginx/sites-available/pinangsari.desa.id`:
   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name pinangsari.desa.id www.pinangsari.desa.id;

       client_max_body_size 15M;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
2. Aktifkan konfigurasi dan muat ulang Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pinangsari.desa.id /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Pasang sertifikat SSL gratis dari **Let's Encrypt** menggunakan Certbot (otomatis mengaktifkan HTTPS & redirect HTTP → HTTPS):
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d pinangsari.desa.id -d www.pinangsari.desa.id
   ```

---

## Tahap 6 — Finalisasi & Checklist Keamanan Portal Resmi

Sebelum mengumumkan alamat portal resmi kepada warga Desa Pinangsari:

- [ ] Buka `https://pinangsari.desa.id` dan pastikan gembok SSL HTTPS aktif tanpa peringatan browser.
- [ ] Login ke `/admin/login` lalu **ubah seluruh kata sandi akun administrator** melalui menu **Pengguna**.
- [ ] Perbarui **Profil Desa**, **Struktur Pemerintahan**, **Data Penduduk & KK**, serta isi **Koordinat Google Maps Kantor Desa** melalui menu **Pengaturan**.
- [ ] Uji pengajuan surat di halaman **Pelayanan Desa Online**, pelacakan kode `PSG-...`, dan formulir kontak.
- [ ] Jadwalkan pengunduhan cadangan database rutin melalui tombol **Unduh Backup Database** di menu **Pengaturan**.
