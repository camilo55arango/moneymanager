import React, { useState } from 'react';
import { CashflowProjection } from '../../utils/cashflow';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/dates';

const WIDTH = 320;
const HEIGHT = 56;
const PAD_Y = 6;

// Línea del saldo proyectado de la billetera, con el punto más bajo marcado y una
// referencia en $0 solo si la proyección llega a ser negativa
export const CashflowSparkline: React.FC<{ projection: CashflowProjection }> = ({ projection }) => {
  const { points, lowest } = projection;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = points.map((p) => p.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * WIDTH;
  const y = (v: number) => PAD_Y + (1 - (v - min) / range) * (HEIGHT - PAD_Y * 2);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ');
  const lowestIndex = points.indexOf(lowest);
  const goesNegative = lowest.balance < 0;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHoverIndex(Math.round(ratio * (points.length - 1)));
  };

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-fg-subtle">
          {hovered ? formatShortDate(hovered.date) : `Próximos ${points.length - 1} días`}
        </span>
        <span className="font-mono text-fg-muted">
          {hovered ? (
            formatCurrency(Math.round(hovered.balance))
          ) : (
            <>
              Punto más bajo{' '}
              <span className={goesNegative ? 'text-negative' : 'text-fg'}>
                {formatCurrency(Math.round(lowest.balance))}
              </span>{' '}
              el {formatShortDate(lowest.date)}
            </>
          )}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-14 w-full touch-none overflow-visible"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={`Saldo proyectado de la billetera. Punto más bajo ${formatCurrency(
          Math.round(lowest.balance)
        )} el ${formatShortDate(lowest.date)}`}
      >
        {goesNegative && (
          <line
            x1={0}
            x2={WIDTH}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--color-negative)"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hovered && (
          <line
            x1={x(hoverIndex!)}
            x2={x(hoverIndex!)}
            y1={0}
            y2={HEIGHT}
            stroke="var(--color-line-strong)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Marcadores en HTML para que sigan siendo círculos aunque el SVG se estire */}
      <div className="relative -mt-14 h-14 pointer-events-none" aria-hidden>
        {[lowestIndex, ...(hoverIndex !== null && hoverIndex !== lowestIndex ? [hoverIndex] : [])].map((i) => (
          <span
            key={i}
            className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface-1 ${
              i === lowestIndex && goesNegative ? 'bg-negative' : 'bg-accent'
            }`}
            style={{ left: `${(x(i) / WIDTH) * 100}%`, top: `${(y(points[i].balance) / HEIGHT) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};
