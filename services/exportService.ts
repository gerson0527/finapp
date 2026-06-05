import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getBudgets } from '@/services/budgetService';
import { getMonthlyStats } from '@/services/transactionService';
import { formatMonthLabel } from '@/lib/month';
import { formatCOP } from '@/src/utils/currency';

export interface ExportRow {
  date: string;
  time: string;
  description: string;
  category: string;
  type: string;
  amount: number;
  account: string;
}

const TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

async function shareFile(uri: string, mimeType: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType, UTI: mimeType });
  } else {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
}

export async function getExportRows(month: string): Promise<ExportRow[]> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return [];

  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, m, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('date, time, description, type, amount, category:categories(name), account:accounts(name)')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    date: String(row.date),
    time: String(row.time ?? ''),
    description: String(row.description ?? ''),
    category: (row.category as unknown as { name: string } | null)?.name ?? 'Sin categoría',
    type: TYPE_LABELS[row.type as string] ?? String(row.type),
    amount: Number(row.amount),
    account: (row.account as unknown as { name: string } | null)?.name ?? 'Cuenta',
  }));
}

export async function exportMonthCsv(month: string): Promise<void> {
  const rows = await getExportRows(month);
  const header = 'Fecha,Hora,Descripción,Categoría,Tipo,Monto,Cuenta';
  const lines = rows.map((r) =>
    [
      escapeCsv(r.date),
      escapeCsv(r.time),
      escapeCsv(r.description),
      escapeCsv(r.category),
      escapeCsv(r.type),
      String(r.amount),
      escapeCsv(r.account),
    ].join(',')
  );
  const csv = [header, ...lines].join('\n');
  const filename = `finapp-${month}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await shareFile(path, 'text/csv', filename);
}

function buildPdfHtml(
  month: string,
  rows: ExportRow[],
  stats: Awaited<ReturnType<typeof getMonthlyStats>>,
  budgets: Awaited<ReturnType<typeof getBudgets>>
): string {
  const monthLabel = formatMonthLabel(month);
  const txRows = rows
    .map(
      (r) => `<tr>
        <td>${r.date}</td>
        <td>${r.time.slice(0, 5)}</td>
        <td>${r.description}</td>
        <td>${r.category}</td>
        <td>${r.type}</td>
        <td style="text-align:right">${formatCOP(r.amount)}</td>
        <td>${r.account}</td>
      </tr>`
    )
    .join('');

  const budgetRows = budgets
    .map(
      (b) => `<tr>
        <td>${b.title}</td>
        <td style="text-align:right">${formatCOP(Number(b.spent))}</td>
        <td style="text-align:right">${formatCOP(Number(b.limit_amount))}</td>
        <td style="text-align:right">${Number(b.percentage).toFixed(0)}%</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .muted { color: #666; font-size: 13px; margin-bottom: 20px; }
  .summary { display: flex; gap: 16px; margin-bottom: 24px; }
  .card { border: 2px solid #1a1a1a; padding: 12px 16px; border-radius: 8px; flex: 1; }
  .card label { font-size: 11px; text-transform: uppercase; color: #666; }
  .card strong { display: block; font-size: 18px; margin-top: 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #FFE566; font-weight: 700; }
</style></head><body>
  <h1>FinApp — Resumen ${monthLabel}</h1>
  <p class="muted">Exportado el ${new Date().toLocaleDateString('es-CO')}</p>
  <div class="summary">
    <div class="card"><label>Ingresos</label><strong>${formatCOP(stats.income)}</strong></div>
    <div class="card"><label>Gastos</label><strong>${formatCOP(stats.expenses)}</strong></div>
    <div class="card"><label>Balance neto</label><strong>${formatCOP(stats.balance)}</strong></div>
  </div>
  <h2>Transacciones (${rows.length})</h2>
  <table>
    <thead><tr>
      <th>Fecha</th><th>Hora</th><th>Descripción</th><th>Categoría</th><th>Tipo</th><th>Monto</th><th>Cuenta</th>
    </tr></thead>
    <tbody>${txRows || '<tr><td colspan="7">Sin transacciones</td></tr>'}</tbody>
  </table>
  <h2>Presupuestos</h2>
  <table>
    <thead><tr><th>Nombre</th><th>Gastado</th><th>Límite</th><th>%</th></tr></thead>
    <tbody>${budgetRows || '<tr><td colspan="4">Sin presupuestos</td></tr>'}</tbody>
  </table>
</body></html>`;
}

export async function exportMonthPdf(month: string): Promise<void> {
  const [rows, stats, budgets] = await Promise.all([
    getExportRows(month),
    getMonthlyStats(month),
    getBudgets(month),
  ]);

  const html = buildPdfHtml(month, rows, stats, budgets);
  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri, 'application/pdf', `finapp-${month}.pdf`);
}
