import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getMainAccount } from '@/services/accountService';

export interface BudgetWithSpent {
  id: string;
  category_id: string;
  month: string;
  limit_amount: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  spent: number;
  percentage: number;
}

export interface CreateBudgetDTO {
  category_id: string;
  month: string;
  limit_amount: number;
}

export async function getBudgets(month: string): Promise<BudgetWithSpent[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('budgets_with_spent')
    .select('*')
    .eq('month', month)
    .eq('user_id', userId)
    .order('category_name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBudget(dto: CreateBudgetDTO) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      category_id: dto.category_id,
      month: dto.month,
      limit_amount: dto.limit_amount,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBudget(id: string, limit_amount: number) {
  const { data, error } = await supabase
    .from('budgets')
    .update({ limit_amount })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
