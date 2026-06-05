/** Mínimo fijo: por debajo de esto se considera saldo crítico */
export const MIN_CRITICAL_BALANCE = 50_000;

/** % de ingresos del mes: si el balance cae bajo esto, alerta */
export const INCOME_CRITICAL_RATIO = 0.02;

export function getCriticalBalanceThreshold(monthlyIncome: number): number {
  const fromIncome =
    monthlyIncome > 0 ? Math.round(monthlyIncome * INCOME_CRITICAL_RATIO) : MIN_CRITICAL_BALANCE;
  return Math.max(MIN_CRITICAL_BALANCE, fromIncome);
}

export function isBalanceCritical(balance: number, monthlyIncome = 0): boolean {
  return balance <= getCriticalBalanceThreshold(monthlyIncome);
}

export function isBalanceEmpty(balance: number): boolean {
  return balance <= 0;
}
