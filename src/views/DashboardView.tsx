import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryIcon } from '../utils/categories';

export const DashboardView: React.FC = () => {
  const {
    walletBalance,
    investmentBalance,
    creditCardBalance,
    creditLimit,
    transactions,
    setIsTransferModalOpen,
    setIsPayCreditModalOpen,
    setEditingTransaction,
    deleteTransaction,
    setCurrentView,
  } = useApp();

  const [activeTxId, setActiveTxId] = useState<string | null>(null);

  const availableCredit = Math.max(creditLimit - creditCardBalance, 0);

  const handleEdit = (tx: Transaction) => {
    setActiveTxId(null);
    setEditingTransaction(tx);
    setCurrentView('new-transaction');
  };

  const handleDelete = async (tx: Transaction) => {
    setActiveTxId(null);
    const confirmed = window.confirm(
      `¿Eliminar "${tx.name}" por ${formatCurrency(tx.amount)}?\nLos saldos se ajustarán automáticamente.`
    );
    if (confirmed) await deleteTransaction(tx.id);
  };

  return (
    <main className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-32 pt-stack-lg">
      {/* Dashboard Hero Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg mb-stack-lg">
        {/* Total Wallet Card */}
        <div className="bg-primary text-on-primary p-3.5 sm:p-6 rounded-xl shadow-[0_15px_35px_-10px_rgba(15,23,42,0.3)] relative overflow-hidden group transition-transform duration-300 hover:scale-[1.01]">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center gap-2">
            <p className="font-label-caps text-label-caps text-on-primary-fixed-variant/80 uppercase tracking-widest font-bold text-[10px] sm:text-xs">
              TOTAL BILLETERA
            </p>
            <div className="bg-secondary-container text-on-secondary-container px-2 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 font-bold shrink-0">
              <span className="material-symbols-outlined text-[12px] sm:text-[16px]">trending_up</span>
              <span className="font-label-caps text-[8px] sm:text-[10px]">Disponible</span>
            </div>
          </div>
          <h2 className="font-display-currency mt-0.5 sm:mt-1 mb-2.5 sm:mb-4 font-bold tracking-tight">
            {formatCurrency(walletBalance)}
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 opacity-80">
            <span className="material-symbols-outlined text-xs sm:text-base">account_balance_wallet</span>
            <span className="font-body-md italic text-[10px] sm:text-xs">
              Disponible para gastos inmediatos
            </span>
          </div>
        </div>

        {/* Total Inversiones Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-6 rounded-xl shadow-[0_4px_15px_0_rgba(0,0,0,0.04)] relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex justify-between items-center gap-2">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold text-[10px] sm:text-xs">
              TOTAL INVERSIONES
            </p>
            <div className="bg-primary-container text-white px-2 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 font-bold shrink-0">
              <span className="material-symbols-outlined text-[12px] sm:text-[16px]">monitoring</span>
              <span className="font-label-caps text-[8px] sm:text-[10px]">Inversión</span>
            </div>
          </div>
          <h2 className="font-display-currency text-primary mt-0.5 sm:mt-1 mb-2.5 sm:mb-4 font-bold tracking-tight">
            {formatCurrency(investmentBalance)}
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-xs sm:text-base">show_chart</span>
            <span className="font-body-md italic text-[10px] sm:text-xs">
              Afectado exclusivamente por la categoría "Inversiones"
            </span>
          </div>
        </div>

        {/* Total Tarjeta de Crédito Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-6 rounded-xl shadow-[0_4px_15px_0_rgba(0,0,0,0.04)] relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex justify-between items-center gap-2">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold text-[10px] sm:text-xs">
              DEUDA TARJETA DE CRÉDITO
            </p>
            <div className="bg-error-container text-on-error-container px-2 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 font-bold shrink-0">
              <span className="material-symbols-outlined text-[12px] sm:text-[16px]">credit_card</span>
              <span className="font-label-caps text-[8px] sm:text-[10px]">Crédito</span>
            </div>
          </div>
          <h2 className="font-display-currency text-error mt-0.5 sm:mt-1 mb-2.5 sm:mb-4 font-bold tracking-tight">
            {formatCurrency(creditCardBalance)}
          </h2>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-on-surface-variant">
            <span className="font-body-md italic text-[10px] sm:text-xs">
              {creditLimit > 0 ? `Disponible: ${formatCurrency(availableCredit)}` : 'Sin cupo configurado'}
            </span>
            <button
              onClick={() => setIsPayCreditModalOpen(true)}
              className="text-[10px] sm:text-xs font-bold text-primary hover:underline cursor-pointer shrink-0"
            >
              Pagar
            </button>
          </div>
        </div>
      </section>

      {/* Main Actions Row */}
      <section className="flex flex-wrap gap-stack-md mb-stack-lg justify-center">
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="min-w-[160px] bg-primary text-on-primary py-3.5 px-6 rounded-full font-label-caps text-label-caps flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined">swap_horiz</span>
          <span>TRANSFERIR FONDOS</span>
        </button>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-stack-md">
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Actividad Reciente</h3>
          <span className="text-xs text-outline font-semibold">
            {transactions.length} movimientos
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant rounded-xl text-outline">
            No hay registros de transacciones todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isInv = tx.category === 'Inversiones';
              const isActive = activeTxId === tx.id;

              return (
                <div
                  key={tx.id}
                  onClick={() => setActiveTxId((prev) => (prev === tx.id ? null : tx.id))}
                  className={`relative overflow-hidden flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xs hover:shadow-md transition-shadow cursor-pointer ${
                    isActive ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center ${
                        isInv
                          ? 'bg-primary-container text-white'
                          : isIncome
                          ? 'bg-secondary-container/40 text-secondary'
                          : 'bg-secondary-container/30 text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {getCategoryIcon(tx.category)}
                      </span>
                    </div>

                    <div>
                      <p className="font-numeric-data text-numeric-data text-primary font-semibold">
                        {tx.name}
                      </p>
                      <p className="font-body-md text-on-surface-variant text-xs font-medium">
                        {tx.category}
                      </p>
                      <p className="font-body-md text-outline text-[11px]">
                        {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-numeric-data text-numeric-data font-bold ${
                        isIncome ? 'text-secondary' : 'text-error'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === 'received' || tx.status === 'paid'
                          ? 'bg-secondary-container/40 text-on-secondary-container'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.status === 'received' ? 'Recibido' : tx.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Actions Overlay */}
                  <div
                    className={`absolute inset-0 bg-surface-container-highest/95 flex items-center justify-center gap-8 z-20 transition-opacity ${
                      isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(tx);
                      }}
                      className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                      title="Editar Registro"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-on-primary transition-colors shadow-xs">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </div>
                      <span className="text-[10px] font-bold">EDITAR</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tx);
                      }}
                      className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                      title="Eliminar Registro"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center group-hover/btn:bg-error group-hover/btn:text-on-error transition-colors shadow-xs">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </div>
                      <span className="text-[10px] font-bold text-error">BORRAR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
