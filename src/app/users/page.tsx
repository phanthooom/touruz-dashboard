'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ShieldCheck, Building2, Ban, CheckCircle2, KeyRound, X, Search } from 'lucide-react';
import { usersApi, type CRMUser, type CRMUserInput } from '../../lib/api';
import { useAgency } from '../../context/AgencyContext';
import { useAuth } from '../../context/AuthContext';
import CustomSelect, { type SelectOption } from '../../components/CustomSelect';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'agency_manager', label: 'Менеджер агентства', dotColor: 'bg-primary-500' },
  { value: 'superadmin', label: 'Супер-админ', dotColor: 'bg-amber-500' },
];

type FormState = {
  email: string;
  full_name: string;
  phone: string;
  password: string;
  role: 'agency_manager' | 'superadmin';
  agency_id: string;
};

const EMPTY: FormState = { email: '', full_name: '', phone: '', password: '', role: 'agency_manager', agency_id: '' };

function apiError(e: any, fallback: string) {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    if (d.some((x: any) => x?.loc?.includes('password'))) return 'Пароль — минимум 8 символов';
    if (d.some((x: any) => x?.loc?.includes('email'))) return 'Некорректный email';
  }
  return fallback;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { agencies } = useAgency();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CRMUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['crm-users'],
    queryFn: () => usersApi.list(),
  });

  const agencyOptions: SelectOption[] = useMemo(
    () => agencies.map((a) => ({ value: String(a.id), label: a.name })),
    [agencies]
  );

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.email, u.full_name, u.agency_name].some((v) => v?.toLowerCase().includes(q));
  });

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-users'] });
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: CRMUserInput = {
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        role: form.role,
        agency_id: form.role === 'agency_manager' && form.agency_id ? Number(form.agency_id) : null,
      };
      if (form.password) payload.password = form.password;
      if (editing) return usersApi.update(editing.id, payload);
      return usersApi.create({ ...payload, email: form.email.trim(), password: form.password });
    },
    onSuccess: done,
    onError: (e) => setFormError(apiError(e, 'Не удалось сохранить')),
  });

  const toggleMutation = useMutation({
    mutationFn: (u: CRMUser) => usersApi.update(u.id, { is_active: !u.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-users'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (u: CRMUser) => {
    setEditing(u);
    setForm({
      email: u.email,
      full_name: u.full_name || '',
      phone: u.phone || '',
      password: '',
      role: u.role === 'superadmin' ? 'superadmin' : 'agency_manager',
      agency_id: u.agency_id ? String(u.agency_id) : '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const canSubmit =
    (editing || (form.email.includes('@') && form.password.length >= 8)) &&
    (form.role === 'superadmin' || !!form.agency_id) &&
    (!form.password || form.password.length >= 8) &&
    !saveMutation.isPending;

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Пользователи CRM</h1>
          <p className="text-xs text-slate-500">
            Менеджеры видят только туры, заявки и отзывы своего агентства. Супер-админ — все агентства.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-sm shadow-primary-500/25 transition-all active:scale-95"
        >
          <UserPlus size={15} /> Добавить сотрудника
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) saveMutation.mutate();
          }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              {editing ? `Изменить: ${editing.email}` : 'Новый сотрудник'}
            </h2>
            <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:bg-sand-100">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Email (логин)</span>
              <input
                type="email"
                required={!editing}
                disabled={!!editing}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputCls} disabled:bg-sand-50 disabled:text-slate-400`}
                autoComplete="off"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">
                {editing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль (мин. 8 символов)'}
              </span>
              <input
                type="text"
                required={!editing}
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputCls}
                autoComplete="new-password"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Имя</span>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Телефон</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+998" />
            </label>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">Роль</span>
              <CustomSelect
                value={form.role}
                options={ROLE_OPTIONS}
                onChange={(v) => setForm({ ...form, role: v as FormState['role'] })}
                variant="input"
                searchable={false}
              />
            </div>
            {form.role === 'agency_manager' && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Агентство</span>
                <CustomSelect
                  value={form.agency_id}
                  options={agencyOptions}
                  onChange={(v) => setForm({ ...form, agency_id: v })}
                  placeholder="Выберите агентство"
                  variant="input"
                  searchable
                  searchPlaceholder="Найти туроператора..."
                />
              </div>
            )}
          </div>

          {formError && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-3.5 py-2.5">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              Отмена
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-full bg-primary-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Сохраняем...' : editing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по email, имени или агентству..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-2xl bg-sand-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Сотрудников не найдено</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const isMe = me?.id === u.id;
              const isAdmin = u.role === 'superadmin';
              return (
                <div key={u.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${u.is_active ? '' : 'opacity-60'}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl font-extrabold text-sm flex items-center justify-center shrink-0 ${
                        isAdmin ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'
                      }`}
                    >
                      {(u.full_name || u.email)[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                        {u.full_name || u.email}
                        {isMe && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand-100 text-slate-500">вы</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {isAdmin ? (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                        <ShieldCheck size={11} /> Супер-админ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 flex items-center gap-1 max-w-[220px]">
                        <Building2 size={11} className="shrink-0" />
                        <span className="truncate">{u.agency_name || 'Без агентства'}</span>
                      </span>
                    )}
                    {!u.is_active && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">
                        Заблокирован
                      </span>
                    )}
                    <button
                      onClick={() => openEdit(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sand-100 hover:bg-slate-200/70 text-slate-700 text-[11px] font-bold"
                    >
                      <KeyRound size={12} /> Изменить
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => toggleMutation.mutate(u)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                          u.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {u.is_active ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                        {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
