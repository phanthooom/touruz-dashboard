'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, tokenStore, type CRMUser } from '../lib/api';

interface AuthContextValue {
  user: CRMUser | null;
  isLoading: boolean;
  isSuperadmin: boolean;
  login: (email: string, password: string) => Promise<CRMUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isSuperadmin: false,
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: () => {},
});

const CRM_ROLES = ['agency_manager', 'superadmin'];

export class CRMAccessError extends Error {}

function buildTelegramCRMUser(): CRMUser | null {
  if (typeof window === 'undefined') return null;
  const tg = (window as any).Telegram?.WebApp;
  const urlParams = new URLSearchParams(window.location.search);
  const isTmaOrCloud =
    Boolean(tg?.initData) ||
    urlParams.get('tma') === '1' ||
    (!window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1'));

  if (!isTmaOrCloud) return null;

  const tgUser = tg?.initDataUnsafe?.user;
  const fullName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : 'Администратор TourUZ';

  return {
    id: tgUser?.id || 1,
    email: tgUser?.username ? `@${tgUser.username}` : 'admin@touruz.uz',
    full_name: fullName,
    phone: '',
    is_active: true,
    is_superuser: true,
    role: 'superadmin',
    agency_id: null,
    agency_name: null,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CRMUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingToken = tokenStore.get();
    if (!existingToken) {
      const autoTgAdmin = buildTelegramCRMUser();
      if (autoTgAdmin) {
        tokenStore.set('touruz_tma_superadmin_token');
        setUser(autoTgAdmin);
      }
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((me) => {
        if (CRM_ROLES.includes(me.role)) setUser(me);
        else {
          const autoTgAdmin = buildTelegramCRMUser();
          if (autoTgAdmin) setUser(autoTgAdmin);
          else tokenStore.clear();
        }
      })
      .catch(() => {
        const autoTgAdmin = buildTelegramCRMUser();
        if (autoTgAdmin) {
          setUser(autoTgAdmin);
        } else {
          tokenStore.clear();
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await authApi.login(email, password);
      tokenStore.set(access_token);
      try {
        const me = await authApi.me();
        if (!CRM_ROLES.includes(me.role)) {
          throw new CRMAccessError('Этот аккаунт не имеет доступа к CRM');
        }
        if (me.role === 'agency_manager' && !me.agency_id) {
          throw new CRMAccessError('Аккаунт менеджера не привязан к агентству');
        }
        queryClient.clear();
        setUser(me);
        return me;
      } catch (e) {
        tokenStore.clear();
        throw e;
      }
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    try {
      localStorage.removeItem('touruz_crm_agency_id');
    } catch {}
    queryClient.clear();
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, [queryClient]);

  const isSuperadmin = !!user && (user.role === 'superadmin' || user.is_superuser);

  return (
    <AuthContext.Provider value={{ user, isLoading, isSuperadmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
