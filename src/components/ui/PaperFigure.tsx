import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { Cancel01Icon, Image01Icon } from '@hugeicons/core-free-icons';
import type { PaperFig } from '@/data/media';

/** "Figure N in the paper" button that opens the paper's own figure in a lightbox. */
export default function PaperFigure({ fig, label, className = '' }: { fig: PaperFig; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3 py-1.5 text-[12.5px] font-[640] text-ink-2 transition-colors hover:border-accent/50 hover:text-ink ${className}`}
      >
        <Icon icon={Image01Icon} size={14} className="text-ink-3 transition-colors group-hover:text-accent" />
        {label ?? `Figure ${fig.n} in the paper`}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="lb"
              className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm sm:p-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label={fig.caption}
            >
              <motion.figure
                className="relative max-h-full w-full max-w-[1280px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                initial={{ scale: 0.94, y: 18, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[calc(100vh-11rem)] overflow-auto">
                  <img src={fig.src} alt={fig.caption} width={fig.w} height={fig.h} className="block h-auto w-full" />
                </div>
                <figcaption className="border-t border-[#e4e6ec] px-5 py-3 text-[13.5px] leading-snug text-[#3b4152]">{fig.caption}</figcaption>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  aria-label="Close"
                >
                  <Icon icon={Cancel01Icon} size={18} />
                </button>
              </motion.figure>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
