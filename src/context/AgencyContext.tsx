'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { crmApi, type Agency } from '../lib/api';
import { useAuth } from './AuthContext';

interface AgencyContextValue {
  agencies: Agency[];
  selectedAgencyId: number | null;
  selectedAgency: Agency | null;
  setSelectedAgencyId: (id: number | null) => void;
  isLoadingAgencies: boolean;
}

const AgencyContext = createContext<AgencyContextValue>({
  agencies: [],
  selectedAgencyId: null,
  selectedAgency: null,
  setSelectedAgencyId: () => {},
  isLoadingAgencies: false,
});

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isSuperadmin } = useAuth();
  const lockedAgencyId = user && !isSuperadmin ? user.agency_id ?? null : null;
  const [selectedAgencyId, setSelectedAgencyIdState] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('touruz_crm_agency_id');
    if (saved && saved !== 'all') {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        setSelectedAgencyIdState(parsed);
      }
    }
  }, []);

  // Менеджер агентства всегда работает только в своём кабинете
  useEffect(() => {
    if (lockedAgencyId) setSelectedAgencyIdState(lockedAgencyId);
  }, [lockedAgencyId]);

  const setSelectedAgencyId = (id: number | null) => {
    if (lockedAgencyId) return;
    setSelectedAgencyIdState(id);
    if (id === null) {
      localStorage.setItem('touruz_crm_agency_id', 'all');
    } else {
      localStorage.setItem('touruz_crm_agency_id', String(id));
    }
  };

  const { data: agencies = [], isLoading: isLoadingAgencies } = useQuery({
    queryKey: ['crm-agencies', user?.id ?? null],
    queryFn: () => crmApi.agencies(),
    enabled: !!user,
  });

  const selectedAgency =
    agencies.find((a) => a.id === selectedAgencyId) || null;

  return (
    <AgencyContext.Provider
      value={{
        agencies,
        selectedAgencyId,
        selectedAgency,
        setSelectedAgencyId,
        isLoadingAgencies,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
}

export const useAgency = () => useContext(AgencyContext);
