import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PendingItem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

export const PendientesView: React.FC = () => {
  const {
    pendingItems,
    markPendingAsPaid,
    deletePendingItem,
    setEditingPendingItem,
    setCurrentView,
  } = useApp();

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [payModalItem, setPayModalItem] = useState<PendingItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'SIN_FECHA': true,
    '0000-00_MESES_ANTERIORES': true,
  });

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Reference date: today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateDaysRemaining = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const due = new Date(dateStr + 'T00:00:00');
    const diffTime = due.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDaysText = (days: number | null, dateStr: string | null): { text: string; subtext: string } => {
    if (days === null) {
      return { text: 'TBD', subtext: 'Pendiente de presupuesto' };
    }
    if (days < 0) {
      return {
        text: `${days} DÍAS`,
        subtext: `Vencido hace ${Math.abs(days)} días`,
      };
    }
    if (days === 0) {
      return { text: '0 DÍAS', subtext: 'Vence hoy' };
    }
    const formattedDate = dateStr
      ? new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      : '';
    return {
      text: `${days} DÍAS`,
      subtext: `Vence en ${days} días (${formattedDate})`,
    };
  };

  const getBadgeStyle = (days: number | null) => {
    if (days === null) {
      return 'bg-surface-container text-on-surface-variant';
    }
    if (days > 5) {
      return 'bg-secondary-container text-on-secondary-container font-bold';
    }
    if (days >= 0 && days <= 5) {
      return 'bg-tertiary-fixed-dim text-on-tertiary-fixed font-bold';
    }
    // days < 0 (Vencido)
    return 'bg-error-container text-on-error-container font-bold';
  };

  const getRecurrenceText = (recurrence?: string) => {
    switch (recurrence) {
      case '1w':
      case 'semanal':
        return 'Semanal';
      case '1m':
      case 'mensual':
        return 'Mensual';
      case '2m':
      case 'bimensual':
        return 'Bimensual';
      case '3m':
      case 'trimestral':
        return 'Trimestral';
      case '6m':
      case 'semestral':
        return 'Semestral';
      case '12m':
      case 'anual':
        return 'Anual';
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'arriendo':
      case 'hogar':
      case 'vivienda':
        return 'home';
      case 'servicios':
        return 'electric_bolt';
      case 'suscripciones':
        return 'subscriptions';
      case 'transporte':
      case 'auto':
        return 'directions_bus';
      case 'compras':
        return 'shopping_bag';
      case 'comida':
      case 'alimentación':
        return 'restaurant';
      case 'mercado':
        return 'local_grocery_store';
      case 'educación':
        return 'school';
      case 'banco':
        return 'account_balance';
      case 'salario':
      case 'ingresos':
        return 'payments';
      case 'i. extra':
      case 'ingreso extra':
        return 'monetization_on';
      case 'deuda':
        return 'credit_score';
      case 'inversiones':
        return 'monitoring';
      default:
        return 'label';
    }
  };

  // Group pending items by month
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  interface GroupedPending {
    groupKey: string;
    groupTitle: string;
    items: PendingItem[];
    totalIncome: number;
    totalExpense: number;
  }

  const groupMap: Record<string, GroupedPending> = {};

  pendingItems.forEach((item) => {
    let groupKey = 'SIN_FECHA';
    let groupTitle = 'SIN FECHA';

    if (item.dueDate) {
      const itemDate = new Date(item.dueDate + 'T00:00:00');
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth();

      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      if (itemYear < currentYear || (itemYear === currentYear && itemMonth < currentMonth)) {
        groupKey = '0000-00_MESES_ANTERIORES';
        groupTitle = 'MESES ANTERIORES';
      } else {
        const mm = String(itemMonth + 1).padStart(2, '0');
        groupKey = `${itemYear}-${mm}`;
        if (itemYear === currentYear && itemMonth === currentMonth) {
          groupTitle = `${monthNames[itemMonth].toUpperCase()} ${itemYear} (ACTUAL)`;
        } else {
          groupTitle = `${monthNames[itemMonth].toUpperCase()} ${itemYear}`;
        }
      }
    }

    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        groupKey,
        groupTitle,
        items: [],
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    groupMap[groupKey].items.push(item);
    if (item.type === 'income') {
      groupMap[groupKey].totalIncome += item.amount;
    } else {
      groupMap[groupKey].totalExpense += item.amount;
    }
  });

  // Sort items within each group chronologically by payment due date (dueDate)
  Object.values(groupMap).forEach((group) => {
    group.items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  });

  // Sort groups: SIN FECHA -> MESES ANTERIORES -> CHRONOLOGICAL MONTHS
  const groupsList = Object.values(groupMap).sort((a, b) => {
    if (a.groupKey === 'SIN_FECHA') return -1;
    if (b.groupKey === 'SIN_FECHA') return 1;
    if (a.groupKey === '0000-00_MESES_ANTERIORES') return -1;
    if (b.groupKey === '0000-00_MESES_ANTERIORES') return 1;
    return a.groupKey.localeCompare(b.groupKey);
  });

  const handleRowClick = (id: string) => {
    setActiveItemId((prev) => (prev === id ? null : id));
  };

  const handleEdit = (item: PendingItem) => {
    setEditingPendingItem(item);
    setCurrentView('new-pending');
  };

  const handlePayClick = (item: PendingItem) => {
    if ((item.recurrence && item.recurrence !== 'none') || item.amount === 0) {
      setPayModalItem(item);
      setPayAmountInput(item.amount ? item.amount.toString() : '');
      setActiveItemId(null);
    } else {
      markPendingAsPaid(item.id);
      setActiveItemId(null);
    }
  };

  const handleDelete = (id: string) => {
    deletePendingItem(id);
    setActiveItemId(null);
  };

  return (
    <main className="max-w-2xl mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg pb-32">
      {/* Action Header */}
      <div className="flex justify-between items-center mb-stack-lg">
        <div>
          <h2 className="font-label-caps text-label-caps text-on-surface-variant font-bold tracking-wider">
            PLANIFICACIÓN
          </h2>
          <p className="font-body-md text-body-md text-outline">Gestión de facturas y deudas</p>
        </div>
      </div>

      {pendingItems.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant rounded-xl text-outline">
          No hay pendientes programados. Haz clic en "Nuevo Pendiente" para agregar uno.
        </div>
      ) : (
        groupsList.map((group) => {
          const isCollapsed = !!collapsedGroups[group.groupKey];

          return (
            <section key={group.groupKey} className="mb-stack-lg">
              {/* Section Header */}
              <h3
                onClick={() => toggleGroupCollapse(group.groupKey)}
                className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm flex items-center gap-2 font-bold uppercase tracking-wider cursor-pointer select-none hover:text-primary transition-colors group/header"
              >
                <span
                  className="material-symbols-outlined text-base transition-transform duration-200 text-outline group-hover/header:text-primary"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
                <span>{group.groupTitle}</span>
                <span className="text-[11px] font-normal text-outline">({group.items.length})</span>
                <span className="h-px flex-1 bg-outline-variant/40" />
                <div className="ml-auto flex flex-col items-end text-[10px] leading-tight font-numeric-data text-on-surface">
                  <span>INGRESO: {formatCurrency(group.totalIncome)}</span>
                  <span>GASTO: {formatCurrency(group.totalExpense)}</span>
                </div>
              </h3>

              {/* List of items in group */}
              {!isCollapsed && (
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const days = calculateDaysRemaining(item.dueDate);
                    const { text: daysText, subtext } = formatDaysText(days, item.dueDate);
                    const badgeStyle = getBadgeStyle(days);
                    const isActive = activeItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleRowClick(item.id)}
                        className={`item-row relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 transition-all cursor-pointer ${
                          isActive ? 'is-active ring-2 ring-primary/20' : 'hover:border-primary/40'
                        }`}
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-fixed text-on-primary-fixed">
                              <span className="material-symbols-outlined">
                                {getCategoryIcon(item.category)}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-numeric-data text-numeric-data text-on-surface font-semibold">
                                {item.name}
                              </h4>
                              <p className="font-body-md text-body-md text-outline text-xs flex items-center gap-1.5 flex-wrap">
                                <span>{item.category}</span>
                                {item.recurrence && item.recurrence !== 'none' && (
                                  <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                    <span className="material-symbols-outlined text-[12px] mr-0.5">repeat</span>
                                    {getRecurrenceText(item.recurrence)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`block font-numeric-data text-numeric-data font-bold ${
                                item.amount === 0
                                  ? 'text-outline-variant'
                                  : item.type === 'expense'
                                  ? 'text-error'
                                  : 'text-secondary'
                              }`}
                            >
                              {item.amount === 0 ? 'TBD' : `${item.type === 'expense' ? '-' : '+'}${formatCurrency(item.amount)}`}
                            </span>

                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] rounded uppercase mt-0.5 ${badgeStyle}`}
                            >
                              {daysText}
                            </span>
                          </div>
                        </div>

                        {/* Actions Overlay */}
                        <div
                          className={`item-action-overlay absolute inset-0 bg-surface-container-highest/95 flex items-center justify-center gap-6 z-20 ${
                            isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                            title="Editar Pendiente"
                          >
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-on-primary transition-colors shadow-xs">
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </div>
                            <span className="text-[10px] font-bold">EDITAR</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayClick(item);
                            }}
                            className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                            title="Marcar como Pagado"
                          >
                            <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg transform group-hover/btn:scale-110 transition-transform">
                              <span className="material-symbols-outlined">check</span>
                            </div>
                            <span className="text-[10px] font-bold text-secondary">PAGADO</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="flex flex-col items-center gap-1 group/btn cursor-pointer"
                            title="Eliminar Pendiente"
                          >
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center group-hover/btn:bg-error group-hover/btn:text-on-error transition-colors shadow-xs">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </div>
                            <span className="text-[10px] font-bold text-error">BORRAR</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}
      {/* Pay Modal for Recurring Items */}
      {payModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">
                  {getCategoryIcon(payModalItem.category)}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Confirmar Pago</h3>
                <p className="text-xs text-outline font-medium">
                  {payModalItem.name} • {payModalItem.category}
                </p>
              </div>
            </div>

            {/* Recurrence Notice */}
            {payModalItem.recurrence && payModalItem.recurrence !== 'none' && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-start gap-2">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">repeat</span>
                <div>
                  <p className="font-semibold">
                    Este pendiente tiene repetición ({getRecurrenceText(payModalItem.recurrence)}).
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Puedes mantener el valor registrado o modificarlo antes de marcar como pagado.
                  </p>
                </div>
              </div>
            )}

            {/* Input field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Monto a registrar en el pago
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-outline font-bold font-numeric-data">$</span>
                <input
                  type="number"
                  step="any"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl font-numeric-data text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-lg"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Quick action: Keep current value */}
            <button
              type="button"
              onClick={() => {
                setPayAmountInput(payModalItem.amount.toString());
              }}
              className="w-full py-2 px-3 bg-surface-container-high border border-outline-variant/50 hover:bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Dejar valor registrado</span>
              <span className="font-numeric-data text-primary font-bold">
                {formatCurrency(payModalItem.amount)}
              </span>
            </button>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalItem(null)}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  const finalAmount = parseFloat(payAmountInput);
                  markPendingAsPaid(
                    payModalItem.id,
                    isNaN(finalAmount) ? payModalItem.amount : finalAmount
                  );
                  setPayModalItem(null);
                }}
                className="px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Confirmar Pago</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
