import React from 'react';
import { ArrowLeftRight, ChevronRight, CreditCard, LucideIcon, TrendingUp, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';

const actionClass =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

interface AccountRowProps {
  Icon: LucideIcon;
  label: React.ReactNode;
  amount: number;
  children?: React.ReactNode; // detalle bajo el monto
  action: React.ReactNode;
}

// En móvil cada cuenta es una fila (datos a la izquierda, acción a la derecha);
// desde md las tres quedan en columnas dentro de la misma tarjeta
const AccountRow: React.FC<AccountRowProps> = ({ Icon, label, amount, children, action }) => (
  <div className="flex items-center justify-between gap-3 p-4 md:flex-col md:items-start md:justify-between md:gap-4 md:p-5">
    <div className="min-w-0 flex-1 md:w-full">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon size={16} strokeWidth={1.75} className="shrink-0" />
        {label}
      </div>
      <p className="mt-1 truncate font-mono text-xl font-semibold tracking-tight text-fg md:text-2xl">
        {formatCurrency(amount)}
      </p>
      {children}
    </div>
    {action}
  </div>
);

export const AccountTiles: React.FC = () => {
  const {
    walletBalance,
    investmentBalance,
    creditCardBalance,
    creditLimit,
    setIsTransferModalOpen,
    setIsPayCreditModalOpen,
    setCurrentView,
  } = useApp();

  const usedPct = creditLimit > 0 ? Math.min((creditCardBalance / creditLimit) * 100, 100) : 0;
  const availableCredit = Math.max(creditLimit - creditCardBalance, 0);

  return (
    <section className="card shadow-lg shadow-black/5 divide-y divide-line overflow-hidden md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
      <AccountRow
        Icon={Wallet}
        label="Billetera"
        amount={walletBalance}
        action={
          <button type="button" onClick={() => setIsTransferModalOpen(true)} className={actionClass}>
            <ArrowLeftRight size={14} strokeWidth={1.75} />
            Transferir
          </button>
        }
      />

      <AccountRow
        Icon={TrendingUp}
        label="Inversiones"
        amount={investmentBalance}
        action={
          <button type="button" onClick={() => setIsTransferModalOpen(true)} className={actionClass}>
            <ArrowLeftRight size={14} strokeWidth={1.75} />
            Mover
          </button>
        }
      />

      <AccountRow
        Icon={CreditCard}
        label={
          <button
            type="button"
            onClick={() => setCurrentView('tarjeta')}
            className="flex items-center gap-0.5 hover:text-fg transition-colors cursor-pointer"
          >
            Tarjeta · deuda
            <ChevronRight size={14} />
          </button>
        }
        amount={creditCardBalance}
        action={
          <button
            type="button"
            onClick={() => setIsPayCreditModalOpen(true)}
            disabled={creditCardBalance <= 0}
            className={actionClass}
          >
            Pagar
          </button>
        }
      >
        {creditLimit > 0 ? (
          <>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full ${usedPct >= 80 ? 'bg-negative' : usedPct >= 50 ? 'bg-warning' : 'bg-accent'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-fg-subtle">
              {Math.round(usedPct)}% del cupo · {formatCurrency(availableCredit)} libre
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-fg-subtle">Sin cupo configurado</p>
        )}
      </AccountRow>
    </section>
  );
};
