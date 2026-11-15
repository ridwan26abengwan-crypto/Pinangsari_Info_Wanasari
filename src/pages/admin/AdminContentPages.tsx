import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut, apiUploadForm } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/villageLogic';
import type { Berita, GaleriItem, KategoriBerita, Pengumuman, PerangkatDesa, ProfilDesa } from '../../types/village';
import { AdminLayout } from './AdminLayout';
import { SafeImage } from '../../components/SafeImage';
import { ImageUploadField } from '../../components/ImageUploadField';
import { ConfirmModal, useToast } from '../../components/UiPrimitives';

// ============================================================================
// ADMIN PROFIL DESA
// ============================================================================

export function AdminProfilPage() {
  const { user, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'profil', 'write') : false;

  const [form, setForm] = useState<ProfilDesa | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ item: ProfilDesa }>('/api/admin/profil').then((res) => setForm(res.item));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await apiPut('/api/admin/profil', form);
      showToast('Profil Desa Pinangsari berhasil diperbarui.');
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Profil Desa Pinangsari">
      {!form ? (
        <div className="text-sm text-slate-500">Memuat profil...</div>
      ) : (
        <form onSubmit={handleSave} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium">Nama Desa</label>
              <input disabled={!canWrite} value={form.nama_desa} onChange={(e) => setForm({ ...form, nama_desa: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Dusun Kantor</label>
              <input disabled={!canWrite} value={form.dusun_kantor} onChange={(e) => setForm({ ...form, dusun_kantor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 font-medium">RT</label>
                <input disabled={!canWrite} value={form.rt_kantor} onChange={(e) => setForm({ ...form, rt_kantor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">RW</label>
                <input disabled={!canWrite} value={form.rw_kantor} onChange={(e) => setForm({ ...form, rw_kantor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Luas Wilayah</label>
              <input disabled={!canWrite} value={form.luas_wilayah} onChange={(e) => setForm({ ...form, luas_wilayah: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Kode Pos</label>
              <input disabled={!canWrite} value={form.kode_pos} onChange={(e) => setForm({ ...form, kode_pos: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block mb-1 font-medium">Dusun</label>
                <input disabled={!canWrite} type="number" value={form.jumlah_dusun} onChange={(e) => setForm({ ...form, jumlah_dusun: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">RW</label>
                <input disabled={!canWrite} type="number" value={form.jumlah_rw} onChange={(e) => setForm({ ...form, jumlah_rw: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">RT</label>
                <input disabled={!canWrite} type="number" value={form.jumlah_rt} onChange={(e) => setForm({ ...form, jumlah_rt: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 font-medium">Batas Utara</label>
              <input disabled={!canWrite} value={form.batas_utara} onChange={(e) => setForm({ ...form, batas_utara: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Batas Selatan</label>
              <input disabled={!canWrite} value={form.batas_selatan} onChange={(e) => setForm({ ...form, batas_selatan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Batas Timur</label>
              <input disabled={!canWrite} value={form.batas_timur} onChange={(e) => setForm({ ...form, batas_timur: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Batas Barat</label>
              <input disabled={!canWrite} value={form.batas_barat} onChange={(e) => setForm({ ...form, batas_barat: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium">Sejarah Desa</label>
            <textarea disabled={!canWrite} rows={4} value={form.sejarah} onChange={(e) => setForm({ ...form, sejarah: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Visi</label>
              <textarea disabled={!canWrite} rows={4} value={form.visi} onChange={(e) => setForm({ ...form, visi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Misi</label>
              <textarea disabled={!canWrite} rows={4} value={form.misi} onChange={(e) => setForm({ ...form, misi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Letak Geografis</label>
              <textarea disabled={!canWrite} rows={3} value={form.letak_geografis} onChange={(e) => setForm({ ...form, letak_geografis: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Kondisi Wilayah</label>
              <textarea disabled={!canWrite} rows={3} value={form.kondisi_wilayah} onChange={(e) => setForm({ ...form, kondisi_wilayah: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
          </div>

          {canWrite && (
            <div>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
              </button>
            </div>
          )}
        </form>
      )}
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN PEMERINTAHAN DESA
// ============================================================================

const EMPTY_PERANGKAT = {
  nama: '',
  jabatan: '',
  tingkatan: 'Kasi',
  urutan: 1,
  nip_nrpd: 'Data belum tersedia',
  pendidikan: 'Data belum tersedia',
  masa_jabatan: 'Data belum tersedia',
  foto_url: '',
  keterangan: '',
  is_demo_data: 0,
};

export function AdminPemerintahanPage() {
  const { user } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'pemerintahan', 'write') : false;

  const [items, setItems] = useState<PerangkatDesa[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_PERANGKAT);
  const [deleteTarget, setDeleteTarget] = useState<PerangkatDesa | null>(null);

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: PerangkatDesa[] }>('/api/admin/perangkat');
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
    showToast('Foto perangkat desa diunggah.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPut(`/api/admin/perangkat/${editingId}`, form);
        showToast('Data perangkat desa diperbarui.');
      } else {
        await apiPost('/api/admin/perangkat', form);
        showToast('Perangkat desa ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/perangkat/${deleteTarget.id}`);
    showToast('Perangkat desa dihapus.');
    setDeleteTarget(null);
    await loadData();
  };

  return (
    <AdminLayout title="Pemerintahan & Perangkat Desa">
      <div className="space-y-5">
        {canWrite && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_PERANGKAT);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Tambah Perangkat Desa
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                <SafeImage src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">{p.tingkatan} · Urutan {p.urutan}</div>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{p.jabatan}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.nama}</div>
                {canWrite && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(p.id);
                        setForm({ ...p });
                        setModalOpen(true);
                      }}
                      className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-display font-bold mb-4">{editingId ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}</h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Nama Lengkap *</label>
                <input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Jabatan *</label>
                  <input required value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Tingkatan</label>
                  <select value={form.tingkatan} onChange={(e) => setForm({ ...form, tingkatan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    {['Kepala Desa', 'Sekretaris Desa', 'Kasi', 'Kaur', 'Kepala Dusun', 'RW', 'RT'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Urutan Bagan</label>
                  <input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">NIP / NRPD</label>
                  <input value={form.nip_nrpd} onChange={(e) => setForm({ ...form, nip_nrpd: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Upload Foto (JPG/PNG)</label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{form.foto_url ? 'Ganti Foto' : 'Pilih Foto'}</span>
                  <input type="file" accept=".jpg,.jpeg,.png" className="sr-only" onChange={(e) => e.target.files?.[0] && handleUploadFoto(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="block mb-1 font-medium">Keterangan</label>
                <textarea rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-800 text-white font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={Boolean(deleteTarget)} title="Hapus Perangkat Desa" description={`Hapus ${deleteTarget?.nama}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN BERITA DESA
// ============================================================================

const EMPTY_BERITA = {
  judul: '',
  kategori_id: 1,
  ringkasan: '',
  isi: '',
  gambar_url: '',
  penulis: '',
  tanggal_publikasi: new Date().toISOString().slice(0, 10),
  status: 'Dipublikasikan' as 'Dipublikasikan' | 'Draft',
  is_demo_data: 0,
};

const BUNDLED_NEWS_PHOTOS = [
  { label: 'Suasana Desa Pinangsari', url: '/src/assets/images/hero_desa_pinangsari_1794758501699.jpg' },
  { label: 'Balai Desa Pinangsari', url: '/src/assets/images/balai_desa_pinangsari_1794758502248.jpg' },
  { label: 'Kegiatan Warga & Gotong Royong', url: '/src/assets/images/kegiatan_warga_desa_1794758502772.jpg' },
  { label: 'Pertanian Padi Desa', url: '/src/assets/images/potensi_pertanian_desa_1794758502697.jpg' },
  { label: 'UMKM Masyarakat Desa', url: '/src/assets/images/potensi_umkm_desa_1794758502908.jpg' },
];

export function AdminBeritaPage() {
  const { user, path, navigate, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'berita', 'write') : false;

  const [items, setItems] = useState<Berita[]>([]);
  const [categories, setCategories] = useState<KategoriBerita[]>([]);
  const [galeriPhotos, setGaleriPhotos] = useState<Array<{ label: string; url: string }>>(BUNDLED_NEWS_PHOTOS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_BERITA);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Berita | null>(null);

  const loadData = useCallback(async () => {
    const [beritaRes, galeriRes] = await Promise.all([
      apiGet<{ items: Berita[]; categories: KategoriBerita[] }>('/api/admin/berita'),
      apiGet<{ items: GaleriItem[] }>('/api/public/galeri').catch(() => ({ items: [] as GaleriItem[] })),
    ]);
    setItems(beritaRes.items);
    setCategories(beritaRes.categories);
    const merged = [
      ...BUNDLED_NEWS_PHOTOS,
      ...galeriRes.items
        .filter((g) => g.gambar_url && !BUNDLED_NEWS_PHOTOS.some((b) => b.url === g.gambar_url))
        .map((g) => ({ label: g.judul, url: g.gambar_url })),
    ];
    setGaleriPhotos(merged);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Support deep-link /admin/berita?edit=<id> from Beranda or Berita page
  useEffect(() => {
    if (!canWrite || items.length === 0) return;
    const qs = path.includes('?') ? path.split('?')[1] : window.location.search.replace(/^\?/, '');
    const editParam = new URLSearchParams(qs).get('edit');
    if (editParam) {
      const targetId = Number.parseInt(editParam, 10);
      const found = items.find((b) => b.id === targetId);
      if (found) {
        setEditingId(found.id);
        setForm({ ...found });
        setModalOpen(true);
        navigate('/admin/berita');
      }
    }
  }, [canWrite, items, navigate, path]);

  const handleUploadGambar = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiUploadForm<{ url: string }>('/api/upload', fd);
      setForm((prev) => ({ ...prev, gambar_url: res.url }));
      showToast('Foto berita berhasil diunggah dan diganti.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengunggah foto berita', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiPut(`/api/admin/berita/${editingId}`, form);
        showToast('Berita & foto berhasil diperbarui.');
      } else {
        await apiPost('/api/admin/berita', form);
        showToast('Berita baru berhasil ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan berita', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/berita/${deleteTarget.id}`);
    showToast('Berita dihapus.');
    setDeleteTarget(null);
    await loadData();
    await refreshBootstrap();
  };

  const filteredItems = items.filter((b) => {
    const matchesCategory = filterCategory === 'Semua' || b.kategori_nama === filterCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.judul.toLowerCase().includes(q) ||
      b.penulis.toLowerCase().includes(q) ||
      b.ringkasan.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout title="Kelola Berita & Informasi Terkini">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul atau penulis..."
                aria-label="Cari berita di admin"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <select
              aria-label="Filter kategori berita"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nama}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_BERITA, penulis: user?.nama_lengkap || '' });
                setModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Berita
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Judul & Penulis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Status</th>
                  {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 w-24">
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <SafeImage src={b.gambar_url} alt={b.judul} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="text-slate-900 dark:text-slate-100 line-clamp-2">{b.judul}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Oleh {b.penulis}</div>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{b.kategori_nama}</td>
                    <td className="px-4 py-3 text-xs tabular-nums whitespace-nowrap">{b.tanggal_publikasi}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-400 whitespace-nowrap">{b.status}</td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Edit ${b.judul}`}
                            onClick={() => {
                              setEditingId(b.id);
                              setForm({ ...b });
                              setModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit & Foto
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus ${b.judul}`}
                            onClick={() => setDeleteTarget(b)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada berita yang sesuai filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-berita-title">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="modal-berita-title" className="text-lg font-display font-bold">
                {editingId ? 'Edit Berita & Foto' : 'Tambah Berita Baru'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Tutup modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-sm">
              {/* Komponen File Input & Pengelola Foto Berita */}
              <ImageUploadField
                inputId="berita-foto-file"
                label="Upload Foto Berita (JPG, JPEG, PNG, WEBP, Maks 5MB)"
                value={form.gambar_url}
                altText={form.judul || 'Pratinjau foto berita'}
                uploading={uploadingPhoto}
                onFileSelect={handleUploadGambar}
                onChangeUrl={(url) => setForm((prev) => ({ ...prev, gambar_url: url }))}
                galleryOptions={galeriPhotos}
                onPickGallery={(opt) => showToast(`Foto dipilih: ${opt.label}`)}
              />

              <div>
                <label htmlFor="berita-judul" className="block mb-1 font-medium">Judul Berita *</label>
                <input
                  id="berita-judul"
                  required
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="berita-kategori" className="block mb-1 font-medium">Kategori</label>
                  <select
                    id="berita-kategori"
                    value={form.kategori_id}
                    onChange={(e) => setForm({ ...form, kategori_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="berita-tanggal" className="block mb-1 font-medium">Tanggal</label>
                  <input
                    id="berita-tanggal"
                    type="date"
                    value={form.tanggal_publikasi}
                    onChange={(e) => setForm({ ...form, tanggal_publikasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="berita-status" className="block mb-1 font-medium">Status</label>
                  <select
                    id="berita-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Berita['status'] })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="Dipublikasikan">Dipublikasikan</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="berita-penulis" className="block mb-1 font-medium">Penulis</label>
                <input
                  id="berita-penulis"
                  value={form.penulis}
                  onChange={(e) => setForm({ ...form, penulis: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label htmlFor="berita-ringkasan" className="block mb-1 font-medium">Ringkasan</label>
                <textarea
                  id="berita-ringkasan"
                  rows={2}
                  value={form.ringkasan}
                  onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label htmlFor="berita-isi" className="block mb-1 font-medium">Isi Berita *</label>
                <textarea
                  id="berita-isi"
                  required
                  rows={6}
                  value={form.isi}
                  onChange={(e) => setForm({ ...form, isi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
                <button type="submit" disabled={saving || uploadingPhoto} className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold disabled:opacity-60">
                  {saving ? 'Menyimpan...' : 'Simpan Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={Boolean(deleteTarget)} title="Konfirmasi Hapus Berita" description={`Hapus berita "${deleteTarget?.judul}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}

// ============================================================================
// ADMIN PENGUMUMAN
// ============================================================================

const EMPTY_PENGUMUMAN = {
  judul: '',
  kategori: 'Pengumuman' as Pengumuman['kategori'],
  isi: '',
  tanggal: new Date().toISOString().slice(0, 10),
  status: 'Aktif' as 'Aktif' | 'Arsip',
  prioritas: 'Normal' as 'Penting' | 'Normal',
  lampiran_url: '',
  is_demo_data: 0,
};

export function AdminPengumumanPage() {
  const { user, refreshBootstrap } = useApp();
  const { showToast } = useToast();
  const canWrite = user ? hasPermission(user.role, 'pengumuman', 'write') : false;

  const [items, setItems] = useState<Pengumuman[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_PENGUMUMAN);
  const [deleteTarget, setDeleteTarget] = useState<Pengumuman | null>(null);

  const loadData = useCallback(async () => {
    const res = await apiGet<{ items: Pengumuman[] }>('/api/admin/pengumuman');
    setItems(res.items);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadLampiran = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiUploadForm<{ url: string }>('/api/upload', fd);
    setForm((prev) => ({ ...prev, lampiran_url: res.url }));
    showToast('Lampiran pengumuman diunggah.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPut(`/api/admin/pengumuman/${editingId}`, form);
        showToast('Pengumuman diperbarui.');
      } else {
        await apiPost('/api/admin/pengumuman', form);
        showToast('Pengumuman ditambahkan.');
      }
      setModalOpen(false);
      await loadData();
      await refreshBootstrap();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan pengumuman', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await apiDelete(`/api/admin/pengumuman/${deleteTarget.id}`);
    showToast('Pengumuman dihapus.');
    setDeleteTarget(null);
    await loadData();
    await refreshBootstrap();
  };

  return (
    <AdminLayout title="Kelola Pengumuman Desa">
      <div className="space-y-5">
        {canWrite && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_PENGUMUMAN);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Buat Pengumuman
            </button>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500">
                  {item.prioritas === 'Penting' && <span className="font-semibold text-amber-700 dark:text-amber-400">Penting · </span>}
                  {item.kategori} · {item.tanggal} · Status: {item.status}
                </div>
                <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{item.judul}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.isi}</p>
              </div>
              {canWrite && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({ ...item });
                      setModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 border border-red-200 dark:border-red-900"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-display font-bold mb-4">{editingId ? 'Edit Pengumuman' : 'Buat Pengumuman'}</h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Judul *</label>
                <input required value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Kategori</label>
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as Pengumuman['kategori'] })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    {['Pengumuman', 'Informasi Penting', 'Jadwal Pelayanan', 'Informasi Kegiatan', 'Pemberitahuan Masyarakat'].map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Prioritas</label>
                  <select value={form.prioritas} onChange={(e) => setForm({ ...form, prioritas: e.target.value as 'Penting' | 'Normal' })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    <option value="Normal">Normal</option>
                    <option value="Penting">Penting (Banner Beranda)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">Tanggal</label>
                  <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Aktif' | 'Arsip' })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                    <option value="Aktif">Aktif</option>
                    <option value="Arsip">Arsip</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Isi Pengumuman *</label>
                <textarea required rows={4} value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Lampiran (PDF/JPG/PNG)</label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{form.lampiran_url ? 'Ganti Lampiran' : 'Upload Lampiran'}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => e.target.files?.[0] && handleUploadLampiran(e.target.files[0])} />
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

      <ConfirmModal open={Boolean(deleteTarget)} title="Konfirmasi Hapus Pengumuman" description={`Hapus pengumuman "${deleteTarget?.judul}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AdminLayout>
  );
}
