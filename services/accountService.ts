import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getCurrentMonth } from '@/lib/month';
import { RECURRING_INSTANCE_FILTER } from '@/lib/recurrenceDate';
import { cachedFetch, invalidateRequestCache } from '@/lib/requestCache';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit';
  balance: number;
  currency: string;
  color: string;
}

export interface CreateAccountDTO {
  name: string;
  type: Account['type'];
  balance: number;
  color?: string;
  currency?: string;
}

function txDelta(type: string, amount: number): number {
  return type === 'income' ? Number(amount) : -Number(amount);
}

/**
 * Recalcula el balance de la cuenta principal desde ingreso mensual + movimientos.
 * Corrige desfases si se borraron transacciones directo en la base de datos.
 */
export async function recalculateMainAccountBalance(): Promise<number | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  const [{ data: accounts, error: acctError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from('accounts')
        .select('id, balance')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1),
      supabase.from('profiles').select('monthly_income').eq('id', userId).maybeSingle(),
    ]);

  if (acctError) throw new Error(acctError.message);
  if (profileError) throw new Error(profileError.message);

  const account = accounts?.[0];
  if (!account || profile?.monthly_income == null) return null;

  const base = Number(profile.monthly_income);
  const accountId = account.id;

  const { count, error: countError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .or(RECURRING_INSTANCE_FILTER);

  if (countError) throw new Error(countError.message);

  let newBalance = base;
  if (count && count > 0) {
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .or(RECURRING_INSTANCE_FILTER);

    if (txError) throw new Error(txError.message);
    const txNet = (txs ?? []).reduce((sum, t) => sum + txDelta(t.type, t.amount), 0);
    newBalance = base + txNet;
  }

  if (Number(account.balance) === newBalance) return newBalance;

  const { error: accountError } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId)
    .eq('user_id', userId);

  if (accountError) throw new Error(accountError.message);

  const month = getCurrentMonth();
  await supabase
    .from('monthly_balance_config')
    .upsert(
      { user_id: userId, month, net_balance: newBalance },
      { onConflict: 'user_id,month' }
    );

  invalidateRequestCache('accounts:');
  return newBalance;
}

export async function getAccounts(): Promise<Account[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  return cachedFetch(
    `accounts:${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    30_000
  );
}

export async function getMainAccount(): Promise<Account | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  return cachedFetch(
    `main-account:${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    25_000
  );
}

export async function getAccount(id: string): Promise<Account | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createAccount(dto: CreateAccountDTO): Promise<Account> {
  const userId = await getCurrentUserId();
  const name = dto.name.trim();
  if (!name) throw new Error('El nombre es obligatorio');
  if (dto.balance < 0) throw new Error('El balance inicial no puede ser negativo');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name,
      type: dto.type,
      balance: dto.balance,
      currency: dto.currency ?? 'COP',
      color: dto.color ?? '#FFE566',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  invalidateRequestCache('accounts:');
  invalidateRequestCache('main-account:');
  return data;
}
