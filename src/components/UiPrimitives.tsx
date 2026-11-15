import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Search,
  X,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import { useApp } from '../context/AppContext';

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm transition-all ${
              t.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/95 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                : t.type === 'info'
                ? 'bg-slate-900 dark:bg-slate-800 border-slate-700 text-white'
                : 'bg-emerald-900 dark:bg-emerald-950 border-emerald-700 text-white'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Tutup notifikasi"
              className="opacity-70 hover:opacity-100 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus digunakan di dalam ToastProvider');
  return ctx;
}

// ============================================================================
// CONFIRM DELETE MODAL
// ============================================================================

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Hapus Data',
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <h3 id="confirm-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {busy ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BREADCRUMB
// ============================================================================

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  const { navigate } = useApp();
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
      >
        Beranda
      </button>
      {items.map((item, idx) => (
        <React.Fragment key={item.label}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          {item.to && idx < items.length - 1 ? (
            <button
              type="button"
              onClick={() => navigate(item.to!)}
              className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ============================================================================
// BACK TO TOP BUTTON
// ============================================================================

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 left-5 z-40 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-emerald-900 text-white border border-emerald-700 shadow-lg hover:bg-emerald-800 transition-colors focus-visible:outline-2 focus-visible:outline-amber-500"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

// ============================================================================
// EMPTY STATE & LOADING SKELETON
// ============================================================================

export function EmptyState({
  title = 'Data belum tersedia',
  description = 'Belum ada data yang ditambahkan pada bagian ini.',
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
      <FolderOpen className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" aria-hidden="true" />
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Memuat data">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse space-y-3"
        >
          <div className="h-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// DEMO LABEL (Unboxed clean inline text, zero pill badges)
// ============================================================================

export function DemoDataNote({ show: _show = true }: { show?: boolean }) {
  return null;
}

// ============================================================================
// GLOBAL SEARCH MODAL
// ============================================================================

interface SearchResults {
  berita: Array<{ id: number; judul: string; slug: string; tanggal_publikasi: string; kategori_nama: string }>;
  pengumuman: Array<{ id: number; judul: string; kategori: string; tanggal: string }>;
  potensi: Array<{ id: number; nama: string; kategori: string; lokasi: string }>;
  agenda: Array<{ id: number; nama_kegiatan: string; tanggal: string; lokasi: string }>;
  layanan: Array<{ id: number; nama: string; kode: string; estimasi_waktu: string }>;
}

export function GlobalSearchModal() {
  const { searchModalOpen, setSearchModalOpen, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    berita: [],
    pengumuman: [],
    potensi: [],
    agenda: [],
    layanan: [],
  });

  useEffect(() => {
    if (!searchModalOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ berita: [], pengumuman: [], potensi: [], agenda: [], layanan: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiGet<SearchResults>(`/api/public/search?q=${encodeURIComponent(trimmed)}`);
        setResults(data);
      } catch {
        // Ignore transient search errors
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, searchModalOpen]);

  if (!searchModalOpen) return null;

  const totalResults =
    results.berita.length +
    results.pengumuman.length +
    results.potensi.length +
    results.agenda.length +
    results.layanan.length;

  const go = (to: string) => {
    setSearchModalOpen(false);
    setQuery('');
    navigate(to);
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Global Portal Desa Pinangsari"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berita, pengumuman, layanan surat, potensi desa, atau agenda..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            aria-label="Tutup pencarian"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim().length < 2 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              Ketik minimal 2 karakter untuk mencari informasi Desa Pinangsari.
            </p>
          ) : loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">Mencari informasi...</p>
          ) : totalResults === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              Tidak ditemukan hasil untuk "{query}".
            </p>
          ) : (
            <div className="space-y-4">
              {results.layanan.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Pelayanan Administrasi</h4>
                  <div className="space-y-1">
                    {results.layanan.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go('/pelayanan')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-4"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.nama}</span>
                        <span className="text-xs text-slate-500 shrink-0">{item.estimasi_waktu}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.berita.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Berita Desa</h4>
                  <div className="space-y-1">
                    {results.berita.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(`/berita/${item.slug}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.judul}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.kategori_nama} · {item.tanggal_publikasi}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.pengumuman.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Pengumuman</h4>
                  <div className="space-y-1">
                    {results.pengumuman.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go('/pengumuman')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.judul}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.kategori} · {item.tanggal}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.potensi.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Potensi Desa</h4>
                  <div className="space-y-1">
                    {results.potensi.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go('/potensi')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.nama}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.kategori} · {item.lokasi}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.agenda.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Agenda Kegiatan</h4>
                  <div className="space-y-1">
                    {results.agenda.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go('/agenda')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.nama_kegiatan}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.tanggal} · {item.lokasi}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
