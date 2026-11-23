import React, { useMemo } from 'react';
import { Check, Clock, CreditCard, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate, todayString } from '../utils/dates';
import {
  buildCardStatements,
  getCardCharges,
  getStatementPayments,
  CardStatement,
  CREDIT_CARD_CUTOFF_DAY,
  CREDIT_CARD_PAYMENT_DAY,
} from '../utils/creditCard';

export const TarjetaView: React.FC = () => {
  const { transactions, pendingItems, creditCardBalance, creditLimit, setIsPayCreditModalOpen } = useApp();

  const statements = useMemo(
    () => buildCardStatements(getCardCharges(transactions, pendingItems), todayString(), 2),
    [transactions, pendingItems]
  );

  const availableCredit = Math.max(creditLimit - creditCardBalance, 0);
  const usedPct = creditLimit > 0 ? Math.min((creditCardBalance / creditLimit) * 100, 100) : 0;

  const renderStatement = (statement: CardStatement, title: string) => {
    const paid = getStatementPayments(transactions, statement.paymentDate.slice(0, 7));
    const isPaid = statement.minimumPayment > 0 && paid >= Math.round(statement.minimumPayment);

    return (
      <section key={statement.paymentDate} className="card overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div>
            <h3 className="text-sm font-medium text-fg">{title}</h3>
            <p className="mt-0.5 text-xs text-fg-subtle">
              Corte {formatShortDate(statement.cutoffDate)} · Pago {formatShortDate(statement.paymentDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-fg-subtle">Pago mínimo</p>
            <p className="font-mono text-lg font-semibold text-fg">
              {formatCurrency(Math.round(statement.minimumPayment))}
            </p>
            {isPaid ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
                <Check size={14} strokeWidth={2} />
                Pagado
              </span>
            ) : (
              paid > 0 && (
                <p className="text-xs text-fg-subtle">
                  Abonado <span className="font-mono text-positive">{formatCurrency(paid)}</span>
                </p>
              )
            )}
            <p className="text-xs text-fg-subtle">
              Total <span className="font-mono text-fg-muted">{formatCurrency(Math.round(statement.totalPayment))}</span>
            </p>
          </div>
        </div>

        {statement.lines.length === 0 ? (
          <p className="p-4 text-center text-sm text-fg-subtle">Sin compras con tarjeta en este extracto.</p>
        ) : (
          <ul className="divide-y divide-line">
            {statement.lines.map((line) => {
              const isRegistered = line.charge.source === 'registrado';
              const SourceIcon = isRegistered ? Receipt : Clock;
              return (
                <li
                  key={`${line.charge.id}_${line.installment}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isRegistered ? 'bg-surface-2 text-fg-muted' : 'bg-accent-soft text-accent'
                      }`}
                      title={isRegistered ? 'Registrado' : 'Pendiente'}
                    >
                      <SourceIcon size={14} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-fg">{line.charge.name}</p>
                      <p className="truncate text-xs text-fg-subtle">
                        {isRegistered ? '' : 'Pendiente · '}
                        {formatShortDate(line.charge.date)} · Cuota {line.installment}/{line.charge.installments}
                        {line.charge.interestRate > 0 && ` · ${line.charge.interestRate}% M.V.`}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm text-fg">
                      {formatCurrency(Math.round(line.capital + line.interest))}
                    </p>
                    {line.interest > 0 && (
                      <p className="text-xs text-fg-subtle">Interés {formatCurrency(line.interest)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4 pb-36 md:px-8 md:pt-6 xl:max-w-[1320px]">
      <p className="text-sm text-fg-muted">
        Corte los {CREDIT_CARD_CUTOFF_DAY} · Pago los {CREDIT_CARD_PAYMENT_DAY} del mes siguiente
      </p>

      {/* Deuda actual y uso del cupo */}
      <section className="card p-5 xl:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <CreditCard size={16} strokeWidth={1.75} />
              Deuda actual
            </p>
            <p className="mt-1 font-mono text-[32px] font-semibold leading-10 tracking-tight text-fg xl:text-[44px] xl:leading-tight">
              {formatCurrency(creditCardBalance)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPayCreditModalOpen(true)}
            disabled={creditCardBalance <= 0}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            Pagar
          </button>
        </div>
        {creditLimit > 0 ? (
          <>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2 xl:h-2">
              <div
                className={`h-full rounded-full ${usedPct >= 80 ? 'bg-negative' : usedPct >= 50 ? 'bg-warning' : 'bg-accent'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-fg-subtle">
              {Math.round(usedPct)}% de {formatCurrency(creditLimit)} · {formatCurrency(availableCredit)} disponible
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs text-fg-subtle">Sin cupo configurado</p>
        )}
      </section>

      {/* Desde xl los dos extractos van lado a lado para comparar los pagos */}
      <div className="space-y-4 xl:grid xl:grid-cols-2 xl:items-start xl:gap-4 xl:space-y-0">
        {statements.map((statement, i) => renderStatement(statement, i === 0 ? 'Extracto actual' : 'Próximo extracto'))}
      </div>

      <p className="text-xs text-fg-subtle">
        Las cuotas se calculan con abono constante a capital más el interés mensual sobre el saldo de cada compra.
        Los abonos que hagas a la tarjeta no se descuentan de esta proyección.
      </p>
    </main>
  );
};
