import { useState, useEffect, useCallback, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getTransactions, Transaction } from '@/services/transactionService';

export function useTransactions(month: string) {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useId();
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTransactions(month);
      setData(result);
    } catch (e: any) {
      setError(e.message);
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
  }, [month, channelId]);

  return { data, loading, error, refresh: load };
}
