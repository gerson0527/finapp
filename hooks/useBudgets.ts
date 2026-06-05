import { useState, useEffect, useCallback } from 'react';
import {
  getBudgets,
  rolloverBudgetsToMonth,
  BudgetWithSpent,
} from '@/services/budgetService';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getCurrentMonth } from '@/lib/month';
import { hasReviewedBudgetMonth } from '@/lib/budgetReviewStorage';
import { useAppRefresh } from '@/hooks/useAppRefresh';

export function useBudgets(month: string) {
  const [data, setData] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMonthReview, setNeedsMonthReview] = useState(false);
  const [rolledFromMonth, setRolledFromMonth] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await getCurrentUserIdOrNull();
      const currentMonth = getCurrentMonth();
      let rolled: string | null = null;

      let result = await getBudgets(month);

      if (month === currentMonth && result.length === 0) {
        const rollover = await rolloverBudgetsToMonth(month);
        if (rollover.created > 0) {
          result = await getBudgets(month);
          rolled = rollover.fromMonth;
        }
      }

      setRolledFromMonth(rolled);

      if (month === currentMonth && result.length > 0 && userId) {
        const reviewed = await hasReviewedBudgetMonth(userId, month);
        setNeedsMonthReview(!reviewed);
      } else {
        setNeedsMonthReview(false);
      }

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

  useAppRefresh(load, [month]);

  return {
    data,
    loading,
    error,
    refresh: load,
    needsMonthReview,
    rolledFromMonth,
    clearMonthReview: () => setNeedsMonthReview(false),
  };
}
