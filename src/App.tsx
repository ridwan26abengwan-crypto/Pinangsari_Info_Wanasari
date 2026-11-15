import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/UiPrimitives';
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/public/HomePage';
import { PemerintahanPage, ProfilPage } from './pages/public/ProfilPages';
import { BeritaDetailPage, BeritaListPage, PengumumanPage } from './pages/public/BeritaPages';
import { StatistikPage } from './pages/public/StatistikPage';
import { PelayananPage } from './pages/public/PelayananPage';
import { AgendaPage, GaleriPage, KontakPage, NotFoundPage, PotensiPage } from './pages/public/ExplorePages';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminKeluargaPage, AdminPendudukPage } from './pages/admin/AdminPeoplePages';
import { AdminBeritaPage, AdminPemerintahanPage, AdminPengumumanPage, AdminProfilPage } from './pages/admin/AdminContentPages';
import { AdminAgendaPage, AdminGaleriPage, AdminPelayananPage, AdminPotensiPage } from './pages/admin/AdminOperationsPages';
import { AdminLaporanPage, AdminPengaturanPage, AdminPesanPage, AdminUsersPage } from './pages/admin/AdminSystemPages';
import { AdminDomainGuidePage } from './pages/admin/AdminDomainGuidePage';

function RouteView() {
  const { path } = useApp();
  const pathOnly = path.split('?')[0] || '/';
  const cleanPath = pathOnly !== '/' && pathOnly.endsWith('/') ? pathOnly.slice(0, -1) : pathOnly;

  // Admin routes
  if (cleanPath === '/admin/login') return <AdminLoginPage />;
  if (cleanPath === '/admin') return <AdminDashboardPage />;
  if (cleanPath === '/admin/profil') return <AdminProfilPage />;
  if (cleanPath === '/admin/pemerintahan') return <AdminPemerintahanPage />;
  if (cleanPath === '/admin/penduduk') return <AdminPendudukPage />;
  if (cleanPath === '/admin/keluarga') return <AdminKeluargaPage />;
  if (cleanPath === '/admin/berita') return <AdminBeritaPage />;
  if (cleanPath === '/admin/pengumuman') return <AdminPengumumanPage />;
  if (cleanPath === '/admin/pelayanan') return <AdminPelayananPage />;
  if (cleanPath === '/admin/potensi') return <AdminPotensiPage />;
  if (cleanPath === '/admin/agenda') return <AdminAgendaPage />;
  if (cleanPath === '/admin/galeri') return <AdminGaleriPage />;
  if (cleanPath === '/admin/pesan') return <AdminPesanPage />;
  if (cleanPath === '/admin/laporan') return <AdminLaporanPage />;
  if (cleanPath === '/admin/pengguna') return <AdminUsersPage />;
  if (cleanPath === '/admin/pengaturan') return <AdminPengaturanPage />;
  if (cleanPath === '/admin/panduan-domain') return <AdminDomainGuidePage />;

  // Public routes wrapped in PublicLayout
  const renderPublic = () => {
    if (cleanPath === '/') return <HomePage />;
    if (cleanPath === '/profil') return <ProfilPage />;
    if (cleanPath === '/pemerintahan') return <PemerintahanPage />;
    if (cleanPath === '/berita') return <BeritaListPage />;
    if (cleanPath.startsWith('/berita/')) {
      const slug = cleanPath.slice('/berita/'.length);
      return <BeritaDetailPage slug={slug} />;
    }
    if (cleanPath === '/pengumuman') return <PengumumanPage />;
    if (cleanPath === '/statistik') return <StatistikPage />;
    if (cleanPath === '/pelayanan') return <PelayananPage />;
    if (cleanPath === '/potensi') return <PotensiPage />;
    if (cleanPath === '/agenda') return <AgendaPage />;
    if (cleanPath === '/galeri') return <GaleriPage />;
    if (cleanPath === '/kontak') return <KontakPage />;
    return <NotFoundPage />;
  };

  return <PublicLayout>{renderPublic()}</PublicLayout>;
}

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        {mapsQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}
        <RouteView />
      </ToastProvider>
    </AppProvider>
  );
}
