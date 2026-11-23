export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(val)
    .replace('COP', '$')
    .trim();
};

// Redondea a centavos (el peso colombiano maneja hasta 2 decimales)
export const roundCents = (val: number): number => Math.round(val * 100) / 100;

// Agrega los puntos de miles a una cadena de dígitos
const groupThousands = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Da formato a un monto mientras se escribe: puntos de miles y coma decimal (hasta 2 decimales).
 * Ejemplo: "12521,11" -> "12.521,11". Un punto escrito al final se toma como coma, porque
 * en el campo los puntos que ya hay son de miles.
 */
export const formatInputNumber = (value: string | number): string => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number') {
    if (!isFinite(value)) return '';
    const [int, dec] = roundCents(Math.abs(value)).toString().split('.');
    return groupThousands(int) + (dec ? ',' + dec : '');
  }

  let str = value.replace(/[^0-9.,]/g, '');
  if (!str) return '';

  if (!str.includes(',')) {
    const dots = str.split('.');
    if (str.endsWith('.')) {
      // Punto recién escrito: es el separador decimal
      str = str.slice(0, -1) + ',';
    } else if (dots.length === 2 && dots[0].length > 3 && dots[1].length <= 2) {
      // Monto pegado con punto decimal, ej. "12521.11"
      str = dots[0] + ',' + dots[1];
    }
  }

  const commaAt = str.indexOf(',');
  const intDigits = (commaAt === -1 ? str : str.slice(0, commaAt)).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (commaAt === -1) return intDigits ? groupThousands(intDigits) : '';

  const decDigits = str.slice(commaAt + 1).replace(/\D/g, '').slice(0, 2);
  return groupThousands(intDigits || '0') + ',' + decDigits;
};

/**
 * Convierte un monto con puntos de miles y coma decimal en número.
 * Ejemplo: "12.521,11" -> 12521.11
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : roundCents(parsed);
};
