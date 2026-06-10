import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getCurrentMonth } from '@/lib/month';
import { cachedFetch, invalidateRequestCache } from '@/lib/requestCache';
import type { Transaction } from '@/services/transactionService';

export interface RecurringTemplate {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  account_id: string;
  recurrence_day: number | null;
  is_recurring: boolean;
  date: string;
  category?: { name: string; icon: string; color: string };
  account?: { name: string };
}

/** Genera copias del mes para plantillas recurrentes que aún no existen (solo mes actual). */
export async function ensureRecurringTransactions(month: string): Promise<number> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return 0;

  if (month !== getCurrentMonth()) return 0;

  const { data, error } = await supabase.rpc('generate_recurring_transactions', {
    p_month: month,
  });

  if (error) {
    if (/generate_recurring|function/i.test(error.message)) return 0;
    throw new Error(error.message);
  }

  return typeof data === 'number' ? data : 0;
}

export async function getRecurringTemplates(): Promise<RecurringTemplate[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  return cachedFetch(`recurring:${userId}`, async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(name, icon, color), account:accounts(name)')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .is('recurring_source_id', null)
      .order('description');

    if (error) throw new Error(error.message);
    return (data ?? []) as RecurringTemplate[];
  }, 30_000);
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ is_recurring: active })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('id, is_recurring, recurring_source_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!tx.is_recurring || tx.recurring_source_id) {
    throw new Error('Solo puedes eliminar plantillas recurrentes.');
  }

  const { error: delError } = await supabase.from('transactions').delete().eq('id', id);
  if (delError) throw new Error(delError.message);

  invalidateRequestCache('recurring:');
}

export function getNextRecurrenceLabel(day: number | null): string {
  const now = new Date();
  const targetDay = Math.min(Math.max(day ?? 1, 1), 31);
  const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const thisMonthDay = Math.min(targetDay, lastDayThisMonth);

  let next = new Date(now.getFullYear(), now.getMonth(), thisMonthDay);
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastDayNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    next = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(targetDay, lastDayNext));
  }

  return next.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export async function updateRecurringTemplate(
  id: string,
  dto: {
    amount: number;
    description: string;
    category_id: string;
    account_id: string;
    recurrence_day: number;
  }
): Promise<Transaction> {
  const { data: old, error: fetchError } = await supabase
    .from('transactions')
    .select('id, is_recurring, recurring_source_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!old.is_recurring || old.recurring_source_id) {
    throw new Error('Solo puedes editar plantillas recurrentes.');
  }

  const { data: tx, error: updateError } = await supabase
    .from('transactions')
    .update({
      amount: dto.amount,
      description: dto.description,
      category_id: dto.category_id,
      account_id: dto.account_id,
      recurrence_day: dto.recurrence_day,
    })
    .eq('id', id)
    .select('*, category:categories(name, icon, color)')
    .single();

  if (updateError) throw new Error(updateError.message);

  invalidateRequestCache('recurring:');
  return tx as Transaction;
}
