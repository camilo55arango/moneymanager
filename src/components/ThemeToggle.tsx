import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// El tema inicial lo aplica el script de index.html; aquí solo se lee y se cambia
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
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
      aria-label="Modo oscuro"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
        className ?? 'text-fg-muted hover:bg-surface-2 hover:text-fg'
      }`}
    >
      {isDark ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
    </button>
  );
};
