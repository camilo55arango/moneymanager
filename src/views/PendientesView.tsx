import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarClock, Check, ChevronDown, CreditCard, Pencil, Repeat, Trash2, TrendingUp, X, Zap } from 'lucide-react';
import { useApp, CREDIT_CARD_METHOD, isCreditCardExpense as isCreditCardItem } from '../context/AppContext';
import { PendingItem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryMeta } from '../utils/categories';
import { daysBetween, formatShortDate, todayString } from '../utils/dates';
import {
  getCreditCardCycle,
  getCardCharges,
  getMinimumPaymentsByMonth,
  getStatementPayments,
} from '../utils/creditCard';
import { InstallmentFields, parseInstallmentInputs } from '../components/InstallmentFields';

const NO_DATE_KEY = 'SIN_FECHA';
const OVERDUE_KEY = '0000-00_MESES_ANTERIORES';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const RECURRENCE_LABELS: Record<string, string> = {
  '1w': 'Semanal',
  semanal: 'Semanal',
  '1m': 'Mensual',
  mensual: 'Mensual',
  '2m': 'Bimensual',
  bimensual: 'Bimensual',
  '3m': 'Trimestral',
  trimestral: 'Trimestral',
  '6m': 'Semestral',
  semestral: 'Semestral',
  '12m': 'Anual',
  anual: 'Anual',
};

const getRecurrenceText = (recurrence?: string) => (recurrence ? RECURRENCE_LABELS[recurrence] ?? null : null);

// Texto y color del vencimiento: rojo solo si ya venció, ámbar si vence en los próximos 5 días
const getDueInfo = (days: number | null, dueDate: string | null): { label: string; tone: string } => {
  if (days === null || !dueDate) return { label: 'Sin fecha', tone: 'text-fg-subtle' };
  if (days < 0) return { label: `Vencido hace ${-days} ${-days === 1 ? 'día' : 'días'}`, tone: 'text-negative' };
  if (days === 0) return { label: 'Vence hoy', tone: 'text-warning' };
  if (days === 1) return { label: 'Mañana', tone: 'text-warning' };
  if (days <= 5) return { label: `${formatShortDate(dueDate)} · en ${days} días`, tone: 'text-warning' };
  return { label: formatShortDate(dueDate), tone: 'text-fg-subtle' };
};

interface GroupedPending {
  groupKey: string;
  groupTitle: string;
  isCurrent: boolean;
  items: PendingItem[];
  totalIncome: number;
  totalWalletExpense: number;
  totalCardExpense: number;
  cardMinimumPayment: number; // pago mínimo de la tarjeta que vence el día de pago de este mes
}

