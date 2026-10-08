import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { getFirstInstallment } from '../utils/creditCard';

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
    </div>
  );
};

// Convierte los valores del formulario en números válidos
export const parseInstallmentInputs = (installments: string, interestRate: string) => ({
  installments: Math.max(1, parseInt(installments, 10) || 1),
  interestRate: Math.max(0, parseFloat(interestRate.replace(',', '.')) || 0),
});
