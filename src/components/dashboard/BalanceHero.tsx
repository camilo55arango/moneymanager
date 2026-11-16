import React from 'react';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { formatCurrency } from '../../utils/formatCurrency';
import { SafeToSpend } from '../../utils/safeToSpend';
import { CashflowProjection } from '../../utils/cashflow';
import { CashflowSparkline } from './CashflowSparkline';

interface BalanceHeroProps {
  walletBalance: number;
  safe: SafeToSpend;
  projection: CashflowProjection;
}

// "Disponible real": lo que queda en la billetera después de lo comprometido este mes
export const BalanceHero: React.FC<BalanceHeroProps> = ({ walletBalance, safe, projection }) => {
  const isShort = safe.available < 0;
  const base = Math.max(walletBalance, safe.committed, 1);
  const committedPct = Math.min((safe.committed / base) * 100, 100);
  const month = new Date().toLocaleDateString('es-ES', { month: 'long' });

  return (
    <section className="card relative overflow-hidden p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
      />

      <p className="text-sm text-fg-muted">Disponible real</p>
      <p
        className={`mt-1 font-mono font-semibold tracking-tight text-[40px] leading-[48px] md:text-[56px] md:leading-[64px] ${
          isShort ? 'text-negative' : 'text-fg'
        }`}
      >
        <AnimatedNumber value={safe.available} />
      </p>
      <p className="mt-1 text-sm text-fg-muted">
        {isShort
          ? `Te faltan ${formatCurrency(-safe.available)} para cubrir lo de ${month}`
          : safe.committed > 0
          ? `Después de cubrir lo comprometido en ${month}`
          : `Nada comprometido en ${month}`}
      </p>

      {/* Billetera dividida en comprometido / libre */}
      <div className="mt-5 flex h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full transition-[width] duration-500 ${isShort ? 'bg-negative' : 'bg-warning'}`}
          style={{ width: `${committedPct}%` }}
        />
        {!isShort && <div className="h-full flex-1 bg-accent" />}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-fg-subtle">Billetera</dt>
          <dd className="mt-0.5 font-mono text-fg">{formatCurrency(walletBalance)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Pendientes
          </dt>
          <dd className="mt-0.5 font-mono text-fg">
            {formatCurrency(safe.pendingWallet)}
            {safe.pendingWalletCount > 0 && (
              <span className="ml-1 font-sans text-xs text-fg-subtle">({safe.pendingWalletCount})</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Mín. tarjeta
          </dt>
          <dd className="mt-0.5 font-mono text-fg">{formatCurrency(safe.cardMinimum)}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-line pt-4">
        <CashflowSparkline projection={projection} />
      </div>
    </section>
  );
};
