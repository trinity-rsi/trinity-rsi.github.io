import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { CAP_NODES, benchesOfNode, moduleById, nodeById, nodeLineage, pathLabel, type NodeId } from '@/data/tree';
import { MEANS } from '@/data/results';
import { nodeLevel } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { Brick, BrickDefs, Plate } from './Bricks';
import { LockIcon, NextIcon, PauseIcon, PlayIcon, RepeatIcon } from '@hugeicons/core-free-icons';

/**
 * Explorer's Harness tree evolving over iterations 1–4 (Section 3.5, Figure 11, Appendix E.2).
 * Each iteration is one top-down pass over the fixed tree. At every node Creator's level is played,
 * the failing run turns into one module event (a new module or a revision, exactly as recorded in
 * Appendix E.2), and the next run solves the level. Children show their parent's modules as
 * inherited (outlined) bricks. Scores are Table 8. Drawn as in the film (promo/src/tree.tsx):
 * the same plates, bricks and layout, with Creator's level for every node along the top.
 */
type Nid = Exclude<NodeId, 'root'>;
export const ORDER: Nid[] = ['c', 'd', 'a', 'b', 'e', 'cd', 'ca', 'da', 'db', 'ef', 'cda'];
export const NODE_T = 1.05; // seconds per node visit
export const BANNER_T = 0.9; // iteration banner
export const ITER_T = BANNER_T + ORDER.length * NODE_T;
export const TOTAL = 4 * ITER_T;

const VB = { x: 30, y: 214, w: 1840, h: 848 }; // the film's 1920 × 1080 frame, cropped to the tree
const PW = 252; // plate
const MW = 76; // module brick
const MH = 30;
const SH = 7; // stud height
const GX = 6;
const CELL = 48; // row pitch
const PER = 3; // bricks per row
const ANCHOR: Record<Nid | 'root', { x: number; y: number }> = {
  root: { x: 960, y: 1032 },
  c: { x: 305, y: 890 },
  d: { x: 875, y: 890 },
  a: { x: 1190, y: 890 },
  b: { x: 1460, y: 890 },
  e: { x: 1730, y: 890 },
  cd: { x: 170, y: 640 },
  ca: { x: 440, y: 640 },
  da: { x: 740, y: 640 },
  db: { x: 1010, y: 640 },
  ef: { x: 1730, y: 640 },
  cda: { x: 170, y: 400 },
};
/* the node in focus, in the empty stretch between Hypothesis Tracking and Video Events (wide screens) */
const CARD = { x: 1150, y: 372, w: 446, h: 430 }; // ends above the bottom row's status tags
const pct = (v: number, o: number, s: number) => `${((v - o) / s) * 100}%`;
/* Creator's level for each node, in a strip along the top (left to right as on the tree) */
const TH = { w: 124, h: 88, y: 272, x0: 426, step: 130 };
const THUMBS: Nid[] = (Object.keys(ANCHOR) as (Nid | 'root')[]).filter((n): n is Nid => n !== 'root').sort((a, b) => ANCHOR[a].x - ANCHOR[b].x || ANCHOR[b].y - ANCHOR[a].y);

/** a node's registry at iteration 4: inherited modules first (root side), then its own */
export const finalModules = (n: Nid) => nodeLineage(n).flatMap((x) => x.local);
/** a node's own modules that its level record (Appendix E.2) gives no event for */
export const undated = (n: Nid) => nodeById[n].local.filter((m) => !nodeById[n].events.some((e) => e.module === m));

/** the timeline at time τ: iteration (1..4), index of the node being visited (−1 = banner), phase in [0, 1) */
export function at(time: number) {
  if (time >= TOTAL) return { it: 4, k: ORDER.length, phase: 1, done: true };
  const it = Math.floor(time / ITER_T) + 1;
  const u = time - (it - 1) * ITER_T;
  if (u < BANNER_T) return { it, k: -1, phase: u / BANNER_T, done: false };
  const v = (u - BANNER_T) / NODE_T;
  return { it, k: Math.floor(v), phase: v - Math.floor(v), done: false };
}

