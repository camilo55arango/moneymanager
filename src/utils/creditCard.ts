// Día del mes en que cierra el extracto de la tarjeta y día en que se paga
export const CREDIT_CARD_CUTOFF_DAY = 19;
export const CREDIT_CARD_PAYMENT_DAY = 9;

export interface CreditCardCycle {
  cutoffDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
}

const toDateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Un gasto hecho hasta el día de corte entra en el extracto de ese mes; uno posterior,
// en el del mes siguiente. El extracto se paga el día de pago del mes siguiente al corte.
// Ej: 5 oct -> corte 19 oct, pago 9 nov. 25 oct -> corte 19 nov, pago 9 dic.
export const getCreditCardCycle = (date: string): CreditCardCycle => {
  const [year, month, day] = date.split('-').map(Number);
  const cutoffMonth = month - 1 + (day > CREDIT_CARD_CUTOFF_DAY ? 1 : 0);
  return {
    cutoffDate: toDateString(new Date(year, cutoffMonth, CREDIT_CARD_CUTOFF_DAY)),
    paymentDate: toDateString(new Date(year, cutoffMonth + 1, CREDIT_CARD_PAYMENT_DAY)),
  };
};
