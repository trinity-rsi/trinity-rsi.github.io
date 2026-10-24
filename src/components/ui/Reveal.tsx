import { useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/lib/hooks';

/** fades, lifts and un-blurs its children the first time they scroll into view */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  y = 22,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'li' | 'figure';
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const M = as === 'li' ? motion.li : as === 'figure' ? motion.figure : motion.div;
  if (reduce) return <M className={className}>{children}</M>;
  return (
    <M
      ref={ref as never}
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.75, delay, ease: [0.2, 0.8, 0.2, 1] }}
      // a finished reveal leaves no filter behind: a filter on a container makes every animation
      // inside it repaint through the filter, and Safari flattens any 3D inside it
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.filter = 'none';
      }}
    >
      {children}
    </M>
  );
}
