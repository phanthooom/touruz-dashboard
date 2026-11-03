'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, RefreshCw } from 'lucide-react';
import { useAgency } from '../context/AgencyContext';
import TourFormModal from './TourFormModal';

export default function Topbar() {
  const queryClient = useQueryClient();
  const { agencies, selectedAgencyId, setSelectedAgencyId } = useAgency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <>
      <header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Agency Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Building2 size={16} className="text-primary-500" />
            <span className="hidden sm:inline">Туроператор:</span>
          </div>

          <select
            value={selectedAgencyId ?? 'all'}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedAgencyId(val === 'all' ? null : Number(val));
            }}
            className="bg-sand-100 hover:bg-slate-200/60 text-slate-800 text-xs font-bold rounded-full px-4 py-2 border border-slate-200/80 cursor-pointer transition-all"
          >
            <option value="all">🌐 Все туроператоры ({agencies.length})</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.tours_count || 0} туров)
              </option>
            ))}
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-full bg-sand-100 hover:bg-slate-200/70 text-slate-600 transition-all"
            title="Обновить данные"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-primary-500' : ''} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-sm shadow-primary-500/25 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Добавить тур</span>
          </button>
        </div>
      </header>

      <TourFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTour={null}
      />
    </>
  );
}
