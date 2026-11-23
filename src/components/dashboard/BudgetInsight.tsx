import React, { useMemo } from 'react';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getBudgetStatuses } from '../../utils/budgets';

// Aviso de la categoría que peor va contra su presupuesto; no se muestra si todo va bien
export const BudgetInsight: React.FC<{ today: string }> = ({ today }) => {
  const { budgets, transactions, setCurrentView } = useApp();
  const worst = useMemo(
    () => getBudgetStatuses(budgets, transactions, today).find((s) => s.state !== 'ok'),
    [budgets, transactions, today]
  );

  if (!worst) return null;

  const isOver = worst.state === 'over';
  const message = isOver
    ? `Te pasaste ${formatCurrency(Math.round(worst.spent - worst.budget))} del presupuesto de ${worst.category}`
    : `Vas ${Math.round(worst.paceDiffPct)}% por encima del ritmo en ${worst.category}`;

  return (
    <button
      type="button"
      onClick={() => setCurrentView('estadisticas')}
      className="flex w-full items-center gap-3 rounded-card border-l-4 border-negative bg-negative-soft p-3 text-left hover:opacity-90 transition-opacity cursor-pointer"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isOver ? 'bg-negative text-on-negative' : 'bg-surface-3 text-negative'
        }`}
      >
        <TriangleAlert size={16} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-fg">{message}</span>
        <span className="block text-xs text-fg-subtle">
          {formatCurrency(Math.round(worst.spent))} de {formatCurrency(worst.budget)} este mes
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-fg-subtle" />
    </button>
  );
};
