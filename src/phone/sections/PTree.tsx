import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import Icon from '@/components/ui/Icon';
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { BENCHES, CAPS, CAP_NODES, DOMAINS, FAMILIES, benchesNeeding, capById, domainById, familyById, nodeById, nodeLineage, type Bench, type NodeId } from '@/data/tree';
import { PAPER_FIGS } from '@/data/media';
import PaperFigure from '@/components/ui/PaperFigure';
import LatticeLoader from '@/components/reactbits/LatticeLoader/LatticeLoader';
import ThoughtLine from '@/components/reactbits/ThoughtLine/ThoughtLine';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';
import More from '../ui/More';
import evolverCollect from '@/assets/cats/evolver-collect.webp';
import explorerCat from '@/assets/cats/explorer-explore.webp';
import evolverDiagnose from '@/assets/cats/evolver-diagnose.webp';
import evolverCat from '@/assets/cats/evolver.webp';

/**
 * Stages 1 and 2 on a phone: the 44 benchmark bricks leave their task tree (five domains, fifteen
 * family plates) and build the capability tree, drawn top-down like a file tree so it fits the
 * screen's height instead of its width. Four steps, as on the desktop page:
 *   0  task tree          benchmarks on their family plates, under five domains
 *   1  world exploration  Explorer runs H0 on the training benchmarks (a bar: the H0 score, Table 8)
 *   2  requirements       each training brick's studs turn into the capabilities it requires
 *   3  capability tree    the training bricks fly to their node, depth by depth; the unseen follow
 * The drawn stage S glides between steps; every brick is a pure function of S, moved by transform.
 */
const STEPS = [
  {
    stage: 'Stage 1',
    title: 'Benchmark organization',
    who: 'Evolver',
    cat: evolverCollect,
    text: 'Web search across research benchmarks, AI competitions, human contests, game communities and professional practice yields 44 benchmarks. Each is normalized into a specification of goals, observations, actions, feedback, completion criteria and budgets: five domains, fifteen task families, and a training / unseen split fixed before capability induction.',
  },
  {
    stage: 'Stage 1',
    title: 'World exploration',
    who: 'Explorer',
    cat: explorerCat,
    text: 'Explorer collects trajectories from sampled training instances with the Base Harness H₀ under fixed settings. Only training records support capability-tree construction, world generation, module learning and Router training; completed runs are retained, and hash-chain checks verify the execution records.',
  },
  {
    stage: 'Stage 2',
    title: 'Requirement organization',
    who: 'Evolver',
    cat: evolverDiagnose,
    text: 'Using training-task specifications and trajectories, independent agents propose capability categories, a judge consolidates them, and reviewers check definitions, evidence, assignments and coverage: six capabilities and thirty defect types. Every training task receives a fixed requirement set.',
  },
  {
    stage: 'Stage 2',
    title: 'The capability tree',
    who: 'Evolver',
    cat: evolverCat,
    text: 'Sorted in a fixed order, each training task’s requirement set becomes a path, and a trie merges common prefixes across domains: eleven nodes below the root. The unseen benchmarks are placed on the fixed tree afterwards, for evaluation only. An edge adds a capability; it does not say one depends on another.',
  },
];

/* ------------------------------------------------------------------ */
/* layout: both trees for a given width                                */
/* ------------------------------------------------------------------ */
type XY = { x: number; y: number };
const ROOT_H = 24;
const SPINE = 6;
const IND = 16; // the task tree's domains sit right of its spine
const DEPTH_X = (d: number) => 16 + (d - 1) * 15;
const TILE = 15;
const LABEL_W = DEPTH_X(3) + 3 * (TILE + 2) + 6;

const heldOut = (b: Bench) => b.split === 'unseen';

