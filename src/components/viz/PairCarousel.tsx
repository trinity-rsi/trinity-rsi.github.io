import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import FlipCard from '@/components/reactbits/FlipCard/FlipCard';
import Icon from '@/components/ui/Icon';
import { ArrowDataTransferHorizontalIcon, ArrowLeft01Icon, ArrowRight01Icon, PauseIcon, PlayIcon, RotateClockwiseIcon } from '@hugeicons/core-free-icons';
import { benchById, capById, domainById, familyById, nodeById, pathLabel, type Bench, type NodeId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery, useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * Different-looking tasks that need the same capabilities. Every pair sits on one node of the
 * paper's capability tree (Figure 9) and comes from different task domains; frames are the
 * benchmarks' own start frames (Appendix E.1). The first pair is the paper's own example.
 */
type Pair = { a: string; b: string; note?: string };
export const PAIRS: Pair[] = [
  {
    a: 'arc-agi-3',
    b: 'micromouse',
    note: 'ARC-AGI-3 requires recognizing grid states and their changes; Micromouse requires continuously updating environmental information during maze exploration. Both rely on accurate perception and state tracking.',
  },
  { a: 'memory-maze', b: 'textquests' },
  { a: 'among-us', b: 'euro-ncap-aeb' },
  { a: 'chess-tactics', b: 'minihack-maze-corridor' },
  { a: 'boxinggym', b: 'pallet-rack-inspection' },
  { a: 'codenames', b: 'entity-deduction-arena' },
  { a: 'saboteur', b: 'wca-cube-solving' },
  { a: 'puzz-link-penpa', b: 'nethack' },
];

const CYCLE = 7.2; // seconds per pair while playing

function Front({ b }: { b: Bench }) {
  const { t } = useTokens();
  const d = domainById[b.domain];
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="chip !text-[12px]" style={{ borderColor: 'transparent', background: t.surface2 }}>
          <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
        </span>
        <Icon icon={RotateClockwiseIcon} size={15} className="shrink-0 text-ink-3" />
      </div>
      <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-xl bg-paper-2">
        <img src={e1Frame(b.id, 'start')} alt={`${b.name}: start frame`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>
      <p className="mt-3.5 text-[21px] font-[760] leading-tight tracking-[-0.02em] text-ink" style={{ fontStretch: '110%' }}>
        {b.name}
        {b.rebuilt && <span className="ml-0.5 align-super text-[13px] text-ink-3">*</span>}
      </p>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-3">{familyById[b.family].name}</p>
      <p className="mt-auto text-[11.5px] font-[600] text-ink-3">{b.split === 'unseen' ? 'Unseen benchmark' : 'Training benchmark'}</p>
    </div>
  );
}

function Back({ b, node }: { b: Bench; node: NodeId }) {
  const { t } = useTokens();
  const n = nodeById[node];
  return (
    <div className="flex h-full flex-col p-5" style={{ background: `linear-gradient(160deg, ${t.accentWash}, ${t.surface} 72%)` }}>
      <p className="text-[12.5px] font-[650] text-ink-3">{b.name} requires</p>
      <ol className="mt-3.5 space-y-2.5">
        {n.path.map((c, i) => (
          <li key={c} className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[15px] font-[800] text-white shadow-sm" style={{ background: t.caps[c] }}>
              {c}
            </span>
            <span className="text-[15.5px] font-[700] leading-tight text-ink">{capById[c].name}</span>
            {i < n.path.length - 1 && <span className="sr-only">then</span>}
          </li>
        ))}
      </ol>
      <div className="mt-auto rounded-xl border border-rule bg-surface/80 px-3 py-2.5">
        <p className="text-[11.5px] font-[650] uppercase tracking-[0.08em] text-ink-3">Capability-tree node {pathLabel(node)}</p>
        <p className="mt-0.5 text-[14px] font-[700] text-ink">{n.name}</p>
      </div>
    </div>
  );
}

export default function PairCarousel() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const wide = useMediaQuery('(min-width: 900px)');
  const [ref, near] = useNearViewport<HTMLDivElement>('0px');
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const [phase, setPhase] = useState(0); // 0..1 within the current pair
  const [manual, setManual] = useState<boolean | null>(null); // a click overrides the auto flip
  const raf = useRef(0);

  const pair = PAIRS[idx];
  const A = benchById[pair.a];
  const B = benchById[pair.b];
  const node = A.node;

  const running = playing && !hold && near && !reduce;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPhase((p) => {
        const v = p + dt / CYCLE;
        if (v >= 1) {
          setIdx((i) => (i + 1) % PAIRS.length);
          setManual(null);
          return 0;
        }
        return v;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running]);

  const autoFlip = phase > 0.42;
  const flipped = manual ?? (reduce ? false : autoFlip);
  const go = (d: number) => {
    setIdx((i) => (i + d + PAIRS.length) % PAIRS.length);
    setPhase(0);
    setManual(null);
  };

  const caption = useMemo(() => {
    if (pair.note) return pair.note;
    const n = nodeById[node];
    const caps = n.path.map((c) => capById[c].name.toLowerCase());
    const need = caps.length === 1 ? caps[0] : `${caps.slice(0, -1).join(', ')} and ${caps[caps.length - 1]}`;
    return `${A.name} comes from ${domainById[A.domain].name.toLowerCase()}, ${B.name} from ${domainById[B.domain].name.toLowerCase()}. Both require ${need}, so they share node ${pathLabel(node).replace(/ /g, '\u00a0')} of the capability tree.`;
  }, [pair, node, A, B]);

  const cardW = wide ? 300 : 272;
  const cardH = wide ? 392 : 370;
  const card = (b: Bench, side: 'a' | 'b') => (
    <FlipCard
      key={`${b.id}-${side}`}
      width={cardW}
      height={cardH}
      radius={22}
      flipped={flipped}
      onFlipChange={(f) => setManual(f)}
      background={t.surface}
      color={t.ink}
      shadowColor={theme === 'dark' ? '#000000' : '#5b6478'}
      shadowOpacity={theme === 'dark' ? 0.5 : 0.18}
      ariaLabel={`${b.name}: flip to see the capabilities it requires`}
      front={<Front b={b} />}
      back={<Back b={b} node={node} />}
    />
  );

  return (
    <div ref={ref} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      {/* pair selector */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PAIRS.map((p, i) => {
          const on = i === idx;
          return (
            <button
              key={p.a}
              type="button"
              onClick={() => {
                setIdx(i);
                setPhase(0);
                setManual(null);
              }}
              className={`relative overflow-hidden rounded-full border px-3 py-1.5 text-[12.5px] font-[650] transition-colors ${
                on ? 'border-accent/50 bg-surface text-ink' : 'border-rule bg-surface/60 text-ink-3 hover:text-ink-2'
              }`}
            >
              {on && (
                <span className="absolute inset-y-0 left-0 bg-accent-wash" style={{ width: `${(reduce ? 1 : phase) * 100}%` }} aria-hidden />
              )}
              <span className="relative">
                {benchById[p.a].short ?? benchById[p.a].name} <span className="text-accent">×</span> {benchById[p.b].short ?? benchById[p.b].name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-10 grid items-center justify-items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`a-${idx}`}
            className="lg:justify-self-end"
            initial={{ opacity: 0, x: -36, rotate: -3, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {card(A, 'a')}
          </motion.div>
        </AnimatePresence>

        <div className="flex max-w-[230px] flex-col items-center gap-4 text-center">
          <motion.span
            className="grid h-[72px] w-[72px] place-items-center rounded-full border border-rule bg-surface text-[13px] font-[800] text-accent"
            animate={flipped ? { scale: [1, 1.12, 1], boxShadow: `0 0 0 10px ${t.accent}1a` } : { scale: 1, boxShadow: '0 0 0 0px transparent' }}
            transition={{ duration: 0.6 }}
          >
            {flipped ? <span className="whitespace-nowrap text-[19px] tracking-[-0.02em]">{pathLabel(node)}</span> : <Icon icon={ArrowDataTransferHorizontalIcon} size={26} />}
          </motion.span>
          <AnimatePresence mode="wait">
            <motion.p
              key={`${idx}-${flipped ? 'b' : 'f'}`}
              className="text-[14.5px] font-[620] leading-snug text-ink-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {flipped ? 'Same capability path underneath' : 'Different modalities and rules on the surface'}
            </motion.p>
          </AnimatePresence>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-rule bg-surface text-ink-2 hover:text-ink" aria-label="Previous pair">
              <Icon icon={ArrowLeft01Icon} size={16} />
            </button>
            <button type="button" onClick={() => setPlaying((v) => !v)} className="grid h-9 w-9 place-items-center rounded-full border border-rule bg-surface text-ink-2 hover:text-ink" aria-label={playing ? 'Pause' : 'Play'}>
              <Icon icon={playing ? PauseIcon : PlayIcon} size={15} />
            </button>
            <button type="button" onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full border border-rule bg-surface text-ink-2 hover:text-ink" aria-label="Next pair">
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`b-${idx}`}
            className="lg:justify-self-start"
            initial={{ opacity: 0, x: 36, rotate: 3, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay: 0.06 }}
          >
            {card(B, 'b')}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          className="mx-auto mt-9 max-w-[64ch] text-center font-serif text-[1.08rem] leading-[1.6] text-ink-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
        >
          {caption}
        </motion.p>
      </AnimatePresence>
      <p className="mt-3 text-center text-[12.5px] text-ink-3">
        Pairs from the capability tree (Figure 9) · frames from Appendix E.1 · * rebuilt environment · click a card to flip it
      </p>
    </div>
  );
}
