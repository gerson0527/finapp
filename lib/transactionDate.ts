import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

/** Interpreta YYYY-MM-DD como fecha local, sin desfase por zona horaria. */
export function parseTransactionDate(dateStr: string): Date {
  const iso = dateStr.slice(0, 10);
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date(dateStr);
  }
  return new Date(year, month - 1, day);
}

export function getTransactionDayKey(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export function getTransactionGroupLabel(dateStr: string): string {
  const d = parseTransactionDate(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}