function buildLayout(W: number) {
  const P = Math.max(28, Math.min(32, Math.floor((W - LABEL_W) / 7)));
  const BW = P - 4;
  const BH = Math.round(BW * 0.62);
  const SH = Math.max(3, Math.round(BH * 0.22));

  /* ---- task tree: domain headers, then family plates that wrap */
  const LINE = SH + BH + 6 + 6;
  const taskPos: Record<string, XY> = {};
  const headers: { id: (typeof DOMAINS)[number]['id']; y: number; count: number }[] = [];
  const plates: { x: number; y: number; w: number }[] = [];
  let y = ROOT_H + 14;
  for (const d of DOMAINS) {
    headers.push({ id: d.id, y, count: BENCHES.filter((b) => b.domain === d.id).length });
    let lineTop = y + 20;
    let x = IND;
    for (const f of FAMILIES.filter((q) => q.domain === d.id)) {
      const ids = BENCHES.filter((b) => b.family === f.id).map((b) => b.id);
      const pw = (ids.length - 1) * P + BW + 6;
      if (x > IND && x + pw > W) {
        x = IND;
        lineTop += LINE;
      }
      ids.forEach((id, i) => (taskPos[id] = { x: x + 3 + i * P, y: lineTop + SH }));
      plates.push({ x, y: lineTop + SH + BH + 1, w: pw });
      x += pw + 6;
    }
    y = lineTop + LINE + 4;
  }
  const taskH = y - 6;

  /* ---- capability tree: one row per node, depth-first, bricks to the right of the path */
  const RY = SH + BH + 10;
  const capPos: Record<string, XY> = {};
  const rows: { id: NodeId; depth: number; y: number; cy: number; x0: number; parent: NodeId }[] = [];
  let ry = ROOT_H + 16;
  for (const n of CAP_NODES) {
    const depth = n.path.length;
    const own = BENCHES.filter((b) => b.node === n.id);
    const ordered = [...own.filter((b) => !heldOut(b)), ...own.filter(heldOut)];
    ordered.forEach((b, j) => (capPos[b.id] = { x: LABEL_W + j * P, y: ry + SH }));
    rows.push({ id: n.id, depth, y: ry, cy: ry + SH + BH / 2, x0: DEPTH_X(depth), parent: n.parent! });
    ry += RY;
  }
  const capH = ry - 8;

  // when each brick takes off (in stage units): the training benchmarks build the tree depth by
  // depth, top to bottom within a depth; the unseen ones follow once the tree is fixed
  const depth = (b: Bench) => nodeById[b.node].path.length;
  const order = [...BENCHES].sort((a, b) => depth(a) - depth(b) || capPos[a.id].y - capPos[b.id].y || capPos[a.id].x - capPos[b.id].x);
  const start: Record<string, number> = {};
  const spread = (ids: string[], [w0, w1]: [number, number]) => ids.forEach((id, i) => (start[id] = ids.length > 1 ? w0 + (i / (ids.length - 1)) * (w1 - w0 - FLY) : w0));
  [1, 2, 3].forEach((dd) => spread(order.filter((b) => !heldOut(b) && depth(b) === dd).map((b) => b.id), DEPTH_WIN[dd]));
  spread(order.filter(heldOut).map((b) => b.id), UNSEEN_WIN);
  // requirements arrive in a wave down the task tree
  const wave: Record<string, number> = {};
  const byTask = [...BENCHES].sort((a, b) => taskPos[a.id].y - taskPos[b.id].y || taskPos[a.id].x - taskPos[b.id].x);
  byTask.forEach((b, i) => (wave[b.id] = i / (byTask.length - 1)));

  return { P, BW, BH, SH, taskPos, headers, plates, taskH, capPos, rows, capH, H: Math.max(taskH, capH), start, wave };
}
type Layout = ReturnType<typeof buildLayout>;

/* ------------------------------------------------------------------ */
/* the choreography, as functions of the stage S in [0, 3]             */
/* ------------------------------------------------------------------ */
const DEPTH_WIN: Record<number, [number, number]> = { 1: [2.14, 2.42], 2: [2.32, 2.58], 3: [2.48, 2.66] };
const UNSEEN_WIN: [number, number] = [2.68, 2.98];
const FLY = 0.14;
const SEG_SECONDS = [2.6, 1.9, 3.8];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const curves = (S: number) => ({
  sweep: clamp01((S - 0.06) / 0.86),
  sweepOn: smooth(0.01, 0.08, S) * (1 - smooth(0.88, 0.97, S)),
  dim: smooth(0, 0.22, S),
  bars: 1 - smooth(2.0, 2.12, S),
  task: 1 - smooth(2.02, 2.16, S),
  cap: smooth(2.08, 2.2, S),
  capsUnseen: smooth(2.9, 2.99, S),
});
const nodeIn = (depth: number, S: number) => smooth(DEPTH_WIN[depth][0] - 0.04, DEPTH_WIN[depth][0] + 0.05, S);
const flight = (L: Layout, id: string, S: number) => easeInOut(clamp01((S - L.start[id]) / FLY));

