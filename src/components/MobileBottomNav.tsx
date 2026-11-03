'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  PlaneTakeoff,
  Settings,
} from 'lucide-react';

const MOBILE_ITEMS = [
  { href: '/', label: 'Сводка', icon: LayoutDashboard },
  { href: '/bookings', label: 'Заявки', icon: KanbanSquare },
  { href: '/tours', label: 'Туры', icon: PlaneTakeoff },
  { href: '/settings', label: 'Бот & Настр.', icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {MOBILE_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
              active
                ? 'text-primary-600 bg-primary-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
