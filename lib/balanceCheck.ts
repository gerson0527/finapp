/** Mensaje estándar cuando un gasto supera el saldo disponible */
export const BALANCE_EXCEEDED_MESSAGE =
  'Este gasto supera tu balance disponible.';

export function expenseExceedsBalance(
  amount: number,
  availableBalance: number
): boolean {
  return amount > availableBalance;
}

/** Valida un gasto nuevo contra el balance actual de la cuenta */
export function assertCanCreateExpense(
  amount: number,
  availableBalance: number
): void {
  if (expenseExceedsBalance(amount, availableBalance)) {
    throw new Error(BALANCE_EXCEEDED_MESSAGE);
  }
}

/**
 * Valida edición de transacción: al subir un gasto, el extra no puede superar el balance.
 * Si antes era ingreso, el gasto nuevo debe caber en el balance actual.
 */
export function expenseUpdateExceedsBalance(
  newAmount: number,
  availableBalance: number,
  oldType: string,
  oldAmount: number,
  newType: string
): boolean {
  if (newType !== 'expense') return false;
  const credit = oldType === 'expense' ? Number(oldAmount) : 0;
  return newAmount > availableBalance + credit;
}

export function assertCanUpdateToExpense(
  newAmount: number,
  availableBalance: number,
  oldType: string,
  oldAmount: number,
  newType: string
): void {
  if (
    expenseUpdateExceedsBalance(
      newAmount,
      availableBalance,
      oldType,
      oldAmount,
      newType
    )
  ) {
    throw new Error(BALANCE_EXCEEDED_MESSAGE);
  }
}
