import React from 'react';
import { ArrowLeftRight, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';

const tileClass = 'card flex min-w-[240px] snap-start flex-col justify-between gap-4 p-4 md:min-w-0';
const actionClass =
  'inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-2 transition-colors cursor-pointer';

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
    <section className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      <div className={tileClass}>
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Wallet size={16} strokeWidth={1.75} />
          Billetera
        </div>
        <p className="font-mono text-2xl font-semibold tracking-tight text-fg">{formatCurrency(walletBalance)}</p>
        <div>
          <button type="button" onClick={() => setIsTransferModalOpen(true)} className={actionClass}>
            <ArrowLeftRight size={14} strokeWidth={1.75} />
            Transferir
          </button>
        </div>
      </div>

      <div className={tileClass}>
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <TrendingUp size={16} strokeWidth={1.75} />
          Inversiones
        </div>
        <p className="font-mono text-2xl font-semibold tracking-tight text-fg">{formatCurrency(investmentBalance)}</p>
        <div>
          <button type="button" onClick={() => setIsTransferModalOpen(true)} className={actionClass}>
            <ArrowLeftRight size={14} strokeWidth={1.75} />
            Mover
          </button>
        </div>
      </div>

      <div className={tileClass}>
        <button
          type="button"
          onClick={() => setCurrentView('tarjeta')}
          className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors cursor-pointer text-left"
        >
          <CreditCard size={16} strokeWidth={1.75} />
          Tarjeta · deuda
        </button>
        <div>
          <p className="font-mono text-2xl font-semibold tracking-tight text-fg">{formatCurrency(creditCardBalance)}</p>
          {creditLimit > 0 ? (
            <>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${usedPct >= 80 ? 'bg-negative' : usedPct >= 50 ? 'bg-warning' : 'bg-fg-muted'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-fg-subtle">
                {Math.round(usedPct)}% del cupo · {formatCurrency(availableCredit)} libre
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-xs text-fg-subtle">Sin cupo configurado</p>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsPayCreditModalOpen(true)}
            disabled={creditCardBalance <= 0}
            className={`${actionClass} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Pagar tarjeta
          </button>
        </div>
      </div>
    </section>
  );
};
