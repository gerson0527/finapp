import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(month: string, pattern = 'MMMM yyyy'): string {
  const [year, m] = month.split('-').map(Number);
  const label = format(new Date(year, m - 1, 1), pattern, { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Fecha por defecto al registrar un gasto en un mes de presupuesto */
export function getDefaultDateForMonth(month: string): Date {
  const now = new Date();
  const current = getCurrentMonth();
  if (month === current) return now;
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m, 0);
}

export function getRecentMonths(count = 12): { value: string; label: string }[] {
  const now = new Date();
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(d, 'yyyy-MM');
    months.push({ value, label: formatMonthLabel(value) });
  }
  return months;
}
