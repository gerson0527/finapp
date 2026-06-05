import { Transaction } from '@/services/transactionService';

export function isBudgetPayment(tx: Transaction): boolean {
  return !!tx.budget_id;
}

export function isSavingsContribution(tx: Transaction): boolean {
  return tx.description?.startsWith('Aporte:') ?? false;
}

/** Movimientos que no deben abrir el formulario de edición de transacciones. */
export function isEditableTransaction(tx: Transaction): boolean {
  return !isBudgetPayment(tx) && !isSavingsContribution(tx);
}

export function getTransactionSourceLabel(tx: Transaction): string | null {
  if (isBudgetPayment(tx)) return 'Pago de presupuesto';
  if (isSavingsContribution(tx)) return 'Aporte a meta de ahorro';
  return null;
}
