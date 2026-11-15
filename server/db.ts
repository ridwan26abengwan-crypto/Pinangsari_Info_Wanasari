import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.resolve(process.cwd(), 'desa_pinangsari.db');

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function toPlain<T = Record<string, unknown>>(row: Record<string, unknown> | undefined): T | null {
  if (!row) return null;
  return { ...row } as T;
}

export function queryAll<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  const rows = db.prepare(sql).all(...params);
  return rows.map((r) => ({ ...r }) as T);
}

export function queryOne<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | null {
  const row = db.prepare(sql).get(...params);
  return toPlain<T>(row);
}

export function runSql(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number } {
  const res = db.prepare(sql).run(...params);
  return {
    changes: Number(res.changes),
    lastInsertRowid: Number(res.lastInsertRowid),
  };
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nama_lengkap TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT 'Data belum tersedia',
      role TEXT NOT NULL DEFAULT 'OPERATOR_DESA' CHECK (role IN ('SUPER_ADMIN', 'OPERATOR_DESA', 'KEPALA_DESA')),
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profil_desa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_desa TEXT NOT NULL,
      dusun_kantor TEXT NOT NULL,
      rt_kantor TEXT NOT NULL,
      rw_kantor TEXT NOT NULL,
      kecamatan TEXT NOT NULL,
      kabupaten TEXT NOT NULL,
      provinsi TEXT NOT NULL,
      kode_pos TEXT NOT NULL DEFAULT 'Data belum tersedia',
      sejarah TEXT NOT NULL,
      visi TEXT NOT NULL,
      misi TEXT NOT NULL,
      letak_geografis TEXT NOT NULL,
      batas_utara TEXT NOT NULL,
      batas_selatan TEXT NOT NULL,
      batas_timur TEXT NOT NULL,
      batas_barat TEXT NOT NULL,
      kondisi_wilayah TEXT NOT NULL,
      luas_wilayah TEXT NOT NULL DEFAULT 'Data belum tersedia',
      jumlah_dusun INTEGER NOT NULL DEFAULT 0,
      jumlah_rw INTEGER NOT NULL DEFAULT 0,
      jumlah_rt INTEGER NOT NULL DEFAULT 0,
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pengaturan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_website TEXT NOT NULL,
      tagline TEXT NOT NULL,
      telepon TEXT NOT NULL DEFAULT 'Data belum tersedia',
      whatsapp TEXT NOT NULL DEFAULT 'Data belum tersedia',
      email TEXT NOT NULL DEFAULT 'Data belum tersedia',
      jam_pelayanan TEXT NOT NULL DEFAULT 'Data belum tersedia',
      alamat_lengkap TEXT NOT NULL,
      facebook_url TEXT NOT NULL DEFAULT '',
      instagram_url TEXT NOT NULL DEFAULT '',
      youtube_url TEXT NOT NULL DEFAULT '',
      latitude TEXT NOT NULL DEFAULT '',
      longitude TEXT NOT NULL DEFAULT '',
      map_zoom INTEGER NOT NULL DEFAULT 14,
      tampilkan_label_contoh INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS perangkat_desa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      jabatan TEXT NOT NULL,
      tingkatan TEXT NOT NULL,
      urutan INTEGER NOT NULL DEFAULT 1,
      nip_nrpd TEXT NOT NULL DEFAULT 'Data belum tersedia',
      pendidikan TEXT NOT NULL DEFAULT 'Data belum tersedia',
      masa_jabatan TEXT NOT NULL DEFAULT 'Data belum tersedia',
      foto_url TEXT NOT NULL DEFAULT '',
      keterangan TEXT NOT NULL DEFAULT '',
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS keluarga (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_kk TEXT NOT NULL UNIQUE,
      kepala_keluarga TEXT NOT NULL,
      alamat TEXT NOT NULL,
      rt TEXT NOT NULL,
      rw TEXT NOT NULL,
      dusun TEXT NOT NULL,
      jumlah_anggota INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pindah', 'Nonaktif')),
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS penduduk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nik TEXT NOT NULL UNIQUE,
      no_kk TEXT NOT NULL,
      nama_lengkap TEXT NOT NULL,
      jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
      tempat_lahir TEXT NOT NULL,
      tanggal_lahir TEXT NOT NULL,
      agama TEXT NOT NULL,
      status_perkawinan TEXT NOT NULL,
      pendidikan TEXT NOT NULL,
      pekerjaan TEXT NOT NULL,
      alamat TEXT NOT NULL,
      rt TEXT NOT NULL,
      rw TEXT NOT NULL,
      dusun TEXT NOT NULL,
      no_hp TEXT NOT NULL DEFAULT '',
      status_penduduk TEXT NOT NULL DEFAULT 'Aktif' CHECK (status_penduduk IN ('Aktif', 'Pindah', 'Meninggal', 'Sementara')),
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kategori_berita (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS berita (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      kategori_id INTEGER NOT NULL,
      ringkasan TEXT NOT NULL,
      isi TEXT NOT NULL,
      gambar_url TEXT NOT NULL DEFAULT '',
      penulis TEXT NOT NULL,
      tanggal_publikasi TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Dipublikasikan' CHECK (status IN ('Dipublikasikan', 'Draft')),
      views INTEGER NOT NULL DEFAULT 0,
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (kategori_id) REFERENCES kategori_berita (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pengumuman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      kategori TEXT NOT NULL DEFAULT 'Pengumuman',
      isi TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Arsip')),
      prioritas TEXT NOT NULL DEFAULT 'Normal' CHECK (prioritas IN ('Penting', 'Normal')),
      lampiran_url TEXT NOT NULL DEFAULT '',
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jenis_pelayanan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      kode TEXT NOT NULL UNIQUE,
      persyaratan TEXT NOT NULL,
      estimasi_waktu TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pelayanan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_pengajuan TEXT NOT NULL UNIQUE,
      nama_pemohon TEXT NOT NULL,
      nik TEXT NOT NULL,
      no_kk TEXT NOT NULL,
      tempat_tanggal_lahir TEXT NOT NULL,
      alamat TEXT NOT NULL,
      no_hp TEXT NOT NULL,
      jenis_layanan_id INTEGER NOT NULL,
      keperluan TEXT NOT NULL,
      dokumen_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Diajukan' CHECK (status IN ('Diajukan', 'Diverifikasi', 'Diproses', 'Selesai', 'Ditolak')),
      catatan_admin TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (jenis_layanan_id) REFERENCES jenis_pelayanan (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS potensi_desa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      kategori TEXT NOT NULL,
      deskripsi TEXT NOT NULL,
      lokasi TEXT NOT NULL,
      kontak TEXT NOT NULL DEFAULT 'Data belum tersedia',
      foto_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_kegiatan TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      waktu TEXT NOT NULL,
      lokasi TEXT NOT NULL,
      deskripsi TEXT NOT NULL,
      penanggung_jawab TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Akan Datang' CHECK (status IN ('Akan Datang', 'Berlangsung', 'Selesai')),
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS galeri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      kategori TEXT NOT NULL,
      gambar_url TEXT NOT NULL,
      keterangan TEXT NOT NULL DEFAULT '',
      tanggal TEXT NOT NULL,
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pesan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      no_hp TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      subjek TEXT NOT NULL,
      pesan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Baru' CHECK (status IN ('Baru', 'Dibaca', 'Ditindaklanjuti', 'Selesai')),
      catatan_tindak_lanjut TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      aksi TEXT NOT NULL,
      modul TEXT NOT NULL,
      detail TEXT NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_penduduk_kk ON penduduk(no_kk);
    CREATE INDEX IF NOT EXISTS idx_penduduk_dusun ON penduduk(dusun, rw, rt);
    CREATE INDEX IF NOT EXISTS idx_berita_slug ON berita(slug);
    CREATE INDEX IF NOT EXISTS idx_pelayanan_nomor ON pelayanan(nomor_pengajuan);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
  `);

  seedInitialData();
  cleanupLegacyDemoLabels();
}

function seedInitialData() {
  const userCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM users');
  if (!userCount || userCount.total === 0) {
    const hashSuper = bcrypt.hashSync('Pinangsari@2026!', 10);
    const hashOp = bcrypt.hashSync('Operator@2026!', 10);
    const hashKades = bcrypt.hashSync('Kades@2026!', 10);

    runSql(
      `INSERT INTO users (username, password_hash, nama_lengkap, email, role) VALUES (?, ?, ?, ?, ?)`,
      'superadmin',
      hashSuper,
      'Administrator Utama',
      'Data belum tersedia',
      'SUPER_ADMIN'
    );
    runSql(
      `INSERT INTO users (username, password_hash, nama_lengkap, email, role) VALUES (?, ?, ?, ?, ?)`,
      'operator',
      hashOp,
      'Operator Layanan Desa',
      'Data belum tersedia',
      'OPERATOR_DESA'
    );
    runSql(
      `INSERT INTO users (username, password_hash, nama_lengkap, email, role) VALUES (?, ?, ?, ?, ?)`,
      'kades',
      hashKades,
      'Kepala Desa Pinangsari',
      'Data belum tersedia',
      'KEPALA_DESA'
    );
  }

  const profilCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM profil_desa');
  if (!profilCount || profilCount.total === 0) {
    runSql(
      `INSERT INTO profil_desa (
        nama_desa, dusun_kantor, rt_kantor, rw_kantor, kecamatan, kabupaten, provinsi, kode_pos,
        sejarah, visi, misi, letak_geografis, batas_utara, batas_selatan, batas_timur, batas_barat,
        kondisi_wilayah, luas_wilayah, jumlah_dusun, jumlah_rw, jumlah_rt, is_demo_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'Desa Pinangsari',
      'Wanasari',
      '003',
      '003',
      'Ciasem',
      'Subang',
      'Jawa Barat',
      'Data belum tersedia',
      'Desa Pinangsari merupakan salah satu desa di Kecamatan Ciasem, Kabupaten Subang, Provinsi Jawa Barat. Narasi sejarah resmi desa dapat diperbarui oleh administrator desa melalui Dashboard Admin sesuai arsip resmi pemerintahan desa.',
      'Mewujudkan Desa Pinangsari yang Maju, Mandiri, Transparan, dan Sejahtera Berbasis Pelayanan Digital serta Potensi Lokal.',
      '1. Meningkatkan kualitas pelayanan administrasi kependudukan yang cepat, tertib, dan transparan.\n2. Mengembangkan potensi pertanian, perdagangan, dan UMKM masyarakat desa.\n3. Memperkuat tata kelola pemerintahan desa yang akuntabel dan partisipatif.\n4. Meningkatkan pembangunan infrastruktur lingkungan dusun, RT, dan RW secara merata.',
      'Desa Pinangsari terletak di wilayah Kecamatan Ciasem, Kabupaten Subang, Provinsi Jawa Barat, dengan pusat pemerintahan berlokasi di Dusun Wanasari RT.003/RW.003.',
      'Data belum tersedia',
      'Data belum tersedia',
      'Data belum tersedia',
      'Data belum tersedia',
      'Wilayah pedesaan dataran rendah dengan aktivitas dominan pertanian dan usaha masyarakat lokal. Data luasan dan detail batas resmi dapat dilengkapi admin melalui menu Profil Desa.',
      'Data belum tersedia',
      3,
      4,
      12,
      0
    );
  }

  const settingCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM pengaturan');
  if (!settingCount || settingCount.total === 0) {
    runSql(
      `INSERT INTO pengaturan (
        nama_website, tagline, telepon, whatsapp, email, jam_pelayanan, alamat_lengkap,
        facebook_url, instagram_url, youtube_url, latitude, longitude, map_zoom, tampilkan_label_contoh
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'Desa Pinangsari',
      'Pusat Informasi dan Pelayanan Digital Masyarakat Desa Pinangsari',
      'Data belum tersedia',
      'Data belum tersedia',
      'Data belum tersedia',
      'Senin – Jumat, 08.00 – 15.00 WIB',
      'Dusun Wanasari RT.003/RW.003, Desa Pinangsari, Kecamatan Ciasem, Kabupaten Subang, Jawa Barat, Indonesia.',
      '',
      '',
      '',
      '',
      '',
      14,
      0
    );
  }

  const katCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM kategori_berita');
  if (!katCount || katCount.total === 0) {
    const categories = [
      ['Pemerintahan', 'pemerintahan'],
      ['Kegiatan Desa', 'kegiatan-desa'],
      ['Pembangunan', 'pembangunan'],
      ['Pendidikan', 'pendidikan'],
      ['Kesehatan', 'kesehatan'],
      ['Sosial', 'sosial'],
      ['Keagamaan', 'keagamaan'],
      ['Pemuda', 'pemuda'],
      ['UMKM', 'umkm'],
    ];
    for (const [nama, slug] of categories) {
      runSql('INSERT INTO kategori_berita (nama, slug) VALUES (?, ?)', nama, slug);
    }
  }

  const jenisCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM jenis_pelayanan');
  if (!jenisCount || jenisCount.total === 0) {
    const services = [
      ['Surat Keterangan Domisili', 'SKD', 'KTP Asli, Kartu Keluarga, Surat Pengantar RT/RW', '1 Hari Kerja'],
      ['Surat Keterangan Usaha', 'SKU', 'KTP Asli, Kartu Keluarga, Foto Tempat Usaha', '1 Hari Kerja'],
      ['Surat Keterangan Tidak Mampu', 'SKTM', 'KTP Asli, Kartu Keluarga, Surat Pengantar RT/RW', '1 Hari Kerja'],
      ['Surat Pengantar', 'SPG', 'KTP Asli, Kartu Keluarga', '1 Hari Kerja'],
      ['Surat Keterangan Kelahiran', 'SKL', 'Surat Keterangan Lahir Bidan/RS, KTP Orang Tua, KK', '1-2 Hari Kerja'],
      ['Surat Keterangan Kematian', 'SKK', 'Surat Keterangan Medis/RS, KTP Almarhum, KK, KTP Pelapor', '1 Hari Kerja'],
      ['Surat Pengantar SKCK', 'SKCK', 'KTP Asli, Kartu Keluarga, Pas Foto', '1 Hari Kerja'],
      ['Surat Keterangan lainnya', 'SKLAIN', 'KTP Asli, Kartu Keluarga, Dokumen Pendukung Terkait', '1-2 Hari Kerja'],
    ];
    for (const [nama, kode, persyaratan, estimasi] of services) {
      runSql(
        'INSERT INTO jenis_pelayanan (nama, kode, persyaratan, estimasi_waktu) VALUES (?, ?, ?, ?)',
        nama,
        kode,
        persyaratan,
        estimasi
      );
    }
  }

  const perangkatCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM perangkat_desa');
  if (!perangkatCount || perangkatCount.total === 0) {
    const officials = [
      ['Pejabat Kepala Desa', 'Kepala Desa', 'Kepala Desa', 1, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '/src/assets/images/balai_desa_pinangsari_1794758502248.jpg', 'Pimpinan Pemerintah Desa Pinangsari.'],
      ['Pejabat Sekretaris Desa', 'Sekretaris Desa', 'Sekretaris Desa', 2, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Koordinator administrasi dan kesekretariatan desa.'],
      ['Pejabat Kasi Pemerintahan', 'Kasi Pemerintahan', 'Kasi', 3, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Urusan tata pemerintahan, kependudukan, dan pertanahan.'],
      ['Pejabat Kasi Kesejahteraan', 'Kasi Kesejahteraan', 'Kasi', 4, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Urusan pembangunan desa, sosial, dan pemberdayaan masyarakat.'],
      ['Pejabat Kasi Pelayanan', 'Kasi Pelayanan', 'Kasi', 5, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Urusan pelayanan administrasi surat menyurat masyarakat.'],
      ['Pejabat Kaur Keuangan', 'Kaur Keuangan', 'Kaur', 6, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Pengelolaan anggaran pendapatan dan belanja desa.'],
      ['Pejabat Kaur Umum', 'Kaur Umum', 'Kaur', 7, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Tata usaha, arsip, dan perlengkapan kantor desa.'],
      ['Pejabat Kaur Perencanaan', 'Kaur Perencanaan', 'Kaur', 8, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Penyusunan rencana kerja pemerintah desa (RKPDes).'],
      ['Kepala Dusun Wanasari', 'Kepala Dusun Wanasari', 'Kepala Dusun', 9, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Koordinator wilayah Dusun Wanasari.'],
      ['Ketua RW 003 Wanasari', 'Ketua RW 003', 'RW', 10, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Koordinator Rukun Warga 003 Dusun Wanasari.'],
      ['Ketua RT 003 Wanasari', 'Ketua RT 003', 'RT', 11, 'Data belum tersedia', 'Data belum tersedia', 'Data belum tersedia', '', 'Pelayanan kewilayahan tingkat RT 003 / RW 003.'],
    ];
    for (const o of officials) {
      runSql(
        `INSERT INTO perangkat_desa (nama, jabatan, tingkatan, urutan, nip_nrpd, pendidikan, masa_jabatan, foto_url, keterangan, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        ...o
      );
    }
  }

  const kkCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM keluarga');
  if (!kkCount || kkCount.total === 0) {
    const initialFamilies = [
      ['3213000000000001', 'Kepala Keluarga 1', 'Dusun Wanasari RT.003/RW.003', '003', '003', 'Wanasari', 4, 'Aktif'],
      ['3213000000000002', 'Kepala Keluarga 2', 'Dusun Wanasari RT.001/RW.001', '001', '001', 'Wanasari', 3, 'Aktif'],
      ['3213000000000003', 'Kepala Keluarga 3', 'Dusun Mekarsari RT.002/RW.002', '002', '002', 'Mekarsari', 4, 'Aktif'],
      ['3213000000000004', 'Kepala Keluarga 4', 'Dusun Sukamaju RT.001/RW.004', '001', '004', 'Sukamaju', 3, 'Aktif'],
    ];
    for (const f of initialFamilies) {
      runSql(
        `INSERT INTO keluarga (no_kk, kepala_keluarga, alamat, rt, rw, dusun, jumlah_anggota, status, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        ...f
      );
    }
  }

  const pendudukCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM penduduk');
  if (!pendudukCount || pendudukCount.total === 0) {
    const initialResidents = [
      ['3213000000001001', '3213000000000001', 'Warga 01', 'Laki-laki', 'Subang', '1982-04-12', 'Islam', 'Kawin', 'SMA', 'Petani', 'Dusun Wanasari RT.003/RW.003', '003', '003', 'Wanasari', '080000000001', 'Aktif'],
      ['3213000000001002', '3213000000000001', 'Warga 02', 'Perempuan', 'Subang', '1985-08-20', 'Islam', 'Kawin', 'SMA', 'Pedagang', 'Dusun Wanasari RT.003/RW.003', '003', '003', 'Wanasari', '080000000002', 'Aktif'],
      ['3213000000001003', '3213000000000001', 'Warga 03', 'Laki-laki', 'Subang', '2006-03-11', 'Islam', 'Belum Kawin', 'SMA', 'Pekerjaan lainnya', 'Dusun Wanasari RT.003/RW.003', '003', '003', 'Wanasari', '', 'Aktif'],
      ['3213000000001004', '3213000000000001', 'Warga 04', 'Perempuan', 'Subang', '2012-11-02', 'Islam', 'Belum Kawin', 'SD', 'Pekerjaan lainnya', 'Dusun Wanasari RT.003/RW.003', '003', '003', 'Wanasari', '', 'Aktif'],
      ['3213000000002001', '3213000000000002', 'Warga 05', 'Laki-laki', 'Subang', '1979-02-14', 'Islam', 'Kawin', 'Sarjana', 'Guru', 'Dusun Wanasari RT.001/RW.001', '001', '001', 'Wanasari', '080000000005', 'Aktif'],
      ['3213000000002002', '3213000000000002', 'Warga 06', 'Perempuan', 'Subang', '1983-06-18', 'Islam', 'Kawin', 'Diploma', 'Karyawan', 'Dusun Wanasari RT.001/RW.001', '001', '001', 'Wanasari', '080000000006', 'Aktif'],
      ['3213000000002003', '3213000000000002', 'Warga 07', 'Perempuan', 'Subang', '2021-01-25', 'Islam', 'Belum Kawin', 'Tidak/Belum Sekolah', 'Pekerjaan lainnya', 'Dusun Wanasari RT.001/RW.001', '001', '001', 'Wanasari', '', 'Aktif'],
      ['3213000000003001', '3213000000000003', 'Warga 08', 'Laki-laki', 'Subang', '1990-09-09', 'Islam', 'Kawin', 'SMP', 'Wiraswasta', 'Dusun Mekarsari RT.002/RW.002', '002', '002', 'Mekarsari', '080000000008', 'Aktif'],
      ['3213000000003002', '3213000000000003', 'Warga 09', 'Perempuan', 'Subang', '1992-12-15', 'Islam', 'Kawin', 'SMA', 'Wiraswasta', 'Dusun Mekarsari RT.002/RW.002', '002', '002', 'Mekarsari', '', 'Aktif'],
      ['3213000000003003', '3213000000000003', 'Warga 10', 'Laki-laki', 'Subang', '1975-05-03', 'Islam', 'Kawin', 'SD', 'Buruh', 'Dusun Mekarsari RT.002/RW.002', '002', '002', 'Mekarsari', '', 'Aktif'],
      ['3213000000004001', '3213000000000004', 'Warga 11', 'Laki-laki', 'Subang', '1988-07-17', 'Islam', 'Kawin', 'SMP', 'Petani', 'Dusun Sukamaju RT.001/RW.004', '001', '004', 'Sukamaju', '', 'Aktif'],
      ['3213000000004002', '3213000000000004', 'Warga 12', 'Perempuan', 'Subang', '1991-10-28', 'Islam', 'Kawin', 'Sarjana', 'Guru', 'Dusun Sukamaju RT.001/RW.004', '001', '004', 'Sukamaju', '', 'Aktif'],
    ];
    for (const p of initialResidents) {
      runSql(
        `INSERT INTO penduduk (
          nik, no_kk, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
          agama, status_perkawinan, pendidikan, pekerjaan, alamat, rt, rw, dusun, no_hp, status_penduduk, is_demo_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        ...p
      );
    }
  }

  const beritaCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM berita');
  if (!beritaCount || beritaCount.total === 0) {
    const initialNews = [
      [
        'Peningkatan Pelayanan Administrasi Desa Pinangsari Berbasis Digital',
        'peningkatan-pelayanan-administrasi-desa-pinangsari',
        1,
        'Pemerintah Desa Pinangsari menghadirkan portal pelayanan surat keterangan online untuk mempermudah warga Dusun Wanasari dan sekitarnya.',
        'Dalam rangka meningkatkan efisiensi pelayanan masyarakat di Kecamatan Ciasem, Kabupaten Subang, Pemerintah Desa Pinangsari meluncurkan sistem informasi dan pelayanan administrasi berbasis web. Melalui portal ini, warga dapat mengajukan permohonan surat keterangan domisili, surat keterangan usaha, hingga surat pengantar secara daring serta memantau progres pengajuannya secara real-time menggunakan nomor registrasi.',
        '/src/assets/images/balai_desa_pinangsari_1794758502248.jpg',
        'Tim Redaksi Desa',
        '2026-11-10',
        'Dipublikasikan',
        42,
      ],
      [
        'Kegiatan Gotong Royong Pembersihan Saluran Irigasi Dusun Wanasari',
        'gotong-royong-pembersihan-saluran-irigasi-wanasari',
        2,
        'Warga RT 003/RW 003 Dusun Wanasari melaksanakan kerja bakti rutin menjaga kebersihan jalan desa dan saluran pengairan lahan pertanian.',
        'Semangat kebersamaan masyarakat Desa Pinangsari kembali terlihat dalam agenda kerja bakti di lingkungan Dusun Wanasari. Pembersihan saluran irigasi dilakukan untuk memastikan aliran air menuju area persawahan tetap lancar serta mencegah genangan di sepanjang jalan lingkungan desa.',
        '/src/assets/images/kegiatan_warga_desa_1794758502772.jpg',
        'Operator Desa',
        '2026-11-06',
        'Dipublikasikan',
        29,
      ],
      [
        'Penguatan Kelompok Tani dan Hasil Panen Padi Desa Pinangsari',
        'penguatan-kelompok-tani-panen-padi-pinangsari',
        3,
        'Sektor pertanian menjadi penopang utama ekonomi warga Desa Pinangsari dengan dukungan pengairan dan pendampingan kelompok tani.',
        'Lahan pertanian di wilayah Desa Pinangsari terus menunjukkan potensi produksi yang baik. Melalui koordinasi antara pemerintah desa dan gabungan kelompok tani setempat, distribusi sarana produksi serta pemeliharaan jalan usaha tani terus ditingkatkan agar kesejahteraan petani semakin bertumbuh.',
        '/src/assets/images/potensi_pertanian_desa_1794758502697.jpg',
        'Tim Redaksi Desa',
        '2026-10-28',
        'Dipublikasikan',
        35,
      ],
      [
        'Pemberdayaan Produk Olahan dan Kerajinan UMKM Masyarakat Desa',
        'pemberdayaan-produk-umkm-desa-pinangsari',
        9,
        'Pelaku usaha mikro di Desa Pinangsari didorong meningkatkan kualitas kemasan dan pemasaran produk lokal.',
        'Pelaku UMKM Desa Pinangsari menampilkan ragam produk olahan pangan tradisional serta kerajinan anyaman bambu. Pemerintah desa memfasilitasi pendataan usaha dan pengurusan Surat Keterangan Usaha (SKU) secara cepat melalui portal pelayanan desa online.',
        '/src/assets/images/potensi_umkm_desa_1794758502908.jpg',
        'Operator Desa',
        '2026-10-19',
        'Dipublikasikan',
        18,
      ],
    ];
    for (const b of initialNews) {
      runSql(
        `INSERT INTO berita (judul, slug, kategori_id, ringkasan, isi, gambar_url, penulis, tanggal_publikasi, status, views, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        ...b
      );
    }
  }

  const pengumumanCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM pengumuman');
  if (!pengumumanCount || pengumumanCount.total === 0) {
    runSql(
      `INSERT INTO pengumuman (judul, kategori, isi, tanggal, status, prioritas, lampiran_url, is_demo_data) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      'Jadwal Pelayanan Administrasi Kantor Desa Pinangsari',
      'Jadwal Pelayanan',
      'Pelayanan tatap muka di Kantor Desa Pinangsari (Dusun Wanasari RT.003/RW.003) dibuka setiap hari kerja Senin–Jumat pukul 08.00–15.00 WIB. Pengajuan surat juga dapat dilakukan secara daring melalui menu Pelayanan Desa.',
      '2026-11-12',
      'Aktif',
      'Penting',
      ''
    );
    runSql(
      `INSERT INTO pengumuman (judul, kategori, isi, tanggal, status, prioritas, lampiran_url, is_demo_data) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      'Pemberitahuan Pemutakhiran Data Kependudukan Tingkat RT/RW',
      'Pemberitahuan Masyarakat',
      'Warga Desa Pinangsari dimohon melapor kepada Ketua RT/RW setempat apabila terdapat perubahan data Kartu Keluarga, kelahiran, atau pindah domisili agar data desa tetap akurat.',
      '2026-11-08',
      'Aktif',
      'Normal',
      ''
    );
  }

  const pelayananCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM pelayanan');
  if (!pelayananCount || pelayananCount.total === 0) {
    runSql(
      `INSERT INTO pelayanan (nomor_pengajuan, nama_pemohon, nik, no_kk, tempat_tanggal_lahir, alamat, no_hp, jenis_layanan_id, keperluan, dokumen_url, status, catatan_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'PSG-2026-00001',
      'Pemohon 1',
      '3213000000001001',
      '3213000000000001',
      'Subang, 12-04-1982',
      'Dusun Wanasari RT.003/RW.003',
      '080000000001',
      1,
      'Pengajuan Surat Keterangan Domisili.',
      '',
      'Diverifikasi',
      'Berkas telah diverifikasi oleh operator desa.'
    );
  }

  const potensiCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM potensi_desa');
  if (!potensiCount || potensiCount.total === 0) {
    const initialPotensi = [
      ['Hamparan Pertanian Padi Sawah', 'Pertanian', 'Kawasan lahan pertanian produktif warga Desa Pinangsari yang menghasilkan komoditas padi unggulan di Kecamatan Ciasem.', 'Dusun Wanasari & Sekitarnya', 'Data belum tersedia', '/src/assets/images/potensi_pertanian_desa_1794758502697.jpg', 'Aktif'],
      ['Sentra Olahan Pangan & Kerajinan Bambu', 'UMKM', 'Usaha mikro warga memproduksi makanan ringan tradisional kemasan serta kerajinan anyaman bambu ramah lingkungan.', 'Dusun Wanasari RT.003/RW.003', 'Data belum tersedia', '/src/assets/images/potensi_umkm_desa_1794758502908.jpg', 'Aktif'],
      ['Produk Pangan Kemasan Lokal Pinangsari', 'Produk unggulan', 'Olahan hasil bumi lokal yang dikemas higienis oleh kelompok usaha bersama ibu-ibu desa.', 'Dusun Mekarsari', 'Data belum tersedia', '/src/assets/images/potensi_umkm_desa_1794758502908.jpg', 'Aktif'],
    ];
    for (const pt of initialPotensi) {
      runSql(
        `INSERT INTO potensi_desa (nama, kategori, deskripsi, lokasi, kontak, foto_url, status, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        ...pt
      );
    }
  }

  const agendaCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM agenda');
  if (!agendaCount || agendaCount.total === 0) {
    const initialAgenda = [
      ['Musyawarah Perencanaan Pembangunan Desa', '2026-11-20', '09:00 - 12:00 WIB', 'Balai Desa Pinangsari, Dusun Wanasari', 'Pembahasan usulan prioritas pembangunan infrastruktur dan pemberdayaan masyarakat tahun anggaran berikutnya.', 'Sekretariat Desa', 'Akan Datang'],
      ['Posyandu Balita dan Lansia Terpadu', '2026-11-24', '08:00 - 11:30 WIB', 'Poskesdes Dusun Wanasari RT.003/RW.003', 'Pemeriksaan kesehatan rutin balita, ibu hamil, serta pemeriksaan tekanan darah bagi lansia.', 'Kader Posyandu & Bidan Desa', 'Akan Datang'],
      ['Kerja Bakti Kebersihan Lingkungan RT/RW', '2026-11-28', '07:00 - 10:00 WIB', 'Dusun Wanasari RT.003/RW.003', 'Gotong royong pembersihan saluran drainase dan penataan bahu jalan desa.', 'Kepala Dusun & Ketua RT/RW', 'Akan Datang'],
    ];
    for (const a of initialAgenda) {
      runSql(
        `INSERT INTO agenda (nama_kegiatan, tanggal, waktu, lokasi, deskripsi, penanggung_jawab, status, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        ...a
      );
    }
  }

  const galeriCount = queryOne<{ total: number }>('SELECT COUNT(*) as total FROM galeri');
  if (!galeriCount || galeriCount.total === 0) {
    const initialGaleri = [
      ['Balai Desa Pinangsari Dusun Wanasari', 'Kegiatan Pemerintah Desa', '/src/assets/images/balai_desa_pinangsari_1794758502248.jpg', 'Pusat pelayanan administrasi masyarakat Desa Pinangsari di Dusun Wanasari RT.003/RW.003.', '2026-11-01'],
      ['Gotong Royong Jalan Lingkungan', 'Gotong Royong', '/src/assets/images/kegiatan_warga_desa_1794758502772.jpg', 'Kebersamaan warga membersihkan lingkungan desa dan saluran air.', '2026-11-05'],
      ['Panen Raya Pertanian Desa', 'Kegiatan masyarakat', '/src/assets/images/potensi_pertanian_desa_1794758502697.jpg', 'Aktivitas panen padi masyarakat petani Desa Pinangsari.', '2026-10-28'],
      ['Pameran Produk UMKM Warga', 'PKK', '/src/assets/images/potensi_umkm_desa_1794758502908.jpg', 'Hasil kerajinan dan produk kuliner kemasan warga desa.', '2026-10-20'],
    ];
    for (const g of initialGaleri) {
      runSql(
        `INSERT INTO galeri (judul, kategori, gambar_url, keterangan, tanggal, is_demo_data)
         VALUES (?, ?, ?, ?, ?, 0)`,
        ...g
      );
    }
  }
}

function cleanupLegacyDemoLabels() {
  runSql(`UPDATE users SET nama_lengkap = TRIM(REPLACE(nama_lengkap, ' (Akun Demo)', '')) WHERE nama_lengkap LIKE '%(Akun Demo)%'`);
  runSql(`UPDATE users SET nama_lengkap = 'Kepala Desa Pinangsari' WHERE username = 'kades' AND nama_lengkap = 'Kepala Desa'`);
  runSql(`UPDATE pengaturan SET tampilkan_label_contoh = 0, jam_pelayanan = TRIM(REPLACE(jam_pelayanan, ' (Data Contoh)', ''))`);
  runSql(`UPDATE profil_desa SET
    sejarah = REPLACE(sejarah, 'Data contoh sejarah Desa Pinangsari: ', ''),
    visi = REPLACE(visi, ' (Data Contoh)', ''),
    is_demo_data = 0`);
  runSql(`UPDATE perangkat_desa SET nama = TRIM(REPLACE(nama, ' (Data Contoh)', '')), is_demo_data = 0`);
  runSql(`UPDATE keluarga SET kepala_keluarga = REPLACE(kepala_keluarga, 'Kepala Keluarga Contoh ', 'Kepala Keluarga '), is_demo_data = 0`);
  runSql(`UPDATE penduduk SET nama_lengkap = REPLACE(nama_lengkap, 'Warga Contoh ', 'Warga '), is_demo_data = 0`);
  runSql(`UPDATE berita SET penulis = TRIM(REPLACE(penulis, ' (Data Contoh)', '')), judul = TRIM(REPLACE(judul, ' (Data Contoh)', '')), is_demo_data = 0`);
  runSql(`UPDATE pengumuman SET judul = TRIM(REPLACE(judul, ' (Data Contoh)', '')), is_demo_data = 0`);
  runSql(`UPDATE pelayanan SET
    nama_pemohon = REPLACE(nama_pemohon, 'Pemohon Contoh ', 'Pemohon '),
    keperluan = REPLACE(keperluan, 'Pengajuan contoh untuk demonstrasi alur verifikasi Surat Keterangan Domisili.', 'Pengajuan Surat Keterangan Domisili.'),
    catatan_admin = REPLACE(catatan_admin, 'Berkas contoh telah diverifikasi oleh operator desa.', 'Berkas telah diverifikasi oleh operator desa.')`);
  runSql(`UPDATE potensi_desa SET nama = TRIM(REPLACE(nama, ' (Data Contoh)', '')), is_demo_data = 0`);
  runSql(`UPDATE agenda SET nama_kegiatan = TRIM(REPLACE(nama_kegiatan, ' (Data Contoh)', '')), is_demo_data = 0`);
  runSql(`UPDATE galeri SET judul = TRIM(REPLACE(judul, ' (Data Contoh)', '')), is_demo_data = 0`);
}
