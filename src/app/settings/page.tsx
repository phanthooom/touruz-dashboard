'use client';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  CheckCircle2,
  ShieldCheck,
  Send,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { crmApi, B2C_URL } from '../../lib/api';
import { useAgency } from '../../context/AgencyContext';
import CustomSelect, { type SelectOption } from '../../components/CustomSelect';

export default function AgencySettingsPage() {
  const queryClient = useQueryClient();
  const { agencies, selectedAgency, setSelectedAgencyId } = useAgency();

  const current = selectedAgency || agencies[0] || null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  // Telegram Bot & Mini App state
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [callbackSuccess, setCallbackSuccess] = useState<string | null>(null);

  const agencyOptions: SelectOption[] = useMemo(
    () =>
      agencies.map((a) => ({
        value: String(a.id),
        label: a.name,
        badge: `${a.tours_count || 0} туров`,
        dotColor: a.is_verified ? 'bg-primary-500' : 'bg-slate-400',
      })),
    [agencies]
  );

  useEffect(() => {
    if (current) {
      setName(current.name || '');
      setPhone(current.phone || '');
      setTelegram(current.telegram_username || '');
      setWebsite(current.website_url || '');
      setDescription(current.description || '');
      setIsVerified(current.is_verified);
    }
  }, [current]);

  const { data: botFeed = [] } = useQuery({
    queryKey: ['crm-telegram-feed'],
    queryFn: () => crmApi.telegramFeed(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      crmApi.updateAgency(current!.id, {
        name,
        phone,
        telegram_username: telegram,
        website_url: website,
        description,
        is_verified: isVerified,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-agencies'] });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    },
  });

  const testBotMutation = useMutation({
    mutationFn: () =>
      crmApi.telegramTest({
        bot_token: botToken,
        chat_id: chatId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-telegram-feed'] });
    },
  });

  const callbackMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: string }) =>
      crmApi.telegramCallbackSimulate(bookingId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['crm-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
      setCallbackSuccess(`Заявка #${vars.bookingId} переведена в статус «${vars.status}»!`);
      setTimeout(() => setCallbackSuccess(null), 3000);
    },
  });

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!current) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Загрузка данных агентства...
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Agency Profile */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Профиль и настройки агентства
          </h1>
          <p className="text-xs text-slate-500">
            Контактные данные туроператора и интеграция с Telegram Mini App
          </p>
        </div>

        {!selectedAgency && (
          <div className="p-4 rounded-2xl bg-primary-50/70 border border-primary-100 text-xs text-primary-800 flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">
              Выберите агентство для редактирования:
            </span>
            <CustomSelect
              value={String(current.id)}
              options={agencyOptions}
              onChange={(val) => setSelectedAgencyId(Number(val))}
              variant="pill"
              align="right"
              searchable={true}
              searchPlaceholder="Найти агентство..."
              menuWidth="w-64"
            />
          </div>
        )}

        {savedNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Профиль агентства успешно обновлён!</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-xs"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 font-extrabold text-lg flex items-center justify-center">
              {current.name[0]}
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>{current.name}</span>
                {isVerified && <ShieldCheck size={16} className="text-primary-500" />}
              </div>
              <div className="text-slate-400">Slug: {current.slug}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Название бренда
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Телефон отдела продаж
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Telegram канал / менеджер
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Официальный сайт
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Описание туроператора
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Информация о лицензии, направлениях и преимуществах..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 rounded text-primary-500"
            />
            <span>Верифицированный партнёр TourUZ (синяя галочка)</span>
          </label>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-primary-500/25"
            >
              <Save size={14} />
              <span>{mutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Telegram Mini App & Bot Notification Center */}
      <div className="lg:col-span-6 space-y-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Telegram Mini App & Бот уведомлений
                </h2>
                <p className="text-slate-400">
                  Гибридный режим: Веб-сайт + Telegram WebApp (2-в-1)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px]">
              SDK Активен
            </span>
          </div>

          {/* Mini App Ready URLs */}
          <div className="p-3.5 rounded-2xl bg-sand-50 border border-slate-200/70 space-y-2.5">
            <div className="font-bold text-slate-700">
              Ссылки для запуска в режиме Telegram Mini App (и для @BotFather):
            </div>

            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-400">
                  1. Клиентская витрина (Туры + автозаполнение ТГ-профиля):
                </div>
                <div className="font-mono font-bold text-slate-800 truncate">
                  {B2C_URL}/ru/tours?tma=1
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => copyText('b2c', `${B2C_URL}/ru/tours?tma=1`)}
                  className="p-1.5 rounded-lg bg-sand-100 hover:bg-slate-200 text-slate-600"
                  title="Скопировать ссылку"
                >
                  {copiedKey === 'b2c' ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <a
                  href={`${B2C_URL}/ru/tours?tma=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600"
                  title="Открыть предпросмотр Mini App"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-400">
                  2. Мобильный CRM-кабинет менеджера (Mini App):
                </div>
                <div className="font-mono font-bold text-slate-800 truncate">
                  http://localhost:3003/bookings?tma=1
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    copyText('crm', 'http://localhost:3003/bookings?tma=1')
                  }
                  className="p-1.5 rounded-lg bg-sand-100 hover:bg-slate-200 text-slate-600"
                  title="Скопировать ссылку"
                >
                  {copiedKey === 'crm' ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Bot Token & Chat ID */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Telegram Bot Token (опционально)
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Chat ID менеджера / группы
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-100123456789 или 998001"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => testBotMutation.mutate()}
            disabled={testBotMutation.isPending}
            className="w-full py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm shadow-sky-500/25 transition-all"
          >
            <Send size={14} />
            <span>
              {testBotMutation.isPending
                ? 'Отправка...'
                : 'Отправить тестовое уведомление о заявке в Telegram'}
            </span>
          </button>

          {callbackSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-center">
              {callbackSuccess}
            </div>
          )}

          {/* Live Telegram Bot Feed & Interactive Inline Buttons Simulator */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span>Последние уведомления Telegram-бота:</span>
              <span className="text-[10px] text-slate-400">
                Интерактивные кнопки меняют статус в CRM
              </span>
            </div>

            {botFeed.length === 0 ? (
              <div className="p-6 rounded-2xl bg-sand-50 text-center text-slate-400">
                Нажмите кнопку выше или оставьте заявку «В 1 клик» на сайте, чтобы увидеть карточку Telegram-бота
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {botFeed.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl bg-[#18222d] text-white space-y-2.5 shadow-md"
                  >
                    <div className="text-[11px] leading-relaxed space-y-0.5">
                      <div className="font-bold text-sky-400">
                        🔥 TourUZ CRM — Заявка #{msg.booking_id}
                      </div>
                      <div>👤 Клиент: {msg.client_name}</div>
                      <div>📱 Телефон: {msg.client_phone}</div>
                      <div>✈️ Тур: {msg.tour_title}</div>
                      <div>🏢 Туроператор: {msg.agency_name}</div>
                      <div className="text-emerald-400 font-bold">
                        💰 Сумма: ${msg.total_price_usd}
                      </div>
                    </div>

                    {/* Telegram Inline Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          callbackMutation.mutate({
                            bookingId: msg.booking_id,
                            status: 'contacted',
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold transition-colors"
                      >
                        📞 Взять в работу
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          callbackMutation.mutate({
                            bookingId: msg.booking_id,
                            status: 'confirmed',
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold transition-colors"
                      >
                        ✅ Подтвердить
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          callbackMutation.mutate({
                            bookingId: msg.booking_id,
                            status: 'paid',
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold transition-colors"
                      >
                        💳 Оплачено
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          callbackMutation.mutate({
                            bookingId: msg.booking_id,
                            status: 'cancelled',
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold transition-colors"
                      >
                        ❌ Отменить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
