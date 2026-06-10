import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getCurrentMonth } from '@/lib/month';
import { invalidateRequestCache } from '@/lib/requestCache';

interface AppContextType {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getDefaultMonth(): string {
  return getCurrentMonth();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth());
  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    invalidateRequestCache();
    setRefreshKey((k) => k + 1);
  }

  return (
    <AppContext.Provider value={{ selectedMonth, setSelectedMonth, refreshKey, triggerRefresh }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
