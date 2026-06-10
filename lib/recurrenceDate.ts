import { getCurrentMonth } from '@/lib/month';

/** Oculta plantillas recurrentes en listados (solo instancias generadas). */
export const RECURRING_INSTANCE_FILTER = 'is_recurring.eq.false,is_recurring.is.null';

export function isRecurringTemplate(row: {
  is_recurring?: boolean | null;
  recurring_source_id?: string | null;
}): boolean {
  return row.is_recurring === true && row.recurring_source_id == null;
}

/** Quita plantillas recurrentes (metadata); deja movimientos reales e instancias del mes. */
export function filterVisibleTransactions<T extends {
  is_recurring?: boolean | null;
  recurring_source_id?: string | null;
}>(rows: T[]): T[] {
  return rows.filter((row) => !isRecurringTemplate(row));
}

/** Fecha YYYY-MM-DD del día recurrente dentro de un mes (ajusta al último día si hace falta). */
export function getRecurrenceDateInMonth(recurrenceDay: number, month = getCurrentMonth()): string {
  const [year, m] = month.split('-').map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  const day = Math.min(Math.max(recurrenceDay, 1), lastDay);
  return `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
