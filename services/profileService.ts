import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';

export interface Profile {
  id: string;
  onboarding_completed: boolean;
  monthly_income: number | null;
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, onboarding_completed, monthly_income')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function needsOnboarding(): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return true;
  return !profile.onboarding_completed;
}
