import React, { useEffect, useState } from 'react';
import { CalendarCheck, ChevronRight, Zap } from 'lucide-react';
import { useApp, isCreditCardExpense, CREDIT_CARD_METHOD } from '../../context/AppContext';
import { PendingItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/categories';
import { addDays, daysBetween, formatShortDate } from '../../utils/dates';

const MAX_ITEMS = 6;
const HORIZON_DAYS = 7;

const dueLabel = (days: number, dueDate: string) => {
  if (days < 0) return `Vencido hace ${-days} d`;
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${formatShortDate(dueDate)} · ${days} d`;
};

const dueTone = (days: number) =>
  days < 0 ? 'text-negative' : days <= 3 ? 'text-warning' : 'text-fg-subtle';

// Pendientes vencidos y de los próximos 7 días, con pago en dos toques
export const UpcomingStrip: React.FC<{ today: string }> = ({ today }) => {
  const { pendingItems, markPendingAsPaid, setCurrentView } = useApp();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  // La confirmación se cancela sola si no se toca de nuevo
  useEffect(() => {
    if (!confirmingId) return;
    const timer = window.setTimeout(() => setConfirmingId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmingId]);

  const limit = addDays(today, HORIZON_DAYS);
  const upcoming = pendingItems
    .filter((p) => p.dueDate !== null && p.dueDate <= limit)
    .slice(0, MAX_ITEMS); // pendingItems ya viene ordenado por fecha

  const handlePay = async (item: PendingItem) => {
    // Sin monto definido hay que indicarlo en Pendientes
    if (item.amount <= 0) {
      setCurrentView('pendientes');
      return;
    }
    if (confirmingId !== item.id) {
      setConfirmingId(item.id);
      return;
    }
    setConfirmingId(null);
    setPayingId(item.id);
    await markPendingAsPaid(item.id, undefined, isCreditCardExpense(item) ? CREDIT_CARD_METHOD : 'Billetera');
    setPayingId(null);
  };

  return (
    <section className="card flex flex-col p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-fg">Próximos 7 días</h2>
        <button
          type="button"
          onClick={() => setCurrentView('pendientes')}
          className="flex items-center gap-0.5 text-xs text-fg-muted hover:text-fg transition-colors cursor-pointer"
        >
          Ver todo
          <ChevronRight size={14} />
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-sm text-fg-subtle">
          <CalendarCheck size={20} strokeWidth={1.75} />
          Nada por pagar esta semana
        </div>
      ) : (
        <ul className="-mx-1 flex flex-col">
          {upcoming.map((item) => {
            const days = daysBetween(today, item.dueDate!);
            const { Icon, color } = getCategoryMeta(item.category);
            const isIncome = item.type === 'income';
            const isConfirming = confirmingId === item.id;

            return (
              <li key={item.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}1F`, color }}
                >
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm text-fg">
                    {item.name}
                    {item.isAutomatic && (
                      <Zap size={12} className="shrink-0 text-fg-subtle" aria-label="Débito automático" />
                    )}
                  </p>
                  <p className={`text-xs ${dueTone(days)}`}>{dueLabel(days, item.dueDate!)}</p>
                </div>
                <p className={`font-mono text-sm ${isIncome ? 'text-positive' : 'text-fg'}`}>
                  {item.amount > 0 ? `${isIncome ? '+' : ''}${formatCurrency(item.amount)}` : 'Por definir'}
                </p>
                <button
                  type="button"
                  onClick={() => handlePay(item)}
                  disabled={payingId === item.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    isConfirming
                      ? 'bg-accent text-on-accent'
                      : 'border border-line text-fg hover:bg-surface-2'
                  }`}
                >
                  {isConfirming ? 'Confirmar' : isIncome ? 'Recibir' : 'Pagar'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
