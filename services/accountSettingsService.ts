import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/getCurrentUser';
import { invalidateRequestCache } from '@/lib/requestCache';

export interface UserMetadata {
  display_name?: string;
  bio?: string;
}

export async function updateUserMetadata(patch: UserMetadata): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Debes iniciar sesión');

  const current = (user.user_metadata ?? {}) as UserMetadata;
  const { error } = await supabase.auth.updateUser({
    data: { ...current, ...patch },
  });
  if (error) throw new Error(error.message);
}

export async function updateEmail(newEmail: string): Promise<void> {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Ingresa un correo válido');
  }

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function updateMonthlyIncome(monthlyIncome: number): Promise<void> {
  if (!monthlyIncome || monthlyIncome <= 0) {
    throw new Error('Ingresa un monto mayor a 0');
  }

  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, monthly_income: monthlyIncome, onboarding_completed: true },
      { onConflict: 'id' }
    );

  if (error) throw new Error(error.message);
  invalidateRequestCache('profile:');
  invalidateRequestCache('accounts:');
  invalidateRequestCache('main-account:');
}
