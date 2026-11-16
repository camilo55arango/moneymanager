import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { CalendarDays, Check, Delete, Minus, Plus } from 'lucide-react';
import { useApp, isSystemTransaction, CREDIT_CARD_METHOD } from '../context/AppContext';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryMeta } from '../utils/categories';
import { getInstallmentCost } from '../utils/creditCard';
import { addDays, todayString } from '../utils/dates';
import { HIGH_INTEREST_PCT } from './InstallmentFields';

const VISIBLE_CATEGORIES = 7;
const FREQUENCY_WINDOW_DAYS = 60;
const MAX_DIGITS = 12;
const MAX_INSTALLMENTS = 48;
// Categorías que se ofrecen primero para ingresos y al final para gastos
const INCOME_CATEGORIES = ['Salario', 'I. Extra', 'Inversiones'];

const ACCOUNTS: Record<TransactionType, { value: string; label: string }[]> = {
  expense: [
    { value: 'Billetera', label: 'Billetera' },
    { value: CREDIT_CARD_METHOD, label: 'Tarjeta' },
    { value: 'Inversiones', label: 'Inversiones' },
  ],
  income: [
    { value: 'Billetera', label: 'Billetera' },
    { value: 'Inversiones', label: 'Inversiones' },
  ],
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'];

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
}