export const PendientesView: React.FC = () => {
  const {
    pendingItems,
    transactions,
    markPendingAsPaid,
    deletePendingItem,
    setEditingPendingItem,
    setCurrentView,
  } = useApp();

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [payModalItem, setPayModalItem] = useState<PendingItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payAccount, setPayAccount] = useState<string>('Billetera');
  const [payInstallments, setPayInstallments] = useState<string>('1');
  const [payInterestRate, setPayInterestRate] = useState<string>('0');
  // Solo lo que el usuario abrió o cerró; el resto usa isCollapsedByDefault
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const today = todayString();
  const currentMonthKey = today.slice(0, 7);

  // Vencidos y los dos primeros meses abiertos; "Sin fecha" y meses lejanos cerrados
  const isCollapsedByDefault = (groupKey: string, index: number) =>
    groupKey === NO_DATE_KEY || (groupKey !== OVERDUE_KEY && index > 1);

  const groupMap: Record<string, GroupedPending> = {};

  const getGroup = (groupKey: string, groupTitle: string, isCurrent = false): GroupedPending =>
    (groupMap[groupKey] ??= {
      groupKey,
      groupTitle,
      isCurrent,
      items: [],
      totalIncome: 0,
      totalWalletExpense: 0,
      totalCardExpense: 0,
      cardMinimumPayment: 0,
    });

  // Grupo de un mes a partir de su clave YYYY-MM
  const getMonthGroup = (monthKey: string): GroupedPending => {
    const [year, month] = monthKey.split('-').map(Number);
    return getGroup(monthKey, `${MONTH_NAMES[month - 1]} ${year}`, monthKey === currentMonthKey);
  };

  pendingItems.forEach((item) => {
    let group: GroupedPending;
    if (!item.dueDate) {
      group = getGroup(NO_DATE_KEY, 'Sin fecha');
    } else if (item.dueDate.slice(0, 7) < currentMonthKey) {
      group = getGroup(OVERDUE_KEY, 'Vencidos de meses anteriores');
    } else {
      group = getMonthGroup(item.dueDate.slice(0, 7));
    }

    group.items.push(item);
    if (item.type === 'income') {
      group.totalIncome += item.amount;
    } else if (isCreditCardItem(item)) {
      group.totalCardExpense += item.amount;
    } else {
      group.totalWalletExpense += item.amount;
    }
  });

  // El pago mínimo de la tarjeta sale de la billetera en el mes de su día de pago, descontando
  // lo que ya se haya abonado a ese extracto. Los meses ya pasados no se cuentan.
  Object.entries(getMinimumPaymentsByMonth(getCardCharges(transactions, pendingItems))).forEach(
    ([monthKey, amount]) => {
      if (monthKey < currentMonthKey) return;
      const remaining = Math.round(amount - getStatementPayments(transactions, monthKey));
      if (remaining <= 0) return;
      getMonthGroup(monthKey).cardMinimumPayment += remaining;
    }
  );

  Object.values(groupMap).forEach((group) => {
    group.items.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
  });

  // Sin fecha -> vencidos -> meses en orden
  const groupsList = Object.values(groupMap).sort((a, b) => {
    if (a.groupKey === NO_DATE_KEY) return -1;
    if (b.groupKey === NO_DATE_KEY) return 1;
    return a.groupKey.localeCompare(b.groupKey);
  });
  // "Sin fecha" no cuenta para decidir qué meses se abren por defecto
  const datedOffset = groupMap[NO_DATE_KEY] ? 1 : 0;

  const overdueCount = pendingItems.filter((p) => p.dueDate && p.dueDate < today).length;

  const toggleGroup = (groupKey: string, collapsed: boolean) =>
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !collapsed }));

  const handleEdit = (item: PendingItem) => {
    setEditingPendingItem(item);
    setCurrentView('new-pending');
  };

  const handlePayClick = (item: PendingItem) => {
    setPayModalItem(item);
    setPayAmountInput(item.amount ? item.amount.toString() : '');
    setPayAccount(isCreditCardItem(item) ? CREDIT_CARD_METHOD : 'Billetera');
    setPayInstallments(String(item.installments ?? 1));
    setPayInterestRate(String(item.interestRate ?? 0));
    setActiveItemId(null);
  };

  const handleDelete = (id: string) => {
    deletePendingItem(id);
    setActiveItemId(null);
  };

  const confirmPayment = () => {
    if (!payModalItem) return;
    const finalAmount = parseFloat(payAmountInput);
    markPendingAsPaid(
      payModalItem.id,
      isNaN(finalAmount) ? payModalItem.amount : finalAmount,
      payAccount,
      parseInstallmentInputs(payInstallments, payInterestRate)
    );
    setPayModalItem(null);
  };

  const renderItem = (item: PendingItem) => {
    const days = item.dueDate ? daysBetween(today, item.dueDate) : null;
    const due = getDueInfo(days, item.dueDate);
    const isActive = activeItemId === item.id;
    const isIncome = item.type === 'income';
    const recurrence = getRecurrenceText(item.recurrence);
    const { Icon, color } = getCategoryMeta(item.category);

    return (
      <li key={item.id}>
        <div
          onClick={() => setActiveItemId((prev) => (prev === item.id ? null : item.id))}
          className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-2 ${
            isActive ? 'bg-surface-2' : ''
          }`}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}1F`, color }}
          >
            <Icon size={16} strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-fg">{item.name}</p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-subtle">
              <span className={due.tone}>{due.label}</span>
              {recurrence && (
                <span className="inline-flex items-center gap-1">
                  <Repeat size={12} strokeWidth={1.75} />
                  {recurrence}
                </span>
              )}
              {item.isAutomatic && (
                <span className="inline-flex items-center gap-1">
                  <Zap size={12} strokeWidth={1.75} />
                  Automático
                </span>
              )}
              {isCreditCardItem(item) && (
                <span className="inline-flex items-center gap-1">
                  <CreditCard size={12} strokeWidth={1.75} />
                  {item.dueDate ? `Pago ${formatShortDate(getCreditCardCycle(item.dueDate).paymentDate)}` : 'Tarjeta'}
                  {(item.installments ?? 1) > 1 && ` · ${item.installments} cuotas`}
                </span>
              )}
            </p>
          </div>

          <p className={`shrink-0 font-mono text-sm ${item.amount === 0 ? 'text-fg-subtle' : isIncome ? 'text-positive' : 'text-fg'}`}>
            {item.amount === 0 ? 'Por definir' : `${isIncome ? '+' : ''}${formatCurrency(item.amount)}`}
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePayClick(item);
            }}
            aria-label={`${isIncome ? 'Recibir' : 'Pagar'} ${item.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-positive hover:bg-positive/10 hover:text-positive cursor-pointer"
          >
            <Check size={16} strokeWidth={2} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 px-3 pb-3 pl-15">
                <button
                  type="button"
                  onClick={() => handlePayClick(item)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent cursor-pointer"
                >
                  <Check size={14} strokeWidth={2} />
                  {isIncome ? 'Marcar recibido' : 'Marcar pagado'}
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg hover:bg-surface-2 cursor-pointer"
                >
                  <Pencil size={14} strokeWidth={1.75} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-negative hover:bg-negative/10 cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                  Eliminar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pt-4 pb-36 md:px-8 md:pt-6">
      <p className="text-sm text-fg-muted">
        {pendingItems.length === 0
          ? 'Facturas, deudas e ingresos por recibir'
          : overdueCount > 0
          ? `${overdueCount} ${overdueCount === 1 ? 'pendiente vencido' : 'pendientes vencidos'} · toca ✓ para registrarlo`
          : 'Todo al día · toca un pendiente para ver sus opciones'}
      </p>

      {pendingItems.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
          <CalendarClock size={22} strokeWidth={1.75} className="text-fg-subtle" />
          <p className="text-sm text-fg">No hay pendientes programados</p>
          <p className="text-xs text-fg-subtle">Toca + para agregar una factura, una cuota o un ingreso esperado.</p>
        </div>
      ) : (
        groupsList.map((group, index) => {
          const isCollapsed =
            collapsedGroups[group.groupKey] ?? isCollapsedByDefault(group.groupKey, index - datedOffset);
          const groupTotal = group.totalIncome - group.totalWalletExpense - group.cardMinimumPayment;
          const isOverdueGroup = group.groupKey === OVERDUE_KEY;

          return (
            <section key={group.groupKey}>
              <button
                type="button"
                onClick={() => toggleGroup(group.groupKey, isCollapsed)}
                aria-expanded={!isCollapsed}
                className="mb-2 flex w-full items-center gap-2 px-1 text-left cursor-pointer"
              >
                <ChevronDown
                  size={16}
                  className={`text-fg-subtle transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                />
                <h2 className={`text-sm font-medium ${isOverdueGroup ? 'text-negative' : 'text-fg'}`}>
                  {group.groupTitle}
                </h2>
                {group.isCurrent && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">Este mes</span>
                )}
                <span className="text-xs text-fg-subtle">{group.items.length}</span>
                <span
                  className={`ml-auto font-mono text-sm ${
                    groupTotal < 0 ? 'text-negative' : groupTotal > 0 ? 'text-positive' : 'text-fg-subtle'
                  }`}
                >
                  {groupTotal > 0 ? '+' : groupTotal < 0 ? '−' : ''}
                  {formatCurrency(Math.abs(groupTotal))}
                </span>
              </button>

              {!isCollapsed && (
                <div className="card overflow-hidden">
                  {group.groupKey !== NO_DATE_KEY && (
                    <div className="border-b border-line px-4 py-3">
                      <dl className="grid grid-cols-3 gap-3 text-xs">
                        {[
                          { label: 'Ingresos', value: group.totalIncome, sign: '+' },
                          { label: 'Billetera', value: group.totalWalletExpense, sign: '−' },
                          { label: 'Mín. tarjeta', value: group.cardMinimumPayment, sign: '−' },
                        ].map((col) => (
                          <div key={col.label} className="min-w-0">
                            <dt className="text-fg-subtle">{col.label}</dt>
                            <dd className={`mt-0.5 truncate font-mono text-sm ${col.value === 0 ? 'text-fg-subtle' : 'text-fg'}`}>
                              {col.value === 0 ? formatCurrency(0) : `${col.sign}${formatCurrency(col.value)}`}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {group.totalCardExpense > 0 && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
                          <CreditCard size={12} strokeWidth={1.75} />
                          {formatCurrency(group.totalCardExpense)} con tarjeta · se paga en los próximos extractos
                        </p>
                      )}
                    </div>
                  )}
                  <ul className="divide-y divide-line">{group.items.map(renderItem)}</ul>
                </div>
              )}
            </section>
          );
        })
      )}

      {/* Confirmación de pago */}
      <AnimatePresence>
        {payModalItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPayModalItem(null)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Confirmar pago"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-[20px] border border-line bg-surface-3 p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[20px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-fg">
                    {payModalItem.type === 'income' ? 'Registrar ingreso' : 'Registrar pago'}
                  </h3>
                  <p className="text-sm text-fg-muted">
                    {payModalItem.name} · {payModalItem.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs text-fg-muted">Monto</span>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-fg-subtle">$</span>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas py-2.5 pl-7 pr-3 font-mono text-lg text-fg outline-none focus:border-line-strong"
                    placeholder="0"
                  />
                </div>
                {payModalItem.amount > 0 && Number(payAmountInput) !== payModalItem.amount && (
                  <button
                    type="button"
                    onClick={() => setPayAmountInput(payModalItem.amount.toString())}
                    className="text-xs text-accent cursor-pointer"
                  >
                    Usar el valor registrado ({formatCurrency(payModalItem.amount)})
                  </button>
                )}
              </label>

              {payModalItem.category.trim() === 'Inversiones' ? (
                <p className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-xs text-fg-muted">
                  <TrendingUp size={14} strokeWidth={1.75} />
                  Este pendiente siempre se registra en Inversiones.
                </p>
              ) : (
                payModalItem.type === 'expense' && (
                  <div className="space-y-2">
                    <span className="text-xs text-fg-muted">Pagar con</span>
                    <div className="inline-flex w-full rounded-full bg-surface-2 p-0.5">
                      {[
                        { value: 'Billetera', label: 'Billetera' },
                        { value: CREDIT_CARD_METHOD, label: 'Tarjeta' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPayAccount(opt.value)}
                          className={`flex-1 rounded-full py-1.5 text-sm transition-colors cursor-pointer ${
                            payAccount === opt.value ? 'bg-surface-3 font-medium text-fg shadow-sm' : 'text-fg-muted'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {payAccount === CREDIT_CARD_METHOD && (
                      <>
                        <p className="text-xs text-fg-subtle">
                          Se suma a la deuda de la tarjeta; la billetera no cambia hasta que la pagues.
                        </p>
                        <InstallmentFields
                          amount={parseFloat(payAmountInput) || 0}
                          installments={payInstallments}
                          interestRate={payInterestRate}
                          onInstallmentsChange={setPayInstallments}
                          onInterestRateChange={setPayInterestRate}
                        />
                      </>
                    )}
                  </div>
                )
              )}

              {getRecurrenceText(payModalItem.recurrence) && (
                <p className="flex items-center gap-2 text-xs text-fg-subtle">
                  <Repeat size={12} strokeWidth={1.75} />
                  Se repite {getRecurrenceText(payModalItem.recurrence)!.toLowerCase()}: la siguiente ocurrencia sigue
                  programada.
                </p>
              )}

              <button
                type="button"
                onClick={confirmPayment}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Check size={16} strokeWidth={2} />
                Confirmar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
};
