import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useInView } from 'motion/react';
import type { Bench } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * The visual record's two final frames (Appendix E.1), one over the other: H0's failed run on the
 * left of the divider, H4's completed run on the right. Drag (or move the pointer while pressing)
 * to compare; the first one on the page shows once that the divider moves.
 */
export default function CompareFrames({ b, hint = false }: { b: Bench; hint?: boolean }) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, margin: '0px 0px -25% 0px' });
  const [pos, setPos] = useState(50);
  const [drag, setDrag] = useState(false);
  const touched = useRef(false);

  // the first card shows, once, that the divider moves
  useEffect(() => {
    if (!hint || !seen || reduce || touched.current) return;
    const keys = [50, 78, 24, 50];
    let i = 0;
    const id = window.setInterval(() => {
      if (touched.current || ++i >= keys.length) return window.clearInterval(id);
      setPos(keys[i]);
    }, 650);
    return () => window.clearInterval(id);
  }, [hint, seen, reduce]);

  const at = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[16/9] cursor-ew-resize select-none overflow-hidden bg-[#0c1018]"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        touched.current = true;
        setDrag(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        at(e);
      }}
      onPointerMove={(e) => drag && at(e)}
      onPointerUp={() => setDrag(false)}
      onPointerCancel={() => setDrag(false)}
      role="slider"
      aria-label={`${b.name}: compare H₀ and H₄`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
    >
      <img src={e1Frame(b.id, 'h4')} alt={`${b.name}: final frame, H4`} loading="lazy" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, transition: drag ? 'none' : 'clip-path .5s cubic-bezier(.2,.8,.2,1)' }}>
        <img src={e1Frame(b.id, 'h0')} alt={`${b.name}: final frame, H0`} loading="lazy" className="absolute inset-0 h-full w-full bg-[#0c1018] object-contain" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%`, transition: drag ? 'none' : 'left .5s cubic-bezier(.2,.8,.2,1)' }} aria-hidden>
        <span className="absolute inset-y-0 -ml-px w-[2px] bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
        <span className="absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#12141c] shadow-lg">
          <svg viewBox="0 0 16 16" className="h-4 w-4">
            <path d="M6 4 2 8l4 4M10 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {/* which side is which, riding with the divider */}
        <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-[760] text-white" style={{ right: 22, background: `${t.bad}e0`, opacity: pos > 12 ? 1 : 0, transition: 'opacity .2s' }}>
          H₀
        </span>
        <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-[760] text-white" style={{ left: 22, background: `${t.good}e0`, opacity: pos < 88 ? 1 : 0, transition: 'opacity .2s' }}>
          H₄
        </span>
      </div>
    </div>
  );
}

