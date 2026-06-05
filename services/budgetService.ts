import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getPreviousMonth } from '@/lib/month';

export interface BudgetWithSpent {
  id: string;
  title: string;
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
  title: string;
  category_id: string;
  month: string;
  limit_amount: number;
}

type BudgetRow = {
  id: string;
  title: string;
  category_id: string;
  month: string;
  limit_amount: number;
  user_id: string;
};

async function findBudgetByTitle(
  userId: string,
  month: string,
  title: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('title', title)
    .limit(1);

  if (error) throw new Error(error.message);
  return data?.[0]?.id ?? null;
}

export async function getBudgets(month: string): Promise<BudgetWithSpent[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('budgets_with_spent')
    .select('*')
    .eq('month', month)
    .eq('user_id', userId)
    .order('title');

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    title: row.title ?? row.category_name ?? 'Presupuesto',
  }));
}

export async function createBudget(dto: CreateBudgetDTO) {
  const userId = await getCurrentUserId();
  const title = dto.title.trim();

  if (!title) {
    throw new Error('Escribe un nombre para el presupuesto (ej. Netflix, Spotify).');
  }

  const duplicateId = await findBudgetByTitle(userId, dto.month, title);
  if (duplicateId) {
    throw new Error(`Ya tienes un presupuesto llamado "${title}" este mes. Usa otro nombre.`);
  }

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      title,
      category_id: dto.category_id,
      month: dto.month,
      limit_amount: dto.limit_amount,
    })
    .select('id, title, category_id, month, limit_amount, user_id')
    .limit(1);

  if (error) {
    if (error.code === '23505') {
      if (error.message?.includes('budgets_user_month_title_unique') || error.message?.includes('title')) {
        throw new Error(`Ya tienes un presupuesto llamado "${title}" este mes. Usa otro nombre.`);
      }
      if (error.message?.includes('category_id')) {
        throw new Error(
          'Hay una restricción antigua en la base de datos. Ejecuta: npm run db:migrate'
        );
      }
      throw new Error('Ya existe un presupuesto con esos datos este mes.');
    }
    if (error.message?.includes('title')) {
      throw new Error(
        'Falta actualizar la base de datos. Ejecuta: npm run db:migrate-budgets-multiple'
      );
    }
    throw new Error(error.message);
  }

  const row = data?.[0];
  if (!row) throw new Error('No se pudo crear el presupuesto.');
  return row;
}

export async function updateBudget(id: string, limit_amount: number): Promise<BudgetRow> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ limit_amount })
    .eq('id', id)
    .select('id, title, category_id, month, limit_amount, user_id')
    .limit(1);

  if (error) throw new Error(error.message);

  const row = data?.[0];
  if (!row) throw new Error('Presupuesto no encontrado.');
  return row;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Copia presupuestos del mes anterior al mes actual (gasto empieza en 0). */
export async function rolloverBudgetsToMonth(
  targetMonth: string
): Promise<{ created: number; fromMonth: string | null }> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return { created: 0, fromMonth: null };

  const existing = await getBudgets(targetMonth);
  if (existing.length > 0) return { created: 0, fromMonth: null };

  const prevMonth = getPreviousMonth(targetMonth);
  const { data: prevRows, error } = await supabase
    .from('budgets')
    .select('title, category_id, limit_amount')
    .eq('user_id', userId)
    .eq('month', prevMonth)
    .order('title');

  if (error) throw new Error(error.message);
  if (!prevRows?.length) return { created: 0, fromMonth: null };

  const inserts = prevRows.map((b) => ({
    user_id: userId,
    title: b.title,
    category_id: b.category_id,
    month: targetMonth,
    limit_amount: b.limit_amount,
  }));

  const { error: insertError } = await supabase.from('budgets').insert(inserts);
  if (insertError) throw new Error(insertError.message);

  return { created: inserts.length, fromMonth: prevMonth };
}

export async function updateBudgetLimits(
  updates: { id: string; limit_amount: number }[]
): Promise<void> {
  await Promise.all(updates.map((u) => updateBudget(u.id, u.limit_amount)));
}
