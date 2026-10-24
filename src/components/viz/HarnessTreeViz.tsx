import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { CAP_NODES, benchesOfNode, moduleById, nodeById, nodeLineage, pathLabel, type NodeId } from '@/data/tree';
import { MEANS } from '@/data/results';
import { nodeLevel } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { useLegoPalette } from './Lego';
import { NextIcon, PauseIcon, PlayIcon, RepeatIcon } from '@hugeicons/core-free-icons';

/**
 * Explorer's Harness tree evolving over iterations 1–4 (Section 3.5, Figure 10, Appendix E.2).
 * Each iteration is one top-down pass over the fixed tree. At every node Creator's level is played,
 * the failing run turns into one module event (a new module or a revision, exactly as recorded in
 * Appendix E.2), and the next run solves the level. Children show their parent's modules as
 * inherited (outlined) bricks. Scores are Table 7.
 */
type Nid = Exclude<NodeId, 'root'>;
const ORDER: Nid[] = ['c', 'd', 'a', 'b', 'e', 'cd', 'ca', 'da', 'db', 'ef', 'cda'];
const NODE_T = 1.05; // seconds per node visit
const BANNER_T = 0.9; // iteration banner
const ITER_T = BANNER_T + ORDER.length * NODE_T;
const TOTAL = 4 * ITER_T;

const VW = 1320;
const VH = 640;
const MW = 52;
const MH = 22;
const MGX = 5;
const SH = 5;
const ROWH = MH + SH + 5;
const ANCHOR: Record<Nid | 'root', { x: number; y: number }> = {
  root: { x: 660, y: 598 },
  c: { x: 150, y: 482 },
  d: { x: 450, y: 482 },
  a: { x: 760, y: 482 },
  b: { x: 1010, y: 482 },
  e: { x: 1220, y: 482 },
  cd: { x: 150, y: 300 },
  ca: { x: 420, y: 300 },
  da: { x: 690, y: 300 },
  db: { x: 950, y: 300 },
  ef: { x: 1220, y: 300 },
  cda: { x: 150, y: 130 },
};
const COLS = 3;

/** a node's registry at iteration 4: inherited modules first (root side), then its own */
const finalModules = (n: Nid) => nodeLineage(n).flatMap((x) => x.local);

/** the timeline at time τ: iteration (1..4), index of the node being visited (−1 = banner), phase in [0, 1) */
function at(time: number) {
  if (time >= TOTAL) return { it: 4, k: ORDER.length, phase: 1, done: true };
  const it = Math.floor(time / ITER_T) + 1;
  const u = time - (it - 1) * ITER_T;
  if (u < BANNER_T) return { it, k: -1, phase: u / BANNER_T, done: false };
  const v = (u - BANNER_T) / NODE_T;
  return { it, k: Math.floor(v), phase: v - Math.floor(v), done: false };
}

/** has node n finished iteration `it`'s event at time τ? */
function eventDone(n: Nid, it: number, cur: ReturnType<typeof at>) {
  if (cur.done) return true;
  if (it < cur.it) return true;
  if (it > cur.it) return false;
  const idx = ORDER.indexOf(n);
  return idx < cur.k || (idx === cur.k && cur.phase >= 0.62);
}

/** modules of node n (local), with how many revisions each has had so far */
function localState(n: Nid, cur: ReturnType<typeof at>) {
  const node = nodeById[n];
  const have = new Map<string, number>(); // module → revision count
  node.events.forEach((e, i) => {
    if (!eventDone(n, i + 1, cur)) return;
    if (e.kind === 'new') have.set(e.module, 0);
    else have.set(e.module, (have.get(e.module) ?? 0) + 1);
  });
  return have;
}

/** score of a benchmark setting as of time τ: H(it) once its node has solved iteration it */
function scoreAt(nodeId: Nid, scores: number[], cur: ReturnType<typeof at>) {
  let lvl = 0;
  for (let it = 1; it <= 4; it++) if (eventDone(nodeId, it, cur)) lvl = it;
  return { lvl, v: scores[lvl] };
}

