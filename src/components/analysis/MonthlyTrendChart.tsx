import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

export interface MonthTotals {
  label: string;
  yearMonth: string;
  income: number;
  expense: number;
}

const CHART_HEIGHT = 160;

// Barras agrupadas ingresos/gastos por mes. Un solo eje (pesos), etiqueta de valor al pasar
// el cursor o tocar un mes, y leyenda siempre visible.
export const MonthlyTrendChart: React.FC<{ months: MonthTotals[] }> = ({ months }) => {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const maxVal = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1);
  const active = months.find((m) => m.yearMonth === activeMonth) ?? months[months.length - 1];

  const barHeight = (value: number) => (value > 0 ? Math.max((value / maxVal) * CHART_HEIGHT, 3) : 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-4 text-xs text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-positive" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-fg-subtle" />
            Gastos
          </span>
        </div>
        <p className="text-xs text-fg-subtle">
          <span className="capitalize text-fg-muted">{active.label}</span>
          {' · '}
          <span className="font-mono text-fg">+{formatCurrency(Math.round(active.income))}</span>
          {' · '}
          <span className="font-mono text-fg">−{formatCurrency(Math.round(active.expense))}</span>
        </p>
      </div>

      <div
        className="grid items-end gap-2 border-b border-line"
        style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`, height: CHART_HEIGHT }}
        onPointerLeave={() => setActiveMonth(null)}
      >
        {months.map((m) => {
          const isActive = active.yearMonth === m.yearMonth;
          return (
            <button
              key={m.yearMonth}
              type="button"
              onPointerEnter={() => setActiveMonth(m.yearMonth)}
              onClick={() => setActiveMonth(m.yearMonth)}
              aria-label={`${m.label}: ingresos ${formatCurrency(m.income)}, gastos ${formatCurrency(m.expense)}`}
              className={`flex h-full items-end justify-center gap-0.5 rounded-t-md transition-colors cursor-pointer ${
                isActive ? 'bg-surface-2' : ''
              }`}
            >
              <span
                className="w-full max-w-4 rounded-t bg-positive transition-[height] duration-300"
                style={{ height: barHeight(m.income) }}
              />
              <span
                className="w-full max-w-4 rounded-t bg-fg-subtle transition-[height] duration-300"
                style={{ height: barHeight(m.expense) }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="mt-2 grid gap-2 text-center text-xs text-fg-subtle"
        style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
      >
        {months.map((m) => (
          <span key={m.yearMonth} className={`truncate ${active.yearMonth === m.yearMonth ? 'text-fg' : ''}`}>
            {m.label.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};
