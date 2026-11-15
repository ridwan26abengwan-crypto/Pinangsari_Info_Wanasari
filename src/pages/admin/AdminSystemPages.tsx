import React, { useCallback, useEffect, useState } from 'react';
import { Database, Download, FileSpreadsheet, FileText, Globe, Plus, Trash2 } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../../lib/api';
import { exportRowsToExcel, exportRowsToPdf } from '../../lib/exportUtils';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/villageLogic';
import type { ActivityLog, AdminRole, PengaturanDesa, PesanStatus, PesanWarga, UserAccount } from '../../types/village';
import { AdminLayout } from './AdminLayout';
import { VillageMap } from '../../components/VillageMap';
import { ConfirmModal, useToast } from '../../components/UiPrimitives';

// ============================================================================
// ADMIN PESAN WARGA
// ============================================================================

export function AdminPesanPage() {
  const { user } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'pesan', 'write') : false;

  const [items, setItems] = useState<PesanWarga[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PesanWarga | null>(null);

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: PesanWarga[] }>('/api/admin/pesan');
    setItems(res.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateStatus = async (id: number, status: PesanStatus) => {
    await apiPut(`/api/admin/pesan/${id}`, { status, catatan_tindak_lanjut: '' });
    showToast(`Status pesan diubah menjadi ${status}.`);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/pesan/${deleteTarget.id}`);
    showToast('Pesan dihapus.');
    setDeleteTarget(null);
    await loadData();
  };

  return (
    <AdminLayout title="Pesan Masyarakat">
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
            Belum ada pesan masyarakat yang masuk.
          </div>
        ) : (
          items.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{m.nama}</span>
                  <span className="text-xs text-slate-500 ml-2 font-mono">{m.no_hp}{m.email ? ` · ${m.email}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {canWrite ? (
                    <select
                      value={m.status}
                      aria-label={`Status pesan ${m.subjek}`}
                      onChange={(e) => updateStatus(m.id, e.target.value as PesanStatus)}
                      className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    >
                      {['Baru', 'Dibaca', 'Ditindaklanjuti', 'Selesai'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className="font-semibold">{m.status}</span>
                  )}
                  {canWrite && (
                    <button type="button" onClick={() => setDeleteTarget(m)} className="text-red-600 hover:underline">
                      Hapus
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">{m.subjek}</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{m.pesan}</p>
            </div>
          ))
        )}
      </div>
      <ConfirmModal open={Boolean(deleteTarget)} title="Hapus Pesan" description={`Hapus pesan dari ${deleteTarget?.nama}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN LAPORAN (PDF & EXCEL EXPORT)
// ============================================================================

const REPORT_TYPES = [
  { key: 'penduduk', label: 'Laporan Data Penduduk' },
  { key: 'keluarga', label: 'Laporan Data Kartu Keluarga (KK)' },
  { key: 'pelayanan', label: 'Laporan Pelayanan Desa' },
  { key: 'berita', label: 'Laporan Berita Desa' },
  { key: 'agenda', label: 'Laporan Agenda Kegiatan' },
  { key: 'potensi', label: 'Laporan Potensi Desa' },
];

export function AdminLaporanPage() {
  const [selectedType, setSelectedType] = useState('penduduk');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<{ rows: Record<string, unknown>[] }>(`/api/admin/laporan/${selectedType}`)
      .then((res) => setRows(res.rows))
      .finally(() => setLoading(false));
  }, [selectedType]);

  const activeLabel = REPORT_TYPES.find((r) => r.key === selectedType)?.label || 'Laporan';
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <AdminLayout title="Laporan & Ekspor Data">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="report-type" className="text-sm font-medium">Pilih Jenis Laporan:</label>
            <select
              id="report-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportRowsToPdf(activeLabel, `Dicetak pada ${new Date().toLocaleDateString('id-ID')}`, rows, `laporan-${selectedType}-pinangsari`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => exportRowsToExcel(rows, `laporan-${selectedType}-pinangsari`, selectedType)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Memuat data laporan...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Data belum tersedia untuk laporan ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-3 uppercase">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-2.5">{String(r[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN PENGGUNA & ACTIVITY LOGS
// ============================================================================

export function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', nama_lengkap: '', email: '', role: 'OPERATOR_DESA' as AdminRole });
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);

  const loadData = useCallback(async () => {
    const [uRes, lRes] = await Promise.all([
      apiGet<{ items: UserAccount[] }>('/api/admin/users'),
      apiGet<{ items: ActivityLog[] }>('/api/admin/activity-logs'),
    ]);
    setUsers(uRes.items);
    setLogs(lRes.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost('/api/admin/users', form);
      showToast('Pengguna admin ditambahkan.');
      setModalOpen(false);
      setForm({ username: '', password: '', nama_lengkap: '', email: '', role: 'OPERATOR_DESA' });
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menambah pengguna', 'error');
    }
  };

  const toggleActive = async (u: UserAccount) => {
    await apiPut(`/api/admin/users/${u.id}`, { ...u, is_active: u.is_active === 1 ? 0 : 1 });
    showToast('Status akun diperbarui.');
    await loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/admin/users/${deleteTarget.id}`);
      showToast('Pengguna dihapus.');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    }
  };

  return (
    <AdminLayout title="Pengguna Admin & Activity Log">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display font-bold">Daftar Akun Administrator</h2>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                      <td className="px-4 py-3">{u.nama_lengkap}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400">{u.role}</td>
                      <td className="px-4 py-3 text-xs">{u.is_active === 1 ? 'Aktif' : 'Nonaktif'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        <button type="button" onClick={() => toggleActive(u)} className="text-xs text-amber-700 dark:text-amber-400 hover:underline">
                          {u.is_active === 1 ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(u)} className="text-xs text-red-600 hover:underline">
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-display font-bold">Riwayat Activity Log Admin</h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Waktu</th>
                    <th className="px-4 py-2.5">Pengguna</th>
                    <th className="px-4 py-2.5">Aksi / Modul</th>
                    <th className="px-4 py-2.5">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2 font-mono tabular-nums">{l.created_at}</td>
                      <td className="px-4 py-2">{l.username} ({l.role})</td>
                      <td className="px-4 py-2 font-semibold">{l.aksi} · {l.modul}</td>
                      <td className="px-4 py-2">{l.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-display font-bold mb-4">Tambah Pengguna Admin</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Username *</label>
                <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Password (Min. 8 karakter) *</label>
                <input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Nama Lengkap *</label>
                <input required value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Peran (Role)</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="OPERATOR_DESA">Operator Desa</option>
                  <option value="KEPALA_DESA">Kepala Desa</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={Boolean(deleteTarget)} title="Hapus Pengguna" description={`Hapus akun ${deleteTarget?.username}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN PENGATURAN WEBSITE, PETA & BACKUP DATABASE
// ============================================================================

export function AdminPengaturanPage() {
  const { bootstrap, refreshBootstrap, navigate } = useApp();
  const { showToast } = useToast();
  const [form, setForm] = useState<PengaturanDesa | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ item: PengaturanDesa }>('/api/admin/pengaturan').then((res) => setForm(res.item));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await apiPut('/api/admin/pengaturan', form);
      showToast('Pengaturan website, kontak, dan koordinat peta disimpan.');
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Pengaturan Website & Peta Desa">
      {!form ? (
        <div className="text-sm text-slate-500">Memuat pengaturan...</div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 text-sm">
            <h2 className="text-lg font-display font-bold">Identitas, Kontak & Media Sosial</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Nama Website</label>
                <input value={form.nama_website} onChange={(e) => setForm({ ...form, nama_website: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Jam Pelayanan</label>
                <input value={form.jam_pelayanan} onChange={(e) => setForm({ ...form, jam_pelayanan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Telepon</label>
                <input value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email Resmi</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Facebook URL</label>
                <input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/..." className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Instagram URL</label>
                <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/..." className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">YouTube URL</label>
                <input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/..." className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-lg font-display font-bold">Konfigurasi Koordinat Google Maps Desa</h2>
              <p className="text-xs text-slate-500">
                Masukkan koordinat resmi Kantor Desa Pinangsari atau klik langsung pada peta di bawah ini untuk memilih titik koordinat.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Latitude</label>
                  <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Kosongkan jika belum tersedia" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Longitude</label>
                  <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Kosongkan jika belum tersedia" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Zoom Peta (5–20)</label>
                  <input type="number" min={5} max={20} value={form.map_zoom} onChange={(e) => setForm({ ...form, map_zoom: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                </div>
              </div>

              <VillageMap
                apiKey={bootstrap.mapsApiKey}
                latitude={form.latitude}
                longitude={form.longitude}
                zoom={form.map_zoom}
                interactivePicker
                onPickCoordinate={(lat, lng) =>
                  setForm((prev) => (prev ? { ...prev, latitude: String(lat), longitude: String(lng) } : prev))
                }
                heightClass="h-[300px]"
              />
            </div>

            <div>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900">
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>

          {/* Backup Database */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Database className="w-6 h-6 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-display font-bold">Backup Database Desa Pinangsari</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Unduh salinan lengkap seluruh tabel data desa dalam format JSON untuk arsip cadangan.
                </p>
              </div>
            </div>
            <a
              href="/api/admin/backup"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-sm font-semibold hover:bg-slate-800 shrink-0"
            >
              <Download className="w-4 h-4" />
              Unduh Backup Database
            </a>
          </div>

          {/* Panduan Domain Resmi */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Globe className="w-6 h-6 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                  Panduan Domain Resmi (.desa.id) & Pengaturan DNS
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Pelajari syarat dokumen, cara membeli domain .desa.id, dan cara mengarahkan DNS record ke server hosting resmi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/panduan-domain')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 shrink-0 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Buka Panduan Domain
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
