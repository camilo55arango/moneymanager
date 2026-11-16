import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface ToastData {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

// Aviso flotante sobre la barra inferior; se cierra solo después de `duration` ms
export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, duration = 5000 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss, duration]);

  return (
    <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="pointer-events-auto flex items-center gap-4 rounded-full bg-fg text-canvas pl-5 pr-2 py-2 shadow-lg text-sm"
          >
            <span>{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss();
                }}
                className="rounded-full px-3 py-1.5 font-semibold text-accent bg-canvas/10 hover:bg-canvas/20 transition-colors cursor-pointer"
              >
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
