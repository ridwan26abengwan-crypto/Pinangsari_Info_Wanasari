import type { AdminRole, Keluarga, PelayananStatus, Penduduk, PotensiDesa, ProfilDesa, StatistikSummary } from '../types/village';

export type AdminModule =
  | 'dashboard'
  | 'profil'
  | 'pemerintahan'
  | 'penduduk'
  | 'keluarga'
  | 'berita'
  | 'pengumuman'
  | 'pelayanan'
  | 'potensi'
  | 'agenda'
  | 'galeri'
  | 'pesan'
  | 'laporan'
  | 'pengguna'
  | 'pengaturan'
  | 'logs'
  | 'backup'
  | 'panduan';

export type PermissionAction = 'read' | 'write';

const OPERATOR_MODULES = new Set<AdminModule>([
  'dashboard',
  'berita',
  'pengumuman',
  'penduduk',
  'keluarga',
  'pelayanan',
  'agenda',
  'galeri',
  'pesan',
  'panduan',
]);

const KEPALA_DESA_READ_MODULES = new Set<AdminModule>([
  'dashboard',
  'profil',
  'pemerintahan',
  'penduduk',
  'keluarga',
  'pelayanan',
  'potensi',
  'agenda',
  'laporan',
  'panduan',
]);

export function hasPermission(role: AdminRole, module: AdminModule, action: PermissionAction): boolean {
  if (role === 'SUPER_ADMIN') {
    return true;
  }
  if (role === 'OPERATOR_DESA') {
    if (module === 'laporan' || module === 'panduan') {
      return action === 'read';
    }
    return OPERATOR_MODULES.has(module);
  }
  if (role === 'KEPALA_DESA') {
    return action === 'read' && KEPALA_DESA_READ_MODULES.has(module);
  }
  return false;
}

export function generateTrackingNumber(year: number, sequenceNumber: number): string {
  const safeYear = Math.max(2000, Math.min(2099, Math.trunc(year)));
  const safeSeq = Math.max(1, Math.trunc(sequenceNumber));
  return `PSG-${safeYear}-${String(safeSeq).padStart(5, '0')}`;
}

export function extractNextSequence(existingNumbers: string[], year: number): number {
  const prefix = `PSG-${year}-`;
  let maxSeq = 0;
  for (const code of existingNumbers) {
    if (code.startsWith(prefix)) {
      const part = Number.parseInt(code.slice(prefix.length), 10);
      if (Number.isFinite(part) && part > maxSeq) {
        maxSeq = part;
      }
    }
  }
  return maxSeq + 1;
}

export function validateNikOrKk(value: string): boolean {
  return /^\d{16}$/.test(value.trim());
}

export function validatePhone(value: string): boolean {
  const cleaned = value.trim().replace(/[\s-]/g, '');
  return /^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(cleaned) || /^\d{9,15}$/.test(cleaned);
}

export function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function maskSensitiveDigits(value: string): string {
  const clean = value.trim();
  if (clean.length <= 6) {
    return '*'.repeat(clean.length);
  }
  return `${clean.slice(0, 4)}${'*'.repeat(clean.length - 6)}${clean.slice(-2)}`;
}

const VALID_TRANSITIONS: Record<PelayananStatus, PelayananStatus[]> = {
  Diajukan: ['Diverifikasi', 'Diproses', 'Ditolak'],
  Diverifikasi: ['Diproses', 'Selesai', 'Ditolak'],
  Diproses: ['Selesai', 'Ditolak'],
  Selesai: [],
  Ditolak: ['Diajukan'],
};

