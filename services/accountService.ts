import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';

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

export async function getAccounts(): Promise<Account[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMainAccount(): Promise<Account | null> {
  const accounts = await getAccounts();
  return accounts[0] ?? null;
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
  return data;
}
