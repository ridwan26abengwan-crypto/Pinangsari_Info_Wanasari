import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateDemographics,
  buildDnsRecords,
  extractNextSequence,
  generateTrackingNumber,
  hasPermission,
  isValidDesaDomain,
  isValidIpv4,
  isValidServiceTransition,
  maskSensitiveDigits,
  normalizeDesaDomain,
  parseCoordinates,
  sanitizeText,
  validateEmail,
  validateNikOrKk,
  validatePhone,
} from './villageLogic';

test('tracking number formatting and sequential increment', () => {
  assert.equal(generateTrackingNumber(2026, 1), 'PSG-2026-00001');
  assert.equal(generateTrackingNumber(2026, 42), 'PSG-2026-00042');
  const next = extractNextSequence(['PSG-2026-00001', 'PSG-2026-00009', 'PSG-2025-00100'], 2026);
  assert.equal(next, 10);
});

test('NIK, KK, phone, and email validation', () => {
  assert.equal(validateNikOrKk('3213012345678901'), true);
  assert.equal(validateNikOrKk('12345'), false);
  assert.equal(validateNikOrKk('321301234567890a'), false);

  assert.equal(validatePhone('081234567890'), true);
  assert.equal(validatePhone('+6281234567890'), true);
  assert.equal(validatePhone('123'), false);

  assert.equal(validateEmail('warga@pinangsari.id'), true);
  assert.equal(validateEmail('invalid-email'), false);
});

test('sensitive PII masking for public status check', () => {
  assert.equal(maskSensitiveDigits('3213012345678901'), '3213**********01');
});

test('RBAC permissions enforce role boundaries', () => {
  assert.equal(hasPermission('SUPER_ADMIN', 'pengguna', 'write'), true);
  assert.equal(hasPermission('SUPER_ADMIN', 'panduan', 'write'), true);
  assert.equal(hasPermission('OPERATOR_DESA', 'berita', 'write'), true);
  assert.equal(hasPermission('OPERATOR_DESA', 'panduan', 'read'), true);
  assert.equal(hasPermission('OPERATOR_DESA', 'panduan', 'write'), false);
  assert.equal(hasPermission('OPERATOR_DESA', 'pengguna', 'write'), false);
  assert.equal(hasPermission('OPERATOR_DESA', 'pengaturan', 'write'), false);
  assert.equal(hasPermission('KEPALA_DESA', 'laporan', 'read'), true);
  assert.equal(hasPermission('KEPALA_DESA', 'panduan', 'read'), true);
  assert.equal(hasPermission('KEPALA_DESA', 'berita', 'write'), false);
  assert.equal(hasPermission('KEPALA_DESA', 'penduduk', 'write'), false);
});

test('service status workflow transitions', () => {
  assert.equal(isValidServiceTransition('Diajukan', 'Diverifikasi'), true);
  assert.equal(isValidServiceTransition('Diverifikasi', 'Diproses'), true);
  assert.equal(isValidServiceTransition('Diproses', 'Selesai'), true);
  assert.equal(isValidServiceTransition('Selesai', 'Diajukan'), false);
});

test('demographic aggregation counts active residents and categorizes education and occupation', () => {
  const summary = aggregateDemographics(
    [
      { jenis_kelamin: 'Laki-laki', pendidikan: 'SMA', pekerjaan: 'Petani', status_penduduk: 'Aktif', is_demo_data: 1 },
      { jenis_kelamin: 'Perempuan', pendidikan: 'Sarjana', pekerjaan: 'Guru', status_penduduk: 'Aktif', is_demo_data: 1 },
      { jenis_kelamin: 'Laki-laki', pendidikan: 'SD', pekerjaan: 'Buruh', status_penduduk: 'Pindah', is_demo_data: 1 },
    ],
    [
      { status: 'Aktif', is_demo_data: 1 },
      { status: 'Nonaktif', is_demo_data: 1 },
    ],
    [
      { kategori: 'UMKM', status: 'Aktif' },
      { kategori: 'Pertanian', status: 'Aktif' },
    ],
    { jumlah_rt: 12, jumlah_rw: 4, jumlah_dusun: 3 }
  );

  assert.equal(summary.jumlahPenduduk, 2);
  assert.equal(summary.lakiLaki, 1);
  assert.equal(summary.perempuan, 1);
  assert.equal(summary.jumlahKK, 1);
  assert.equal(summary.jumlahUMKM, 1);
  assert.equal(summary.pendidikan['SMA'], 1);
  assert.equal(summary.pendidikan['Sarjana'], 1);
  assert.equal(summary.pekerjaan['Petani'], 1);
  assert.equal(summary.pekerjaan['Guru'], 1);
  assert.equal(summary.isDemoData, true);
});

test('coordinate parser rejects blank or invalid coordinates', () => {
  assert.equal(parseCoordinates('', ''), null);
  assert.equal(parseCoordinates('Data belum tersedia', ''), null);
  assert.deepEqual(parseCoordinates('-6.3125', '107.6841'), { lat: -6.3125, lng: 107.6841 });
});

test('sanitizeText strips script tags and angle brackets', () => {
  assert.equal(sanitizeText('<script>alert(1)</script>Halo <b>Desa</b>'), 'Halo bDesa/b');
});

test('desa.id domain normalization, validation, IPv4 check, and DNS record builder', () => {
  assert.equal(normalizeDesaDomain('https://www.Pinangsari.Desa.ID/'), 'pinangsari.desa.id');
  assert.equal(isValidDesaDomain('pinangsari.desa.id'), true);
  assert.equal(isValidDesaDomain('pinangsari-subang.desa.id'), true);
  assert.equal(isValidDesaDomain('pinangsari.com'), false);
  assert.equal(isValidDesaDomain('sub.pinangsari.desa.id'), false);

  assert.equal(isValidIpv4('103.150.10.25'), true);
  assert.equal(isValidIpv4('999.10.10.1'), false);
  assert.equal(isValidIpv4('01.10.10.1'), false);

  const vpsRecords = buildDnsRecords('https://pinangsari.desa.id/', '103.150.10.25', 'vps');
  assert.equal(vpsRecords[0].type, 'A');
  assert.equal(vpsRecords[0].host, '@');
  assert.equal(vpsRecords[0].value, '103.150.10.25');
  assert.equal(vpsRecords[1].type, 'CNAME');
  assert.equal(vpsRecords[1].value, 'pinangsari.desa.id');

  const cloudRunRecords = buildDnsRecords('pinangsari-subang.desa.id', '103.150.10.25', 'cloudrun');
  assert.equal(cloudRunRecords[0].type, 'TXT');
  assert.equal(cloudRunRecords[2].value, 'ghs.googlehosted.com');
});

