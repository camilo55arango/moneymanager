import React from 'react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

// Hoja que sube desde abajo; se cierra tocando el fondo o arrastrando el asa hacia abajo
export const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, ariaLabel, children }) => {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-md flex-col rounded-t-[20px] border border-b-0 border-line bg-surface-3 shadow-2xl"
          >
            {/* Asa para arrastrar y cerrar */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1"
            >
              <span className="h-1 w-10 rounded-full bg-line-strong" />
            </div>

            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
