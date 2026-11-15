# SISTEM INFORMASI DESA PINANGSARI

Portal informasi resmi dan pelayanan administrasi digital untuk **Desa Pinangsari**, Dusun Wanasari RT.003/RW.003, Kecamatan Ciasem, Kabupaten Subang, Provinsi Jawa Barat, Indonesia.

## Fitur Utama

### Website Publik
- **Beranda (`/`)**: Hero resmi desa, pengumuman penting/prioritas, 8 statistik utama desa (Penduduk, KK, Laki-laki, Perempuan, RT, RW, Dusun, UMKM), akses cepat layanan warga, berita terbaru, agenda kegiatan, dan pratinjau potensi desa.
- **Profil Desa (`/profil`)**: Sejarah desa, visi & misi, letak geografis, batas wilayah, kondisi wilayah, informasi umum desa, dan ringkasan perangkat desa.
- **Pemerintahan Desa (`/pemerintahan`)**: Bagan struktur organisasi desa hierarkis (Kepala Desa, Sekretaris Desa, Kasi, Kaur, Kepala Dusun, RW, RT).
- **Berita Desa (`/berita`, `/berita/:slug`)**: Pencarian berita, filter 9 kategori, paginasi, halaman baca artikel, dan penghitung pembaca.
- **Pengumuman (`/pengumuman`)**: Filter prioritas & kategori serta unduhan lampiran resmi.
- **Statistik Desa (`/statistik`)**: Visualisasi Chart.js (Pie, Bar, Line) untuk statistik penduduk (jenis kelamin, pendidikan, pekerjaan) serta tren pelayanan online tanpa menampilkan data pribadi (PII) warga.
- **Pelayanan Desa Online (`/pelayanan`)**: Pengajuan 8 jenis layanan surat menyurat secara daring (validasi NIK/KK 16 digit + unggah dokumen pendukung JPG/JPEG/PNG/PDF), kode pelacakan `PSG-YYYY-00001`, dan pelacakan status publik terproteksi (`Diajukan` → `Diverifikasi` → `Diproses` → `Selesai` / `Ditolak`).
- **Potensi Desa (`/potensi`)**: Direktori potensi unggulan dengan filter 8 kategori.
- **Agenda Desa (`/agenda`)**: Tampilan Kalender Bulanan interaktif dan Daftar Agenda kegiatan desa.
- **Galeri (`/galeri`)**: Filter 8 kategori kegiatan masyarakat dengan grid foto dan lightbox interaktif.
- **Kontak & Aspirasi (`/kontak`)**: Informasi kontak resmi, integrasi Google Maps Platform (koordinat dikelola admin), serta formulir Pesan Masyarakat.
- **Fitur Tambahan**: Pencarian global, Mode Gelap (Dark Mode), Breadcrumb, Back to Top, SEO (OpenGraph, JSON-LD, `/sitemap.xml`, `/robots.txt`).

### Dashboard Administrator (`/admin/login`, `/admin/*`)
- **Keamanan & Autentikasi**: Login username & password (`bcryptjs`), Math Captcha tervalidasi di server, HTTP-only signed session cookie, proteksi CSRF (`X-CSRF-Token`), auto-logout 2 jam, dan audit log aktivitas (`activity_logs`).
- **Kontrol Akses Berbasis Peran (RBAC)**: `SUPER_ADMIN`, `OPERATOR_DESA`, dan `KEPALA_DESA`.
- **Modul Pengelolaan**: Dashboard ringkasan & grafik, Profil Desa, Pemerintahan Desa, Data Penduduk (privat + pencarian/filter + Import/Export Excel `.xlsx`), Data Keluarga/KK (privat), Berita Desa, Pengumuman, Pelayanan Online (verifikasi & proses status + unduh lampiran), Potensi Desa, Agenda Desa, Galeri Multi-Foto, Pesan Warga, Laporan (Export PDF & Excel untuk 6 jenis laporan), Manajemen Pengguna & Log Aktivitas, Pengaturan (Kontak, Media Sosial, Pemilih Koordinat Google Maps, Backup Database JSON), serta **Panduan Domain Resmi `.desa.id` (`/admin/panduan-domain` & `/PANDUAN_DOMAIN_RESMI.md`)**.

---

## Struktur Folder

