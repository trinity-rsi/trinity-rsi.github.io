import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CAPS, benchById, capById, domainById, type Bench, type CapId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { PAIRS, capsOf, caption } from '@/components/viz/PairBoard';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';

/**
 * Shared capabilities, on a phone: eight pairs of tasks from different domains. For the pair in
 * front, both start frames, then the six capabilities as rows, each task's key filled when it
 * requires that capability (its capability-tree branch, Figures 9 and 10); the rows both need light
 * up. Pairs move on by themselves while the card is in view; a tap on the row of pairs or a swipe
 * on the card takes over.
 */
const CYCLE = 6.5;
const EASE = [0.2, 0.8, 0.2, 1] as const;
const name = (b: Bench) => b.short ?? b.name;
const splitLabel = (b: Bench) => (b.split === 'unseen' ? 'unseen' : b.split === 'both' ? 'sim. train, robot unseen' : 'training');

function Key({ c, on }: { c: CapId; on: boolean }) {
  const { t } = useTokens();
  return (
    <motion.span
      className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] border-[1.5px] text-[13px] font-[820] leading-none"
      animate={{ backgroundColor: on ? t.caps[c] : `${t.caps[c]}00`, borderColor: on ? t.caps[c] : t.rule2, color: on ? '#ffffff' : t.ink3 }}
      transition={{ duration: 0.3 }}
    >
      {c}
    </motion.span>
  );
}

function Frame({ b }: { b: Bench }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-paper-2">
      <AnimatePresence initial={false}>
        <motion.img
          key={b.id}
          src={e1Frame(b.id, 'start')}
          alt={`${b.name}: start frame`}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
          transition={{ duration: 0.45, ease: EASE }}
          draggable={false}
        />
      </AnimatePresence>
      <span className="absolute left-1.5 top-1.5 inline-flex max-w-[calc(100%-0.75rem)] items-center gap-1 truncate rounded-full bg-surface/92 px-1.5 py-0.5 text-[10.5px] font-[700] text-ink-2 shadow-sm">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: domainById[b.domain].color }} />
        <span className="truncate">{domainById[b.domain].short}</span>
      </span>
    </div>
  );
}

