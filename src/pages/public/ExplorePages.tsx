import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List, Mail, MapPin, Phone, X } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import type { AgendaDesa, GaleriItem, PotensiDesa } from '../../types/village';
import { SafeImage } from '../../components/SafeImage';
import { VillageMap } from '../../components/VillageMap';
import { Breadcrumb, EmptyState, SkeletonGrid, useToast } from '../../components/UiPrimitives';

// ============================================================================
// POTENSI DESA PAGE
// ============================================================================

export function PotensiPage() {
  const [items, setItems] = useState<PotensiDesa[]>([]);
  const [kategori, setKategori] = useState('Semua');
  const [loading, setLoading] = useState(true);

  const categories = ['Semua', 'Pertanian', 'Peternakan', 'Perikanan', 'UMKM', 'Kerajinan', 'Perdagangan', 'Wisata', 'Produk unggulan'];

  useEffect(() => {
    setLoading(true);
    const q = kategori === 'Semua' ? '' : `?kategori=${encodeURIComponent(kategori)}`;
    apiGet<{ items: PotensiDesa[] }>(`/api/public/potensi${q}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [kategori]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Potensi Desa' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Potensi Desa Pinangsari
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sektor unggulan pertanian, peternakan, perikanan, kerajinan, dan UMKM masyarakat Desa Pinangsari.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setKategori(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              kategori === c
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid count={3} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada potensi pada kategori ini" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                <SafeImage src={item.foto_url} alt={item.nama} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.kategori}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{item.lokasi}</span>
                </div>
                <h2 className="mt-2 text-lg font-display font-semibold text-slate-900 dark:text-slate-100">
                  {item.nama}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                  {item.deskripsi}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  Kontak: {item.kontak || 'Data belum tersedia'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AGENDA DESA PAGE (CALENDAR + LIST)
// ============================================================================

export function AgendaPage() {
  const [items, setItems] = useState<AgendaDesa[]>([]);
  const [viewMode, setViewMode] = useState<'daftar' | 'kalender'>('daftar');
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    apiGet<{ items: AgendaDesa[] }>('/api/public/agenda')
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const monthLabel = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Agenda Desa' }]} />
          <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
            Agenda Kegiatan Desa Pinangsari
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Jadwal musyawarah, pelayanan kemasyarakatan, posyandu, dan gotong royong warga.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setViewMode('daftar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'daftar' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Daftar Agenda
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kalender')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'kalender' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Tampilan Kalender
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={3} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada agenda kegiatan" />
      ) : viewMode === 'daftar' ? (
        <div className="space-y-4">
          {items.map((ag) => (
            <div
              key={ag.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>{ag.tanggal}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{ag.waktu}</span>
                  <span aria-hidden="true"> · </span>
                  <span>Status: {ag.status}</span>
                </div>
                <h2 className="mt-1.5 text-lg font-display font-bold text-slate-900 dark:text-slate-100">
                  {ag.nama_kegiatan}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{ag.deskripsi}</p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Lokasi: {ag.lokasi} · Penanggung jawab: {ag.penanggung_jawab}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100 capitalize">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 pb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[84px] rounded-lg bg-slate-50/50 dark:bg-slate-950/40" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = items.filter((i) => i.tanggal === dateStr);
              return (
                <div
                  key={dateStr}
                  className="min-h-[84px] rounded-lg border border-slate-200 dark:border-slate-800 p-2 flex flex-col"
                >
                  <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        title={`${ev.nama_kegiatan} (${ev.waktu} - ${ev.lokasi})`}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-800 text-white truncate"
                      >
                        {ev.nama_kegiatan}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GALERI FOTO PAGE (GRID + LIGHTBOX)
// ============================================================================

export function GaleriPage() {
  const [items, setItems] = useState<GaleriItem[]>([]);
  const [kategori, setKategori] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const categories = [
    'Semua',
    'Kegiatan Pemerintah Desa',
    'Gotong Royong',
    'Posyandu',
    'PKK',
    'Karang Taruna',
    'Keagamaan',
    'Pembangunan',
    'Kegiatan masyarakat',
  ];

  useEffect(() => {
    setLoading(true);
    const q = kategori === 'Semua' ? '' : `?kategori=${encodeURIComponent(kategori)}`;
    apiGet<{ items: GaleriItem[] }>(`/api/public/galeri${q}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [kategori]);

  const activePhoto = lightboxIdx !== null ? items[lightboxIdx] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Galeri Foto' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Galeri Kegiatan Desa Pinangsari
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Dokumentasi kegiatan pemerintahan, gotong royong, PKK, posyandu, karang taruna, dan pembangunan desa.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setKategori(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              kategori === c
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid count={4} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada dokumentasi pada kategori ini" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden group hover:border-emerald-700 transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <SafeImage
                  src={item.gambar_url}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.kategori} · <span className="tabular-nums">{item.tanggal}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {item.judul}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.judul}
        >
          <button
            type="button"
            aria-label="Tutup lightbox"
            onClick={() => setLightboxIdx(null)}
            className="absolute top-5 right-5 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            aria-label="Foto sebelumnya"
            onClick={() => setLightboxIdx((i) => (i !== null ? (i - 1 + items.length) % items.length : 0))}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white mr-3"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <div className="max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
              <SafeImage src={activePhoto.gambar_url} alt={activePhoto.judul} className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="p-4 text-white">
              <div className="text-xs text-emerald-300">
                {activePhoto.kategori} · {activePhoto.tanggal}
              </div>
              <h3 className="mt-1 text-base font-semibold">{activePhoto.judul}</h3>
              {activePhoto.keterangan && <p className="mt-1 text-sm text-slate-300">{activePhoto.keterangan}</p>}
            </div>
          </div>

          <button
            type="button"
            aria-label="Foto berikutnya"
            onClick={() => setLightboxIdx((i) => (i !== null ? (i + 1) % items.length : 0))}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white ml-3"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// KONTAK & PETA DESA + PESAN MASYARAKAT PAGE
// ============================================================================

export function KontakPage() {
  const { bootstrap } = useApp();
  const { showToast } = useToast();
  const pengaturan = bootstrap.pengaturan;

  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [subjek, setSubjek] = useState('');
  const [pesan, setPesan] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiPost('/api/public/pesan', { nama, no_hp: noHp, email, subjek, pesan });
      showToast('Pesan Anda telah terkirim ke Pemerintah Desa Pinangsari.');
      setNama('');
      setNoHp('');
      setEmail('');
      setSubjek('');
      setPesan('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim pesan', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <Breadcrumb items={[{ label: 'Kontak & Peta Desa' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Hubungi Desa Pinangsari
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Informasi lokasi kantor desa, kontak layanan, jam operasional, dan penyampaian aspirasi masyarakat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Info & Map */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
              Alamat & Kontak Resmi
            </h2>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Kantor Desa Pinangsari</div>
                  <div>
                    Dusun Wanasari RT.003/RW.003, Desa Pinangsari, Kecamatan Ciasem, Kabupaten Subang, Jawa Barat
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <div>
                  Telepon: <strong>{pengaturan?.telepon || 'Data belum tersedia'}</strong> · WhatsApp:{' '}
                  <strong>{pengaturan?.whatsapp || 'Data belum tersedia'}</strong>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <div>
                  Email: <strong>{pengaturan?.email || 'Data belum tersedia'}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Jam Pelayanan: {pengaturan?.jam_pelayanan || 'Data belum tersedia'}
              </div>
            </div>
          </div>

          <VillageMap
            apiKey={bootstrap.mapsApiKey}
            latitude={pengaturan?.latitude || ''}
            longitude={pengaturan?.longitude || ''}
            zoom={pengaturan?.map_zoom || 15}
            title="Kantor Desa Pinangsari"
            address={pengaturan?.alamat_lengkap}
          />
        </div>

        {/* Form Pesan Masyarakat */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4"
          >
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
              Pesan & Aspirasi Masyarakat
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Kirimkan pertanyaan, saran, atau pengaduan kepada Pemerintah Desa Pinangsari.
            </p>

            <div>
              <label htmlFor="pesan_nama" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap *
              </label>
              <input
                id="pesan_nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pesan_hp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor HP *
                </label>
                <input
                  id="pesan_hp"
                  type="tel"
                  required
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label htmlFor="pesan_email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email (Opsional)
                </label>
                <input
                  id="pesan_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pesan_subjek" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Subjek *
              </label>
              <input
                id="pesan_subjek"
                type="text"
                required
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label htmlFor="pesan_isi" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Pesan *
              </label>
              <textarea
                id="pesan_isi"
                required
                rows={4}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              {sending ? 'Mengirim...' : 'Kirim Pesan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 404 PAGE
// ============================================================================

export function NotFoundPage() {
  const { navigate } = useApp();
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
      <div className="text-5xl font-display font-bold text-emerald-900 dark:text-emerald-400 tabular-nums">404</div>
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Maaf, halaman yang Anda tuju tidak tersedia di Portal Sistem Informasi Desa Pinangsari.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
      >
        Kembali ke Beranda
      </button>
    </div>
  );
}
