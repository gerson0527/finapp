import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit';
  balance: number;
  currency: string;
  color: string;
}

export async function getMainAccount(): Promise<Account | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}
