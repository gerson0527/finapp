import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
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

export async function getRecurringTemplates(): Promise<RecurringTemplate[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(name, icon, color), account:accounts(name)')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('recurring_source_id', null)
    .order('description');

  if (error) throw new Error(error.message);
  return (data ?? []) as RecurringTemplate[];
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
    .select('id, type, amount, account_id, is_recurring, recurring_source_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!tx.is_recurring || tx.recurring_source_id) {
    throw new Error('Solo puedes eliminar plantillas recurrentes.');
  }

  const { error: delError } = await supabase.from('transactions').delete().eq('id', id);
  if (delError) throw new Error(delError.message);

  const delta = tx.type === 'income' ? -Number(tx.amount) : Number(tx.amount);
  const { error: balError } = await supabase.rpc('update_account_balance', {
    account_id: tx.account_id,
    delta,
  });
  if (balError) throw new Error(balError.message);
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
    .select('id, type, amount, account_id, is_recurring, recurring_source_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!old.is_recurring || old.recurring_source_id) {
    throw new Error('Solo puedes editar plantillas recurrentes.');
  }

  const reverseDelta = old.type === 'income' ? -Number(old.amount) : Number(old.amount);
  const { error: reverseError } = await supabase.rpc('update_account_balance', {
    account_id: old.account_id,
    delta: reverseDelta,
  });
  if (reverseError) throw new Error(reverseError.message);

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

  if (updateError) {
    await supabase.rpc('update_account_balance', {
      account_id: old.account_id,
      delta: -reverseDelta,
    });
    throw new Error(updateError.message);
  }

  const applyDelta = old.type === 'income' ? dto.amount : -dto.amount;
  const { error: applyError } = await supabase.rpc('update_account_balance', {
    account_id: dto.account_id,
    delta: applyDelta,
  });
  if (applyError) throw new Error(applyError.message);

  return tx as Transaction;
}
