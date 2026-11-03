'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  ExternalLink,
  Plane,
  ShieldCheck,
  Star,
  Smartphone,
  UserCog,
  LogOut,
} from 'lucide-react';
import { B2C_URL } from '../lib/api';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { href: '/', label: 'Дашборд и Аналитика', icon: LayoutDashboard },
  { href: '/bookings', label: 'CRM Заявок (Воронка)', icon: Users },
  { href: '/tours', label: 'Управление турами', icon: Briefcase },
  { href: '/reviews', label: 'Отзывы и рейтинг', icon: Star },
  { href: '/tma', label: 'Telegram Mini App & Бот', icon: Smartphone, badge: 'FULL' },
  { href: '/settings', label: 'Профиль агентства', icon: Settings },
];

const USERS_ITEM = { href: '/users', label: 'Пользователи CRM', icon: UserCog, badge: undefined as string | undefined };

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedAgency } = useAgency();
  const { user, isSuperadmin, logout } = useAuth();
  const navItems = isSuperadmin
    ? [...NAV_ITEMS.slice(0, -1), USERS_ITEM, ...NAV_ITEMS.slice(-1)]
    : NAV_ITEMS;

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 min-h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-sm shadow-primary-500/30">
            <Plane size={20} className="-rotate-12" />
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
              Tour<span className="text-primary-500">UZ</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
                CRM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              B2B Partner & Extranet
            </p>
          </div>
        </div>

        {/* Active Mode Badge */}
        <div className="px-4 pt-4">
          <div className="p-3 rounded-2xl bg-sand-50 border border-slate-200/70">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
              Текущий кабинет
            </div>
            <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
              {selectedAgency ? (
                <>
                  <span>{selectedAgency.name}</span>
                  {selectedAgency.is_verified && (
                    <ShieldCheck size={13} className="text-primary-500 shrink-0" />
                  )}
                </>
              ) : (
                <span>Все агентства (Супер-админ)</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/25'
                    : 'text-slate-600 hover:bg-sand-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon size={17} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                {badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: current user + B2C Link */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200/80">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 font-extrabold text-xs flex items-center justify-center shrink-0">
              {(user.full_name || user.email)[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{user.full_name || user.email}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {isSuperadmin ? 'Супер-админ' : `Менеджер · ${user.agency_name || ''}`}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
        <a
          href={`${B2C_URL}/ru/tours?tma=1&fullscreen=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 rounded-2xl bg-sand-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all"
        >
          <span>Витрина TourUZ (Mini App)</span>
          <ExternalLink size={14} className="text-slate-500" />
        </a>
        <div className="text-[11px] text-center text-slate-400">
          Синхронизировано с API :8000
        </div>
      </div>
    </aside>
  );
}
