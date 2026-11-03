'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Eye,
  ShieldCheck,
  Bot,
  Globe,
  Play,
  X,
  Radio,
} from 'lucide-react';
import { api, B2C_URL, crmApi, paymentsApi, type Booking } from '../../lib/api';

const LIVE_HTTPS_TUNNEL = 'https://fe52f71c7a26ab.lhr.life';

type DevicePreset = {
  id: 'iphone16pro' | 'iphone16max' | 'iphonese' | 'android' | 'full';
  name: string;
  subtitle: string;
  width: number;
  height: number;
  notch: 'dynamic-island' | 'classic' | 'punch-hole' | 'none';
  radius: string;
};

const DEVICES: DevicePreset[] = [
  {
    id: 'iphone16pro',
    name: 'iPhone 16 Pro',
    subtitle: '393×852 · Dynamic Island',
    width: 393,
    height: 830,
    notch: 'dynamic-island',
    radius: 'rounded-[50px]',
  },
  {
    id: 'iphone16max',
    name: 'iPhone 16 Pro Max',
    subtitle: '430×932 · Dynamic Island',
    width: 430,
    height: 880,
    notch: 'dynamic-island',
    radius: 'rounded-[54px]',
  },
  {
    id: 'iphonese',
    name: 'iPhone SE / Mini',
    subtitle: '375×667 · Компактный',
    width: 375,
    height: 667,
    notch: 'classic',
    radius: 'rounded-[42px]',
  },
  {
    id: 'android',
    name: 'Android Flagship',
    subtitle: '412×880 · Punch-hole',
    width: 412,
    height: 840,
    notch: 'punch-hole',
    radius: 'rounded-[38px]',
  },
  {
    id: 'full',
    name: 'Широкий Fullscreen',
    subtitle: '100% ширины · Адаптив',
    width: 0,
    height: 820,
    notch: 'dynamic-island',
    radius: 'rounded-[32px]',
  },
];