/** has node n finished iteration `it`'s event at time τ? */
export function eventDone(n: Nid, it: number, cur: ReturnType<typeof at>) {
  if (cur.done) return true;
  if (it < cur.it) return true;
  if (it > cur.it) return false;
  const idx = ORDER.indexOf(n);
  return idx < cur.k || (idx === cur.k && cur.phase >= 0.62);
}

/** modules of node n (local), with how many revisions each has had so far */
export function localState(n: Nid, cur: ReturnType<typeof at>) {
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
export function scoreAt(nodeId: Nid, scores: number[], cur: ReturnType<typeof at>) {
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
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Mean performance across RSI iterations, 28 Train and 18 Unseen benchmarks (Table 8)">
      {[40, 50, 60, 70, 80].map((v) => (
        <g key={v}>
          <line x1={18} x2={W - 18} y1={y(v)} y2={y(v)} stroke={t.rule} strokeWidth={0.8} />
          <text x={4} y={y(v) + 3} fill={t.ink3} style={{ fontSize: 8.5 }}>
            {v}
          </text>
        </g>
      ))}
      <path d={line(MEANS.train)} fill="none" stroke={t.rule2} strokeWidth={1.2} />
      <path d={line(MEANS.unseen18)} fill="none" stroke={t.rule2} strokeWidth={1.2} />
      <path d={line(vis(MEANS.train))} fill="none" stroke={t.accent} strokeWidth={2.4} strokeLinecap="round" />
      <path d={line(vis(MEANS.unseen18))} fill="none" stroke={t.explorer} strokeWidth={2.4} strokeLinecap="round" />
      {[
        { vals: MEANS.train, c: t.accent, label: 'Train' },
        { vals: MEANS.unseen18, c: t.explorer, label: 'Unseen' },
      ].map((s) => (
        <g key={s.label}>
          <circle cx={x(it)} cy={y(s.vals[it])} r={4.5} fill={s.c} stroke={t.surface} strokeWidth={1.5} />
          <text x={x(it) + (it > 2 ? -8 : 8)} y={y(s.vals[it]) + (s.label === 'Train' ? -7 : 13)} textAnchor={it > 2 ? 'end' : 'start'} fill={s.c} style={{ fontSize: 10.5, fontWeight: 760 }}>
            {s.label} {s.vals[it].toFixed(2)}
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

/** a node's benchmarks, H₀ against the score as of now (Table 8); SOON and CaP-X show simulation and robot */
export function BenchBars({ focus, cur, compact = false }: { focus: Nid; cur: ReturnType<typeof at>; compact?: boolean }) {
  const { t } = useTokens();
  return (
    <ul className={compact ? 'space-y-[2px]' : 'space-y-1.5'}>
      {benchesOfNode(focus).flatMap((b) => {
        const rows =
          b.split === 'both'
            ? [
                { k: `${b.id}-s`, label: `${b.short ?? b.name} (sim.)`, sc: b.scores.it },
                { k: `${b.id}-r`, label: `${b.short ?? b.name} (robot)`, sc: b.robot!.it },
              ]
            : [{ k: b.id, label: b.short ?? b.name, sc: b.scores.it }];
        return rows.map((r) => {
          const sc = scoreAt(focus, r.sc as unknown as number[], cur);
          return (
            <li key={r.k} className={`grid items-center gap-2 ${compact ? 'grid-cols-[minmax(0,1fr)_72px_30px] text-[11.5px] leading-[1.25]' : 'grid-cols-[minmax(0,1fr)_110px_34px] text-[12px]'}`}>
              <span className="truncate text-ink-2">
                {r.label}
                {b.split === 'unseen' || r.k.endsWith('-r') ? <span className="ml-1 text-[10px] text-ink-3">unseen</span> : null}
              </span>
              <span className={`relative rounded-full bg-paper-2 ${compact ? 'h-1.5' : 'h-2'}`}>
                <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${r.sc[0]}%`, background: t.iters[0] }} />
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full"
                  animate={{ width: `${sc.v}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  style={{ background: t.iters[Math.max(1, sc.lvl)] ?? t.accent, opacity: sc.lvl ? 1 : 0 }}
                />
              </span>
              <span className="tabular text-right font-[700] text-ink">{sc.v}</span>
            </li>
          );
        });
      })}
    </ul>
  );
}

export default function HarnessTreeViz() {
  const { t, theme } = useTokens();
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

  // phones: keep the node being visited in view, unless the reader is looking around
  const panRef = useRef<HTMLDivElement>(null);
  const touched = useRef(0);
  useEffect(() => {
    const el = panRef.current;
    const n = pick ?? visiting;
    if (!el || !n || el.scrollWidth <= el.clientWidth + 4 || performance.now() - touched.current < 3500) return;
    const x = ((ANCHOR[n].x - VB.x) / VB.w) * (el.scrollWidth - 32) + 16;
    el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: 'smooth' });
  }, [visiting, pick]);
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
          // a module without a recorded event (M29) appears with the iteration-4 tree (Figure 11)
          if (!st.has(m)) {
            if (cur.done && !anc.events.some((e) => e.module === m)) list.push({ id: m, inherited: !mine, rev: 0, fresh: 0 });
            return;
          }
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

  // the film's stacking: rows fill bottom-up, three bricks a row, every slot fixed from the start
  const brickXY = (n: Nid, m: string) => {
    const a = ANCHOR[n];
    const all = finalModules(n);
    const i = all.indexOf(m);
    const row = Math.floor(i / PER);
    const inRow = Math.min(PER, all.length - row * PER);
    const rowW = inRow * MW + (inRow - 1) * GX;
    return { x: a.x - rowW / 2 + (i % PER) * (MW + GX), y: a.y - MH - 1 - row * CELL };
  };
  const stackTop = (n: Nid) => {
    const k = finalModules(n).length;
    return k <= 0 ? ANCHOR[n].y - 4 : ANCHOR[n].y - MH - 1 - (Math.ceil(k / PER) - 1) * CELL - SH - 4;
  };
  const labelLines = (n: Nid) => {
    const name = nodeById[n].name;
    const room = PW - 18 - nodeById[n].path.length * 26;
    if (name.length * 8.2 <= room) return [name];
    const words = name.split(' ');
    let best = [name];
    let score = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const sc = Math.max(a.length * 8.2 - room, b.length * 8.2 - (PW - 8));
      if (sc < score) {
        score = sc;
        best = [a, b];
      }
    }
    return best;
  };
  const labelBottom = (n: Nid) => ANCHOR[n].y + (labelLines(n).length > 1 ? 66 : 46);

  const completed = cur.done ? 4 : eventDone('cda', cur.it, cur) ? cur.it : cur.it - 1;
  const ev = visiting ? nodeById[visiting].events[cur.it - 1] : null;
  const status = visiting ? (cur.phase < 0.25 ? 'level' : cur.phase < 0.45 ? 'fail' : cur.phase < 0.7 ? 'evolve' : 'ok') : null;

  const fn = nodeById[focus];
  const benches = benchesOfNode(focus);
  const focusIt = visiting === focus ? cur.it : Math.max(1, [1, 2, 3, 4].filter((i) => eventDone(focus, i, cur)).pop() ?? 1);

  return (
    <div ref={ref} className="space-y-4">
      <figure className="figure-frame overflow-hidden p-4">
        {/* controls, and the film's counter: the model stays frozen, the means go up */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex w-full items-center gap-1.5 sm:ml-1 sm:w-auto">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    // iteration 4 ends in the finished tree of Figure 11
                    seek(i === 4 ? TOTAL : i * ITER_T - 0.001);
                  }}
                  className={`h-8 flex-1 rounded-full px-3 text-[12.5px] font-[700] transition-colors sm:flex-none ${i === cur.it && !cur.done ? 'bg-accent text-white' : i <= iterShown ? 'bg-accent-wash text-accent-ink' : 'bg-paper-2 text-ink-3'}`}
                >
                  <span className="hidden sm:inline">Iteration </span>
                  <span className="sm:hidden">It. </span>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[16px] border border-rule bg-surface px-3 py-2 shadow-[0_14px_30px_-24px_rgba(20,24,40,0.5)]">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#2a3150,#12141c)] text-[#f3f4f7] shadow-sm">
              <span className="font-serif text-[18px] italic leading-none">
                f<sub className="text-[11px]">θ</sub>
              </span>
              <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-surface text-ink-3 shadow">
                <Icon icon={LockIcon} size={10} stroke={2.4} />
              </span>
            </span>
            <span>
              <span className="block text-[11px] font-[700] text-ink-3">Iteration</span>
              <span className="tabular block text-[20px] font-[800] leading-none text-ink">
                {cur.done ? 4 : cur.it}
                <span className="text-[13px] font-[700] text-ink-3"> / 4</span>
              </span>
            </span>
            <span className="h-9 w-px bg-rule" aria-hidden />
            <span className="tabular text-right">
              <span className="block text-[11px] font-[700] text-ink-3">Train</span>
              <span className="block text-[17px] font-[800] leading-none text-accent">{MEANS.train[completed].toFixed(2)}</span>
            </span>
            <span className="tabular text-right">
              <span className="block text-[11px] font-[700] text-ink-3">Unseen</span>
              <span className="block text-[17px] font-[800] leading-none text-explorer">{MEANS.unseen18[completed].toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* on a phone the tree keeps a readable size and scrolls sideways */}
        <p className="px-1 pb-2 text-[12px] font-[600] text-ink-3 md:hidden">The view follows the node being trained; swipe to look around</p>
        <div
          ref={panRef}
          className="-mx-4 overflow-x-auto overscroll-x-contain px-4 md:mx-0 md:overflow-visible md:px-0"
          onPointerDown={() => (touched.current = performance.now())}
          onTouchStart={() => (touched.current = performance.now())}
        >
        <div className="relative">
        <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="block h-auto w-full min-w-[1280px] md:min-w-0" role="img" aria-label="Explorer's Harness tree: eleven node Harnesses gain or revise one module per iteration">
          <BrickDefs id="ht" />
          <defs>
            <filter id="ht-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
            {THUMBS.map((n, i) => (
              <clipPath key={n} id={`ht-th-${n}`}>
                <rect x={TH.x0 + i * TH.step} y={TH.y} width={TH.w} height={TH.h} rx={10} />
              </clipPath>
            ))}
          </defs>

          {/* Creator's level for every node, along the top; the node being visited lights up */}
          {THUMBS.map((n, i) => {
            const x = TH.x0 + i * TH.step;
            const lvl = visiting === n ? cur.it : Math.max(1, [1, 2, 3, 4].filter((k) => eventDone(n, k, cur)).pop() ?? 1);
            const on = visiting === n || focus === n;
            return (
              <g key={n} onMouseEnter={() => setPick(n)} onMouseLeave={() => setPick(null)} onClick={() => setPick(n)} style={{ cursor: 'pointer' }}>
                <rect x={x - 2} y={TH.y - 2} width={TH.w + 4} height={TH.h + 4} rx={12} fill={on ? t.accent : t.rule} />
                <image href={nodeLevel(n, lvl)} x={x} y={TH.y} width={TH.w} height={TH.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#ht-th-${n})`} opacity={on ? 1 : 0.82} />
                <g transform={`translate(${x + 6} ${TH.y + TH.h - 24})`}>
                  {nodeById[n].path.map((c, k) => (
                    <g key={c} transform={`translate(${k * 19} 0)`}>
                      <rect width={17} height={17} rx={4.5} fill={t.caps[c]} />
                      <text x={8.5} y={12.5} textAnchor="middle" fill="#fff" style={{ fontSize: 11, fontWeight: 800 }}>
                        {c}
                      </text>
                    </g>
                  ))}
                </g>
              </g>
            );
          })}

          {/* edges: up from a node's stack to under its child's label */}
          {CAP_NODES.map((n) => {
            const id = n.id as Nid;
            const p = n.parent === 'root' ? 'root' : (n.parent as Nid);
            const A = ANCHOR[p];
            const B = ANCHOR[id];
            const y1 = p === 'root' ? A.y - 18 : stackTop(p) - 2;
            const y2 = labelBottom(id) + 4;
            const lit = focus === id || nodeLineage(focus).some((x) => x.id === id);
            const d = `M ${A.x} ${y1} C ${A.x} ${(y1 + y2) / 2}, ${B.x} ${(y1 + y2) / 2}, ${B.x} ${y2}`;
            return (
              <g key={id}>
                <path d={d} fill="none" stroke={t.rule2} strokeWidth={3} strokeLinecap="round" />
                {lit && <path d={d} fill="none" stroke={t.accent} strokeWidth={4.5} strokeLinecap="round" opacity={0.55} />}
              </g>
            );
          })}

          {/* plates and labels */}
          {CAP_NODES.map((n) => {
            const id = n.id as Nid;
            const a = ANCHOR[id];
            const vis = visiting === id;
            const sel = focus === id;
            const lines = labelLines(id);
            const x0 = a.x - PW / 2;
            return (
              <g key={id} onMouseEnter={() => setPick(id)} onMouseLeave={() => setPick(null)} onClick={() => setPick(id)} style={{ cursor: 'pointer' }}>
                {vis && <ellipse cx={a.x} cy={a.y - 40} rx={PW * 0.62} ry={70} fill={t.accent} opacity={0.14} filter="url(#ht-glow)" />}
                <rect x={x0 - 10} y={stackTop(id) - 10} width={PW + 20} height={labelBottom(id) - stackTop(id) + 16} rx={16} fill="transparent" />
                {sel && <rect x={x0 - 8} y={a.y + 14} width={PW + 16} height={lines.length > 1 ? 60 : 40} rx={12} fill={t.accent} opacity={0.1} />}
                <Plate x={x0} y={a.y} w={PW} h={10} />
                {n.path.map((c, i) => (
                  <g key={c} transform={`translate(${x0 + 3 + i * 26} ${a.y + 22})`}>
                    <rect width={22} height={22} rx={6} fill={t.caps[c]} />
                    <rect width={22} height={9} rx={6} fill="#fff" opacity={0.18} />
                    <text x={11} y={16} textAnchor="middle" fill="#fff" style={{ fontSize: 13.5, fontWeight: 800 }}>
                      {c}
                    </text>
                  </g>
                ))}
                <text x={x0 + 3 + n.path.length * 26 + 4} y={a.y + 39} fill={sel ? t.accent : t.ink} style={{ fontSize: 15.5, fontWeight: 720 }}>
                  {lines[0]}
                </text>
                {lines[1] && (
                  <text x={x0 + 3} y={a.y + 60} fill={sel ? t.accent : t.ink} style={{ fontSize: 15.5, fontWeight: 720 }}>
                    {lines[1]}
                  </text>
                )}
                {/* the visit: level → fail → evolve → solved */}
                {vis && status && (
                  <g transform={`translate(${a.x} ${stackTop(id) - 22})`}>
                    {(() => {
                      const label = status === 'level' ? 'level' : status === 'fail' ? '✗ fail' : status === 'ok' ? '✓ solved' : ev ? (ev.kind === 'new' ? `+ ${ev.module}` : `${ev.module} rev.`) : '';
                      const w = Math.max(64, label.length * 9.5 + 26);
                      const bg = status === 'fail' ? t.bad : status === 'ok' ? t.good : status === 'evolve' ? t.ink : t.creator;
                      return (
                        <>
                          <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={bg} />
                          <text y={5.5} textAnchor="middle" fill={status === 'evolve' ? t.paper : '#fff'} style={{ fontSize: 15, fontWeight: 760 }}>
                            {label}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}

          {/* module bricks: owned ones solid, inherited ones outlined */}
          {CAP_NODES.map((n) => {
            const id = n.id as Nid;
            return plates[id].map((m) => {
              const { x, y } = brickXY(id, m.id);
              const mod = moduleById[m.id];
              const c = t.caps[mod.cap];
              const isNew = nodeById[id].events[cur.it - 1]?.kind === 'new';
              const drop = m.fresh > 0 && m.fresh < 1 && isNew ? -(1 - m.fresh) * (1 - m.fresh) * 110 : 0;
              const glint = m.fresh > 0 && m.fresh < 1 && !isNew ? Math.sin(m.fresh * Math.PI) : 0;
              return (
                <g key={`${id}-${m.id}`} transform={`translate(0 ${drop})`} opacity={m.fresh > 0 && m.fresh < 0.05 ? 0 : 1}>
                  <Brick x={x} y={y} w={MW} h={MH} color={c} label={m.id} labelSize={15} studs={3} outline={m.inherited} glow={glint} glowColor={c} defs="ht" shadow={!m.inherited} />
                  {m.rev > 0 && !m.inherited && (
                    <g transform={`translate(${x + MW - 4} ${y - 4})`}>
                      <circle r={10} fill={t.ink} stroke={t.surface} strokeWidth={2} />
                      <text y={4} textAnchor="middle" fill={t.paper} style={{ fontSize: 11, fontWeight: 800 }}>
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
            <rect x={-172} y={-19} width={344} height={38} rx={19} fill={t.ink} filter="url(#ht-sh)" />
            <text y={6} textAnchor="middle" fill={t.paper} style={{ fontSize: 16.5, fontWeight: 720 }}>
              Base Harness H₀ · no learned module
            </text>
          </g>

          {/* iteration banner */}
          <AnimatePresence>
            {cur.k === -1 && !cur.done && (
              <motion.g key={`banner-${cur.it}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={925 - 220} y={430} width={440} height={74} rx={37} fill={t.accent} opacity={0.95} filter="url(#ht-sh)" />
                <text x={925} y={478} textAnchor="middle" fill="#fff" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  Iteration {cur.it} · top-down pass
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* the node in focus, inside the figure, so the tree and its detail are seen together */}
        <div className="absolute hidden xl:block" style={{ left: pct(CARD.x, VB.x, VB.w), top: pct(CARD.y, VB.y, VB.h), width: `${(CARD.w / VB.w) * 100}%`, height: `${(CARD.h / VB.h) * 100}%` }}>
          <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-rule bg-surface/95 px-3.5 py-3 shadow-[0_26px_54px_-38px_rgba(20,24,40,0.6)] backdrop-blur">
            <p className="text-[10.5px] font-[760] uppercase tracking-[0.11em] text-ink-3">{pick ? 'Selected node' : visiting ? `Iteration ${cur.it} · visiting` : 'Node'}</p>
            <p className="mt-1 flex items-start gap-2 text-[14.5px] font-[780] leading-[1.22] text-ink">
              <span className="flex shrink-0 gap-[3px] pt-[1px]">
                {fn.path.map((c) => (
                  <span key={c} className="grid h-[18px] w-[18px] place-items-center rounded-[5px] text-[11px] font-[800] text-white" style={{ background: t.caps[c] }}>
                    {c}
                  </span>
                ))}
              </span>
              <span className="line-clamp-2">{fn.name}</span>
            </p>
            {(() => {
              const i = Math.max(1, focusIt);
              const e = fn.events[i - 1];
              const done = eventDone(focus, i, cur);
              const m = e ? moduleById[e.module] : null;
              return (
                m && (
                  <div className="mt-2 border-t border-rule pt-2">
                    <p className="flex items-start gap-2 text-[11.5px] leading-[1.35] text-ink-2" style={{ opacity: done ? 1 : 0.55 }}>
                      <span className="tabular mt-px shrink-0 text-[10.5px] font-[760] leading-[18px] text-ink-3">it {i}</span>
                      <span className="mt-px grid h-[18px] shrink-0 place-items-center rounded-[5px] px-1.5 text-[10.5px] font-[800] text-white" style={{ background: t.caps[m.cap] }}>
                        {m.id}
                      </span>
                      <span className="line-clamp-2">
                        <span className="font-[700] text-ink">{e.kind === 'new' ? 'new module' : 'revised'}</span> · {m.name}
                      </span>
                    </p>
                    {cur.done &&
                      undated(focus).map((u) => (
                        <p key={u} className="mt-1 flex items-center gap-2 text-[11px] leading-[1.35] text-ink-3">
                          <span className="grid h-[16px] shrink-0 place-items-center rounded-[5px] px-1.5 text-[10px] font-[800] text-white" style={{ background: t.caps[moduleById[u].cap] }}>
                            {u}
                          </span>
                          <span className="truncate">also in the iteration-4 tree (Fig. 11), no recorded event</span>
                        </p>
                      ))}
                  </div>
                )
              );
            })()}
            <div className="mt-2 min-h-0 flex-1 border-t border-rule pt-2">
              {benches.length > 0 ? (
                <>
                  <p className="mb-1 text-[10.5px] font-[700] text-ink-3">Benchmarks here · H₀ → now</p>
                  <BenchBars focus={focus} cur={cur} compact />
                </>
              ) : (
                <p className="text-[12px] leading-snug text-ink-3">No benchmark ends at this node; Video-Index and Video-MME-v2 sit one level below, at e → f.</p>
              )}
            </div>
          </div>
        </div>
        </div>
        </div>

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
            <span>Module events: Appendix E.2 · scores: Table 8</span>
          </div>
        </div>
      </figure>

      {/* the node in focus */}
      <aside className="grid gap-5 rounded-[22px] border border-rule bg-surface p-4 md:grid-cols-2 xl:hidden">
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
          {undated(focus).length > 0 && (
            <p className="mt-3 text-[12px] leading-snug text-ink-3">
              {undated(focus).join(', ')} {undated(focus).length > 1 ? 'are' : 'is'} in the iteration-4 tree (Figure 11) without a recorded event.
            </p>
          )}
          {fn.parent !== 'root' && (
            <p className="mt-3 text-[12px] leading-snug text-ink-3">
              Inherits {nodeLineage(focus).slice(1, -1).flatMap((x) => x.local).join(', ')} from {pathLabel(fn.parent as Nid)} (outlined bricks).
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:col-span-2">
          {benches.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-[700] text-ink-3">Benchmarks at this node · H₀ → current</p>
              <BenchBars focus={focus} cur={cur} />
            </div>
          )}
          {benches.length === 0 && <p className="text-[12.5px] text-ink-3">No benchmark ends at this node; Video-Index and Video-MME-v2 sit one level below, at e → f.</p>}
          <div className="mt-auto border-t border-rule pt-3">
            <p className="mb-1 text-[12px] font-[700] text-ink-3">Mean performance · 28 Train, 18 Unseen (Table 8)</p>
            <MiniMeans it={completed} />
          </div>
        </div>
      </aside>
    </div>
  );
}

