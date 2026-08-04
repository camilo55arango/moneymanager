export interface CategoryDefinition {
  name: string;
  icon: string;
  color?: string;
}

export const DEFAULT_CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { name: 'Arriendo', icon: 'home', color: '#4F46E5' },
  { name: 'Servicios', icon: 'electric_bolt', color: '#0EA5E9' },
  { name: 'Suscripciones', icon: 'subscriptions', color: '#8B5CF6' },
  { name: 'Transporte', icon: 'directions_bus', color: '#10B981' },
  { name: 'Compras', icon: 'shopping_bag', color: '#F59E0B' },
  { name: 'Comida', icon: 'restaurant', color: '#EF4444' },
  { name: 'Mercado', icon: 'local_grocery_store', color: '#10B981' },
  { name: 'Educación', icon: 'school', color: '#6366F1' },
  { name: 'Banco', icon: 'account_balance', color: '#3B82F6' },
  { name: 'Salario', icon: 'payments', color: '#10B981' },
  { name: 'I. Extra', icon: 'monetization_on', color: '#F59E0B' },
  { name: 'Deuda', icon: 'credit_score', color: '#EC4899' },
  { name: 'Inversiones', icon: 'monitoring', color: '#6366F1' },
  { name: 'Otros', icon: 'grid_view', color: '#6B7280' },
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
