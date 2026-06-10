import { getCurrentMonth } from '@/lib/month';

/** Oculta plantillas recurrentes en listados (solo instancias generadas). */
export const RECURRING_INSTANCE_FILTER = 'is_recurring.eq.false,recurring_source_id.not.is.null';

/** Fecha YYYY-MM-DD del día recurrente dentro de un mes (ajusta al último día si hace falta). */
export function getRecurrenceDateInMonth(recurrenceDay: number, month = getCurrentMonth()): string {
  const [year, m] = month.split('-').map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  const day = Math.min(Math.max(recurrenceDay, 1), lastDay);
  return `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
