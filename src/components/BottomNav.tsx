import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, setEditingTransaction, setEditingPendingItem } = useApp();
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Don't render bottom nav in transactional setup/login screens if not needed, or render cleanly
  if (currentView === 'setup' || currentView === 'login') {
    return null;
  }

  const handleFabClick = () => {
    setShowFabMenu((prev) => !prev);
  };

  return (
    <>
      {/* FAB Quick Action Speed Dial Backdrop */}
      {showFabMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 animate-in fade-in duration-200"
          onClick={() => setShowFabMenu(false)}
        />
      )}

      {/* FAB Quick Options Popup */}
      {showFabMenu && (
        <div className="fixed bottom-36 right-6 z-40 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-5 duration-200">
          <button
            onClick={() => {
              setShowFabMenu(false);
              setEditingTransaction(null);
              setCurrentView('new-transaction');
            }}
            className="flex items-center gap-3 bg-white text-primary px-4 py-3 rounded-full shadow-xl border border-outline-variant hover:bg-surface-container transition-all active:scale-95 cursor-pointer font-semibold text-sm"
          >
            <span>Nuevo Registro (Gasto/Ingreso)</span>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">add_card</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowFabMenu(false);
              setEditingPendingItem(null);
              setCurrentView('new-pending');
            }}
            className="flex items-center gap-3 bg-primary-container text-white px-4 py-3 rounded-full shadow-xl border border-primary/20 hover:bg-opacity-90 transition-all active:scale-95 cursor-pointer font-semibold text-sm"
          >
            <span>Nuevo Pendiente</span>
            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_repeat</span>
            </div>
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={handleFabClick}
        title="Agregar nuevo"
        className={`fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_8px_25px_0_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 cursor-pointer ${
          showFabMenu ? 'rotate-45 bg-surface-container-highest text-primary' : ''
        }`}
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-safe bg-surface-container-lowest border-t border-outline-variant shadow-[0_-4px_15px_0_rgba(0,0,0,0.04)] z-40 rounded-t-xl max-w-7xl mx-auto right-0">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center px-3 sm:px-6 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            currentView === 'dashboard'
              ? 'bg-secondary-container text-on-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-variant/50'
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-caps text-label-caps mt-0.5">Gastos</span>
        </button>

        <button
          onClick={() => setCurrentView('pendientes')}
          className={`flex flex-col items-center justify-center px-3 sm:px-6 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            currentView === 'pendientes'
              ? 'bg-secondary-container text-on-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-variant/50'
          }`}
        >
          <span className="material-symbols-outlined">pending_actions</span>
          <span className="font-label-caps text-label-caps mt-0.5">Pendientes</span>
        </button>

        <button
          onClick={() => setCurrentView('tarjeta')}
          className={`flex flex-col items-center justify-center px-3 sm:px-6 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            currentView === 'tarjeta'
              ? 'bg-secondary-container text-on-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-variant/50'
          }`}
        >
          <span className="material-symbols-outlined">credit_card</span>
          <span className="font-label-caps text-label-caps mt-0.5">Tarjeta</span>
        </button>

        <button
          onClick={() => setCurrentView('estadisticas')}
          className={`flex flex-col items-center justify-center px-3 sm:px-6 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            currentView === 'estadisticas'
              ? 'bg-secondary-container text-on-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-variant/50'
          }`}
        >
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="font-label-caps text-label-caps mt-0.5">Estadísticas</span>
        </button>
      </nav>
    </>
  );
};
