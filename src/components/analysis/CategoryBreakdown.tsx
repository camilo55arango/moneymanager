import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/categories';

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

// Totales por categoría, de mayor a menor, con su porcentaje sobre `total`
export const groupByCategory = (items: Transaction[], total: number): CategoryTotal[] => {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of items) {
    const entry = map.get(t.category) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    map.set(t.category, entry);
  }
  return [...map.entries()]
    .map(([category, data]) => ({ category, ...data, percentage: total > 0 ? (data.total / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
};

// Lista de categorías con su monto, porcentaje y barra de proporción
export const CategoryBreakdown: React.FC<{ items: CategoryTotal[]; emptyText: string }> = ({ items, emptyText }) =>
  items.length === 0 ? (
    <p className="py-6 text-center text-sm text-fg-subtle">{emptyText}</p>
  ) : (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const { Icon, color } = getCategoryMeta(item.category);
        return (
          <li key={item.category}>
            <div className="mb-1.5 flex items-center gap-2 text-sm">
              <Icon size={14} strokeWidth={1.75} style={{ color }} />
              <span className="flex-1 truncate text-fg">{item.category}</span>
              <span className="text-xs text-fg-subtle">{item.percentage.toFixed(0)}%</span>
              <span className="w-28 text-right font-mono text-fg">{formatCurrency(Math.round(item.total))}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
