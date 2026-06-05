import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';

export interface ExpenseByMonth {
  month: string;
  total: number;
}

export interface ExpenseByCategory {
  category_id: string;
  category_name: string;
  category_color: string;
  total: number;
}

export interface ExpenseAnalytics {
  monthly: ExpenseByMonth[];
  byCategory: ExpenseByCategory[];
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentChange: number | null;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export async function getExpenseAnalytics(currentMonth: string): Promise<ExpenseAnalytics> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) {
    return {
      monthly: [],
      byCategory: [],
      currentMonthTotal: 0,
      previousMonthTotal: 0,
      percentChange: null,
    };
  }

  const months: string[] = [];
  let cursor = currentMonth;
  for (let i = 0; i < 6; i++) {
    months.push(cursor);
    cursor = shiftMonth(cursor, -1);
  }
  months.reverse();

  const startMonth = months[0];
  const [sy, sm] = startMonth.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, date, category_id, category:categories(name, color)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const monthlyMap = new Map<string, number>();
  months.forEach((m) => monthlyMap.set(m, 0));

  const categoryMap = new Map<string, ExpenseByCategory>();

  for (const row of rows) {
    const d = String(row.date);
    const mk = d.slice(0, 7);
    if (monthlyMap.has(mk)) {
      monthlyMap.set(mk, (monthlyMap.get(mk) ?? 0) + Number(row.amount));
    }

    if (mk === currentMonth) {
      const catId = row.category_id as string;
      const cat = row.category as { name: string; color: string } | null;
      const existing = categoryMap.get(catId);
      if (existing) {
        existing.total += Number(row.amount);
      } else {
        categoryMap.set(catId, {
          category_id: catId,
          category_name: cat?.name ?? 'Sin categoría',
          category_color: cat?.color ?? '#FFE566',
          total: Number(row.amount),
        });
      }
    }
  }

  const monthly: ExpenseByMonth[] = months.map((m) => ({
    month: m,
    total: monthlyMap.get(m) ?? 0,
  }));

  const currentMonthTotal = monthlyMap.get(currentMonth) ?? 0;
  const prev = shiftMonth(currentMonth, -1);
  const previousMonthTotal = monthlyMap.get(prev) ?? 0;
  const percentChange =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : null;

  return {
    monthly,
    byCategory: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    currentMonthTotal,
    previousMonthTotal,
    percentChange,
  };
}
