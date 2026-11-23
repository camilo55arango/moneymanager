import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Search } from 'lucide-react';
import { useApp, CREDIT_CARD_METHOD, TRANSFER_METHOD, isSystemTransaction } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryMeta, NEUTRAL_META_COLORS } from '../utils/categories';
import { formatRelativeDay, todayString } from '../utils/dates';
import { Transaction } from '../types';
import { BudgetsCard } from '../components/analysis/BudgetsCard';
import { MonthlyTrendChart, MonthTotals } from '../components/analysis/MonthlyTrendChart';

type AccountScope = 'wallet' | 'investment' | 'credit' | 'all';
type PeriodScope = 'this-month' | '3-months' | '6-months' | 'year' | 'all';

const ACCOUNT_OPTIONS: { value: AccountScope; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'wallet', label: 'Billetera' },
  { value: 'credit', label: 'Tarjeta' },
  { value: 'investment', label: 'Inversiones' },
];

const PERIOD_OPTIONS: { value: PeriodScope; label: string }[] = [
  { value: 'this-month', label: 'Este mes' },
  { value: '3-months', label: '3 meses' },
  { value: '6-months', label: '6 meses' },
  { value: 'year', label: 'Este año' },
  { value: 'all', label: 'Todo' },
];

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TREND_MONTHS = 6;
const LIST_PAGE_SIZE = 30;

const isInvestmentTx = (tx: Transaction) => tx.category.trim() === 'Inversiones' || tx.paymentMethod === 'Inversiones';
const isCreditTx = (tx: Transaction) => !isInvestmentTx(tx) && tx.paymentMethod === CREDIT_CARD_METHOD;

const matchesAccount = (tx: Transaction, scope: AccountScope) => {
  if (scope === 'wallet') return !isInvestmentTx(tx) && !isCreditTx(tx);
  if (scope === 'investment') return isInvestmentTx(tx);
  if (scope === 'credit') return isCreditTx(tx);
  return true;
};

