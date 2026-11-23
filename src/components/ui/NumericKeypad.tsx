import React from 'react';
import { Delete } from 'lucide-react';
import { formatCurrency, formatInputNumber } from '../../utils/formatCurrency';

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BOTTOM_KEYS = ['000', '0', ',', 'back'];
const MAX_DIGITS = 12;

// Agrega una tecla al monto escrito ('back' borra el último carácter, ',' abre los centavos)
export const applyKey = (typed: string, key: string): string => {
  if (key === 'back') return typed.slice(0, -1);
  if (key === ',') return typed.includes(',') ? typed : (typed || '0') + ',';

  const commaAt = typed.indexOf(',');
  if (commaAt !== -1) return typed + key.slice(0, Math.max(0, 2 - (typed.length - commaAt - 1)));
  return (typed + key).replace(/^0+/, '').slice(0, MAX_DIGITS);
};

// Valor numérico del monto escrito con el teclado
export const typedAmount = (typed: string): number => Number(typed.replace(',', '.')) || 0;

// Monto escrito con formato de moneda; mientras se escriben centavos muestra la coma tal cual
export const formatTyped = (typed: string): string =>
  typed.includes(',') ? `$ ${formatInputNumber(typed)}` : formatCurrency(typedAmount(typed));

const keyClass =
  'flex h-12 items-center justify-center rounded-xl font-mono text-xl text-fg hover:bg-surface-2 active:bg-surface-2 active:scale-[0.97] transition-transform cursor-pointer select-none';

// Teclado numérico en pantalla para escribir montos: tres filas de dígitos y una de 000, 0, coma y borrar
export const NumericKeypad: React.FC<{ onKey: (key: string) => void }> = ({ onKey }) => (
  <div className="grid grid-cols-12 gap-1.5">
    {DIGIT_KEYS.map((key) => (
      <button key={key} type="button" onClick={() => onKey(key)} aria-label={key} className={`col-span-4 ${keyClass}`}>
        {key}
      </button>
    ))}
    {BOTTOM_KEYS.map((key) => (
      <button
        key={key}
        type="button"
        onClick={() => onKey(key)}
        aria-label={key === 'back' ? 'Borrar' : key === ',' ? 'Coma decimal' : key}
        className={`col-span-3 ${keyClass}`}
      >
        {key === 'back' ? <Delete size={20} strokeWidth={1.75} /> : key}
      </button>
    ))}
  </div>
);