function MiniMeans({ it }: { it: number }) {
  const { t } = useTokens();
  const W = 300;
  const H = 120;
  const x = (i: number) => 18 + (i / 4) * (W - 36);
  const y = (v: number) => H - 18 - ((v - 35) / 45) * (H - 34);
  const line = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const vis = (vals: number[]) => vals.slice(0, it + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Mean performance across RSI iterations (Figure 4)">
      {[40, 50, 60, 70, 80].map((v) => (
        <g key={v}>
          <line x1={18} x2={W - 18} y1={y(v)} y2={y(v)} stroke={t.rule} strokeWidth={0.8} />
          <text x={4} y={y(v) + 3} fill={t.ink3} style={{ fontSize: 8.5 }}>
            {v}
          </text>
        </g>
      ))}
      <line x1={18} x2={W - 18} y1={y(MEANS.codex)} y2={y(MEANS.codex)} stroke={t.ink3} strokeDasharray="3 3" strokeWidth={1} />
      <text x={W - 18} y={y(MEANS.codex) - 3} textAnchor="end" fill={t.ink3} style={{ fontSize: 8.5 }}>
        Codex {MEANS.codex}
      </text>
      <path d={line(MEANS.train)} fill="none" stroke={t.rule2} strokeWidth={1.2} />
      <path d={line(MEANS.unseen)} fill="none" stroke={t.rule2} strokeWidth={1.2} />
      <path d={line(vis(MEANS.train))} fill="none" stroke={t.accent} strokeWidth={2.4} strokeLinecap="round" />
      <path d={line(vis(MEANS.unseen))} fill="none" stroke={t.explorer} strokeWidth={2.4} strokeLinecap="round" />
      {[
        { vals: MEANS.train, c: t.accent, label: 'Train' },
        { vals: MEANS.unseen, c: t.explorer, label: 'Unseen' },
      ].map((s) => (
        <g key={s.label}>
          <circle cx={x(it)} cy={y(s.vals[it])} r={4.5} fill={s.c} stroke={t.surface} strokeWidth={1.5} />
          <text x={x(it) + (it > 2 ? -8 : 8)} y={y(s.vals[it]) + (s.label === 'Train' ? -7 : 13)} textAnchor={it > 2 ? 'end' : 'start'} fill={s.c} style={{ fontSize: 10.5, fontWeight: 760 }}>
            {s.label} {s.vals[it]}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fill={i === it ? t.ink : t.ink3} style={{ fontSize: 9, fontWeight: i === it ? 760 : 500 }}>
          {i === 0 ? 'H₀' : `it ${i}`}
        </text>
      ))}
    </svg>
  );
}

