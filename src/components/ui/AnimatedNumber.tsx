import React, { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { formatCurrency } from '../../utils/formatCurrency';

// Monto que hace "count-up" desde su valor anterior cada vez que cambia
export const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (v) => formatCurrency(Math.round(v)));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
};
