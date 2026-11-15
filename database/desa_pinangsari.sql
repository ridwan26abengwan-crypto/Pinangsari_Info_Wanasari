-- ============================================================================
-- SISTEM INFORMASI DESA PINANGSARI
-- Skema Database MySQL 8.0+ (Migrasi & Data Contoh Awal)
-- Alamat: Dusun Wanasari RT.003/RW.003, Desa Pinangsari,
--         Kecamatan Ciasem, Kabupaten Subang, Jawa Barat, Indonesia.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `desa_pinangsari`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `desa_pinangsari`;

-- 1. Tabel Pengguna Admin
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL DEFAULT 'Data belum tersedia',
  `role` ENUM('SUPER_ADMIN', 'OPERATOR_DESA', 'KEPALA_DESA') NOT NULL DEFAULT 'OPERATOR_DESA',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Profil Desa
CREATE TABLE IF NOT EXISTS `profil_desa` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama_desa` VARCHAR(100) NOT NULL,
  `dusun_kantor` VARCHAR(100) NOT NULL,
  `rt_kantor` VARCHAR(10) NOT NULL,
  `rw_kantor` VARCHAR(10) NOT NULL,
  `kecamatan` VARCHAR(100) NOT NULL,
  `kabupaten` VARCHAR(100) NOT NULL,
  `provinsi` VARCHAR(100) NOT NULL,
  `kode_pos` VARCHAR(20) NOT NULL DEFAULT 'Data belum tersedia',
  `sejarah` TEXT NOT NULL,
  `visi` TEXT NOT NULL,
  `misi` TEXT NOT NULL,
  `letak_geografis` TEXT NOT NULL,
  `batas_utara` VARCHAR(150) NOT NULL,
  `batas_selatan` VARCHAR(150) NOT NULL,
  `batas_timur` VARCHAR(150) NOT NULL,
  `batas_barat` VARCHAR(150) NOT NULL,
  `kondisi_wilayah` TEXT NOT NULL,
  `luas_wilayah` VARCHAR(80) NOT NULL DEFAULT 'Data belum tersedia',
  `jumlah_dusun` INT UNSIGNED NOT NULL DEFAULT 0,
  `jumlah_rw` INT UNSIGNED NOT NULL DEFAULT 0,
  `jumlah_rt` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Pengaturan Website
CREATE TABLE IF NOT EXISTS `pengaturan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama_website` VARCHAR(150) NOT NULL,
  `tagline` VARCHAR(255) NOT NULL,
  `telepon` VARCHAR(60) NOT NULL DEFAULT 'Data belum tersedia',
  `whatsapp` VARCHAR(60) NOT NULL DEFAULT 'Data belum tersedia',
  `email` VARCHAR(120) NOT NULL DEFAULT 'Data belum tersedia',
  `jam_pelayanan` VARCHAR(150) NOT NULL DEFAULT 'Data belum tersedia',
  `alamat_lengkap` VARCHAR(255) NOT NULL,
  `facebook_url` VARCHAR(255) NOT NULL DEFAULT '',
  `instagram_url` VARCHAR(255) NOT NULL DEFAULT '',
  `youtube_url` VARCHAR(255) NOT NULL DEFAULT '',
  `latitude` VARCHAR(40) NOT NULL DEFAULT '',
  `longitude` VARCHAR(40) NOT NULL DEFAULT '',
  `map_zoom` INT NOT NULL DEFAULT 14,
  `tampilkan_label_contoh` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Perangkat Desa
CREATE TABLE IF NOT EXISTS `perangkat_desa` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(150) NOT NULL,
  `jabatan` VARCHAR(120) NOT NULL,
  `tingkatan` VARCHAR(60) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 1,
  `nip_nrpd` VARCHAR(60) NOT NULL DEFAULT 'Data belum tersedia',
  `pendidikan` VARCHAR(60) NOT NULL DEFAULT 'Data belum tersedia',
  `masa_jabatan` VARCHAR(60) NOT NULL DEFAULT 'Data belum tersedia',
  `foto_url` VARCHAR(255) NOT NULL DEFAULT '',
  `keterangan` TEXT NULL,
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_perangkat_urutan` (`urutan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Data Keluarga (Kartu Keluarga)
CREATE TABLE IF NOT EXISTS `keluarga` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `no_kk` CHAR(16) NOT NULL,
  `kepala_keluarga` VARCHAR(150) NOT NULL,
  `alamat` VARCHAR(255) NOT NULL,
  `rt` VARCHAR(5) NOT NULL,
  `rw` VARCHAR(5) NOT NULL,
  `dusun` VARCHAR(80) NOT NULL,
  `jumlah_anggota` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('Aktif', 'Pindah', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_keluarga_no_kk` (`no_kk`),
  KEY `idx_keluarga_dusun_rw_rt` (`dusun`, `rw`, `rt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Data Penduduk
CREATE TABLE IF NOT EXISTS `penduduk` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nik` CHAR(16) NOT NULL,
  `no_kk` CHAR(16) NOT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `jenis_kelamin` ENUM('Laki-laki', 'Perempuan') NOT NULL,
  `tempat_lahir` VARCHAR(100) NOT NULL,
  `tanggal_lahir` DATE NOT NULL,
  `agama` VARCHAR(40) NOT NULL,
  `status_perkawinan` VARCHAR(40) NOT NULL,
  `pendidikan` VARCHAR(60) NOT NULL,
  `pekerjaan` VARCHAR(80) NOT NULL,
  `alamat` VARCHAR(255) NOT NULL,
  `rt` VARCHAR(5) NOT NULL,
  `rw` VARCHAR(5) NOT NULL,
  `dusun` VARCHAR(80) NOT NULL,
  `no_hp` VARCHAR(30) NOT NULL DEFAULT '',
  `status_penduduk` ENUM('Aktif', 'Pindah', 'Meninggal', 'Sementara') NOT NULL DEFAULT 'Aktif',
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_penduduk_nik` (`nik`),
  KEY `idx_penduduk_kk` (`no_kk`),
  KEY `idx_penduduk_dusun` (`dusun`, `rw`, `rt`),
  KEY `idx_penduduk_status` (`status_penduduk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Kategori Berita
CREATE TABLE IF NOT EXISTS `kategori_berita` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kategori_berita_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Berita Desa
CREATE TABLE IF NOT EXISTS `berita` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(220) NOT NULL,
  `slug` VARCHAR(240) NOT NULL,
  `kategori_id` INT UNSIGNED NOT NULL,
  `ringkasan` TEXT NOT NULL,
  `isi` LONGTEXT NOT NULL,
  `gambar_url` VARCHAR(255) NOT NULL DEFAULT '',
  `penulis` VARCHAR(120) NOT NULL,
  `tanggal_publikasi` DATE NOT NULL,
  `status` ENUM('Dipublikasikan', 'Draft') NOT NULL DEFAULT 'Dipublikasikan',
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_berita_slug` (`slug`),
  KEY `idx_berita_kategori` (`kategori_id`),
  KEY `idx_berita_status_tanggal` (`status`, `tanggal_publikasi`),
  CONSTRAINT `fk_berita_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_berita` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel Pengumuman
CREATE TABLE IF NOT EXISTS `pengumuman` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(220) NOT NULL,
  `kategori` ENUM('Pengumuman', 'Informasi Penting', 'Jadwal Pelayanan', 'Informasi Kegiatan', 'Pemberitahuan Masyarakat') NOT NULL DEFAULT 'Pengumuman',
  `isi` TEXT NOT NULL,
  `tanggal` DATE NOT NULL,
  `status` ENUM('Aktif', 'Arsip') NOT NULL DEFAULT 'Aktif',
  `prioritas` ENUM('Penting', 'Normal') NOT NULL DEFAULT 'Normal',
  `lampiran_url` VARCHAR(255) NOT NULL DEFAULT '',
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pengumuman_status_prioritas` (`status`, `prioritas`, `tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel Jenis Pelayanan
CREATE TABLE IF NOT EXISTS `jenis_pelayanan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(150) NOT NULL,
  `kode` VARCHAR(30) NOT NULL,
  `persyaratan` TEXT NOT NULL,
  `estimasi_waktu` VARCHAR(60) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_jenis_pelayanan_kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel Pengajuan Pelayanan Online
CREATE TABLE IF NOT EXISTS `pelayanan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nomor_pengajuan` VARCHAR(30) NOT NULL,
  `nama_pemohon` VARCHAR(150) NOT NULL,
  `nik` CHAR(16) NOT NULL,
  `no_kk` CHAR(16) NOT NULL,
  `tempat_tanggal_lahir` VARCHAR(120) NOT NULL,
  `alamat` VARCHAR(255) NOT NULL,
  `no_hp` VARCHAR(30) NOT NULL,
  `jenis_layanan_id` INT UNSIGNED NOT NULL,
  `keperluan` TEXT NOT NULL,
  `dokumen_url` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('Diajukan', 'Diverifikasi', 'Diproses', 'Selesai', 'Ditolak') NOT NULL DEFAULT 'Diajukan',
  `catatan_admin` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pelayanan_nomor` (`nomor_pengajuan`),
  KEY `idx_pelayanan_status` (`status`),
  KEY `idx_pelayanan_jenis` (`jenis_layanan_id`),
  CONSTRAINT `fk_pelayanan_jenis` FOREIGN KEY (`jenis_layanan_id`) REFERENCES `jenis_pelayanan` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel Potensi Desa
CREATE TABLE IF NOT EXISTS `potensi_desa` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(160) NOT NULL,
  `kategori` ENUM('Pertanian', 'Peternakan', 'Perikanan', 'UMKM', 'Kerajinan', 'Perdagangan', 'Wisata', 'Produk unggulan') NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `lokasi` VARCHAR(150) NOT NULL,
  `kontak` VARCHAR(80) NOT NULL DEFAULT 'Data belum tersedia',
  `foto_url` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_potensi_kategori` (`kategori`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabel Agenda Desa
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama_kegiatan` VARCHAR(180) NOT NULL,
  `tanggal` DATE NOT NULL,
  `waktu` VARCHAR(40) NOT NULL,
  `lokasi` VARCHAR(150) NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `penanggung_jawab` VARCHAR(120) NOT NULL,
  `status` ENUM('Akan Datang', 'Berlangsung', 'Selesai') NOT NULL DEFAULT 'Akan Datang',
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_agenda_tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Tabel Galeri Foto
CREATE TABLE IF NOT EXISTS `galeri` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(160) NOT NULL,
  `kategori` ENUM('Kegiatan Pemerintah Desa', 'Gotong Royong', 'Posyandu', 'PKK', 'Karang Taruna', 'Keagamaan', 'Pembangunan', 'Kegiatan masyarakat') NOT NULL,
  `gambar_url` VARCHAR(255) NOT NULL,
  `keterangan` TEXT NULL,
  `tanggal` DATE NOT NULL,
  `is_demo_data` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_galeri_kategori` (`kategori`, `tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Tabel Pesan Masyarakat
CREATE TABLE IF NOT EXISTS `pesan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(120) NOT NULL,
  `no_hp` VARCHAR(30) NOT NULL,
  `email` VARCHAR(120) NOT NULL DEFAULT '',
  `subjek` VARCHAR(180) NOT NULL,
  `pesan` TEXT NOT NULL,
  `status` ENUM('Baru', 'Dibaca', 'Ditindaklanjuti', 'Selesai') NOT NULL DEFAULT 'Baru',
  `catatan_tindak_lanjut` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pesan_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Tabel Log Aktivitas Admin
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `username` VARCHAR(64) NOT NULL,
  `role` VARCHAR(40) NOT NULL,
  `aksi` VARCHAR(80) NOT NULL,
  `modul` VARCHAR(60) NOT NULL,
  `detail` TEXT NOT NULL,
  `ip_address` VARCHAR(64) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_user` (`user_id`),
  KEY `idx_logs_created` (`created_at`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Kategori Berita
INSERT IGNORE INTO `kategori_berita` (`id`, `nama`, `slug`) VALUES
  (1, 'Pemerintahan', 'pemerintahan'),
  (2, 'Kegiatan Desa', 'kegiatan-desa'),
  (3, 'Pembangunan', 'pembangunan'),
  (4, 'Pendidikan', 'pendidikan'),
  (5, 'Kesehatan', 'kesehatan'),
  (6, 'Sosial', 'sosial'),
  (7, 'Keagamaan', 'keagamaan'),
  (8, 'Pemuda', 'pemuda'),
  (9, 'UMKM', 'umkm');

-- Seed Jenis Pelayanan
INSERT IGNORE INTO `jenis_pelayanan` (`id`, `nama`, `kode`, `persyaratan`, `estimasi_waktu`) VALUES
  (1, 'Surat Keterangan Domisili', 'SKD', 'KTP Asli, Kartu Keluarga, Surat Pengantar RT/RW', '1 Hari Kerja'),
  (2, 'Surat Keterangan Usaha', 'SKU', 'KTP Asli, Kartu Keluarga, Foto Tempat Usaha', '1 Hari Kerja'),
  (3, 'Surat Keterangan Tidak Mampu', 'SKTM', 'KTP Asli, Kartu Keluarga, Surat Pengantar RT/RW', '1 Hari Kerja'),
  (4, 'Surat Pengantar', 'SPG', 'KTP Asli, Kartu Keluarga', '1 Hari Kerja'),
  (5, 'Surat Keterangan Kelahiran', 'SKL', 'Surat Keterangan Lahir Bidan/RS, KTP Orang Tua, KK', '1-2 Hari Kerja'),
  (6, 'Surat Keterangan Kematian', 'SKK', 'Surat Keterangan Medis/RS, KTP Almarhum, KK, KTP Pelapor', '1 Hari Kerja'),
  (7, 'Surat Pengantar SKCK', 'SKCK', 'KTP Asli, Kartu Keluarga, Pas Foto', '1 Hari Kerja'),
  (8, 'Surat Keterangan lainnya', 'SKLAIN', 'KTP Asli, Kartu Keluarga, Dokumen Pendukung Terkait', '1-2 Hari Kerja');
