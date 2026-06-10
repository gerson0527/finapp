import { useState, useCallback } from 'react';
import { getMonthlyStats, MonthlyStats } from '@/services/transactionService';
import { useAppRefresh } from '@/hooks/useAppRefresh';

export function useMonthlyStats(month: string) {
  const [stats, setStats] = useState<MonthlyStats>({ income: 0, expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMonthlyStats(month);
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useAppRefresh(load, [month]);

  return { ...stats, loading, error, refresh: load };
}
