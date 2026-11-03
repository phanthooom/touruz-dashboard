'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth, CRMAccessError } from '../../context/AuthContext';

function safeNext(raw: string | null) {
  // только внутренние пути, без //evil.com
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login')) return '/';
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = safeNext(params.get('next'));

  useEffect(() => {
    if (!isLoading && user) router.replace(next);
  }, [isLoading, user, next, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err: any) {
      if (err instanceof CRMAccessError) setError(err.message);
      else if (err?.response?.status === 401) setError('Неверный email или пароль');
      else if (err?.response?.status === 403) setError('Аккаунт заблокирован. Обратитесь к администратору TourUZ');
      else setError('Сервер недоступен. Проверьте, что API запущен на :8000');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center bg-sand-50 px-4 py-10"
      style={{ paddingTop: 'max(2.5rem, var(--tma-safe-top, 0px))' }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-sm shadow-primary-500/30">
            <Plane size={22} className="-rotate-12" />
          </div>
          <div>
            <div className="font-extrabold text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
              Tour<span className="text-primary-500">UZ</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
                CRM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">B2B Partner & Extranet</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4"
        >
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Вход в кабинет</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Для менеджеров турагентств и администраторов TourUZ
            </p>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</span>
            <div className="relative mt-1.5">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@agency.uz"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Пароль</span>
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-sm shadow-primary-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <LogIn size={16} />
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-5 flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} /> Доступ выдаёт администратор TourUZ
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
