import React, { useState } from 'react';

// El tema inicial lo aplica el script de index.html; aquí solo se lee y se cambia
export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('mm_theme', next ? 'dark' : 'light');
    } catch (e) { /* sin almacenamiento el tema dura solo esta sesión */ }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative w-14 h-8 rounded-full bg-surface-container border border-outline-variant/60 transition-colors cursor-pointer shrink-0"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm transition-transform duration-200 ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
      </span>
    </button>
  );
};
