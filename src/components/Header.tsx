import React from 'react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { currentView, setCurrentView, user, editingTransaction, setEditingTransaction } = useApp();

  const getTitle = () => {
    switch (currentView) {
      case 'setup':
        return 'Configuración Inicial';
      case 'dashboard':
        return 'Resumen';
      case 'pendientes':
        return 'Próximos Pagos';
      case 'estadisticas':
        return 'Estadísticas';
      case 'new-transaction':
        return editingTransaction ? 'Editar Registro' : 'Agregar Gasto / Ingreso';
      case 'new-pending':
        return 'Nuevo Pendiente';
      case 'login':
        return 'Mi Cuenta / Sesión';
      default:
        return 'Money Manager';
    }
  };

  const isFormView = currentView === 'new-transaction' || currentView === 'new-pending';
  const isSetupView = currentView === 'setup' || currentView === 'login';

  return (
    <header className="bg-surface border-b border-outline-variant w-full top-0 sticky z-40 shadow-sm">
      <div className="flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop h-16 w-full max-w-[1280px] mx-auto">
        <div className="flex items-center gap-3">
          {isFormView ? (
            <button
              aria-label="Atrás"
              onClick={() => {
                setEditingTransaction(null);
                setCurrentView(currentView === 'new-transaction' ? 'dashboard' : 'pendientes');
              }}
              className="hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              title="Mi Perfil / Iniciar Sesión"
              className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden hover:opacity-90 active:scale-95 transition-all cursor-pointer ring-2 ring-primary/30 relative"
            >
              <img
                className="w-full h-full object-cover"
                src={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=MoneyManagerUser"}
                alt={user.name || "Usuario"}
              />
            </button>
          )}

          <h1 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
            <span>{getTitle()}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {currentView !== 'login' && (
            <button
              onClick={() => setCurrentView('login')}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container border border-outline-variant/60 hover:bg-surface-container-high transition-all text-on-surface flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Mi Cuenta / Iniciar Sesión"
            >
              <span className="material-symbols-outlined text-base text-primary">account_circle</span>
              <span>{user.isLoggedIn ? user.name.split(' ')[0] : 'Iniciar Sesión'}</span>
            </button>
          )}

          {!isSetupView && (
            <button
              onClick={() => setCurrentView('setup')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

