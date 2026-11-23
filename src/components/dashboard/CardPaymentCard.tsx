import React, { useMemo } from 'react';
import { Check, ChevronRight, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { daysBetween, formatShortDate } from '../../utils/dates';
import { buildCardStatements, getCardCharges, getStatementPayments } from '../../utils/creditCard';

// Pago mínimo del próximo extracto de la tarjeta, con lo abonado y el aviso si vence pronto
export const CardPaymentCard: React.FC<{ today: string; className?: string }> = ({ today, className = '' }) => {
  const { transactions, pendingItems, setIsPayCreditModalOpen, setCurrentView } = useApp();

  const statement = useMemo(
    () => buildCardStatements(getCardCharges(transactions, pendingItems), today, 1)[0],
    [transactions, pendingItems, today]
  );
  const paid = getStatementPayments(transactions, statement.paymentDate.slice(0, 7));
  const minimum = Math.round(statement.minimumPayment);
  const remaining = Math.max(minimum - paid, 0);
  const isPaid = minimum > 0 && remaining === 0;
  const days = daysBetween(today, statement.paymentDate);

  return (
    <section className={`card p-4 md:p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-fg">
          <CreditCard size={16} strokeWidth={1.75} className="text-fg-muted" />
          Tarjeta · próximo pago
        </h2>
        <button
          type="button"
          onClick={() => setCurrentView('tarjeta')}
          className="flex items-center gap-0.5 text-xs text-fg-muted hover:text-fg transition-colors cursor-pointer"
        >
          Ver extracto
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-fg-subtle">Pago mínimo · {formatShortDate(statement.paymentDate)}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-fg">{formatCurrency(minimum)}</p>
          {isPaid ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-positive">
              <Check size={14} strokeWidth={2} />
              Pagado
            </span>
          ) : minimum > 0 ? (
            <p className="mt-1 text-xs">
              <span
                className={days <= 3 ? 'rounded-full bg-negative-soft px-1.5 text-negative' : 'text-fg-subtle'}
              >
                {days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Faltan ${days} días`}
              </span>
              {paid > 0 && <span className="text-fg-subtle"> · abonado {formatCurrency(paid)}</span>}
            </p>
          ) : (
            <p className="mt-1 text-xs text-fg-subtle">Sin compras en este extracto</p>
          )}
          <p className="mt-1 text-xs text-fg-subtle">
            Total <span className="font-mono text-fg-muted">{formatCurrency(Math.round(statement.totalPayment))}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPayCreditModalOpen(true)}
          disabled={remaining <= 0}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        >
          Pagar
        </button>
      </div>
    </section>
  );
};
