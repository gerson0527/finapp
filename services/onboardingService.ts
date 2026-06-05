import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/getCurrentUser';
import { getCurrentMonth } from '@/lib/month';

export type AccountType = 'checking' | 'savings' | 'cash' | 'credit';

/** Paso 1: guardar ingreso mensual de referencia */
export async function saveOnboardingIncome(monthlyIncome: number): Promise<void> {
  if (!monthlyIncome || monthlyIncome <= 0) {
    throw new Error('Ingresa un monto mayor a 0');
  }

  const userId = await getCurrentUserId();
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      monthly_income: monthlyIncome,
      onboarding_completed: false,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

/** Paso 2: crear primera cuenta */
export async function createOnboardingAccount(
  name: string,
  type: AccountType,
  initialBalance: number,
  color = '#FFE566'
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre de la cuenta es obligatorio');
  if (initialBalance < 0) throw new Error('El balance inicial no puede ser negativo');

  const userId = await getCurrentUserId();

  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from('accounts').insert({
    user_id: userId,
    name: trimmed,
    type,
    balance: initialBalance,
    currency: 'COP',
    color,
  });
  if (error) throw new Error(error.message);
}

/** Paso 3: marcar onboarding completo y datos iniciales */
export async function finishOnboarding(monthlyIncome: number): Promise<void> {
  const userId = await getCurrentUserId();

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      monthly_income: monthlyIncome,
      onboarding_completed: true,
    },
    { onConflict: 'id' }
  );
  if (profileError) throw new Error(profileError.message);

  const { data: account } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (!account) throw new Error('Crea tu primera cuenta antes de continuar');

  const { count } = await supabase
    .from('savings_goals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (!count) {
    await supabase.from('savings_goals').insert({
      user_id: userId,
      title: 'Fondo de Emergencia',
      subtitle: 'Red de Seguridad',
      icon: 'shield-checkmark',
      color: '#AAFF00',
      target_amount: monthlyIncome * 3,
      saved_amount: 0,
    });
  }

  await supabase.from('monthly_balance_config').upsert(
    {
      user_id: userId,
      month: getCurrentMonth(),
      net_balance: Number(account.balance),
    },
    { onConflict: 'user_id,month' }
  );
}

/** Compatibilidad con flujo anterior de una sola pantalla */
export async function completeOnboarding(monthlyIncome: number): Promise<void> {
  await saveOnboardingIncome(monthlyIncome);
  await createOnboardingAccount('Cuenta Principal', 'checking', monthlyIncome);
  await finishOnboarding(monthlyIncome);
}
