import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryIcon } from '../utils/categories';

export const DashboardView: React.FC = () => {
  const {
    walletBalance,
    investmentBalance,
    transactions,
    setIsTransferModalOpen,
  } = useApp();

  return (
    <main className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-32 pt-stack-lg">
      {/* Dashboard Hero Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg mb-stack-lg">
        {/* Total Wallet Card */}
        <div className="bg-primary text-on-primary p-3.5 sm:p-6 rounded-xl shadow-[0_15px_35px_-10px_rgba(15,23,42,0.3)] relative overflow-hidden group transition-transform duration-300 hover:scale-[1.01]">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2.5 sm:mb-4 gap-2">
            <div>
              <p className="font-label-caps text-label-caps text-on-primary-fixed-variant/80 uppercase tracking-widest font-bold text-[11px] sm:text-xs">
                TOTAL BILLETERA
              </p>
              <h2 className="font-display-currency mt-1 font-bold tracking-tight">
                {formatCurrency(walletBalance)}
              </h2>
            </div>
            <div className="bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold shrink-0">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">trending_up</span>
              <span className="font-label-caps text-[9px] sm:text-[10px]">DISPONIBLE</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 opacity-80">
            <span className="material-symbols-outlined text-xs sm:text-base">account_balance_wallet</span>
            <span className="font-body-md italic text-[10px] sm:text-xs">
              Disponible para gastos inmediatos
            </span>
          </div>
        </div>

        {/* Total Inversiones Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-6 rounded-xl shadow-[0_4px_15px_0_rgba(0,0,0,0.04)] relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex justify-between items-start mb-2.5 sm:mb-4 gap-2">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold text-[10px] sm:text-xs">
                TOTAL INVERSIONES
              </p>
              <h2 className="font-display-currency text-primary mt-0.5 sm:mt-1 font-bold tracking-tight">
                {formatCurrency(investmentBalance)}
              </h2>
            </div>
            <div className="bg-primary-container text-white px-2 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 font-bold shrink-0">
              <span className="material-symbols-outlined text-[12px] sm:text-[16px]">monitoring</span>
              <span className="font-label-caps text-[8px] sm:text-[10px]">Inver</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-xs sm:text-base">show_chart</span>
            <span className="font-body-md italic text-[10px] sm:text-xs">
              Afectado exclusivamente por la categoría "Inversiones"
            </span>
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

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xs hover:shadow-md transition-shadow"
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
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
