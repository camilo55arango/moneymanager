import React, { useState } from 'react';
import { Receipt } from 'lucide-react';
import { isSystemTransaction } from '../../context/AppContext';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDay, groupByDay } from '../../utils/dates';
import { TransactionRow } from './TransactionRow';

const PAGE_SIZE = 20;

interface ActivityListProps {
  transactions: Transaction[];
  today: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

// Actividad agrupada por día, con el neto de gastos/ingresos de cada día
// (sin contar transferencias ni pagos de tarjeta, que solo mueven dinero entre saldos)
export const ActivityList: React.FC<ActivityListProps> = ({ transactions, today, onEdit, onDelete }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? transactions : transactions.slice(0, PAGE_SIZE);
  const groups = groupByDay<Transaction>(visible, (tx) => tx.date);

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-fg">Actividad</h2>
        <span className="text-xs text-fg-subtle">{transactions.length} movimientos</span>
      </div>

      {transactions.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Receipt size={22} strokeWidth={1.75} className="text-fg-subtle" />
          <p className="text-sm text-fg">Aún no hay movimientos</p>
          <p className="text-xs text-fg-subtle">Toca + para registrar tu primer gasto o ingreso.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const net = group.items
              .filter((tx) => !isSystemTransaction(tx))
              .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

            return (
              <div key={group.date}>
                <div className="mb-1.5 flex items-baseline justify-between px-1">
                  <h3 className="text-xs font-medium capitalize text-fg-muted">
                    {formatRelativeDay(group.date, today)}
                  </h3>
                  {net !== 0 && (
                    <span className="font-mono text-xs text-fg-subtle">
                      {net > 0 ? '+' : '−'}
                      {formatCurrency(Math.abs(net))}
                    </span>
                  )}
                </div>
                <ul className="card divide-y divide-line overflow-hidden p-1">
                  {group.items.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </ul>
              </div>
            );
          })}

          {!showAll && transactions.length > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-full border border-line py-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
            >
              Ver los {transactions.length - PAGE_SIZE} restantes
            </button>
          )}
        </div>
      )}
    </section>
  );
};
