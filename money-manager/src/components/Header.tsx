import React from 'react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { currentView, setCurrentView, user } = useApp();

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
        return 'Agregar Gasto / Ingreso';
      case 'new-pending':
        return 'Nuevo Pendiente';
      case 'login':
        return 'Iniciar Sesión con Google';
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
              onClick={() => setCurrentView(currentView === 'new-transaction' ? 'dashboard' : 'pendientes')}
              className="hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-100 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              title="Perfil de Google / Iniciar Sesión"
              className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden hover:opacity-90 active:scale-95 transition-all cursor-pointer ring-2 ring-primary/30 relative"
            >
              <img
                className="w-full h-full object-cover"
                src={user.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAPxb7Tgyu8QlU52A6RD2_N0kl3Owe2U_pkPz8Ekp7-cp1QDiNFs8X4G_ZyumerwS1fDytzJxKat9F2GRPZ6Qmmw2PEWnrHmJsHJy5ExJZxzbZIInUiUBxGBp4dJ2XyL3UacF-J04GgbU7mZ3jKD3U9DIdQS0LVE1XBbacwdcQqlYM_P0t1-7jzulQG_-ORGRvHXR5chWIHcqym2-BQL2my1qzthgqvlmaD5diPMwJUbUQUN76dQAe"}
                alt={user.name || "Usuario"}
              />
            </button>
          )}

          <h1 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {currentView !== 'login' && (
            <button
              onClick={() => setCurrentView('login')}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container border border-outline-variant/60 hover:bg-surface-container-high transition-all text-on-surface flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Ver Login con Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.04.0 12s.46 3.8 1.27 5.42l4.01-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Login Google</span>
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

