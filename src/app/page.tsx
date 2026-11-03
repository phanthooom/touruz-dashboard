'use client';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  Eye,
  DollarSign,
  Flame,
  ArrowRight,
  Phone,
  Star,
  Sparkles,
} from 'lucide-react';
import { crmApi } from '../lib/api';
import { useAgency } from '../context/AgencyContext';
import CustomSelect, { type SelectOption } from '../components/CustomSelect';

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новая', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  contacted: { label: 'В работе', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Подтверждена', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paid: { label: 'Оплачена', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled: { label: 'Отменена', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'new', label: 'Новая', dotColor: 'bg-blue-500' },
  { value: 'contacted', label: 'В работе', dotColor: 'bg-amber-500' },
  { value: 'confirmed', label: 'Подтверждена', dotColor: 'bg-emerald-500' },
  { value: 'paid', label: 'Оплачена', dotColor: 'bg-purple-500' },
  { value: 'cancelled', label: 'Отменена', dotColor: 'bg-rose-500' },
];

export default function DashboardOverviewPage() {
  const queryClient = useQueryClient();
  const { selectedAgencyId, selectedAgency } = useAgency();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['crm-overview', selectedAgencyId],
    queryFn: () => crmApi.overview(selectedAgencyId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      crmApi.updateBooking(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
      queryClient.invalidateQueries({ queryKey: ['crm-bookings'] });
    },
  });

  const st = overview?.bookings_by_status || {
    new: 0,
    contacted: 0,
    confirmed: 0,
    paid: 0,
    cancelled: 0,
  };

  return (
    <div className="space-y-6">
      {/* Apple 2026 Liquid Glass + TBC/Payme Fintech Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-6 sm:p-7 liquid-glass-hero text-white">
        <div className="absolute -right-12 -top-16 w-64 h-64 rounded-full bg-teal-400/25 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-56 h-56 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold text-teal-200">
              <Sparkles size={12} />
              <span>TourUZ Extranet • 2026 Liquid Glass Edition</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {selectedAgency
                ? `${selectedAgency.name}`
                : 'Единый Центр Туроператоров Узбекистана'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/85 max-w-2xl">
              Синхронизация туров каждые 2 часа, управление Канбан-воронкой и мгновенные лиды из Telegram Mini App
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/bookings"
              className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 text-xs font-extrabold text-white transition-all flex items-center gap-1.5"
            >
              <span>Воронка заявок ({overview?.bookings_total || 0})</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards — Apple Liquid Glass Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Активные туры</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/15 to-sky-500/15 text-teal-600 border border-white/80 flex items-center justify-center shadow-inner">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : overview?.tours_active || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <Flame size={12} className="text-rose-500 fill-rose-500" />
            <span>Горящих предложений: {overview?.tours_hot || 0}</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Заявки клиентов</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 text-amber-600 border border-white/80 flex items-center justify-center shadow-inner">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : overview?.bookings_total || 0}
          </div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">
            Новых (ждут звонка): {st.new}
          </div>
        </div>

        <div className="liquid-glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Просмотры витрины</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 border border-white/80 flex items-center justify-center shadow-inner">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : (overview?.total_views || 0).toLocaleString('ru-RU')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Переходов по карточкам туров
          </div>
        </div>

        <div className="liquid-glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Подтверждённая выручка</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-600 border border-white/80 flex items-center justify-center shadow-inner">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${isLoading ? '...' : (overview?.revenue_confirmed_usd || 0).toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Всего в воронке: ${(overview?.pipeline_value_usd || 0).toLocaleString('en-US')}
          </div>
        </div>
      </div>

      {/* Funnel Bar */}
      <div className="liquid-glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            Воронка обработки заявок (CRM Pipeline)
          </h2>
          <Link
            href="/bookings"
            className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
          >
            <span>Открыть Канбан-доску</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: 'new', title: '🆕 Новые', count: st.new, color: 'bg-blue-500' },
            { key: 'contacted', title: '📞 В работе', count: st.contacted, color: 'bg-amber-500' },
            { key: 'confirmed', title: '✅ Подтверждены', count: st.confirmed, color: 'bg-emerald-500' },
            { key: 'paid', title: '💳 Оплачены', count: st.paid, color: 'bg-purple-500' },
            { key: 'cancelled', title: '❌ Отменены', count: st.cancelled, color: 'bg-slate-400' },
          ].map((col) => (
            <div
              key={col.key}
              className="p-3.5 rounded-2xl liquid-glass-pill flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-bold text-slate-500">{col.title}</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">{col.count}</div>
              </div>
              <div className={`w-2.5 h-8 rounded-full ${col.color}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 2 Columns: Recent Leads & Top Tours */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-3 liquid-glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Последние заявки с сайта («В 1 клик»)
            </h2>
            <Link href="/bookings" className="text-xs font-bold text-teal-600 hover:underline">
              Все заявки
            </Link>
          </div>

          <div className="divide-y divide-slate-200/60">
            {overview?.recent_bookings?.length ? (
              overview.recent_bookings.map((b) => {
                const badge = STATUS_BADGES[b.status] || STATUS_BADGES.new;
                return (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          {b.client_name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {b.tour?.title || `${b.tour?.destination_city}, ${b.tour?.destination_country}`}{' '}
                        • <span className="font-bold text-slate-700">${b.total_price_usd || 0}</span> ({b.travelers_count} чел.)
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-slate-600 font-semibold">
                          <Phone size={11} /> {b.client_phone}
                        </span>
                        <span>• {b.tour?.agency?.name}</span>
                      </div>
                    </div>

                    <div className="w-40 shrink-0">
                      <CustomSelect
                        value={b.status}
                        options={STATUS_OPTIONS}
                        onChange={(newStatus) =>
                          statusMutation.mutate({ id: b.id, status: newStatus })
                        }
                        variant="compact"
                        align="right"
                        searchable={false}
                        menuWidth="w-44"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                Заявок пока нет
              </div>
            )}
          </div>
        </div>

        {/* Top Viewed Tours */}
        <div className="lg:col-span-2 liquid-glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Топ популярных туров
            </h2>
            <Link href="/tours" className="text-xs font-bold text-teal-600 hover:underline">
              Все туры
            </Link>
          </div>

          <div className="space-y-2.5">
            {overview?.top_tours?.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl liquid-glass-pill flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {t.title || `${t.destination_city}, ${t.destination_country}`}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{t.agency.name}</span>
                    {t.hotel_stars && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star size={10} fill="currentColor" /> {t.hotel_stars}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-teal-600">
                    ${t.price_usd}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                    <Eye size={10} /> {t.views_count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
