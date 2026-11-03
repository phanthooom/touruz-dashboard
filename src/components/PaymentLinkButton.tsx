'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Copy, Check, FlaskConical, Send, ChevronUp, Link2 } from 'lucide-react';
import { paymentsApi, type Booking, type Payment, type PaymentProvider } from '../lib/api';
import CustomSelect, { type SelectOption } from './CustomSelect';

const PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'Клиент выберет сам' },
  { value: 'payme', label: 'Payme', dotColor: 'bg-teal-500' },
  { value: 'click', label: 'Click', dotColor: 'bg-blue-500' },
  { value: 'uzum', label: 'Uzum', dotColor: 'bg-violet-600' },
];

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

export default function PaymentLinkButton({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<string>('any');
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<Payment | null>(null);

  const { data: payments = [] } = useQuery({
    queryKey: ['crm-payments', booking.id],
    queryFn: () => paymentsApi.list(booking.id),
    enabled: open || booking.status === 'paid',
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-payments', booking.id] });
    queryClient.invalidateQueries({ queryKey: ['crm-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
  };

  const selectedProvider = provider === 'any' ? null : (provider as PaymentProvider);

  const createMutation = useMutation({
    mutationFn: () => paymentsApi.create(booking.id, selectedProvider),
    onSuccess: (p) => {
      setCreated(p);
      setCopied(false);
      invalidate();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (p: Payment) =>
      paymentsApi.confirmSandbox(booking.id, p.token, p.provider ?? selectedProvider ?? 'payme'),
    onSuccess: () => {
      setCreated(null);
      setOpen(false);
      invalidate();
    },
  });

  const paid = payments.find((p) => p.status === 'paid');

  if (booking.status === 'paid') {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-purple-50 text-[11px] font-bold text-purple-700">
        <span className="flex items-center gap-1.5">
          <CreditCard size={13} /> Оплачена
          {paid?.provider && <span className="font-medium text-purple-500 capitalize">· {paid.provider}</span>}
        </span>
        {paid && <span>{fmt(paid.amount_uzs)} сум</span>}
      </div>
    );
  }

  if (booking.status === 'cancelled' || !booking.total_price_usd) return null;

  const active = created ?? payments.find((p) => p.status === 'pending') ?? null;
  const link = active?.pay_page_url || '';

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.getElementById(`pay-link-${booking.id}`) as HTMLInputElement | null;
      el?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-primary-50 hover:bg-primary-100 text-primary-600 text-[11px] font-bold transition-colors"
      >
        <Link2 size={13} /> Ссылка на оплату
      </button>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-sand-50 border border-slate-200/80 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
          <CreditCard size={13} /> Оплата заявки
        </span>
        <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700" title="Свернуть">
          <ChevronUp size={14} />
        </button>
      </div>

      <div className="text-[11px] text-slate-500">
        К оплате:{' '}
        <span className="font-extrabold text-slate-900">
          {active ? `${fmt(active.amount_uzs)} сум` : `≈ $${booking.total_price_usd}`}
        </span>
        {active && <span className="text-slate-400"> · ${active.amount_usd} по курсу {fmt(active.exchange_rate)}</span>}
      </div>

      <div className="flex items-center gap-2">
        <CustomSelect
          value={provider}
          options={PROVIDER_OPTIONS}
          onChange={setProvider}
          variant="compact"
          searchable={false}
          menuWidth="w-52"
          className="flex-1"
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="px-3 py-1.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-[11px] font-bold whitespace-nowrap disabled:opacity-60"
        >
          {createMutation.isPending ? '...' : active ? 'Обновить' : 'Создать ссылку'}
        </button>
      </div>

      {createMutation.isError && (
        <p className="text-[11px] text-rose-500">
          {(createMutation.error as any)?.response?.data?.detail || 'Не удалось создать ссылку'}
        </p>
      )}

      {active && (
        <>
          <div className="flex items-center gap-1.5">
            <input
              id={`pay-link-${booking.id}`}
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600"
            />
            <button
              onClick={copy}
              className={`p-2 rounded-full transition-colors ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Скопировать ссылку"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Ссылка на оплату тура')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Отправить в Telegram"
            >
              <Send size={12} />
            </a>
          </div>

          {active.is_sandbox && (
            <button
              onClick={() => confirmMutation.mutate(active)}
              disabled={confirmMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold transition-colors disabled:opacity-60"
              title="Только тестовый режим: деньги не списываются"
            >
              <FlaskConical size={13} />
              {confirmMutation.isPending ? 'Проводим...' : 'Провести тестовую оплату'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
