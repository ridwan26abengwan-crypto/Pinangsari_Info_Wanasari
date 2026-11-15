import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, FileCheck2, Search, Upload, XCircle } from 'lucide-react';
import { apiGet, apiUploadForm } from '../../lib/api';
import type { JenisPelayanan, PelayananStatus } from '../../types/village';
import { Breadcrumb, useToast } from '../../components/UiPrimitives';

interface TrackingResult {
  nomor_pengajuan: string;
  nama_pemohon: string;
  nik_masked: string;
  kk_masked: string;
  jenis_layanan_nama: string;
  status: PelayananStatus;
  catatan_admin: string;
  created_at: string;
  updated_at: string;
}

const STEPS: PelayananStatus[] = ['Diajukan', 'Diverifikasi', 'Diproses', 'Selesai'];

export function PelayananPage() {
  const { showToast } = useToast();
  const [services, setServices] = useState<JenisPelayanan[]>([]);
  const [activeTab, setActiveTab] = useState<'ajukan' | 'cek'>('ajukan');

  // Application form state
  const [namaPemohon, setNamaPemohon] = useState('');
  const [nik, setNik] = useState('');
  const [noKk, setNoKk] = useState('');
  const [ttl, setTtl] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [jenisId, setJenisId] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [dokumen, setDokumen] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    nomor_pengajuan: string;
    jenis_layanan_nama: string;
    status: string;
  } | null>(null);

  // Status check state
  const [trackingQuery, setTrackingQuery] = useState('');
  const [checking, setChecking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    apiGet<{ jenisLayanan: JenisPelayanan[] }>('/api/public/layanan').then((res) => {
      setServices(res.jenisLayanan);
      if (res.jenisLayanan.length > 0) {
        setJenisId(String(res.jenisLayanan[0].id));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('nama_pemohon', namaPemohon);
      fd.append('nik', nik);
      fd.append('no_kk', noKk);
      fd.append('tempat_tanggal_lahir', ttl);
      fd.append('alamat', alamat);
      fd.append('no_hp', noHp);
      fd.append('jenis_layanan_id', jenisId);
      fd.append('keperluan', keperluan);
      if (dokumen) {
        fd.append('dokumen', dokumen);
      }
      const res = await apiUploadForm<{
        nomor_pengajuan: string;
        jenis_layanan_nama: string;
        status: string;
      }>('/api/public/pelayanan', fd);
      setSubmittedReceipt(res);
      setTrackingQuery(res.nomor_pengajuan);
      showToast(`Pengajuan berhasil dikirim dengan nomor ${res.nomor_pengajuan}`);
      setNamaPemohon('');
      setNik('');
      setNoKk('');
      setTtl('');
      setAlamat('');
      setNoHp('');
      setKeperluan('');
      setDokumen(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim pengajuan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = (customCode ?? trackingQuery).trim().toUpperCase();
    if (!code) {
      setTrackingError('Masukkan nomor pengajuan terlebih dahulu (misal: PSG-2026-00001).');
      return;
    }
    setChecking(true);
    setTrackingError('');
    setTrackingResult(null);
    try {
      const res = await apiGet<{ item: TrackingResult }>(`/api/public/pelayanan/cek/${encodeURIComponent(code)}`);
      setTrackingResult(res.item);
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : 'Nomor pengajuan tidak ditemukan.');
    } finally {
      setChecking(false);
    }
  };

  const selectedService = services.find((s) => String(s.id) === jenisId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Pelayanan Desa Online' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Pelayanan Administrasi Desa Online
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Ajukan permohonan surat keterangan masyarakat Desa Pinangsari secara daring dan pantau status pengajuan dengan nomor registrasi.
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('ajukan')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'ajukan'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Formulir Pengajuan Surat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cek')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'cek'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Cek Status Pengajuan
        </button>
      </div>

      {activeTab === 'ajukan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {submittedReceipt && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-display font-bold text-emerald-950 dark:text-emerald-100">
                      Pengajuan Berhasil Dikirim
                    </h2>
                    <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">
                      Simpan nomor pengajuan di bawah ini untuk memantau proses verifikasi oleh operator desa:
                    </p>
                    <div className="mt-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500">Nomor Pengajuan</div>
                        <div className="text-xl font-mono font-bold text-emerald-900 dark:text-emerald-400 tabular-nums">
                          {submittedReceipt.nomor_pengajuan}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {submittedReceipt.jenis_layanan_nama} · Status: {submittedReceipt.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('cek');
                          handleCheckStatus(undefined, submittedReceipt.nomor_pengajuan);
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-900"
                      >
                        Lacak Status Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5"
            >
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
                Data Pemohon & Jenis Layanan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nama_pemohon" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap Pemohon *
                  </label>
                  <input
                    id="nama_pemohon"
                    type="text"
                    required
                    value={namaPemohon}
                    onChange={(e) => setNamaPemohon(e.target.value)}
                    placeholder="Sesuai KTP"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="jenis_layanan_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Jenis Layanan Surat *
                  </label>
                  <select
                    id="jenis_layanan_id"
                    required
                    value={jenisId}
                    onChange={(e) => setJenisId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nik" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    NIK (16 Digit) *
                  </label>
                  <input
                    id="nik"
                    type="text"
                    required
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="Misal: 3213000000000001"
                    className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="no_kk" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor KK (16 Digit) *
                  </label>
                  <input
                    id="no_kk"
                    type="text"
                    required
                    maxLength={16}
                    value={noKk}
                    onChange={(e) => setNoKk(e.target.value.replace(/\D/g, ''))}
                    placeholder="Misal: 3213000000000001"
                    className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="ttl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tempat / Tanggal Lahir *
                  </label>
                  <input
                    id="ttl"
                    type="text"
                    required
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                    placeholder="Subang, 15-05-1990"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="no_hp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor HP / WhatsApp *
                  </label>
                  <input
                    id="no_hp"
                    type="tel"
                    required
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="alamat" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Lengkap (Dusun / RT / RW) *
                </label>
                <input
                  id="alamat"
                  type="text"
                  required
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Dusun Wanasari RT.003/RW.003, Desa Pinangsari"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="keperluan" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Keperluan Permohonan *
                </label>
                <textarea
                  id="keperluan"
                  required
                  rows={3}
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  placeholder="Jelaskan keperluan pengajuan surat..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="dokumen" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Dokumen Pendukung (Opsional — JPG, PNG, PDF, Maks 5MB)
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Upload className="w-5 h-5 text-emerald-800 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {dokumen ? dokumen.name : 'Pilih berkas KTP / KK / Surat Pengantar RT...'}
                  </span>
                  <input
                    id="dokumen"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setDokumen(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Pelayanan'}
              </button>
            </form>
          </div>

          {/* Persyaratan Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            {selectedService && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Persyaratan Layanan Terpilih
                </div>
                <h3 className="mt-1 text-lg font-display font-bold text-slate-900 dark:text-slate-100">
                  {selectedService.nama}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedService.persyaratan}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  Estimasi penyelesaian: <strong className="text-slate-800 dark:text-slate-200">{selectedService.estimasi_waktu}</strong>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Daftar 8 Layanan Administrasi
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {services.map((s, idx) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-emerald-800 dark:text-emerald-400 mt-0.5 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{s.nama}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : (
        /* Cek Status Pengajuan */
        <div className="max-w-3xl space-y-6">
          <form
            onSubmit={(e) => handleCheckStatus(e)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
              Lacak Status Pengajuan Surat
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Masukkan nomor pengajuan (misal: <code className="font-mono text-emerald-800 dark:text-emerald-400">PSG-2026-00001</code>).
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value.toUpperCase())}
                placeholder="Misal: PSG-2026-00001"
                aria-label="Nomor Pengajuan"
                className="flex-1 px-4 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <button
                type="submit"
                disabled={checking}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                {checking ? 'Memeriksa...' : 'Cek Status'}
              </button>
            </div>
            {trackingError && <p className="text-sm text-red-600 dark:text-red-400">{trackingError}</p>}
          </form>

          {trackingResult && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500">Nomor Pengajuan</div>
                  <div className="text-xl font-mono font-bold text-emerald-900 dark:text-emerald-400 tabular-nums">
                    {trackingResult.nomor_pengajuan}
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {trackingResult.jenis_layanan_nama}
                  </div>
                </div>
                <div className="text-left sm:text-right text-sm">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{trackingResult.nama_pemohon}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    NIK: {trackingResult.nik_masked} · KK: {trackingResult.kk_masked}
                  </div>
                </div>
              </div>

              {trackingResult.status === 'Ditolak' ? (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-red-900 dark:text-red-200">Status: Ditolak</div>
                    <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                      {trackingResult.catatan_admin || 'Terdapat ketidaksesuaian berkas. Silakan hubungi kantor desa.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STEPS.map((step, idx) => {
                    const activeIdx = STEPS.indexOf(trackingResult.status);
                    const done = idx <= activeIdx;
                    return (
                      <div
                        key={step}
                        className={`p-3.5 rounded-lg border text-center ${
                          done
                            ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <FileCheck2 className="w-5 h-5 mx-auto mb-1.5" aria-hidden="true" />
                        <div className="text-xs font-semibold">{step}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {trackingResult.catatan_admin && trackingResult.status !== 'Ditolak' && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200">Catatan Petugas:</strong>{' '}
                  {trackingResult.catatan_admin}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
