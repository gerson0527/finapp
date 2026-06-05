import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';

/** Genera copias del mes para plantillas recurrentes que aún no existen */
export async function ensureRecurringTransactions(month: string): Promise<number> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return 0;

  const { data, error } = await supabase.rpc('generate_recurring_transactions', {
    p_month: month,
  });

  if (error) {
    if (/generate_recurring|function/i.test(error.message)) return 0;
    throw new Error(error.message);
  }

  return typeof data === 'number' ? data : 0;
}
