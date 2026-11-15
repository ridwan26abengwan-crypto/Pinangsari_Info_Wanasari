import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import type { ActivityLog, Pelayanan, StatistikSummary } from '../../types/village';
import { DistributionBarChart, GenderPieChart, ServiceTrendLineChart } from '../../components/VillageCharts';
import { AdminLayout } from './AdminLayout';
import { SkeletonGrid } from '../../components/UiPrimitives';

interface DashboardData {
  stats: StatistikSummary;
  counts: {
    totalBerita: number;
    totalPengumuman: number;
    totalPelayanan: number;
    pelayananBaru: number;
    pesanBaru: number;
    totalAgenda: number;
    totalPotensi: number;
  };
  recentPelayanan: Pelayanan[];
  recentLogs: ActivityLog[];
  pelayananTrend: Array<{ bulan: string; total: number }>;
}

export function AdminDashboardPage() {
  const { navigate } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardData>('/api/admin/dashboard')
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard Desa Pinangsari">
      {loading || !data ? (
        <SkeletonGrid count={3} />
      ) : (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Total Penduduk', value: data.stats.jumlahPenduduk },
              { label: 'Total KK', value: data.stats.jumlahKK },
              { label: 'Berita', value: data.counts.totalBerita },
              { label: 'Pengumuman', value: data.counts.totalPengumuman },
              { label: 'Pengajuan Layanan', value: data.counts.totalPelayanan },
              { label: 'Agenda', value: data.counts.totalAgenda },
              { label: 'Potensi Desa', value: data.counts.totalPotensi },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">{card.label}</div>
                <div className="mt-1.5 text-2xl font-display font-bold text-emerald-900 dark:text-emerald-400 tabular-nums">
                  {card.value.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100 mb-3">
                Komposisi Jenis Kelamin
              </h2>
              <GenderPieChart lakiLaki={data.stats.lakiLaki} perempuan={data.stats.perempuan} />
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100 mb-3">
                Statistik Pekerjaan Penduduk
              </h2>
              <DistributionBarChart dataMap={data.stats.pekerjaan} label="Penduduk" barColor="#15803d" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100 mb-3">
              Tren Pengajuan Pelayanan Desa
            </h2>
            <ServiceTrendLineChart items={data.pelayananTrend} />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                  Pengajuan Pelayanan Terbaru
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/admin/pelayanan')}
                  className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
                >
                  Kelola Semua
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                      <th className="pb-2">Nomor</th>
                      <th className="pb-2">Pemohon</th>
                      <th className="pb-2">Layanan</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.recentPelayanan.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-mono text-xs tabular-nums">{p.nomor_pengajuan}</td>
                        <td className="py-2.5">{p.nama_pemohon}</td>
                        <td className="py-2.5 text-xs text-slate-600 dark:text-slate-400">{p.jenis_layanan_nama}</td>
                        <td className="py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100 mb-4">
                Log Aktivitas Admin Terbaru
              </h2>
              <div className="space-y-3">
                {data.recentLogs.map((log) => (
                  <div key={log.id} className="text-xs border-b border-slate-200 dark:border-slate-800 pb-2.5 last:border-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.username} · {log.aksi} ({log.modul})
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">{log.detail}</div>
                    <div className="text-slate-400 font-mono mt-0.5 tabular-nums">{log.created_at}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
