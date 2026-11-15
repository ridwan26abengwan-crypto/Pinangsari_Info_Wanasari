import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import type { StatistikSummary } from '../../types/village';
import { DistributionBarChart, GenderPieChart, ServiceTrendLineChart } from '../../components/VillageCharts';
import { Breadcrumb, SkeletonGrid } from '../../components/UiPrimitives';

interface StatistikResponse {
  stats: StatistikSummary;
  byDusun: Array<{ dusun: string; total: number }>;
  pelayananBulanan: Array<{ bulan: string; total: number }>;
}

export function StatistikPage() {
  const [data, setData] = useState<StatistikResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<StatistikResponse>('/api/public/statistik')
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Statistik Desa' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Statistik & Data Desa Pinangsari
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Agregasi data kependudukan, pendidikan, dan mata pencaharian masyarakat (data pribadi warga dilindungi dan tidak ditampilkan ke publik).
        </p>
      </div>

      {loading || !stats ? (
        <SkeletonGrid count={3} />
      ) : (
        <div className="space-y-8">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Penduduk', val: stats.jumlahPenduduk },
              { label: 'Laki-laki', val: stats.lakiLaki },
              { label: 'Perempuan', val: stats.perempuan },
              { label: 'Kepala Keluarga', val: stats.jumlahKK },
              { label: 'Dusun / RW / RT', val: `${stats.jumlahDusun} / ${stats.jumlahRW} / ${stats.jumlahRT}` },
              { label: 'UMKM Aktif', val: stats.jumlahUMKM },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">{k.label}</div>
                <div className="mt-1.5 text-2xl font-display font-bold text-emerald-900 dark:text-emerald-400 tabular-nums">
                  {typeof k.val === 'number' ? k.val.toLocaleString('id-ID') : k.val}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100 mb-4">
                Statistik Penduduk (Jenis Kelamin)
              </h2>
              <GenderPieChart lakiLaki={stats.lakiLaki} perempuan={stats.perempuan} />
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100 mb-4">
                Statistik Tingkat Pendidikan
              </h2>
              <DistributionBarChart dataMap={stats.pendidikan} label="Jumlah Penduduk" barColor="#14532d" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100 mb-4">
                Statistik Mata Pencaharian / Pekerjaan
              </h2>
              <DistributionBarChart dataMap={stats.pekerjaan} label="Jumlah Penduduk" barColor="#b45309" />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100 mb-4">
                Tren Pengajuan Pelayanan Online
              </h2>
              <ServiceTrendLineChart items={data.pelayananBulanan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
