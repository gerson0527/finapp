import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { cachedFetch, invalidateRequestCache } from '@/lib/requestCache';

export interface Profile {
  id: string;
  onboarding_completed: boolean;
  monthly_income: number | null;
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return null;

  return cachedFetch(`profile:${userId}`, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, onboarding_completed, monthly_income')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }, 60_000);
}

export async function needsOnboarding(): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return true;
  return !profile.onboarding_completed;
}
