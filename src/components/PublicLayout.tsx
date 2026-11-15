import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Facebook,
  Instagram,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Shield,
  Sun,
  X,
  Youtube,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackToTop, GlobalSearchModal } from './UiPrimitives';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { path, navigate, darkMode, toggleDarkMode, bootstrap, setSearchModalOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cleanPath = (path.split('?')[0] || '/').replace(/\/$/, '') || '/';
  const pengaturan = bootstrap.pengaturan;

  useEffect(() => {
    if (!infoDropdownOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setInfoDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInfoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [infoDropdownOpen]);

  const go = (to: string) => {
    setMobileMenuOpen(false);
    setInfoDropdownOpen(false);
    navigate(to);
  };

  const isInfoActive = ['/pemerintahan', '/statistik', '/pengumuman', '/potensi', '/agenda', '/galeri'].includes(cleanPath);

  const navLinkClass = (active: boolean) =>
    `relative inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-700 ${
      active
        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-emerald-800 dark:hover:text-emerald-300'
    }`;

  const activeIndicator = (active: boolean) => (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-3.5 bottom-1 h-0.5 rounded-full bg-emerald-800 dark:bg-emerald-400 transition-transform duration-200 origin-center ${
        active ? 'scale-x-100' : 'scale-x-0'
      }`}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Top Bar (Strict 3-zone contract) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              go('/');
            }}
            className="text-lg font-display font-bold tracking-tight text-emerald-900 dark:text-emerald-400 whitespace-nowrap shrink-0 rounded-md px-1.5 py-1 -ml-1.5 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            Desa Pinangsari
          </a>

          {/* Zone 2: 5 Single-line Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navigasi utama">
            <button type="button" onClick={() => go('/')} className={navLinkClass(cleanPath === '/')}>
              Beranda
              {activeIndicator(cleanPath === '/')}
            </button>
            <button type="button" onClick={() => go('/profil')} className={navLinkClass(cleanPath === '/profil')}>
              Profil
              {activeIndicator(cleanPath === '/profil')}
            </button>
            <button
              type="button"
              onClick={() => go('/berita')}
              className={navLinkClass(cleanPath.startsWith('/berita'))}
            >
              Berita
              {activeIndicator(cleanPath.startsWith('/berita'))}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-expanded={infoDropdownOpen}
                aria-haspopup="menu"
                onClick={() => setInfoDropdownOpen((v) => !v)}
                className={navLinkClass(isInfoActive || infoDropdownOpen)}
              >
                Informasi
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${infoDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
                {activeIndicator(isInfoActive)}
              </button>
              {infoDropdownOpen && (
                <div
                  role="menu"
                  className="animate-menu-down absolute left-0 top-full mt-2 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1.5 z-50"
                >
                  {[
                    { label: 'Pemerintahan Desa', to: '/pemerintahan' },
                    { label: 'Statistik Desa', to: '/statistik' },
                    { label: 'Pengumuman', to: '/pengumuman' },
                    { label: 'Potensi Desa', to: '/potensi' },
                    { label: 'Agenda Kegiatan', to: '/agenda' },
                    { label: 'Galeri Foto', to: '/galeri' },
                  ].map((item) => {
                    const active = cleanPath === item.to;
                    return (
                      <button
                        key={item.to}
                        role="menuitem"
                        type="button"
                        onClick={() => go(item.to)}
                        className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-[0.98] ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:pl-4'
                        }`}
                      >
                        <span>{item.label}</span>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="button" onClick={() => go('/kontak')} className={navLinkClass(cleanPath === '/kontak')}>
              Kontak
              {activeIndicator(cleanPath === '/kontak')}
            </button>
          </nav>

          {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => go('/pelayanan')}
              className={`hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 ${
                cleanPath === '/pelayanan' ? 'ring-2 ring-amber-400/90 ring-offset-2 dark:ring-offset-slate-950' : ''
              }`}
            >
              Pelayanan
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="animate-menu-down lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto shadow-lg">
            {[
              { label: 'Beranda', to: '/' },
              { label: 'Profil Desa', to: '/profil' },
              { label: 'Pemerintahan Desa', to: '/pemerintahan' },
              { label: 'Berita Desa', to: '/berita' },
              { label: 'Pengumuman', to: '/pengumuman' },
              { label: 'Statistik Desa', to: '/statistik' },
              { label: 'Pelayanan Desa Online', to: '/pelayanan' },
              { label: 'Potensi Desa', to: '/potensi' },
              { label: 'Agenda Kegiatan', to: '/agenda' },
              { label: 'Galeri Foto', to: '/galeri' },
              { label: 'Kontak & Peta Desa', to: '/kontak' },
            ].map((item) => {
              const active = item.to === '/berita' ? cleanPath.startsWith('/berita') : cleanPath === item.to;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => go(item.to)}
                  className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                    active
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />}
                </button>
              );
            })}
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchModalOpen(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]"
              >
                <Search className="w-4 h-4" />
                Cari
              </button>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {darkMode ? 'Mode Terang' : 'Mode Gelap'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Secondary Utility Strip (Global Search + Theme + Quick Links) */}
      <div className="bg-emerald-950 text-emerald-50 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-emerald-200/90 truncate">
            Dusun Wanasari RT.003/RW.003 · Desa Pinangsari · Kec. Ciasem · Kab. Subang · Jawa Barat
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-amber-300 transition-all duration-150 active:scale-[0.97] whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              Pencarian Global
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-amber-300 transition-all duration-150 active:scale-[0.97] whitespace-nowrap"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" aria-hidden="true" /> : <Moon className="w-3.5 h-3.5" aria-hidden="true" />}
              {darkMode ? 'Terang' : 'Gelap'}
            </button>
            <button
              type="button"
              onClick={() => go('/admin/login')}
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium transition-all duration-150 active:scale-[0.97] whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              Admin Desa
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main key={cleanPath} className="flex-1 animate-page-enter">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-50 border-t border-emerald-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h2 className="text-lg font-display font-bold tracking-wide text-white">DESA PINANGSARI</h2>
            <p className="mt-3 text-sm text-emerald-200/85 leading-relaxed">
              Dusun Wanasari RT.003/RW.003
              <br />
              Desa Pinangsari
              <br />
              Kecamatan Ciasem
              <br />
              Kabupaten Subang
              <br />
              Jawa Barat
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-400">Navigasi Portal</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-emerald-100/90">
              {[
                { label: 'Beranda', to: '/' },
                { label: 'Profil Desa', to: '/profil' },
                { label: 'Pemerintahan', to: '/pemerintahan' },
                { label: 'Berita Desa', to: '/berita' },
                { label: 'Pengumuman', to: '/pengumuman' },
                { label: 'Statistik Desa', to: '/statistik' },
                { label: 'Pelayanan Online', to: '/pelayanan' },
                { label: 'Potensi Desa', to: '/potensi' },
                { label: 'Agenda Desa', to: '/agenda' },
                { label: 'Galeri Foto', to: '/galeri' },
                { label: 'Kontak', to: '/kontak' },
                { label: 'Login Admin', to: '/admin/login' },
              ].map((l) => (
                <button
                  key={l.to}
                  type="button"
                  onClick={() => go(l.to)}
                  className="text-left hover:text-amber-300 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-400">Kontak & Media Sosial</h3>
            <div className="mt-3 space-y-1.5 text-sm text-emerald-100/90">
              <p>Telepon: {pengaturan?.telepon || 'Data belum tersedia'}</p>
              <p>WhatsApp: {pengaturan?.whatsapp || 'Data belum tersedia'}</p>
              <p>Email: {pengaturan?.email || 'Data belum tersedia'}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={pengaturan?.facebook_url || '#'}
                onClick={(e) => {
                  if (!pengaturan?.facebook_url) {
                    e.preventDefault();
                    go('/kontak');
                  }
                }}
                target={pengaturan?.facebook_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-xs text-white transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
                Facebook
              </a>
              <a
                href={pengaturan?.instagram_url || '#'}
                onClick={(e) => {
                  if (!pengaturan?.instagram_url) {
                    e.preventDefault();
                    go('/kontak');
                  }
                }}
                target={pengaturan?.instagram_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-xs text-white transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                Instagram
              </a>
              <a
                href={pengaturan?.youtube_url || '#'}
                onClick={(e) => {
                  if (!pengaturan?.youtube_url) {
                    e.preventDefault();
                    go('/kontak');
                  }
                }}
                target={pengaturan?.youtube_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-xs text-white transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" aria-hidden="true" />
                YouTube
              </a>
              <button
                type="button"
                onClick={() => go('/kontak')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-xs text-white transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-300/80">
            <span>© 2026 Pemerintah Desa Pinangsari</span>
            <span>Kecamatan Ciasem, Kabupaten Subang, Jawa Barat</span>
          </div>
        </div>
      </footer>

      <BackToTop />
      <GlobalSearchModal />
    </div>
  );
}