export function isValidServiceTransition(from: PelayananStatus, to: PelayananStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function sanitizeText(value: unknown, maxLength = 5000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

const EDUCATION_CATEGORIES = [
  'Tidak/Belum Sekolah',
  'SD',
  'SMP',
  'SMA',
  'Diploma',
  'Sarjana',
] as const;

const OCCUPATION_CATEGORIES = [
  'Petani',
  'Pedagang',
  'Wiraswasta',
  'Guru',
  'Karyawan',
  'Buruh',
  'Pekerjaan lainnya',
] as const;

export function aggregateDemographics(
  pendudukList: Array<Pick<Penduduk, 'jenis_kelamin' | 'pendidikan' | 'pekerjaan' | 'status_penduduk' | 'is_demo_data'>>,
  keluargaList: Array<Pick<Keluarga, 'status' | 'is_demo_data'>>,
  potensiList: Array<Pick<PotensiDesa, 'kategori' | 'status'>>,
  profil: Pick<ProfilDesa, 'jumlah_rt' | 'jumlah_rw' | 'jumlah_dusun'>
): StatistikSummary {
  const activePenduduk = pendudukList.filter((p) => p.status_penduduk === 'Aktif');
  const activeKeluarga = keluargaList.filter((k) => k.status === 'Aktif');

  let lakiLaki = 0;
  let perempuan = 0;

  const pendidikan: Record<string, number> = {};
  for (const key of EDUCATION_CATEGORIES) pendidikan[key] = 0;

  const pekerjaan: Record<string, number> = {};
  for (const key of OCCUPATION_CATEGORIES) pekerjaan[key] = 0;

  for (const person of activePenduduk) {
    if (person.jenis_kelamin === 'Laki-laki') lakiLaki += 1;
    else if (person.jenis_kelamin === 'Perempuan') perempuan += 1;

    if (person.pendidikan in pendidikan) {
      pendidikan[person.pendidikan] += 1;
    } else {
      pendidikan['Tidak/Belum Sekolah'] += 1;
    }

    if (person.pekerjaan in pekerjaan) {
      pekerjaan[person.pekerjaan] += 1;
    } else {
      pekerjaan['Pekerjaan lainnya'] += 1;
    }
  }

  const jumlahUMKM = potensiList.filter(
    (p) => p.status === 'Aktif' && (p.kategori === 'UMKM' || p.kategori === 'Produk unggulan' || p.kategori === 'Kerajinan')
  ).length;

  const isDemoData =
    activePenduduk.some((p) => p.is_demo_data === 1) || activeKeluarga.some((k) => k.is_demo_data === 1);

  return {
    jumlahPenduduk: activePenduduk.length,
    jumlahKK: activeKeluarga.length,
    lakiLaki,
    perempuan,
    jumlahRT: profil.jumlah_rt,
    jumlahRW: profil.jumlah_rw,
    jumlahDusun: profil.jumlah_dusun,
    jumlahUMKM,
    pendidikan,
    pekerjaan,
    isDemoData,
  };
}

export function parseCoordinates(latStr: string, lngStr: string): { lat: number; lng: number } | null {
  const lat = Number.parseFloat(latStr);
  const lng = Number.parseFloat(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export interface DnsRecordRow {
  type: 'A' | 'CNAME' | 'TXT' | 'MX';
  host: string;
  value: string;
  ttl: string;
  purpose: string;
}

export function normalizeDesaDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/\.+$/, '');
}

export function isValidDesaDomain(domain: string): boolean {
  const clean = normalizeDesaDomain(domain);
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.desa\.id$/.test(clean);
}

export function isValidIpv4(ip: string): boolean {
  const clean = ip.trim();
  const parts = clean.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255 && String(num) === part;
  });
}

export function buildDnsRecords(
  rawDomain: string,
  rawServerIp: string,
  mode: 'vps' | 'cloudrun' = 'vps'
): DnsRecordRow[] {
  const domain = normalizeDesaDomain(rawDomain) || 'pinangsari.desa.id';
  const serverIp = rawServerIp.trim() || '203.0.113.10';

  if (mode === 'cloudrun') {
    return [
      {
        type: 'TXT',
        host: '@',
        value: 'google-site-verification=<TOKEN_VERIFIKASI_GOOGLE>',
        ttl: '3600',
        purpose: 'Verifikasi kepemilikan domain di Google Search Console / Cloud Run',
      },
      {
        type: 'A',
        host: '@',
        value: '216.239.32.21 (dan 34.21, 36.21, 38.21)',
        ttl: '3600',
        purpose: `Mengarahkan domain utama ${domain} ke Google Cloud Run`,
      },
      {
        type: 'CNAME',
        host: 'www',
        value: 'ghs.googlehosted.com',
        ttl: '3600',
        purpose: `Mengarahkan www.${domain} ke endpoint Cloud Run`,
      },
    ];
  }

  return [
    {
      type: 'A',
      host: '@',
      value: serverIp,
      ttl: '3600',
      purpose: `Mengarahkan domain utama ${domain} langsung ke IP server hosting`,
    },
    {
      type: 'CNAME',
      host: 'www',
      value: domain,
      ttl: '3600',
      purpose: `Mengarahkan subdomain www.${domain} ke domain utama`,
    },
    {
      type: 'TXT',
      host: '@',
      value: `v=spf1 a mx ip4:${serverIp} ~all`,
      ttl: '3600',
      purpose: 'Kebijakan SPF dasar agar email resmi desa tidak dianggap spam (opsional)',
    },
  ];
}

