import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import { formatInputNumber, parseFormattedNumber } from '../utils/formatCurrency';

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
        return 'more_horiz';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor asigna un nombre al pendiente');
      return;
    }

    const parsedAmount = parseFormattedNumber(amount);

    if (isEditing && editingPendingItem) {
      updatePendingItem({
        ...editingPendingItem,
        type,
        amount: parsedAmount,
        name: name.trim(),
        dueDate: dueDate.trim() ? dueDate : null,
        category,
        recurrence,
        note: note.trim(),
      });
      setEditingPendingItem(null);
    } else {
      addPendingItem({
        type,
        amount: parsedAmount,
        name: name.trim(),
        dueDate: dueDate.trim() ? dueDate : null,
        category,
        recurrence,
        note: note.trim(),
      });
    }

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
          {isEditing &&
            ((editingPendingItem?.recurrence && editingPendingItem.recurrence !== 'none') ||
              editingPendingItem?.seriesId) && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">repeat</span>
                <div>
                  <p className="font-semibold">Pendiente recurrente</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Los cambios realizados afectarán a este registro y a los periodos futuros.
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
                    ? 'bg-primary text-white shadow-md'
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
                    ? 'bg-primary text-white shadow-md'
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
              className="w-full md:max-w-md bg-primary text-white py-4 rounded-full font-headline-md text-headline-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined">save</span>
              <span>{isEditing ? 'Actualizar Pendiente' : 'Guardar Pendiente'}</span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
};
