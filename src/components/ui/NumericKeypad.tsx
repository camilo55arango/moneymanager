import React from 'react';
import { Delete } from 'lucide-react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'];
const MAX_DIGITS = 12;

// Agrega una tecla a los dígitos del monto ('back' borra el último)
export const applyKey = (digits: string, key: string): string =>
  key === 'back' ? digits.slice(0, -1) : (digits + key).replace(/^0+/, '').slice(0, MAX_DIGITS);

// Teclado numérico en pantalla para escribir montos
export const NumericKeypad: React.FC<{ onKey: (key: string) => void }> = ({ onKey }) => (
  <div className="grid grid-cols-3 gap-1.5">
    {KEYS.map((key) => (
      <button
        key={key}
        type="button"
        onClick={() => onKey(key)}
        aria-label={key === 'back' ? 'Borrar' : key}
        className="flex h-12 items-center justify-center rounded-xl font-mono text-xl text-fg hover:bg-surface-2 active:bg-surface-2 active:scale-[0.97] transition-transform cursor-pointer select-none"
      >
        {key === 'back' ? <Delete size={20} strokeWidth={1.75} /> : key}
      </button>
    ))}
  </div>
);
