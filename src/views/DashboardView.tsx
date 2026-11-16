import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { getSafeToSpend } from '../utils/safeToSpend';
import { todayString } from '../utils/dates';
import { projectCashflow } from '../utils/cashflow';
import { BalanceHero } from '../components/dashboard/BalanceHero';
import { AccountTiles } from '../components/dashboard/AccountTiles';
import { BudgetInsight } from '../components/dashboard/BudgetInsight';
import { UpcomingStrip } from '../components/dashboard/UpcomingStrip';
import { ActivityList } from '../components/dashboard/ActivityList';
import { Toast, ToastData } from '../components/ui/Toast';

const PROJECTION_DAYS = 60;

export const DashboardView: React.FC = () => {
  const {
    walletBalance,
    transactions,
    pendingItems,
    addTransaction,
    deleteTransaction,
    setEditingTransaction,
    setCurrentView,
  } = useApp();

  const [toast, setToast] = useState<ToastData | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // addTransaction calcula los saldos con el estado de su render; para deshacer se usa
  // siempre la versión más reciente y no la que existía cuando se eliminó el movimiento.
  const addTransactionRef = useRef(addTransaction);
  addTransactionRef.current = addTransaction;

  const today = todayString();
  const safe = useMemo(
    () => getSafeToSpend(walletBalance, pendingItems, transactions, today),
    [walletBalance, pendingItems, transactions, today]
  );
  const projection = useMemo(
    () => projectCashflow(walletBalance, pendingItems, transactions, today, PROJECTION_DAYS),
    [walletBalance, pendingItems, transactions, today]
  );

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setCurrentView('new-transaction');
  };

  // Se elimina de inmediato (revirtiendo saldos) y se ofrece deshacer volviéndolo a crear
  const handleDelete = async (tx: Transaction) => {
    await deleteTransaction(tx.id);
    const { id: _id, ...data } = tx;
    setToast({
      id: Date.now(),
      message: `"${tx.name}" eliminado`,
      actionLabel: 'Deshacer',
      onAction: () => addTransactionRef.current(data),
    });
  };

  return (
    <main className="mx-auto max-w-[1100px] space-y-6 px-4 pt-4 pb-36 md:px-8 md:pt-6">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <BalanceHero walletBalance={walletBalance} safe={safe} projection={projection} />
        <UpcomingStrip today={today} />
      </div>

      <BudgetInsight today={today} />

      <AccountTiles />

      <ActivityList transactions={transactions} today={today} onEdit={handleEdit} onDelete={handleDelete} />

      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
};
