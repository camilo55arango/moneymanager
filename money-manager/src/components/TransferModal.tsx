import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatInputNumber, parseFormattedNumber } from '../utils/formatCurrency';

export const TransferModal: React.FC = () => {
  const {
    isTransferModalOpen,
    setIsTransferModalOpen,
    walletBalance,
    investmentBalance,
    transferFunds,
  } = useApp();

  const [amount, setAmount] = useState<string>('');
  const [direction, setDirection] = useState<'walletToInv' | 'invToWallet'>('walletToInv');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isTransferModalOpen) return null;

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'walletToInv' ? 'invToWallet' : 'walletToInv'));
    setErrorMsg(null);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numericAmount = parseFormattedNumber(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Por favor ingrese un monto mayor a 0');
      return;
    }

    const available = direction === 'walletToInv' ? walletBalance : investmentBalance;
    const fromLabel = direction === 'walletToInv' ? 'Billetera' : 'Inversiones';

    if (numericAmount > available) {
      setErrorMsg(`Saldo insuficiente en ${fromLabel}. Disponible: ${formatCurrency(available)}`);
      return;
    }

    const success = transferFunds(numericAmount, direction);
    if (success) {
      setSuccessMsg('¡Transferencia completada con éxito!');
      setTimeout(() => {
        setAmount('');
        setSuccessMsg(null);
        setIsTransferModalOpen(false);
      }, 900);
    } else {
      setErrorMsg('Error al procesar la transferencia');
    }
  };

  const fromAccount = direction === 'walletToInv' ? 'Billetera' : 'Inversiones';
  const toAccount = direction === 'walletToInv' ? 'Inversiones' : 'Billetera';
  const availableBalance = direction === 'walletToInv' ? walletBalance : investmentBalance;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsTransferModalOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">
              Transferir Fondos
            </h3>
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleConfirm} className="space-y-6">
            {/* Amount Input */}
            <div className="text-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-wider">
                MONTO A TRANSFERIR
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
                Disponible en {fromAccount}: <span className="font-semibold text-primary">{formatCurrency(availableBalance)}</span>
              </p>
            </div>

            {/* Direction Switcher Card */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
              <div className="flex items-center justify-between gap-2">
                {/* From Box */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      direction === 'walletToInv'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-primary border border-outline-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {direction === 'walletToInv' ? 'account_balance_wallet' : 'monitoring'}
                    </span>
                  </div>
                  <span className="font-label-caps text-label-caps text-primary font-semibold">
                    {fromAccount}
                  </span>
                  <span className="text-[10px] text-outline">Origen</span>
                </div>

                {/* Swap Button */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleToggleDirection}
                    title="Cambiar dirección de transferencia"
                    className="w-10 h-10 rounded-full border border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined">swap_horiz</span>
                  </button>
                </div>

                {/* To Box */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      direction === 'invToWallet'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-primary border border-outline-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {direction === 'invToWallet' ? 'account_balance_wallet' : 'monitoring'}
                    </span>
                  </div>
                  <span className="font-label-caps text-label-caps text-primary font-semibold">
                    {toAccount}
                  </span>
                  <span className="text-[10px] text-outline">Destino</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-md font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>Confirmar Transferencia</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
