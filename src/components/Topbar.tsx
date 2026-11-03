'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, RefreshCw, Globe, Smartphone, LogOut, ShieldCheck } from 'lucide-react';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import TourFormModal from './TourFormModal';
import CustomSelect, { type SelectOption } from './CustomSelect';

export default function Topbar() {
  const queryClient = useQueryClient();
  const { agencies, selectedAgencyId, setSelectedAgencyId, selectedAgency } = useAgency();
  const { isSuperadmin, user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [safeTop, setSafeTop] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tg = (window as any).Telegram?.WebApp;
    const isTma = params.get('tma') === '1' || Boolean(tg?.initData);
    const isFs = params.get('fullscreen') !== '0';

    if (isTma) {
      try {
        tg?.ready?.();
        tg?.expand?.();
        tg?.disableVerticalSwipes?.();
        if (isFs) tg?.requestFullscreen?.();
      } catch {}
      const top =
        (tg?.safeAreaInset?.top || 0) + (tg?.contentSafeAreaInset?.top || 0) ||
        (isFs ? 86 : 0);
      const bottom = tg?.safeAreaInset?.bottom || (isFs ? 20 : 0);
      setSafeTop(top);
      document.documentElement.style.setProperty('--tma-safe-top', `${top}px`);
      document.documentElement.style.setProperty('--tma-safe-bottom', `${bottom}px`);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 500);
  };

  const agencyOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: 'Все туроператоры',
        badge: `${agencies.length}`,
        icon: <Globe size={14} />,
      },
      ...agencies.map((a) => ({
        value: String(a.id),
        label: a.name,
        badge: `${a.tours_count || 0} туров`,
        dotColor: a.is_verified ? 'bg-primary-500' : 'bg-slate-400',
      })),
    ],
    [agencies]
  );

  return (
    <>
      <header
        className="liquid-glass-topbar px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-[padding] duration-200"
        style={{
          paddingTop: safeTop ? `${safeTop}px` : 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="h-14 sm:h-16 w-full flex items-center justify-between gap-2 min-w-0">
          {/* Left: Agency Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
              <Building2 size={16} className="text-primary-500" />
              <span className="hidden md:inline">Туроператор:</span>
            </div>

            <div className="min-w-0 max-w-[190px] sm:max-w-xs">
              {!isSuperadmin ? (
                <div className="px-3.5 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                  <span className="truncate">{selectedAgency?.name || user?.agency_name || 'Моё агентство'}</span>
                  {selectedAgency?.is_verified && <ShieldCheck size={13} className="text-primary-500 shrink-0" />}
                </div>
              ) : (
              <CustomSelect
                value={selectedAgencyId === null ? 'all' : String(selectedAgencyId)}
                options={agencyOptions}
                onChange={(val) =>
                  setSelectedAgencyId(val === 'all' ? null : Number(val))
                }
                variant="pill"
                searchable={true}
                searchPlaceholder="Найти туроператора..."
                menuWidth="w-72"
              />
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href="/tma"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 text-xs font-bold transition-all"
              title="Открыть студию Telegram Mini App (Fullscreen)"
            >
              <Smartphone size={14} />
              <span>Mini App</span>
            </Link>

            <button
              onClick={handleRefresh}
              className="p-2 sm:p-2.5 rounded-full bg-sand-100 hover:bg-slate-200/70 text-slate-600 transition-all"
              title="Обновить данные"
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin text-primary-500' : ''}
              />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 sm:px-4 py-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-sm shadow-primary-500/25 flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={15} />
              <span className="hidden xs:inline sm:inline">Добавить тур</span>
            </button>

            <button
              onClick={logout}
              className="lg:hidden p-2 rounded-full bg-sand-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-all"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <TourFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTour={null}
      />
    </>
  );
}
