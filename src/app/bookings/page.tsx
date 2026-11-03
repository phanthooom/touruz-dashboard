'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  LayoutGrid,
  List,
  Phone,
  Send,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { crmApi, type Booking } from '../../lib/api';
import { useAgency } from '../../context/AgencyContext';
import CustomSelect, { type SelectOption } from '../../components/CustomSelect';
import PaymentLinkButton from '../../components/PaymentLinkButton';

const COLUMNS = [
  { key: 'new', title: '🆕 Новые', color: 'border-t-blue-500' },
  { key: 'contacted', title: '📞 В работе', color: 'border-t-amber-500' },
  { key: 'confirmed', title: '✅ Подтверждены', color: 'border-t-emerald-500' },
  { key: 'paid', title: '💳 Оплачены', color: 'border-t-purple-500' },
  { key: 'cancelled', title: '❌ Отменены', color: 'border-t-slate-400' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'new', label: 'Новая', dotColor: 'bg-blue-500' },
  { value: 'contacted', label: 'В работе', dotColor: 'bg-amber-500' },
  { value: 'confirmed', label: 'Подтверждена', dotColor: 'bg-emerald-500' },
  { value: 'paid', label: 'Оплачена', dotColor: 'bg-purple-500' },
  { value: 'cancelled', label: 'Отменена', dotColor: 'bg-rose-500' },
];

export default function CRMBookingsPage() {
  const queryClient = useQueryClient();
  const { selectedAgencyId } = useAgency();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['crm-bookings', selectedAgencyId, search],
    queryFn: () => crmApi.bookings({ agency_id: selectedAgencyId, q: search }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      manager_notes,
    }: {
      id: number;
      status?: string;
      manager_notes?: string;
    }) => crmApi.updateBooking(id, { status, manager_notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
      setEditingNoteId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
    },
  });

  const renderCard = (b: Booking) => (
    <div
      key={b.id}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2.5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-extrabold text-slate-900">{b.client_name}</div>
          <a
            href={`tel:${b.client_phone}`}
            className="text-[11px] font-bold text-primary-600 flex items-center gap-1 mt-0.5 hover:underline"
          >
            <Phone size={11} />
            <span>{b.client_phone}</span>
          </a>
        </div>
        <button
          onClick={() => deleteMutation.mutate(b.id)}
          className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
          title="Удалить заявку"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="p-2.5 rounded-xl bg-sand-50 border border-slate-100 text-[11px] space-y-1">
        <div className="font-bold text-slate-800 line-clamp-2">
          {b.tour?.title || `${b.tour?.destination_city}, ${b.tour?.destination_country}`}
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>{b.travelers_count} туриста</span>
          <span className="font-extrabold text-emerald-600">
            ${b.total_price_usd || 0}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          Агентство: {b.tour?.agency?.name}
        </div>
      </div>

      {b.comment && (
        <p className="text-[11px] text-slate-600 italic bg-amber-50/60 px-2.5 py-1.5 rounded-lg">
          «{b.comment}»
        </p>
      )}

      {/* Manager Notes */}
      {editingNoteId === b.id ? (
        <div className="space-y-1.5">
          <textarea
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Заметка менеджера..."
            className="w-full rounded-xl border border-slate-200 p-2 text-[11px]"
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setEditingNoteId(null)}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold"
            >
              Отмена
            </button>
            <button
              onClick={() =>
                updateMutation.mutate({ id: b.id, manager_notes: noteText })
              }
              className="px-2.5 py-1 rounded-full bg-primary-500 text-white text-[10px] font-bold"
            >
              Сохранить
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setEditingNoteId(b.id);
            setNoteText(b.manager_notes || '');
          }}
          className="w-full text-left text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          <MessageSquare size={11} />
          <span className="truncate">
            {b.manager_notes || 'Добавить заметку менеджера...'}
          </span>
        </button>
      )}

      {/* Custom Status Selector */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <CustomSelect
          value={b.status}
          options={STATUS_OPTIONS}
          onChange={(newStatus) =>
            updateMutation.mutate({ id: b.id, status: newStatus })
          }
          variant="compact"
          searchable={false}
          menuWidth="w-44"
          className="flex-1"
        />

        <a
          href={`https://t.me/+${b.client_phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Открыть Telegram клиента"
        >
          <Send size={12} />
        </a>
      </div>

      {/* Payme / Click / Uzum */}
      <PaymentLinkButton booking={b} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            CRM Воронка заявок ({bookings.length})
          </h1>
          <p className="text-xs text-slate-500">
            Все обращения туристов («В 1 клик» и заявки на бронирование с витрины TourUZ)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Поиск по имени или телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium w-60"
            />
          </div>

          <div className="bg-white p-1 rounded-full border border-slate-200 flex items-center">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === 'kanban'
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Канбан</span>
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === 'table'
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={13} />
              <span>Таблица</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Загрузка заявок...
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colItems = bookings.filter((b) => b.status === col.key);
            return (
              <div
                key={col.key}
                className={`bg-sand-100/80 rounded-3xl p-3.5 border border-slate-200/70 border-t-4 ${col.color} space-y-3`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {col.title}
                  </span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-sm">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colItems.length ? (
                    colItems.map(renderCard)
                  ) : (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      Пусто
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm pb-16">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sand-50 border-b border-slate-200/80 text-slate-500 font-bold">
                <th className="p-4 rounded-tl-3xl">Клиент</th>
                <th className="p-4">Телефон</th>
                <th className="p-4">Тур / Направление</th>
                <th className="p-4">Туроператор</th>
                <th className="p-4">Сумма</th>
                <th className="p-4 rounded-tr-3xl">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-sand-50/60">
                  <td className="p-4 font-bold text-slate-900">
                    {b.client_name}
                    {b.comment && (
                      <div className="text-[11px] text-slate-400 font-normal">
                        {b.comment}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-primary-600">
                    {b.client_phone}
                  </td>
                  <td className="p-4 text-slate-700 font-medium max-w-xs truncate">
                    {b.tour?.title || `${b.tour?.destination_city}, ${b.tour?.destination_country}`}
                  </td>
                  <td className="p-4 text-slate-500">{b.tour?.agency?.name}</td>
                  <td className="p-4 font-extrabold text-emerald-600">
                    ${b.total_price_usd || 0} ({b.travelers_count} чел.)
                  </td>
                  <td className="p-4 w-44">
                    <CustomSelect
                      value={b.status}
                      options={STATUS_OPTIONS}
                      onChange={(newStatus) =>
                        updateMutation.mutate({ id: b.id, status: newStatus })
                      }
                      variant="compact"
                      align="right"
                      searchable={false}
                      menuWidth="w-44"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
