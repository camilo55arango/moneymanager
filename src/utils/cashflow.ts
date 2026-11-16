import { isCreditCardExpense } from '../context/AppContext';
import { PendingItem, Transaction } from '../types';
import {
  CREDIT_CARD_PAYMENT_DAY,
  getCardCharges,
  getMinimumPaymentsByMonth,
  getStatementPayments,
} from './creditCard';
import { addDays } from './dates';

export interface CashflowPoint {
  date: string; // YYYY-MM-DD
  balance: number; // saldo proyectado de la billetera al final del día
}

export interface CashflowProjection {
  points: CashflowPoint[];
  lowest: CashflowPoint;
  end: CashflowPoint;
}

// Saldo de la billetera día a día durante los próximos `days` días, aplicando los pendientes
// (ingresos y gastos que no van a tarjeta ni a inversiones) en su fecha y el pago mínimo de la
// tarjeta en cada día de pago. Lo vencido y sin pagar se cuenta hoy.
export const projectCashflow = (
  walletBalance: number,
  pendingItems: PendingItem[],
  transactions: Transaction[],
  today: string,
  days: number
): CashflowProjection => {
  const lastDay = addDays(today, days);
  const deltas = new Map<string, number>();
  const add = (date: string, amount: number) => {
    const day = date < today ? today : date;
    if (day <= lastDay) deltas.set(day, (deltas.get(day) ?? 0) + amount);
  };

  for (const p of pendingItems) {
    if (!p.dueDate || p.amount <= 0) continue;
    if (isCreditCardExpense(p) || p.category.trim() === 'Inversiones') continue;
    add(p.dueDate, p.type === 'income' ? p.amount : -p.amount);
  }

  const minimums = getMinimumPaymentsByMonth(getCardCharges(transactions, pendingItems));
  for (const [monthKey, amount] of Object.entries(minimums)) {
    if (monthKey < today.slice(0, 7)) continue;
    const remaining = Math.round(amount - getStatementPayments(transactions, monthKey));
    if (remaining > 0) add(`${monthKey}-${String(CREDIT_CARD_PAYMENT_DAY).padStart(2, '0')}`, -remaining);
  }

  const points: CashflowPoint[] = [];
  let balance = walletBalance;
  for (let i = 0; i <= days; i++) {
    const date = addDays(today, i);
    balance += deltas.get(date) ?? 0;
    points.push({ date, balance });
  }

  const lowest = points.reduce((min, p) => (p.balance < min.balance ? p : min), points[0]);
  return { points, lowest, end: points[points.length - 1] };
};
