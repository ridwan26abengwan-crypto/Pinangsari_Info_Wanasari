import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Compass,
  FileSpreadsheet,
  FileText,
  Globe,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  Newspaper,
  Settings,
  Sun,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiGet } from '../../lib/api';
import { hasPermission, type AdminModule } from '../../utils/villageLogic';

interface NavItem {
  label: string;
  to: string;
  module: AdminModule;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', module: 'dashboard', icon: LayoutDashboard },
  { label: 'Profil Desa', to: '/admin/profil', module: 'profil', icon: Building2 },
  { label: 'Pemerintahan', to: '/admin/pemerintahan', module: 'pemerintahan', icon: UserCheck },
  { label: 'Penduduk', to: '/admin/penduduk', module: 'penduduk', icon: Users },
  { label: 'Keluarga', to: '/admin/keluarga', module: 'keluarga', icon: Home },
  { label: 'Berita', to: '/admin/berita', module: 'berita', icon: Newspaper },
  { label: 'Pengumuman', to: '/admin/pengumuman', module: 'pengumuman', icon: Megaphone },
  { label: 'Pelayanan', to: '/admin/pelayanan', module: 'pelayanan', icon: FileText },
  { label: 'Potensi Desa', to: '/admin/potensi', module: 'potensi', icon: Compass },
  { label: 'Agenda', to: '/admin/agenda', module: 'agenda', icon: Calendar },
  { label: 'Galeri', to: '/admin/galeri', module: 'galeri', icon: Image },
  { label: 'Pesan Warga', to: '/admin/pesan', module: 'pesan', icon: Mail },
  { label: 'Laporan', to: '/admin/laporan', module: 'laporan', icon: FileSpreadsheet },
  { label: 'Pengguna', to: '/admin/pengguna', module: 'pengguna', icon: BarChart3 },
  { label: 'Pengaturan', to: '/admin/pengaturan', module: 'pengaturan', icon: Settings },
  { label: 'Panduan Domain', to: '/admin/panduan-domain', module: 'panduan', icon: Globe },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { path, navigate, user, authChecked, logout, darkMode, toggleDarkMode } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (authChecked && !user) {
      navigate('/admin/login');
    }
  }, [authChecked, user, navigate]);

  useEffect(() => {
    if (!user) return;
    apiGet<{ counts: { pelayananBaru: number; pesanBaru: number } }>('/api/admin/dashboard')
      .then((res) => setNotifCount((res.counts.pelayananBaru || 0) + (res.counts.pesanBaru || 0)))
      .catch(() => {});
  }, [user, path]);

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm text-slate-600 dark:text-slate-400">
        Memeriksa sesi administrator...
      </div>
    );
  }

  const cleanPath = (path.split('?')[0] || '/admin').replace(/\/$/, '') || '/admin';
  const visibleNav = ADMIN_NAV.filter((item) => hasPermission(user.role, item.module, 'read'));

  const go = (to: string) => {
    setSidebarOpen(false);
    navigate(to);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-950 text-emerald-50 border-r border-emerald-900 flex flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-emerald-900 shrink-0">
          <button
            type="button"
            onClick={() => go('/admin')}
            className="text-left font-display font-bold text-base text-white whitespace-nowrap transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            Desa Pinangsari
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
            className="lg:hidden p-1.5 rounded-lg hover:bg-emerald-900 transition-all duration-150 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu Admin">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = cleanPath === item.to;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => go(item.to)}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? 'bg-emerald-800/95 text-white shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-amber-400'
                    : 'text-emerald-100/85 hover:bg-emerald-900/70 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : ''}`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-emerald-900 space-y-1">
            <button
              type="button"
              onClick={() => go('/')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-emerald-200 hover:bg-emerald-900/70 hover:translate-x-0.5 transition-all duration-150 active:scale-[0.98]"
            >
              <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Lihat Website Publik</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-amber-300 hover:bg-emerald-900/70 hover:translate-x-0.5 transition-all duration-150 active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar admin"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Admin Desa Pinangsari / {title}
              </div>
              <h1 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => go('/admin/pelayanan')}
              aria-label={`Notifikasi (${notifCount} menunggu)`}
              className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {notifCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Mode terang' : 'Mode gelap'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.nama_lengkap}</div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </header>

        <main key={cleanPath} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
