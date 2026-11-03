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
  Send,
  Star,
} from 'lucide-react';
import { crmApi } from '../lib/api';
import { useAgency } from '../context/AgencyContext';

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новая', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  contacted: { label: 'В работе', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Подтверждена', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paid: { label: 'Оплачена', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled: { label: 'Отменена', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

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
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {selectedAgency
              ? `Дашборд: ${selectedAgency.name}`
              : 'Сводный Дашборд всех туроператоров'}
          </h1>
          <p className="text-xs text-slate-500">
            Оперативная сводка по турам, просмотрам витрины и воронке клиентских заявок
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">Активные туры</span>
            <div className="w-9 h-9 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isLoading ? '...' : overview?.tours_active || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Flame size={12} className="text-rose-500" />
            <span>Горящих предложений: {overview?.tours_hot || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">Заявки клиентов</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isLoading ? '...' : overview?.bookings_total || 0}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            Новых (ждут звонка): {st.new}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">Просмотры витрины</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isLoading ? '...' : (overview?.total_views || 0).toLocaleString('ru-RU')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Переходов по карточкам туров
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">Подтверждённая выручка</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ${isLoading ? '...' : (overview?.revenue_confirmed_usd || 0).toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Всего в воронке: ${(overview?.pipeline_value_usd || 0).toLocaleString('en-US')}
          </div>
        </div>
      </div>

      {/* Funnel Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            Воронка обработки заявок (CRM Pipeline)
          </h2>
          <Link
            href="/bookings"
            className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
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
              className="p-3.5 rounded-2xl bg-sand-50 border border-slate-200/60 flex items-center justify-between"
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
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Последние заявки с сайта («В 1 клик»)
            </h2>
            <Link href="/bookings" className="text-xs font-bold text-primary-500 hover:underline">
              Все заявки
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
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

                    <select
                      value={b.status}
                      onChange={(e) =>
                        statusMutation.mutate({ id: b.id, status: e.target.value })
                      }
                      className="text-[11px] font-bold bg-sand-100 rounded-full px-3 py-1.5 border border-slate-200 cursor-pointer shrink-0"
                    >
                      <option value="new">Новая</option>
                      <option value="contacted">В работе</option>
                      <option value="confirmed">Подтверждена</option>
                      <option value="paid">Оплачена</option>
                      <option value="cancelled">Отменена</option>
                    </select>
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
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Топ популярных туров
            </h2>
            <Link href="/tours" className="text-xs font-bold text-primary-500 hover:underline">
              Все туры
            </Link>
          </div>

          <div className="space-y-3">
            {overview?.top_tours?.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl bg-sand-50 border border-slate-200/60 flex items-center justify-between gap-3"
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
                  <div className="text-xs font-extrabold text-primary-600">
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