```text
├── database/
│   └── desa_pinangsari.sql       # Skema MySQL 8+ lengkap (16 tabel + seed awal)
├── server/
│   ├── auth.ts                   # Session cookie, Math Captcha, CSRF, RBAC, audit log
│   ├── db.ts                     # Inisialisasi SQLite (node:sqlite) & seed Data Contoh
│   ├── routes.ts                 # REST API publik & terproteksi admin
│   └── upload.ts                 # Middleware upload dokumen/foto (multer)
├── server.ts                     # Entrypoint server Express + Vite/static + SEO routes
├── src/
│   ├── assets/images/            # Aset gambar ilustrasi desa
│   ├── components/               # Komponen UI reusable, Chart.js, Google Maps, Layout publik
│   ├── context/AppContext.tsx    # State global, tema gelap/terang, sesi admin, bootstrap
│   ├── lib/
│   │   ├── api.ts                # Klien fetch REST API + CSRF header
│   │   └── exportUtils.ts        # Utilitas Export Excel (xlsx) & PDF (jsPDF)
│   ├── pages/
│   │   ├── public/               # Halaman portal publik
│   │   └── admin/                # Halaman dashboard administrator
│   ├── types/                    # Definisi tipe TypeScript
│   ├── utils/
│   │   ├── villageLogic.ts       # Validasi NIK/KK, generator kode layanan, RBAC matrix, masking PII
│   │   └── villageLogic.test.ts  # Unit test logika inti (node:test)
│   ├── App.tsx                   # Routing aplikasi
│   ├── index.css                 # Konfigurasi Tailwind CSS v4 & tema
│   └── main.tsx                  # Entrypoint React + listener kuota Google Maps
├── .env.example                  # Contoh variabel environment
├── index.html                    # Meta SEO, OpenGraph, JSON-LD, Google Fonts
└── package.json                  # Skrip & dependensi proyek
```

---

## Instalasi & Menjalankan Aplikasi

### Prasyarat
- **Node.js 22+** (mendukung `node:sqlite` bawaan untuk penyimpanan persisten lokal)
- **npm** atau **bun**

### Langkah Menjalankan (Mode Lokal / Node.js)
1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env` dan sesuaikan nilainya bila diperlukan:
   ```bash
   cp .env.example .env
   ```
3. Jalankan server pengembangan (berjalan di port `3000`):
   ```bash
   npm run dev
   ```
4. Untuk membangun dan menjalankan mode produksi:
   ```bash
   npm run build
   npm start
   ```
5. Menjalankan unit test & pemeriksaan TypeScript:
   ```bash
   npx --yes tsx --test src/utils/villageLogic.test.ts
   npm run lint
   ```

### Konfigurasi Database MySQL 8+ (Opsional / Migrasi Eksternal)
Untuk kebutuhan deployment berbasis MySQL 8+ / PHP, skema tabel relasional lengkap (16 tabel beserta indeks, relasi foreign key, dan data awal kategori/jenis layanan) tersedia di:
- `/database/desa_pinangsari.sql`

Impor ke MySQL 8+:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS desa_pinangsari CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p desa_pinangsari < database/desa_pinangsari.sql
```
Pada lingkungan runtime Node.js saat ini, aplikasi otomatis menggunakan SQLite persisten (`desa_pinangsari.db`) dengan struktur skema yang sama agar langsung berjalan tanpa konfigurasi database eksternal.

---

## Akun Demo Administrator

Gunakan akun **DEMO** berikut untuk mengakses dashboard di `/admin/login`:

| Peran | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| Super Admin | `superadmin` | `Pinangsari@2026!` | Akses penuh seluruh modul, pengguna, & pengaturan |
| Operator Desa | `operator` | `Operator@2026!` | Pengelolaan data warga, layanan, konten, & laporan |
| Kepala Desa | `kades` | `Kades@2026!` | Ringkasan dashboard, monitoring layanan, & laporan |

> **Peringatan Keamanan Produksi:** Seluruh kredensial di atas hanya bersifat **DEMO**. Segera ubah seluruh kata sandi melalui menu **Pengguna** di Dashboard Admin serta atur `SESSION_SECRET` yang kuat pada file `.env` sebelum aplikasi digunakan secara resmi di lingkungan produksi.
