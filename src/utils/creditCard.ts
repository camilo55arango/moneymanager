import { isCreditCardExpense, isCreditCardPayment } from '../context/AppContext';
import { PendingItem, Transaction } from '../types';

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

// Compra cargada a la tarjeta: un movimiento ya registrado o un pendiente proyectado a su fecha
export interface CardCharge {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  amount: number;
  installments: number;
  interestRate: number; // % mensual (M.V.)
  source: 'registrado' | 'pendiente';
}

export interface StatementLine {
  charge: CardCharge;
  installment: number; // 1..installments
  capital: number;
  interest: number;
  balanceBefore: number; // capital que se debía de esta compra antes de la cuota
}

export interface CardStatement {
  cutoffDate: string;
  paymentDate: string;
  lines: StatementLine[];
  minimumPayment: number; // suma de las cuotas del extracto
  totalPayment: number; // lo necesario para saldar por completo las compras del extracto
}

// Cuotas con abono constante a capital: cada mes se paga capital / cuotas más el interés
// sobre el capital que falta. La primera cuota llega en el extracto que corresponde a la fecha de compra.
export const getInstallmentSchedule = (charge: CardCharge) => {
  const installments = Math.max(1, Math.floor(charge.installments || 1));
  const rate = Math.max(0, charge.interestRate || 0) / 100;
  const capital = charge.amount / installments;
  const first = getCreditCardCycle(charge.date);
  const [payYear, payMonth] = first.paymentDate.split('-').map(Number);
  const [cutYear, cutMonth] = first.cutoffDate.split('-').map(Number);

  return Array.from({ length: installments }, (_, i) => {
    const balanceBefore = charge.amount - capital * i;
    return {
      installment: i + 1,
      cutoffDate: toDateString(new Date(cutYear, cutMonth - 1 + i, CREDIT_CARD_CUTOFF_DAY)),
      paymentDate: toDateString(new Date(payYear, payMonth - 1 + i, CREDIT_CARD_PAYMENT_DAY)),
      capital,
      interest: Math.round(balanceBefore * rate),
      balanceBefore,
    };
  });
};

// Compras con tarjeta ya registradas y pendientes con tarjeta proyectados a su fecha
export const getCardCharges = (transactions: Transaction[], pendingItems: PendingItem[]): CardCharge[] => [
  ...transactions.filter(isCreditCardExpense).map((tx) => ({
    id: tx.id,
    name: tx.name,
    date: tx.date,
    amount: tx.amount,
    installments: tx.installments ?? 1,
    interestRate: tx.interestRate ?? 0,
    source: 'registrado' as const,
  })),
  ...pendingItems
    .filter((p) => isCreditCardExpense(p) && p.dueDate && p.amount > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      date: p.dueDate!,
      amount: p.amount,
      installments: p.installments ?? 1,
      interestRate: p.interestRate ?? 0,
      source: 'pendiente' as const,
    })),
];

// Pago mínimo de la tarjeta por mes (clave YYYY-MM), según el mes del día de pago de cada cuota
export const getMinimumPaymentsByMonth = (charges: CardCharge[]): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const charge of charges) {
    for (const entry of getInstallmentSchedule(charge)) {
      const month = entry.paymentDate.slice(0, 7);
      totals[month] = (totals[month] || 0) + entry.capital + entry.interest;
    }
  }
  return totals;
};

// Abonos a la tarjeta que cubren el extracto que se paga en `monthKey` (YYYY-MM): los hechos
// después del corte de ese extracto (19 del mes anterior) y hasta el corte siguiente (19 del mes).
export const getStatementPayments = (transactions: Transaction[], monthKey: string): number => {
  const [year, month] = monthKey.split('-').map(Number);
  const from = toDateString(new Date(year, month - 2, CREDIT_CARD_CUTOFF_DAY));
  const to = toDateString(new Date(year, month - 1, CREDIT_CARD_CUTOFF_DAY));
  return transactions
    .filter((tx) => isCreditCardPayment(tx) && tx.date > from && tx.date <= to)
    .reduce((sum, tx) => sum + tx.amount, 0);
};

// Primera cuota de una compra, para mostrarla al registrarla
export const getFirstInstallment = (amount: number, installments: number, interestRate: number): number => {
  const n = Math.max(1, Math.floor(installments || 1));
  return amount / n + Math.round(amount * (Math.max(0, interestRate || 0) / 100));
};

// Extractos que se pagan a partir de `today`: el actual (próximo día de pago) y los siguientes
export const buildCardStatements = (charges: CardCharge[], today: string, count: number): CardStatement[] => {
  const [year, month, day] = today.split('-').map(Number);
  const firstMonth = month - 1 + (day > CREDIT_CARD_PAYMENT_DAY ? 1 : 0);

  const statements: CardStatement[] = Array.from({ length: count }, (_, i) => ({
    cutoffDate: toDateString(new Date(year, firstMonth + i - 1, CREDIT_CARD_CUTOFF_DAY)),
    paymentDate: toDateString(new Date(year, firstMonth + i, CREDIT_CARD_PAYMENT_DAY)),
    lines: [],
    minimumPayment: 0,
    totalPayment: 0,
  }));

  for (const charge of charges) {
    for (const entry of getInstallmentSchedule(charge)) {
      const statement = statements.find((s) => s.paymentDate === entry.paymentDate);
      if (!statement) continue;
      statement.lines.push({
        charge,
        installment: entry.installment,
        capital: entry.capital,
        interest: entry.interest,
        balanceBefore: entry.balanceBefore,
      });
      statement.minimumPayment += entry.capital + entry.interest;
      statement.totalPayment += entry.balanceBefore + entry.interest;
    }
  }

  statements.forEach((s) => s.lines.sort((a, b) => a.charge.date.localeCompare(b.charge.date)));
  return statements;
};
