const copNumber = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Solo dígitos — para guardar el valor interno del input */
export function parseCOPDigits(text: string): string {
  return text.replace(/\D/g, '');
}

/** Formato colombiano con puntos: 1.000.000 */
export function formatCOPDigits(digits: string): string {
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return copNumber.format(n);
}

/** Convierte dígitos del input a número */
export function copDigitsToNumber(digits: string): number {
  return Number(parseCOPDigits(digits)) || 0;
}

export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
