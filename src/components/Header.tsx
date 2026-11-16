import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { avatarSrc } from '../utils/avatar';

// Franja de marca: fondo morado con texto e íconos en blanco
const headerClass = 'sticky top-0 z-40 w-full bg-brand text-on-brand';
const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-full text-on-brand/80 hover:bg-white/15 hover:text-on-brand transition-colors cursor-pointer';
const avatarClass =
  'h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/30 hover:ring-white/60 transition-shadow cursor-pointer';

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
      <header className={headerClass}>
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-4 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </p>
            <p className="text-xs capitalize text-on-brand/70">{dateLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="text-on-brand/80 hover:bg-white/15 hover:text-on-brand" />
            <button
              type="button"
              onClick={() => setCurrentView('setup')}
              title="Ajustes"
              aria-label="Ajustes"
              className={iconButtonClass}
            >
              <Settings size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              title="Mi cuenta"
              aria-label="Mi cuenta"
              className={avatarClass}
            >
              <img
                className="h-full w-full object-cover"
                src={avatarSrc(user.avatarUrl)}
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
    <header className={headerClass}>
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
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={1.75} />
            </button>
          )}
          <h1 className="truncate text-base font-semibold">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="text-on-brand/80 hover:bg-white/15 hover:text-on-brand" />
          {!isSetupView && (
            <>
              <button
                type="button"
                onClick={() => setCurrentView('setup')}
                title="Ajustes"
                aria-label="Ajustes"
                className={iconButtonClass}
              >
                <Settings size={18} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                title="Mi cuenta"
                aria-label="Mi cuenta"
                className={avatarClass}
              >
                <img
                  className="h-full w-full object-cover"
                  src={avatarSrc(user.avatarUrl)}
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

