import React, { useMemo } from 'react';
import { useApp, isCreditCardExpense } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
  buildCardStatements,
  CardCharge,
  CardStatement,
  CREDIT_CARD_CUTOFF_DAY,
  CREDIT_CARD_PAYMENT_DAY,
} from '../utils/creditCard';

const formatDay = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TarjetaView: React.FC = () => {
  const { transactions, pendingItems, creditCardBalance, creditLimit, setIsPayCreditModalOpen } = useApp();

  // Compras con tarjeta ya registradas y pendientes con tarjeta proyectados a su fecha
  const statements = useMemo(() => {
    const charges: CardCharge[] = [
      ...transactions.filter(isCreditCardExpense).map((tx) => ({
        id: tx.id,
        name: tx.name,
        date: tx.date,
        amount: tx.amount,
        installments: tx.installments ?? 1,
        interestRate: tx.interestRate ?? 0,
        source: 'registrado' as const,
      })),
      ...pendingItems
        .filter((p) => isCreditCardExpense(p) && p.dueDate && p.amount > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          date: p.dueDate!,
          amount: p.amount,
          installments: p.installments ?? 1,
          interestRate: p.interestRate ?? 0,
          source: 'pendiente' as const,
        })),
    ];
    return buildCardStatements(charges, todayString(), 2);
  }, [transactions, pendingItems]);

  const availableCredit = Math.max(creditLimit - creditCardBalance, 0);

  const renderStatement = (statement: CardStatement, title: string) => (
    <section
      key={statement.paymentDate}
      className="mb-stack-lg bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden"
    >
      <div className="p-4 border-b border-outline-variant/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant font-bold uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-sm font-semibold text-on-surface mt-0.5">Pago {formatDay(statement.paymentDate)}</p>
            <p className="text-[11px] text-outline">Corte {formatDay(statement.cutoffDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-outline">Pago mínimo</p>
            <p className="font-numeric-data text-lg font-bold text-error">
              {formatCurrency(Math.round(statement.minimumPayment))}
            </p>
            <p className="text-[11px] text-outline">
              Pago total:{' '}
              <span className="font-numeric-data font-semibold text-on-surface">
                {formatCurrency(Math.round(statement.totalPayment))}
              </span>
            </p>
          </div>
        </div>
      </div>

      {statement.lines.length === 0 ? (
        <p className="p-4 text-xs text-outline text-center">Sin compras con tarjeta en este extracto.</p>
      ) : (
        <div className="divide-y divide-outline-variant/30">
          {statement.lines.map((line) => (
            <div key={`${line.charge.id}_${line.installment}`} className="px-4 py-3 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-on-surface truncate">{line.charge.name}</p>
                <p className="text-[11px] text-outline flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      line.charge.source === 'registrado'
                        ? 'bg-secondary-container/40 text-on-secondary-container'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px] mr-0.5">
                      {line.charge.source === 'registrado' ? 'receipt_long' : 'schedule'}
                    </span>
                    {line.charge.source === 'registrado' ? 'Registrado' : 'Pendiente'}
                  </span>
                  <span>{formatDay(line.charge.date)}</span>
                  <span>
                    · Cuota {line.installment}/{line.charge.installments}
                  </span>
                  {line.charge.interestRate > 0 && <span>· {line.charge.interestRate}% M.V.</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-numeric-data font-bold text-on-surface">
                  {formatCurrency(Math.round(line.capital + line.interest))}
                </p>
                {line.interest > 0 && (
                  <p className="text-[10px] text-outline">Interés {formatCurrency(line.interest)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <main className="max-w-2xl mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg pb-32">
      <div className="flex justify-between items-center mb-stack-lg gap-3">
        <div>
          <h2 className="font-label-caps text-label-caps text-on-surface-variant font-bold tracking-wider">
            TARJETA DE CRÉDITO
          </h2>
          <p className="font-body-md text-body-md text-outline">
            Corte los {CREDIT_CARD_CUTOFF_DAY} · Pago los {CREDIT_CARD_PAYMENT_DAY} del mes siguiente
          </p>
        </div>
      </div>

      {/* Deuda actual */}
      <section className="mb-stack-lg bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-xs flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-outline">Deuda actual</p>
          <p className="font-numeric-data text-lg font-bold text-error">{formatCurrency(creditCardBalance)}</p>
          <p className="text-[11px] text-outline">
            {creditLimit > 0 ? `Disponible: ${formatCurrency(availableCredit)}` : 'Sin cupo configurado'}
          </p>
        </div>
        <button
          onClick={() => setIsPayCreditModalOpen(true)}
          className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>Pagar</span>
        </button>
      </section>

      {statements.map((statement, i) => renderStatement(statement, i === 0 ? 'Extracto actual' : 'Próximo extracto'))}

      <p className="text-[11px] text-outline">
        Las cuotas se calculan con abono constante a capital más el interés mensual sobre el saldo de cada compra.
        Los abonos que hagas a la tarjeta no se descuentan de esta proyección.
      </p>
    </main>
  );
};
