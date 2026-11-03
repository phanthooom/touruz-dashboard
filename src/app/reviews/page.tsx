'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Search,
  Check,
  EyeOff,
  Trash2,
  MessageSquareReply,
  Clock,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import {
  reviewsApi,
  type Review,
  type ReviewSource,
  type ReviewStatusFilter,
} from '../../lib/api';
import { useAgency } from '../../context/AgencyContext';
import CustomSelect, { type SelectOption } from '../../components/CustomSelect';

const SOURCE_BADGE: Record<ReviewSource, { label: string; className: string }> = {
  site: { label: 'Сайт', className: 'bg-slate-100 text-slate-600' },
  telegram: { label: 'Telegram', className: 'bg-sky-50 text-sky-600' },
  demo: { label: 'Демо', className: 'bg-amber-50 text-amber-700' },
};

const RATING_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Любая оценка' },
  { value: '5', label: '★★★★★  5' },
  { value: '4', label: '★★★★  4' },
  { value: '3', label: '★★★  3' },
  { value: '2', label: '★★  2' },
  { value: '1', label: '★  1' },
];

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const { agencies, selectedAgencyId, setSelectedAgencyId } = useAgency();

  const [status, setStatus] = useState<ReviewStatusFilter>('pending');
  const [rating, setRating] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['crm-reviews', selectedAgencyId, status, rating, search],
    queryFn: () =>
      reviewsApi.list({
        agency_id: selectedAgencyId,
        status,
        rating: rating === 'all' ? null : Number(rating),
        q: search,
      }),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? { all: 0, pending: 0, approved: 0 };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['crm-agencies'] });
    queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; is_approved?: boolean; agency_reply?: string | null }) =>
      reviewsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setReplyingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.remove(id),
    onSuccess: () => {
      invalidate();
      setConfirmDeleteId(null);
    },
  });

  const agencyOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: 'Все агентства' },
      ...agencies.map((a) => ({
        value: String(a.id),
        label: a.name,
        badge: a.review_count ? `★ ${a.rating.toFixed(1)}` : undefined,
      })),
    ],
    [agencies]
  );

  const statusOptions: SelectOption[] = [
    { value: 'pending', label: 'На модерации', badge: String(counts.pending), dotColor: 'bg-amber-500' },
    { value: 'approved', label: 'Опубликованы', badge: String(counts.approved), dotColor: 'bg-emerald-500' },
    { value: 'all', label: 'Все отзывы', badge: String(counts.all), dotColor: 'bg-slate-400' },
  ];

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId) || null;

  const renderCard = (r: Review) => {
    const source = SOURCE_BADGE[r.source] ?? SOURCE_BADGE.site;
    const busy =
      (updateMutation.isPending && updateMutation.variables?.id === r.id) ||
      (deleteMutation.isPending && deleteMutation.variables === r.id);

    return (
      <div
        key={r.id}
        className={`bg-white rounded-3xl p-5 border shadow-sm space-y-3 transition-all ${
          r.is_approved ? 'border-slate-200/80' : 'border-amber-200 ring-1 ring-amber-100'
        } ${busy ? 'opacity-60' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 font-extrabold flex items-center justify-center shrink-0">
              {r.author_name.trim()[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 truncate">{r.author_name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars value={r.rating} size={13} />
                <span className="text-[11px] text-slate-400">{formatDate(r.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${source.className}`}>
              {source.label}
            </span>
            {r.is_approved ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={11} /> Опубликован
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                <Clock size={11} /> Модерация
              </span>
            )}
          </div>
        </div>

        {/* Context */}
        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-bold text-slate-700">{r.agency_name}</span>
          {r.tour_title && (
            <span className="flex items-center gap-1 truncate max-w-full">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{r.tour_title}</span>
            </span>
          )}
        </div>

        {/* Comment */}
        <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">{r.comment}</p>

        {/* Agency reply */}
        {replyingId === r.id ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Публичный ответ агентства — будет виден под отзывом на витрине"
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setReplyingId(null)}
                className="px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600"
              >
                Отмена
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: r.id, agency_reply: replyText })}
                className="px-3 py-1.5 rounded-full bg-primary-500 text-white text-[11px] font-bold"
              >
                Сохранить ответ
              </button>
            </div>
          </div>
        ) : r.agency_reply ? (
          <button
            onClick={() => {
              setReplyingId(r.id);
              setReplyText(r.agency_reply || '');
            }}
            className="w-full text-left p-3 rounded-2xl bg-sand-50 border border-slate-100 text-xs text-slate-600 hover:border-slate-200 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
              Ответ агентства
            </div>
            {r.agency_reply}
          </button>
        ) : null}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {r.is_approved ? (
            <button
              onClick={() => updateMutation.mutate({ id: r.id, is_approved: false })}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
            >
              <EyeOff size={13} /> Скрыть
            </button>
          ) : (
            <button
              onClick={() => updateMutation.mutate({ id: r.id, is_approved: true })}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm shadow-emerald-500/25 transition-colors"
            >
              <Check size={13} /> Одобрить
            </button>
          )}

          {replyingId !== r.id && (
            <button
              onClick={() => {
                setReplyingId(r.id);
                setReplyText(r.agency_reply || '');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-50 hover:bg-primary-100 text-primary-600 text-[11px] font-bold transition-colors"
            >
              <MessageSquareReply size={13} /> {r.agency_reply ? 'Изменить ответ' : 'Ответить'}
            </button>
          )}

          <div className="ml-auto">
            {confirmDeleteId === r.id ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Удалить навсегда?</span>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600"
                >
                  Нет
                </button>
                <button
                  onClick={() => deleteMutation.mutate(r.id)}
                  className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-bold"
                >
                  Да
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(r.id)}
                className="p-1.5 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Удалить отзыв"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Отзывы и рейтинг</h1>
          <p className="text-xs text-slate-500">
            Модерация отзывов туристов. Рейтинг агентства считается только по опубликованным отзывам.
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
            {selectedAgency ? 'Рейтинг агентства' : 'Агентство не выбрано'}
          </div>
          {selectedAgency ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {selectedAgency.review_count ? selectedAgency.rating.toFixed(1) : '—'}
              </span>
              <div>
                <Stars value={Math.round(selectedAgency.rating)} />
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selectedAgency.review_count} опубликованных
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Выберите агентство, чтобы увидеть его рейтинг.</p>
          )}
        </div>
        <button
          onClick={() => setStatus('pending')}
          className={`text-left bg-white rounded-3xl p-5 border shadow-sm transition-all ${
            status === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">На модерации</div>
          <div className="text-3xl font-extrabold text-amber-600">{counts.pending}</div>
        </button>
        <button
          onClick={() => setStatus('approved')}
          className={`text-left bg-white rounded-3xl p-5 border shadow-sm transition-all ${
            status === 'approved' ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">Опубликовано</div>
          <div className="text-3xl font-extrabold text-emerald-600">{counts.approved}</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или тексту отзыва..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            value={selectedAgencyId === null ? 'all' : String(selectedAgencyId)}
            options={agencyOptions}
            onChange={(v) => setSelectedAgencyId(v === 'all' ? null : Number(v))}
            variant="pill"
            searchable
            searchPlaceholder="Найти туроператора..."
            menuWidth="w-72"
          />
          <CustomSelect
            value={status}
            options={statusOptions}
            onChange={(v) => setStatus(v as ReviewStatusFilter)}
            variant="pill"
            searchable={false}
            menuWidth="w-56"
          />
          <CustomSelect
            value={rating}
            options={RATING_OPTIONS}
            onChange={setRating}
            variant="pill"
            searchable={false}
            align="right"
            menuWidth="w-48"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-white border border-slate-200/80 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sand-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Star size={22} />
          </div>
          <div className="text-sm font-extrabold text-slate-800">
            {status === 'pending' ? 'Нет отзывов на модерации' : 'Отзывов не найдено'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Новые отзывы с витрины TourUZ и Telegram Mini App появятся здесь.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{items.map(renderCard)}</div>
      )}
    </div>
  );
}
