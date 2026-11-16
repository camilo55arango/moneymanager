import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import { CREDIT_CARD_METHOD, TRANSFER_METHOD } from '../../context/AppContext';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/categories';

const SWIPE_DELETE_THRESHOLD = -96;

const accountLabel = (tx: Transaction) => {
  if (tx.paymentMethod === TRANSFER_METHOD) return 'Transferencia';
  if (tx.paymentMethod === CREDIT_CARD_METHOD) {
    return tx.installments && tx.installments > 1 ? `Tarjeta · ${tx.installments} cuotas` : 'Tarjeta';
  }
  return tx.paymentMethod || 'Billetera';
};

interface TransactionRowProps {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

// Fila de movimiento: toque para editar, deslizar a la izquierda (o el botón en escritorio) para eliminar
export const TransactionRow: React.FC<TransactionRowProps> = ({ tx, onEdit, onDelete }) => {
  const controls = useAnimationControls();
  const isTransfer = tx.paymentMethod === TRANSFER_METHOD;
  const isIncome = tx.type === 'income';
  const { Icon, color } = isTransfer
    ? { Icon: ArrowLeftRight, color: '#8E8E99' }
    : getCategoryMeta(tx.category);

  return (
    <li className="group relative overflow-hidden rounded-xl">
      {/* Fondo que aparece al deslizar */}
      <div className="absolute inset-0 flex items-center justify-end bg-negative px-5 text-white">
        <Trash2 size={18} strokeWidth={1.75} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        dragDirectionLock
        animate={controls}
        onDragEnd={(_, info) => {
          if (info.offset.x < SWIPE_DELETE_THRESHOLD) {
            controls.start({ x: '-100%', transition: { duration: 0.18 } }).then(() => onDelete(tx));
          }
        }}
        onTap={() => onEdit(tx)}
        className="relative flex min-h-[60px] cursor-pointer items-center gap-3 bg-surface-1 px-3 py-2.5 hover:bg-surface-2 transition-colors touch-pan-y"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          <Icon size={16} strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{tx.name}</p>
          <p className="truncate text-xs text-fg-subtle">
            {tx.category} · {accountLabel(tx)}
            {tx.status === 'pending' && <span className="ml-1 text-warning">· Pendiente</span>}
          </p>
        </div>

        <p
          className={`font-mono text-sm ${
            isTransfer ? 'text-fg-muted' : isIncome ? 'text-positive' : 'text-fg'
          }`}
        >
          {isIncome ? '+' : isTransfer ? '' : '−'}
          {formatCurrency(tx.amount)}
        </p>

        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tx);
          }}
          aria-label={`Eliminar ${tx.name}`}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg-subtle opacity-0 hover:bg-negative/10 hover:text-negative group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer md:flex"
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </motion.div>
    </li>
  );
};
