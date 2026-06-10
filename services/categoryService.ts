import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { cachedFetch, invalidateRequestCache } from '@/lib/requestCache';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  user_id?: string | null;
}

export interface CreateCategoryDTO {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const userId = await getCurrentUserIdOrNull();
  const cacheKey = `categories:${userId ?? 'anon'}:${type ?? 'all'}`;

  return cachedFetch(cacheKey, async () => {
    if (!userId) return [];

    let query = supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name');

    if (type === 'income') {
      query = query.in('type', ['income', 'both']);
    } else if (type === 'expense') {
      query = query.in('type', ['expense', 'both']);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }, 60_000);
}

export async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...dto, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('categories')
    .update(dto)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se puede editar una categoría del sistema o que no te pertenece.');
  return data;
}

export interface CategoryUsage {
  transactionCount: number;
  budgetCount: number;
  inUse: boolean;
}

/** Transacciones del usuario (actuales o pasadas) que usan esta categoría */
export async function getCategoryTransactionCount(id: string): Promise<number> {
  const userId = await getCurrentUserId();
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Presupuestos del usuario que usan esta categoría */
export async function getCategoryBudgetCount(id: string): Promise<number> {
  const userId = await getCurrentUserId();
  const { count, error } = await supabase
    .from('budgets')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getCategoryUsage(id: string): Promise<CategoryUsage> {
  const [transactionCount, budgetCount] = await Promise.all([
    getCategoryTransactionCount(id),
    getCategoryBudgetCount(id),
  ]);
  return {
    transactionCount,
    budgetCount,
    inUse: transactionCount > 0 || budgetCount > 0,
  };
}

function categoryInUseMessage(usage: CategoryUsage): string {
  const parts: string[] = [];
  if (usage.transactionCount > 0) {
    parts.push(
      `${usage.transactionCount} transacción${usage.transactionCount > 1 ? 'es' : ''} en tu historial`
    );
  }
  if (usage.budgetCount > 0) {
    parts.push(
      `${usage.budgetCount} presupuesto${usage.budgetCount > 1 ? 's' : ''} activo${usage.budgetCount > 1 ? 's' : ''}`
    );
  }
  return `No se puede eliminar: esta categoría está en uso (${parts.join(' y ')}).`;
}

export async function deleteCategory(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const usage = await getCategoryUsage(id);

  if (usage.inUse) {
    throw new Error(categoryInUseMessage(usage));
  }

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error(
      'No se pudo eliminar la categoría. Las categorías del sistema no se pueden borrar.'
    );
  }
}
