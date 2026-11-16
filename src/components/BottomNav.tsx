import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeftRight, CalendarClock, ChartColumn, CreditCard, House, LucideIcon, Plus, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewMode } from '../types';
import { QuickAddSheet } from './QuickAddSheet';

const LONG_PRESS_MS = 450;

const NavItem: React.FC<{ view: ViewMode; label: string; Icon: LucideIcon }> = ({ view, label, Icon }) => {
  const { currentView, setCurrentView } = useApp();
  const isActive = currentView === view;
  return (
    <button
      type="button"
      onClick={() => setCurrentView(view)}
      aria-current={isActive ? 'page' : undefined}
      className={`flex w-16 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] transition-colors cursor-pointer ${
        isActive ? 'text-fg font-medium' : 'text-fg-subtle hover:text-fg-muted'
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
      <span>{label}</span>
    </button>
  );
};

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, setEditingPendingItem, setIsTransferModalOpen } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  // Los formularios tienen su propio botón de guardar y su "atrás" en el header
  if (
    currentView === 'setup' ||
    currentView === 'login' ||
    currentView === 'new-transaction' ||
    currentView === 'new-pending'
  ) {
    return null;
  }

  const newTransaction = () => {
    setShowMenu(false);
    setShowQuickAdd(true);
  };

  const newPending = () => {
    setShowMenu(false);
    setEditingPendingItem(null);
    setCurrentView('new-pending');
  };

  const openTransfer = () => {
    setShowMenu(false);
    setIsTransferModalOpen(true);
  };

  // Toque: crea lo propio de la vista (pendiente en Pendientes, movimiento en el resto).
  // Mantener presionado (o clic derecho) abre el menú con todas las opciones.
  const startPress = () => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      navigator.vibrate?.(10);
      setShowMenu(true);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const handleFabClick = () => {
    if (longPressed.current) return;
    if (showMenu) setShowMenu(false);
    else if (currentView === 'pendientes') newPending();
    else newTransaction();
  };

  const menuItems = [
    { label: 'Gasto o ingreso', Icon: Receipt, onClick: newTransaction },
    { label: 'Pendiente', Icon: CalendarClock, onClick: newPending },
    { label: 'Transferencia', Icon: ArrowLeftRight, onClick: openTransfer },
  ];

  return (
    <>
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="fixed bottom-28 left-1/2 z-50 w-60 -translate-x-1/2 rounded-[20px] border border-line bg-surface-3 p-1.5 shadow-xl"
            >
              {menuItems.map(({ label, Icon, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <Icon size={18} strokeWidth={1.75} className="text-fg-muted" />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)] pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-line bg-surface-1/80 px-2 py-1.5 shadow-lg backdrop-blur-xl">
          <NavItem view="dashboard" label="Inicio" Icon={House} />
          <NavItem view="pendientes" label="Pendientes" Icon={CalendarClock} />

          <button
            type="button"
            onClick={handleFabClick}
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(e) => {
              e.preventDefault();
              cancelPress();
              setShowMenu(true);
            }}
            aria-label={currentView === 'pendientes' ? 'Nuevo pendiente' : 'Nuevo gasto o ingreso'}
            title="Toca para agregar · mantén presionado para más opciones"
            className="mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-fg text-canvas shadow-md active:scale-95 transition-transform cursor-pointer select-none"
          >
            <Plus
              size={24}
              strokeWidth={2}
              className={`transition-transform duration-200 ${showMenu ? 'rotate-45' : ''}`}
            />
          </button>

          <NavItem view="tarjeta" label="Tarjeta" Icon={CreditCard} />
          <NavItem view="estadisticas" label="Análisis" Icon={ChartColumn} />
        </div>
      </nav>

      <QuickAddSheet open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </>
  );
};
