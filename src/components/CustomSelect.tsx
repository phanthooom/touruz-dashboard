'use client';
import { useState, useRef, useEffect, useMemo, ReactNode } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: ReactNode;
  dotColor?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'pill' | 'input' | 'compact';
  align?: 'left' | 'right';
  searchable?: boolean;
  searchPlaceholder?: string;
  menuWidth?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = 'Выберите...',
  variant = 'pill',
  align = 'left',
  searchable,
  searchPlaceholder = 'Быстрый поиск...',
  menuWidth,
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 7;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
      if (showSearch) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    } else {
      setQuery('');
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, showSearch]);

  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.badge && o.badge.toLowerCase().includes(q))
    );
  }, [options, query]);

  const triggerClasses =
    variant === 'compact'
      ? `w-full flex items-center justify-between gap-2 pl-3 pr-2 py-1.5 rounded-full border text-[11px] font-bold transition-all duration-200 select-none ${
          open
            ? 'bg-white border-primary-500 text-slate-900 shadow-sm ring-2 ring-primary-500/15'
            : 'bg-sand-100 hover:bg-slate-200/70 border-slate-200/90 text-slate-800'
        }`
      : variant === 'input'
      ? `w-full flex items-center justify-between gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 select-none ${
          open
            ? 'bg-white border-primary-500 text-slate-900 shadow-sm ring-2 ring-primary-500/15'
            : 'bg-sand-50 hover:bg-white border-slate-200 text-slate-800'
        }`
      : `flex items-center justify-between gap-2.5 pl-3.5 pr-2.5 py-2 rounded-full text-xs font-bold transition-all duration-200 select-none ${
          open
            ? 'bg-white border border-primary-500 text-slate-900 shadow-sm ring-2 ring-primary-500/15'
            : 'liquid-glass-pill hover:bg-white/90 text-slate-800'
        }`;

  return (
    <div
      ref={containerRef}
      className={`relative ${className} ${open ? 'z-50' : 'z-10'}`}
    >
      {/* Trigger Button with sleek custom Chevron pill */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClasses}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-primary-500">
              {selectedOption.icon}
            </span>
          )}
          {selectedOption?.dotColor && (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedOption.dotColor}`}
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && variant === 'pill' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-slate-500 font-extrabold border border-slate-200/60">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-out ${
            open
              ? 'bg-primary-500 text-white rotate-180 shadow-xs'
              : 'bg-white/80 text-slate-500 group-hover:text-slate-800'
          }`}
        >
          <ChevronDown size={13} strokeWidth={2.5} />
        </span>
      </button>

      {/* Floating Dropdown Panel — outer container has p-0 so scrollbar is 100% flush right */}
      {open && (
        <div
          className={`absolute top-full mt-2 z-[100] liquid-glass-popover rounded-2xl overflow-hidden p-0 animate-dropdown ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuWidth || 'w-full min-w-[230px]'}`}
        >
          {showSearch && (
            <div className="p-2 border-b border-slate-100 bg-sand-50/70">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Scrollable list: zero right margin so scrollbar sits flush against the right border */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar py-1.5 pl-1.5 pr-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Ничего не найдено
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 select-none group ${
                      isSelected
                        ? 'bg-primary-500 text-white font-bold shadow-sm shadow-primary-500/20'
                        : 'text-slate-700 font-semibold hover:bg-sand-100 hover:text-slate-900 active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {opt.icon ? (
                        <span
                          className={`flex-shrink-0 ${
                            isSelected ? 'text-white' : 'text-primary-500'
                          }`}
                        >
                          {opt.icon}
                        </span>
                      ) : opt.dotColor ? (
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isSelected ? 'bg-white' : opt.dotColor
                          }`}
                        />
                      ) : null}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                          <Check size={11} strokeWidth={3} className="text-white" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
