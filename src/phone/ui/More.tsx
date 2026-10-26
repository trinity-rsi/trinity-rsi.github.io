import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Long text, folded: the first `lines` lines show, fading out, with a button that opens the rest.
 * Nothing is folded when the text is short enough anyway.
 */
export default function More({
  children,
  lines = 4,
  lineHeight = 27.5,
  className = '',
  label = 'Read more',
  on = 'paper',
}: {
  children: ReactNode;
  lines?: number;
  lineHeight?: number;
  className?: string;
  label?: string;
  /** the background the fade blends into */
  on?: 'paper' | 'surface';
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(0);
  const [open, setOpen] = useState(false);
  const shut = lines * lineHeight;

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setFull(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const folds = full > shut + lineHeight * 0.6;
  return (
    <div className={className}>
      <div className="relative overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ height: folds ? (open ? full : shut) : undefined }}>
        <div ref={inner}>{children}</div>
        {folds && (
          <span
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent transition-opacity duration-300 ${on === 'surface' ? 'from-surface' : 'from-paper'}`}
            style={{ opacity: open ? 0 : 1 }}
            aria-hidden
          />
        )}
      </div>
      {folds && (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="p-press mt-1.5 inline-flex h-9 items-center gap-1.5 text-[14px] font-[700] text-ink">
          {open ? 'Show less' : label}
          <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden>
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
