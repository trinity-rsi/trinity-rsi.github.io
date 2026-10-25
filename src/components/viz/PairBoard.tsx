import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, type AnimationPlaybackControls } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { CAPS, benchById, capById, domainById, familyById, nodeById, type Bench, type CapId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery, useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * Tasks that look different but need some of the same capabilities. A task requires the
 * capabilities on the branch of its capability-tree node (Figures 9 and 10), so every task here
 * lists all six capabilities with the ones it requires lit, and only the capabilities both tasks
 * require are linked. Frames are the benchmarks' start frames (Appendix E.1). The first pair is
 * the paper's own example; the others come from different domains and different nodes.
 */
type Pair = { a: string; b: string; note?: string };
export const PAIRS: Pair[] = [
  {
    a: 'arc-agi-3',
    b: 'micromouse',
    note: 'ARC-AGI-3 requires recognizing grid states and their changes; Micromouse requires continuously updating environmental information during maze exploration. Both rely on accurate perception and state tracking, and on the capability tree both sit at node d → a.',
  },
  { a: 'nethack', b: 'soon' },
  { a: 'puzz-link-penpa', b: 'memory-maze' },
  { a: 'textquests', b: 'cap-x' },
  { a: 'wca-cube-solving', b: 'hu-nlhe' },
  { a: 'master-keying', b: 'the-long-dark' },
  { a: 'saboteur', b: 'wilt' },
  { a: 'mastermind', b: 'codenames' },
];

const CYCLE = 6.5; // seconds per pair while auto-playing
const SHORT: Record<CapId, string> = { a: 'Perception', b: 'Hypothesis', c: 'Constraints', d: 'Goal & value', e: 'Video evidence', f: 'Video comprehension' };
const EASE = [0.2, 0.8, 0.2, 1] as const;

const name = (b: Bench) => b.short ?? b.name;
const capsOf = (b: Bench) => nodeById[b.node].path as CapId[];
const list = (cs: CapId[]) => {
  const n = cs.map((c) => capById[c].name.toLowerCase());
  return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
};

function caption(p: Pair) {
  if (p.note) return p.note;
  const A = benchById[p.a];
  const B = benchById[p.b];
  const sa = capsOf(A);
  const sb = capsOf(B);
  const shared = sa.filter((c) => sb.includes(c));
  const onlyA = sa.filter((c) => !sb.includes(c));
  const onlyB = sb.filter((c) => !sa.includes(c));
  const parts = [`${A.name} comes from ${domainById[A.domain].name.toLowerCase()}, ${B.name} from ${domainById[B.domain].name.toLowerCase()}. Both require ${list(shared)}.`];
  if (onlyA.length) parts.push(`Only ${name(A)} also needs ${list(onlyA)}${onlyB.length ? `; only ${name(B)}, ${list(onlyB)}` : ''}.`);
  else if (onlyB.length) parts.push(`Only ${name(B)} also needs ${list(onlyB)}.`);
  return parts.join(' ');
}

const splitLabel = (b: Bench) => (b.split === 'unseen' ? 'Unseen' : b.split === 'both' ? 'Sim. train · robot unseen' : 'Training');

/** a capability's letter key; filled when required, an outline otherwise */
function Key({ c, on, size = 24 }: { c: CapId; on: boolean; size?: number }) {
  const { t } = useTokens();
  return (
    <motion.span
      className="grid shrink-0 place-items-center rounded-[7px] font-[800] leading-none"
      style={{ width: size, height: size, fontSize: size * 0.56, borderWidth: 1.5, borderStyle: 'solid' }}
      animate={{ backgroundColor: on ? t.caps[c] : `${t.caps[c]}00`, borderColor: on ? t.caps[c] : t.rule2, color: on ? '#ffffff' : t.ink3 }}
      transition={{ duration: 0.3 }}
    >
      {c}
    </motion.span>
  );
}

function Frame({ b, narrow }: { b: Bench; narrow: boolean }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[14px] bg-paper-2">
      <AnimatePresence initial={false}>
        <motion.img
          key={b.id}
          src={e1Frame(b.id, 'start')}
          alt={`${b.name}: start frame`}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
          transition={{ duration: 0.5, ease: EASE }}
          draggable={false}
        />
      </AnimatePresence>
      <span className="absolute left-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 truncate rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-[680] text-ink-2 shadow-sm backdrop-blur">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: domainById[b.domain].color }} />
        <span className="truncate">{narrow ? domainById[b.domain].short : domainById[b.domain].name}</span>
      </span>
    </div>
  );
}

