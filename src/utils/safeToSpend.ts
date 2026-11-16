import { isCreditCardExpense } from '../context/AppContext';
import { PendingItem, Transaction } from '../types';
import { getCardCharges, getMinimumPaymentsByMonth, getStatementPayments } from './creditCard';

export interface SafeToSpend {
  available: number; // lo que se puede gastar sin dejar de cubrir lo comprometido del mes
  committed: number; // pendingWallet + cardMinimum
  pendingWallet: number; // gastos pendientes que salen de la billetera hasta fin de mes (incluye vencidos)
  pendingWalletCount: number;
  cardMinimum: number; // lo que falta abonar al pago mínimo de la tarjeta que vence este mes
}

// Dinero de la billetera que no está comprometido este mes. Usa la misma lógica que el
// total mensual de Pendientes: los gastos con tarjeta no salen de la billetera hasta que se
// paga el mínimo, y lo de Inversiones sale del saldo de inversiones.
export const getSafeToSpend = (
  walletBalance: number,
  pendingItems: PendingItem[],
  transactions: Transaction[],
  today: string
): SafeToSpend => {
  const monthKey = today.slice(0, 7);

  const walletItems = pendingItems.filter(
    (p) =>
      p.type === 'expense' &&
      p.dueDate !== null &&
      p.dueDate.slice(0, 7) <= monthKey &&
      !isCreditCardExpense(p) &&
      p.category.trim() !== 'Inversiones'
  );
  const pendingWallet = walletItems.reduce((sum, p) => sum + p.amount, 0);

  const minimum = getMinimumPaymentsByMonth(getCardCharges(transactions, pendingItems))[monthKey] ?? 0;
  const cardMinimum = Math.max(Math.round(minimum - getStatementPayments(transactions, monthKey)), 0);

  const committed = pendingWallet + cardMinimum;
  return {
    available: walletBalance - committed,
    committed,
    pendingWallet,
    pendingWalletCount: walletItems.length,
    cardMinimum,
  };
};
