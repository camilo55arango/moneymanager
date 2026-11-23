import React from 'react';
import { ArrowLeft, CalendarClock, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { avatarSrc } from '../utils/avatar';
import { countOverdue, todayString } from '../utils/dates';
import { formatCurrency } from '../utils/formatCurrency';

// Franja de marca: degradado morado con texto e íconos en blanco
const brandClass = 'w-full bg-gradient-to-r from-brand to-brand-2 text-on-brand';
const headerClass = `sticky top-0 z-40 ${brandClass}`;
const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-full text-on-brand/80 hover:bg-white/15 hover:text-on-brand transition-colors cursor-pointer';
const avatarClass =
  'h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/30 hover:ring-white/60 transition-shadow cursor-pointer';

export const Header: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    goBack,
    user,
    editingTransaction,
    setEditingTransaction,
    walletBalance,
    investmentBalance,
    pendingItems,
  } = useApp();

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

  // En el Inicio el header es un banner: saludo, disponible y aviso de vencidos en rosa
  if (currentView === 'dashboard') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const firstName = user.name.split(' ')[0];
    const dateLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const available = walletBalance + investmentBalance;
    const overdueCount = countOverdue(pendingItems, todayString());

    return (
      <header className={`${brandClass} rounded-b-[24px] pb-12`}>
        <div className="mx-auto flex h-16 w-full max-w-[1100px] xl:max-w-[1320px] items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/icon-192.png" alt="Money Manager" className="h-10 w-10 shrink-0 rounded-xl shadow-sm" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                {greeting}
                {firstName ? `, ${firstName}` : ''}
              </p>
              <p className="truncate text-xs capitalize text-on-brand/70">{dateLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => setCurrentView('pendientes')}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-negative px-2.5 py-1 text-xs font-medium text-on-negative shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                <CalendarClock size={14} strokeWidth={2} />
                {overdueCount} {overdueCount === 1 ? 'vencido' : 'vencidos'}
              </button>
            )}
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

        <div className="mx-auto w-full max-w-[1100px] xl:max-w-[1320px] px-4 pt-2 md:px-8">
          <p className="text-xs text-on-brand/70">Disponible</p>
          <p
            className={`mt-1 font-mono text-3xl font-semibold tracking-tight md:text-4xl ${
              available < 0 ? 'text-on-brand-negative' : ''
            }`}
          >
            {available < 0 ? '−' : ''}
            {formatCurrency(Math.abs(available))}
          </p>
          <p className="mt-1 text-xs text-on-brand/70">Billetera + inversiones</p>
        </div>
      </header>
    );
  }

  // Formularios, ajustes y cuenta (con sesión) muestran "atrás"; las pestañas, el avatar
  const showBack = isFormView || (isSetupView && user.isLoggedIn);

  return (
    <header className={headerClass}>
      <div className="mx-auto flex h-14 w-full max-w-[1100px] xl:max-w-[1320px] items-center justify-between gap-3 px-4 md:px-8">
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

