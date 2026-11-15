import { useEffect, useState } from 'react';
import { Building2, Compass, MapPin, Users } from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import type { PerangkatDesa, ProfilDesa } from '../../types/village';
import { SafeImage } from '../../components/SafeImage';
import { Breadcrumb, EmptyState, SkeletonGrid } from '../../components/UiPrimitives';

export function ProfilPage() {
  const { navigate, bootstrap } = useApp();
  const [profil, setProfil] = useState<ProfilDesa | null>(bootstrap.profil);
  const [perangkat, setPerangkat] = useState<PerangkatDesa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ profil: ProfilDesa; perangkat: PerangkatDesa[] }>('/api/public/profil')
      .then((res) => {
        setProfil(res.profil);
        setPerangkat(res.perangkat);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <Breadcrumb items={[{ label: 'Profil Desa' }]} />
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
              Profil Desa Pinangsari
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Dusun Wanasari RT.003/RW.003, Kecamatan Ciasem, Kabupaten Subang, Provinsi Jawa Barat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pemerintahan')}
            className="px-4 py-2 rounded-lg bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-900 transition-colors"
          >
            Lihat Struktur Pemerintahan
          </button>
        </div>
      </div>

      {loading && !profil ? (
        <SkeletonGrid count={3} />
      ) : !profil ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* Balai Desa & Informasi Umum */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <SafeImage
                src="/src/assets/images/balai_desa_pinangsari_1794758502248.jpg"
                alt="Balai Desa Pinangsari"
                className="w-full h-64 lg:h-full object-cover"
              />
            </div>

            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
                  Informasi Umum Desa
                </h2>
                <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Nama Desa</dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{profil.nama_desa}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Lokasi Kantor Desa</dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      Dusun {profil.dusun_kantor} RT.{profil.rt_kantor}/RW.{profil.rw_kantor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Kecamatan / Kabupaten</dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      Kec. {profil.kecamatan}, Kab. {profil.kabupaten}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Provinsi / Kode Pos</dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {profil.provinsi} · {profil.kode_pos || 'Data belum tersedia'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Luas Wilayah</dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {profil.luas_wilayah || 'Data belum tersedia'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Pembagian Wilayah</dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                      {profil.jumlah_dusun} Dusun · {profil.jumlah_rw} RW · {profil.jumlah_rt} RT
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Sejarah Desa */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">Sejarah Desa</h2>
            <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profil.sejarah || 'Data belum tersedia'}
            </p>
          </section>

          {/* Visi & Misi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
              <h2 className="text-xl font-display font-bold text-emerald-900 dark:text-emerald-400">Visi Desa</h2>
              <p className="mt-3 text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {profil.visi || 'Data belum tersedia'}
              </p>
            </section>
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
              <h2 className="text-xl font-display font-bold text-emerald-900 dark:text-emerald-400">Misi Desa</h2>
              <div className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profil.misi || 'Data belum tersedia'}
              </div>
            </section>
          </div>

          {/* Geografis & Batas Wilayah */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-400">
                <Compass className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-xl font-display font-bold">Letak Geografis & Kondisi Wilayah</h2>
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {profil.letak_geografis || 'Data belum tersedia'}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {profil.kondisi_wilayah || 'Data belum tersedia'}
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-400">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-xl font-display font-bold">Batas Wilayah Administratif</h2>
              </div>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Sebelah Utara</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{profil.batas_utara || 'Data belum tersedia'}</dd>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Sebelah Selatan</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{profil.batas_selatan || 'Data belum tersedia'}</dd>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Sebelah Timur</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{profil.batas_timur || 'Data belum tersedia'}</dd>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Sebelah Barat</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{profil.batas_barat || 'Data belum tersedia'}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Ringkasan Struktur Pemerintahan */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
                  Perangkat Pemerintahan Desa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pemerintahan')}
                className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
              >
                Lihat Bagan Lengkap
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {perangkat.slice(0, 4).map((p) => (
                <div key={p.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-xs font-medium text-emerald-800 dark:text-emerald-400">{p.jabatan}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{p.nama}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">NIP/NRPD: {p.nip_nrpd || 'Data belum tersedia'}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function PemerintahanPage() {
  const [items, setItems] = useState<PerangkatDesa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ items: PerangkatDesa[] }>('/api/public/perangkat')
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  const tiers = [
    { key: 'Kepala Desa', title: 'Kepala Desa' },
    { key: 'Sekretaris Desa', title: 'Sekretaris Desa' },
    { key: 'Kasi', title: 'Kepala Seksi (Kasi)' },
    { key: 'Kaur', title: 'Kepala Urusan (Kaur)' },
    { key: 'Kepala Dusun', title: 'Kepala Dusun' },
    { key: 'RW', title: 'Rukun Warga (RW)' },
    { key: 'RT', title: 'Rukun Tetangga (RT)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Pemerintahan Desa' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Struktur Pemerintahan Desa Pinangsari
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Susunan organisasi tata kelola pemerintahan dan kewilayahan Desa Pinangsari.
        </p>
      </div>

      {loading ? (
        <SkeletonGrid count={3} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {tiers.map((tier, tierIdx) => {
            const group = items.filter((i) => i.tingkatan.toLowerCase() === tier.key.toLowerCase());
            if (group.length === 0) return null;
            return (
              <div key={tier.key} className="space-y-3">
                {tierIdx > 0 && (
                  <div className="flex justify-center" aria-hidden="true">
                    <div className="w-px h-6 bg-emerald-700/40 dark:bg-emerald-500/40" />
                  </div>
                )}
                <div className="text-center">
                  <h2 className="text-xs font-semibold tracking-wider text-emerald-800 dark:text-emerald-400 uppercase">
                    {tier.title}
                  </h2>
                </div>
                <div
                  className={`grid gap-4 ${
                    group.length === 1
                      ? 'grid-cols-1 max-w-md mx-auto'
                      : group.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {group.map((person) => (
                    <div
                      key={person.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-start gap-4"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-emerald-950/10 dark:bg-emerald-900/30 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {person.foto_url ? (
                          <SafeImage src={person.foto_url} alt={person.nama} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-emerald-800 dark:text-emerald-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {person.jabatan}
                        </div>
                        <h3 className="mt-0.5 text-base font-display font-semibold text-slate-900 dark:text-slate-100">
                          {person.nama}
                        </h3>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          NIP/NRPD: {person.nip_nrpd || 'Data belum tersedia'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Masa Jabatan: {person.masa_jabatan || 'Data belum tersedia'}
                        </div>
                        {person.keterangan && (
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {person.keterangan}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
