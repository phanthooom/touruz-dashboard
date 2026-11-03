'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '../context/AuthContext';

const PUBLIC_PATHS = ['/login', '/tma'];
const SUPERADMIN_PATHS = ['/users'];

function Splash() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-sand-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-sm shadow-primary-500/30 animate-pulse">
          <Plane size={22} className="-rotate-12" />
        </div>
        <div className="text-xs font-bold text-slate-400">TourUZ CRM</div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isSuperadmin } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const forbidden = !!user && !isSuperadmin && SUPERADMIN_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isLoading || isPublic) return;
    if (!user) {
      const next = encodeURIComponent(
        pathname + (typeof window !== 'undefined' ? window.location.search : '')
      );
      router.replace(`/login?next=${next}`);
    } else if (forbidden) {
      router.replace('/');
    }
  }, [isLoading, isPublic, user, forbidden, pathname, router]);

  if (pathname === '/login') return <>{children}</>;
  if ( !isPublic && (isLoading || !user || forbidden) ) return <Splash />;

  return (
    <>
      <div className="flex min-h-[100dvh] bg-sand-50 pb-20 lg:pb-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto min-w-0">{children}</main>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
