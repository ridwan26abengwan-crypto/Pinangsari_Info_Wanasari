import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  RotateCcw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useToast } from '../../components/UiPrimitives';
import {
  buildDnsRecords,
  isValidDesaDomain,
  isValidIpv4,
  normalizeDesaDomain,
} from '../../utils/villageLogic';

interface ChecklistItem {
  id: string;
  phase: string;
  label: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'doc-sk',
    phase: 'Persyaratan',
    label: 'Siapkan pindaian SK Pengangkatan Kepala Desa (dari Bupati Subang) & e-KTP pemohon.',
  },
  {
    id: 'doc-surat',
    phase: 'Persyaratan',
    label: 'Buat Surat Permohonan resmi & Surat Kuasa (jika diwakilkan) berkop Pemerintah Desa Pinangsari dan stempel basah.',
  },
  {
    id: 'reg-domain',
    phase: 'Registrasi',
    label: 'Daftarkan domain .desa.id melalui Registrar resmi PANDI atau fasilitasi Diskominfo Kab. Subang & unggah dokumen verifikasi.',
  },
  {
    id: 'host-ready',
    phase: 'Server',
    label: 'Jalankan aplikasi Portal Desa di server produksi (VPS/Cloud) dengan NODE_ENV=production dan SESSION_SECRET acak.',
  },
  {
    id: 'dns-point',
    phase: 'DNS',
    label: 'Tambahkan A Record (@) dan CNAME (www) pada DNS Management registrar menuju IP/endpoint server hosting.',
  },
  {
    id: 'ssl-https',
    phase: 'Keamanan',
    label: 'Pasang sertifikat SSL/TLS (HTTPS) melalui Let’s Encrypt Certbot / Reverse Proxy Nginx dan atur APP_URL ke https://.',
  },
  {
    id: 'pass-rotate',
    phase: 'Keamanan',
    label: 'Ubah seluruh kata sandi akun administrator (Super Admin, Operator, Kepala Desa) lewat menu Pengguna.',
  },
  {
    id: 'data-real',
    phase: 'Konten Resmi',
    label: 'Lengkapi data asli Profil Desa, Perangkat Desa, Penduduk/KK, serta titik Google Maps Kantor Desa di menu Pengaturan.',
  },
];

const CHECKLIST_STORAGE_KEY = 'pinangsari_domain_checklist_v1';

const PROGRESS_WIDTH_CLASSES = [
  'w-0',
  'w-1/8',
  'w-2/8',
  'w-3/8',
  'w-4/8',
  'w-5/8',
  'w-6/8',
  'w-7/8',
  'w-full',
] as const;