function mixHex(hex: string, w: string, k: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(w);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

/* ------------------------------------------------------------------ */
/* a brick                                                              */
/* ------------------------------------------------------------------ */
type Refs = { el: HTMLDivElement | null; studs: SVGGElement | null; caps: SVGGElement | null; bar: SVGRectElement | null; last: string };

const BrickEl = memo(function BrickEl({ b, L, fill, light, dark, state, refs }: { b: Bench; L: Layout; fill: string; light: string; dark: boolean; state: 'none' | 'on' | 'dim'; refs: Refs }) {
  const { t } = useTokens();
  const { BW, BH, SH } = L;
  const unseen = heldOut(b);
  const split = b.split === 'both';
  const body = unseen ? light : fill;
  const path = nodeById[b.node].path;
  const icon = unseen ? (dark ? 'rgba(255,255,255,0.82)' : 'rgba(22,26,38,0.72)') : '#ffffff';
  const sw = Math.min(8, BW / 4);
  return (
    <div
      ref={(el) => void (refs.el = el)}
      className="absolute left-0 top-0"
      style={{ width: BW, height: BH + SH, transformOrigin: `${BW / 2}px ${SH + BH / 2}px`, willChange: 'transform' }}
      data-bench={b.id}
    >
      <div style={{ opacity: state === 'dim' ? 0.22 : 1, transition: 'opacity .3s' }}>
      <svg viewBox={`0 ${-SH} ${BW} ${BH + SH}`} width={BW} height={BH + SH} className="block overflow-visible" aria-hidden>
        <g ref={(g) => void (refs.studs = g)}>
          {[0.27, 0.73].map((u) => (
            <rect key={u} x={BW * u - sw / 2} y={-SH} width={sw} height={SH + 2} rx={1.6} fill={body} />
          ))}
        </g>
        <g ref={(g) => void (refs.caps = g)} opacity={0}>
          {path.map((c, i) => {
            const cw = Math.min(8.5, BW / path.length - 3);
            const cx = (BW * (i + 0.5)) / path.length;
            return <rect key={c} x={cx - cw / 2} y={-SH - 1.5} width={cw} height={SH + 3.5} rx={1.8} fill={t.caps[c]} />;
          })}
        </g>
        <rect width={BW} height={BH} rx={3.5} fill={body} stroke={state === 'on' ? t.ink : unseen ? fill : 'none'} strokeOpacity={state === 'on' ? 1 : 0.55} strokeWidth={state === 'on' ? 2 : 1} />
        {split && <path d={`M ${BW / 2} 0 H ${BW - 3.5} Q ${BW} 0 ${BW} 3.5 V ${BH - 3.5} Q ${BW} ${BH} ${BW - 3.5} ${BH} H ${BW / 2} Z`} fill={light} />}
        <rect width={BW} height={BH * 0.4} rx={3.5} fill="#ffffff" opacity={0.2} />
        <rect y={BH - 2.5} width={BW} height={2.5} rx={1.2} fill="#000" opacity={0.13} />
        <rect ref={(r) => void (refs.bar = r)} x={3} y={BH - 4.2} width={0} height={2.4} rx={1.2} fill={split ? '#1d2230' : '#ffffff'} opacity={0.85} />
      </svg>
      <span className="pointer-events-none absolute left-0 grid place-items-center" style={{ top: SH, width: BW, height: BH - 2 }}>
        <HugeiconsIcon icon={b.icon} size={Math.round(BH * 0.62)} color={split ? '#ffffff' : icon} strokeWidth={2} />
      </span>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* the figure                                                           */
/* ------------------------------------------------------------------ */
type Pick = { kind: 'bench'; id: string } | { kind: 'node'; id: NodeId } | null;
type View = { explored: boolean; organized: boolean };

function Figure({ L, step, onRest, pick, setPick, onView }: { L: Layout; step: number; onRest: (s: number) => void; pick: Pick; setPick: (p: Pick) => void; onView: (v: View) => void }) {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const dark = theme === 'dark';
  const S = useRef(step);
  const bricks = useRef<Record<string, Refs>>({});
  const taskLayer = useRef<HTMLDivElement>(null);
  const capRows = useRef<Record<string, SVGGElement | null>>({});
  const rootTask = useRef<HTMLSpanElement>(null);
  const rootCap = useRef<HTMLSpanElement>(null);
  const sweepEl = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ explored: false, organized: false });
  const onRestRef = useRef(onRest);
  onRestRef.current = onRest;
  const onViewRef = useRef(onView);
  onViewRef.current = onView;
  BENCHES.forEach((b) => (bricks.current[b.id] ??= { el: null, studs: null, caps: null, bar: null, last: '' }));

  const paint = useCallback(
    (s: number) => {
      const c = curves(s);
      if (taskLayer.current) {
        taskLayer.current.style.opacity = c.task.toFixed(3);
        taskLayer.current.style.visibility = c.task > 0.001 ? 'visible' : 'hidden';
      }
      if (rootTask.current) rootTask.current.style.opacity = (1 - c.cap).toFixed(3);
      if (rootCap.current) rootCap.current.style.opacity = c.cap.toFixed(3);
      for (const r of L.rows) {
        const g = capRows.current[r.id];
        if (!g) continue;
        const k = nodeIn(r.depth, s);
        g.style.opacity = k.toFixed(3);
        g.style.transform = `translateY(${((1 - k) * 8).toFixed(2)}px)`;
      }
      const sweepY = ROOT_H + c.sweep * (L.taskH - ROOT_H);
      if (sweepEl.current) {
        sweepEl.current.style.opacity = c.sweepOn.toFixed(3);
        sweepEl.current.style.visibility = c.sweepOn > 0.01 ? 'visible' : 'hidden';
        sweepEl.current.style.transform = `translate3d(0, ${(sweepY - 22).toFixed(1)}px, 0)`;
      }
      for (const b of BENCHES) {
        const r = bricks.current[b.id];
        if (!r.el) continue;
        const A = L.taskPos[b.id];
        const C = L.capPos[b.id];
        const k = flight(L, b.id, s);
        const dist = Math.hypot(C.x - A.x, C.y - A.y);
        const x = lerp(A.x, C.x, k);
        const y = lerp(A.y, C.y, k) - 4 * k * (1 - k) * Math.min(70, 18 + dist * 0.14);
        const rot = Math.sin(Math.PI * k) * Math.max(-1, Math.min(1, (C.x - A.x) / 160)) * 7;
        const out = heldOut(b);
        const op = out ? lerp(1 - 0.6 * c.dim, 1, k) : 1;
        const caps = out ? c.capsUnseen : smooth(1 + 0.62 * L.wave[b.id], 1.24 + 0.62 * L.wave[b.id], s);
        const passed = clamp01((sweepY - (A.y + L.BH / 2)) / 26);
        const bar = out ? 0 : (s >= 1 ? 1 : passed * (s > 0.02 ? 1 : 0)) * c.bars * (b.scores.it[0] / 100);
        const key = `${x.toFixed(1)}|${y.toFixed(1)}|${rot.toFixed(1)}|${op.toFixed(2)}|${caps.toFixed(2)}|${bar.toFixed(3)}`;
        if (key === r.last) continue;
        r.last = key;
        r.el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - L.SH).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`;
        r.el.style.zIndex = k > 0 && k < 1 ? '3' : '2';
        r.el.style.opacity = op.toFixed(2);
        r.studs?.setAttribute('opacity', (1 - caps).toFixed(2));
        r.caps?.setAttribute('opacity', caps.toFixed(2));
        r.caps?.setAttribute('transform', `translate(0 ${(-(1 - caps) * 4).toFixed(1)})`);
        r.bar?.setAttribute('width', Math.max(0, (L.BW - 6) * bar).toFixed(1));
      }
      const v = { explored: s >= 0.93, organized: s >= 1.86 };
      if (v.explored !== viewRef.current.explored || v.organized !== viewRef.current.organized) {
        viewRef.current = v;
        onViewRef.current(v);
      }
    },
    [L]
  );

  // glide towards the requested step: a step forward plays at its own pace, a long jump or a step back goes faster
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.06, (now - last) / 1000) : 1 / 60;
      last = now;
      let s = S.current;
      const target = step;
      if (reduce) s = target;
      else {
        const dir = Math.sign(target - s);
        const seg = Math.max(0, Math.min(2, dir > 0 ? Math.floor(s + 1e-6) : Math.ceil(s - 1e-6) - 1));
        const fast = dir < 0 ? 3.2 : Math.abs(target - s) > 1.02 ? 3 : 1;
        s += dir * (dt / SEG_SECONDS[seg]) * fast;
        if ((dir > 0 && s >= target) || (dir < 0 && s <= target)) s = target;
      }
      S.current = s;
      paint(s);
      if (s !== target) raf = requestAnimationFrame(tick);
      else onRestRef.current(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, paint, reduce]);

  // a new width or theme redraws at once
  useLayoutEffect(() => {
    Object.values(bricks.current).forEach((r) => (r.last = ''));
    paint(S.current);
  }, [paint, theme]);

  const domColor = (b: Bench) => t.domains[b.domain];
  const light = (b: Bench) => mixHex(domColor(b), dark ? '#252b3d' : '#ffffff', dark ? 0.52 : 0.6);
  const plateTop = dark ? '#2a3146' : '#d9dee7';
  const plateEdge = dark ? '#222839' : '#c6ccd8';

  // what a pick lights up: a benchmark and the nodes on its path, or a node with its subtree
  const lit = useMemo(() => {
    if (!pick) return null;
    if (pick.kind === 'bench') return { benches: new Set([pick.id]), nodes: new Set(nodeLineage(BENCHES.find((b) => b.id === pick.id)!.node).map((n) => n.id)) };
    const sub = new Set(BENCHES.filter((b) => nodeLineage(b.node).some((n) => n.id === pick.id)).map((b) => b.id));
    return { benches: sub, nodes: new Set(nodeLineage(pick.id).map((n) => n.id)) };
  }, [pick]);

  const rowOf = Object.fromEntries(L.rows.map((r) => [r.id, r])) as Record<NodeId, (typeof L.rows)[number]>;

  return (
    <div className="relative" style={{ height: L.H }}>
      {/* ---- the task tree: spine, domains, family plates */}
      <div ref={taskLayer} className="pointer-events-none absolute inset-0">
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path d={`M ${SPINE} ${ROOT_H} V ${L.headers[L.headers.length - 1].y + 9}`} stroke={t.rule2} strokeWidth={1.4} fill="none" />
          {L.headers.map((h) => (
            <path key={h.id} d={`M ${SPINE} ${h.y + 9} H ${IND - 2}`} stroke={t.rule2} strokeWidth={1.4} fill="none" />
          ))}
          {L.plates.map((p, i) => (
            <g key={i}>
              <rect x={p.x} y={p.y} width={p.w} height={6} rx={2.5} fill={plateTop} />
              <rect x={p.x} y={p.y + 4.4} width={p.w} height={1.6} rx={0.8} fill={plateEdge} />
            </g>
          ))}
        </svg>
        {L.headers.map((h) => {
          const d = domainById[h.id];
          return (
            <p key={h.id} className="absolute flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-[720] leading-none text-ink" style={{ left: IND, top: h.y + 3 }}>
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: t.domains[h.id] }} />
              {d.name}
              <span className="tabular font-[600] text-ink-3">{h.count}</span>
            </p>
          );
        })}
      </div>

      {/* ---- the capability tree: one row per node */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {L.rows.map((r) => {
          const parent = r.parent === 'root' ? null : rowOf[r.parent];
          const px = parent ? parent.x0 + TILE / 2 : SPINE;
          const py = parent ? parent.cy + TILE / 2 + 2 : ROOT_H;
          const on = !lit || lit.nodes.has(r.id);
          const n = nodeById[r.id];
          return (
            <g key={r.id} ref={(g) => void (capRows.current[r.id] = g)} style={{ opacity: 0, transition: 'none' }}>
              <path d={`M ${px} ${py} V ${r.cy - 4} Q ${px} ${r.cy} ${px + 4} ${r.cy} H ${r.x0 - 3}`} stroke={on && lit ? t.accent : t.rule2} strokeWidth={on && lit ? 1.8 : 1.4} fill="none" />
              <g opacity={on ? 1 : 0.3} style={{ transition: 'opacity .3s' }}>
                {n.path.map((c, i) => (
                  <g key={c} transform={`translate(${r.x0 + i * (TILE + 2)} ${r.cy - TILE / 2})`}>
                    <rect width={TILE} height={TILE} rx={4} fill={t.caps[c]} opacity={i === n.path.length - 1 ? 1 : 0.55} />
                    <text x={TILE / 2} y={TILE / 2 + 3.6} textAnchor="middle" fill="#fff" style={{ fontSize: 10, fontWeight: 820, fontFamily: 'var(--font-display)' }}>
                      {c}
                    </text>
                  </g>
                ))}
                {BENCHES.every((b) => b.node !== r.id) && (
                  <text x={LABEL_W} y={r.cy + 4} fill={t.ink3} style={{ fontSize: 11.5, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
                    all under e → f
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* ---- the root: 44 benchmarks, then the Base Harness */}
      <div className="pointer-events-none absolute left-0 top-0 h-[24px]">
        <span ref={rootTask} className="absolute left-0 top-0 inline-flex h-6 items-center whitespace-nowrap rounded-full bg-ink px-2.5 text-[11.5px] font-[740] text-paper">
          44 benchmarks
        </span>
        <span ref={rootCap} className="absolute left-0 top-0 inline-flex h-6 items-center whitespace-nowrap rounded-full bg-ink px-2.5 text-[11.5px] font-[740] text-paper" style={{ opacity: 0 }}>
          Base Harness H₀
        </span>
      </div>

      {/* ---- Explorer's sweep down the training benchmarks */}
      <div ref={sweepEl} className="pointer-events-none absolute inset-x-0 top-0 h-[44px]" style={{ visibility: 'hidden' }} aria-hidden>
        <div className="absolute inset-x-0 top-[10px] h-[24px]" style={{ background: `linear-gradient(180deg, ${t.explorer}00, ${t.explorer}2e, ${t.explorer}00)` }} />
        <div className="absolute inset-x-0 top-[22px] h-px" style={{ background: `${t.explorer}88` }} />
        <img src={explorerCat} alt="" className="absolute right-0 top-0 h-[44px] w-[44px] object-contain" draggable={false} />
      </div>

      {/* ---- the bricks (their own stacking context: a flying brick passes over the others, never over the tap layer) */}
      <div className="absolute inset-0 isolate">
        {BENCHES.map((b) => (
          <BrickEl
            key={b.id}
            b={b}
            L={L}
            fill={domColor(b)}
            light={light(b)}
            dark={dark}
            state={!lit ? 'none' : lit.benches.has(b.id) ? (pick?.kind === 'bench' ? 'on' : 'none') : 'dim'}
            refs={bricks.current[b.id]}
          />
        ))}
      </div>

      {/* ---- tap targets: bricks always; node rows in the capability tree */}
      <TapLayer L={L} step={step} setPick={setPick} />
    </div>
  );
}

/** finds what a tap hit: a brick (by the current layout) or, in the capability tree, a node's row */
function TapLayer({ L, step, setPick }: { L: Layout; step: number; setPick: (p: Pick) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onClick = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const pos = step >= 3 ? L.capPos : L.taskPos;
    let best: string | null = null;
    let bd = 1e9;
    for (const b of BENCHES) {
      const p = pos[b.id];
      const dx = Math.max(p.x - x, 0, x - (p.x + L.BW));
      const dy = Math.max(p.y - L.SH - y, 0, y - (p.y + L.BH));
      const dd = Math.hypot(dx, dy);
      if (dd < bd) {
        bd = dd;
        best = b.id;
      }
    }
    if (best && bd <= 6) return setPick({ kind: 'bench', id: best });
    if (step >= 3) {
      const row = L.rows.find((q) => Math.abs(y - q.cy) <= (L.SH + L.BH + 10) / 2 && x < LABEL_W);
      if (row) return setPick({ kind: 'node', id: row.id });
    }
    setPick(null);
  };
  return <div ref={ref} className="absolute inset-0" onClick={onClick} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* what a tap shows                                                     */
/* ------------------------------------------------------------------ */
function capNames(path: readonly string[]) {
  return path.map((c) => capById[c as keyof typeof capById].name);
}

function PickCard({ pick, onClose }: { pick: NonNullable<Pick>; onClose: () => void }) {
  const { t } = useTokens();
  const Tiles = ({ path }: { path: readonly string[] }) => (
    <span className="inline-flex gap-[3px] align-[-3px]">
      {path.map((c) => (
        <span key={c} className="grid h-[17px] w-[17px] place-items-center rounded-[5px] text-[10.5px] font-[820] text-white" style={{ background: t.caps[c as keyof typeof t.caps] }}>
          {c}
        </span>
      ))}
    </span>
  );
  let body: React.ReactNode;
  if (pick.kind === 'bench') {
    const b = BENCHES.find((x) => x.id === pick.id)!;
    const n = nodeById[b.node];
    const status = b.split === 'both' ? 'Trains in simulation; the real robot is unseen.' : b.split === 'unseen' ? 'Unseen: placed on the fixed tree afterwards, for evaluation only.' : 'Training benchmark.';
    body = (
      <>
        <p className="pr-8 text-[16px] font-[760] leading-tight text-ink" style={{ fontStretch: '104%' }}>
          {b.name}
          {b.rebuilt && <span className="font-[600] text-ink-3"> *rebuilt</span>}
        </p>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-3">
          {domainById[b.domain].name}, {familyById[b.family].name}
        </p>
        <p className="mt-2.5 text-[13.5px] leading-snug text-ink-2">
          Requires <Tiles path={n.path} /> <span className="text-ink">{capNames(n.path).join(', then ')}</span>
        </p>
        <p className="mt-2 text-[13px] leading-snug text-ink-2">
          {status} <span className="tabular whitespace-nowrap font-[700] text-ink">H₀ {b.scores.it[0]}, H₄ {b.scores.it[4]}</span>
          {b.robot && <span className="tabular whitespace-nowrap text-ink-3"> (robot {b.robot.it[0]}, {b.robot.it[4]})</span>}
        </p>
        <p className="mt-1 text-[12px] text-ink-3">{b.measure}</p>
      </>
    );
  } else {
    const n = nodeById[pick.id];
    const own = BENCHES.filter((b) => b.node === pick.id);
    const tr = own.filter((b) => !heldOut(b));
    const un = own.filter(heldOut);
    body = (
      <>
        <p className="flex items-center gap-2 pr-8 text-[16px] font-[760] text-ink">
          <Tiles path={n.path} />
          {n.path.join(' → ')}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{capNames(n.path).join(', then ')}</p>
        {own.length ? (
          <>
            {tr.length > 0 && (
              <p className="mt-2.5 text-[13px] leading-snug text-ink-2">
                <span className="font-[700] text-ink">Training</span> {tr.map((b) => (b.split === 'both' ? `${b.short ?? b.name} (sim.)` : b.short ?? b.name)).join(', ')}
              </p>
            )}
            {(un.length > 0 || tr.some((b) => b.split === 'both')) && (
              <p className="mt-1 text-[13px] leading-snug text-ink-2">
                <span className="font-[700] text-ink">Unseen</span>{' '}
                {[...un.map((b) => b.short ?? b.name), ...tr.filter((b) => b.split === 'both').map((b) => `${b.name} (robot)`)].join(', ')}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2.5 text-[13px] text-ink-3">No benchmark sits at e itself; both video benchmarks are under e → f.</p>
        )}
      </>
    );
  }
  return (
    <motion.div
      className="relative rounded-2xl border border-rule bg-surface px-4 py-3.5 shadow-[0_20px_44px_-24px_rgba(10,12,22,0.55)]"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <button type="button" onClick={onClose} className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-paper-2 text-ink-3" aria-label="Close">
        <Icon icon={Cancel01Icon} size={14} stroke={2.2} />
      </button>
      {body}
    </motion.div>
  );
}

/** is what was tapped in the lower half of the figure? */
function pickLow(pick: NonNullable<Pick>, L: Layout | null, step: number) {
  if (!L) return false;
  const y = pick.kind === 'bench' ? (step >= 3 ? L.capPos : L.taskPos)[pick.id].y : L.rows.find((r) => r.id === pick.id)!.cy;
  return y > L.H * 0.5;
}

/* ------------------------------------------------------------------ */
/* what each step adds under its text                                   */
/* ------------------------------------------------------------------ */
function Extra({ step, view, onNode }: { step: number; view: View; onNode: (id: NodeId) => void }) {
  const { t } = useTokens();
  if (step === 0)
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[3px]" style={{ background: t.ink2 }} /> training
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[3px] border" style={{ background: t.surface2, borderColor: t.ink3 }} /> unseen
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 overflow-hidden rounded-[3px]" style={{ background: `linear-gradient(90deg, ${t.ink2} 50%, ${t.rule2} 50%)` }} /> simulation and robot
        </span>
      </div>
    );
  if (step === 1)
    return (
      <div className="space-y-1.5">
        <LatticeLoader label="Explorer runs H₀ on the training benchmarks" doneLabel="Training trajectories recorded" status={view.explored ? 'done' : 'working'} color={t.explorer} doneColor={t.good} fontSize={13} cellSize={4} showTimer={false} />
        <p className="text-[12.5px] text-ink-3">The bar inside a brick is its H₀ score (Table 8). The unseen benchmarks stay out.</p>
      </div>
    );
  if (step === 2)
    return (
      <div className="space-y-2.5">
        <ThoughtLine label="Evolver is organizing requirements" doneLabel="Requirement sets fixed" steps={[]} working={!view.organized} color={t.ink2} glyphColor={t.evolver} fontSize={13} collapseOnSettle showTimer={false} />
        <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
          {CAPS.map((c) => {
            const all = benchesNeeding(c.id);
            const tr = all.filter((b) => b.split !== 'unseen').length;
            return (
              <li key={c.id} className="flex items-start gap-2">
                <span className="mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] text-[11px] font-[820] text-white" style={{ background: t.caps[c.id] }}>
                  {c.id}
                </span>
                <span className="min-w-0 text-[12px] leading-[1.3] text-ink-2">
                  {c.name}
                  <span className="tabular ml-1 whitespace-nowrap font-[700] text-ink">
                    {tr}
                    <span className="font-[560] text-ink-3"> +{all.length - tr}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-[12px] text-ink-3">Training benchmarks (and unseen ones) that require each capability. A brick’s studs now show its own.</p>
      </div>
    );
  return (
    <div className="space-y-1.5">
      <p className="text-[13.5px] leading-snug text-ink-2">
        <span className="font-[720] text-ink">ARC-AGI-3 and Micromouse</span> look nothing alike, yet both sit at{' '}
        <button type="button" onClick={() => onNode('da')} className="rounded-md bg-accent-wash px-1.5 py-0.5 font-[760] text-accent-ink">
          d → a
        </button>
        .
      </p>
      <p className="text-[12.5px] text-ink-3">Tap a node’s letters or a brick to trace its path.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the chapter                                                          */
/* ------------------------------------------------------------------ */
export default function PTree() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  const [step, setStep] = useState(0);
  const [rest, setRest] = useState(0);
  const [auto, setAuto] = useState(!reduce);
  const [visible, setVisible] = useState(false);
  const [pick, setPick] = useState<Pick>(null);
  const [view, setView] = useState<View>({ explored: false, organized: false });
  const L = useMemo(() => (W ? buildLayout(W) : null), [W]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setW(Math.round(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // "in view": most of the figure itself is on screen (the tray with its text is taller than a phone)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.6), { threshold: [0, 0.3, 0.6, 0.8, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the first time the figure is in view it plays its four steps once; any tap takes over
  useEffect(() => {
    if (!auto || !visible || rest !== step || step >= 3) return;
    const id = window.setTimeout(() => setStep((s) => Math.min(3, s + 1)), step === 0 ? 2600 : 3200);
    return () => window.clearTimeout(id);
  }, [auto, visible, rest, step]);

  const go = (s: number) => {
    setAuto(false);
    setPick(null);
    setStep(Math.max(0, Math.min(3, s)));
  };
  const pickAt = useCallback((p: Pick) => {
    setAuto(false);
    setPick(p);
  }, []);

  // a horizontal swipe on the figure moves a step
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: RPointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: RPointerEvent) => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(step + (dx < 0 ? 1 : -1));
  };

  const s = STEPS[step];

  return (
    <section id="stage-1" className="scroll-mt-16 pt-20">
      <Opener kicker="Stages 1 and 2" stage="1–2" title="From a task tree to a capability tree">
        <p className="p-lede">
          Evolver regroups the benchmarks by what they <em>require</em>, not by what they look like. Step through it: the training benchmarks leave their five domains and build the eleven nodes of the capability tree; the unseen ones are placed on it afterwards.
        </p>
      </Opener>
      <span id="stage-2" aria-hidden />

      <div ref={tray} className="p-tray mt-7 pb-5 pt-3">
        {/* steps */}
        <div className="flex items-center gap-2 px-4">
          <div className="flex flex-1 gap-1.5">
            {STEPS.map((x, i) => (
              <button key={x.title} type="button" onClick={() => go(i)} className="flex h-7 flex-1 flex-col justify-center" aria-label={`Step ${i + 1}: ${x.title}`} aria-pressed={i === step}>
                <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-rule">
                  <span className="absolute inset-0 origin-left bg-ink transition-transform duration-500" style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* the figure */}
        <div className="relative mt-2 px-4" style={{ touchAction: 'pan-y' }} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (swipe.current = null)}>
          <div ref={box}>{L && <Figure L={L} step={step} onRest={setRest} pick={pick} setPick={pickAt} onView={setView} />}</div>
          <AnimatePresence>
            {pick && (
              <div key={pick.kind + pick.id} className={`absolute inset-x-3 z-10 ${pickLow(pick, L, step) ? 'top-2' : 'bottom-2'}`}>
                <PickCard pick={pick} onClose={() => setPick(null)} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* the step in words */}
        <div className="mt-5 px-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}>
              <div className="flex items-center gap-3">
                <img src={s.cat} alt="" className="h-12 w-12 shrink-0 object-contain" draggable={false} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between gap-2 text-[12px] font-[700] text-ink-3">
                    {s.stage}, step {step + 1} of 4
                    <span style={{ color: s.who === 'Explorer' ? t.explorer : t.evolver }}>{s.who}</span>
                  </p>
                  <p className="text-[18px] font-[760] leading-tight tracking-[-0.015em] text-ink" style={{ fontStretch: '106%' }}>
                    {s.title}
                  </p>
                </div>
              </div>
              <More lines={3} lineHeight={22.5} className="mt-2.5" on="surface">
                <p className="p-body">{s.text}</p>
              </More>
              <div className="mt-3">
                <Extra
                  step={step}
                  view={view}
                  onNode={(id) => {
                    pickAt({ kind: 'node', id });
                    // bring the figure back into view, with the node's card
                    const el = box.current;
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: reduce ? 'auto' : 'smooth' });
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex items-center gap-2.5">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="p-press grid h-11 w-11 place-items-center rounded-full border border-rule bg-surface text-ink disabled:opacity-35" aria-label="Previous step">
              <Icon icon={ArrowLeft01Icon} size={18} stroke={2} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (step < 3) go(step + 1);
                else {
                  setPick(null);
                  setStep(0);
                  setAuto(!reduce);
                }
              }}
              className="p-press flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[14.5px] font-[700] text-paper"
            >
              {step < 3 ? `Next: ${STEPS[step + 1].title}` : 'Start again'}
              {step < 3 && <Icon icon={ArrowRight01Icon} size={17} stroke={2.2} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 px-5">
        <PaperFigure fig={PAPER_FIGS.taskTree} />
        <PaperFigure fig={PAPER_FIGS.capTree} />
      </div>
    </section>
  );
}
