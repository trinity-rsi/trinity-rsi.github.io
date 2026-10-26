import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { Cancel01Icon, Image01Icon } from '@hugeicons/core-free-icons';
import type { PaperFig } from '@/data/media';
import { useReducedMotion } from '@/lib/hooks';

/** figures opened during this visit: their buttons stop demonstrating the click */
const opened = new Set<number>();
/** one demonstration cycle, in seconds (keep in step with --fig-hint-cycle in index.css) */
const CYCLE = 8;
/** the thumbnail's height inside the pill, and the pill's inset around it (border + padding) */
const TH = 22;
const INSET = 4;

/**
 * "Figure N in the paper": a pill carrying a thumbnail of the figure. While it is on screen a
 * pointer (a fingertip on touch screens) clicks it every few seconds and the thumbnail pops out,
 * until the reader opens it; buttons in one row take turns. The figure then grows out of the
 * thumbnail into a lightbox and shrinks back into it on close.
 */
export default function PaperFigure({ fig, label, className = '' }: { fig: PaperFig; label?: string; className?: string }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(() => !opened.has(fig.n));
  const [inView, setInView] = useState(false);
  const [slot, setSlot] = useState({ i: 0, n: 1 });
  const [from, setFrom] = useState({ x: 0, y: 0, s: 0.2 });
  const wrap = useRef<HTMLSpanElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const row = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('fig-hint')) : [el];
    setSlot({ i: Math.max(0, row.indexOf(el)), n: row.length });
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const show = () => {
    // the lightbox is centred, so moving its centre onto the thumbnail's makes it grow out of it
    const r = thumb.current?.getBoundingClientRect();
    if (r) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(1280, vw - (vw >= 640 ? 80 : 32));
      setFrom({ x: r.left + r.width / 2 - vw / 2, y: r.top + r.height / 2 - vh / 2, s: Math.max(0.03, r.width / w) });
    }
    opened.add(fig.n);
    setHint(false);
    setOpen(true);
  };

  const tw = Math.round(Math.min(50, Math.max(30, (TH * fig.w) / fig.h)));
  const style = { '--fig-hint-x': `${INSET + tw / 2}px`, '--fig-hint-delay': `${0.5 + (slot.i * CYCLE) / slot.n}s` } as CSSProperties;
  const [head, ...rest] = fig.caption.split(' | ');

  return (
    <>
      <span ref={wrap} className={`fig-hint relative inline-flex align-top ${className}`} data-on={hint && inView ? '' : undefined} style={style}>
        <button
          type="button"
          onClick={show}
          aria-haspopup="dialog"
          className="fig-hint-btn group inline-flex h-[30px] items-center gap-2 rounded-full border border-rule bg-surface pl-[3px] pr-3 text-[12.5px] font-[640] text-ink-2 transition-colors hover:border-accent/50 hover:text-ink"
        >
          <span ref={thumb} className="fig-hint-thumb" style={{ width: tw }} aria-hidden>
            {fig.thumb ? <img src={fig.thumb} alt="" width={tw} height={TH} loading="lazy" decoding="async" /> : <Icon icon={Image01Icon} size={14} className="m-auto mt-1 text-ink-3" />}
          </span>
          {label ?? `Figure ${fig.n} in the paper`}
        </button>
        <span className="fig-hint-ripple" aria-hidden />
        <span className="fig-hint-tap" aria-hidden />
        <span className="fig-hint-cursor" aria-hidden>
          <svg className="fig-hint-arrow" viewBox="0 0 17 22">
            <path d="M2 2v15.4l3.9-3.6 2.7 6.3 2.9-1.25-2.7-6.2h5.5L2 2Z" fill="#fff" stroke="#12141c" strokeWidth="1.35" strokeLinejoin="round" />
          </svg>
          <svg className="fig-hint-hand" viewBox="0 0 20 24">
            <path
              d="M7.2 1.4c-1 0-1.8.8-1.8 1.8v8.6l-1-1.1c-.7-.8-1.9-.9-2.7-.2-.7.6-.8 1.7-.2 2.5l3.6 5.2c1.3 1.9 3.4 3 5.7 3h1.3c3.2 0 5.8-2.6 5.8-5.8v-4.6c0-.9-.7-1.6-1.6-1.6-.9 0-1.6.7-1.6 1.6v-.5c0-.9-.7-1.6-1.6-1.6-.9 0-1.6.7-1.6 1.6v-.4c0-.9-.7-1.6-1.6-1.6-.9 0-1.5.6-1.6 1.4V3.2c0-1-.8-1.8-1.9-1.8Z"
              fill="#fff"
              stroke="#12141c"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M9.1 11.9v3.4M12.3 12.2v3.1M15.5 12.6v2.7" fill="none" stroke="#12141c" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        </span>
      </span>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="lb"
              className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm sm:p-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.28, delay: 0.06 } }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label={fig.caption}
            >
              <motion.figure
                className="relative max-h-full w-full max-w-[1280px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                initial={reduce ? { opacity: 0 } : { x: from.x, y: from.y, scale: from.s, opacity: 0 }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                exit={
                  reduce
                    ? { opacity: 0 }
                    : { x: from.x, y: from.y, scale: from.s, opacity: 0, transition: { type: 'spring', stiffness: 380, damping: 38, opacity: { duration: 0.16, delay: 0.16 } } }
                }
                transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9, opacity: { duration: 0.14 } }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[calc(100vh-11rem)] overflow-auto">
                  <img src={fig.src} alt={fig.caption} width={fig.w} height={fig.h} className="block h-auto w-full" />
                </div>
                <figcaption className="border-t border-[#e4e6ec] px-5 py-3 text-[13.5px] leading-snug text-[#3b4152]">
                  {rest.length ? (
                    <>
                      <b className="font-[760] text-[#12141c]">{head}</b> {rest.join(' | ')}
                    </>
                  ) : (
                    fig.caption
                  )}
                </figcaption>
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