export function AdminDomainGuidePage() {
  const { showToast } = useToast();

  const [domainInput, setDomainInput] = useState('pinangsari.desa.id');
  const [serverIpInput, setServerIpInput] = useState('203.0.113.10');
  const [hostingMode, setHostingMode] = useState<'vps' | 'cloudrun'>('vps');
  const [kepalaDesa, setKepalaDesa] = useState('Kepala Desa Pinangsari');
  const [nomorSurat, setNomorSurat] = useState('141 / 045 / PEMDES-PSG / 2026');
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // Ignore storage error
    }
  }, [completedIds]);

  const normalizedDomain = normalizeDesaDomain(domainInput) || 'pinangsari.desa.id';
  const domainValid = isValidDesaDomain(domainInput);
  const ipValid = isValidIpv4(serverIpInput);

  const dnsRecords = useMemo(
    () => buildDnsRecords(normalizedDomain, serverIpInput, hostingMode),
    [normalizedDomain, serverIpInput, hostingMode]
  );

  const progressPct = Math.round((completedIds.length / CHECKLIST_ITEMS.length) * 100);

  const toggleCheck = (id: string) => {
    setCompletedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const resetChecklist = () => {
    setCompletedIds([]);
    showToast('Checklist kesiapan direset.');
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} berhasil disalin ke clipboard.`);
    } catch {
      showToast('Gagal menyalin otomatis. Silakan blok dan salin teks secara manual.', 'error');
    }
  };

  const letterDraft = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `PEMERINTAH KABUPATEN SUBANG
KECAMATAN CIASEM
PEMERINTAH DESA PINANGSARI
Alamat: Dusun Wanasari RT.003/RW.003, Desa Pinangsari, Kec. Ciasem, Kab. Subang, Jawa Barat

------------------------------------------------

Pinangsari, ${today}

Nomor   : ${nomorSurat}
Lampiran: 1 (Satu) Berkas
Perihal : Permohonan Pendaftaran Nama Domain Resmi Pemerintah Desa (${normalizedDomain})

Kepada Yth.
Pengelola Nama Domain Internet Indonesia (PANDI) / Registrar Resmi
c.q. Dinas Komunikasi dan Informatika Kabupaten Subang
di Tempat

Dengan hormat,

Sehubungan dengan penyelenggaraan Sistem Informasi dan Pelayanan Digital Masyarakat Pemerintah Desa Pinangsari, Kecamatan Ciasem, Kabupaten Subang, Provinsi Jawa Barat, bersama ini kami mengajukan permohonan pendaftaran dan aktivasi nama domain resmi desa:

  Nama Domain Utama   : ${normalizedDomain}
  Alternatif Domain   : pinangsari-subang.desa.id / pinangsari-ciasem.desa.id
  Instansi Pemohon    : Pemerintah Desa Pinangsari, Kec. Ciasem, Kab. Subang
  Penanggung Jawab    : ${kepalaDesa}

Sebagai bahan verifikasi keabsahan lembaga pemerintah desa sesuai ketentuan pendaftaran domain .desa.id, bersama surat ini kami lampirkan:
1. Salinan Kartu Tanda Penduduk Elektronik (e-KTP) Pemohon / Kepala Desa;
2. Salinan Surat Keputusan (SK) Bupati Subang tentang Pengangkatan Kepala Desa Pinangsari;
3. Surat Tugas / Surat Kuasa Pengelola Website Desa (jika pengajuan dilakukan oleh perangkat/operator desa).

Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.

Hormat kami,
Kepala Desa Pinangsari


( ${kepalaDesa} )
NIP / NIAP. ............................`;
  }, [kepalaDesa, nomorSurat, normalizedDomain]);

  const nginxConfig = useMemo(() => {
    return `server {
    listen 80;
    listen [::]:80;
    server_name ${normalizedDomain} www.${normalizedDomain};

    # Batas unggah dokumen layanan warga & foto berita
    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
  }, [normalizedDomain]);

  const envConfig = useMemo(() => {
    return `NODE_ENV="production"
PORT="3000"
APP_URL="https://${normalizedDomain}"
SESSION_SECRET="ganti_dengan_string_acak_minimal_64_karakter_unik"`;
  }, [normalizedDomain]);

  const dnsCopyBundle = useMemo(() => {
    return dnsRecords
      .map((r) => `${r.type}\t${r.host}\t${r.value}\tTTL=${r.ttl}`)
      .join('\n');
  }, [dnsRecords]);

  const downloadDraft = () => {
    const blob = new Blob([letterDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surat-permohonan-${normalizedDomain}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Draft surat permohonan diunduh (.txt).');
  };

  return (
    <AdminLayout title="Panduan Domain Resmi (.desa.id) & DNS">
      <div className="space-y-6">
        {/* Hero Intro */}
        <section className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-900 via-emerald-900 to-emerald-950 text-white p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                <Globe className="w-4 h-4" />
                Panduan Aktivasi Portal Resmi Pemerintah Desa
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold">
                Mengaktifkan Domain Resmi <span className="text-amber-300 font-mono">.desa.id</span> untuk Desa Pinangsari
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Domain <span className="font-mono font-semibold text-white">.desa.id</span> adalah domain resmi Pemerintah Desa di Indonesia yang dikelola oleh PANDI bersama Kementerian Komunikasi dan Digital (Kemkomdigi). Ikuti langkah di bawah ini untuk membeli/mendaftarkan domain, mengarahkan DNS record ke server hosting, serta mengaktifkan HTTPS agar portal ini siap digunakan sebagai website resmi desa.
              </p>
            </div>
            <div className="bg-emerald-950/70 border border-emerald-700/60 rounded-xl p-4 shrink-0 min-w-[220px]">
              <div className="text-xs text-emerald-200">Progres Persiapan Portal Resmi</div>
              <div className="text-2xl font-display font-bold text-amber-300 mt-1 tabular-nums">
                {completedIds.length} / {CHECKLIST_ITEMS.length} ({progressPct}%)
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-900 mt-2 overflow-hidden">
                <div
                  className={`h-full bg-amber-400 transition-all duration-300 ${
                    PROGRESS_WIDTH_CLASSES[completedIds.length] || 'w-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Checklist */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Checklist Peluncuran Portal Resmi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centang setiap langkah yang sudah selesai dikerjakan (tersimpan otomatis di browser Anda).
              </p>
            </div>
            <button
              type="button"
              onClick={resetChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Checklist
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CHECKLIST_ITEMS.map((item) => {
              const checked = completedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCheck(item.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <div className="text-xs sm:text-sm space-y-0.5">
                    <span className="inline-block font-semibold text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      {item.phase}
                    </span>
                    <div
                      className={
                        checked
                          ? 'line-through text-slate-500 dark:text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }
                    >
                      {item.label}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* Step 1: Dokumen & Draft Surat Permohonan */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h3 className="text-lg font-display font-bold">Siapkan Persyaratan Dokumen Resmi (.desa.id)</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Karena <span className="font-mono font-semibold">.desa.id</span> merupakan domain khusus instansi pemerintahan desa, registrar resmi PANDI mewajibkan verifikasi dokumen berikut sebelum domain diaktifkan:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Dokumen Wajib Unggah (Format PDF / JPG)
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li><strong>e-KTP Pemohon</strong> (Kepala Desa atau Perangkat Desa yang ditugaskan).</li>
                <li><strong>SK Pengangkatan Kepala Desa</strong> Desa Pinangsari yang masih berlaku (diterbitkan Bupati Subang).</li>
                <li><strong>Surat Permohonan Pendaftaran Domain</strong> memakai kop surat resmi Pemerintah Desa, ditandatangani Kepala Desa, dan dibubuhi stempel basah desa.</li>
                <li><strong>SK Perangkat Desa / Surat Kuasa</strong> (wajib dilampirkan jika pengajuan dilakukan oleh Sekretaris Desa atau Operator IT).</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
              <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Aturan Penamaan Domain .desa.id
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-amber-950 dark:text-amber-200/90">
                <li>Nama domain harus sesuai dengan nama resmi desa pada wilayah administratif (contoh utama: <code className="font-mono font-semibold">pinangsari.desa.id</code>).</li>
                <li>Apabila terdapat desa lain di Indonesia dengan nama yang sama dan domain tersebut sudah terdaftar, gunakan pembeda kecamatan/kabupaten seperti <code className="font-mono font-semibold">pinangsari-ciasem.desa.id</code> atau <code className="font-mono font-semibold">pinangsari-subang.desa.id</code>.</li>
                <li>Dilarang menggunakan singkatan tidak resmi atau nama komersial.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Letter Generator */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Template Draft Surat Permohonan Domain Resmi (Desa Pinangsari)
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(letterDraft, 'Draft surat permohonan')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  Salin Draft Surat
                </button>
                <button
                  type="button"
                  onClick={downloadDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh (.txt)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor="guide-kades" className="block mb-1 font-medium text-slate-700 dark:text-slate-300">
                  Nama Kepala Desa (untuk isi surat)
                </label>
                <input
                  id="guide-kades"
                  value={kepalaDesa}
                  onChange={(e) => setKepalaDesa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label htmlFor="guide-nosurat" className="block mb-1 font-medium text-slate-700 dark:text-slate-300">
                  Nomor Surat Desa
                </label>
                <input
                  id="guide-nosurat"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {letterDraft}
            </pre>
          </div>
        </section>

        {/* Step 2: Cara Pembelian & Pendaftaran Domain */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h3 className="text-lg font-display font-bold">Cara Membeli & Mendaftarkan Domain .desa.id</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Pilih salah satu dari dua jalur resmi berikut untuk mendaftarkan domain Desa Pinangsari:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2.5">
              <div className="font-bold text-emerald-900 dark:text-emerald-400">
                Jalur A — Registrar Resmi Terakreditasi PANDI (Mandiri & Cepat)
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li>Pilih registrar resmi mitra PANDI (seperti Niagahoster, Rumahweb, Qwords, Biznet Gio, IDCloudHost, atau Domainesia).</li>
                <li>Gunakan fitur <strong>Cek Domain</strong> untuk memeriksa ketersediaan <code className="font-mono">{normalizedDomain}</code>.</li>
                <li>Lakukan pemesanan (durasi 1–5 tahun; biaya tahunan resmi domain <code className="font-mono">.desa.id</code> berkisar Rp55.000–Rp100.000/tahun) menggunakan email resmi desa (bukan email pribadi agar aset tetap milik Pemerintah Desa).</li>
                <li>Selesaikan pembayaran dan masuk ke menu <strong>Verifikasi Dokumen Domain</strong> pada dashboard registrar untuk mengunggah KTP, SK Kepala Desa, dan Surat Permohonan.</li>
                <li>Tunggu proses verifikasi PANDI (1–3 hari kerja) hingga status berubah menjadi <strong>Active</strong>.</li>
              </ol>
              <a
                href="https://pandi.id/registrar/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline pt-1"
              >
                Lihat Daftar Registrar Resmi PANDI
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2.5">
              <div className="font-bold text-emerald-900 dark:text-emerald-400">
                Jalur B — Fasilitasi Diskominfo Kab. Subang / Portal domain.go.id
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li>Ajukan surat permohonan resmi ke <strong>Dinas Komunikasi dan Informatika (Diskominfo) Kabupaten Subang</strong> atau daftar melalui portal pendaftaran instansi pemerintah Kemkomdigi (<code className="font-mono">domain.go.id</code>).</li>
                <li>Diskominfo umumnya membantu memberikan rekomendasi atau sinkronisasi integrasi portal desa ke jaringan pemerintahan daerah Kabupaten Subang.</li>
                <li>Jika infrastruktur server menggunakan layanan cloud mandiri desa, minta akses <strong>DNS Management / Delegation</strong> agar admin dapat mengarahkan record DNS ke server hosting aplikasi ini.</li>
              </ol>
              <a
                href="https://domain.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline pt-1"
              >
                Portal Domain Instansi Pemerintah (domain.go.id)
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Step 3 & 4: Interactive DNS Configurator */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h3 className="text-lg font-display font-bold">Mengarahkan DNS Records ke Server Hosting</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Setelah domain aktif, buka menu <strong>DNS Management / Zone Editor</strong> di panel registrar (atau Cloudflare), lalu masukkan data server Anda di bawah ini untuk menghasilkan tabel DNS siap salin.
              </p>
            </div>
          </div>

          {/* Hosting Mode Switch & Inputs */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
                Jenis Server Hosting:
              </span>
              <button
                type="button"
                onClick={() => setHostingMode('vps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  hostingMode === 'vps'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                VPS / Server Mandiri (Ubuntu + Nginx)
              </button>
              <button
                type="button"
                onClick={() => setHostingMode('cloudrun')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  hostingMode === 'cloudrun'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Google Cloud Run (Custom Domain)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label htmlFor="dns-domain-input" className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nama Domain Resmi Desa (.desa.id)
                </label>
                <input
                  id="dns-domain-input"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="pinangsari.desa.id"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
                />
                <div className="mt-1 text-xs">
                  {domainValid ? (
                    <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Format domain .desa.id valid
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      Gunakan format resmi berakhiran .desa.id (contoh: pinangsari.desa.id)
                    </span>
                  )}
                </div>
              </div>

              {hostingMode === 'vps' && (
                <div>
                  <label htmlFor="dns-ip-input" className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    Alamat IP Publik IPv4 Server VPS
                  </label>
                  <input
                    id="dns-ip-input"
                    value={serverIpInput}
                    onChange={(e) => setServerIpInput(e.target.value)}
                    placeholder="203.0.113.10"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
                  />
                  <div className="mt-1 text-xs">
                    {ipValid ? (
                      <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Format IPv4 valid (ganti 203.0.113.10 dengan IP asli server Anda)
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        Masukkan IPv4 yang valid (contoh: 103.150.10.25)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DNS Table */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Daftar DNS Record untuk <span className="font-mono text-emerald-800 dark:text-emerald-400">{normalizedDomain}</span>
              </div>
              <button
                type="button"
                onClick={() => copyText(dnsCopyBundle, 'Daftar DNS record')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                Salin Semua Record
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Host / Name</th>
                    <th className="px-4 py-3">Value / Target</th>
                    <th className="px-4 py-3">TTL</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-right">Salin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {dnsRecords.map((rec, idx) => (
                    <tr key={`${rec.type}-${rec.host}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800 dark:text-emerald-400">{rec.type}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{rec.host}</td>
                      <td className="px-4 py-3 font-mono text-xs break-all">{rec.value}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{rec.ttl}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{rec.purpose}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => copyText(rec.value, `Value ${rec.type} (${rec.host})`)}
                          aria-label={`Salin value ${rec.type} untuk host ${rec.host}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <ClipboardCopy className="w-3 h-3" />
                          Salin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div>
                <strong>Cara Cek Propagasi DNS:</strong> Setelah record disimpan, tunggu 15 menit – 24 jam lalu jalankan perintah di terminal/CMD:
              </div>
              <code className="block font-mono text-slate-900 dark:text-slate-200 pt-1">
                nslookup {normalizedDomain} &nbsp;&nbsp;|&nbsp;&nbsp; dig +short A {normalizedDomain}
              </code>
            </div>
          </div>
        </section>

        {/* Step 4: Reverse Proxy & HTTPS SSL */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h3 className="text-lg font-display font-bold">Konfigurasi Server Produksi, Reverse Proxy (Nginx), & SSL HTTPS</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Portal pemerintah wajib menggunakan <strong>HTTPS</strong> untuk melindungi data NIK, Kartu Keluarga, lampiran warga, dan sesi login admin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  1. Variabel Environment Produksi (.env)
                </div>
                <button
                  type="button"
                  onClick={() => copyText(envConfig, 'Konfigurasi .env')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ClipboardCopy className="w-3 h-3" /> Salin
                </button>
              </div>
              <pre className="p-3.5 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed">
                {envConfig}
              </pre>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Jalankan build & daemon di server menggunakan PM2: <code className="font-mono">npm run build && pm2 start "npm start" --name desa-pinangsari</code>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  2. Nginx VirtualHost (/etc/nginx/sites-available/{normalizedDomain})
                </div>
                <button
                  type="button"
                  onClick={() => copyText(nginxConfig, 'Konfigurasi Nginx')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ClipboardCopy className="w-3 h-3" /> Salin
                </button>
              </div>
              <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                {nginxConfig}
              </pre>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pasang SSL gratis Let’s Encrypt: <code className="font-mono">sudo certbot --nginx -d {normalizedDomain} -d www.{normalizedDomain}</code>
              </p>
            </div>
          </div>
        </section>

        {/* Step 5: Final Hardening */}
        <section className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1.5 text-slate-800 dark:text-slate-200">
            <div className="font-bold text-emerald-950 dark:text-emerald-300">
              Langkah Terakhir Sebelum Publikasi Resmi ke Masyarakat
            </div>
            <p>
              Setelah <code className="font-mono font-semibold">https://{normalizedDomain}</code> dapat diakses normal, segera ubah seluruh kata sandi akun admin melalui menu <strong>Pengguna</strong>, lengkapi data resmi desa serta titik Google Maps Kantor Desa di menu <strong>Pengaturan</strong>, dan jadwalkan pengunduhan cadangan database secara berkala.
            </p>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
