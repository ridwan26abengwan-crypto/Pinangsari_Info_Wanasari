import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, FileDown, Plus, Trash2, Upload } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut, apiUploadForm } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/villageLogic';
import type { AgendaDesa, GaleriItem, Pelayanan, PelayananStatus, PotensiDesa } from '../../types/village';
import { AdminLayout } from './AdminLayout';
import { SafeImage } from '../../components/SafeImage';
import { ConfirmModal, useToast } from '../../components/UiPrimitives';

// ============================================================================
// ADMIN PELAYANAN ONLINE
// ============================================================================

export function AdminPelayananPage() {
  const { user } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'pelayanan', 'write') : false;

  const [items, setItems] = useState<Pelayanan[]>([]);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selected, setSelected] = useState<Pelayanan | null>(null);
  const [nextStatus, setNextStatus] = useState<PelayananStatus>('Diverifikasi');
  const [catatan, setCatatan] = useState('');

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: Pelayanan[] }>('/api/admin/pelayanan');
    setItems(res.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await apiPut(`/api/admin/pelayanan/${selected.id}`, {
        status: nextStatus,
        catatan_admin: catatan,
      });
      showToast(`Status ${selected.nomor_pengajuan} diperbarui menjadi ${nextStatus}.`);
      setSelected(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui status', 'error');
    }
  };

  const filtered = filterStatus === 'Semua' ? items : items.filter((i) => i.status === filterStatus);

  return (
    <AdminLayout title="Pelayanan Administrasi Online">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
          {['Semua', 'Diajukan', 'Diverifikasi', 'Diproses', 'Selesai', 'Ditolak'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === st ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nomor Pengajuan</th>
                  <th className="px-4 py-3">Pemohon & NIK</th>
                  <th className="px-4 py-3">Layanan & Keperluan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lampiran</th>
                  {canWrite && <th className="px-4 py-3 text-right">Proses</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums">{p.nomor_pengajuan}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.nama_pemohon}</div>
                      <div className="text-xs font-mono text-slate-500">NIK: {p.nik} · HP: {p.no_hp}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{p.jenis_layanan_nama}</div>
                      <div className="text-slate-500 line-clamp-2 max-w-xs">{p.keperluan}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400">{p.status}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.dokumen_url ? (
                        <a href={p.dokumen_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 hover:underline">
                          <FileDown className="w-3.5 h-3.5" />
                          Berkas
                        </a>
                      ) : (
                        <span className="text-slate-400">Tidak ada</span>
                      )}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(p);
                            setNextStatus(p.status);
                            setCatatan(p.catatan_admin || '');
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
                        >
                          Update Status
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-display font-bold mb-1">Proses Pengajuan {selected.nomor_pengajuan}</h2>
            <p className="text-xs text-slate-500 mb-4">{selected.nama_pemohon} — {selected.jenis_layanan_nama}</p>
            <form onSubmit={handleUpdate} className="space-y-3 text-sm">
              <div>
                <label htmlFor="admin-pelayanan-status" className="block mb-1 font-medium">Status Pengajuan</label>
                <select id="admin-pelayanan-status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as PelayananStatus)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Diajukan', 'Diverifikasi', 'Diproses', 'Selesai', 'Ditolak'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="admin-pelayanan-catatan" className="block mb-1 font-medium">Catatan Petugas</label>
                <textarea id="admin-pelayanan-catatan" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold">Simpan Status</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN POTENSI DESA
// ============================================================================

const EMPTY_POTENSI = {
  nama: '',
  kategori: 'UMKM' as PotensiDesa['kategori'],
  deskripsi: '',
  lokasi: 'Desa Pinangsari',
  kontak: 'Data belum tersedia',
  foto_url: '',
  status: 'Aktif' as 'Aktif' | 'Nonaktif',
  is_demo_data: 0,
};

export function AdminPotensiPage() {
  const { user, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'potensi', 'write') : false;

  const [items, setItems] = useState<PotensiDesa[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_POTENSI);
  const [deleteTarget, setDeleteTarget] = useState<PotensiDesa | null>(null);

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: PotensiDesa[] }>('/api/admin/potensi');
    setItems(res.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadFoto = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiUploadForm<{ url: string }>('/api/upload', fd);
    setForm((prev) => ({ ...prev, foto_url: res.url }));
    showToast('Foto potensi diunggah.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPut(`/api/admin/potensi/${editingId}`, form);
        showToast('Potensi desa diperbarui.');
      } else {
        await apiPost('/api/admin/potensi', form);
        showToast('Potensi desa ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/potensi/${deleteTarget.id}`);
    showToast('Potensi desa dihapus.');
    setDeleteTarget(null);
    await loadData();
    await refreshBootstrap();
  };

  return (
    <AdminLayout title="Potensi Desa Pinangsari">
      <div className="space-y-5">
        {canWrite && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_POTENSI);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Tambah Potensi Desa
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                <SafeImage src={item.foto_url} alt={item.nama} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-slate-500">{item.kategori} · {item.status}</div>
                <div className="mt-1 font-semibold text-sm">{item.nama}</div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">{item.deskripsi}</p>
                {canWrite && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-3 text-xs">
                    <button type="button" onClick={() => { setEditingId(item.id); setForm({ ...item }); setModalOpen(true); }} className="text-emerald-800 dark:text-emerald-400 font-medium">Edit</button>
                    <button type="button" onClick={() => setDeleteTarget(item)} className="text-red-600 font-medium">Hapus</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-display font-bold mb-4">{editingId ? 'Edit Potensi Desa' : 'Tambah Potensi Desa'}</h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Nama Potensi *</label>
                <input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Kategori</label>
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as PotensiDesa['kategori'] })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    {['Pertanian', 'Peternakan', 'Perikanan', 'UMKM', 'Kerajinan', 'Perdagangan', 'Wisata', 'Produk unggulan'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Aktif' | 'Nonaktif' })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Lokasi</label>
                  <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Kontak</label>
                  <input value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Deskripsi</label>
                <textarea rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Upload Foto (JPG/PNG)</label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{form.foto_url ? 'Ganti Foto' : 'Pilih Foto'}</span>
                  <input type="file" accept=".jpg,.jpeg,.png" className="sr-only" onChange={(e) => e.target.files?.[0] && handleUploadFoto(e.target.files[0])} />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={Boolean(deleteTarget)} title="Hapus Potensi Desa" description={`Hapus ${deleteTarget?.nama}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN AGENDA
// ============================================================================

const EMPTY_AGENDA = {
  nama_kegiatan: '',
  tanggal: new Date().toISOString().slice(0, 10),
  waktu: '08:00 - 11:00 WIB',
  lokasi: 'Balai Desa Pinangsari',
  deskripsi: '',
  penanggung_jawab: 'Sekretariat Desa',
  status: 'Akan Datang' as AgendaDesa['status'],
  is_demo_data: 0,
};

export function AdminAgendaPage() {
  const { user, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'agenda', 'write') : false;

  const [items, setItems] = useState<AgendaDesa[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_AGENDA);
  const [deleteTarget, setDeleteTarget] = useState<AgendaDesa | null>(null);

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: AgendaDesa[] }>('/api/admin/agenda');
    setItems(res.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPut(`/api/admin/agenda/${editingId}`, form);
        showToast('Agenda kegiatan diperbarui.');
      } else {
        await apiPost('/api/admin/agenda', form);
        showToast('Agenda kegiatan ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan agenda', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/agenda/${deleteTarget.id}`);
    showToast('Agenda dihapus.');
    setDeleteTarget(null);
    await loadData();
    await refreshBootstrap();
  };

  return (
    <AdminLayout title="Agenda Kegiatan Desa">
      <div className="space-y-5">
        {canWrite && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_AGENDA);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Tambah Agenda
            </button>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kegiatan</th>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">Lokasi & PJ</th>
                  <th className="px-4 py-3">Status</th>
                  {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium">{a.nama_kegiatan}</td>
                    <td className="px-4 py-3 text-xs tabular-nums">{a.tanggal} · {a.waktu}</td>
                    <td className="px-4 py-3 text-xs">{a.lokasi} ({a.penanggung_jawab})</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400">{a.status}</td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button type="button" onClick={() => { setEditingId(a.id); setForm({ ...a }); setModalOpen(true); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Edit3 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setDeleteTarget(a)} className="p-1.5 rounded hover:bg-red-50 text-red-600 ml-1"><Trash2 className="w-4 h-4" /></button>
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
            <h2 className="text-lg font-display font-bold mb-4">{editingId ? 'Edit Agenda' : 'Tambah Agenda'}</h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Nama Kegiatan *</label>
                <input required value={form.nama_kegiatan} onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Tanggal</label>
                  <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Waktu</label>
                  <input value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Lokasi</label>
                  <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Penanggung Jawab</label>
                  <input value={form.penanggung_jawab} onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AgendaDesa['status'] })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="Akan Datang">Akan Datang</option>
                  <option value="Berlangsung">Berlangsung</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Deskripsi</label>
                <textarea rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={Boolean(deleteTarget)} title="Hapus Agenda" description={`Hapus agenda "${deleteTarget?.nama_kegiatan}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN GALERI (MULTI-FILE UPLOAD)
// ============================================================================

export function AdminGaleriPage() {
  const { user } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'galeri', 'write') : false;

  const [items, setItems] = useState<GaleriItem[]>([]);
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<GaleriItem['kategori']>('Kegiatan Pemerintah Desa');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GaleriItem | null>(null);

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: GaleriItem[] }>('/api/admin/galeri');
    setItems(res.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      showToast('Pilih minimal satu foto untuk diunggah.', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i]);
      }
      const uploadRes = await apiUploadForm<{ urls: string[] }>('/api/upload-multiple', fd);
      await apiPost('/api/admin/galeri', {
        judul,
        kategori,
        keterangan,
        tanggal,
        gambar_urls: uploadRes.urls,
        is_demo_data: 0,
      });
      showToast(`${uploadRes.urls.length} foto ditambahkan ke galeri.`);
      setJudul('');
      setKeterangan('');
      setFiles(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengunggah galeri', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/galeri/${deleteTarget.id}`);
    showToast('Foto galeri dihapus.');
    setDeleteTarget(null);
    await loadData();
  };

  return (
    <AdminLayout title="Galeri Foto Desa">
      <div className="space-y-6">
        {canWrite && (
          <form onSubmit={handleUploadSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 text-sm">
            <h2 className="text-base font-display font-bold">Upload Foto Kegiatan (Mendukung Banyak Foto)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-medium">Judul Kegiatan *</label>
                <input required value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Kategori</label>
                <select value={kategori} onChange={(e) => setKategori(e.target.value as GaleriItem['kategori'])} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                  {['Kegiatan Pemerintah Desa', 'Gotong Royong', 'Posyandu', 'PKK', 'Karang Taruna', 'Keagamaan', 'Pembangunan', 'Kegiatan masyarakat'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium">Keterangan</label>
                <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Pilih Foto (JPG/PNG, bisa lebih dari satu) *</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className="truncate">{files && files.length > 0 ? `${files.length} berkas dipilih` : 'Pilih foto...'}</span>
                  <input type="file" multiple accept=".jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFiles(e.target.files)} />
                </label>
              </div>
            </div>
            <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900">
              {uploading ? 'Mengunggah...' : 'Upload ke Galeri'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                <SafeImage src={item.gambar_url} alt={item.judul} className="w-full h-full object-cover" />
              </div>
              <div className="p-3.5">
                <div className="text-xs text-slate-500">{item.kategori} · {item.tanggal}</div>
                <div className="mt-1 text-sm font-semibold line-clamp-1">{item.judul}</div>
                {canWrite && (
                  <button type="button" onClick={() => setDeleteTarget(item)} className="mt-2 text-xs text-red-600 hover:underline">
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal open={Boolean(deleteTarget)} title="Hapus Foto Galeri" description={`Hapus foto "${deleteTarget?.judul}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}
