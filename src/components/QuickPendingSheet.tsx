import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Zap } from 'lucide-react';
import { useApp, CREDIT_CARD_METHOD } from '../context/AppContext';
import { PendingItem, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryMeta } from '../utils/categories';
import { addDays, formatShortDate, todayString } from '../utils/dates';
import { BottomSheet } from './ui/BottomSheet';
import { applyKey, formatTyped, NumericKeypad, typedAmount } from './ui/NumericKeypad';
import { CompactInstallmentFields, parseInstallmentInputs } from './InstallmentFields';

const VISIBLE_CATEGORIES = 7;
// Categorías que se ofrecen primero para ingresos y al final para gastos
const INCOME_CATEGORIES = ['Salario', 'I. Extra', 'Inversiones'];

const ACCOUNTS = [
  { value: 'Billetera', label: 'Billetera' },
  { value: CREDIT_CARD_METHOD, label: 'Tarjeta' },
];

const RECURRENCES = [
  { value: 'none', label: 'Una vez' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
];

interface QuickPendingSheetProps {
  open: boolean;
  onClose: () => void;
}

// Pendiente en pocos toques, con la misma forma que el registro rápido de movimientos.
// El monto puede quedar en 0 (por definir); el resto de opciones está en "Más opciones".
export const QuickPendingSheet: React.FC<QuickPendingSheetProps> = ({ open, onClose }) => {
  const { categories, pendingItems, addPendingItem, setEditingPendingItem, setCurrentView } = useApp();
  const today = todayString();
  const tomorrow = addDays(today, 1);

  const [type, setType] = useState<TransactionType>('expense');
  const [digits, setDigits] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('Billetera');
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(today);
  const [recurrence, setRecurrence] = useState('none');
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [installments, setInstallments] = useState(1);
  // null = se usa el interés del último pendiente a cuotas
  const [interestInput, setInterestInput] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [saving, setSaving] = useState(false);

  const amount = typedAmount(digits);

  const reset = () => {
    setType('expense');
    setDigits('');
    setCategory('');
    setAccount('Billetera');
    setName('');
    setDueDate(todayString());
    setRecurrence('none');
    setIsAutomatic(false);
    setInstallments(1);
    setInterestInput(null);
    setShowAllCategories(false);
  };

  // Categorías ordenadas por cuántos pendientes de este tipo las usan
  const rankedCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of pendingItems) {
      if (item.type === type) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    const typeRank = (cat: string) => (INCOME_CATEGORIES.includes(cat) === (type === 'income') ? 0 : 1);
    return [...categories].sort(
      (a, b) =>
        (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
        typeRank(a) - typeRank(b) ||
        categories.indexOf(a) - categories.indexOf(b)
    );
  }, [categories, pendingItems, type]);

  const selectedCategory = category || rankedCategories[0] || 'Otros';
  const visibleCategories = showAllCategories
    ? rankedCategories
    : rankedCategories.slice(0, VISIBLE_CATEGORIES).concat(
        // La categoría elegida desde "Más" sigue visible al contraer
        rankedCategories.slice(VISIBLE_CATEGORIES).includes(selectedCategory) ? [selectedCategory] : []
      );
  const canUseCreditCard = type === 'expense' && selectedCategory !== 'Inversiones';
  const usesCreditCard = canUseCreditCard && account === CREDIT_CARD_METHOD;

  // Interés del último pendiente a cuotas, como valor por defecto
  const lastInterestRate = useMemo(
    () =>
      pendingItems.find((p) => p.paymentMethod === CREDIT_CARD_METHOD && (p.installments ?? 1) > 1)?.interestRate ??
      0,
    [pendingItems]
  );
  const interestRate = interestInput ?? String(lastInterestRate);

  // Pendientes con un nombre parecido, para copiar su categoría, cuenta y repetición
  const suggestions = useMemo(() => {
    const query = name.trim().toLowerCase();
    if (!query) return [];
    const seen = new Set<string>();
    const result: PendingItem[] = [];
    for (const item of pendingItems) {
      const key = item.name.toLowerCase();
      if (item.type !== type || seen.has(key) || !key.includes(query) || key === query) continue;
      seen.add(key);
      result.push(item);
      if (result.length === 3) break;
    }
    return result;
  }, [name, pendingItems, type]);

  const pressKey = (key: string) => setDigits((d) => applyKey(d, key));

  const selectType = (next: TransactionType) => {
    setType(next);
    setCategory('');
  };

  const applySuggestion = (item: PendingItem) => {
    setName(item.name);
    setCategory(item.category);
    if (item.paymentMethod) setAccount(item.paymentMethod === CREDIT_CARD_METHOD ? CREDIT_CARD_METHOD : 'Billetera');
    setRecurrence(item.recurrence || 'none');
    setIsAutomatic(!!item.isAutomatic);
    if (item.installments) setInstallments(item.installments);
    if (item.interestRate !== undefined) setInterestInput(String(item.interestRate));
  };

  const openFullForm = () => {
    onClose();
    setEditingPendingItem(null);
    setCurrentView('new-pending');
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await addPendingItem({
      type,
      amount,
      name: name.trim() || selectedCategory,
      category: selectedCategory,
      dueDate,
      // Sin fecha no hay desde dónde repetir
      recurrence: dueDate ? recurrence : 'none',
      note: '',
      isAutomatic,
      paymentMethod: type === 'expense' ? (canUseCreditCard ? account : 'Billetera') : undefined,
      ...(usesCreditCard && parseInstallmentInputs(String(installments), installments > 1 ? interestRate : '0')),
    });
    navigator.vibrate?.(10);
    setSaving(false);
    reset();
    onClose();
  };

  // Teclado físico: números, borrar, Enter para guardar y Escape para cerrar
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (/^\d$/.test(e.key)) pressKey(e.key);
      else if (e.key === 'Backspace') pressKey('back');
      else if (e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
      active ? 'bg-accent text-on-accent' : 'bg-surface-2 text-fg-muted hover:text-fg'
    }`;

  const isOtherDate = dueDate !== null && dueDate !== today && dueDate !== tomorrow;

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Nuevo pendiente">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-full bg-surface-2 p-0.5">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => selectType(t)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors cursor-pointer ${
                type === t ? 'bg-surface-3 font-medium text-fg shadow-sm' : 'text-fg-muted'
              }`}
            >
              {t === 'expense' ? 'Por pagar' : 'Por recibir'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openFullForm}
          className="text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline cursor-pointer"
        >
          Más opciones
        </button>
      </div>

      <div className="text-center" aria-live="polite">
        <p
          className={`font-mono text-[44px] font-semibold leading-[52px] tracking-tight ${
            amount === 0 ? 'text-fg-subtle' : type === 'income' ? 'text-positive' : 'text-fg'
          }`}
        >
          {formatTyped(digits)}
        </p>
        {amount === 0 && <p className="text-xs text-fg-subtle">Déjalo en 0 si aún no sabes el monto</p>}
      </div>

      {/* Categorías: las más usadas en pendientes primero */}
      <div className="flex flex-wrap gap-1.5">
        {visibleCategories.map((cat) => {
          const { Icon, color } = getCategoryMeta(cat);
          const active = cat === selectedCategory;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                active ? 'border-accent bg-accent text-on-accent' : 'border-line text-fg hover:bg-surface-2'
              }`}
            >
              <Icon size={14} strokeWidth={1.75} style={active ? undefined : { color }} />
              {cat}
            </button>
          );
        })}
        {rankedCategories.length > VISIBLE_CATEGORIES && (
          <button
            type="button"
            onClick={() => setShowAllCategories((v) => !v)}
            className="rounded-full border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-fg-muted hover:text-fg cursor-pointer"
          >
            {showAllCategories ? 'Menos' : `Más (${rankedCategories.length - VISIBLE_CATEGORIES})`}
          </button>
        )}
      </div>

      {canUseCreditCard && (
        <div className="flex items-center gap-1.5">
          {ACCOUNTS.map((a) => (
            <button key={a.value} type="button" onClick={() => setAccount(a.value)} className={chipClass(account === a.value)}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {usesCreditCard && (
        <CompactInstallmentFields
          amount={amount}
          date={dueDate ?? undefined}
          installments={installments}
          interestRate={interestRate}
          onInstallmentsChange={setInstallments}
          onInterestRateChange={setInterestInput}
        />
      )}

      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Nombre (opcional: "${selectedCategory}")`}
          className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-line-strong"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applySuggestion(item)}
                className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent cursor-pointer"
              >
                {item.name} · {item.category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vencimiento */}
      <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4">
        <span className="shrink-0 text-xs text-fg-subtle">Vence</span>
        <button type="button" onClick={() => setDueDate(today)} className={chipClass(dueDate === today)}>
          Hoy
        </button>
        <button type="button" onClick={() => setDueDate(tomorrow)} className={chipClass(dueDate === tomorrow)}>
          Mañana
        </button>
        <label
          className={`relative flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium cursor-pointer ${
            isOtherDate ? 'bg-accent text-on-accent' : 'bg-surface-2 text-fg-muted'
          }`}
          title="Otra fecha"
        >
          <CalendarDays size={15} strokeWidth={1.75} />
          {isOtherDate && formatShortDate(dueDate!)}
          <input
            type="date"
            value={dueDate ?? ''}
            onChange={(e) => e.target.value && setDueDate(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Otra fecha"
          />
        </label>
        <button type="button" onClick={() => setDueDate(null)} className={chipClass(dueDate === null)}>
          Sin fecha
        </button>
      </div>

      {/* Repetición */}
      {dueDate && (
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4">
          <span className="shrink-0 text-xs text-fg-subtle">Repite</span>
          {RECURRENCES.map((r) => (
            <button key={r.value} type="button" onClick={() => setRecurrence(r.value)} className={chipClass(recurrence === r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isAutomatic}
        onClick={() => setIsAutomatic((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm text-fg">
          <Zap size={15} strokeWidth={1.75} className={isAutomatic ? 'text-accent' : 'text-fg-muted'} />
          Débito automático
          <span className="text-xs text-fg-subtle">· se paga solo</span>
        </span>
        <span
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isAutomatic ? 'bg-accent' : 'bg-line-strong'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              isAutomatic ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </button>

      <NumericKeypad onKey={pressKey} />

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-on-accent transition-opacity disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
      >
        <Check size={18} strokeWidth={2} />
        {amount > 0 ? `Guardar pendiente de ${formatCurrency(amount)}` : 'Guardar pendiente por definir'}
      </button>
    </BottomSheet>
  );
};
