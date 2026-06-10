import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { RECURRING_INSTANCE_FILTER } from '@/lib/recurrenceDate';
import { cachedFetch } from '@/lib/requestCache';

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

export interface NetBalanceByMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface AnalyticsInsight {
  id: string;
  icon: 'trending-up' | 'trending-down' | 'calendar' | 'flash' | 'wallet';
  title: string;
  body: string;
  tone: 'neutral' | 'warning' | 'positive';
}

export interface AdvancedAnalytics extends ExpenseAnalytics {
  insights: AnalyticsInsight[];
  busiestDay: { date: string; total: number } | null;
  topGrowthCategory: {
    name: string;
    changePercent: number;
    current: number;
    previous: number;
  } | null;
  netBalanceTrend: NetBalanceByMonth[];
}

import { formatMonthLabel } from '@/lib/month';

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
    .or(RECURRING_INSTANCE_FILTER)
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
      const cat = row.category as unknown as { name: string; color: string } | null;
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

function buildInsights(
  currentMonth: string,
  data: ExpenseAnalytics,
  busiestDay: AdvancedAnalytics['busiestDay'],
  topGrowth: AdvancedAnalytics['topGrowthCategory']
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (data.percentChange != null) {
    const up = data.percentChange > 0;
    insights.push({
      id: 'month-change',
      icon: up ? 'trending-up' : 'trending-down',
      title: up ? 'Gastaste más este mes' : 'Vas mejor que el mes pasado',
      body:
        data.percentChange === 0
          ? 'Tus gastos se mantienen igual al mes anterior.'
          : `Tus gastos ${up ? 'subieron' : 'bajaron'} ${Math.abs(data.percentChange).toFixed(1)}% vs ${formatMonthLabel(shiftMonth(currentMonth, -1))}.`,
      tone: up ? 'warning' : 'positive',
    });
  }

  if (busiestDay) {
    const dayLabel = new Date(busiestDay.date + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
    });
    insights.push({
      id: 'busiest-day',
      icon: 'calendar',
      title: 'Tu día más caro',
      body: `El ${dayLabel} gastaste más: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(busiestDay.total)}.`,
      tone: 'neutral',
    });
  }

  if (topGrowth && topGrowth.changePercent > 0) {
    insights.push({
      id: 'category-growth',
      icon: 'flash',
      title: `${topGrowth.name} creció más`,
      body: `Gastaste ${topGrowth.changePercent.toFixed(0)}% más en ${topGrowth.name} que el mes anterior.`,
      tone: 'warning',
    });
  }

  if (data.byCategory.length > 0) {
    const top = data.byCategory[0];
    const share = data.currentMonthTotal > 0 ? (top.total / data.currentMonthTotal) * 100 : 0;
    insights.push({
      id: 'top-category',
      icon: 'wallet',
      title: 'Categoría principal',
      body: `${top.category_name} concentra el ${share.toFixed(0)}% de tus gastos este mes.`,
      tone: 'neutral',
    });
  }

  return insights;
}

export async function getAdvancedAnalytics(currentMonth: string): Promise<AdvancedAnalytics> {
  const userId = await getCurrentUserIdOrNull();
  const cacheKey = `analytics:${userId ?? 'anon'}:${currentMonth}`;

  return cachedFetch(cacheKey, async () => {
    const base = await getExpenseAnalytics(currentMonth);

    if (!userId) {
      return {
        ...base,
        insights: [],
        busiestDay: null,
        topGrowthCategory: null,
        netBalanceTrend: [],
      };
    }

    const months = base.monthly.map((m) => m.month);
    const startMonth = months[0];
    const [sy, sm] = startMonth.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, 1).toISOString().split('T')[0];

    const { data, error } = await supabase
    .from('transactions')
    .select('amount, date, type, category_id, category:categories(name)')
    .eq('user_id', userId)
    .or(RECURRING_INSTANCE_FILTER)
    .gte('date', startDate)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const prevMonth = shiftMonth(currentMonth, -1);

  const dayTotals = new Map<string, number>();
  const currentCat = new Map<string, { name: string; total: number }>();
  const prevCat = new Map<string, number>();
  const netMap = new Map<string, NetBalanceByMonth>();

  months.forEach((m) => netMap.set(m, { month: m, income: 0, expenses: 0, net: 0 }));

  for (const row of rows) {
    const mk = String(row.date).slice(0, 7);
    const amount = Number(row.amount);

    if (row.type === 'income' && netMap.has(mk)) {
      const n = netMap.get(mk)!;
      n.income += amount;
      n.net += amount;
    } else if (row.type === 'expense') {
      if (netMap.has(mk)) {
        const n = netMap.get(mk)!;
        n.expenses += amount;
        n.net -= amount;
      }

      if (mk === currentMonth) {
        dayTotals.set(String(row.date), (dayTotals.get(String(row.date)) ?? 0) + amount);
        const catId = row.category_id as string;
        const catName = (row.category as unknown as { name: string } | null)?.name ?? 'Sin categoría';
        const existing = currentCat.get(catId);
        if (existing) existing.total += amount;
        else currentCat.set(catId, { name: catName, total: amount });
      }

      if (mk === prevMonth) {
        const catId = row.category_id as string;
        prevCat.set(catId, (prevCat.get(catId) ?? 0) + amount);
      }
    }
  }

  let busiestDay: AdvancedAnalytics['busiestDay'] = null;
  for (const [date, total] of dayTotals) {
    if (!busiestDay || total > busiestDay.total) busiestDay = { date, total };
  }

  let topGrowthCategory: AdvancedAnalytics['topGrowthCategory'] = null;
  for (const [catId, cur] of currentCat) {
    const prev = prevCat.get(catId) ?? 0;
    if (prev <= 0 && cur.total <= 0) continue;
    const changePercent = prev > 0 ? ((cur.total - prev) / prev) * 100 : 100;
    if (!topGrowthCategory || changePercent > topGrowthCategory.changePercent) {
      topGrowthCategory = {
        name: cur.name,
        changePercent,
        current: cur.total,
        previous: prev,
      };
    }
  }

  const insights = buildInsights(currentMonth, base, busiestDay, topGrowthCategory);

  return {
    ...base,
    insights,
    busiestDay,
    topGrowthCategory,
    netBalanceTrend: Array.from(netMap.values()),
  };
  }, 45_000);
}
