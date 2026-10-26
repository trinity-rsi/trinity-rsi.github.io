import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** "Finding n" box, styled after the paper's findings: the finding itself, its explanation one click away. */
export default function Finding({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-rule bg-surface py-4 pl-5 pr-5">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden />
      <p className="text-[12.5px] font-[700] text-accent">Finding {n}</p>
      <p className="mt-1 text-[17px] font-[740] leading-snug text-ink">{title}</p>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 inline-flex items-center gap-1 text-[13px] font-[700] text-ink-2 transition-colors hover:text-ink">
        {open ? 'Show less' : 'What the paper says'}
        <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="pt-2 text-[14px] leading-[1.6] text-ink-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
