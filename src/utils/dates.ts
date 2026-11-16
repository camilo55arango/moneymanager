// Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y puede cambiar de día)
export const toDateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayString = () => toDateString(new Date());

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

// Días de `from` a `to` (negativo si `to` ya pasó)
export const daysBetween = (from: string, to: string): number =>
  Math.round(
    (new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
  );

export const formatShortDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

// "Hoy", "Ayer" o "14 nov" (con año si no es el actual)
export const formatRelativeDay = (dateStr: string, today: string = todayString()): string => {
  const diff = daysBetween(dateStr, today);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    weekday: diff > 1 && diff < 7 ? 'long' : undefined,
    day: 'numeric',
    month: 'short',
    year: dateStr.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric',
  });
};

// Agrupa elementos ya ordenados por fecha, conservando el orden
export const groupByDay = <T>(items: T[], getDate: (item: T) => string): { date: string; items: T[] }[] => {
  const groups: { date: string; items: T[] }[] = [];
  for (const item of items) {
    const date = getDate(item);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  }
  return groups;
};
