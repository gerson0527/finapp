import { useState, useEffect, useCallback, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getTransactions, Transaction } from '@/services/transactionService';
import { ensureRecurringTransactions } from '@/services/recurringService';
import { useApp } from '@/src/context/AppContext';

export function useTransactions(month: string) {
  const { refreshKey } = useApp();
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useId();
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await ensureRecurringTransactions(month);
      const result = await getTransactions(month);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [month]);

  loadRef.current = load;

  useEffect(() => {
    loadRef.current();

    const channel = supabase
      .channel(`transactions-changes-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          loadRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, channelId, refreshKey]);

  return { data, loading, error, refresh: load };
}