export default function PExamples() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-20% 0px');
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(!reduce);
  const bar = useRef<HTMLSpanElement>(null);
  const row = useRef<HTMLOListElement>(null);

  const pair = PAIRS[idx];
  const A = benchById[pair.a];
  const B = benchById[pair.b];
  const sa = capsOf(A);
  const sb = capsOf(B);
  const shared = CAPS.map((c) => c.id as CapId).filter((c) => sa.includes(c) && sb.includes(c));

  // the next pair after a while, while the card is on screen
  useEffect(() => {
    if (!auto || !near || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = (now - t0) / 1000 / CYCLE;
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, u)})`;
      if (u >= 1) setIdx((i) => (i + 1) % PAIRS.length);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, near, idx, reduce]);

  // keep the pair in front visible in the row
  useEffect(() => {
    const list = row.current;
    const item = list?.children[idx] as HTMLElement | undefined;
    if (!list || !item) return;
    list.scrollTo({ left: Math.max(0, item.offsetLeft - 20), behavior: reduce ? 'auto' : 'smooth' });
  }, [idx, reduce]);

  // the next pair's frames, decoded ahead
  useEffect(() => {
    const next = PAIRS[(idx + 1) % PAIRS.length];
    [next.a, next.b].forEach((id) => {
      const im = new Image();
      im.src = e1Frame(id, 'start');
      im.decode?.().catch(() => undefined);
    });
  }, [idx]);

  const pick = (i: number) => {
    setAuto(false);
    setIdx((i + PAIRS.length) % PAIRS.length);
  };
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: RPointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: RPointerEvent) => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - s0.y) * 1.4) pick(idx + (dx < 0 ? 1 : -1));
  };

  return (
    <section id="examples" className="scroll-mt-16 pt-20">
      <Opener kicker="Shared capabilities" title="Tasks that look different often need the same capabilities.">
        <p className="p-lede">Grouping tasks by these shared requirements makes the underlying mechanisms a common learning objective, enabling generalization across tasks.</p>
      </Opener>

      <div ref={ref} className="mt-7">
        {/* the eight pairs */}
        <ol ref={row} className="p-noscroll flex snap-x gap-2 overflow-x-auto scroll-px-5 px-5 pb-1">
          {PAIRS.map((p, i) => {
            const a = benchById[p.a];
            const b = benchById[p.b];
            const sh = capsOf(a).filter((c) => capsOf(b).includes(c));
            const on = i === idx;
            return (
              <li key={p.a} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => pick(i)}
                  aria-pressed={on}
                  className={`relative flex items-center gap-2.5 overflow-hidden rounded-[14px] border py-1.5 pl-1.5 pr-3 text-left transition-colors duration-300 ${on ? 'border-accent/45 bg-surface' : 'border-rule bg-surface/60'}`}
                >
                  <span className="relative h-9 w-[62px] shrink-0">
                    {[a, b].map((x, k) => (
                      <img
                        key={x.id}
                        src={e1Frame(x.id, 'start')}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`absolute top-0 h-9 w-[38px] rounded-[7px] object-cover ring-2 ring-surface ${k ? 'right-0' : 'left-0'}`}
                        draggable={false}
                      />
                    ))}
                  </span>
                  <span>
                    <span className={`block whitespace-nowrap text-[12.5px] font-[720] leading-tight ${on ? 'text-ink' : 'text-ink-2'}`}>
                      {name(a)} <span className="text-accent">×</span> {name(b)}
                    </span>
                    <span className="mt-1 flex gap-[3px]">
                      {sh.map((c) => (
                        <span key={c} className="grid h-4 w-4 place-items-center rounded-[4px] text-[9.5px] font-[820] text-white" style={{ background: t.caps[c] }}>
                          {c}
                        </span>
                      ))}
                    </span>
                  </span>
                  {on && auto && !reduce && <span ref={bar} className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent" style={{ transform: 'scaleX(0)' }} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ol>

        {/* the pair in front */}
        <div className="mx-3 mt-3 rounded-[24px] border border-rule bg-surface p-3.5 shadow-[0_30px_60px_-44px_rgba(20,24,40,0.6)]" style={{ touchAction: 'pan-y' }} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (swipe.current = null)}>
          <div className="relative grid grid-cols-2 gap-2">
            <Frame b={A} />
            <Frame b={B} />
            <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-rule bg-surface text-[16px] font-[820] text-accent shadow-sm">×</span>
          </div>
          <div className="relative mt-2.5 grid min-h-[46px] grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {[A, B].map((b, k) => (
                <motion.div key={`${b.id}-${k}`} className={k ? 'text-right' : ''} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.28, ease: EASE }}>
                  <p className="text-[15px] font-[760] leading-tight tracking-[-0.01em] text-ink" style={{ fontStretch: '106%' }}>
                    {b.name}
                    {b.rebuilt && <span className="text-ink-3">*</span>}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{splitLabel(b)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* the six capabilities: each task's keys, the shared ones lit */}
          <div className="mt-3 border-t border-rule pt-2.5">
            <div className="grid grid-cols-[26px_minmax(0,1fr)_26px] px-1 pb-1.5 text-[10.5px] font-[700] text-ink-3">
              <span className="text-center">{sa.length}/6</span>
              <span className="text-center">requires</span>
              <span className="text-center">{sb.length}/6</span>
            </div>
            <ul className="space-y-1">
              {CAPS.map((cap, k) => {
                const c = cap.id as CapId;
                const both = shared.includes(c);
                return (
                  <motion.li
                    key={c}
                    className="grid grid-cols-[26px_minmax(0,1fr)_26px] items-center gap-2 rounded-[10px] px-1 py-[3px]"
                    animate={{ backgroundColor: both ? `${t.caps[c]}1f` : `${t.caps[c]}00` }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : k * 0.04 }}
                  >
                    <Key c={c} on={sa.includes(c)} />
                    <span className={`text-center text-[12.5px] leading-[1.25] transition-colors duration-300 ${both ? 'font-[740] text-ink' : sa.includes(c) || sb.includes(c) ? 'font-[600] text-ink-2' : 'font-[520] text-ink-3'}`}>
                      {capById[c].name}
                    </span>
                    <Key c={c} on={sb.includes(c)} />
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* what they share, in words */}
          <div className="relative mt-3 border-t border-rule pt-3">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p key={idx} className="font-serif text-[15px] leading-[1.6] text-ink-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease: EASE }}>
                {caption(pair)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <p className="mt-3 px-5 text-[12px] leading-snug text-ink-3">
          A task requires the capabilities on its capability-tree branch (Figures 9 and 10). Frames from Appendix E.1; * marks a rebuilt environment.
        </p>
      </div>
    </section>
  );
}
