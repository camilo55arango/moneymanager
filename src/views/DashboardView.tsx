import React, { useCallback, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { todayString } from '../utils/dates';
import { AccountTiles } from '../components/dashboard/AccountTiles';
import { BudgetInsight } from '../components/dashboard/BudgetInsight';
import { UpcomingStrip } from '../components/dashboard/UpcomingStrip';
import { ActivityList } from '../components/dashboard/ActivityList';
import { Toast, ToastData } from '../components/ui/Toast';

export const DashboardView: React.FC = () => {
  const {
    transactions,
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

  // Las cuentas se montan sobre el banner morado del header. Desde xl la Actividad va a la
  // izquierda y presupuesto y próximos quedan fijos a la derecha; antes, todo en una columna.
  return (
    <main className="relative mx-auto -mt-8 max-w-[1100px] space-y-6 px-4 pb-36 md:px-8 xl:max-w-[1320px]">
      <AccountTiles />

      <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-6 xl:space-y-0">
        <aside className="space-y-6 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1">
          <BudgetInsight today={today} />
          <UpcomingStrip today={today} />
        </aside>

        <div className="xl:col-start-1 xl:row-start-1">
          <ActivityList transactions={transactions} today={today} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
};
