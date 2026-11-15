import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, runSql } from './db';
import {
  clearSessionCookie,
  createCaptchaChallenge,
  logActivity,
  requireAuth,
  requirePermission,
  setSessionCookie,
  verifyCaptchaChallenge,
  verifySessionToken,
  type AuthenticatedRequest,
} from './auth';
import { uploadMiddleware } from './upload';
import {
  aggregateDemographics,
  extractNextSequence,
  generateTrackingNumber,
  isValidServiceTransition,
  maskSensitiveDigits,
  sanitizeText,
  slugify,
  validateEmail,
  validateNikOrKk,
  validatePhone,
} from '../src/utils/villageLogic';
import type {
  AdminRole,
  AgendaDesa,
  Berita,
  GaleriItem,
  JenisPelayanan,
  KategoriBerita,
  Keluarga,
  Pelayanan,
  PelayananStatus,
  Penduduk,
  PengaturanDesa,
  Pengumuman,
  PerangkatDesa,
  PesanStatus,
  PesanWarga,
  PotensiDesa,
  ProfilDesa,
  UserAccount,
} from '../src/types/village';

export const apiRouter = express.Router();

function computeStats() {
  const penduduk = queryAll<Penduduk>('SELECT jenis_kelamin, pendidikan, pekerjaan, status_penduduk, is_demo_data FROM penduduk');
  const keluarga = queryAll<Keluarga>('SELECT status, is_demo_data FROM keluarga');
  const potensi = queryAll<PotensiDesa>('SELECT kategori, status FROM potensi_desa');
  const profil = queryOne<ProfilDesa>('SELECT jumlah_rt, jumlah_rw, jumlah_dusun FROM profil_desa LIMIT 1') || {
    jumlah_rt: 0,
    jumlah_rw: 0,
    jumlah_dusun: 0,
  };
  return aggregateDemographics(penduduk, keluarga, potensi, profil);
}

// ============================================================================
// PUBLIC ENDPOINTS (NO PRIVATE RESIDENT PII EXPOSED)
// ============================================================================

apiRouter.get('/public/bootstrap', (_req: Request, res: Response) => {
  const profil = queryOne<ProfilDesa>('SELECT * FROM profil_desa LIMIT 1');
  const pengaturan = queryOne<PengaturanDesa>('SELECT * FROM pengaturan LIMIT 1');
  const stats = computeStats();
  const pengumumanPenting = queryAll<Pengumuman>(
    "SELECT * FROM pengumuman WHERE status = 'Aktif' AND prioritas = 'Penting' ORDER BY tanggal DESC, id DESC LIMIT 3"
  );
  const beritaTerbaru = queryAll<Berita>(
    `SELECT b.*, k.nama as kategori_nama
     FROM berita b
     JOIN kategori_berita k ON k.id = b.kategori_id
     WHERE b.status = 'Dipublikasikan'
     ORDER BY b.tanggal_publikasi DESC, b.id DESC LIMIT 4`
  );
  const agendaTerdekat = queryAll<AgendaDesa>(
    "SELECT * FROM agenda WHERE status != 'Selesai' ORDER BY tanggal ASC LIMIT 4"
  );
  const potensiUnggulan = queryAll<PotensiDesa>(
    "SELECT * FROM potensi_desa WHERE status = 'Aktif' ORDER BY id DESC LIMIT 4"
  );

  res.json({
    profil,
    pengaturan,
    stats,
    pengumumanPenting,
    beritaTerbaru,
    agendaTerdekat,
    potensiUnggulan,
    mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  });
});

apiRouter.get('/public/profil', (_req: Request, res: Response) => {
  const profil = queryOne<ProfilDesa>('SELECT * FROM profil_desa LIMIT 1');
  const perangkat = queryAll<PerangkatDesa>('SELECT * FROM perangkat_desa ORDER BY urutan ASC, id ASC');
  res.json({ profil, perangkat });
});

apiRouter.get('/public/perangkat', (_req: Request, res: Response) => {
  const items = queryAll<PerangkatDesa>('SELECT * FROM perangkat_desa ORDER BY urutan ASC, id ASC');
  res.json({ items });
});

apiRouter.get('/public/statistik', (_req: Request, res: Response) => {
  const stats = computeStats();
  const byDusun = queryAll<{ dusun: string; total: number }>(
    "SELECT dusun, COUNT(*) as total FROM penduduk WHERE status_penduduk = 'Aktif' GROUP BY dusun ORDER BY total DESC"
  );
  const pelayananBulanan = queryAll<{ bulan: string; total: number }>(
    "SELECT strftime('%Y-%m', created_at) as bulan, COUNT(*) as total FROM pelayanan GROUP BY bulan ORDER BY bulan ASC LIMIT 12"
  );
  res.json({ stats, byDusun, pelayananBulanan });
});

