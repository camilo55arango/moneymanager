import React, { useState } from 'react';
import { useApp, isSystemTransaction, CREDIT_CARD_METHOD } from '../context/AppContext';
import { TransactionType } from '../types';
import { formatInputNumber, parseFormattedNumber } from '../utils/formatCurrency';
import { InstallmentFields, parseInstallmentInputs } from '../components/InstallmentFields';

const ACCOUNT_OPTIONS = ['Billetera', 'Tarjeta de Crédito', 'Inversiones'];

export const NewTransactionView: React.FC = () => {
  const {
    categories,
    addTransaction,
    updateTransaction,
    editingTransaction,
    setEditingTransaction,
    setCurrentView,
  } = useApp();

  const isEditing = !!editingTransaction;
  // Transferencias y pagos de tarjeta: solo se editan monto, fecha y nota
  const isSystemTx = !!editingTransaction && isSystemTransaction(editingTransaction);

  const [type, setType] = useState<TransactionType>(editingTransaction?.type || 'expense');
  const [amount, setAmount] = useState<string>(
    editingTransaction ? formatInputNumber(editingTransaction.amount) : ''
  );
  const [name, setName] = useState<string>(editingTransaction?.name || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    editingTransaction?.category || categories[0] || 'Comida'
  );
  const [date, setDate] = useState<string>(
    editingTransaction?.date || new Date().toISOString().split('T')[0]
  );
  const [account, setAccount] = useState<string>(editingTransaction?.paymentMethod || 'Billetera');
  const [note, setNote] = useState<string>(editingTransaction?.note || '');
  const [installments, setInstallments] = useState<string>(String(editingTransaction?.installments ?? 1));
  const [interestRate, setInterestRate] = useState<string>(String(editingTransaction?.interestRate ?? 0));
  const isCardPurchase = !isSystemTx && type === 'expense' && account === CREDIT_CARD_METHOD;
  const [error, setError] = useState<string | null>(null);

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'arriendo':
      case 'hogar':
      case 'vivienda':
        return 'home';
      case 'servicios':
        return 'electric_bolt';
      case 'suscripciones':
        return 'subscriptions';
      case 'transporte':
      case 'auto':
        return 'directions_bus';
      case 'compras':
        return 'shopping_bag';
      case 'comida':
      case 'alimentación':
        return 'restaurant';
      case 'mercado':
        return 'local_grocery_store';
      case 'educación':
        return 'school';
      case 'banco':
        return 'account_balance';
      case 'salario':
      case 'ingresos':
        return 'payments';
      case 'i. extra':
      case 'ingreso extra':
        return 'monetization_on';
      case 'deuda':
        return 'credit_score';
      case 'inversiones':
        return 'monitoring';
      default:
        return 'grid_view';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFormattedNumber(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (!name.trim()) {
      setError('Por favor asigna un nombre al registro');
      return;
    }

    const txData = {
      type,
      amount: numericAmount,
      name: name.trim(),
      category: selectedCategory,
      date,
      paymentMethod: account,
      note: note.trim(),
      status: (type === 'income' ? 'received' : 'paid') as 'received' | 'paid',
      ...(isCardPurchase
        ? parseInstallmentInputs(installments, interestRate)
        : { installments: undefined, interestRate: undefined }),
    };

    // Both paths update the balances and save to Supabase
    if (isEditing && editingTransaction) {
      await updateTransaction({ ...editingTransaction, ...txData });
      setEditingTransaction(null);
    } else {
      await addTransaction(txData);
    }

    setCurrentView('dashboard');
  };

  return (
    <main className="max-w-[1280px] mx-auto pb-32">
      <form onSubmit={handleSubmit}>
        {/* Hero Amount Section */}
        <section className="bg-primary-container text-white py-12 px-container-padding-mobile text-center custom-shadow-l1 mb-stack-lg">
          <label className="font-label-caps text-label-caps opacity-70 mb-2 block uppercase tracking-widest font-semibold">
            MONTO DEL {type === 'expense' ? 'GASTO' : 'INGRESO'}
          </label>
          <div className="flex items-center justify-center gap-2">
            <span className="font-display-currency text-display-currency text-on-primary-container">$</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(formatInputNumber(e.target.value))}
              className="bg-transparent border-none focus:ring-0 font-display-currency text-display-currency text-white w-full max-w-[280px] text-center p-0 placeholder:text-on-primary-fixed-variant outline-none"
            />
          </div>
        </section>

        {/* Form Container */}
        <div className="px-container-padding-mobile md:px-container-padding-desktop space-y-stack-lg">
          {isSystemTx && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0">info</span>
              <div>
                <p className="font-semibold">{editingTransaction?.name}</p>
                <p className="opacity-90 mt-0.5">
                  Es un movimiento entre saldos, por eso solo puedes cambiar el monto, la fecha y la nota.
                  Los saldos se ajustan automáticamente.
                </p>
              </div>
            </div>
          )}

          {!isSystemTx && (
          <>
          {/* Segmented Control (Pill Style) */}
          <div className="flex justify-center mb-stack-lg">
            <div className="inline-flex p-1 bg-surface-container rounded-full border border-outline-variant">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`px-8 py-2 rounded-full text-body-md font-semibold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`px-8 py-2 rounded-full text-body-md font-semibold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Gasto
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
              NOMBRE
            </label>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">label</span>
              <input
                type="text"
                placeholder={type === 'expense' ? '¿Cómo llamas a este gasto?' : '¿De dónde proviene este ingreso?'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-none focus:ring-0 font-body-lg text-body-lg p-0 text-on-surface placeholder:text-outline outline-none"
              />
            </div>
          </div>

          {/* Category Selection Grid */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm block uppercase tracking-wider font-semibold">
              CATEGORÍA
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 py-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat === 'Inversiones') {
                        setAccount('Inversiones');
                      }
                    }}
                    className={`category-chip flex flex-col items-center justify-center p-3 rounded-xl border border-outline-variant transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-primary-container text-white active border-primary-container'
                        : 'bg-surface-container-lowest hover:border-primary text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px] mb-1 group-hover:scale-110 transition-transform">
                      {getCategoryIcon(cat)}
                    </span>
                    <span className="text-xs font-semibold truncate w-full text-center">{cat}</span>
                  </button>
                );
              })}
            </div>
            {selectedCategory === 'Inversiones' && (
              <p className="text-xs text-secondary font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Este valor impactará EXCLUSIVAMENTE el Saldo de Inversiones.
              </p>
            )}
          </div>
          </>
          )}

          {/* Bento Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
            {/* Date Picker Field */}
            <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
              <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
                FECHA
              </label>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-none focus:ring-0 font-numeric-data text-numeric-data p-0 text-on-surface outline-none"
                />
              </div>
            </div>

            {/* Account Field */}
            {!isSystemTx && (
            <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
              <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
                CUENTA
              </label>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full border-none focus:ring-0 font-body-lg text-body-lg p-0 bg-transparent text-on-surface cursor-pointer outline-none"
                >
                  {ACCOUNT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {/* Registros antiguos pueden tener otra cuenta guardada */}
                  {!ACCOUNT_OPTIONS.includes(account) && <option value={account}>{account}</option>}
                </select>
              </div>
              {account === 'Tarjeta de Crédito' && type === 'expense' && (
                <p className="text-xs text-secondary font-semibold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Se sumará a la deuda de tu tarjeta. No descuenta la Billetera hasta que la pagues.
                </p>
              )}
              {isCardPurchase && (
                <InstallmentFields
                  amount={parseFormattedNumber(amount)}
                  installments={installments}
                  interestRate={interestRate}
                  onInstallmentsChange={setInstallments}
                  onInterestRateChange={setInterestRate}
                />
              )}
            </div>
            )}

            {/* Description / Note Field */}
            <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1 md:col-span-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
                NOTA / DESCRIPCIÓN
              </label>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-1">edit_note</span>
                <textarea
                  rows={3}
                  placeholder={type === 'expense' ? '¿En qué gastaste este dinero?' : 'Detalles adicionales...'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border-none focus:ring-0 font-body-lg text-body-lg p-0 resize-none text-on-surface placeholder:text-outline outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-error-container text-on-error-container text-xs rounded-lg font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="fixed bottom-0 left-0 w-full p-container-padding-mobile bg-gradient-to-t from-background via-background to-transparent md:bg-white md:border-t md:border-outline-variant z-50">
          <div className="max-w-[1280px] mx-auto flex justify-center">
            <button
              type="submit"
              className="w-full md:max-w-md bg-primary text-on-primary py-4 rounded-full font-headline-md text-headline-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>{isEditing ? 'Guardar Cambios' : `Guardar ${type === 'expense' ? 'Gasto' : 'Ingreso'}`}</span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
};