// Registro de un gasto o ingreso en pocos toques: monto con teclado propio, categorías
// ordenadas por uso y nombre opcional (si se deja vacío se usa la categoría)
export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({ open, onClose }) => {
  const { categories, transactions, addTransaction, setEditingTransaction, setCurrentView } = useApp();
  const dragControls = useDragControls();
  const today = todayString();

  const [type, setType] = useState<TransactionType>('expense');
  const [digits, setDigits] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('Billetera');
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  const [installments, setInstallments] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [saving, setSaving] = useState(false);

  const amount = Number(digits) || 0;
  const isCardPurchase = type === 'expense' && account === CREDIT_CARD_METHOD;

  const reset = () => {
    setType('expense');
    setDigits('');
    setCategory('');
    setAccount('Billetera');
    setName('');
    setDate(todayString());
    setInstallments(1);
    setShowAllCategories(false);
  };

  // Movimientos propios (sin transferencias ni pagos de tarjeta), del más reciente al más antiguo
  const ownTransactions = useMemo(() => transactions.filter((tx) => !isSystemTransaction(tx)), [transactions]);

  const rankedCategories = useMemo(() => {
    const since = addDays(today, -FREQUENCY_WINDOW_DAYS);
    const counts = new Map<string, number>();
    for (const tx of ownTransactions) {
      if (tx.type === type && tx.date >= since) counts.set(tx.category, (counts.get(tx.category) ?? 0) + 1);
    }
    const typeRank = (cat: string) =>
      INCOME_CATEGORIES.includes(cat) === (type === 'income') ? 0 : 1;
    return [...categories].sort(
      (a, b) =>
        (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
        typeRank(a) - typeRank(b) ||
        categories.indexOf(a) - categories.indexOf(b)
    );
  }, [categories, ownTransactions, type, today]);

  const selectedCategory = category || rankedCategories[0] || 'Otros';
  const visibleCategories = showAllCategories
    ? rankedCategories
    : rankedCategories.slice(0, VISIBLE_CATEGORIES).concat(
        // La categoría elegida desde "Más" sigue visible al contraer
        rankedCategories.slice(VISIBLE_CATEGORIES).includes(selectedCategory) ? [selectedCategory] : []
      );

  // Último registro con cada nombre, para autocompletar categoría y cuenta
  const suggestions = useMemo(() => {
    const query = name.trim().toLowerCase();
    if (!query) return [];
    const seen = new Set<string>();
    const result: Transaction[] = [];
    for (const tx of ownTransactions) {
      const key = tx.name.toLowerCase();
      if (tx.type !== type || seen.has(key) || !key.includes(query) || key === query) continue;
      seen.add(key);
      result.push(tx);
      if (result.length === 3) break;
    }
    return result;
  }, [name, ownTransactions, type]);

  // Interés de la última compra a cuotas, como valor por defecto
  const lastInterestRate = useMemo(
    () =>
      ownTransactions.find((tx) => tx.paymentMethod === CREDIT_CARD_METHOD && (tx.installments ?? 1) > 1)
        ?.interestRate ?? 0,
    [ownTransactions]
  );
  const interestRate = installments > 1 ? lastInterestRate : 0;
  const cost = getInstallmentCost(amount, installments, interestRate);

  const pressKey = (key: string) => {
    if (key === 'back') setDigits((d) => d.slice(0, -1));
    else setDigits((d) => (d + key).replace(/^0+/, '').slice(0, MAX_DIGITS));
  };

  const selectType = (next: TransactionType) => {
    setType(next);
    setCategory('');
    if (!ACCOUNTS[next].some((a) => a.value === account)) setAccount('Billetera');
  };

  const selectCategory = (cat: string) => {
    setCategory(cat);
    if (cat === 'Inversiones') setAccount('Inversiones');
  };

  const applySuggestion = (tx: Transaction) => {
    setName(tx.name);
    setCategory(tx.category);
    if (tx.paymentMethod && ACCOUNTS[type].some((a) => a.value === tx.paymentMethod)) setAccount(tx.paymentMethod);
    if (tx.installments) setInstallments(tx.installments);
  };

  const openFullForm = () => {
    onClose();
    setEditingTransaction(null);
    setCurrentView('new-transaction');
  };

  const handleSave = async () => {
    if (amount <= 0 || saving) return;
    setSaving(true);
    await addTransaction({
      type,
      amount,
      name: name.trim() || selectedCategory,
      category: selectedCategory,
      date,
      paymentMethod: selectedCategory === 'Inversiones' ? 'Inversiones' : account,
      note: '',
      status: type === 'income' ? 'received' : 'paid',
      ...(isCardPurchase && selectedCategory !== 'Inversiones' && { installments, interestRate }),
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
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
      active ? 'bg-fg text-canvas' : 'bg-surface-2 text-fg-muted hover:text-fg'
    }`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo registro"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-md flex-col rounded-t-[20px] border border-b-0 border-line bg-surface-3 shadow-2xl"
          >
            {/* Asa para arrastrar y cerrar */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1"
            >
              <span className="h-1 w-10 rounded-full bg-line-strong" />
            </div>

            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-full bg-surface-2 p-0.5">
                  {(['expense', 'income'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => selectType(t)}
                      className={`rounded-full px-4 py-1.5 text-sm transition-colors cursor-pointer ${
                        type === t ? 'bg-surface-1 font-medium text-fg shadow-sm' : 'text-fg-muted'
                      }`}
                    >
                      {t === 'expense' ? 'Gasto' : 'Ingreso'}
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

              <p
                className={`text-center font-mono text-[44px] font-semibold leading-[52px] tracking-tight ${
                  amount === 0 ? 'text-fg-subtle' : type === 'income' ? 'text-positive' : 'text-fg'
                }`}
                aria-live="polite"
              >
                {formatCurrency(amount)}
              </p>

              {/* Categorías: las más usadas primero */}
              <div className="flex flex-wrap gap-1.5">
                {visibleCategories.map((cat) => {
                  const { Icon, color } = getCategoryMeta(cat);
                  const active = cat === selectedCategory;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                        active ? 'border-fg bg-fg text-canvas' : 'border-line text-fg hover:bg-surface-2'
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

              {selectedCategory !== 'Inversiones' && (
                <div className="flex items-center gap-1.5">
                  {ACCOUNTS[type].map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAccount(a.value)}
                      className={chipClass(account === a.value)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {isCardPurchase && selectedCategory !== 'Inversiones' && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Menos cuotas"
                      onClick={() => setInstallments((n) => Math.max(1, n - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-fg cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-16 text-center text-sm text-fg">
                      {installments} {installments === 1 ? 'cuota' : 'cuotas'}
                    </span>
                    <button
                      type="button"
                      aria-label="Más cuotas"
                      onClick={() => setInstallments((n) => Math.min(MAX_INSTALLMENTS, n + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-fg cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {installments > 1 && amount > 0 && (
                    <p
                      className={`text-right text-xs ${
                        cost.interestPct >= HIGH_INTEREST_PCT ? 'text-warning' : 'text-fg-muted'
                      }`}
                    >
                      {interestRate > 0
                        ? `+${formatCurrency(Math.round(cost.totalInterest))} de interés (${interestRate}% M.V.)`
                        : 'Sin interés'}
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Descripción (opcional: "${selectedCategory}")`}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-surface-1 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-line-strong"
                  />
                  <button type="button" onClick={() => setDate(today)} className={chipClass(date === today)}>
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(addDays(today, -1))}
                    className={chipClass(date === addDays(today, -1))}
                  >
                    Ayer
                  </button>
                  <label
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full cursor-pointer ${
                      date < addDays(today, -1) || date > today ? 'bg-fg text-canvas' : 'bg-surface-2 text-fg-muted'
                    }`}
                    title="Otra fecha"
                  >
                    <CalendarDays size={15} strokeWidth={1.75} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => e.target.value && setDate(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Otra fecha"
                    />
                  </label>
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestions.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => applySuggestion(tx)}
                        className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent cursor-pointer"
                      >
                        {tx.name} · {tx.category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Teclado numérico */}
              <div className="grid grid-cols-3 gap-1.5">
                {KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pressKey(key)}
                    aria-label={key === 'back' ? 'Borrar' : key}
                    className="flex h-12 items-center justify-center rounded-xl font-mono text-xl text-fg hover:bg-surface-2 active:bg-surface-2 active:scale-[0.97] transition-transform cursor-pointer select-none"
                  >
                    {key === 'back' ? <Delete size={20} strokeWidth={1.75} /> : key}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={amount <= 0 || saving}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-fg py-3.5 text-sm font-semibold text-canvas transition-opacity disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check size={18} strokeWidth={2} />
                {amount > 0
                  ? `Guardar ${type === 'expense' ? 'gasto' : 'ingreso'} de ${formatCurrency(amount)}`
                  : 'Ingresa un monto'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
