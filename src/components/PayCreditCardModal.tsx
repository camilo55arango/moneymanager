import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/formatCurrency';

export const PayCreditCardModal: React.FC = () => {
  const {
    isPayCreditModalOpen,
    setIsPayCreditModalOpen,
    walletBalance,
    creditCardBalance,
    payCreditCard,
  } = useApp();

  const [amount, setAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isPayCreditModalOpen) return null;

  const handleClose = () => {
    setAmount('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsPayCreditModalOpen(false);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numericAmount = parseFormattedNumber(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Por favor ingrese un monto mayor a 0');
      return;
    }
    if (numericAmount > walletBalance) {
      setErrorMsg(`Saldo insuficiente en Billetera. Disponible: ${formatCurrency(walletBalance)}`);
      return;
    }
    if (numericAmount > creditCardBalance) {
      setErrorMsg(`El monto supera la deuda actual: ${formatCurrency(creditCardBalance)}`);
      return;
    }

    const success = await payCreditCard(numericAmount);
    if (success) {
      setSuccessMsg('¡Pago registrado con éxito!');
      setTimeout(() => {
        handleClose();
      }, 900);
    } else {
      setErrorMsg('Error al procesar el pago');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">
              Pagar Tarjeta de Crédito
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleConfirm} className="space-y-6">
            <div className="text-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-wider">
                MONTO A PAGAR
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold text-primary">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(formatInputNumber(e.target.value))}
                  className="w-full max-w-[200px] text-3xl font-bold text-primary bg-transparent border-none focus:ring-0 text-center p-0 outline-none"
                />
              </div>
              <p className="text-xs text-outline mt-2">
                Disponible en Billetera: <span className="font-semibold text-primary">{formatCurrency(walletBalance)}</span>
              </p>
              <p className="text-xs text-outline mt-1">
                Deuda actual: <span className="font-semibold text-error">{formatCurrency(creditCardBalance)}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAmount(formatInputNumber(creditCardBalance))}
              className="w-full py-2 px-3 bg-surface-container-high border border-outline-variant/50 hover:bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Pagar deuda completa</span>
              <span className="font-numeric-data text-primary font-bold">
                {formatCurrency(creditCardBalance)}
              </span>
            </button>

            {errorMsg && (
              <div className="p-3 bg-error-container text-on-error-container text-xs rounded-lg font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-secondary-container text-on-secondary-container text-xs rounded-lg font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-md font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>Confirmar Pago</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
