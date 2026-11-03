'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  PlaneTakeoff,
  Settings,
  Star,
  Smartphone,
} from 'lucide-react';

const MOBILE_ITEMS = [
  { href: '/', label: 'Сводка', icon: LayoutDashboard },
  { href: '/bookings', label: 'Заявки', icon: KanbanSquare },
  { href: '/tours', label: 'Туры', icon: PlaneTakeoff },
  { href: '/reviews', label: 'Отзывы', icon: Star },
  { href: '/tma', label: 'Mini App', icon: Smartphone },
  { href: '/settings', label: 'Настр.', icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticIdx, setOptimisticIdx] = useState<number | null>(null);
  const [bouncingIdx, setBouncingIdx] = useState<number | null>(null);

  const routeActiveIdx = Math.max(
    0,
    MOBILE_ITEMS.findIndex((item) =>
      item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
    )
  );

  useEffect(() => {
    setOptimisticIdx(null);
  }, [pathname]);

  useEffect(() => {
    MOBILE_ITEMS.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch {
        // ignore prefetch errors
      }
    });
  }, [router]);

  const activeIndex = optimisticIdx !== null ? optimisticIdx : routeActiveIdx;

  const handleTap = (idx: number) => {
    setOptimisticIdx(idx);
    setBouncingIdx(idx);
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try {
        (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
      } catch {}
    }
    setTimeout(() => setBouncingIdx(null), 380);
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-2.5 pt-1 pointer-events-none flex justify-center"
      style={{
        paddingBottom: 'calc(0.5rem + var(--tma-safe-bottom, env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <nav
        className="pointer-events-auto relative w-full max-w-[430px] rounded-[26px] p-1.5 bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_14px_34px_-6px_rgba(15,23,42,0.16),inset_0_1.5px_2px_rgba(255,255,255,0.95)]"
        aria-label="Мобильная навигация CRM"
      >
        <div className="relative grid grid-cols-6 items-center">
          {/* Sliding Liquid Glass Bubble Indicator */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-0 p-0.5 transition-transform duration-300"
            style={{
              width: `${100 / MOBILE_ITEMS.length}%`,
              transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              willChange: 'transform',
            }}
          >
            <div
              className={`w-full h-full rounded-[20px] bg-gradient-to-b from-blue-500/20 to-blue-600/10 border border-blue-500/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_6px_16px_-3px_rgba(37,99,235,0.22)] transition-transform duration-300 ${
                bouncingIdx !== null ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>

          {MOBILE_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const active = activeIndex === idx;
            const isBouncing = bouncingIdx === idx;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onPointerDown={() => handleTap(idx)}
                className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-[20px] select-none transition-colors duration-150 ${
                  active ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div
                  className={`transition-transform duration-300 ${
                    isBouncing
                      ? '-translate-y-0.5 scale-115'
                      : active
                      ? '-translate-y-0.5 scale-105'
                      : 'scale-100'
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                </div>
                <span
                  className={`text-[9.5px] leading-none tracking-tight truncate max-w-full px-0.5 ${
                    active ? 'font-extrabold text-primary-600' : 'font-semibold text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
