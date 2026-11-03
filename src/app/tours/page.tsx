'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Flame,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { crmApi, type Tour } from '../../lib/api';
import { useAgency } from '../../context/AgencyContext';
import TourFormModal from '../../components/TourFormModal';

export default function CRMToursPage() {
  const queryClient = useQueryClient();
  const { selectedAgencyId } = useAgency();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filterHot, setFilterHot] = useState<boolean | undefined>(undefined);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['crm-tours', selectedAgencyId, q, page, filterHot],
    queryFn: () =>
      crmApi.tours({
        agency_id: selectedAgencyId,
        q,
        is_hot: filterHot,
        page,
        size: 20,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number;
      patch: { is_active?: boolean; is_hot?: boolean; price_usd?: number };
    }) => crmApi.updateTour(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tours'] });
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteTour(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tours'] });
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
      queryClient.invalidateQueries({ queryKey: ['crm-agencies'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Управление турами ({data?.total || 0})
          </h1>
          <p className="text-xs text-slate-500">
            Редактирование цен, статусов «Горящий 🔥» и видимости на клиентской витрине TourUZ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Страна, город или отель..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium w-60"
            />
          </div>

          <button
            onClick={() =>
              setFilterHot((prev) => (prev === true ? undefined : true))
            }
            className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filterHot
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-sand-100'
            }`}
          >
            <Flame size={13} />
            <span>Только горящие</span>
          </button>

          <button
            onClick={() => {
              setEditingTour(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary-500/25"
          >
            <Plus size={14} />
            <span>Новый тур</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sand-50 border-b border-slate-200/80 text-slate-500 font-bold">
                <th className="p-4">Тур и Отель</th>
                <th className="p-4">Направление</th>
                <th className="p-4">Туроператор</th>
                <th className="p-4">Цена ($ USD)</th>
                <th className="p-4">Горящий 🔥</th>
                <th className="p-4">На витрине</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    Загрузка каталога туров...
                  </td>
                </tr>
              ) : (
                data?.items?.map((t) => (
                  <tr key={t.id} className="hover:bg-sand-50/60">
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">
                        {t.title || t.hotel_name || 'Турпакет'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{t.nights || 7} ночей</span>
                        <span>• {t.meal_type}</span>
                        <span className="flex items-center gap-0.5">
                          <Eye size={11} /> {t.views_count}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-800">
                        {t.destination_city || t.destination_country}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Вылет: {t.departure_city}
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 font-medium">
                      {t.agency?.name}
                    </td>

                    <td className="p-4">
                      <span className="text-sm font-extrabold text-primary-600">
                        ${t.price_usd}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: t.id,
                            patch: { is_hot: !t.is_hot },
                          })
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                          t.is_hot
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Flame size={12} />
                        <span>{t.is_hot ? 'Горящий' : 'Обычный'}</span>
                      </button>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: t.id,
                            patch: { is_active: !t.is_active },
                          })
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                          t.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {t.is_active ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Опубликован</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Скрыт</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTour(t);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-full bg-sand-100 hover:bg-primary-50 text-slate-600 hover:text-primary-600"
                          title="Редактировать"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(t.id)}
                          className="p-2 rounded-full bg-sand-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Страница {data.page} из {data.pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-full bg-sand-100 disabled:opacity-40 font-bold"
              >
                Назад
              </button>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-full bg-sand-100 disabled:opacity-40 font-bold"
              >
                Далее
              </button>
            </div>
          </div>
        )}
      </div>

      <TourFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTour={editingTour}
      />
    </div>
  );
}
