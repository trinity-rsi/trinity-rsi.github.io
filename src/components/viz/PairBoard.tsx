import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { benchById, capById, domainById, familyById, nodeById, pathLabel, type Bench, type NodeId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * Different-looking tasks that need the same capabilities, all eight pairs at once, as in the
 * film. Every pair sits on one node of the paper's capability tree (Figure 9) and comes from
 * different task domains; frames are the benchmarks' own start frames (Appendix E.1). The pair on
 * top is open: what each task requires, row against row; a tile below opens another pair.
 * The first pair is the paper's own example.
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

const short = (b: Bench) => b.short ?? b.name;

function caption(p: Pair) {
  if (p.note) return p.note;
  const A = benchById[p.a];
  const B = benchById[p.b];
  const n = nodeById[A.node];
  const caps = n.path.map((c) => capById[c].name.toLowerCase());
  const need = caps.length === 1 ? caps[0] : `${caps.slice(0, -1).join(', ')} and ${caps[caps.length - 1]}`;
  return `${A.name} comes from ${domainById[A.domain].name.toLowerCase()}, ${B.name} from ${domainById[B.domain].name.toLowerCase()}. Both require ${need}, so they share node ${pathLabel(A.node).replace(/ /g, ' ')} of the capability tree.`;
}

/** the letters of a node's capability path, as small coloured keys */
function PathKeys({ node, size = 20 }: { node: NodeId; size?: number }) {
  const { t } = useTokens();
  return (
    <span className="inline-flex shrink-0 items-center gap-[3px]">
      {nodeById[node].path.map((c) => (
        <span
          key={c}
          className="grid place-items-center rounded-[6px] font-[800] leading-none text-white"
          style={{ background: t.caps[c], width: size, height: size, fontSize: size * 0.55 }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

/** one task of the open pair: its frame, then what it requires */
function TaskCard({ b, node, rowRefs }: { b: Bench; node: NodeId; rowRefs: React.MutableRefObject<(HTMLLIElement | null)[]> }) {
  const { t } = useTokens();
  const d = domainById[b.domain];
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-rule bg-surface shadow-[0_26px_60px_-44px_rgba(20,24,40,0.6)]">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-paper-2">
        <img src={e1Frame(b.id, 'start')} alt={`${b.name}: start frame`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11.5px] font-[680] text-ink-2 shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
          {d.name}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[rgba(12,14,22,0.62)] px-2.5 py-1 text-[11px] font-[680] text-white backdrop-blur">
          {b.split === 'unseen' ? 'Unseen' : 'Training'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[21px] font-[760] leading-tight tracking-[-0.02em] text-ink" style={{ fontStretch: '110%' }}>
          {b.name}
          {b.rebuilt && <span className="ml-0.5 align-super text-[13px] text-ink-3">*</span>}
        </p>
        <p className="mt-1 line-clamp-1 text-[13px] leading-snug text-ink-3">{familyById[b.family].name}</p>
        <p className="mt-4 text-[12px] font-[700] uppercase tracking-[0.1em] text-ink-3">{short(b)} requires</p>
        <ol className="mt-2 space-y-2">
          {nodeById[node].path.map((c, i) => (
            <li
              key={c}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className="flex h-11 items-center gap-3 rounded-[12px] px-2.5"
              style={{ background: `${t.caps[c]}14` }}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[14px] font-[800] text-white shadow-sm" style={{ background: t.caps[c] }}>
                {c}
              </span>
              <span className="text-[14.5px] font-[700] leading-tight text-ink">{capById[c].name}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function PairBoard() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const pair = PAIRS[idx];
  const A = benchById[pair.a];
  const B = benchById[pair.b];
  const node = A.node;
  const n = nodeById[node];

  // the "=" links between the two cards: measured, so they meet each row exactly
  const wrap = useRef<HTMLDivElement>(null);
  const rowsA = useRef<(HTMLLIElement | null)[]>([]);
  const rowsB = useRef<(HTMLLIElement | null)[]>([]);
  const [links, setLinks] = useState<{ x1: number; x2: number; y: number }[]>([]);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const out: { x1: number; x2: number; y: number }[] = [];
      n.path.forEach((_, i) => {
        const a = rowsA.current[i]?.getBoundingClientRect();
        const b = rowsB.current[i]?.getBoundingClientRect();
        if (!a || !b || a.right >= b.left) return;
        out.push({ x1: a.right - box.left, x2: b.left - box.left, y: (a.top + a.bottom) / 2 - box.top });
      });
      setLinks(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const late = window.setTimeout(measure, 420); // after the cards have settled in
    return () => {
      ro.disconnect();
      window.clearTimeout(late);
    };
  }, [idx, n.path]);

  const text = useMemo(() => caption(pair), [pair]);

  return (
    <div>
      {/* ---------------- the open pair ---------------- */}
      <div ref={wrap} className="relative mx-auto max-w-[1040px]">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(64px,120px)_minmax(0,1fr)] md:gap-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`a-${idx}`}
              initial={{ opacity: 0, x: -28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -18, transition: { duration: 0.22 } }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <TaskCard b={A} node={node} rowRefs={rowsA} />
            </motion.div>
          </AnimatePresence>
          <div className="hidden md:block" aria-hidden />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`b-${idx}`}
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 18, transition: { duration: 0.22 } }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 }}
            >
              <TaskCard b={B} node={node} rowRefs={rowsB} />
            </motion.div>
          </AnimatePresence>
        </div>
        {/* row against row: the same capability on both sides */}
        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible md:block" aria-hidden>
          {links.map((l, i) => {
            const c = t.caps[n.path[i]];
            const mid = (l.x1 + l.x2) / 2;
            return (
              <g key={`${idx}-${i}`}>
                <motion.line
                  x1={l.x1 + 4}
                  x2={l.x2 - 4}
                  y1={l.y}
                  y2={l.y}
                  stroke={c}
                  strokeWidth={2}
                  strokeDasharray="5 6"
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.9 }}
                  transition={{ duration: 0.6, delay: 0.35 + i * 0.12, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.g initial={reduce ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 22, delay: 0.7 + i * 0.12 }} style={{ originX: `${mid}px`, originY: `${l.y}px` }}>
                  <circle cx={mid} cy={l.y} r={14} fill={theme === 'dark' ? t.surface : '#ffffff'} stroke={c} strokeWidth={2} />
                  <text x={mid} y={l.y + 5.5} textAnchor="middle" fill={c} style={{ fontSize: 17, fontWeight: 800 }}>
                    =
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>

        {/* the node they share */}
        <div className="mt-5 flex justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={idx}
              className="inline-flex items-center gap-3 rounded-full border border-rule bg-surface px-4 py-2 shadow-[0_18px_40px_-30px_rgba(20,24,40,0.6)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-[11.5px] font-[750] tracking-[0.04em] text-ink-3"><span className="uppercase tracking-[0.12em]">Shared node</span> {pathLabel(node)}</span>
              <PathKeys node={node} size={20} />
              <span className="text-[15px] font-[740] text-ink">{n.name}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={idx}
            className="mx-auto mt-4 max-w-[66ch] text-center font-serif text-[1.06rem] leading-[1.6] text-ink-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ---------------- every pair at once ---------------- */}
      <div className="mt-12 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
        {PAIRS.map((p, i) => {
          const a = benchById[p.a];
          const b = benchById[p.b];
          const on = i === idx;
          return (
            <motion.button
              key={p.a}
              type="button"
              onClick={() => setIdx(i)}
              aria-pressed={on}
              className={`group relative rounded-[18px] border bg-surface p-2.5 text-left transition-[border-color,box-shadow] duration-300 ${
                on ? 'border-accent/45 shadow-[0_22px_44px_-28px_rgba(200,16,46,0.55)] ring-2 ring-accent/25' : 'border-rule hover:border-rule-2 hover:shadow-[0_22px_44px_-32px_rgba(20,24,40,0.55)]'
              }`}
              initial={reduce ? false : { opacity: 0, y: -26, rotate: i % 2 ? 1.2 : -1.2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '0px 0px -6% 0px' }}
              transition={{ type: 'spring', stiffness: 460, damping: 24, mass: 0.9, delay: (i % 4) * 0.07 + Math.floor(i / 4) * 0.16 }}
              whileHover={reduce ? undefined : { y: -3 }}
            >
              <span className="grid grid-cols-2 gap-1.5">
                {[a, b].map((x) => (
                  <span key={x.id} className="relative block aspect-[16/10] overflow-hidden rounded-[10px] bg-paper-2">
                    <img src={e1Frame(x.id, 'start')} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" draggable={false} />
                  </span>
                ))}
              </span>
              <span className="mt-1.5 grid grid-cols-2 gap-1.5 px-0.5">
                {[a, b].map((x) => (
                  <span key={x.id} className="truncate text-[12.5px] font-[700] text-ink">
                    {short(x)}
                  </span>
                ))}
              </span>
              <span className="mt-2 flex items-center gap-2 rounded-[11px] px-2 py-1.5" style={{ background: on ? t.accentWash : t.surface2 }}>
                <PathKeys node={a.node} size={18} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-[700] leading-none text-ink-3">node {pathLabel(a.node)}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] font-[700] leading-tight text-ink">{nodeById[a.node].name}</span>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[12.5px] text-ink-3">Pairs from the capability tree (Figure 9) · frames from Appendix E.1 · * rebuilt environment · pick a pair to open it</p>
    </div>
  );
}
