import React, { useState } from 'react';
import { useApp, CREDIT_CARD_METHOD } from '../context/AppContext';
import { PendingEditScope, PendingItem, TransactionType } from '../types';
import { formatInputNumber, parseFormattedNumber } from '../utils/formatCurrency';
import { CREDIT_CARD_CUTOFF_DAY, CREDIT_CARD_PAYMENT_DAY } from '../utils/creditCard';
import { InstallmentFields, parseInstallmentInputs } from '../components/InstallmentFields';

export const NewPendingView: React.FC = () => {
  const {
    categories,
    addPendingItem,
    updatePendingItem,
    editingPendingItem,
    setEditingPendingItem,
    setCurrentView,
  } = useApp();

  const isEditing = !!editingPendingItem;

  const [type, setType] = useState<TransactionType>(editingPendingItem?.type || 'expense');
  const [amount, setAmount] = useState<string>(
    editingPendingItem ? formatInputNumber(editingPendingItem.amount) : ''
  );
  const [name, setName] = useState<string>(editingPendingItem?.name || '');
  const [dueDate, setDueDate] = useState<string>(editingPendingItem?.dueDate || '');
  const [category, setCategory] = useState<string>(
    editingPendingItem?.category || categories[0] || 'Hogar'
  );
  const [recurrence, setRecurrence] = useState<string>(editingPendingItem?.recurrence || 'none');
  const [note, setNote] = useState<string>(editingPendingItem?.note || '');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    editingPendingItem?.paymentMethod === CREDIT_CARD_METHOD ? CREDIT_CARD_METHOD : 'Billetera'
  );
  const [installments, setInstallments] = useState<string>(String(editingPendingItem?.installments ?? 1));
  const [interestRate, setInterestRate] = useState<string>(String(editingPendingItem?.interestRate ?? 0));
  const [error, setError] = useState<string | null>(null);
  // Cambios listos para guardar mientras el usuario elige si aplican a una ocurrencia o a toda la serie
  const [pendingUpdate, setPendingUpdate] = useState<PendingItem | null>(null);

  const isEditingRecurring =
    isEditing &&
    ((editingPendingItem?.recurrence && editingPendingItem.recurrence !== 'none') ||
      !!editingPendingItem?.seriesId);
  // Solo los gastos que no son de Inversiones se pueden pagar con tarjeta
  const canUseCreditCard = type === 'expense' && category.trim() !== 'Inversiones';
  // Cambiar la repetición solo tiene sentido para toda la serie
  const recurrenceChanged = !!editingPendingItem && recurrence !== (editingPendingItem.recurrence || 'none');

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
        return 'more_horiz';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor asigna un nombre al pendiente');
      return;
    }

    const usesCreditCard = canUseCreditCard && paymentMethod === CREDIT_CARD_METHOD;
    const itemData = {
      type,
      amount: parseFormattedNumber(amount),
      name: name.trim(),
      dueDate: dueDate.trim() ? dueDate : null,
      category,
      recurrence,
      note: note.trim(),
      paymentMethod: type === 'expense' ? (canUseCreditCard ? paymentMethod : 'Billetera') : undefined,
      ...(usesCreditCard
        ? parseInstallmentInputs(installments, interestRate)
        : { installments: undefined, interestRate: undefined }),
    };

    if (isEditing && editingPendingItem) {
      const updated = { ...editingPendingItem, ...itemData };
      // En un recurrente se pregunta el alcance antes de guardar
      if (isEditingRecurring) {
        setPendingUpdate(updated);
        return;
      }
      await saveUpdate(updated, 'series');
      return;
    }

    await addPendingItem(itemData);
    setCurrentView('pendientes');
  };

  const saveUpdate = async (updated: PendingItem, scope: PendingEditScope) => {
    setPendingUpdate(null);
    await updatePendingItem(updated, scope);
    setEditingPendingItem(null);
    setCurrentView('pendientes');
  };

  return (
    <main className="max-w-[1280px] mx-auto pb-32">
      <form onSubmit={handleSubmit}>
        {/* Hero Amount Section */}
        <section className="bg-primary-container text-white py-12 px-container-padding-mobile text-center custom-shadow-l1 mb-stack-lg">
          <label className="font-label-caps text-label-caps opacity-70 mb-2 block uppercase tracking-widest font-semibold">
            {isEditing ? 'EDITAR MONTO' : 'MONTO'}
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
          <p className="text-xs opacity-60 mt-1">Dejar en 0.00 si está pendiente de presupuesto (TBD)</p>
        </section>

        {/* Form Container */}
        <div className="px-container-padding-mobile md:px-container-padding-desktop space-y-stack-lg">
          {isEditingRecurring && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">repeat</span>
                <div>
                  <p className="font-semibold">Pendiente recurrente</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Al guardar podrás elegir si los cambios aplican solo a este o a toda la serie.
                  </p>
                </div>
              </div>
            )}

          {/* Segmented Control */}
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
              NOMBRE DEL PENDIENTE
            </label>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit</span>
              <input
                type="text"
                placeholder="Ej. Pago de luz, Alquiler, Matrícula..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-none focus:ring-0 font-body-lg text-body-lg p-0 text-on-surface placeholder:text-outline outline-none"
              />
            </div>
          </div>

          {/* Due Date Field */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
              FECHA DE VENCIMIENTO
            </label>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border-none focus:ring-0 font-numeric-data text-numeric-data p-0 text-on-surface outline-none"
              />
            </div>
            <p className="text-[11px] text-outline mt-1">Déjalo sin fecha si aún no tiene día programado.</p>
          </div>

          {/* Category Selector */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm block uppercase tracking-wider font-semibold">
              CATEGORÍA
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 py-2">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
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
          </div>

          {/* Recurrence Selector */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
              REPETICIÓN
            </label>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">repeat</span>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full border-none focus:ring-0 font-body-lg text-body-lg p-0 text-on-surface bg-transparent cursor-pointer outline-none"
              >
                <option value="none">Ninguna</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="bimensual">Bimensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          {/* Payment Method Selector */}
          {canUseCreditCard && (
            <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
              <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
                SE PAGA CON
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Billetera', icon: 'account_balance_wallet', label: 'Billetera' },
                  { value: CREDIT_CARD_METHOD, icon: 'credit_card', label: 'Tarjeta de Crédito' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value)}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                      paymentMethod === option.value
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === CREDIT_CARD_METHOD && (
                <>
                  <p className="text-[11px] text-secondary font-semibold flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Entra al extracto con corte el {CREDIT_CARD_CUTOFF_DAY} y se paga el {CREDIT_CARD_PAYMENT_DAY} del mes siguiente.
                  </p>
                  <InstallmentFields
                    amount={parseFormattedNumber(amount)}
                    installments={installments}
                    interestRate={interestRate}
                    onInstallmentsChange={setInstallments}
                    onInterestRateChange={setInterestRate}
                  />
                </>
              )}
            </div>
          )}

          {/* Notes Field */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant custom-shadow-l1">
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider font-semibold">
              NOTA / DESCRIPCIÓN
            </label>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">description</span>
              <textarea
                rows={3}
                placeholder="Añade detalles adicionales..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border-none focus:ring-0 font-body-lg text-body-lg p-0 resize-none text-on-surface placeholder:text-outline outline-none"
              />
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
              <span className="material-symbols-outlined">save</span>
              <span>{isEditing ? 'Actualizar Pendiente' : 'Guardar Pendiente'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Edit Scope Modal for Recurring Items */}
      {pendingUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">repeat</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Editar pendiente recurrente</h3>
                <p className="text-xs text-outline font-medium">¿A qué registros aplican los cambios?</p>
              </div>
            </div>

            <button
              type="button"
              disabled={recurrenceChanged}
              onClick={() => saveUpdate(pendingUpdate, 'single')}
              className="w-full p-3 rounded-xl border border-outline-variant text-left flex items-start gap-3 transition-colors cursor-pointer hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-primary">event</span>
              <div>
                <p className="text-sm font-bold text-on-surface">Solo este</p>
                <p className="text-[11px] text-outline">
                  {recurrenceChanged
                    ? 'No disponible: cambiaste la repetición, que aplica a toda la serie.'
                    : 'Las demás ocurrencias de la serie no cambian.'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => saveUpdate(pendingUpdate, 'series')}
              className="w-full p-3 rounded-xl border border-outline-variant text-left flex items-start gap-3 transition-colors cursor-pointer hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-primary">event_repeat</span>
              <div>
                <p className="text-sm font-bold text-on-surface">Todos los que se repiten</p>
                <p className="text-[11px] text-outline">
                  Aplica a toda la serie. Si cambiaste la fecha o la repetición, se recalculan este y los siguientes.
                </p>
              </div>
            </button>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPendingUpdate(null)}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
