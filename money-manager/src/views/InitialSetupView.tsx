import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatInputNumber, parseFormattedNumber } from '../utils/formatCurrency';

export const InitialSetupView: React.FC = () => {
  const {
    walletBalance,
    investmentBalance,
    categories,
    updateBalances,
    addCategory,
    removeCategory,
    setCurrentView,
  } = useApp();

  const [walletInput, setWalletInput] = useState<string>(formatInputNumber(walletBalance));
  const [investmentInput, setInvestmentInput] = useState<string>(formatInputNumber(investmentBalance));
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleKeyDownCategory = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const w = parseFormattedNumber(walletInput);
    const inv = parseFormattedNumber(investmentInput);

    await updateBalances(w, inv);

    setIsSaving(false);
    setCurrentView('dashboard');
  };

  return (
    <main className="flex-grow flex flex-col items-center px-container-padding-mobile md:px-container-padding-desktop py-stack-lg max-w-2xl mx-auto w-full pb-32">
      {/* Welcome Header */}
      <div className="w-full mb-stack-lg text-center md:text-left">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-unit font-bold">
          Configuración Inicial
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Establece tus balances de apertura para comenzar a gestionar tu patrimonio con precisión institucional.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-stack-lg">
        {/* Section 1: Balances */}
        <section className="bg-surface-container-lowest p-stack-md rounded-xl shadow-[0_4px_15px_0_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-2 font-bold">
            Balances de Apertura
          </h3>

          {/* Wallet Field */}
          <div className="flex flex-col gap-unit">
            <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
              SALDO INICIAL BILLETERA
            </label>
            <div className="relative flex items-center bg-surface-container-low rounded-lg border border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
              <span className="pl-4 font-numeric-data text-numeric-data text-on-surface-variant">$</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={walletInput}
                onChange={(e) => setWalletInput(formatInputNumber(e.target.value))}
                className="w-full bg-transparent border-none focus:ring-0 font-numeric-data text-numeric-data text-primary px-2 py-3 outline-none"
              />
            </div>
          </div>

          {/* Investment Field */}
          <div className="flex flex-col gap-unit">
            <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
              SALDO INICIAL INVERSIONES
            </label>
            <div className="relative flex items-center bg-surface-container-low rounded-lg border border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
              <span className="pl-4 font-numeric-data text-numeric-data text-on-surface-variant">$</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={investmentInput}
                onChange={(e) => setInvestmentInput(formatInputNumber(e.target.value))}
                className="w-full bg-transparent border-none focus:ring-0 font-numeric-data text-numeric-data text-primary px-2 py-3 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Categories */}
        <section className="bg-surface-container-lowest p-stack-md rounded-xl shadow-[0_4px_15px_0_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-stack-md">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
              Categorías
            </h3>
            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
              RECOMENDADO
            </span>
          </div>

          <div className="flex flex-col gap-stack-sm">
            <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
              NOMBRE DE NUEVA CATEGORÍA
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow bg-surface-container-low rounded-lg border border-outline-variant/50 focus-within:border-primary transition-all">
                <input
                  type="text"
                  placeholder="Ej. Alimentación, Ocio, Suscripciones..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleKeyDownCategory}
                  className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-primary px-4 py-3 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-primary text-on-primary h-12 px-4 rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>CREAR</span>
              </button>
            </div>
          </div>

          {/* Category Chips List */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <div
                key={cat}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors cursor-default ${
                  cat === 'Inversiones'
                    ? 'bg-primary-container text-white border-primary-container'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-surface-variant'
                }`}
              >
                <span className="font-body-md text-body-md">{cat}</span>
                {cat !== 'Inversiones' && (
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    title={`Eliminar categoría ${cat}`}
                    className="material-symbols-outlined text-[16px] opacity-40 hover:opacity-100 cursor-pointer hover:text-error transition-opacity"
                  >
                    close
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Context Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          <div className="bg-primary-container p-stack-md rounded-xl text-on-primary-fixed flex flex-col gap-unit shadow-sm border border-primary/20">
            <div className="flex items-center gap-2 text-secondary-fixed-dim">
              <span className="material-symbols-outlined">shield_with_heart</span>
              <h4 className="font-label-caps text-label-caps text-white font-bold">Seguridad Bancaria</h4>
            </div>
            <p className="font-body-md text-body-md text-on-primary-fixed-variant opacity-80 text-xs">
              Tus datos están encriptados localmente. Solo tú tienes acceso a tu información financiera.
            </p>
          </div>

          <div className="bg-secondary/5 p-stack-md rounded-xl border border-secondary/10 flex flex-col justify-center items-center text-center gap-unit">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-on-secondary-fixed">trending_up</span>
            </div>
            <p className="font-label-caps text-label-caps text-secondary font-bold">EFICIENCIA DE FLUJO</p>
            <p className="font-body-md text-body-md text-on-surface-variant text-xs">
              98% de los usuarios reportan mayor control en su primera semana.
            </p>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="mt-stack-lg w-full">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-headline-md text-headline-md flex items-center justify-center gap-3 shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer font-bold"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>Guardando...</span>
              </span>
            ) : (
              <>
                <span>Guardar y Continuar</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
          <p className="text-center mt-stack-md font-label-caps text-label-caps text-on-surface-variant/60">
            PASO 1 DE 3 • CONFIGURACIÓN DE CUENTA
          </p>
        </div>
      </form>
    </main>
  );
};
