import {
  Banknote,
  Bus,
  Coins,
  GraduationCap,
  HandCoins,
  House,
  Landmark,
  LayoutGrid,
  LucideIcon,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';

export interface CategoryDefinition {
  name: string;
  icon: string;
}

export const DEFAULT_CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { name: 'Arriendo', icon: 'home' },
  { name: 'Servicios', icon: 'electric_bolt' },
  { name: 'Suscripciones', icon: 'subscriptions' },
  { name: 'Transporte', icon: 'directions_bus' },
  { name: 'Compras', icon: 'shopping_bag' },
  { name: 'Comida', icon: 'restaurant' },
  { name: 'Mercado', icon: 'local_grocery_store' },
  { name: 'Educación', icon: 'school' },
  { name: 'Banco', icon: 'account_balance' },
  { name: 'Salario', icon: 'payments' },
  { name: 'I. Extra', icon: 'monetization_on' },
  { name: 'Deuda', icon: 'credit_score' },
  { name: 'Inversiones', icon: 'monitoring' },
  { name: 'Otros', icon: 'grid_view' },
];

export const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORY_DEFINITIONS.map((c) => c.name);

export const getCategoryIcon = (categoryName: string): string => {
  if (!categoryName) return 'grid_view';
  const lower = categoryName.trim().toLowerCase();

  const found = DEFAULT_CATEGORY_DEFINITIONS.find(
    (c) => c.name.toLowerCase() === lower
  );
  if (found) return found.icon;

  if (lower.includes('arriendo') || lower.includes('hogar') || lower.includes('vivienda')) return 'home';
  if (lower.includes('servicio') || lower.includes('luz') || lower.includes('agua') || lower.includes('gas')) return 'electric_bolt';
  if (lower.includes('suscripci') || lower.includes('netflix') || lower.includes('spotify')) return 'subscriptions';
  if (lower.includes('transporte') || lower.includes('auto') || lower.includes('gasolina') || lower.includes('taxi')) return 'directions_bus';
  if (lower.includes('compra') || lower.includes('tienda') || lower.includes('ropa')) return 'shopping_bag';
  if (lower.includes('comida') || lower.includes('restaurante') || lower.includes('alimento')) return 'restaurant';
  if (lower.includes('mercado') || lower.includes('supermercado')) return 'local_grocery_store';
  if (lower.includes('educaci') || lower.includes('estudio') || lower.includes('curso')) return 'school';
  if (lower.includes('banco') || lower.includes('tarjeta') || lower.includes('credito')) return 'account_balance';
  if (lower.includes('salario') || lower.includes('sueldo') || lower.includes('nomina')) return 'payments';
  if (lower.includes('extra') || lower.includes('ingreso')) return 'monetization_on';
  if (lower.includes('deuda') || lower.includes('prestamo')) return 'credit_score';
  if (lower.includes('inversi')) return 'monitoring';

  return 'label';
};

// Equivalente en lucide de cada ícono de Material Symbols usado por las categorías
const LUCIDE_BY_SYMBOL: Record<string, LucideIcon> = {
  home: House,
  electric_bolt: Zap,
  subscriptions: Repeat,
  directions_bus: Bus,
  shopping_bag: ShoppingBag,
  restaurant: UtensilsCrossed,
  local_grocery_store: ShoppingCart,
  school: GraduationCap,
  account_balance: Landmark,
  payments: Banknote,
  monetization_on: Coins,
  credit_score: HandCoins,
  monitoring: TrendingUp,
  grid_view: LayoutGrid,
};

export interface CategoryMeta {
  Icon: LucideIcon;
  color: string; // color del ícono
  tint: string; // fondo suave detrás del ícono
}

// Todas las categorías usan el morado de la paleta (variables CSS, así siguen el modo oscuro);
// se distinguen por su ícono
const CATEGORY_COLOR = 'var(--color-accent)';
const CATEGORY_TINT = 'var(--color-accent-soft)';

// Los movimientos del sistema (transferencias) van en gris para no competir con las categorías
export const NEUTRAL_META_COLORS = { color: 'var(--color-fg-subtle)', tint: 'var(--color-surface-2)' };

// Ícono (lucide) y colores de una categoría. Las categorías personalizadas toman el ícono de la
// categoría por defecto a la que se parecen (ver getCategoryIcon).
export const getCategoryMeta = (categoryName: string): CategoryMeta => ({
  Icon: LUCIDE_BY_SYMBOL[getCategoryIcon(categoryName)] ?? Tag,
  color: CATEGORY_COLOR,
  tint: CATEGORY_TINT,
});
