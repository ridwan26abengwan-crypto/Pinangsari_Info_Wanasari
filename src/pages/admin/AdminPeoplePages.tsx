import React, { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Search, Trash2, Upload, Edit3, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../../lib/api';
import { exportRowsToExcel, parseExcelFile } from '../../lib/exportUtils';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/villageLogic';
import type { Keluarga, Penduduk } from '../../types/village';
import { AdminLayout } from './AdminLayout';
import { ConfirmModal, EmptyState, useToast } from '../../components/UiPrimitives';

// ============================================================================
// ADMIN PENDUDUK PAGE (PRIVATE + CRUD + IMPORT/EXPORT EXCEL)
// ============================================================================

const EMPTY_PENDUDUK = {
  nik: '',
  no_kk: '',
  nama_lengkap: '',
  jenis_kelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
  tempat_lahir: 'Subang',
  tanggal_lahir: '1990-01-01',
  agama: 'Islam',
  status_perkawinan: 'Belum Kawin',
  pendidikan: 'SMA',
  pekerjaan: 'Petani',
  alamat: 'Dusun Wanasari',
  rt: '003',
  rw: '003',
  dusun: 'Wanasari',
  no_hp: '',
  status_penduduk: 'Aktif' as 'Aktif' | 'Pindah' | 'Meninggal' | 'Sementara',
  is_demo_data: 0,
};

export function AdminPendudukPage() {
  const { user, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'penduduk', 'write') : false;

  const [items, setItems] = useState<Penduduk[]>([]);
  const [search, setSearch] = useState('');
  const [filterDusun, setFilterDusun] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_PENDUDUK);
  const [deleteTarget, setDeleteTarget] = useState<Penduduk | null>(null);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filterDusun !== 'Semua') params.set('dusun', filterDusun);
    if (filterStatus !== 'Semua') params.set('status', filterStatus);
    const res = await apiGet<{ items: Penduduk[] }>(`/api/admin/penduduk?${params.toString()}`);
    setItems(res.items);
    setPage(1);
  }, [search, filterDusun, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPut(`/api/admin/penduduk/${editingId}`, form);
        showToast('Data penduduk diperbarui.');
      } else {
        await apiPost('/api/admin/penduduk', form);
        showToast('Data penduduk ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan data', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/admin/penduduk/${deleteTarget.id}`);
      showToast('Data penduduk dihapus.');
      setDeleteTarget(null);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      const res = await apiPost<{ inserted: number; skipped: number }>('/api/admin/penduduk/import', { rows });
      showToast(`Impor selesai: ${res.inserted} masuk, ${res.skipped} dilewati.`);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengimpor Excel', 'error');
    }
    e.target.value = '';
  };

  const paged = items.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  return (
    <AdminLayout title="Data Penduduk (Privat)">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIK, KK, atau Nama..."
                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              aria-label="Filter dusun"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="Semua">Semua Dusun</option>
              <option value="Wanasari">Wanasari</option>
              <option value="Mekarsari">Mekarsari</option>
              <option value="Sukamaju">Sukamaju</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter status penduduk"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Pindah">Pindah</option>
              <option value="Meninggal">Meninggal</option>
              <option value="Sementara">Sementara</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportRowsToExcel(items as unknown as Record<string, unknown>[], 'data-penduduk-pinangsari', 'Penduduk')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>

            {canWrite && (
              <>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import Excel
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="sr-only" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_PENDUDUK);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Penduduk
                </button>
              </>
            )}
          </div>
        </div>

        {paged.length === 0 ? (
          <EmptyState title="Data penduduk tidak ditemukan" />
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3">NIK / No. KK</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">L/P</th>
                    <th className="px-4 py-3">Pendidikan / Pekerjaan</th>
                    <th className="px-4 py-3">Wilayah</th>
                    <th className="px-4 py-3">Status</th>
                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paged.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">
                        <div>{p.nik}</div>
                        <div className="text-slate-400">KK: {p.no_kk}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {p.nama_lengkap}
                        <div className="text-xs text-slate-500">
                          {p.tempat_lahir}, {p.tanggal_lahir}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.jenis_kelamin}</td>
                      <td className="px-4 py-3 text-xs">
                        <div>{p.pendidikan}</div>
                        <div className="text-slate-500">{p.pekerjaan}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        Dusun {p.dusun} · RT {p.rt}/RW {p.rw}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                        {p.status_penduduk}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            aria-label={`Edit ${p.nama_lengkap}`}
                            onClick={() => {
                              setEditingId(p.id);
                              setForm({ ...p });
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus ${p.nama_lengkap}`}
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="tabular-nums text-slate-500">
                  Halaman {page} dari {totalPages} ({items.length} data)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold">
                {editingId ? 'Edit Data Penduduk' : 'Tambah Data Penduduk'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Tutup modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">NIK (16 Digit) *</label>
                <input required maxLength={16} value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Nomor KK (16 Digit) *</label>
                <input required maxLength={16} value={form.no_kk} onChange={(e) => setForm({ ...form, no_kk: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">Nama Lengkap *</label>
                <input required value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Jenis Kelamin</label>
                <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value as 'Laki-laki' | 'Perempuan' })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Agama</label>
                <select value={form.agama} onChange={(e) => setForm({ ...form, agama: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Tempat Lahir</label>
                <input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Tanggal Lahir</label>
                <input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Pendidikan</label>
                <select value={form.pendidikan} onChange={(e) => setForm({ ...form, pendidikan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Tidak/Belum Sekolah', 'SD', 'SMP', 'SMA', 'Diploma', 'Sarjana'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Pekerjaan</label>
                <select value={form.pekerjaan} onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Petani', 'Pedagang', 'Wiraswasta', 'Guru', 'Karyawan', 'Buruh', 'Pekerjaan lainnya'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Status Perkawinan</label>
                <select value={form.status_perkawinan} onChange={(e) => setForm({ ...form, status_perkawinan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Status Penduduk</label>
                <select value={form.status_penduduk} onChange={(e) => setForm({ ...form, status_penduduk: e.target.value as Penduduk['status_penduduk'] })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Aktif', 'Pindah', 'Meninggal', 'Sementara'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Dusun</label>
                <input value={form.dusun} onChange={(e) => setForm({ ...form, dusun: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium">RT</label>
                  <input value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">RW</label>
                  <input value={form.rw} onChange={(e) => setForm({ ...form, rw: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">Alamat</label>
                <input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Konfirmasi Hapus Data Penduduk"
        description={`Apakah Anda yakin ingin menghapus data ${deleteTarget?.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN KELUARGA (KK) PAGE
// ============================================================================

const EMPTY_KK = {
  no_kk: '',
  kepala_keluarga: '',
  alamat: 'Dusun Wanasari RT.003/RW.003',
  rt: '003',
  rw: '003',
  dusun: 'Wanasari',
  jumlah_anggota: 1,
  status: 'Aktif' as 'Aktif' | 'Pindah' | 'Nonaktif',
  is_demo_data: 0,
};

export function AdminKeluargaPage() {
  const { user, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'keluarga', 'write') : false;

  const [items, setItems] = useState<Keluarga[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_KK);
  const [deleteTarget, setDeleteTarget] = useState<Keluarga | null>(null);

  const loadData = useCallback(async () => {
    const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const res = await apiGet<{ items: Keluarga[] }>(`/api/admin/keluarga${q}`);
    setItems(res.items);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPut(`/api/admin/keluarga/${editingId}`, form);
        showToast('Data Kartu Keluarga diperbarui.');
      } else {
        await apiPost('/api/admin/keluarga', form);
        showToast('Data Kartu Keluarga ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan KK', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/keluarga/${deleteTarget.id}`);
    showToast('Data Kartu Keluarga dihapus.');
    setDeleteTarget(null);
    await loadData();
    await refreshBootstrap();
  };

  return (
    <AdminLayout title="Data Kartu Keluarga (Privat)">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nomor KK atau Kepala Keluarga..."
              className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-72"
            />
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_KK);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Tambah Kartu Keluarga
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nomor KK</th>
                  <th className="px-4 py-3">Kepala Keluarga</th>
                  <th className="px-4 py-3">Alamat / Wilayah</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Status</th>
                  {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">{k.no_kk}</td>
                    <td className="px-4 py-3 font-medium">{k.kepala_keluarga}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {k.alamat} (Dusun {k.dusun}, RT {k.rt}/RW {k.rw})
                    </td>
                    <td className="px-4 py-3 tabular-nums">{k.jumlah_anggota}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400">{k.status}</td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          aria-label={`Edit KK ${k.no_kk}`}
                          onClick={() => {
                            setEditingId(k.id);
                            setForm({ ...k });
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus KK ${k.no_kk}`}
                          onClick={() => setDeleteTarget(k)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-display font-bold mb-4">
              {editingId ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga'}
            </h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Nomor KK (16 Digit) *</label>
                <input required maxLength={16} value={form.no_kk} onChange={(e) => setForm({ ...form, no_kk: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Nama Kepala Keluarga *</label>
                <input required value={form.kepala_keluarga} onChange={(e) => setForm({ ...form, kepala_keluarga: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1 font-medium">Dusun</label>
                  <input value={form.dusun} onChange={(e) => setForm({ ...form, dusun: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">RT</label>
                  <input value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">RW</label>
                  <input value={form.rw} onChange={(e) => setForm({ ...form, rw: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Alamat</label>
                <input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Jumlah Anggota</label>
                  <input type="number" min={1} value={form.jumlah_anggota} onChange={(e) => setForm({ ...form, jumlah_anggota: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Keluarga['status'] })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    <option value="Aktif">Aktif</option>
                    <option value="Pindah">Pindah</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Konfirmasi Hapus Kartu Keluarga"
        description={`Hapus Kartu Keluarga ${deleteTarget?.no_kk} (${deleteTarget?.kepala_keluarga})?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