export default function TelegramMiniAppStudioPage() {
  const [device, setDevice] = useState<DevicePreset>(DEVICES[0]);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [activeApp, setActiveApp] = useState<'tours' | 'hot' | 'agencies' | 'pay' | 'crm'>('tours');
  const [payUrl, setPayUrl] = useState<string>('');
  const [loadingPay, setLoadingPay] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  // Fullscreen viewport modal launcher (when clicking "Открыть TourUZ Mini App" after /start)
  const [fullViewportOpen, setFullViewportOpen] = useState(false);
  const [botStarted, setBotStarted] = useState(true);
  const [startCommandInput, setStartCommandInput] = useState('/start');

  // Bot installer & live browser poller state
  const [botToken, setBotToken] = useState('9224583678:AAEPslnuGe-pk0sfXs3PnOAPSMMHMu5ItEU');
  const [chatId, setChatId] = useState('638384527');
  const [publicMiniAppUrl, setPublicMiniAppUrl] = useState(
    `${LIVE_HTTPS_TUNNEL}/ru/tours?tma=1&fullscreen=1`
  );
  const [buttonText, setButtonText] = useState('📱 Открыть TourUZ');
  const [installing, setInstalling] = useState(false);
  const [installNote, setInstallNote] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [browserListenerActive, setBrowserListenerActive] = useState(true);
  const [handledCount, setHandledCount] = useState(0);
  const lastUpdateIdRef = useRef<number>(0);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('touruz_tg_bot_token');
      const savedChat = localStorage.getItem('touruz_tg_chat_id');
      if (savedToken) setBotToken(savedToken);
      if (savedChat) setChatId(savedChat);
    } catch {}
  }, []);

  // Browser-side getUpdates listener: if the user enables it and has browser VPN,
  // it listens for /start sent to the bot in Telegram and immediately replies with the Fullscreen WebApp button!
  useEffect(() => {
    if (!browserListenerActive) return;
    const cleanToken = botToken.trim();
    if (!cleanToken || !cleanToken.includes(':')) return;

    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const resp = await fetch(
            `https://api.telegram.org/bot${cleanToken}/getUpdates?offset=${lastUpdateIdRef.current}&timeout=8`
          );
          if (resp.ok) {
            const json = await resp.json();
            for (const upd of json.result || []) {
              lastUpdateIdRef.current = Math.max(lastUpdateIdRef.current, upd.update_id + 1);
              const msg = upd.message;
              const txt = (msg?.text || '').trim();
              const incomingChatId = msg?.chat?.id;
              if (
                incomingChatId &&
                (txt.startsWith('/start') || txt.startsWith('/tours') || txt.startsWith('/crm'))
              ) {
                const isHttps = publicMiniAppUrl.trim().startsWith('https://');
                await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: incomingChatId,
                    parse_mode: 'HTML',
                    text:
                      '✈️ <b>Добро пожаловать в TourUZ Mini App!</b>\n\n' +
                      'Сравнивайте <b>402+ актуальных тура</b> от 27 проверенных туроператоров Узбекистана в полноэкранном режиме (Fullscreen iOS 26 / Android):\n\n' +
                      '• 🔥 Горящие туры и внутренний туризм\n' +
                      '• ⭐ Отзывы и рейтинги агентств\n' +
                      '• 💳 Онлайн-оплата Payme / Click / Uzum\n\n' +
                      '👇 Нажмите кнопку ниже, чтобы открыть Mini App на весь экран:',
                    reply_markup: {
                      inline_keyboard: [
                        [
                          isHttps
                            ? {
                                text: `🚀 ${buttonText.trim()} (Полный экран)`,
                                web_app: { url: publicMiniAppUrl.trim() },
                              }
                            : {
                                text: `🚀 ${buttonText.trim()}`,
                                url: publicMiniAppUrl.trim(),
                              },
                        ],
                      ],
                    },
                  }),
                });
                setHandledCount((c) => c + 1);
              }
            }
          }
        } catch {
          await new Promise((r) => setTimeout(r, 3000));
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [browserListenerActive, botToken, publicMiniAppUrl, buttonText]);

  const buildIframeUrl = () => {
    const fsParam = isFullscreen ? '1' : '0';
    if (activeApp === 'tours') {
      return `${B2C_URL}/ru/tours?tma=1&fullscreen=${fsParam}&frame=1`;
    }
    if (activeApp === 'hot') {
      return `${B2C_URL}/ru/tours?is_hot=true&tma=1&fullscreen=${fsParam}&frame=1`;
    }
    if (activeApp === 'agencies') {
      return `${B2C_URL}/ru/agencies?tma=1&fullscreen=${fsParam}&frame=1`;
    }
    if (activeApp === 'pay' && payUrl) {
      return `${payUrl}?tma=1&fullscreen=${fsParam}&frame=1`;
    }
    if (activeApp === 'crm') {
      return `/bookings?tma=1&fullscreen=${fsParam}&frame=1`;
    }
    return `${B2C_URL}/ru/tours?tma=1&fullscreen=${fsParam}&frame=1`;
  };

  const handleOpenPayDemo = async () => {
    setLoadingPay(true);
    try {
      const bookings = await crmApi.bookings();
      const target =
        bookings.find(
          (b: Booking) =>
            b.status !== 'paid' && b.status !== 'cancelled' && (b.total_price_usd || 0) > 0
        ) || bookings[0];
      if (target) {
        const payment = await paymentsApi.create(target.id, 'payme');
        const url = `${B2C_URL}/ru/pay/${payment.token}`;
        setPayUrl(url);
        setActiveApp('pay');
        setIframeKey((k) => k + 1);
      }
    } catch (e) {
      console.error('Failed to create demo payment link:', e);
    } finally {
      setLoadingPay(false);
    }
  };

  const handleTriggerStartCommand = (openModal = false) => {
    setBotStarted(true);
    setIsFullscreen(true);
    setIframeKey((k) => k + 1);
    if (openModal) {
      setFullViewportOpen(true);
    }
  };

  const handleInstallViaBackend = async () => {
    setInstalling(true);
    setInstallNote(null);
    try {
      if (botToken) localStorage.setItem('touruz_tg_bot_token', botToken.trim());
      if (chatId) localStorage.setItem('touruz_tg_chat_id', chatId.trim());
    } catch {}

    try {
      const { data } = await api.post('/crm/telegram-setup-miniapp', {
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        miniapp_url: publicMiniAppUrl.trim(),
        crm_url: `${window.location.origin}?tma=1&fullscreen=1`,
        button_text: buttonText.trim(),
      });
      setInstallSuccess(Boolean(data.welcome_sent || data.menu_button_configured));
      setInstallNote(data.note || 'Конфигурация выполнена');
    } catch (e: any) {
      setInstallSuccess(false);
      setInstallNote(e?.message || 'Ошибка при обращении к API');
    } finally {
      setInstalling(false);
    }
  };

  const handleInstallDirectFromBrowser = async () => {
    const cleanToken = botToken.trim();
    const cleanChat = chatId.trim();
    if (!cleanToken || !cleanToken.includes(':')) {
      setInstallSuccess(false);
      setInstallNote(
        'Введите корректный Bot Token от @BotFather (формат 123456789:AAH...), чтобы отправить команды напрямую из браузера.'
      );
      return;
    }

    setInstalling(true);
    setInstallNote(null);
    try {
      localStorage.setItem('touruz_tg_bot_token', cleanToken);
      localStorage.setItem('touruz_tg_chat_id', cleanChat);
    } catch {}

    try {
      const isHttps = publicMiniAppUrl.trim().startsWith('https://');
      await fetch(`https://api.telegram.org/bot${cleanToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: '🚀 Запустить TourUZ Mini App (Fullscreen)' },
            { command: 'tours', description: '🌴 Все туры и горящие предложения' },
            { command: 'crm', description: '📊 B2B CRM панель туроператора' },
          ],
        }),
      });

      if (isHttps) {
        await fetch(`https://api.telegram.org/bot${cleanToken}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'web_app',
              text: buttonText.trim() || '📱 Открыть TourUZ',
              web_app: { url: publicMiniAppUrl.trim() },
            },
          }),
        });
        const tunnelOrigin = publicMiniAppUrl.trim().split('/ru/')[0].split('/uz/')[0].split('/en/')[0];
        await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${tunnelOrigin}/api/v1/crm/telegram-webhook`,
          }),
        });
      }

      const msgResp = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChat,
          parse_mode: 'HTML',
          text:
            '✈️ <b>TourUZ Mini App (Fullscreen iOS 26) готов к работе!</b>\n\n' +
            '• 402+ актуальных тура от 27 туроператоров\n' +
            '• Отзывы и рейтинги агентств\n' +
            '• Онлайн-оплата Payme / Click / Uzum\n\n' +
            '👇 Нажмите кнопку ниже для запуска на весь экран:',
          reply_markup: {
            inline_keyboard: [
              [
                isHttps
                  ? {
                      text: `🚀 ${buttonText.trim()} (Полный экран)`,
                      web_app: { url: publicMiniAppUrl.trim() },
                    }
                  : {
                      text: `🚀 ${buttonText.trim()}`,
                      url: publicMiniAppUrl.trim(),
                    },
              ],
            ],
          },
        }),
      });
      const json = await msgResp.json();
      if (json.ok) {
        setInstallSuccess(true);
        setBrowserListenerActive(true);
        setInstallNote(
          `✅ Кнопка WebApp установлена и сообщение /start отправлено в ваш Telegram (${cleanChat})! Авто-ответчик на /start также включён.`
        );
      } else {
        setInstallSuccess(false);
        setInstallNote(`Ответ Telegram API: ${json.description || 'Ошибка'}`);
      }
    } catch (err: any) {
      setInstallSuccess(false);
      setInstallNote(
        `Не удалось достучаться до api.telegram.org из браузера (${err?.message}). Из-за блокировки FortiGate на вашем Wi-Fi роутере включите VPN в браузере или протестируйте команду /start прямо в окне Telegram-бота ниже!`
      );
    } finally {
      setInstalling(false);
    }
  };

  const currentUrl = buildIframeUrl();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-extrabold">
            <Sparkles size={13} />
            <span>HTTPS Туннель для Telegram WebApp активен: {LIVE_HTTPS_TUNNEL}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Telegram Бот <code className="text-primary-600">/start</code> + Полноэкранный Mini App
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Мы подняли для вашего Mini App публичный HTTPS-туннель{' '}
            <a
              href={`${LIVE_HTTPS_TUNNEL}/ru/tours?tma=1&fullscreen=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 font-bold underline"
            >
              {LIVE_HTTPS_TUNNEL}
            </a>{' '}
            (с проксированием всех 402 туров, фото и оплат) и подготовили интерактивный запуск по команде{' '}
            <b>/start</b>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFullViewportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-sm transition-all"
          >
            <Maximize2 size={14} />
            <span>Развернуть Mini App на весь экран (100% Fullscreen)</span>
          </button>
          <a
            href={`${LIVE_HTTPS_TUNNEL}/ru/tours?tma=1&fullscreen=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-extrabold shadow-sm transition-all"
          >
            <ExternalLink size={14} />
            <span>Открыть HTTPS-ссылку Mini App</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive /start Telegram Chat + Controls + Bot Setup (5 cols) */}
        <div className="xl:col-span-5 space-y-5">
          {/* LIVE TELEGRAM BOT /start SIMULATOR */}
          <div className="rounded-[28px] overflow-hidden border border-slate-200/90 shadow-lg bg-[#0e1621] text-white">
            {/* Telegram Chat Header */}
            <div className="px-4 py-3 bg-[#17212b] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-sky-500 flex items-center justify-center font-extrabold text-sm shadow">
                  ✈️
                </div>
                <div>
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    <span>TourUZ Official Bot</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      бот
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400">в сети · Mini App Fullscreen v8.0</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerStartCommand(false)}
                className="px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-bold transition"
              >
                Отправить /start
              </button>
            </div>

            {/* Telegram Chat Messages */}
            <div className="p-4 space-y-3 bg-[#0e1621] min-h-[250px] flex flex-col justify-end">
              {/* User message: /start */}
              <div className="flex justify-end">
                <div className="bg-[#2b5278] text-white px-3.5 py-2 rounded-2xl rounded-br-sm text-xs font-bold shadow">
                  /start <span className="text-[10px] text-sky-200/70 ml-1.5 font-normal">12:36 ✓✓</span>
                </div>
              </div>

              {/* Bot Reply with Fullscreen WebApp Button */}
              {botStarted && (
                <div className="space-y-1.5 max-w-[92%]">
                  <div className="bg-[#182533] p-3.5 rounded-2xl rounded-bl-sm text-xs leading-relaxed space-y-2 shadow border border-white/5">
                    <div className="font-extrabold text-sky-300 text-sm">
                      ✈️ Добро пожаловать в TourUZ Mini App!
                    </div>
                    <p className="text-slate-200 text-[11.5px]">
                      Сравнивайте <b>402+ актуальных тура</b> от 27 проверенных туроператоров
                      Узбекистана прямо в полноэкранном режиме Telegram:
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-0.5">
                      <li>• 🔥 Горящие туры и туры по Узбекистану</li>
                      <li>• ⭐ Отзывы и честный рейтинг агентств</li>
                      <li>• 💳 Онлайн-оплата Payme / Click / Uzum</li>
                    </ul>
                  </div>

                  {/* Telegram Inline WebApp Buttons */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setFullViewportOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99]"
                    >
                      <Play size={13} className="fill-white" />
                      <span>🚀 Открыть TourUZ Mini App (На весь экран)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveApp('tours');
                          setIsFullscreen(true);
                          setIframeKey((k) => k + 1);
                        }}
                        className="py-2 px-3 rounded-xl bg-[#202b36] hover:bg-[#293644] text-sky-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <span>📱 Открыть в iPhone справа</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenPayDemo}
                        className="py-2 px-3 rounded-xl bg-[#202b36] hover:bg-[#293644] text-teal-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <span>💳 Тест оплаты в Mini App</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Telegram Input Bar with Persistent Blue Menu Button ("📱 TourUZ") */}
            <div className="px-3 py-2.5 bg-[#17212b] border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFullViewportOpen(true)}
                className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shrink-0 transition"
                title="Синяя кнопка Menu Button слева от поля ввода в Telegram"
              >
                <Smartphone size={13} />
                <span>{buttonText}</span>
              </button>

              <input
                type="text"
                value={startCommandInput}
                onChange={(e) => setStartCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTriggerStartCommand(true);
                }}
                placeholder="Напишите /start..."
                className="flex-1 min-w-0 bg-[#0e1621] text-white text-xs px-3 py-1.5 rounded-full border border-white/10 focus:outline-none focus:border-sky-400"
              />

              <button
                type="button"
                onClick={() => handleTriggerStartCommand(true)}
                className="p-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white transition shrink-0"
                title="Отправить команду /start и открыть полный экран"
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          {/* 1. Screen & Mode Selector */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone size={16} className="text-primary-500" />
                <span>1. Переключение экрана и модели iPhone</span>
              </h2>
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                <RefreshCw size={13} /> Обновить
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveApp('tours')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeApp === 'tours'
                    ? 'border-primary-500 bg-primary-50/70 text-slate-900 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:bg-sand-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold">🌴 Все туры (B2C)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">402 тура · Поиск и фильтры</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveApp('hot')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeApp === 'hot'
                    ? 'border-rose-500 bg-rose-50/70 text-slate-900 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:bg-sand-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold">🔥 Горящие туры</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Спецпредложения</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveApp('agencies')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeApp === 'agencies'
                    ? 'border-primary-500 bg-primary-50/70 text-slate-900 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:bg-sand-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold">⭐ 27 Агентств + Отзывы</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Модуль отзывов и рейтинг</div>
              </button>

              <button
                type="button"
                onClick={handleOpenPayDemo}
                disabled={loadingPay}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeApp === 'pay'
                    ? 'border-teal-500 bg-teal-50/70 text-slate-900 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:bg-sand-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center gap-1">
                  <CreditCard size={13} className="text-teal-600" />
                  <span>{loadingPay ? 'Создаём счёт...' : 'Оплата Payme/Click'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Чекаут заявки в Mini App</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveApp('crm')}
                className={`col-span-2 p-3 rounded-2xl border text-left transition-all ${
                  activeApp === 'crm'
                    ? 'border-indigo-500 bg-indigo-50/70 text-slate-900 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:bg-sand-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold">
                  📊 B2B CRM Воронка заявок (Кабинет партнёра в Telegram)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Канбан заявок, генерация ссылок на оплату и модерация отзывов
                </div>
              </button>
            </div>

            {/* Device Frame Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-extrabold text-slate-700">
                Модель смартфона и размер экрана:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEVICES.map((d) => {
                  const active = device.id === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDevice(d)}
                      className={`px-3 py-2 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-sand-50/70 hover:bg-sand-100 text-slate-700'
                      }`}
                    >
                      <div className="text-[11px] font-extrabold truncate">{d.name}</div>
                      <div
                        className={`text-[10px] truncate ${
                          active ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {d.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fullscreen & Safe Area Toggles */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen((v) => !v);
                  setIframeKey((k) => k + 1);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border transition-all ${
                  isFullscreen
                    ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-sand-50'
                }`}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>
                  {isFullscreen ? 'Режим: Fullscreen (с чёлкой)' : 'Режим: Обычный Sheet'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSafeZones((v) => !v)}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border transition-all ${
                  showSafeZones
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-sand-50'
                }`}
              >
                <Eye size={14} />
                <span>Сетка отступов</span>
              </button>
            </div>
          </div>

          {/* 2. Real Telegram Bot Connection */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    2. Подключить вашего реального бота (@BotFather)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Отвечает на <code className="font-mono">/start</code> ссылкой{' '}
                    <code className="font-mono">{LIVE_HTTPS_TUNNEL}</code>
                  </p>
                </div>
              </div>
              {browserListenerActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                  <Radio size={11} className="animate-pulse" /> Слушает /start ({handledCount})
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Токен вашего бота от @BotFather
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Вставьте токен вида 7123456789:AAH..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ваш Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="638384527"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Текст кнопки меню
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="📱 Открыть TourUZ"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Публичный HTTPS URL для Telegram WebApp (уже запущен!)
                </label>
                <input
                  type="text"
                  value={publicMiniAppUrl}
                  onChange={(e) => setPublicMiniAppUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-mono text-slate-800 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstallDirectFromBrowser}
                  disabled={installing}
                  className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                >
                  <Globe size={13} />
                  <span>{installing ? 'Подключаем...' : 'Активировать из браузера'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstallViaBackend}
                  disabled={installing}
                  className="px-4 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                >
                  <Send size={13} />
                  <span>Активировать через Backend</span>
                </button>
              </div>

              {installNote && (
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                    installSuccess
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {installNote}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive iPhone / Android Fullscreen Simulator (7 cols) */}
        <div className="xl:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-700">
                {device.name} ·{' '}
                {isFullscreen ? 'Fullscreen (Safe Top: 86px)' : 'Compact Sheet (Safe Top: 0px)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFullViewportOpen(true)}
              className="text-xs font-extrabold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Maximize2 size={12} /> На весь экран монитора
            </button>
          </div>

          {/* Device Bezel Container */}
          <div
            className={`relative bg-[#0f141c] p-3 sm:p-3.5 shadow-[0_28px_70px_-15px_rgba(15,23,42,0.45)] border-[3px] border-slate-700/80 transition-all duration-300 ${
              device.radius
            } ${device.width === 0 ? 'w-full' : ''}`}
            style={
              device.width > 0
                ? {
                    width: `${device.width + 28}px`,
                    maxWidth: '100%',
                  }
                : undefined
            }
          >
            {/* Inner Screen */}
            <div
              className="relative bg-[#EFF5F8] overflow-hidden w-full transition-all duration-300"
              style={{
                height: `${device.height}px`,
                borderRadius: device.id === 'full' ? '22px' : '40px',
              }}
            >
              {/* Top Hardware Status Bar + Dynamic Island / Notch */}
              <div
                className={`absolute top-0 inset-x-0 z-30 pointer-events-none select-none transition-colors ${
                  isFullscreen ? 'bg-transparent' : 'bg-[#1c2431] text-white'
                }`}
              >
                {/* Status Bar Row (44px) */}
                <div
                  className={`h-[44px] px-6 flex items-center justify-between text-[11px] font-extrabold ${
                    isFullscreen ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  <span>9:41</span>

                  {device.notch === 'dynamic-island' && (
                    <div className="w-[118px] h-[31px] bg-black rounded-full shadow-md flex items-center justify-between px-3 border border-white/10">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-400/30" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  )}

                  {device.notch === 'punch-hole' && (
                    <div className="w-4 h-4 bg-black rounded-full border border-white/15" />
                  )}

                  <span className="text-[10px] tracking-tight">5G · 100%</span>
                </div>

                {/* Telegram Bot API 8.0 Fullscreen Floating Header Controls (42px) */}
                {isFullscreen ? (
                  <div className="h-[42px] px-3.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFullscreen(false);
                        setIframeKey((k) => k + 1);
                      }}
                      className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] font-bold shadow-sm hover:bg-black/65 transition"
                    >
                      <span>✕</span>
                      <span>Закрыть</span>
                    </button>

                    <div className="px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-md border border-black/5 text-[10px] font-extrabold text-slate-800 shadow-sm flex items-center gap-1">
                      <span>TourUZ</span>
                      <ShieldCheck size={11} className="text-sky-500" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSafeZones((v) => !v)}
                      className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] font-bold shadow-sm hover:bg-black/65 transition"
                      title="Показать/скрыть зоны отступов Safe Area"
                    >
                      <span>⌄</span>
                      <span>···</span>
                    </button>
                  </div>
                ) : (
                  <div className="h-[42px] px-4 bg-white border-b border-slate-200 flex items-center justify-between text-slate-800 rounded-t-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFullscreen(true);
                        setIframeKey((k) => k + 1);
                      }}
                      className="pointer-events-auto text-xs font-bold text-sky-600 hover:underline"
                    >
                      Готово
                    </button>
                    <div className="text-xs font-extrabold">TourUZ — Все туры</div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFullscreen(true);
                        setIframeKey((k) => k + 1);
                      }}
                      className="pointer-events-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600"
                    >
                      ⛶ Full
                    </button>
                  </div>
                )}
              </div>

              {/* Safe Area Visual Inspector Overlay */}
              {showSafeZones && isFullscreen && (
                <>
                  <div className="absolute top-0 inset-x-0 h-[86px] z-40 pointer-events-none bg-rose-500/20 border-b-2 border-dashed border-rose-500 flex items-end justify-center pb-1">
                    <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      TOP SAFE AREA (86px: Dynamic Island 44px + TG Pill Bar 42px)
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-[24px] z-40 pointer-events-none bg-sky-500/25 border-t-2 border-dashed border-sky-500 flex items-center justify-center">
                    <span className="text-[9px] font-extrabold bg-sky-600 text-white px-2 py-0.2 rounded-full">
                      BOTTOM SAFE AREA (24px Home Indicator)
                    </span>
                  </div>
                </>
              )}

              {/* Live Mini App Iframe */}
              <iframe
                key={`${iframeKey}-${activeApp}-${isFullscreen}-${payUrl}`}
                src={currentUrl}
                title="TourUZ Telegram Mini App Simulator"
                className="w-full h-full border-0 bg-[#EFF5F8]"
                style={{
                  paddingTop: isFullscreen ? '0px' : '86px',
                }}
              />

              {/* iPhone Bottom Home Indicator */}
              <div className="absolute bottom-1.5 inset-x-0 z-30 pointer-events-none flex justify-center">
                <div className="w-32 h-1.5 rounded-full bg-slate-900/40 backdrop-blur-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 100% Full-Viewport Telegram Mini App Launcher Overlay (Triggered by /start button) */}
      {fullViewportOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col">
          <div className="relative flex-1 w-full h-full bg-[#EFF5F8] overflow-hidden">
            {/* Simulated Top iPhone Dynamic Island + Telegram Fullscreen Controls */}
            <div className="absolute top-0 inset-x-0 z-40 pointer-events-none select-none">
              <div className="max-w-xl mx-auto h-[44px] px-6 flex items-center justify-between text-xs font-extrabold text-slate-900">
                <span>9:41</span>
                <div className="w-[122px] h-[30px] bg-black rounded-full shadow-md flex items-center justify-between px-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-400/30" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[11px]">5G · 100%</span>
              </div>
              <div className="max-w-5xl mx-auto h-[42px] px-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFullViewportOpen(false)}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-extrabold shadow-md transition"
                >
                  <X size={13} />
                  <span>Закрыть Fullscreen Mini App</span>
                </button>

                <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/10 text-xs font-extrabold text-slate-900 shadow-sm flex items-center gap-1.5">
                  <span>TourUZ Mini App · Полный экран (после /start)</span>
                  <ShieldCheck size={13} className="text-sky-500" />
                </div>

                <a
                  href={`${LIVE_HTTPS_TUNNEL}/ru/tours?tma=1&fullscreen=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-md transition"
                >
                  <ExternalLink size={12} />
                  <span>Открыть HTTPS</span>
                </a>
              </div>
            </div>

            <iframe
              src={`${B2C_URL}/ru/tours?tma=1&fullscreen=1&frame=1`}
              title="TourUZ Fullscreen Mini App"
              className="w-full h-full border-0 bg-[#EFF5F8]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
