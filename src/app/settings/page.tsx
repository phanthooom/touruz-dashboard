'use client';
import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { crmApi } from '../../lib/api';
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

  if (!current) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Загрузка данных агентства...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Профиль и настройки агентства
        </h1>
        <p className="text-xs text-slate-500">
          Контактные данные туроператора, отображаемые туристам на витрине TourUZ
        </p>
      </div>

      {!selectedAgency && (
        <div className="p-4 rounded-2xl bg-primary-50/70 border border-primary-100 text-xs text-primary-800 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">
            Выберите конкретное агентство для редактирования профиля:
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
  );
}
