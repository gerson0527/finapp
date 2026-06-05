import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/getCurrentUser';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export interface CreateCategoryDTO {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('name');
  if (type === 'income') {
    query = query.in('type', ['income', 'both']);
  } else if (type === 'expense') {
    query = query.in('type', ['expense', 'both']);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(dto)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(dto)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Transacciones del usuario actual que usan esta categoría */
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

export async function deleteCategory(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const txCount = await getCategoryTransactionCount(id);

  if (txCount > 0) {
    throw new Error(
      'No se puede eliminar: ya tienes transacciones con esta categoría'
    );
  }

  const { error: budgetsError } = await supabase
    .from('budgets')
    .delete()
    .eq('category_id', id)
    .eq('user_id', userId);

  if (budgetsError) throw new Error(budgetsError.message);

  const { data, error } = await supabase.from('categories').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error(
      'No se pudo eliminar la categoría. Si es una categoría del sistema, puede estar protegida.'
    );
  }
}
