import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { BENCHES, DOMAINS, domainById, pathLabel, type Bench, type DomainId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';

/**
 * The visual record (Appendix E.1) on a phone: for each benchmark, the final frame of a failed H0
 * run and of a completed H4 run from the same start, one over the other; a finger drags the
 * divider between them. Scores: Table 8 (simulation scores for SOON and CaP-X).
 */
type Filter = 'all' | 'train' | 'unseen' | DomainId;
const FIRST = ['arc-agi-3', 'chess-tactics', 'soon', 'among-us', 'nethack', 'cap-x'];

function Compare({ b, hint }: { b: Bench; hint: boolean }) {
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

export default function PRecord() {
  const { t } = useTokens();
  const [f, setF] = useState<Filter>('all');
  const [all, setAll] = useState(false);
  const full = useMemo(() => BENCHES.filter((b) => (f === 'all' ? true : f === 'train' ? b.split !== 'unseen' : f === 'unseen' ? b.split !== 'train' : b.domain === f)), [f]);
  const list = all ? full : f === 'all' ? FIRST.map((id) => BENCHES.find((b) => b.id === id)!) : full.slice(0, 6);
  const hidden = full.length - list.length;
  const chips: { k: Filter; l: string }[] = [
    { k: 'all', l: `All ${BENCHES.length}` },
    { k: 'train', l: 'Train' },
    { k: 'unseen', l: 'Unseen' },
    ...DOMAINS.map((d) => ({ k: d.id as Filter, l: d.short })),
  ];
  return (
    <section id="visual-record" className="scroll-mt-16 pt-20">
      <Opener kicker="Visual record" title="H₀ and H₄ from the same start">
        <p className="p-lede">For every benchmark, the final frame of a failed H₀ run and of a completed H₄ run. Drag across a picture to compare.</p>
      </Opener>
      <div className="p-noscroll mt-6 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {chips.map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => {
              setF(c.k);
              setAll(false);
            }}
            className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-[680] transition-colors ${f === c.k ? 'text-paper' : 'text-ink-2'}`}
          >
            {f === c.k && <motion.span layoutId="pr-chip" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {f !== c.k && <span className="absolute inset-0 rounded-full border border-rule bg-surface" aria-hidden />}
            <span className="relative">{c.l}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-4 px-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((b, i) => {
            const d = domainById[b.domain];
            const s = b.scores.it;
            return (
              <motion.article
                key={b.id}
                layout
                className="overflow-hidden rounded-[20px] border border-rule bg-surface"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              >
                <Compare b={b} hint={i === 0} />
                <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-[740] text-ink">
                      {b.name}
                      {b.rebuilt && <span className="text-ink-3">*</span>}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {b.split === 'unseen' ? 'unseen' : b.split === 'both' ? 'sim. train, robot unseen' : 'train'}, {pathLabel(b.node)}
                    </p>
                  </div>
                  <p className="tabular shrink-0 text-right text-[13px] leading-tight">
                    <span className="text-ink-3">{s[0]}</span>
                    <span className="mx-1 text-ink-3">→</span>
                    <span className="text-[16px] font-[800]" style={{ color: t.accent }}>
                      {s[4]}
                    </span>
                  </p>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
      {(hidden > 0 || all) && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (all) document.getElementById('visual-record')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setAll((v) => !v);
            }}
            className="p-press inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-surface px-5 text-[14px] font-[700] text-ink"
            aria-expanded={all}
          >
            {all ? 'Show fewer' : `Show all ${full.length}`}
            {!all && <span className="tabular rounded-full bg-paper-2 px-2 py-0.5 text-[12px] font-[700] text-ink-3">+{hidden}</span>}
          </button>
        </div>
      )}
    </section>
  );
}
