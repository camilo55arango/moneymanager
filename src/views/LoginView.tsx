import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Camilo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo',
];

export const LoginView: React.FC = () => {
  const { user, login, register, updateProfile, logout, setCurrentView } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Profile Edit State when logged in
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const activeAvatar = customAvatarUrl || selectedAvatar;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setMessage({ text: 'Por favor completa todos los campos.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await login(loginEmail, loginPassword);
    setIsLoading(false);

    if (res.success) {
      setMessage({ text: '¡Sesión iniciada con éxito!', type: 'success' });
      setTimeout(() => {
        setCurrentView('dashboard');
      }, 600);
    } else {
      setMessage({ text: res.error || 'Email o contraseña incorrectos.', type: 'error' });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setMessage({ text: 'Por favor completa los campos obligatorios.', type: 'error' });
      return;
    }

    if (regPassword.length < 6) {
      setMessage({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await register(regName, regEmail, regPassword, activeAvatar);
    setIsLoading(false);

    if (res.success) {
      if (res.confirmationSent) {
        setMessage({
          text: 'Te hemos enviado un correo de confirmación a tu dirección de email. Por favor revisa tu bandeja de entrada o spam para activar tu cuenta.',
          type: 'success',
        });
      } else {
        setMessage({ text: '¡Cuenta creada con éxito! Bienvenido a Money Manager.', type: 'success' });
        setTimeout(() => {
          setCurrentView('dashboard');
        }, 800);
      }
    } else {
      setMessage({ text: res.error || 'No se pudo registrar el usuario.', type: 'error' });
    }
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await updateProfile(editName, editAvatarUrl);
    setIsLoading(false);
    if (res.success) {
      setIsEditingProfile(false);
      setMessage({ text: 'Perfil actualizado correctamente.', type: 'success' });
    } else {
      setMessage({ text: res.error || 'Error al actualizar el perfil.', type: 'error' });
    }
  };

  const compressAvatarImage = (file: File, maxSize: number = 200): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressAvatarImage(file, 200);
        if (isEditingProfile) {
          setEditAvatarUrl(compressedBase64);
        } else {
          setCustomAvatarUrl(compressedBase64);
        }
      } catch (err) {
        console.error('Error al procesar la imagen:', err);
      }
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-container-padding-mobile md:px-container-padding-desktop py-stack-lg max-w-md mx-auto w-full pb-32">
      {/* Container Card */}
      <div className="w-full bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 shadow-lg text-center flex flex-col items-center">
        {/* App / Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shadow-xs border border-outline-variant/40 mb-4">
          <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
        </div>

        <h2 className="text-2xl font-bold text-on-surface mb-1">
          {user.isLoggedIn ? 'Mi Cuenta' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <p className="text-xs text-on-surface-variant max-w-xs mb-6">
          {user.isLoggedIn
            ? 'Gestiona tu perfil y credenciales de Money Manager.'
            : mode === 'login'
            ? 'Ingresa tus credenciales para acceder a tus finanzas.'
            : 'Regístrate con tu correo y elige tu foto de perfil.'}
        </p>

        {/* Message Banner */}
        {message && (
          <div
            className={`w-full p-3 mb-5 text-xs font-semibold rounded-xl text-left flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        {/* If User Is Already Logged In */}
        {user.isLoggedIn ? (
          <div className="w-full space-y-5">
            {!isEditingProfile ? (
              <div className="w-full bg-surface-container p-5 rounded-2xl border border-outline-variant/60 text-left flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <img
                    src={user.avatarUrl || PRESET_AVATARS[0]}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-surface rounded-full"></span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">{user.name}</h3>
                <p className="text-xs text-outline mb-3">{user.email}</p>
                <span className="inline-block text-[11px] bg-emerald-500/10 text-emerald-600 font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                  Sesión Activa
                </span>

                <button
                  onClick={() => {
                    setEditName(user.name);
                    setEditAvatarUrl(user.avatarUrl);
                    setIsEditingProfile(true);
                  }}
                  className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Editar Foto o Nombre
                </button>
              </div>
            ) : (
              /* Profile Edit Form */
              <form onSubmit={handleSaveProfileEdit} className="w-full bg-surface-container p-5 rounded-2xl border border-outline-variant/60 text-left space-y-4">
                <h4 className="font-bold text-sm text-on-surface mb-2">Editar Perfil</h4>
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">Foto de Perfil (URL o Imagen)</label>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={editAvatarUrl || PRESET_AVATARS[0]}
                      alt="Vista previa"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30 shrink-0"
                    />
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/mi-foto.jpg"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="w-full bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold cursor-pointer hover:underline">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    <span>Subir imagen desde equipo</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-2 text-xs font-bold text-outline hover:text-on-surface cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="w-full bg-primary text-on-primary py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>Ir al Panel de Finanzas</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  setMessage({ text: 'Has cerrado sesión.', type: 'success' });
                }}
                className="w-full bg-surface-container border border-outline-variant/60 text-rose-600 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Form (Login / Register Tabs) */
          <div className="w-full space-y-5">
            {/* Mode Switch Tabs */}
            <div className="flex bg-surface-container p-1 rounded-2xl border border-outline-variant/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Registrarse
              </button>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/60 focus-within:border-primary transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Contraseña
                  </label>
                  <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/60 focus-within:border-primary transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                      lock
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !loginEmail || !loginPassword}
                  className="w-full bg-primary text-on-primary py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span>Ingresando...</span>
                    </span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">login</span>
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/60 focus-within:border-primary transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Camilo Arango"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/60 focus-within:border-primary transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Contraseña
                  </label>
                  <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/60 focus-within:border-primary transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                      lock
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                {/* Foto de Perfil Selection */}
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-2">
                    Foto de Perfil (Elige o Personaliza)
                  </label>

                  {/* Selected Avatar Preview */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={activeAvatar}
                      alt="Avatar seleccionado"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/40 shadow-xs"
                    />
                    <div className="flex-grow">
                      <input
                        type="url"
                        placeholder="Pegar URL de foto personalizada..."
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="w-full bg-surface-container px-3 py-2 text-[11px] font-medium text-on-surface rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Preset Avatars */}
                  <div className="flex items-center justify-between gap-2 bg-surface-container p-2 rounded-2xl border border-outline-variant/40">
                    {PRESET_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(avatar);
                          setCustomAvatarUrl('');
                        }}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          !customAvatarUrl && selectedAvatar === avatar
                            ? 'border-primary scale-110 ring-2 ring-primary/30'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 text-right">
                    <label className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold cursor-pointer hover:underline">
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>Subir archivo de imagen</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !regName || !regEmail || !regPassword}
                  className="w-full bg-primary text-on-primary py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span>Creando cuenta...</span>
                    </span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">person_add</span>
                      <span>Crear Cuenta e Iniciar</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-8 pt-4 border-t border-outline-variant/40 w-full flex items-center justify-center gap-2 text-outline text-[11px]">
          <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
          <span>Autenticación y almacenamiento seguro en Supabase</span>
        </div>
      </div>
    </main>
  );
};
