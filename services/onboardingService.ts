import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/getCurrentUser';
import { getCurrentMonth } from '@/lib/month';

export async function completeOnboarding(monthlyIncome: number): Promise<void> {
  const userId = await getCurrentUserId();

  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingAccount) {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      onboarding_completed: true,
      monthly_income: monthlyIncome,
    });
    if (error) throw new Error(error.message);

    await supabase.from('monthly_balance_config').upsert(
      { user_id: userId, month: getCurrentMonth(), net_balance: monthlyIncome },
      { onConflict: 'user_id,month' }
    );
    return;
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    onboarding_completed: true,
    monthly_income: monthlyIncome,
  });
  if (profileError) throw new Error(profileError.message);

  const { error: accountError } = await supabase.from('accounts').insert({
    user_id: userId,
    name: 'Cuenta Principal',
    type: 'checking',
    balance: monthlyIncome,
    currency: 'COP',
    color: '#FFE566',
  });
  if (accountError) throw new Error(accountError.message);

  const { error: goalError } = await supabase.from('savings_goals').insert({
    user_id: userId,
    title: 'Fondo de Emergencia',
    subtitle: 'Red de Seguridad',
    icon: 'shield-checkmark',
    color: '#AAFF00',
    target_amount: monthlyIncome * 3,
    saved_amount: 0,
  });
  if (goalError) throw new Error(goalError.message);

  const { error: monthError } = await supabase.from('monthly_balance_config').insert({
    user_id: userId,
    month: getCurrentMonth(),
    net_balance: monthlyIncome,
  });
  if (monthError && !monthError.message.includes('duplicate')) {
    throw new Error(monthError.message);
  }
}