apiRouter.get('/public/berita', (req: Request, res: Response) => {
  const kategori = typeof req.query.kategori === 'string' ? req.query.kategori.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const categories = queryAll<KategoriBerita>('SELECT * FROM kategori_berita ORDER BY id ASC');

  let sql = `SELECT b.*, k.nama as kategori_nama
             FROM berita b
             JOIN kategori_berita k ON k.id = b.kategori_id
             WHERE b.status = 'Dipublikasikan'`;
  const params: unknown[] = [];
  if (kategori && kategori !== 'Semua') {
    sql += ' AND (k.slug = ? OR k.nama = ?)';
    params.push(kategori, kategori);
  }
  if (search) {
    sql += ' AND (b.judul LIKE ? OR b.ringkasan LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY b.tanggal_publikasi DESC, b.id DESC';

  const items = queryAll<Berita>(sql, ...params);
  res.json({ items, categories });
});

apiRouter.get('/public/berita/:slug', (req: Request, res: Response) => {
  const slug = sanitizeText(req.params.slug, 200);
  const item = queryOne<Berita>(
    `SELECT b.*, k.nama as kategori_nama
     FROM berita b
     JOIN kategori_berita k ON k.id = b.kategori_id
     WHERE b.slug = ? AND b.status = 'Dipublikasikan'`,
    slug
  );
  if (!item) {
    res.status(404).json({ error: 'Berita tidak ditemukan.' });
    return;
  }
  runSql('UPDATE berita SET views = views + 1 WHERE id = ?', item.id);
  item.views += 1;
  const related = queryAll<Berita>(
    `SELECT b.*, k.nama as kategori_nama
     FROM berita b
     JOIN kategori_berita k ON k.id = b.kategori_id
     WHERE b.status = 'Dipublikasikan' AND b.id != ?
     ORDER BY b.tanggal_publikasi DESC LIMIT 3`,
    item.id
  );
  res.json({ item, related });
});

apiRouter.get('/public/pengumuman', (_req: Request, res: Response) => {
  const items = queryAll<Pengumuman>(
    "SELECT * FROM pengumuman WHERE status = 'Aktif' ORDER BY CASE prioritas WHEN 'Penting' THEN 0 ELSE 1 END, tanggal DESC, id DESC"
  );
  res.json({ items });
});

apiRouter.get('/public/potensi', (req: Request, res: Response) => {
  const kategori = typeof req.query.kategori === 'string' ? req.query.kategori.trim() : '';
  let sql = "SELECT * FROM potensi_desa WHERE status = 'Aktif'";
  const params: unknown[] = [];
  if (kategori && kategori !== 'Semua') {
    sql += ' AND kategori = ?';
    params.push(kategori);
  }
  sql += ' ORDER BY id DESC';
  const items = queryAll<PotensiDesa>(sql, ...params);
  res.json({ items });
});

apiRouter.get('/public/agenda', (_req: Request, res: Response) => {
  const items = queryAll<AgendaDesa>('SELECT * FROM agenda ORDER BY tanggal ASC, id DESC');
  res.json({ items });
});

apiRouter.get('/public/galeri', (req: Request, res: Response) => {
  const kategori = typeof req.query.kategori === 'string' ? req.query.kategori.trim() : '';
  let sql = 'SELECT * FROM galeri';
  const params: unknown[] = [];
  if (kategori && kategori !== 'Semua') {
    sql += ' WHERE kategori = ?';
    params.push(kategori);
  }
  sql += ' ORDER BY tanggal DESC, id DESC';
  const items = queryAll<GaleriItem>(sql, ...params);
  res.json({ items });
});

apiRouter.get('/public/layanan', (_req: Request, res: Response) => {
  const jenisLayanan = queryAll<JenisPelayanan>('SELECT * FROM jenis_pelayanan WHERE is_active = 1 ORDER BY id ASC');
  res.json({ jenisLayanan });
});

apiRouter.post('/public/pelayanan', uploadMiddleware.single('dokumen'), (req: Request, res: Response) => {
  try {
    const nama_pemohon = sanitizeText(req.body.nama_pemohon, 150);
    const nik = sanitizeText(req.body.nik, 20);
    const no_kk = sanitizeText(req.body.no_kk, 20);
    const tempat_tanggal_lahir = sanitizeText(req.body.tempat_tanggal_lahir, 120);
    const alamat = sanitizeText(req.body.alamat, 255);
    const no_hp = sanitizeText(req.body.no_hp, 30);
    const jenis_layanan_id = Number.parseInt(String(req.body.jenis_layanan_id), 10);
    const keperluan = sanitizeText(req.body.keperluan, 2000);

    if (!nama_pemohon || !tempat_tanggal_lahir || !alamat || !keperluan || !Number.isFinite(jenis_layanan_id)) {
      res.status(400).json({ error: 'Semua kolom wajib diisi dengan lengkap.' });
      return;
    }
    if (!validateNikOrKk(nik)) {
      res.status(400).json({ error: 'NIK harus terdiri dari 16 digit angka.' });
      return;
    }
    if (!validateNikOrKk(no_kk)) {
      res.status(400).json({ error: 'Nomor KK harus terdiri dari 16 digit angka.' });
      return;
    }
    if (!validatePhone(no_hp)) {
      res.status(400).json({ error: 'Nomor HP tidak valid (minimal 9 digit angka).' });
      return;
    }

    const jenis = queryOne<JenisPelayanan>('SELECT id, nama FROM jenis_pelayanan WHERE id = ? AND is_active = 1', jenis_layanan_id);
    if (!jenis) {
      res.status(400).json({ error: 'Jenis layanan yang dipilih tidak tersedia.' });
      return;
    }

    const currentYear = new Date().getFullYear();
    const existingRows = queryAll<{ nomor_pengajuan: string }>(
      'SELECT nomor_pengajuan FROM pelayanan WHERE nomor_pengajuan LIKE ?',
      `PSG-${currentYear}-%`
    );
    const nextSeq = extractNextSequence(
      existingRows.map((r) => r.nomor_pengajuan),
      currentYear
    );
    const nomor_pengajuan = generateTrackingNumber(currentYear, nextSeq);
    const dokumen_url = req.file ? `/uploads/${req.file.filename}` : '';

    runSql(
      `INSERT INTO pelayanan (
        nomor_pengajuan, nama_pemohon, nik, no_kk, tempat_tanggal_lahir,
        alamat, no_hp, jenis_layanan_id, keperluan, dokumen_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diajukan')`,
      nomor_pengajuan,
      nama_pemohon,
      nik,
      no_kk,
      tempat_tanggal_lahir,
      alamat,
      no_hp,
      jenis_layanan_id,
      keperluan,
      dokumen_url
    );

    res.status(201).json({
      nomor_pengajuan,
      jenis_layanan_nama: jenis.nama,
      status: 'Diajukan',
      message: 'Pengajuan pelayanan berhasil dikirim.',
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengirim pengajuan.' });
  }
});

apiRouter.get('/public/pelayanan/cek/:nomor', (req: Request, res: Response) => {
  const nomor = sanitizeText(req.params.nomor, 40).toUpperCase();
  const row = queryOne<Pelayanan>(
    `SELECT p.nomor_pengajuan, p.nama_pemohon, p.nik, p.no_kk, p.status, p.catatan_admin,
            p.created_at, p.updated_at, j.nama as jenis_layanan_nama
     FROM pelayanan p
     JOIN jenis_pelayanan j ON j.id = p.jenis_layanan_id
     WHERE p.nomor_pengajuan = ?`,
    nomor
  );
  if (!row) {
    res.status(404).json({ error: `Nomor pengajuan ${nomor} tidak ditemukan.` });
    return;
  }

  // Mask NIK and KK for public privacy compliance
  res.json({
    item: {
      nomor_pengajuan: row.nomor_pengajuan,
      nama_pemohon: row.nama_pemohon,
      nik_masked: maskSensitiveDigits(row.nik),
      kk_masked: maskSensitiveDigits(row.no_kk),
      jenis_layanan_nama: row.jenis_layanan_nama,
      status: row.status,
      catatan_admin: row.catatan_admin,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
});

apiRouter.post('/public/pesan', (req: Request, res: Response) => {
  const nama = sanitizeText(req.body.nama, 120);
  const no_hp = sanitizeText(req.body.no_hp, 30);
  const email = sanitizeText(req.body.email, 120);
  const subjek = sanitizeText(req.body.subjek, 180);
  const pesan = sanitizeText(req.body.pesan, 3000);

  if (!nama || !no_hp || !subjek || !pesan) {
    res.status(400).json({ error: 'Nama, Nomor HP, Subjek, dan Pesan wajib diisi.' });
    return;
  }
  if (!validatePhone(no_hp)) {
    res.status(400).json({ error: 'Format nomor HP tidak valid.' });
    return;
  }
  if (email && !validateEmail(email)) {
    res.status(400).json({ error: 'Format email tidak valid.' });
    return;
  }

  runSql(
    `INSERT INTO pesan (nama, no_hp, email, subjek, pesan, status) VALUES (?, ?, ?, ?, ?, 'Baru')`,
    nama,
    no_hp,
    email,
    subjek,
    pesan
  );
  res.status(201).json({ message: 'Pesan Anda telah diterima oleh Pemerintah Desa Pinangsari.' });
});

apiRouter.get('/public/search', (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? sanitizeText(req.query.q, 100) : '';
  if (!q || q.length < 2) {
    res.json({ berita: [], pengumuman: [], potensi: [], agenda: [], layanan: [] });
    return;
  }
  const like = `%${q}%`;
  const berita = queryAll<Berita>(
    `SELECT b.id, b.judul, b.slug, b.tanggal_publikasi, k.nama as kategori_nama
     FROM berita b JOIN kategori_berita k ON k.id = b.kategori_id
     WHERE b.status = 'Dipublikasikan' AND (b.judul LIKE ? OR b.ringkasan LIKE ?)
     ORDER BY b.tanggal_publikasi DESC LIMIT 5`,
    like,
    like
  );
  const pengumuman = queryAll<Pengumuman>(
    "SELECT id, judul, kategori, tanggal FROM pengumuman WHERE status = 'Aktif' AND (judul LIKE ? OR isi LIKE ?) LIMIT 5",
    like,
    like
  );
  const potensi = queryAll<PotensiDesa>(
    "SELECT id, nama, kategori, lokasi FROM potensi_desa WHERE status = 'Aktif' AND (nama LIKE ? OR deskripsi LIKE ?) LIMIT 5",
    like,
    like
  );
  const agenda = queryAll<AgendaDesa>(
    'SELECT id, nama_kegiatan, tanggal, lokasi FROM agenda WHERE nama_kegiatan LIKE ? OR deskripsi LIKE ? LIMIT 5',
    like,
    like
  );
  const layanan = queryAll<JenisPelayanan>(
    'SELECT id, nama, kode, estimasi_waktu FROM jenis_pelayanan WHERE is_active = 1 AND (nama LIKE ? OR persyaratan LIKE ?) LIMIT 5',
    like,
    like
  );

  res.json({ berita, pengumuman, potensi, agenda, layanan });
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

apiRouter.get('/auth/captcha', (_req: Request, res: Response) => {
  res.json(createCaptchaChallenge());
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const username = sanitizeText(req.body.username, 64);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const captchaId = typeof req.body.captchaId === 'string' ? req.body.captchaId : '';
  const captchaAnswer = typeof req.body.captchaAnswer === 'string' ? req.body.captchaAnswer : '';

  if (!username || !password) {
    res.status(400).json({ error: 'Username dan password wajib diisi.' });
    return;
  }
  if (!verifyCaptchaChallenge(captchaId, captchaAnswer)) {
    res.status(400).json({ error: 'Jawaban verifikasi keamanan (Captcha) salah atau kedaluwarsa.' });
    return;
  }

  const user = queryOne<UserAccount & { password_hash: string }>(
    'SELECT * FROM users WHERE username = ?',
    username
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Username atau password tidak sesuai.' });
    return;
  }
  if (user.is_active !== 1) {
    res.status(403).json({ error: 'Akun Anda dinonaktifkan. Hubungi Super Admin.' });
    return;
  }

  runSql("UPDATE users SET last_login = datetime('now') WHERE id = ?", user.id);
  const session = setSessionCookie(res, {
    id: user.id,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    role: user.role,
  });

  runSql(
    `INSERT INTO activity_logs (user_id, username, role, aksi, modul, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    user.id,
    user.username,
    user.role,
    'LOGIN',
    'auth',
    'Berhasil login ke Dashboard Admin Desa Pinangsari',
    req.ip || ''
  );

  res.json({
    user: {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      role: user.role,
    },
    csrfToken: session.csrfToken,
    expiresAt: session.exp,
  });
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  clearSessionCookie(res);
  res.json({ message: 'Logout berhasil.' });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = req.cookies?.pinangsari_session;
  const session = verifySessionToken(token);
  if (!session) {
    res.json({ authenticated: false, user: null, csrfToken: '' });
    return;
  }
  const user = queryOne<UserAccount>(
    'SELECT id, username, nama_lengkap, email, role, is_active, last_login, created_at FROM users WHERE id = ?',
    session.userId
  );
  if (!user || user.is_active !== 1) {
    clearSessionCookie(res);
    res.json({ authenticated: false, user: null, csrfToken: '' });
    return;
  }
  res.json({
    authenticated: true,
    user,
    csrfToken: session.csrfToken,
    expiresAt: session.exp,
  });
});

// ============================================================================
// UPLOAD ENDPOINT (ADMIN)
// ============================================================================

apiRouter.post('/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengunggah berkas.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Tidak ada berkas yang dipilih.' });
      return;
    }
    res.json({ url: `/uploads/${req.file.filename}`, originalName: req.file.originalname });
  });
});

apiRouter.post('/upload-multiple', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  uploadMiddleware.array('files', 10)(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengunggah berkas.' });
      return;
    }
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    res.json({ urls: files.map((f) => `/uploads/${f.filename}`) });
  });
});

// ============================================================================
// ADMIN DASHBOARD & MODULES
// ============================================================================

apiRouter.get('/admin/dashboard', requireAuth, requirePermission('dashboard', 'read'), (_req, res) => {
  const stats = computeStats();
  const totalBerita = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM berita')?.c ?? 0;
  const totalPengumuman = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM pengumuman')?.c ?? 0;
  const totalPelayanan = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM pelayanan')?.c ?? 0;
  const pelayananBaru = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM pelayanan WHERE status = 'Diajukan'")?.c ?? 0;
  const pesanBaru = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM pesan WHERE status = 'Baru'")?.c ?? 0;
  const totalAgenda = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM agenda')?.c ?? 0;
  const totalPotensi = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM potensi_desa')?.c ?? 0;

  const recentPelayanan = queryAll<Pelayanan>(
    `SELECT p.*, j.nama as jenis_layanan_nama
     FROM pelayanan p JOIN jenis_pelayanan j ON j.id = p.jenis_layanan_id
     ORDER BY p.created_at DESC LIMIT 5`
  );
  const recentLogs = queryAll('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8');
  const pelayananByStatus = queryAll<{ status: string; total: number }>(
    'SELECT status, COUNT(*) as total FROM pelayanan GROUP BY status'
  );
  const pelayananTrend = queryAll<{ bulan: string; total: number }>(
    "SELECT strftime('%Y-%m', created_at) as bulan, COUNT(*) as total FROM pelayanan GROUP BY bulan ORDER BY bulan ASC LIMIT 12"
  );

  res.json({
    stats,
    counts: {
      totalBerita,
      totalPengumuman,
      totalPelayanan,
      pelayananBaru,
      pesanBaru,
      totalAgenda,
      totalPotensi,
    },
    recentPelayanan,
    recentLogs,
    pelayananByStatus,
    pelayananTrend,
  });
});

// Profil Desa
apiRouter.get('/admin/profil', requireAuth, requirePermission('profil', 'read'), (_req, res) => {
  res.json({ item: queryOne<ProfilDesa>('SELECT * FROM profil_desa LIMIT 1') });
});

apiRouter.put('/admin/profil', requireAuth, requirePermission('profil', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  runSql(
    `UPDATE profil_desa SET
      nama_desa = ?, dusun_kantor = ?, rt_kantor = ?, rw_kantor = ?, kecamatan = ?, kabupaten = ?, provinsi = ?, kode_pos = ?,
      sejarah = ?, visi = ?, misi = ?, letak_geografis = ?, batas_utara = ?, batas_selatan = ?, batas_timur = ?, batas_barat = ?,
      kondisi_wilayah = ?, luas_wilayah = ?, jumlah_dusun = ?, jumlah_rw = ?, jumlah_rt = ?, is_demo_data = ?, updated_at = datetime('now')
     WHERE id = 1`,
    sanitizeText(b.nama_desa, 100) || 'Desa Pinangsari',
    sanitizeText(b.dusun_kantor, 100) || 'Wanasari',
    sanitizeText(b.rt_kantor, 10) || '003',
    sanitizeText(b.rw_kantor, 10) || '003',
    sanitizeText(b.kecamatan, 100) || 'Ciasem',
    sanitizeText(b.kabupaten, 100) || 'Subang',
    sanitizeText(b.provinsi, 100) || 'Jawa Barat',
    sanitizeText(b.kode_pos, 20) || 'Data belum tersedia',
    sanitizeText(b.sejarah, 10000),
    sanitizeText(b.visi, 2000),
    sanitizeText(b.misi, 5000),
    sanitizeText(b.letak_geografis, 3000),
    sanitizeText(b.batas_utara, 150) || 'Data belum tersedia',
    sanitizeText(b.batas_selatan, 150) || 'Data belum tersedia',
    sanitizeText(b.batas_timur, 150) || 'Data belum tersedia',
    sanitizeText(b.batas_barat, 150) || 'Data belum tersedia',
    sanitizeText(b.kondisi_wilayah, 4000),
    sanitizeText(b.luas_wilayah, 80) || 'Data belum tersedia',
    Math.max(0, Number.parseInt(String(b.jumlah_dusun), 10) || 0),
    Math.max(0, Number.parseInt(String(b.jumlah_rw), 10) || 0),
    Math.max(0, Number.parseInt(String(b.jumlah_rt), 10) || 0),
    b.is_demo_data ? 1 : 0
  );
  logActivity(req, 'UPDATE', 'profil_desa', 'Memperbarui profil dan informasi umum Desa Pinangsari');
  res.json({ item: queryOne<ProfilDesa>('SELECT * FROM profil_desa LIMIT 1') });
});

// Perangkat Desa
apiRouter.get('/admin/perangkat', requireAuth, requirePermission('pemerintahan', 'read'), (_req, res) => {
  res.json({ items: queryAll<PerangkatDesa>('SELECT * FROM perangkat_desa ORDER BY urutan ASC, id ASC') });
});

apiRouter.post('/admin/perangkat', requireAuth, requirePermission('pemerintahan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const nama = sanitizeText(b.nama, 150);
  const jabatan = sanitizeText(b.jabatan, 120);
  if (!nama || !jabatan) {
    res.status(400).json({ error: 'Nama dan jabatan wajib diisi.' });
    return;
  }
  const result = runSql(
    `INSERT INTO perangkat_desa (nama, jabatan, tingkatan, urutan, nip_nrpd, pendidikan, masa_jabatan, foto_url, keterangan, is_demo_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    nama,
    jabatan,
    sanitizeText(b.tingkatan, 60) || 'Kasi',
    Number.parseInt(String(b.urutan), 10) || 1,
    sanitizeText(b.nip_nrpd, 60) || 'Data belum tersedia',
    sanitizeText(b.pendidikan, 60) || 'Data belum tersedia',
    sanitizeText(b.masa_jabatan, 60) || 'Data belum tersedia',
    sanitizeText(b.foto_url, 255),
    sanitizeText(b.keterangan, 1000),
    b.is_demo_data ? 1 : 0
  );
  logActivity(req, 'CREATE', 'perangkat_desa', `Menambahkan perangkat desa: ${nama} (${jabatan})`);
  res.status(201).json({ id: result.lastInsertRowid });
});

apiRouter.put('/admin/perangkat/:id', requireAuth, requirePermission('pemerintahan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  runSql(
    `UPDATE perangkat_desa SET nama = ?, jabatan = ?, tingkatan = ?, urutan = ?, nip_nrpd = ?, pendidikan = ?, masa_jabatan = ?, foto_url = ?, keterangan = ?, is_demo_data = ? WHERE id = ?`,
    sanitizeText(b.nama, 150),
    sanitizeText(b.jabatan, 120),
    sanitizeText(b.tingkatan, 60),
    Number.parseInt(String(b.urutan), 10) || 1,
    sanitizeText(b.nip_nrpd, 60) || 'Data belum tersedia',
    sanitizeText(b.pendidikan, 60) || 'Data belum tersedia',
    sanitizeText(b.masa_jabatan, 60) || 'Data belum tersedia',
    sanitizeText(b.foto_url, 255),
    sanitizeText(b.keterangan, 1000),
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'perangkat_desa', `Mengubah data perangkat desa ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/perangkat/:id', requireAuth, requirePermission('pemerintahan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM perangkat_desa WHERE id = ?', id);
  logActivity(req, 'DELETE', 'perangkat_desa', `Menghapus perangkat desa ID #${id}`);
  res.json({ ok: true });
});

// Penduduk (PRIVATE - ADMIN ONLY)
apiRouter.get('/admin/penduduk', requireAuth, requirePermission('penduduk', 'read'), (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const dusun = typeof req.query.dusun === 'string' ? req.query.dusun.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const pendidikan = typeof req.query.pendidikan === 'string' ? req.query.pendidikan.trim() : '';

  let sql = 'SELECT * FROM penduduk WHERE 1=1';
  const params: unknown[] = [];
  if (search) {
    sql += ' AND (nama_lengkap LIKE ? OR nik LIKE ? OR no_kk LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (dusun && dusun !== 'Semua') {
    sql += ' AND dusun = ?';
    params.push(dusun);
  }
  if (status && status !== 'Semua') {
    sql += ' AND status_penduduk = ?';
    params.push(status);
  }
  if (pendidikan && pendidikan !== 'Semua') {
    sql += ' AND pendidikan = ?';
    params.push(pendidikan);
  }
  sql += ' ORDER BY id DESC';
  res.json({ items: queryAll<Penduduk>(sql, ...params) });
});

apiRouter.post('/admin/penduduk', requireAuth, requirePermission('penduduk', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const nik = sanitizeText(b.nik, 20);
  const no_kk = sanitizeText(b.no_kk, 20);
  const nama_lengkap = sanitizeText(b.nama_lengkap, 150);
  if (!validateNikOrKk(nik) || !validateNikOrKk(no_kk) || !nama_lengkap) {
    res.status(400).json({ error: 'NIK (16 digit), Nomor KK (16 digit), dan Nama Lengkap wajib valid.' });
    return;
  }
  try {
    const result = runSql(
      `INSERT INTO penduduk (
        nik, no_kk, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
        agama, status_perkawinan, pendidikan, pekerjaan, alamat, rt, rw, dusun, no_hp, status_penduduk, is_demo_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      nik,
      no_kk,
      nama_lengkap,
      b.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      sanitizeText(b.tempat_lahir, 100) || 'Subang',
      sanitizeText(b.tanggal_lahir, 20) || '1990-01-01',
      sanitizeText(b.agama, 40) || 'Islam',
      sanitizeText(b.status_perkawinan, 40) || 'Belum Kawin',
      sanitizeText(b.pendidikan, 60) || 'SMA',
      sanitizeText(b.pekerjaan, 80) || 'Pekerjaan lainnya',
      sanitizeText(b.alamat, 255) || 'Desa Pinangsari',
      sanitizeText(b.rt, 5) || '001',
      sanitizeText(b.rw, 5) || '001',
      sanitizeText(b.dusun, 80) || 'Wanasari',
      sanitizeText(b.no_hp, 30),
      sanitizeText(b.status_penduduk, 30) || 'Aktif',
      b.is_demo_data ? 1 : 0
    );
    logActivity(req, 'CREATE', 'penduduk', `Menambahkan data penduduk: ${nama_lengkap}`);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'NIK sudah terdaftar.' });
  }
});

apiRouter.post('/admin/penduduk/import', requireAuth, requirePermission('penduduk', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  let inserted = 0;
  let skipped = 0;

  for (const r of rows) {
    const nik = sanitizeText(String(r.nik || ''), 20);
    const no_kk = sanitizeText(String(r.no_kk || ''), 20);
    const nama = sanitizeText(String(r.nama_lengkap || ''), 150);
    if (!validateNikOrKk(nik) || !validateNikOrKk(no_kk) || !nama) {
      skipped += 1;
      continue;
    }
    try {
      runSql(
        `INSERT OR IGNORE INTO penduduk (
          nik, no_kk, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
          agama, status_perkawinan, pendidikan, pekerjaan, alamat, rt, rw, dusun, no_hp, status_penduduk, is_demo_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        nik,
        no_kk,
        nama,
        r.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
        sanitizeText(String(r.tempat_lahir || 'Subang'), 100),
        sanitizeText(String(r.tanggal_lahir || '1990-01-01'), 20),
        sanitizeText(String(r.agama || 'Islam'), 40),
        sanitizeText(String(r.status_perkawinan || 'Belum Kawin'), 40),
        sanitizeText(String(r.pendidikan || 'SMA'), 60),
        sanitizeText(String(r.pekerjaan || 'Pekerjaan lainnya'), 80),
        sanitizeText(String(r.alamat || 'Desa Pinangsari'), 255),
        sanitizeText(String(r.rt || '001'), 5),
        sanitizeText(String(r.rw || '001'), 5),
        sanitizeText(String(r.dusun || 'Wanasari'), 80),
        sanitizeText(String(r.no_hp || ''), 30),
        sanitizeText(String(r.status_penduduk || 'Aktif'), 30)
      );
      inserted += 1;
    } catch {
      skipped += 1;
    }
  }
  logActivity(req, 'IMPORT', 'penduduk', `Impor data penduduk Excel: ${inserted} berhasil, ${skipped} dilewati`);
  res.json({ inserted, skipped });
});

apiRouter.put('/admin/penduduk/:id', requireAuth, requirePermission('penduduk', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  const nik = sanitizeText(b.nik, 20);
  const no_kk = sanitizeText(b.no_kk, 20);
  if (!validateNikOrKk(nik) || !validateNikOrKk(no_kk)) {
    res.status(400).json({ error: 'NIK dan Nomor KK harus 16 digit angka.' });
    return;
  }
  runSql(
    `UPDATE penduduk SET
      nik = ?, no_kk = ?, nama_lengkap = ?, jenis_kelamin = ?, tempat_lahir = ?, tanggal_lahir = ?,
      agama = ?, status_perkawinan = ?, pendidikan = ?, pekerjaan = ?, alamat = ?, rt = ?, rw = ?, dusun = ?,
      no_hp = ?, status_penduduk = ?, is_demo_data = ?
     WHERE id = ?`,
    nik,
    no_kk,
    sanitizeText(b.nama_lengkap, 150),
    b.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
    sanitizeText(b.tempat_lahir, 100),
    sanitizeText(b.tanggal_lahir, 20),
    sanitizeText(b.agama, 40),
    sanitizeText(b.status_perkawinan, 40),
    sanitizeText(b.pendidikan, 60),
    sanitizeText(b.pekerjaan, 80),
    sanitizeText(b.alamat, 255),
    sanitizeText(b.rt, 5),
    sanitizeText(b.rw, 5),
    sanitizeText(b.dusun, 80),
    sanitizeText(b.no_hp, 30),
    sanitizeText(b.status_penduduk, 30) || 'Aktif',
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'penduduk', `Mengubah data penduduk ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/penduduk/:id', requireAuth, requirePermission('penduduk', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM penduduk WHERE id = ?', id);
  logActivity(req, 'DELETE', 'penduduk', `Menghapus data penduduk ID #${id}`);
  res.json({ ok: true });
});

// Keluarga (KK - PRIVATE)
apiRouter.get('/admin/keluarga', requireAuth, requirePermission('keluarga', 'read'), (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  let sql = 'SELECT * FROM keluarga WHERE 1=1';
  const params: unknown[] = [];
  if (search) {
    sql += ' AND (no_kk LIKE ? OR kepala_keluarga LIKE ? OR dusun LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY id DESC';
  res.json({ items: queryAll<Keluarga>(sql, ...params) });
});

apiRouter.post('/admin/keluarga', requireAuth, requirePermission('keluarga', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const no_kk = sanitizeText(b.no_kk, 20);
  const kepala_keluarga = sanitizeText(b.kepala_keluarga, 150);
  if (!validateNikOrKk(no_kk) || !kepala_keluarga) {
    res.status(400).json({ error: 'Nomor KK (16 digit) dan Nama Kepala Keluarga wajib diisi.' });
    return;
  }
  try {
    const result = runSql(
      `INSERT INTO keluarga (no_kk, kepala_keluarga, alamat, rt, rw, dusun, jumlah_anggota, status, is_demo_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      no_kk,
      kepala_keluarga,
      sanitizeText(b.alamat, 255) || 'Desa Pinangsari',
      sanitizeText(b.rt, 5) || '001',
      sanitizeText(b.rw, 5) || '001',
      sanitizeText(b.dusun, 80) || 'Wanasari',
      Math.max(1, Number.parseInt(String(b.jumlah_anggota), 10) || 1),
      sanitizeText(b.status, 20) || 'Aktif',
      b.is_demo_data ? 1 : 0
    );
    logActivity(req, 'CREATE', 'keluarga', `Menambahkan Kartu Keluarga ${no_kk}`);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Nomor KK sudah terdaftar.' });
  }
});

apiRouter.put('/admin/keluarga/:id', requireAuth, requirePermission('keluarga', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  runSql(
    `UPDATE keluarga SET no_kk = ?, kepala_keluarga = ?, alamat = ?, rt = ?, rw = ?, dusun = ?, jumlah_anggota = ?, status = ?, is_demo_data = ? WHERE id = ?`,
    sanitizeText(b.no_kk, 20),
    sanitizeText(b.kepala_keluarga, 150),
    sanitizeText(b.alamat, 255),
    sanitizeText(b.rt, 5),
    sanitizeText(b.rw, 5),
    sanitizeText(b.dusun, 80),
    Math.max(1, Number.parseInt(String(b.jumlah_anggota), 10) || 1),
    sanitizeText(b.status, 20) || 'Aktif',
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'keluarga', `Mengubah Kartu Keluarga ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/keluarga/:id', requireAuth, requirePermission('keluarga', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM keluarga WHERE id = ?', id);
  logActivity(req, 'DELETE', 'keluarga', `Menghapus Kartu Keluarga ID #${id}`);
  res.json({ ok: true });
});

// Berita
apiRouter.get('/admin/berita', requireAuth, requirePermission('berita', 'read'), (_req, res) => {
  const items = queryAll<Berita>(
    `SELECT b.*, k.nama as kategori_nama FROM berita b JOIN kategori_berita k ON k.id = b.kategori_id ORDER BY b.tanggal_publikasi DESC, b.id DESC`
  );
  const categories = queryAll<KategoriBerita>('SELECT * FROM kategori_berita ORDER BY id ASC');
  res.json({ items, categories });
});

apiRouter.post('/admin/berita', requireAuth, requirePermission('berita', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const judul = sanitizeText(b.judul, 220);
  const isi = sanitizeText(b.isi, 20000);
  if (!judul || !isi) {
    res.status(400).json({ error: 'Judul dan isi berita wajib diisi.' });
    return;
  }
  const slug = `${slugify(judul)}-${Date.now().toString(36)}`;
  const gambarUrl = sanitizeText(b.gambar_url, 500);
  const result = runSql(
    `INSERT INTO berita (judul, slug, kategori_id, ringkasan, isi, gambar_url, penulis, tanggal_publikasi, status, is_demo_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    judul,
    slug,
    Number.parseInt(String(b.kategori_id), 10) || 1,
    sanitizeText(b.ringkasan, 500) || isi.slice(0, 180),
    isi,
    gambarUrl,
    sanitizeText(b.penulis, 120) || req.session!.nama_lengkap,
    sanitizeText(b.tanggal_publikasi, 20) || new Date().toISOString().slice(0, 10),
    b.status === 'Draft' ? 'Draft' : 'Dipublikasikan',
    b.is_demo_data ? 1 : 0
  );
  logActivity(req, 'CREATE', 'berita', `Menambahkan berita: ${judul}`);
  res.status(201).json({ id: result.lastInsertRowid, slug, gambar_url: gambarUrl });
});

apiRouter.put('/admin/berita/:id', requireAuth, requirePermission('berita', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  const judul = sanitizeText(b.judul, 220);
  const isi = sanitizeText(b.isi, 20000);
  if (!judul || !isi) {
    res.status(400).json({ error: 'Judul dan isi berita wajib diisi.' });
    return;
  }
  const gambarUrl = sanitizeText(b.gambar_url, 500);
  runSql(
    `UPDATE berita SET judul = ?, kategori_id = ?, ringkasan = ?, isi = ?, gambar_url = ?, penulis = ?, tanggal_publikasi = ?, status = ?, is_demo_data = ? WHERE id = ?`,
    judul,
    Number.parseInt(String(b.kategori_id), 10) || 1,
    sanitizeText(b.ringkasan, 500) || isi.slice(0, 180),
    isi,
    gambarUrl,
    sanitizeText(b.penulis, 120) || req.session!.nama_lengkap,
    sanitizeText(b.tanggal_publikasi, 20) || new Date().toISOString().slice(0, 10),
    b.status === 'Draft' ? 'Draft' : 'Dipublikasikan',
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'berita', `Memperbarui berita ID #${id}`);
  res.json({ ok: true, id, gambar_url: gambarUrl });
});

apiRouter.delete('/admin/berita/:id', requireAuth, requirePermission('berita', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM berita WHERE id = ?', id);
  logActivity(req, 'DELETE', 'berita', `Menghapus berita ID #${id}`);
  res.json({ ok: true });
});

// Pengumuman
apiRouter.get('/admin/pengumuman', requireAuth, requirePermission('pengumuman', 'read'), (_req, res) => {
  res.json({ items: queryAll<Pengumuman>('SELECT * FROM pengumuman ORDER BY tanggal DESC, id DESC') });
});

apiRouter.post('/admin/pengumuman', requireAuth, requirePermission('pengumuman', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const judul = sanitizeText(b.judul, 220);
  const isi = sanitizeText(b.isi, 8000);
  if (!judul || !isi) {
    res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
    return;
  }
  const result = runSql(
    `INSERT INTO pengumuman (judul, kategori, isi, tanggal, status, prioritas, lampiran_url, is_demo_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    judul,
    sanitizeText(b.kategori, 60) || 'Pengumuman',
    isi,
    sanitizeText(b.tanggal, 20) || new Date().toISOString().slice(0, 10),
    b.status === 'Arsip' ? 'Arsip' : 'Aktif',
    b.prioritas === 'Penting' ? 'Penting' : 'Normal',
    sanitizeText(b.lampiran_url, 255),
    b.is_demo_data ? 1 : 0
  );
  logActivity(req, 'CREATE', 'pengumuman', `Membuat pengumuman: ${judul}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

apiRouter.put('/admin/pengumuman/:id', requireAuth, requirePermission('pengumuman', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  runSql(
    `UPDATE pengumuman SET judul = ?, kategori = ?, isi = ?, tanggal = ?, status = ?, prioritas = ?, lampiran_url = ?, is_demo_data = ? WHERE id = ?`,
    sanitizeText(b.judul, 220),
    sanitizeText(b.kategori, 60),
    sanitizeText(b.isi, 8000),
    sanitizeText(b.tanggal, 20),
    b.status === 'Arsip' ? 'Arsip' : 'Aktif',
    b.prioritas === 'Penting' ? 'Penting' : 'Normal',
    sanitizeText(b.lampiran_url, 255),
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'pengumuman', `Memperbarui pengumuman ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/pengumuman/:id', requireAuth, requirePermission('pengumuman', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM pengumuman WHERE id = ?', id);
  logActivity(req, 'DELETE', 'pengumuman', `Menghapus pengumuman ID #${id}`);
  res.json({ ok: true });
});

// Pelayanan Admin
apiRouter.get('/admin/pelayanan', requireAuth, requirePermission('pelayanan', 'read'), (_req, res) => {
  const items = queryAll<Pelayanan>(
    `SELECT p.*, j.nama as jenis_layanan_nama
     FROM pelayanan p JOIN jenis_pelayanan j ON j.id = p.jenis_layanan_id
     ORDER BY p.created_at DESC`
  );
  res.json({ items });
});

apiRouter.put('/admin/pelayanan/:id', requireAuth, requirePermission('pelayanan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const nextStatus = sanitizeText(req.body.status, 30) as PelayananStatus;
  const catatan_admin = sanitizeText(req.body.catatan_admin, 2000);

  const existing = queryOne<Pelayanan>('SELECT * FROM pelayanan WHERE id = ?', id);
  if (!existing) {
    res.status(404).json({ error: 'Pengajuan pelayanan tidak ditemukan.' });
    return;
  }
  if (!isValidServiceTransition(existing.status, nextStatus)) {
    res.status(400).json({ error: `Perubahan status dari ${existing.status} ke ${nextStatus} tidak diperbolehkan.` });
    return;
  }

  runSql(
    `UPDATE pelayanan SET status = ?, catatan_admin = ?, updated_at = datetime('now') WHERE id = ?`,
    nextStatus,
    catatan_admin,
    id
  );
  logActivity(req, 'UPDATE', 'pelayanan', `Mengubah status pengajuan ${existing.nomor_pengajuan} menjadi ${nextStatus}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/pelayanan/:id', requireAuth, requirePermission('pelayanan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM pelayanan WHERE id = ?', id);
  logActivity(req, 'DELETE', 'pelayanan', `Menghapus pengajuan pelayanan ID #${id}`);
  res.json({ ok: true });
});

// Potensi Desa
apiRouter.get('/admin/potensi', requireAuth, requirePermission('potensi', 'read'), (_req, res) => {
  res.json({ items: queryAll<PotensiDesa>('SELECT * FROM potensi_desa ORDER BY id DESC') });
});

apiRouter.post('/admin/potensi', requireAuth, requirePermission('potensi', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const nama = sanitizeText(b.nama, 160);
  if (!nama) {
    res.status(400).json({ error: 'Nama potensi desa wajib diisi.' });
    return;
  }
  const result = runSql(
    `INSERT INTO potensi_desa (nama, kategori, deskripsi, lokasi, kontak, foto_url, status, is_demo_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    nama,
    sanitizeText(b.kategori, 60) || 'UMKM',
    sanitizeText(b.deskripsi, 4000),
    sanitizeText(b.lokasi, 150) || 'Desa Pinangsari',
    sanitizeText(b.kontak, 80) || 'Data belum tersedia',
    sanitizeText(b.foto_url, 255),
    b.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
    b.is_demo_data ? 1 : 0
  );
  logActivity(req, 'CREATE', 'potensi_desa', `Menambahkan potensi desa: ${nama}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

apiRouter.put('/admin/potensi/:id', requireAuth, requirePermission('potensi', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  runSql(
    `UPDATE potensi_desa SET nama = ?, kategori = ?, deskripsi = ?, lokasi = ?, kontak = ?, foto_url = ?, status = ?, is_demo_data = ? WHERE id = ?`,
    sanitizeText(b.nama, 160),
    sanitizeText(b.kategori, 60),
    sanitizeText(b.deskripsi, 4000),
    sanitizeText(b.lokasi, 150),
    sanitizeText(b.kontak, 80) || 'Data belum tersedia',
    sanitizeText(b.foto_url, 255),
    b.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'potensi_desa', `Mengubah potensi desa ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/potensi/:id', requireAuth, requirePermission('potensi', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM potensi_desa WHERE id = ?', id);
  logActivity(req, 'DELETE', 'potensi_desa', `Menghapus potensi desa ID #${id}`);
  res.json({ ok: true });
});

// Agenda Desa
apiRouter.get('/admin/agenda', requireAuth, requirePermission('agenda', 'read'), (_req, res) => {
  res.json({ items: queryAll<AgendaDesa>('SELECT * FROM agenda ORDER BY tanggal DESC, id DESC') });
});

apiRouter.post('/admin/agenda', requireAuth, requirePermission('agenda', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const nama_kegiatan = sanitizeText(b.nama_kegiatan, 180);
  if (!nama_kegiatan) {
    res.status(400).json({ error: 'Nama kegiatan wajib diisi.' });
    return;
  }
  const result = runSql(
    `INSERT INTO agenda (nama_kegiatan, tanggal, waktu, lokasi, deskripsi, penanggung_jawab, status, is_demo_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    nama_kegiatan,
    sanitizeText(b.tanggal, 20) || new Date().toISOString().slice(0, 10),
    sanitizeText(b.waktu, 40) || '08:00 WIB',
    sanitizeText(b.lokasi, 150) || 'Balai Desa Pinangsari',
    sanitizeText(b.deskripsi, 3000),
    sanitizeText(b.penanggung_jawab, 120) || 'Pemerintah Desa',
    sanitizeText(b.status, 30) || 'Akan Datang',
    b.is_demo_data ? 1 : 0
  );
  logActivity(req, 'CREATE', 'agenda', `Menambahkan agenda kegiatan: ${nama_kegiatan}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

apiRouter.put('/admin/agenda/:id', requireAuth, requirePermission('agenda', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  runSql(
    `UPDATE agenda SET nama_kegiatan = ?, tanggal = ?, waktu = ?, lokasi = ?, deskripsi = ?, penanggung_jawab = ?, status = ?, is_demo_data = ? WHERE id = ?`,
    sanitizeText(b.nama_kegiatan, 180),
    sanitizeText(b.tanggal, 20),
    sanitizeText(b.waktu, 40),
    sanitizeText(b.lokasi, 150),
    sanitizeText(b.deskripsi, 3000),
    sanitizeText(b.penanggung_jawab, 120),
    sanitizeText(b.status, 30) || 'Akan Datang',
    b.is_demo_data ? 1 : 0,
    id
  );
  logActivity(req, 'UPDATE', 'agenda', `Mengubah agenda ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/agenda/:id', requireAuth, requirePermission('agenda', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM agenda WHERE id = ?', id);
  logActivity(req, 'DELETE', 'agenda', `Menghapus agenda ID #${id}`);
  res.json({ ok: true });
});

// Galeri
apiRouter.get('/admin/galeri', requireAuth, requirePermission('galeri', 'read'), (_req, res) => {
  res.json({ items: queryAll<GaleriItem>('SELECT * FROM galeri ORDER BY tanggal DESC, id DESC') });
});

apiRouter.post('/admin/galeri', requireAuth, requirePermission('galeri', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const urls: string[] = Array.isArray(b.gambar_urls)
    ? b.gambar_urls.map((u: unknown) => sanitizeText(u, 255)).filter(Boolean)
    : b.gambar_url
    ? [sanitizeText(b.gambar_url, 255)]
    : [];
  const judul = sanitizeText(b.judul, 160);
  if (!judul || urls.length === 0) {
    res.status(400).json({ error: 'Judul dan minimal satu foto wajib tersedia.' });
    return;
  }
  for (let i = 0; i < urls.length; i++) {
    const suffix = urls.length > 1 ? ` (${i + 1})` : '';
    runSql(
      `INSERT INTO galeri (judul, kategori, gambar_url, keterangan, tanggal, is_demo_data) VALUES (?, ?, ?, ?, ?, ?)`,
      `${judul}${suffix}`,
      sanitizeText(b.kategori, 80) || 'Kegiatan Pemerintah Desa',
      urls[i],
      sanitizeText(b.keterangan, 1000),
      sanitizeText(b.tanggal, 20) || new Date().toISOString().slice(0, 10),
      b.is_demo_data ? 1 : 0
    );
  }
  logActivity(req, 'CREATE', 'galeri', `Menambahkan ${urls.length} foto galeri: ${judul}`);
  res.status(201).json({ count: urls.length });
});

apiRouter.delete('/admin/galeri/:id', requireAuth, requirePermission('galeri', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM galeri WHERE id = ?', id);
  logActivity(req, 'DELETE', 'galeri', `Menghapus foto galeri ID #${id}`);
  res.json({ ok: true });
});

// Pesan Warga
apiRouter.get('/admin/pesan', requireAuth, requirePermission('pesan', 'read'), (_req, res) => {
  res.json({ items: queryAll<PesanWarga>('SELECT * FROM pesan ORDER BY created_at DESC') });
});

apiRouter.put('/admin/pesan/:id', requireAuth, requirePermission('pesan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const status = sanitizeText(req.body.status, 30) as PesanStatus;
  const catatan_tindak_lanjut = sanitizeText(req.body.catatan_tindak_lanjut, 2000);
  runSql('UPDATE pesan SET status = ?, catatan_tindak_lanjut = ? WHERE id = ?', status, catatan_tindak_lanjut, id);
  logActivity(req, 'UPDATE', 'pesan', `Memperbarui status pesan warga ID #${id} -> ${status}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/pesan/:id', requireAuth, requirePermission('pesan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  runSql('DELETE FROM pesan WHERE id = ?', id);
  logActivity(req, 'DELETE', 'pesan', `Menghapus pesan warga ID #${id}`);
  res.json({ ok: true });
});

// Laporan
apiRouter.get('/admin/laporan/:jenis', requireAuth, requirePermission('laporan', 'read'), (req: Request, res: Response) => {
  const jenis = req.params.jenis;
  if (jenis === 'penduduk') {
    res.json({ rows: queryAll('SELECT nik, no_kk, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, dusun, rt, rw, status_penduduk FROM penduduk ORDER BY nama_lengkap ASC') });
    return;
  }
  if (jenis === 'keluarga') {
    res.json({ rows: queryAll('SELECT no_kk, kepala_keluarga, alamat, rt, rw, dusun, jumlah_anggota, status FROM keluarga ORDER BY kepala_keluarga ASC') });
    return;
  }
  if (jenis === 'pelayanan') {
    res.json({
      rows: queryAll(
        `SELECT p.nomor_pengajuan, p.nama_pemohon, j.nama as layanan, p.keperluan, p.status, p.created_at
         FROM pelayanan p JOIN jenis_pelayanan j ON j.id = p.jenis_layanan_id ORDER BY p.created_at DESC`
      ),
    });
    return;
  }
  if (jenis === 'berita') {
    res.json({
      rows: queryAll(
        `SELECT b.judul, k.nama as kategori, b.penulis, b.tanggal_publikasi, b.status, b.views
         FROM berita b JOIN kategori_berita k ON k.id = b.kategori_id ORDER BY b.tanggal_publikasi DESC`
      ),
    });
    return;
  }
  if (jenis === 'agenda') {
    res.json({ rows: queryAll('SELECT nama_kegiatan, tanggal, waktu, lokasi, penanggung_jawab, status FROM agenda ORDER BY tanggal DESC') });
    return;
  }
  if (jenis === 'potensi') {
    res.json({ rows: queryAll('SELECT nama, kategori, lokasi, kontak, status FROM potensi_desa ORDER BY id DESC') });
    return;
  }
  res.status(400).json({ error: 'Jenis laporan tidak valid.' });
});

// Users (Super Admin only)
apiRouter.get('/admin/users', requireAuth, requirePermission('pengguna', 'read'), (_req, res) => {
  res.json({
    items: queryAll<UserAccount>('SELECT id, username, nama_lengkap, email, role, is_active, last_login, created_at FROM users ORDER BY id ASC'),
  });
});

apiRouter.post('/admin/users', requireAuth, requirePermission('pengguna', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  const username = sanitizeText(b.username, 64);
  const password = typeof b.password === 'string' ? b.password : '';
  const nama_lengkap = sanitizeText(b.nama_lengkap, 120);
  const role = (['SUPER_ADMIN', 'OPERATOR_DESA', 'KEPALA_DESA'].includes(b.role) ? b.role : 'OPERATOR_DESA') as AdminRole;
  if (!username || password.length < 8 || !nama_lengkap) {
    res.status(400).json({ error: 'Username, nama lengkap, dan password minimal 8 karakter wajib diisi.' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = runSql(
      `INSERT INTO users (username, password_hash, nama_lengkap, email, role, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
      username,
      hash,
      nama_lengkap,
      sanitizeText(b.email, 120) || 'Data belum tersedia',
      role
    );
    logActivity(req, 'CREATE', 'users', `Menambahkan pengguna admin: ${username} (${role})`);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Username sudah digunakan.' });
  }
});

apiRouter.put('/admin/users/:id', requireAuth, requirePermission('pengguna', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  const b = req.body;
  const role = (['SUPER_ADMIN', 'OPERATOR_DESA', 'KEPALA_DESA'].includes(b.role) ? b.role : 'OPERATOR_DESA') as AdminRole;
  runSql(
    `UPDATE users SET nama_lengkap = ?, email = ?, role = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`,
    sanitizeText(b.nama_lengkap, 120),
    sanitizeText(b.email, 120) || 'Data belum tersedia',
    role,
    b.is_active ? 1 : 0,
    id
  );
  if (typeof b.password === 'string' && b.password.length >= 8) {
    runSql('UPDATE users SET password_hash = ? WHERE id = ?', bcrypt.hashSync(b.password, 10), id);
  }
  logActivity(req, 'UPDATE', 'users', `Memperbarui pengguna ID #${id}`);
  res.json({ ok: true });
});

apiRouter.delete('/admin/users/:id', requireAuth, requirePermission('pengguna', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (id === req.session!.userId) {
    res.status(400).json({ error: 'Tidak dapat menghapus akun yang sedang digunakan.' });
    return;
  }
  runSql('DELETE FROM users WHERE id = ?', id);
  logActivity(req, 'DELETE', 'users', `Menghapus pengguna ID #${id}`);
  res.json({ ok: true });
});

// Activity Logs
apiRouter.get('/admin/activity-logs', requireAuth, requirePermission('logs', 'read'), (_req, res) => {
  res.json({ items: queryAll('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100') });
});

// Pengaturan Website
apiRouter.get('/admin/pengaturan', requireAuth, requirePermission('pengaturan', 'read'), (_req, res) => {
  res.json({ item: queryOne<PengaturanDesa>('SELECT * FROM pengaturan LIMIT 1') });
});

apiRouter.put('/admin/pengaturan', requireAuth, requirePermission('pengaturan', 'write'), (req: AuthenticatedRequest, res: Response) => {
  const b = req.body;
  runSql(
    `UPDATE pengaturan SET
      nama_website = ?, tagline = ?, telepon = ?, whatsapp = ?, email = ?, jam_pelayanan = ?,
      alamat_lengkap = ?, facebook_url = ?, instagram_url = ?, youtube_url = ?,
      latitude = ?, longitude = ?, map_zoom = ?, tampilkan_label_contoh = ?, updated_at = datetime('now')
     WHERE id = 1`,
    sanitizeText(b.nama_website, 150) || 'Desa Pinangsari',
    sanitizeText(b.tagline, 255),
    sanitizeText(b.telepon, 60) || 'Data belum tersedia',
    sanitizeText(b.whatsapp, 60) || 'Data belum tersedia',
    sanitizeText(b.email, 120) || 'Data belum tersedia',
    sanitizeText(b.jam_pelayanan, 150) || 'Data belum tersedia',
    sanitizeText(b.alamat_lengkap, 255),
    sanitizeText(b.facebook_url, 255),
    sanitizeText(b.instagram_url, 255),
    sanitizeText(b.youtube_url, 255),
    sanitizeText(b.latitude, 40),
    sanitizeText(b.longitude, 40),
    Math.max(5, Math.min(20, Number.parseInt(String(b.map_zoom), 10) || 14)),
    b.tampilkan_label_contoh ? 1 : 0
  );
  logActivity(req, 'UPDATE', 'pengaturan', 'Memperbarui pengaturan website, kontak, dan koordinat peta desa');
  res.json({ item: queryOne<PengaturanDesa>('SELECT * FROM pengaturan LIMIT 1') });
});

// Backup Database
apiRouter.get('/admin/backup', requireAuth, requirePermission('backup', 'read'), (req: AuthenticatedRequest, res: Response) => {
  const tables = [
    'profil_desa',
    'pengaturan',
    'perangkat_desa',
    'keluarga',
    'penduduk',
    'kategori_berita',
    'berita',
    'pengumuman',
    'jenis_pelayanan',
    'pelayanan',
    'potensi_desa',
    'agenda',
    'galeri',
    'pesan',
    'activity_logs',
  ];
  const dump: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    database: 'desa_pinangsari',
    tables: {} as Record<string, unknown[]>,
  };
  const tableMap = dump.tables as Record<string, unknown[]>;
  for (const t of tables) {
    tableMap[t] = queryAll(`SELECT * FROM ${t}`);
  }
  logActivity(req, 'BACKUP', 'pengaturan', 'Mengunduh backup database Sistem Informasi Desa Pinangsari');
  res.setHeader('Content-Disposition', `attachment; filename="backup-desa-pinangsari-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(dump);
});
