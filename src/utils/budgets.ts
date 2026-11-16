import { isSystemTransaction } from '../context/AppContext';
import { Transaction } from '../types';

// Margen sobre el ritmo esperado antes de avisar (10% = gastar un poco más rápido es normal)
const PACE_TOLERANCE = 0.1;

export type BudgetState = 'over' | 'ahead' | 'ok';

export interface BudgetStatus {
  category: string;
  budget: number;
  spent: number;
  expected: number; // lo que "tocaría" llevar gastado hoy si se gastara parejo durante el mes
  paceDiffPct: number; // % por encima (+) o por debajo (-) del ritmo esperado
  state: BudgetState;
}

// Avance del mes de 0 a 1 (el día de hoy cuenta como transcurrido)
export const getMonthProgress = (today: string) => {
  const [year, month, day] = today.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return { day, daysInMonth, ratio: day / daysInMonth };
};

const STREAK_LOOKBACK_DAYS = 90;

export interface BudgetDay {
  date: string;
  spent: number;
  limit: number;
  withinBudget: boolean;
}

// Racha de días seguidos (hasta hoy) en que el gasto de las categorías con presupuesto no superó
// el límite diario: la suma de los presupuestos repartida entre los días del mes. Hoy solo rompe
// la racha si ya se pasó; si va bien, cuenta. No se cuentan días anteriores al primer movimiento.
export const getBudgetStreak = (
  budgets: Record<string, number>,
  transactions: Transaction[],
  today: string
): { streak: number; lastWeek: BudgetDay[] } => {
  const categories = Object.keys(budgets);
  if (categories.length === 0) return { streak: 0, lastWeek: [] };
  const monthlyTotal = categories.reduce((sum, c) => sum + budgets[c], 0);

  const spentByDay = new Map<string, number>();
  let firstDate = today;
  for (const tx of transactions) {
    if (tx.date < firstDate) firstDate = tx.date;
    if (tx.type !== 'expense' || isSystemTransaction(tx) || !(tx.category in budgets)) continue;
    spentByDay.set(tx.date, (spentByDay.get(tx.date) ?? 0) + tx.amount);
  }

  const dayAt = (offset: number): BudgetDay => {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - offset);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const limit = monthlyTotal / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const spent = spentByDay.get(date) ?? 0;
    return { date, spent, limit, withinBudget: spent <= limit };
  };

  let streak = 0;
  for (let offset = 0; offset < STREAK_LOOKBACK_DAYS; offset++) {
    const day = dayAt(offset);
    if (day.date < firstDate || !day.withinBudget) break;
    streak++;
  }

  return { streak, lastWeek: Array.from({ length: 7 }, (_, i) => dayAt(6 - i)) };
};

// Gasto del mes actual por categoría contra su presupuesto. Cuenta gastos de cualquier cuenta
// (también con tarjeta), sin transferencias ni pagos de tarjeta, que solo mueven dinero.
export const getBudgetStatuses = (
  budgets: Record<string, number>,
  transactions: Transaction[],
  today: string
): BudgetStatus[] => {
  const monthKey = today.slice(0, 7);
  const { ratio } = getMonthProgress(today);

  const spentByCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.date.slice(0, 7) !== monthKey || isSystemTransaction(tx)) continue;
    spentByCategory.set(tx.category, (spentByCategory.get(tx.category) ?? 0) + tx.amount);
  }

  return Object.entries(budgets)
    .map(([category, budget]) => {
      const spent = spentByCategory.get(category) ?? 0;
      const expected = budget * ratio;
      const paceDiffPct = expected > 0 ? ((spent - expected) / expected) * 100 : 0;
      const state: BudgetState =
        spent > budget ? 'over' : spent > expected * (1 + PACE_TOLERANCE) ? 'ahead' : 'ok';
      return { category, budget, spent, expected, paceDiffPct, state };
    })
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget);
};