function Title({ b }: { b: Bench }) {
  return (
    <div className="relative h-[60px] pt-2.5">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }} transition={{ duration: 0.3, ease: EASE }}>
          <p className="truncate text-[clamp(15px,1.5vw,19px)] font-[760] leading-tight tracking-[-0.015em] text-ink" style={{ fontStretch: '108%' }}>
            {b.name}
            {b.rebuilt && <span className="ml-0.5 align-super text-[12px] text-ink-3">*</span>}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-ink-3">
            {familyById[b.family].name} · {splitLabel(b)}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Row({ c, on, k, narrow, reduce }: { c: CapId; on: boolean; k: number; narrow: boolean; reduce: boolean }) {
  const { t } = useTokens();
  return (
    <motion.div
      className="flex h-[38px] items-center gap-2.5 rounded-[11px] px-2"
      animate={{ backgroundColor: on ? `${t.caps[c]}1c` : `${t.caps[c]}00`, opacity: on ? 1 : 0.42 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : k * 0.045 }}
    >
      <Key c={c} on={on} />
      <span className={`truncate leading-tight ${narrow ? 'text-[12.5px]' : 'text-[13.5px]'} ${on ? 'font-[700] text-ink' : 'font-[560] text-ink-3'}`}>{narrow ? SHORT[c] : capById[c].name}</span>
    </motion.div>
  );
}

