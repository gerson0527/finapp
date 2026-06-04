import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';

export interface SavingsGoal {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  color: string;
  target_amount: number;
  saved_amount: number;
}

export interface CreateSavingsGoalDTO {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  target_amount: number;
  saved_amount?: number;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSavingsGoal(dto: CreateSavingsGoalDTO): Promise<SavingsGoal> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id: userId,
      title: dto.title,
      subtitle: dto.subtitle,
      icon: dto.icon,
      color: dto.color,
      target_amount: dto.target_amount,
      saved_amount: dto.saved_amount ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function addContribution(goalId: string, amount: number): Promise<SavingsGoal> {
  const { data, error } = await supabase.rpc('add_savings_contribution', {
    goal_id: goalId,
    contribution_amount: amount,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
