import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost, setCsrfToken } from '../lib/api';
import type {
  AgendaDesa,
  Berita,
  PengaturanDesa,
  Pengumuman,
  PotensiDesa,
  ProfilDesa,
  StatistikSummary,
  UserAccount,
} from '../types/village';

interface BootstrapData {
  profil: ProfilDesa | null;
  pengaturan: PengaturanDesa | null;
  stats: StatistikSummary | null;
  pengumumanPenting: Pengumuman[];
  beritaTerbaru: Berita[];
  agendaTerdekat: AgendaDesa[];
  potensiUnggulan: PotensiDesa[];
  mapsApiKey: string;
}

interface AppContextValue {
  path: string;
  navigate: (to: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  bootstrap: BootstrapData;
  loadingBootstrap: boolean;
  refreshBootstrap: () => Promise<void>;
  user: UserAccount | null;
  authChecked: boolean;
  refreshAuth: () => Promise<void>;
  setAuthSession: (user: UserAccount | null, csrfToken?: string) => void;
  logout: () => Promise<void>;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(() => (window.location.pathname || '/') + (window.location.search || ''));
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pinangsari_theme');
    return saved === 'dark';
  });
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [bootstrap, setBootstrap] = useState<BootstrapData>({
    profil: null,
    pengaturan: null,
    stats: null,
    pengumumanPenting: [],
    beritaTerbaru: [],
    agendaTerdekat: [],
    potensiUnggulan: [],
    mapsApiKey: '',
  });
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('pinangsari_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pinangsari_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const onPopState = () => {
      setPath((window.location.pathname || '/') + (window.location.search || ''));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      const data = await apiGet<BootstrapData>('/api/public/bootstrap');
      setBootstrap(data);
    } catch {
      // Keep current state if transient failure
    } finally {
      setLoadingBootstrap(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await apiGet<{ authenticated?: boolean; user: UserAccount | null; csrfToken?: string }>('/api/auth/me');
      if (data.authenticated && data.user) {
        setUser(data.user);
        setCsrfToken(data.csrfToken || '');
      } else {
        setUser(null);
        setCsrfToken('');
      }
    } catch {
      setUser(null);
      setCsrfToken('');
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
    refreshAuth();
  }, [refreshBootstrap, refreshAuth]);

  const setAuthSession = useCallback((nextUser: UserAccount | null, csrfToken = '') => {
    setUser(nextUser);
    setCsrfToken(csrfToken);
    setAuthChecked(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost('/api/auth/logout', {});
    } catch {
      // Ignore error during logout
    }
    setUser(null);
    setCsrfToken('');
    navigate('/admin/login');
  }, [navigate]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider
      value={{
        path,
        navigate,
        darkMode,
        toggleDarkMode,
        bootstrap,
        loadingBootstrap,
        refreshBootstrap,
        user,
        authChecked,
        refreshAuth,
        setAuthSession,
        logout,
        searchModalOpen,
        setSearchModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp harus digunakan di dalam AppProvider');
  return ctx;
}
