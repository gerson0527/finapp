import { useState, useEffect, useCallback, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getTransactions, Transaction } from '@/services/transactionService';
import { ensureRecurringTransactions } from '@/services/recurringService';
import { getCurrentMonth } from '@/lib/month';
import { useApp } from '@/src/context/AppContext';
import { useAppRefresh } from '@/hooks/useAppRefresh';

export function useTransactions(month: string) {
  const { refreshKey } = useApp();
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useId();
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getTransactions(month);
      setData(result);
      setLoading(false);

      if (month === getCurrentMonth()) {
        const created = await ensureRecurringTransactions(month);
        if (created > 0) {
          const fresh = await getTransactions(month);
          setData(fresh);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
      setLoading(false);
    }
  }, [month]);

  loadRef.current = load;

  useAppRefresh(load, [month]);

  useEffect(() => {
    const scheduleReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        loadRef.current();
      }, 450);
    };

    const channel = supabase
      .channel(`transactions-changes-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        scheduleReload
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [month, channelId, refreshKey]);

  return { data, loading, error, refresh: load };
}
