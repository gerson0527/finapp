import { useState, useCallback } from 'react';
import { getSavingsGoals, SavingsGoal } from '@/services/savingsService';
import { useAppRefresh } from '@/hooks/useAppRefresh';

export function useSavingsGoals() {
  const [data, setData] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSavingsGoals();
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useAppRefresh(load);

  return { data, loading, error, refresh: load };
}
