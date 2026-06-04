import { useState, useEffect, useCallback } from 'react';
import { getBudgets, BudgetWithSpent } from '@/services/budgetService';

export function useBudgets(month: string) {
  const [data, setData] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBudgets(month);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
