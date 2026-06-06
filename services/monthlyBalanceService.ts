import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getMainAccount } from '@/services/accountService';
import { getCurrentMonth } from '@/lib/month';

export interface MonthlyBalanceConfig {
  id: string;
  user_id: string;
  month: string;
  net_balance: number;
  created_at: string;
}

export type BalanceComparisonResult = 'gain' | 'loss' | 'neutral';

export interface BalanceComparison {
  referenceMonth: string;
  compareMonth: string;
  referenceBalance: number;
  compareBalance: number;
  difference: number;
  percentChange: number | null;
  result: BalanceComparisonResult;
}

export async function isMonthConfigured(month: string): Promise<boolean> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return true;

  const { data, error } = await supabase
    .from('monthly_balance_config')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function getMonthBalance(month: string): Promise<number | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('monthly_balance_config')
    .select('net_balance')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? Number(data.net_balance) : null;
}

export async function getConfiguredMonths(): Promise<string[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('monthly_balance_config')
    .select('month')
    .eq('user_id', userId)
    .order('month', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.month);
}

export async function getReferenceBalance(referenceMonth: string): Promise<number | null> {
  if (referenceMonth === getCurrentMonth()) {
    const account = await getMainAccount();
    if (account) return Number(account.balance);
  }
  return getMonthBalance(referenceMonth);
}

export async function compareMonthBalances(
  compareMonth: string,
  referenceMonth: string = getCurrentMonth()
): Promise<BalanceComparison | null> {
  if (compareMonth === referenceMonth) return null;

  const compareBalance = await getMonthBalance(compareMonth);
  if (compareBalance === null) return null;

  const referenceBalance = await getReferenceBalance(referenceMonth);
  if (referenceBalance === null) return null;

  const difference = referenceBalance - compareBalance;
  const percentChange =
    compareBalance !== 0 ? (difference / compareBalance) * 100 : null;

  return {
    referenceMonth,
    compareMonth,
    referenceBalance,
    compareBalance,
    difference,
    percentChange,
    result: difference > 0 ? 'gain' : difference < 0 ? 'loss' : 'neutral',
  };
}

export async function adjustMonthlyBalancesAfterTransactionRemoval(
  transactionDate: string,
  type: 'income' | 'expense' | 'transfer',
  amount: number
): Promise<void> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return;

  const month = transactionDate.slice(0, 7);
  const adjustment = type === 'income' ? -Number(amount) : Number(amount);

  const { data, error } = await supabase
    .from('monthly_balance_config')
    .select('month, net_balance')
    .eq('user_id', userId)
    .gte('month', month);

  if (error) throw new Error(error.message);
  if (!data?.length) return;

  await Promise.all(
    data.map((row) =>
      supabase
        .from('monthly_balance_config')
        .update({ net_balance: Number(row.net_balance) + adjustment })
        .eq('user_id', userId)
        .eq('month', row.month)
    )
  );
}

export async function configureMonthBalance(month: string, netBalance: number): Promise<void> {
  const userId = await getCurrentUserId();
  const account = await getMainAccount();
  if (!account) throw new Error('No hay cuenta disponible');

  const { error: configError } = await supabase
    .from('monthly_balance_config')
    .upsert(
      { user_id: userId, month, net_balance: netBalance },
      { onConflict: 'user_id,month' }
    );

  if (configError) throw new Error(configError.message);

  const { error: accountError } = await supabase
    .from('accounts')
    .update({ balance: netBalance })
    .eq('id', account.id)
    .eq('user_id', userId);

  if (accountError) throw new Error(accountError.message);
}
