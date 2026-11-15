import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import type { UserAccount } from '../../types/village';
import { useToast } from '../../components/UiPrimitives';

export function AdminLoginPage() {
  const { navigate, setAuthSession, user } = useApp();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCaptcha = useCallback(async () => {
    try {
      const res = await apiGet<{ id: string; question: string }>('/api/auth/captcha');
      setCaptcha(res);
      setCaptchaAnswer('');
    } catch {
      // Ignore transient load error
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/admin');
      return;
    }
    loadCaptcha();
  }, [user, navigate, loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await apiPost<{ user: UserAccount; csrfToken: string }>('/api/auth/login', {
        username,
        password,
        captchaId: captcha.id,
        captchaAnswer,
      });
      setAuthSession(res.user, res.csrfToken);
      showToast(`Selamat datang, ${res.user.nama_lengkap}`);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
      loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Website Publik
        </button>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-900 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
                Login Administrator Desa
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistem Informasi Desa Pinangsari · Kec. Ciasem, Kab. Subang
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="admin-captcha" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Verifikasi Keamanan
              </label>
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0 tabular-nums">
                  {captcha ? captcha.question : '...'}
                </div>
                <input
                  id="admin-captcha"
                  type="text"
                  required
                  inputMode="numeric"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Hasil"
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={loadCaptcha}
                  aria-label="Muat ulang captcha"
                  className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              {submitting ? 'Memverifikasi...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-semibold text-amber-700 dark:text-amber-400">
              Informasi Akun Administrator
            </div>
            <p className="leading-relaxed">
              Segera ubah password seluruh akun ini sebelum digunakan pada server produksi sebenarnya.
            </p>
            <div className="grid grid-cols-1 gap-1.5 font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>Super Admin: superadmin / Pinangsari@2026!</div>
              <div>Operator Desa: operator / Operator@2026!</div>
              <div>Kepala Desa: kades / Kades@2026!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