export default function HarnessTreeViz() {
  const { t, theme } = useTokens();
  const LP = useLegoPalette();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pick, setPick] = useState<Nid | null>(null);
  const timeRef = useRef(0);

  // the clock
  const running = playing && near && !reduce && time < TOTAL;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      timeRef.current = Math.min(TOTAL, timeRef.current + dt);
      setTime(timeRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  useEffect(() => {
    if (reduce) {
      timeRef.current = TOTAL;
      setTime(TOTAL);
    }
  }, [reduce]);

  // decode every level image once the player is near, so the panel can switch without a blank frame
  useEffect(() => {
    if (!near) return;
    CAP_NODES.forEach((n) =>
      [1, 2, 3, 4].forEach((it) => {
        const im = new Image();
        im.src = nodeLevel(n.id as Nid, it);
        im.decode?.().catch(() => undefined);
      })
    );
  }, [near]);

  const seek = useCallback((v: number) => {
    timeRef.current = Math.max(0, Math.min(TOTAL, v));
    setTime(timeRef.current);
  }, []);

  const cur = at(time);
  const visiting: Nid | null = cur.k >= 0 && cur.k < ORDER.length && !cur.done ? ORDER[cur.k] : null;
  const focus: Nid = pick ?? visiting ?? (cur.done ? 'cda' : 'c');
  const iterShown = cur.done ? 4 : cur.it;

  // per-node module bricks: inherited (from ancestors, as of now) then local
  const plates = useMemo(() => {
    const out: Record<Nid, { id: string; inherited: boolean; rev: number; fresh: number }[]> = {} as never;
    for (const n of CAP_NODES) {
      const id = n.id as Nid;
      const list: { id: string; inherited: boolean; rev: number; fresh: number }[] = [];
      for (const anc of nodeLineage(id)) {
        if (anc.id === 'root') continue;
        const st = localState(anc.id as Nid, cur);
        const mine = anc.id === id;
        // inherited copies only show once the child has been visited in this iteration (top-down)
        const childSeen = mine || cur.done || cur.it > 1 || ORDER.indexOf(id) < cur.k || (ORDER.indexOf(id) === cur.k && cur.phase > 0.15);
        if (!childSeen) continue;
        anc.local.forEach((m) => {
          if (!st.has(m)) return;
          // the brick that the current visit just created or revised
          let fresh = 0;
          if (mine && visiting === id) {
            const e = nodeById[id].events[cur.it - 1];
            if (e && e.module === m) fresh = Math.max(0, Math.min(1, (cur.phase - 0.45) / 0.25));
          }
          list.push({ id: m, inherited: !mine, rev: st.get(m)!, fresh });
        });
      }
      out[id] = list;
    }
    return out;
  }, [cur, visiting]);

  const brickXY = (n: Nid, m: string) => {
    const a = ANCHOR[n];
    const all = finalModules(n);
    const count = all.length;
    const i = all.indexOf(m);
    const rows = Math.ceil(Math.max(1, count) / COLS);
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const inRow = Math.min(COLS, count - r * COLS);
    const rowW = inRow * MW + (inRow - 1) * MGX;
    return { x: a.x - rowW / 2 + c * (MW + MGX), y: a.y - (rows - r) * ROWH + SH + 1 };
  };
  const plateW = (n: Nid) => Math.max(2, Math.min(COLS, finalModules(n).length)) * (MW + MGX) + MGX + 10;
  const plateTop = (n: Nid) => ANCHOR[n].y - Math.ceil(Math.max(1, finalModules(n).length) / COLS) * ROWH - 8;

  const completed = cur.done ? 4 : eventDone('cda', cur.it, cur) ? cur.it : cur.it - 1;
  const ev = visiting ? nodeById[visiting].events[cur.it - 1] : null;
  const status = visiting ? (cur.phase < 0.25 ? 'level' : cur.phase < 0.45 ? 'fail' : cur.phase < 0.7 ? 'evolve' : 'ok') : null;

  const fn = nodeById[focus];
  const benches = benchesOfNode(focus);
  const focusIt = visiting === focus ? cur.it : Math.max(1, [1, 2, 3, 4].filter((i) => eventDone(focus, i, cur)).pop() ?? 1);

  return (
    <div ref={ref} className="space-y-4">
      <figure className="figure-frame overflow-hidden p-4">
        {/* controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (time >= TOTAL) {
                  seek(0);
                  setPlaying(true);
                } else setPlaying((v) => !v);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-3.5 text-[13px] font-[680] text-paper"
            >
              <Icon icon={time >= TOTAL ? RepeatIcon : playing ? PauseIcon : PlayIcon} size={15} />
              {time >= TOTAL ? 'Replay' : playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                const nx = cur.k < 0 ? (cur.it - 1) * ITER_T + BANNER_T : (cur.it - 1) * ITER_T + BANNER_T + (cur.k + 1) * NODE_T;
                setPlaying(false);
                seek(nx + NODE_T * 0.99);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule bg-surface px-3 text-[13px] font-[640] text-ink-2 hover:text-ink"
            >
              <Icon icon={NextIcon} size={14} /> Step
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  seek(i * ITER_T - 0.001);
                }}
                className={`h-8 rounded-full px-3 text-[12.5px] font-[700] transition-colors ${i === cur.it && !cur.done ? 'bg-accent text-white' : i <= iterShown ? 'bg-accent-wash text-accent-ink' : 'bg-paper-2 text-ink-3'}`}
              >
                Iteration {i}
              </button>
            ))}
          </div>
        </div>

        <svg viewBox={`0 0 ${VW} ${VH}`} className="block h-auto w-full" role="img" aria-label="Explorer's Harness tree: eleven node Harnesses gain or revise one module per iteration">
          <defs>
            <filter id="ht-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          {/* edges */}
          {CAP_NODES.map((n) => {
            const id = n.id as Nid;
            const p = n.parent === 'root' ? 'root' : (n.parent as Nid);
            const A = ANCHOR[p];
            const B = ANCHOR[id];
            const y1 = p === 'root' ? A.y - 14 : plateTop(p) - 4;
            const y2 = B.y + 44;
            const lit = focus === id || nodeLineage(focus).some((x) => x.id === id);
            return (
              <path
                key={id}
                d={`M ${A.x} ${y1} C ${A.x} ${(y1 + y2) / 2}, ${B.x} ${(y1 + y2) / 2}, ${B.x} ${y2}`}
                fill="none"
                stroke={lit ? t.accent : t.rule2}
                strokeOpacity={lit ? 0.6 : 0.55}
                strokeWidth={lit ? 2 : 1.3}
              />
            );
          })}

          {/* plates */}
          {CAP_NODES.map((n) => {
            const id = n.id as Nid;
            const a = ANCHOR[id];
            const w = plateW(id);
            const vis = visiting === id;
            const sel = focus === id;
            return (
              <g key={id} onMouseEnter={() => setPick(id)} onMouseLeave={() => setPick(null)} onClick={() => setPick(id)} style={{ cursor: 'pointer' }}>
                {vis && <ellipse cx={a.x} cy={a.y - 20} rx={w * 0.62} ry={52} fill={t.accent} opacity={0.16} filter="url(#ht-glow)" />}
                <rect x={a.x - w / 2 - 8} y={a.y - 92} width={w + 16} height={150} rx={14} fill="transparent" />
                <rect x={a.x - w / 2} y={a.y} width={w} height={8} rx={3} fill={LP.plate} stroke={sel ? t.accent : 'none'} strokeWidth={1.4} />
                {Array.from({ length: Math.floor(w / 13) }, (_, i) => (
                  <rect key={i} x={a.x - w / 2 + 5 + i * 13} y={a.y - 2.5} width={7} height={3} rx={1} fill={LP.plate} />
                ))}
                <rect x={a.x - w / 2} y={a.y + 6.5} width={w} height={1.6} rx={0.8} fill={LP.plateEdge} />
                <text x={a.x} y={a.y + 24} textAnchor="middle" fill={sel ? t.accent : t.ink} style={{ fontSize: 12.5, fontWeight: 780 }}>
                  {n.path.join(' → ')}
                </text>
                <text x={a.x} y={a.y + 39} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.8, fontWeight: 560 }}>
                  {n.name}
                </text>
                {/* the visit: level → fail → evolve → success */}
                {vis && status && (
                  <g transform={`translate(${a.x - (status === 'evolve' ? 46 : 29)} ${plateTop(id) - 26})`}>
                    <rect width={status === 'evolve' ? 92 : 58} height={22} rx={11} fill={status === 'fail' ? t.bad : status === 'ok' ? t.good : status === 'evolve' ? t.ink : t.creator} />
                    <text x={(status === 'evolve' ? 92 : 58) / 2} y={15} textAnchor="middle" fill={status === 'evolve' ? t.paper : '#fff'} style={{ fontSize: 11, fontWeight: 760 }}>
                      {status === 'level' ? 'level' : status === 'fail' ? '✗ fail' : status === 'ok' ? '✓ solved' : ev ? (ev.kind === 'new' ? `+ ${ev.module}` : `${ev.module} rev.`) : ''}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* module bricks */}
          {CAP_NODES.map((n) => {
            const id = n.id as Nid;
            const list = plates[id];
            return list.map((m) => {
              const { x, y } = brickXY(id, m.id);
              const mod = moduleById[m.id];
              const c = t.caps[mod.cap];
              const drop = m.fresh > 0 && m.fresh < 1 && nodeById[id].events[cur.it - 1]?.kind === 'new' ? (1 - m.fresh) * -70 : 0;
              const glint = m.fresh > 0 && m.fresh < 1 && nodeById[id].events[cur.it - 1]?.kind === 'revised' ? Math.sin(m.fresh * Math.PI) : 0;
              return (
                <g key={`${id}-${m.id}`} transform={`translate(${x} ${y + drop})`} opacity={m.fresh > 0 && m.fresh < 0.05 ? 0 : 1}>
                  {[0, 1, 2].map((s) => (
                    <rect key={s} x={6 + s * 15} y={-SH + 0.5} width={10} height={SH + 0.5} rx={1.5} fill={m.inherited ? 'transparent' : c} stroke={m.inherited ? c : 'none'} strokeWidth={1} />
                  ))}
                  <rect width={MW} height={MH} rx={3.5} fill={m.inherited ? (theme === 'dark' ? t.surface2 : t.surface) : c} stroke={c} strokeWidth={m.inherited ? 1.4 : 0} />
                  {!m.inherited && <rect width={MW} height={MH * 0.4} rx={3.5} fill="#fff" opacity={0.2} />}
                  {glint > 0 && <rect x={-3} y={-3} width={MW + 6} height={MH + 6} rx={5} fill="none" stroke={t.ink} strokeOpacity={glint} strokeWidth={2} />}
                  <text x={MW / 2} y={MH / 2 + 4} textAnchor="middle" fill={m.inherited ? c : '#fff'} style={{ fontSize: 10.5, fontWeight: 780 }}>
                    {m.id}
                  </text>
                  {m.rev > 0 && !m.inherited && (
                    <g transform={`translate(${MW - 4} ${-4})`}>
                      <circle r={6.5} fill={t.ink} />
                      <text y={3.3} textAnchor="middle" fill={t.paper} style={{ fontSize: 8.5, fontWeight: 800 }}>
                        v{m.rev + 1}
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })}

          {/* the root */}
          <g transform={`translate(${ANCHOR.root.x} ${ANCHOR.root.y})`}>
            <rect x={-118} y={-14} width={236} height={28} rx={14} fill={t.ink} />
            <text y={4.5} textAnchor="middle" fill={t.paper} style={{ fontSize: 12.5, fontWeight: 720 }}>
              Base Harness H₀ · no learned module
            </text>
          </g>

          {/* iteration banner */}
          <AnimatePresence>
            {cur.k === -1 && !cur.done && (
              <motion.g key={`banner-${cur.it}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={VW / 2 - 160} y={112} width={320} height={56} rx={28} fill={t.accent} opacity={0.95} />
                <text x={VW / 2} y={148} textAnchor="middle" fill="#fff" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  Iteration {cur.it} · top-down pass
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* timeline */}
        <div className="mt-2 px-1">
          <div
            className="relative h-2 cursor-pointer rounded-full bg-paper-2"
            onClick={(e) => {
              const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              setPlaying(false);
              seek(((e.clientX - r.left) / r.width) * TOTAL);
            }}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${(time / TOTAL) * 100}%` }} />
            {[1, 2, 3].map((i) => (
              <span key={i} className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-surface" style={{ left: `${(i / 4) * 100}%` }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-3">
            <span className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-[3px]" style={{ background: t.caps.c }} /> learned at the node
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-[3px] border-[1.5px]" style={{ borderColor: t.caps.c }} /> inherited from its parent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-ink text-[8px] font-[800] text-paper">v2</span> revised
              </span>
            </span>
            <span>Module events: Appendix E.2 · scores: Table 7</span>
          </div>
        </div>
      </figure>

      {/* the node in focus */}
      <aside className="grid gap-5 rounded-[22px] border border-rule bg-surface p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[12px] font-[700] uppercase tracking-[0.1em] text-ink-3">{pick ? 'Selected node' : visiting ? `Iteration ${cur.it} · visiting` : 'Node'}</p>
            <p className="mt-1 text-[19px] font-[780] leading-tight text-ink">
              <span className="mr-2 text-accent">{pathLabel(focus)}</span>
              {fn.name}
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-paper-2">
            {/* cross-fade: the next level fades in over the previous one, never through an empty frame */}
            <AnimatePresence initial={false}>
              <motion.img
                key={`${focus}-${Math.max(1, focusIt)}`}
                src={nodeLevel(focus, Math.max(1, focusIt))}
                alt={`Level Creator built for ${pathLabel(focus)}, iteration ${Math.max(1, focusIt)}`}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.45, delay: 0.1 } }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </AnimatePresence>
            <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-0.5 text-[11.5px] font-[700] text-white">Creator’s level · iteration {Math.max(1, focusIt)}</span>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[12px] font-[700] text-ink-3">What this node learned, iteration by iteration</p>
          <ol className="space-y-1.5">
            {fn.events.map((e, i) => {
              const done = eventDone(focus, i + 1, cur);
              const m = moduleById[e.module];
              return (
                <li key={i} className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors ${i + 1 === focusIt && done ? 'bg-accent-wash' : ''}`} style={{ opacity: done ? 1 : 0.4 }}>
                  <span className="tabular mt-0.5 w-9 shrink-0 text-[11px] font-[760] text-ink-3">it {i + 1}</span>
                  <span className="grid h-5 shrink-0 place-items-center rounded-[5px] px-1.5 text-[10.5px] font-[800] text-white" style={{ background: t.caps[m.cap] }}>
                    {m.id}
                  </span>
                  <span className="leading-snug text-ink-2">
                    <span className="font-[700] text-ink">{e.kind === 'new' ? 'new module' : 'revised'}</span> · {m.name}
                  </span>
                </li>
              );
            })}
          </ol>
          {fn.parent !== 'root' && (
            <p className="mt-3 text-[12px] leading-snug text-ink-3">
              Inherits {nodeLineage(focus).slice(1, -1).flatMap((x) => x.local).join(', ')} from {pathLabel(fn.parent as Nid)} (outlined bricks).
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-1">
          {benches.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-[700] text-ink-3">Benchmarks at this node · H₀ → current</p>
              <ul className="space-y-1.5">
                {benches.flatMap((b) => {
                  const rows = b.split === 'both' ? [{ k: `${b.id}-s`, label: `${b.short ?? b.name} (sim.)`, sc: b.scores.it }, { k: `${b.id}-r`, label: `${b.short ?? b.name} (robot)`, sc: b.robot!.it }] : [{ k: b.id, label: b.short ?? b.name, sc: b.scores.it }];
                  return rows.map((r) => {
                    const sc = scoreAt(focus, r.sc as unknown as number[], cur);
                    return (
                      <li key={r.k} className="grid grid-cols-[minmax(0,1fr)_110px_34px] items-center gap-2 text-[12px]">
                        <span className="truncate text-ink-2">
                          {r.label}
                          {b.split === 'unseen' || r.k.endsWith('-r') ? <span className="ml-1 text-[10px] text-ink-3">unseen</span> : null}
                        </span>
                        <span className="relative h-2 rounded-full bg-paper-2">
                          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${r.sc[0]}%`, background: t.iters[0] }} />
                          <motion.span className="absolute inset-y-0 left-0 rounded-full" animate={{ width: `${sc.v}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} style={{ background: t.iters[Math.max(1, sc.lvl)] ?? t.accent, opacity: sc.lvl ? 1 : 0 }} />
                        </span>
                        <span className="tabular text-right font-[700] text-ink">{sc.v}</span>
                      </li>
                    );
                  });
                })}
              </ul>
            </div>
          )}
          {benches.length === 0 && <p className="text-[12.5px] text-ink-3">No benchmark ends at this node; Video-Index and Video-MME-v2 sit one level below, at e → f.</p>}
          <div className="mt-auto border-t border-rule pt-3">
            <p className="mb-1 text-[12px] font-[700] text-ink-3">Mean performance (Figure 4)</p>
            <MiniMeans it={completed} />
          </div>
        </div>
      </aside>
    </div>
  );
}

