import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import { Transaction } from '../types';

type AccountScope = 'wallet' | 'investment' | 'all';
type PeriodScope = 'this-month' | '3-months' | '6-months' | 'year' | 'all';

export const EstadisticasView: React.FC = () => {
  const { transactions, walletBalance, investmentBalance } = useApp();

  const [accountScope, setAccountScope] = useState<AccountScope>('all');
  const [periodScope, setPeriodScope] = useState<PeriodScope>('this-month');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Helper to determine if transaction belongs to Investment
  const isInvestmentTx = (tx: Transaction) => {
    return tx.category.trim() === 'Inversiones' || tx.paymentMethod === 'Inversiones';
  };

  // Filter transactions by account scope and period scope
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return transactions.filter((tx) => {
      // 1. Account Scope Filter
      const isInv = isInvestmentTx(tx);
      if (accountScope === 'wallet' && isInv) return false;
      if (accountScope === 'investment' && !isInv) return false;

      // 2. Period Scope Filter
      if (!tx.date) return true;
      const txDate = new Date(tx.date + 'T00:00:00');
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      if (periodScope === 'this-month') {
        return txYear === currentYear && txMonth === currentMonth;
      }
      if (periodScope === '3-months') {
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
        return txDate >= threeMonthsAgo;
      }
      if (periodScope === '6-months') {
        const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
        return txDate >= sixMonthsAgo;
      }
      if (periodScope === 'year') {
        return txYear === currentYear;
      }
      return true; // 'all'
    });
  }, [transactions, accountScope, periodScope]);

  // Compute key totals
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense;

  const activeAccountBalance = useMemo(() => {
    if (accountScope === 'wallet') return walletBalance;
    if (accountScope === 'investment') return investmentBalance;
    return walletBalance + investmentBalance;
  }, [accountScope, walletBalance, investmentBalance]);

  // Expense categories breakdown
  const expenseCategories = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    const map: Record<string, { total: number; count: number }> = {};

    expenses.forEach((t) => {
      if (!map[t.category]) {
        map[t.category] = { total: 0, count: 0 };
      }
      map[t.category].total += t.amount;
      map[t.category].count += 1;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, totalExpense]);

  // Income categories breakdown
  const incomeCategories = useMemo(() => {
    const incomes = filteredTransactions.filter((t) => t.type === 'income');
    const map: Record<string, { total: number; count: number }> = {};

    incomes.forEach((t) => {
      if (!map[t.category]) {
        map[t.category] = { total: 0, count: 0 };
      }
      map[t.category].total += t.amount;
      map[t.category].count += 1;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, totalIncome]);

  // Monthly trends breakdown for last 6 months
  const monthlyTrends = useMemo(() => {
    const months: { label: string; yearMonth: string; income: number; expense: number }[] = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      months.push({
        label: `${monthNames[d.getMonth()]} ${yyyy.toString().slice(-2)}`,
        yearMonth: `${yyyy}-${mm}`,
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((tx) => {
      const isInv = isInvestmentTx(tx);
      if (accountScope === 'wallet' && isInv) return;
      if (accountScope === 'investment' && !isInv) return;

      if (!tx.date) return;
      const ym = tx.date.slice(0, 7);
      const targetMonth = months.find((m) => m.yearMonth === ym);
      if (targetMonth) {
        if (tx.type === 'income') {
          targetMonth.income += tx.amount;
        } else {
          targetMonth.expense += tx.amount;
        }
      }
    });

    const maxVal = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1);
    return { months, maxVal };
  }, [transactions, accountScope]);

  // Final list of transactions for detail section
  const detailedTransactionsList = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          tx.name.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query) ||
          (tx.note && tx.note.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [filteredTransactions, txTypeFilter, searchTerm]);

  return (
    <main className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-32 pt-stack-lg">
      {/* Account Selector Tabs (Billetera vs Inversiones) */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant shadow-xs">
          <div>
            <span className="text-xs font-bold text-outline uppercase tracking-wider block">
              Cuenta Seleccionada
            </span>
            <p className="text-sm font-semibold text-on-surface">
              {accountScope === 'wallet'
                ? 'Estadísticas de Billetera (Efectivo / Débito / Crédito)'
                : accountScope === 'investment'
                ? 'Estadísticas de Inversiones'
                : 'Estadísticas Consolidadas (Todas las cuentas)'}
            </p>
          </div>

          <div className="inline-flex w-full sm:w-auto p-1 bg-surface-container rounded-xl border border-outline-variant/60 shrink-0 self-start sm:self-auto justify-between sm:justify-start gap-1">
            <button
              onClick={() => setAccountScope('wallet')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial ${
                accountScope === 'wallet'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>Billetera</span>
            </button>

            <button
              onClick={() => setAccountScope('investment')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial ${
                accountScope === 'investment'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Inversiones</span>
            </button>

            <button
              onClick={() => setAccountScope('all')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial ${
                accountScope === 'all'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">layers</span>
              <span>Todas</span>
            </button>
          </div>
        </div>
      </section>

      {/* Period Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
          Resumen Financiero
        </h2>

        <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/60">
          <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
          <select
            value={periodScope}
            onChange={(e) => setPeriodScope(e.target.value as PeriodScope)}
            className="bg-transparent border-none text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="this-month">Este Mes</option>
            <option value="3-months">Últimos 3 Meses</option>
            <option value="6-months">Últimos 6 Meses</option>
            <option value="year">Año Actual</option>
            <option value="all">Todo el Histórico</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Income Card */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Total Ingresos
            </span>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">arrow_downward</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-numeric-data text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </h3>
            <p className="text-xs text-outline mt-1 font-medium">
              {filteredTransactions.filter((t) => t.type === 'income').length} movimientos de ingreso
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Total Gastos
            </span>
            <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">arrow_upward</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-numeric-data text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpense)}
            </h3>
            <p className="text-xs text-outline mt-1 font-medium">
              {filteredTransactions.filter((t) => t.type === 'expense').length} movimientos de gasto
            </p>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Balance Neto Periodo
            </span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                netBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-rose-500/10 text-rose-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {netBalance >= 0 ? 'balance' : 'warning'}
              </span>
            </div>
          </div>
          <div>
            <h3
              className={`text-2xl font-bold font-numeric-data ${
                netBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netBalance >= 0 ? '+' : ''}
              {formatCurrency(netBalance)}
            </h3>
            <p className="text-xs text-outline mt-1 font-medium">
              {netBalance >= 0 ? 'Superávit registrado' : 'Déficit en el periodo'}
            </p>
          </div>
        </div>

        {/* Current Account Balance Card */}
        <div className="bg-primary-container text-white p-5 rounded-2xl border border-primary/20 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              {accountScope === 'wallet'
                ? 'Saldo Billetera'
                : accountScope === 'investment'
                ? 'Saldo Inversiones'
                : 'Patrimonio Total'}
            </span>
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-white">account_balance</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-numeric-data text-white">
              {formatCurrency(activeAccountBalance)}
            </h3>
            <p className="text-xs opacity-80 mt-1 font-medium">
              Saldo actual en cuenta seleccionada
            </p>
          </div>
        </div>
      </section>

      {/* Income vs Expense Visual Ratio Bar */}
      {totalIncome + totalExpense > 0 && (
        <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xs mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">pie_chart</span>
              Proporción Ingresos vs Gastos
            </h3>
            <span className="text-xs font-bold text-outline">
              {totalIncome > 0
                ? `${Math.round((totalExpense / totalIncome) * 100)}% de ingresos consumidos`
                : 'Sin ingresos registrados'}
            </span>
          </div>

          <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden flex">
            {totalIncome > 0 && (
              <div
                style={{
                  width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%`,
                }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Ingresos: ${formatCurrency(totalIncome)}`}
              />
            )}
            {totalExpense > 0 && (
              <div
                style={{
                  width: `${(totalExpense / (totalIncome + totalExpense)) * 100}%`,
                }}
                className="bg-rose-500 transition-all duration-500"
                title={`Gastos: ${formatCurrency(totalExpense)}`}
              />
            )}
          </div>

          <div className="flex justify-between items-center text-xs font-semibold mt-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Ingresos: {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span>Gastos: {formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Monthly Trends (Last 6 Months) */}
      <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xs mb-8">
        <h3 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">bar_chart</span>
          Tendencia Mensual (Ingresos vs Gastos)
        </h3>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 pt-4 border-b border-outline-variant/40 pb-2">
          {monthlyTrends.months.map((m) => {
            const incHeight = (m.income / monthlyTrends.maxVal) * 100;
            const expHeight = (m.expense / monthlyTrends.maxVal) * 100;

            return (
              <div key={m.yearMonth} className="flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 bg-surface-container-highest text-on-surface p-2 rounded-lg text-[10px] font-bold shadow-lg z-20 whitespace-nowrap transition-opacity">
                  <p className="text-emerald-500">+: {formatCurrency(m.income)}</p>
                  <p className="text-rose-500">-: {formatCurrency(m.expense)}</p>
                </div>

                <div className="flex items-end gap-1 w-full max-w-[40px] h-full justify-center">
                  {/* Income Bar */}
                  <div
                    style={{ height: `${Math.max(incHeight, 4)}%` }}
                    className="w-1/2 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                  />
                  {/* Expense Bar */}
                  <div
                    style={{ height: `${Math.max(expHeight, 4)}%` }}
                    className="w-1/2 bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-outline mt-2 truncate w-full text-center">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Gastos</span>
          </div>
        </div>
      </section>

      {/* Categories Breakdown Section (2 Columns for Expenses & Income) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Expenses by Category */}
        <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">category</span>
              Gastos por Categoría
            </h3>
            <span className="text-xs font-bold text-outline">{expenseCategories.length} categorías</span>
          </div>

          {expenseCategories.length === 0 ? (
            <div className="text-center py-8 text-outline text-xs italic">
              No hay gastos registrados en este periodo.
            </div>
          ) : (
            <div className="space-y-4">
              {expenseCategories.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-outline">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="text-on-surface font-bold">{item.category}</span>
                      <span className="text-[10px] text-outline font-medium">({item.count})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-numeric-data text-rose-600 dark:text-rose-400 font-bold">
                        {formatCurrency(item.total)}
                      </span>
                      <span className="text-[10px] text-outline ml-1.5">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Income by Category */}
        <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">payments</span>
              Ingresos por Categoría
            </h3>
            <span className="text-xs font-bold text-outline">{incomeCategories.length} categorías</span>
          </div>

          {incomeCategories.length === 0 ? (
            <div className="text-center py-8 text-outline text-xs italic">
              No hay ingresos registrados en este periodo.
            </div>
          ) : (
            <div className="space-y-4">
              {incomeCategories.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-outline">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="text-on-surface font-bold">{item.category}</span>
                      <span className="text-[10px] text-outline font-medium">({item.count})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-numeric-data text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(item.total)}
                      </span>
                      <span className="text-[10px] text-outline ml-1.5">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Detailed Transaction List Under Current Filters */}
      <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Movimientos Filtrados ({detailedTransactionsList.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type filter */}
            <div className="inline-flex p-0.5 bg-surface-container rounded-lg border border-outline-variant/60 text-xs">
              <button
                onClick={() => setTxTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  txTypeFilter === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTxTypeFilter('income')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  txTypeFilter === 'income'
                    ? 'bg-emerald-600 text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setTxTypeFilter('expense')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  txTypeFilter === 'expense'
                    ? 'bg-rose-600 text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Gastos
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-outline text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-surface-container border border-outline-variant/60 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-36 sm:w-48"
              />
            </div>
          </div>
        </div>

        {detailedTransactionsList.length === 0 ? (
          <div className="text-center py-12 text-outline text-xs">
            No se encontraron movimientos con los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {detailedTransactionsList.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 hover:bg-surface-container/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {getCategoryIcon(tx.category)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-on-surface truncate">{tx.name}</h4>
                    <p className="text-xs text-outline font-medium flex items-center gap-2">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{tx.paymentMethod}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-numeric-data text-sm font-bold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-on-surface'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                  {tx.note && <p className="text-[10px] text-outline truncate max-w-[120px]">{tx.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
