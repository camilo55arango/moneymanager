import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const { currentView, setCurrentView, goBack, user, editingTransaction, setEditingTransaction } = useApp();

  const getTitle = () => {
    switch (currentView) {
      case 'setup':
        return 'Configuración Inicial';
      case 'dashboard':
        return 'Inicio';
      case 'pendientes':
        return 'Próximos Pagos';
      case 'tarjeta':
        return 'Tarjeta de Crédito';
      case 'estadisticas':
        return 'Análisis';
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

  // En el Inicio el header solo saluda: el contenido es el protagonista
  if (currentView === 'dashboard') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const firstName = user.name.split(' ')[0];
    const dateLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
      <header className="sticky top-0 z-40 w-full border-b border-line/60 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-4 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-fg">
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </p>
            <p className="text-xs capitalize text-fg-subtle">{dateLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setCurrentView('setup')}
              title="Ajustes"
              aria-label="Ajustes"
              className="flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
            >
              <Settings size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              title="Mi cuenta"
              aria-label="Mi cuenta"
              className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-line hover:ring-line-strong transition-shadow cursor-pointer"
            >
              <img
                className="h-full w-full object-cover"
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=MoneyManagerUser'}
                alt={user.name || 'Usuario'}
              />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Formularios, ajustes y cuenta (con sesión) muestran "atrás"; las pestañas, el avatar
  const showBack = isFormView || (isSetupView && user.isLoggedIn);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/60 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {showBack && (
            <button
              type="button"
              aria-label="Atrás"
              onClick={() => {
                setEditingTransaction(null);
                goBack(currentView === 'new-pending' ? 'pendientes' : 'dashboard');
              }}
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={1.75} />
            </button>
          )}
          <h1 className="truncate text-base font-semibold text-fg">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isSetupView && (
            <>
              <button
                type="button"
                onClick={() => setCurrentView('setup')}
                title="Ajustes"
                aria-label="Ajustes"
                className="flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
              >
                <Settings size={18} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                title="Mi cuenta"
                aria-label="Mi cuenta"
                className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-line hover:ring-line-strong transition-shadow cursor-pointer"
              >
                <img
                  className="h-full w-full object-cover"
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=MoneyManagerUser'}
                  alt={user.name || 'Usuario'}
                />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

