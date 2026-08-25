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

/**
 * Formats a string/number as user types, adding dots for thousands and millions.
 * Example: 1000000 -> "1.000.000"
 */
export const formatInputNumber = (value: string | number): string => {
  if (value === null || value === undefined || value === '') return '';
  const str = value.toString();
  
  // Extract integer part and optional decimal part
  // Clean all non-numeric characters except first comma/dot for decimal if present
  const cleanStr = str.replace(/[^0-9.,]/g, '');
  if (!cleanStr) return '';

  // If there's a decimal separator (comma or last dot if typed manually)
  const parts = cleanStr.split(/[.,]/);
  
  // If user typed e.g. "1.000.000", parts would be ["1", "000", "000"]
  // Join all parts except last as integer if no decimal was intended, or join all digits
  const rawDigits = cleanStr.replace(/[^0-9]/g, '');
  if (!rawDigits) return '';

  // Format integer with thousands dots
  const formatted = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted;
};

/**
 * Parses a string formatted with thousands dots into a plain number.
 * Example: "1.000.000" -> 1000000
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