export default function PairBoard() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const narrow = !useMediaQuery('(min-width: 640px)');
  const [ref, near] = useNearViewport<HTMLDivElement>('0px');
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hold, setHold] = useState(false);
  const phase = useMotionValue(0);
  const clock = useRef<AnimationPlaybackControls | null>(null);

  const pair = PAIRS[idx];
  const A = benchById[pair.a];
  const B = benchById[pair.b];
  const sa = capsOf(A);
  const sb = capsOf(B);
  const shared = CAPS.map((c) => c.id as CapId).filter((c) => sa.includes(c) && sb.includes(c));

  // auto-play: the clock lives in a motion value, so the list's progress bar never re-renders the board
  const running = auto && near && !hold && !reduce;
  const runningRef = useRef(running);
  runningRef.current = running;
  useEffect(() => {
    phase.set(0);
    clock.current?.stop();
    const c = animate(phase, 1, { duration: CYCLE, ease: 'linear', onComplete: () => setIdx((i) => (i + 1) % PAIRS.length) });
    if (!runningRef.current) c.pause();
    clock.current = c;
    return () => c.stop();
  }, [idx, phase]);
  useEffect(() => {
    const c = clock.current;
    if (!c) return;
    if (running) c.play();
    else c.pause();
  }, [running]);

  // decode the next pair's frames ahead of time
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
    setIdx(i);
  };

  return (
    <div ref={ref} className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* ---------------- the eight pairs ---------------- */}
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[12.5px] font-[750] uppercase tracking-[0.12em] text-ink-3">Eight pairs</p>
          <button
            type="button"
            onClick={() => setAuto((v) => !v)}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-rule bg-surface px-2.5 text-[11.5px] font-[680] text-ink-2 transition-colors hover:text-ink"
            aria-pressed={auto}
          >
            <Icon icon={auto ? PauseIcon : PlayIcon} size={12} stroke={2.2} />
            {auto ? 'Auto-play' : 'Play all'}
          </button>
        </div>
        <ol className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0 lg:pb-0">
          {PAIRS.map((p, i) => {
            const a = benchById[p.a];
            const b = benchById[p.b];
            const sh = capsOf(a).filter((c) => capsOf(b).includes(c));
            const on = i === idx;
            return (
              <li key={p.a} className="w-[236px] shrink-0 snap-start lg:w-auto">
                <button
                  type="button"
                  onClick={() => pick(i)}
                  aria-pressed={on}
                  className={`group relative w-full overflow-hidden rounded-[14px] border p-2 text-left transition-[background-color,border-color,box-shadow] duration-300 ${
                    on ? 'border-accent/40 bg-surface shadow-[0_16px_34px_-24px_rgba(20,24,40,0.55)]' : 'border-transparent bg-surface/45 hover:bg-surface'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="relative h-10 w-[74px] shrink-0">
                      {[a, b].map((x, k) => (
                        <img
                          key={x.id}
                          src={e1Frame(x.id, 'start')}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className={`absolute top-0 h-10 w-[46px] rounded-[8px] object-cover ring-2 ring-surface transition-transform duration-300 ${k ? 'right-0' : 'left-0'} ${on ? (k ? 'translate-x-[3px] rotate-[3deg]' : '-translate-x-[3px] -rotate-[3deg]') : ''}`}
                          draggable={false}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-[720] leading-tight ${on ? 'text-ink' : 'text-ink-2'}`}>
                        {name(a)} <span className="text-accent">×</span> {name(b)}
                      </span>
                      <span className="mt-1 flex items-center gap-1">
                        {sh.map((c) => (
                          <span key={c} className="grid h-[17px] w-[17px] place-items-center rounded-[5px] text-[10px] font-[800] text-white" style={{ background: t.caps[c] }}>
                            {c}
                          </span>
                        ))}
                        <span className="ml-0.5 text-[11px] font-[600] text-ink-3">shared</span>
                      </span>
                    </span>
                  </span>
                  {on && auto && !reduce && <motion.span className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent" style={{ scaleX: phase }} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ---------------- the open pair ---------------- */}
      <div
        className="min-w-0 rounded-[24px] border border-rule bg-surface p-3.5 shadow-[0_34px_80px_-56px_rgba(20,24,40,0.7)] sm:p-5"
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)]">
          <Frame b={A} narrow={narrow} />
          <div className="grid place-items-center">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-rule bg-surface-2 text-[15px] font-[800] text-accent sm:h-10 sm:w-10 sm:text-[18px]">×</span>
          </div>
          <Frame b={B} narrow={narrow} />

          <Title b={A} />
          <div />
          <Title b={B} />

          <p className="mb-1.5 px-1 text-[11px] font-[750] uppercase tracking-[0.11em] text-ink-3">
            requires {sa.length} of 6
          </p>
          <p className="mb-1.5 text-center text-[10.5px] font-[750] uppercase tracking-[0.11em] text-ink-3">{narrow ? '' : 'shared'}</p>
          <p className="mb-1.5 px-1 text-[11px] font-[750] uppercase tracking-[0.11em] text-ink-3">
            requires {sb.length} of 6
          </p>

          {CAPS.map((cap, k) => {
            const c = cap.id as CapId;
            const both = shared.includes(c);
            const order = shared.indexOf(c);
            return [
              <Row key={`a-${c}`} c={c} on={sa.includes(c)} k={k} narrow={narrow} reduce={!!reduce} />,
              <div key={`m-${c}`} className="relative z-10 h-[38px]">
                <AnimatePresence>
                  {both && (
                    <motion.span key={`${idx}-${c}`} className="absolute inset-0" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                      <motion.span
                        className="absolute -left-2 -right-2 top-1/2 -mt-px h-[2px] origin-left rounded-full"
                        style={{ background: t.caps[c] }}
                        initial={reduce ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.45, delay: 0.32 + order * 0.14, ease: EASE }}
                      />
                      <span className="absolute inset-0 grid place-items-center">
                        <motion.span
                          className="grid h-6 w-6 place-items-center rounded-full border-2 bg-surface text-[14px] font-[850] leading-none sm:h-7 sm:w-7 sm:text-[16px]"
                          style={{ borderColor: t.caps[c], color: t.caps[c] }}
                          initial={reduce ? false : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 19, delay: 0.62 + order * 0.14 }}
                        >
                          =
                        </motion.span>
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>,
              <Row key={`b-${c}`} c={c} on={sb.includes(c)} k={k} narrow={narrow} reduce={!!reduce} />,
            ];
          })}
        </div>

        {/* what they share, in words */}
        <div className="relative mt-4 border-t border-rule pt-4">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.18 } }} transition={{ duration: 0.35, ease: EASE }}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-[750] uppercase tracking-[0.11em] text-ink-3">Shared</span>
                {shared.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-[12.5px] font-[700] text-ink" style={{ background: `${t.caps[c]}1c` }}>
                    <span className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-[800] text-white" style={{ background: t.caps[c] }}>
                      {c}
                    </span>
                    {capById[c].name}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 font-serif text-[1rem] leading-[1.6] text-ink-2">{caption(pair)}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <p className="text-center text-[12px] text-ink-3 lg:col-span-2">
        A task requires the capabilities on its capability-tree branch (Figures 9 and 10) · frames from Appendix E.1 · * rebuilt environment
      </p>
    </div>
  );
}
