import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import {
  assertCanCreateExpense,
  assertCanUpdateToExpense,
} from '@/lib/balanceCheck';
import { getMainAccount, getAccount } from '@/services/accountService';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category_id: string;
  account_id: string;
  date: string;
  time: string;
  note?: string;
  budget_id?: string | null;
  is_recurring?: boolean;
  recurrence_day?: number | null;
  category?: {
    name: string;
    icon: string;
    color: string;
  };
}

export interface CreateTransactionDTO {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category_id: string;
  account_id: string;
  date: string;
  time: string;
  note?: string;
  budget_id?: string;
  is_recurring?: boolean;
  recurrence_day?: number;
}

export interface CreateTransferDTO {
  amount: number;
  from_account_id: string;
  to_account_id: string;
  category_id: string;
  date: string;
  time: string;
  note?: string;
}

export type UpdateTransactionDTO = CreateTransactionDTO;

function balanceDelta(type: string, amount: number): number {
  return type === 'income' ? amount : -amount;
}

export interface MonthlyStats {
  income: number;
  expenses: number;
  balance: number;
}

export async function getTransactions(month: string, accountId?: string): Promise<Transaction[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, m, 0).toISOString().split('T')[0];

  let query = supabase
    .from('transactions')
    .select('*, category:categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  if (accountId) {
    query = query.eq('account_id', accountId);
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTransactionsByCategory(categoryId: string, month: string): Promise<Transaction[]> {
  const account = await getMainAccount();
  if (!account) return [];

  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, m, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(name, icon, color)')
    .eq('account_id', account.id)
    .eq('category_id', categoryId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
  const userId = await getCurrentUserId();

  if (dto.type === 'expense') {
    const account = await getAccount(dto.account_id);
    if (!account) throw new Error('No hay cuenta disponible');
    assertCanCreateExpense(dto.amount, Number(account.balance));
  }

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      category_id: dto.category_id,
      account_id: dto.account_id,
      date: dto.date,
      time: dto.time,
      note: dto.note,
      budget_id: dto.budget_id ?? null,
      is_recurring: dto.is_recurring ?? false,
      recurrence_day: dto.is_recurring ? dto.recurrence_day ?? null : null,
      recurring_source_id: null,
    })
    .select('*, category:categories(name, icon, color)')
    .single();

  if (txError) throw new Error(txError.message);

  const delta = dto.type === 'income' ? dto.amount : -dto.amount;
  const { error: acctError } = await supabase.rpc('update_account_balance', {
    account_id: dto.account_id,
    delta,
  });

  if (acctError) {
    await supabase.from('transactions').delete().eq('id', tx.id);
    throw new Error(acctError.message);
  }

  return tx;
}

export async function createTransfer(dto: CreateTransferDTO): Promise<void> {
  const userId = await getCurrentUserId();

  if (dto.from_account_id === dto.to_account_id) {
    throw new Error('Elige cuentas diferentes para la transferencia');
  }

  const from = await getAccount(dto.from_account_id);
  const to = await getAccount(dto.to_account_id);
  if (!from || !to) throw new Error('Cuenta no encontrada');

  assertCanCreateExpense(dto.amount, Number(from.balance));

  const description = 'Transferencia entre cuentas';

  const { data: outTx, error: outError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'expense',
      amount: dto.amount,
      description,
      category_id: dto.category_id,
      account_id: dto.from_account_id,
      date: dto.date,
      time: dto.time,
      note: dto.note,
    })
    .select('id')
    .single();

  if (outError) throw new Error(outError.message);

  const { error: outBalError } = await supabase.rpc('update_account_balance', {
    account_id: dto.from_account_id,
    delta: -dto.amount,
  });
  if (outBalError) {
    await supabase.from('transactions').delete().eq('id', outTx.id);
    throw new Error(outBalError.message);
  }

  const { data: inTx, error: inError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'income',
      amount: dto.amount,
      description,
      category_id: dto.category_id,
      account_id: dto.to_account_id,
      date: dto.date,
      time: dto.time,
      note: dto.note,
    })
    .select('id')
    .single();

  if (inError) {
    await supabase.rpc('update_account_balance', {
      account_id: dto.from_account_id,
      delta: dto.amount,
    });
    await supabase.from('transactions').delete().eq('id', outTx.id);
    throw new Error(inError.message);
  }

  const { error: inBalError } = await supabase.rpc('update_account_balance', {
    account_id: dto.to_account_id,
    delta: dto.amount,
  });

  if (inBalError) {
    await supabase.from('transactions').delete().eq('id', inTx.id);
    await supabase.rpc('update_account_balance', {
      account_id: dto.from_account_id,
      delta: dto.amount,
    });
    await supabase.from('transactions').delete().eq('id', outTx.id);
    throw new Error(inBalError.message);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, amount, account_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error: delError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (delError) throw new Error(delError.message);

  const delta = tx.type === 'income' ? -tx.amount : tx.amount;
  const { error: acctError } = await supabase.rpc('update_account_balance', {
    account_id: tx.account_id,
    delta,
  });

  if (acctError) throw new Error(acctError.message);
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(name, icon, color)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTransaction(id: string, dto: UpdateTransactionDTO): Promise<Transaction> {
  const { data: old, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, amount, account_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const account = await getAccount(dto.account_id);
  if (account) {
    assertCanUpdateToExpense(
      dto.amount,
      Number(account.balance),
      old.type,
      Number(old.amount),
      dto.type
    );
  }

  const reverseDelta = -balanceDelta(old.type, Number(old.amount));
  const { error: reverseError } = await supabase.rpc('update_account_balance', {
    account_id: old.account_id,
    delta: reverseDelta,
  });
  if (reverseError) throw new Error(reverseError.message);

  const { data: tx, error: updateError } = await supabase
    .from('transactions')
    .update({
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      category_id: dto.category_id,
      account_id: dto.account_id,
      date: dto.date,
      time: dto.time,
      note: dto.note,
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

  const { error: applyError } = await supabase.rpc('update_account_balance', {
    account_id: dto.account_id,
    delta: balanceDelta(dto.type, dto.amount),
  });

  if (applyError) throw new Error(applyError.message);
  return tx;
}

export async function getMonthlyStats(month: string): Promise<MonthlyStats> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return { income: 0, expenses: 0, balance: 0 };

  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, m, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  if (error) throw new Error(error.message);

  const income = (data ?? [])
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = (data ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { income, expenses, balance: income - expenses };
}
