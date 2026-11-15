import { ArrowRight, Bell, Building2, Calendar, Compass, Edit3, FileText, MapPin, Store } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/villageLogic';
import { SafeImage } from '../../components/SafeImage';
import { SkeletonGrid } from '../../components/UiPrimitives';

export function HomePage() {
  const { navigate, bootstrap, loadingBootstrap, user } = useApp();
  const { stats, pengumumanPenting, beritaTerbaru, agendaTerdekat, potensiUnggulan } = bootstrap;
  const canEditBerita = Boolean(user && hasPermission(user.role, 'berita', 'write'));

  const statItems = [
    { label: 'Jumlah Penduduk', value: stats ? stats.jumlahPenduduk.toLocaleString('id-ID') : '0' },
    { label: 'Jumlah Kepala Keluarga', value: stats ? stats.jumlahKK.toLocaleString('id-ID') : '0' },
    { label: 'Laki-laki', value: stats ? stats.lakiLaki.toLocaleString('id-ID') : '0' },
    { label: 'Perempuan', value: stats ? stats.perempuan.toLocaleString('id-ID') : '0' },
    { label: 'Jumlah RT', value: stats ? stats.jumlahRT.toLocaleString('id-ID') : '0' },
    { label: 'Jumlah RW', value: stats ? stats.jumlahRW.toLocaleString('id-ID') : '0' },
    { label: 'Jumlah Dusun', value: stats ? stats.jumlahDusun.toLocaleString('id-ID') : '0' },
    { label: 'Jumlah UMKM', value: stats ? stats.jumlahUMKM.toLocaleString('id-ID') : '0' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_desa_pinangsari_1794758501699.jpg"
            alt="Pemandangan pedesaan dan persawahan Desa Pinangsari"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/92 via-emerald-950/75 to-emerald-950/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-semibold tracking-wider text-amber-300">
              Portal Resmi Pemerintah Desa
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-tight [text-wrap:balance]">
              SELAMAT DATANG DI DESA PINANGSARI
            </h1>
            <p className="mt-4 text-base sm:text-lg text-emerald-50/95 leading-relaxed">
              Pusat Informasi dan Pelayanan Digital Masyarakat Desa Pinangsari
            </p>

            <div className="mt-6 flex items-start gap-2.5 text-sm text-emerald-100/90">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-1" aria-hidden="true" />
              <p className="leading-relaxed">
                Dusun Wanasari RT.003/RW.003 · Desa Pinangsari · Kecamatan Ciasem · Kabupaten Subang · Jawa Barat
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/pelayanan')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
              >
                Pelayanan Desa
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/profil')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors whitespace-nowrap shrink-0"
              >
                Profil Desa
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Important Announcement Banner */}
      {pengumumanPenting.length > 0 && (
        <section className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="text-sm text-amber-950 dark:text-amber-100">
                <span className="font-semibold">Pengumuman Penting:</span>{' '}
                <span>{pengumumanPenting[0].judul}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pengumuman')}
              className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap shrink-0 text-left sm:text-right"
            >
              Lihat Semua Pengumuman
            </button>
          </div>
        </section>
      )}

      {/* Statistik Desa */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
              Statistik Desa Pinangsari
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Ringkasan data kependudukan, wilayah administratif, dan usaha masyarakat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/statistik')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
          >
            Lihat Grafik Statistik Lengkap
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-emerald-900 dark:text-emerald-400 tabular-nums">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access Menu */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <FileText className="w-6 h-6 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-display font-semibold text-slate-900 dark:text-slate-100">
                Pelayanan Surat Online
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ajukan Surat Keterangan Domisili, Usaha, Tidak Mampu, Kelahiran, hingga Pengantar SKCK dan pantau status pengajuan secara daring.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pelayanan')}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline w-fit"
            >
              Ajukan Layanan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <Building2 className="w-6 h-6 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-display font-semibold text-slate-900 dark:text-slate-100">
                Profil & Pemerintahan Desa
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Kenali sejarah, visi misi, batas wilayah, dan susunan organisasi perangkat Pemerintah Desa Pinangsari.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pemerintahan')}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline w-fit"
            >
              Struktur Pemerintahan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <Compass className="w-6 h-6 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-display font-semibold text-slate-900 dark:text-slate-100">
                Potensi & Ekonomi Desa
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Jelajahi sektor pertanian, perdagangan, kerajinan, serta produk unggulan UMKM masyarakat Desa Pinangsari.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/potensi')}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline w-fit"
            >
              Jelajahi Potensi
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Berita Terbaru */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
              Berita & Informasi Terkini
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Kabar kegiatan pemerintahan, pembangunan, dan masyarakat Desa Pinangsari.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {canEditBerita && (
              <button
                type="button"
                onClick={() => navigate('/admin/berita')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-700/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                Kelola & Edit Berita
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/berita')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              Semua Berita
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {loadingBootstrap ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {beritaTerbaru.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <SafeImage src={item.gambar_url} alt={item.judul} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.kategori_nama}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{item.tanggal_publikasi}</span>
                  </div>
                  <h3 className="mt-2 text-base font-display font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                    <button
                      type="button"
                      onClick={() => navigate(`/berita/${item.slug}`)}
                      className="text-left hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
                    >
                      {item.judul}
                    </button>
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
                    {item.ringkasan}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/berita/${item.slug}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline w-fit"
                    >
                      Baca Selengkapnya
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    {canEditBerita && (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/berita?edit=${item.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        <Edit3 className="w-3 h-3" aria-hidden="true" />
                        Edit & Foto
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Agenda & Potensi Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agenda */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
                  Agenda Kegiatan Desa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/agenda')}
                className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
              >
                Lihat Kalender
              </button>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {agendaTerdekat.map((ag) => (
                <div key={ag.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {ag.tanggal} · {ag.waktu}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ag.nama_kegiatan}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Lokasi: {ag.lokasi} · Penanggung jawab: {ag.penanggung_jawab}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potensi */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
                  Potensi Unggulan Desa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/potensi')}
                className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
              >
                Semua Potensi
              </button>
            </div>
            <div className="space-y-4">
              {potensiUnggulan.map((pt) => (
                <div
                  key={pt.id}
                  className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0"
                >
                  <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <SafeImage src={pt.foto_url} alt={pt.nama} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {pt.kategori} · {pt.lokasi}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {pt.nama}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{pt.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
