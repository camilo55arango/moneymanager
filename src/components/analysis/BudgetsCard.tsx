import React, { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { useApp, isSystemTransaction } from '../../context/AppContext';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/categories';
import { BudgetStatus, getBudgetStatuses, getBudgetStreak, getMonthProgress } from '../../utils/budgets';
import { formatShortDate } from '../../utils/dates';

// Categorías que son ingresos y no llevan presupuesto de gasto
const NON_BUDGET_CATEGORIES = ['Salario', 'I. Extra', 'Inversiones'];
const AVERAGE_MONTHS = 3;

const STATE_STYLES: Record<BudgetStatus['state'], { bar: string; text: string }> = {
  over: { bar: 'bg-negative', text: 'text-negative' },
  ahead: { bar: 'bg-warning', text: 'text-warning' },
  ok: { bar: 'bg-accent', text: 'text-fg-subtle' },
};

const statusText = (s: BudgetStatus) => {
  if (s.state === 'over') return `Excedido por ${formatCurrency(Math.round(s.spent - s.budget))}`;
  if (s.state === 'ahead') return `${Math.round(s.paceDiffPct)}% por encima del ritmo`;
  return `Quedan ${formatCurrency(Math.round(s.budget - s.spent))}`;
};

export const BudgetsCard: React.FC<{ today: string }> = ({ today }) => {
  const { budgets, budgetsAvailable, setBudget, transactions, categories } = useApp();
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const statuses = useMemo(() => getBudgetStatuses(budgets, transactions, today), [budgets, transactions, today]);
  const { streak, lastWeek } = useMemo(
    () => getBudgetStreak(budgets, transactions, today),
    [budgets, transactions, today]
  );
  const { day, daysInMonth, ratio } = getMonthProgress(today);
  const monthName = new Date(today + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long' });

  // Promedio mensual de los últimos meses completos, como sugerencia al definir presupuestos
  const monthlyAverage = useMemo(() => {
    const [year, month] = today.split('-').map(Number);
    const from = new Date(year, month - 1 - AVERAGE_MONTHS, 1);
    const fromKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;
    const totals = new Map<string, number>();
    for (const tx of transactions) {
      const key = tx.date.slice(0, 7);
      if (tx.type !== 'expense' || isSystemTransaction(tx) || key < fromKey || key >= today.slice(0, 7)) continue;
      totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    }
    return (category: string) => Math.round((totals.get(category) ?? 0) / AVERAGE_MONTHS);
  }, [transactions, today]);

  if (!budgetsAvailable) return null;

  const startEditing = () => {
    setDrafts(Object.fromEntries(Object.keys(budgets).map((cat) => [cat, formatInputNumber(budgets[cat])])));
    setEditing(true);
  };

  const save = async () => {
    const budgetCategories = categories.filter((c) => !NON_BUDGET_CATEGORIES.includes(c));
    await Promise.all(
      budgetCategories
        .filter((cat) => parseFormattedNumber(drafts[cat] ?? '') !== (budgets[cat] ?? 0))
        .map((cat) => setBudget(cat, parseFormattedNumber(drafts[cat] ?? '') || null))
    );
    setEditing(false);
  };

  return (
    <section className="card p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-fg">Presupuestos de {monthName}</h2>
          <p className="text-xs text-fg-subtle">
            Día {day} de {daysInMonth} · el mes va al {Math.round(ratio * 100)}%
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-3 py-1.5 text-xs text-fg-muted hover:text-fg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent cursor-pointer"
            >
              Guardar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-fg hover:bg-surface-2 cursor-pointer"
          >
            {statuses.length ? 'Editar' : 'Definir'}
          </button>
        )}
      </div>

      {editing ? (
        <ul className="space-y-2">
          {categories
            .filter((c) => !NON_BUDGET_CATEGORIES.includes(c))
            .map((cat) => {
              const { Icon, color } = getCategoryMeta(cat);
              const average = monthlyAverage(cat);
              return (
                <li key={cat} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}1F`, color }}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{cat}</span>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-fg-subtle">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={drafts[cat] ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [cat]: formatInputNumber(e.target.value) }))}
                      placeholder={average > 0 ? formatInputNumber(average) : 'Sin límite'}
                      title={average > 0 ? `Promedio de los últimos ${AVERAGE_MONTHS} meses` : undefined}
                      className="w-full rounded-lg border border-line bg-canvas py-1.5 pl-6 pr-2 text-right font-mono text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-line-strong"
                    />
                  </div>
                </li>
              );
            })}
          <p className="pt-1 text-xs text-fg-subtle">
            La sugerencia gris es tu promedio de los últimos {AVERAGE_MONTHS} meses. Deja vacío para no tener límite.
          </p>
        </ul>
      ) : statuses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Target size={20} strokeWidth={1.75} className="text-fg-subtle" />
          <p className="text-sm text-fg-muted">Define cuánto quieres gastar al mes por categoría</p>
          <p className="text-xs text-fg-subtle">Te avisamos si vas gastando más rápido de lo que alcanza.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {statuses.map((s) => {
            const { Icon, color } = getCategoryMeta(s.category);
            const style = STATE_STYLES[s.state];
            const fillPct = Math.min((s.spent / s.budget) * 100, 100);
            return (
              <li key={s.category}>
                <div className="mb-1.5 flex items-center gap-2 text-sm">
                  <Icon size={14} strokeWidth={1.75} style={{ color }} />
                  <span className="flex-1 truncate text-fg">{s.category}</span>
                  <span className="font-mono text-fg">{formatCurrency(Math.round(s.spent))}</span>
                  <span className="font-mono text-xs text-fg-subtle">/ {formatCurrency(s.budget)}</span>
                </div>
                <div className="relative h-1.5 w-full rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${fillPct}%` }} />
                  {/* Marca del ritmo esperado a la fecha */}
                  <span
                    className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-fg-muted"
                    style={{ left: `${ratio * 100}%` }}
                    title="Ritmo esperado a hoy"
                  />
                </div>
                <p className={`mt-1 text-xs ${style.text}`}>{statusText(s)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Racha: últimos 7 días contra el límite diario */}
      {!editing && lastWeek.length > 0 && (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-sm text-fg">
              {streak === 0
                ? 'Hoy te pasaste del límite diario'
                : `${streak} ${streak === 1 ? 'día' : 'días'} seguidos dentro del presupuesto`}
            </p>
            <p className="text-xs text-fg-subtle">
              Límite diario {formatCurrency(Math.round(lastWeek[lastWeek.length - 1].limit))}
            </p>
          </div>
          <ol className="flex gap-1.5" aria-label="Últimos 7 días">
            {lastWeek.map((d) => (
              <li
                key={d.date}
                title={`${formatShortDate(d.date)}: ${formatCurrency(Math.round(d.spent))} de ${formatCurrency(
                  Math.round(d.limit)
                )}`}
                aria-label={`${formatShortDate(d.date)}: ${d.withinBudget ? 'dentro' : 'por encima'} del presupuesto`}
                className={`h-6 w-2.5 rounded-full ${d.withinBudget ? 'bg-positive' : 'bg-negative'} ${
                  d.date === today ? 'ring-2 ring-line-strong ring-offset-1 ring-offset-surface-1' : ''
                }`}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
};
