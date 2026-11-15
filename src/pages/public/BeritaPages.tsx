import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, Edit3, FileDown, Search } from 'lucide-react';
import { apiGet } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/villageLogic';
import type { Berita, KategoriBerita, Pengumuman } from '../../types/village';
import { SafeImage } from '../../components/SafeImage';
import { Breadcrumb, EmptyState, SkeletonGrid } from '../../components/UiPrimitives';

export function BeritaListPage() {
  const { navigate, user } = useApp();
  const [items, setItems] = useState<Berita[]>([]);
  const [categories, setCategories] = useState<KategoriBerita[]>([]);
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 6;
  const canEditBerita = Boolean(user && hasPermission(user.role, 'berita', 'write'));

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCat !== 'Semua') params.set('kategori', selectedCat);
    if (search.trim()) params.set('search', search.trim());
    apiGet<{ items: Berita[]; categories: KategoriBerita[] }>(`/api/public/berita?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setCategories(res.categories);
        setPage(1);
      })
      .finally(() => setLoading(false));
  }, [selectedCat, search]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Berita Desa' }]} />
          <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
            Berita & Kabar Desa Pinangsari
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Informasi kegiatan pemerintah desa, pembangunan, pendidikan, kesehatan, dan UMKM warga.
          </p>
        </div>
        {canEditBerita && (
          <button
            type="button"
            onClick={() => navigate('/admin/berita')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold whitespace-nowrap shrink-0 w-fit"
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            Kelola & Edit Berita
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCat('Semua')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedCat === 'Semua'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.nama)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCat === cat.nama
                  ? 'bg-emerald-800 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.nama}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul berita..."
            aria-label="Cari berita desa"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : paged.length === 0 ? (
        <EmptyState
          title="Belum ada berita ditemukan"
          description="Coba pilih kategori lain atau ubah kata kunci pencarian."
          actionLabel="Reset Filter"
          onAction={() => {
            setSelectedCat('Semua');
            setSearch('');
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map((item) => (
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
                    <span aria-hidden="true"> · </span>
                    <span>{item.penulis}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-display font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    <button
                      type="button"
                      onClick={() => navigate(`/berita/${item.slug}`)}
                      className="text-left hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
                    >
                      {item.judul}
                    </button>
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3 flex-1">
                    {item.ringkasan}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/berita/${item.slug}`)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline w-fit"
                    >
                      Baca Berita
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    {canEditBerita && (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/berita?edit=${item.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        Edit & Foto
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400 tabular-nums px-2">
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function BeritaDetailPage({ slug }: { slug: string }) {
  const { navigate, user } = useApp();
  const [item, setItem] = useState<Berita | null>(null);
  const [related, setRelated] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canEditBerita = Boolean(user && hasPermission(user.role, 'berita', 'write'));

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGet<{ item: Berita; related: Berita[] }>(`/api/public/berita/${encodeURIComponent(slug)}`)
      .then((res) => {
        setItem(res.item);
        setRelated(res.related);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Berita tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <SkeletonGrid count={1} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          title="Berita tidak ditemukan"
          description={error || 'Artikel berita yang Anda cari tidak tersedia.'}
          actionLabel="Kembali ke Daftar Berita"
          onAction={() => navigate('/berita')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Berita Desa', to: '/berita' }, { label: item.judul }]} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/berita')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Kembali ke Berita
          </button>
          {canEditBerita && (
            <button
              type="button"
              onClick={() => navigate(`/admin/berita?edit=${item.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              Edit Berita & Ganti Foto
            </button>
          )}
        </div>
      </div>

      <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800">
          <SafeImage src={item.gambar_url} alt={item.judul} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 sm:p-8">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>{item.kategori_nama}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{item.tanggal_publikasi}</span>
            <span aria-hidden="true"> · </span>
            <span>Oleh {item.penulis}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{item.views} kali dibaca</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-slate-100 leading-tight [text-wrap:balance]">
            {item.judul}
          </h1>
          <div className="mt-6 text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {item.isi}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">Berita Terkait</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/berita/${r.slug}`)}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-700 transition-colors"
              >
                <div className="text-xs text-slate-500 tabular-nums">{r.tanggal_publikasi}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {r.judul}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function PengumumanPage() {
  const [items, setItems] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKategori, setFilterKategori] = useState('Semua');

  useEffect(() => {
    apiGet<{ items: Pengumuman[] }>('/api/public/pengumuman')
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Semua', 'Pengumuman', 'Informasi Penting', 'Jadwal Pelayanan', 'Informasi Kegiatan', 'Pemberitahuan Masyarakat'];
  const filtered = filterKategori === 'Semua' ? items : items.filter((i) => i.kategori === filterKategori);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Breadcrumb items={[{ label: 'Pengumuman' }]} />
        <h1 className="mt-3 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
          Pengumuman Resmi Desa Pinangsari
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Jadwal pelayanan, pemberitahuan masyarakat, dan informasi penting Pemerintah Desa.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterKategori(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterKategori === cat
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid count={2} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Belum ada pengumuman aktif" description="Pengumuman terbaru akan tampil di halaman ini." />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border p-6 ${
                item.prioritas === 'Penting'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  {item.prioritas === 'Penting' && (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
                      <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                      Prioritas Penting
                    </span>
                  )}
                  {item.prioritas === 'Penting' && <span aria-hidden="true">·</span>}
                  <span>{item.kategori}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{item.tanggal}</span>
                </div>
              </div>
              <h2 className="mt-2 text-lg font-display font-bold text-slate-900 dark:text-slate-100">
                {item.judul}
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.isi}
              </p>
              {item.lampiran_url && (
                <a
                  href={item.lampiran_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
                >
                  <FileDown className="w-4 h-4" aria-hidden="true" />
                  Unduh Lampiran
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
