import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { user, loginWithGoogle, logout, setCurrentView } = useApp();

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showAccountChooser, setShowAccountChooser] = useState(false);

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAPxb7Tgyu8QlU52A6RD2_N0kl3Owe2U_pkPz8Ekp7-cp1QDiNFs8X4G_ZyumerwS1fDytzJxKat9F2GRPZ6Qmmw2PEWnrHmJsHJy5ExJZxzbZIInUiUBxGBp4dJ2XyL3UacF-J04GgbU7mZ3jKD3U9DIdQS0LVE1XBbacwdcQqlYM_P0t1-7jzulQG_-ORGRvHXR5chWIHcqym2-BQL2my1qzthgqvlmaD5diPMwJUbUQUN76dQAe';

  const handleQuickGoogleLogin = (email: string, name: string) => {
    setIsSigningIn(true);
    setTimeout(() => {
      loginWithGoogle(email, name, defaultAvatar);
      setIsSigningIn(false);
      setCurrentView('dashboard');
    }, 800);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsSigningIn(true);
    setTimeout(() => {
      loginWithGoogle(
        customEmail,
        customName || customEmail.split('@')[0],
        defaultAvatar
      );
      setIsSigningIn(false);
      setCurrentView('dashboard');
    }, 800);
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-container-padding-mobile md:px-container-padding-desktop py-stack-lg max-w-md mx-auto w-full pb-32">
      {/* Container Card */}
      <div className="w-full bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 shadow-lg text-center flex flex-col items-center">
        {/* Google G Logo */}
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center shadow-xs border border-outline-variant/40 mb-5">
          <svg className="w-9 h-9" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.04.0 12s.46 3.8 1.27 5.42l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-on-surface mb-2">
          Iniciar Sesión con Google
        </h2>
        <p className="text-xs text-on-surface-variant max-w-xs mb-6">
          Sincroniza y respalda tus datos financieros en la nube de forma segura con tu cuenta de Google.
        </p>

        {/* Current Active Account Card if Logged In */}
        {user.isLoggedIn && !showAccountChooser ? (
          <div className="w-full bg-surface-container p-4 rounded-2xl border border-outline-variant/60 mb-6 text-left flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-on-surface truncate">{user.name}</h3>
                  <span className="material-symbols-outlined text-emerald-500 text-base">verified</span>
                </div>
                <p className="text-xs text-outline truncate">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">
                  Sesión Activa
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Cerrar sesión"
              className="text-xs font-bold text-rose-600 hover:underline shrink-0 cursor-pointer"
            >
              Salir
            </button>
          </div>
        ) : null}

        {/* Action Buttons */}
        {user.isLoggedIn && !showAccountChooser ? (
          <div className="w-full space-y-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full bg-primary text-on-primary py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Continuar a la App</span>
            </button>

            <button
              onClick={() => setShowAccountChooser(true)}
              className="w-full bg-surface-container border border-outline-variant/60 text-on-surface py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">switch_account</span>
              <span>Usar otra cuenta de Google</span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Quick account suggestion */}
            <div className="text-left">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-2">
                Selecciona una cuenta de Google
              </span>
              <button
                onClick={() => handleQuickGoogleLogin('micro.camilo55@gmail.com', 'Camilo M.')}
                disabled={isSigningIn}
                className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    C
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-xs text-on-surface truncate">Camilo M.</p>
                    <p className="text-[11px] text-outline truncate">micro.camilo55@gmail.com</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform text-lg">
                  chevron_right
                </span>
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-outline-variant/40" />
              <span className="flex-shrink mx-3 text-outline text-[11px] font-medium">o ingresa otro correo</span>
              <div className="flex-grow border-t border-outline-variant/40" />
            </div>

            {/* Custom Google Email Input Form */}
            <form onSubmit={handleCustomLogin} className="space-y-3 text-left">
              <div>
                <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                  Correo electrónico de Google
                </label>
                <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/60 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="usuario@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn || !customEmail}
                className="w-full bg-primary text-on-primary py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>Conectando con Google...</span>
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </>
                )}
              </button>
            </form>

            {user.isLoggedIn && (
              <button
                onClick={() => setShowAccountChooser(false)}
                className="text-xs text-outline hover:underline font-bold pt-2 cursor-pointer"
              >
                Cancelar y mantener cuenta actual
              </button>
            )}
          </div>
        )}

        {/* Security / OAuth footer */}
        <div className="mt-8 pt-4 border-t border-outline-variant/40 w-full flex items-center justify-center gap-2 text-outline text-[11px]">
          <span className="material-symbols-outlined text-sm text-emerald-500">lock</span>
          <span>Autenticación oficial con OAuth 2.0 de Google</span>
        </div>
      </div>
    </main>
  );
};
