import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { getFirstInstallment, getInstallmentCost } from '../utils/creditCard';

// A partir de este % de interés sobre el valor de la compra el costo se resalta
export const HIGH_INTEREST_PCT = 5;

interface InstallmentFieldsProps {
  amount: number;
  installments: string;
  interestRate: string;
  onInstallmentsChange: (value: string) => void;
  onInterestRateChange: (value: string) => void;
}

// Cuotas e interés mensual de una compra con tarjeta, con la primera cuota (pago mínimo) estimada
export const InstallmentFields: React.FC<InstallmentFieldsProps> = ({
  amount,
  installments,
  interestRate,
  onInstallmentsChange,
  onInterestRateChange,
}) => {
  const n = Math.max(1, parseInt(installments, 10) || 1);
  const rate = parseFloat(interestRate.replace(',', '.')) || 0;
  const firstInstallment = getFirstInstallment(amount, n, rate);
  const cost = getInstallmentCost(amount, n, rate);

  return (
    <div className="mt-3 pt-3 border-t border-outline-variant/40 space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Cuotas</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={48}
            value={installments}
            onChange={(e) => onInstallmentsChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-xl font-numeric-data text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Interés mensual %
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={interestRate}
            onChange={(e) => onInterestRateChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-xl font-numeric-data text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>
      {amount > 0 && (
        <p className="text-[11px] text-outline">
          Primera cuota (pago mínimo):{' '}
          <span className="font-numeric-data font-bold text-on-surface">{formatCurrency(firstInstallment)}</span>
          {n > 1 && ` · ${n} cuotas de ${formatCurrency(amount / n)} a capital + intereses`}
        </p>
      )}
      {amount > 0 && cost.totalInterest > 0 && (
        <p
          className={`text-xs font-medium ${
            cost.interestPct >= HIGH_INTEREST_PCT ? 'text-warning' : 'text-on-surface-variant'
          }`}
        >
          Total a pagar {formatCurrency(Math.round(cost.total))} (+{formatCurrency(Math.round(cost.totalInterest))} de
          interés, +{cost.interestPct.toFixed(1)}%)
        </p>
      )}
    </div>
  );
};

// Convierte los valores del formulario en números válidos
export const parseInstallmentInputs = (installments: string, interestRate: string) => ({
  installments: Math.max(1, parseInt(installments, 10) || 1),
  interestRate: Math.max(0, parseFloat(interestRate.replace(',', '.')) || 0),
});
