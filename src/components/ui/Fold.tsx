import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** a line that opens the longer explanation underneath it */
export default function Fold({ label = 'What the paper says', children, className = '' }: { label?: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1 text-[13px] font-[700] text-ink-2 transition-colors hover:text-ink">
        {open ? 'Show less' : label}
        <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="max-w-[72ch] pt-2 text-[14px] leading-[1.6] text-ink-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