const groupByCategory = (items: Transaction[], total: number) => {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of items) {
    const entry = map.get(t.category) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    map.set(t.category, entry);
  }
  return [...map.entries()]
    .map(([category, data]) => ({ category, ...data, percentage: total > 0 ? (data.total / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
};

const chipClass = (active: boolean) =>
  `shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer ${
    active ? 'bg-accent text-on-accent font-medium' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
  }`;

export const EstadisticasView: React.FC = () => {
  const { transactions, walletBalance, investmentBalance, creditCardBalance } = useApp();
  const today = todayString();

  const [accountScope, setAccountScope] = useState<AccountScope>('all');
  const [periodScope, setPeriodScope] = useState<PeriodScope>('this-month');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTx, setShowAllTx] = useState(false);

  const periodStart = useMemo(() => {
    const [year, month] = today.split('-').map(Number);
    const monthStart = (monthsBack: number) => {
      const d = new Date(year, month - 1 - monthsBack, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    };
    switch (periodScope) {
      case 'this-month':
        return monthStart(0);
      case '3-months':
        return monthStart(2);
      case '6-months':
        return monthStart(5);
      case 'year':
        return `${year}-01-01`;
      default:
        return '';
    }
  }, [periodScope, today]);

  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => matchesAccount(tx, accountScope) && (!tx.date || tx.date >= periodStart)),
    [transactions, accountScope, periodStart]
  );

  // Transferencias y pagos de tarjeta solo mueven dinero entre cuentas propias: no son ingreso ni gasto
  const flows = useMemo(() => filteredTransactions.filter((tx) => !isSystemTransaction(tx)), [filteredTransactions]);
  const incomes = flows.filter((t) => t.type === 'income');
  const expenses = flows.filter((t) => t.type === 'expense');
  const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : null;

  const expenseCategories = useMemo(() => groupByCategory(expenses, totalExpense), [expenses, totalExpense]);
  const incomeCategories = useMemo(() => groupByCategory(incomes, totalIncome), [incomes, totalIncome]);

  const accountBalance =
    accountScope === 'wallet'
      ? { label: 'Saldo billetera', value: walletBalance }
      : accountScope === 'investment'
      ? { label: 'Saldo inversiones', value: investmentBalance }
      : accountScope === 'credit'
      ? { label: 'Deuda tarjeta', value: creditCardBalance }
      : { label: 'Patrimonio', value: walletBalance + investmentBalance - creditCardBalance };

  const monthlyTrends = useMemo<MonthTotals[]>(() => {
    const [year, month] = today.split('-').map(Number);
    const months: MonthTotals[] = Array.from({ length: TREND_MONTHS }, (_, i) => {
      const d = new Date(year, month - TREND_MONTHS + i, 1);
      return {
        label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        income: 0,
        expense: 0,
      };
    });
    for (const tx of transactions) {
      if (!tx.date || isSystemTransaction(tx) || !matchesAccount(tx, accountScope)) continue;
      const target = months.find((m) => m.yearMonth === tx.date.slice(0, 7));
      if (!target) continue;
      if (tx.type === 'income') target.income += tx.amount;
      else target.expense += tx.amount;
    }
    return months;
  }, [transactions, accountScope, today]);

  const detailedTransactionsList = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return filteredTransactions.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (!query) return true;
      return (
        tx.name.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        (tx.note && tx.note.toLowerCase().includes(query))
      );
    });
  }, [filteredTransactions, txTypeFilter, searchTerm]);

  const visibleTransactions = showAllTx ? detailedTransactionsList : detailedTransactionsList.slice(0, LIST_PAGE_SIZE);

  const renderCategoryList = (items: ReturnType<typeof groupByCategory>, emptyText: string) =>
    items.length === 0 ? (
      <p className="py-6 text-center text-sm text-fg-subtle">{emptyText}</p>
    ) : (
      <ul className="space-y-3.5">
        {items.map((item) => {
          const { Icon, color } = getCategoryMeta(item.category);
          return (
            <li key={item.category}>
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <Icon size={14} strokeWidth={1.75} style={{ color }} />
                <span className="flex-1 truncate text-fg">{item.category}</span>
                <span className="text-xs text-fg-subtle">{item.percentage.toFixed(0)}%</span>
                <span className="w-28 text-right font-mono text-fg">{formatCurrency(Math.round(item.total))}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: color }} />
              </div>
            </li>
          );
        })}
      </ul>
    );

  return (
    <main className="mx-auto max-w-[1100px] xl:max-w-[1320px] space-y-4 px-4 pt-4 pb-36 md:px-8 md:pt-6">
      {/* Filtros: cuenta y periodo en una sola franja */}
      <div className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {ACCOUNT_OPTIONS.map((opt) => (
          <button key={opt.value} type="button" onClick={() => setAccountScope(opt.value)} className={chipClass(accountScope === opt.value)}>
            {opt.label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px shrink-0 bg-line" />
        {PERIOD_OPTIONS.map((opt) => (
          <button key={opt.value} type="button" onClick={() => setPeriodScope(opt.value)} className={chipClass(periodScope === opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-fg-subtle">Ingresos</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-positive">{formatCurrency(Math.round(totalIncome))}</p>
          <p className="mt-0.5 text-xs text-fg-subtle">{incomes.length} movimientos</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-fg-subtle">Gastos</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-fg">{formatCurrency(Math.round(totalExpense))}</p>
          <p className="mt-0.5 text-xs text-fg-subtle">{expenses.length} movimientos</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-fg-subtle">Neto</p>
          <p className={`mt-1 font-mono text-xl font-semibold tracking-tight ${netBalance < 0 ? 'text-negative' : 'text-fg'}`}>
            {netBalance > 0 ? '+' : netBalance < 0 ? '−' : ''}
            {formatCurrency(Math.abs(Math.round(netBalance)))}
          </p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {savingsRate === null
              ? 'Sin ingresos en el periodo'
              : savingsRate >= 0
              ? `Ahorraste el ${Math.round(savingsRate)}% de tus ingresos`
              : `Gastaste ${Math.round(-savingsRate)}% más de lo que entró`}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-fg-subtle">{accountBalance.label}</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-fg">{formatCurrency(accountBalance.value)}</p>
          <p className="mt-0.5 text-xs text-fg-subtle">Saldo actual</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <BudgetsCard today={today} />
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-sm font-medium text-fg">Últimos {TREND_MONTHS} meses</h2>
          <MonthlyTrendChart months={monthlyTrends} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-sm font-medium text-fg">Gastos por categoría</h2>
          {renderCategoryList(expenseCategories, 'No hay gastos en este periodo.')}
        </section>
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-sm font-medium text-fg">Ingresos por categoría</h2>
          {renderCategoryList(incomeCategories, 'No hay ingresos en este periodo.')}
        </section>
      </div>

      {/* Movimientos del filtro */}
      <section className="card p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-fg">
            Movimientos <span className="font-normal text-fg-subtle">{detailedTransactionsList.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-surface-2 p-0.5 text-xs">
              {(
                [
                  ['all', 'Todos'],
                  ['income', 'Ingresos'],
                  ['expense', 'Gastos'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTxTypeFilter(value)}
                  className={`rounded-full px-3 py-1 transition-colors cursor-pointer ${
                    txTypeFilter === value ? 'bg-surface-3 font-medium text-fg shadow-sm' : 'text-fg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-fg-subtle" />
              <input
                type="search"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-40 rounded-full border border-line bg-canvas py-1.5 pl-8 pr-3 text-xs text-fg placeholder:text-fg-subtle outline-none focus:border-line-strong sm:w-52"
              />
            </label>
          </div>
        </div>

        {detailedTransactionsList.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-subtle">No hay movimientos con estos filtros.</p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {visibleTransactions.map((tx) => {
                const isTransfer = tx.paymentMethod === TRANSFER_METHOD;
                const { Icon, color, tint } = isTransfer
                  ? { Icon: ArrowLeftRight, ...NEUTRAL_META_COLORS }
                  : getCategoryMeta(tx.category);
                const isIncome = tx.type === 'income';
                return (
                  <li key={tx.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: tint, color }}
                    >
                      <Icon size={14} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-fg">{tx.name}</p>
                      <p className="truncate text-xs text-fg-subtle">
                        <span className="capitalize">{formatRelativeDay(tx.date, today)}</span> · {tx.category}
                        {tx.note && ` · ${tx.note}`}
                      </p>
                    </div>
                    <p className={`shrink-0 font-mono text-sm ${isTransfer ? 'text-fg-muted' : isIncome ? 'text-positive' : 'text-fg'}`}>
                      {isIncome ? '+' : isTransfer ? '' : '−'}
                      {formatCurrency(tx.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
            {!showAllTx && detailedTransactionsList.length > LIST_PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setShowAllTx(true)}
                className="mt-3 w-full rounded-full border border-line py-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg cursor-pointer"
              >
                Ver los {detailedTransactionsList.length - LIST_PAGE_SIZE} restantes
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
};
