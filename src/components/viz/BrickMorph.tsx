import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BENCHES, CAP_NODES, DOMAINS, FAMILIES, capById, domainById, familyById, nodeById, nodeLineage, pathLabel, type Bench, type NodeId } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import { useLegoPalette } from './Lego';
import exploreCat from '@/assets/cats/explorer-explore.webp';

/**
 * Task tree → capability tree, in bricks (Appendix A → B: Figure 8 → Figure 10).
 * The stage is a float in [0, 4], driven by the page (scroll on wide screens, the step buttons on
 * phones) through a signal, and eased here so the bricks glide instead of following each wheel step:
 *   0–1  task tree: 44 benchmarks on 15 task-family plates, under 5 domains
 *   1–2  world exploration: Explorer runs H0 on the training benchmarks (bars: H0 score, Table 8);
 *        the unseen benchmarks are held out
 *   2–3  requirement organization: every training brick's studs become the capabilities it requires
 *   3–4  capability tree: the training bricks fly to the node of their capability combination and
 *        build the tree; the unseen benchmarks are placed on the fixed tree afterwards
 * Bricks are HTML layers moved with transforms and the two trees are static layers that fade, so a
 * frame only moves layers; React renders again only on hover.
 */
export const VB_W = 1320;
export const VB_H = 720;
const BW = 104; // brick
const BH = 25;
const SH = 7; // stud height
const CELL_H = BH + SH + 12;
const GX = 6;
const PAD = 8;
const TAB = 22; // plate label under the plate
/** a brick's box around its body: room for the capability tiles above and the outline */
const BOX = { ox: 3, oy: 24, w: BW + 6, h: BH + 27 };

/* the tree is built depth by depth, then the unseen benchmarks join it (stage units) */
const DEPTH_WIN: Record<number, [number, number]> = { 1: [2.9, 3.22], 2: [3.08, 3.4], 3: [3.26, 3.52] };
const UNSEEN_WIN: [number, number] = [3.54, 3.94];
const FLY = 0.22; // stage units one brick's flight takes
/* the drawn stage follows the page on a critically damped spring, with a speed limit that is low
   while the tree is built (so a fast scroll still shows it being built) and rises for long jumps */
const OMEGA = 8;
const vmax = (S: number, gap: number) => {
  const build = smooth(2.74, 2.88, S) * (1 - smooth(3.93, 3.99, S));
  return lerp(2.4, 0.32 + 0.8 * clamp01(gap - 0.3), build);
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** a value the page writes and the figure reads without re-rendering React */
export type StageSignal = { get: () => number; set: (v: number) => void; subscribe: (f: () => void) => () => void };
export function createStageSignal(initial = 0): StageSignal {
  let v = initial;
  const subs = new Set<() => void>();
  return {
    get: () => v,
    set: (x) => {
      if (x === v) return;
      v = x;
      subs.forEach((f) => f());
    },
    subscribe: (f) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
  };
}

type Box = { x: number; y: number; w: number; h: number };
type Plate = Box & { key: string; label: string[]; cols: number; bricks: string[] };

function plateSize(n: number, cols: number) {
  const c = Math.min(cols, Math.max(1, n));
  const rows = Math.max(1, Math.ceil(n / c));
  return { w: c * BW + (c + 1) * GX, h: rows * CELL_H + PAD, cols: c };
}
/** brick top-left positions inside a plate (bricks stand on the plate, studs up) */
function brickSlots(p: Plate) {
  const out: Record<string, { x: number; y: number }> = {};
  const rows = Math.ceil(p.bricks.length / p.cols);
  p.bricks.forEach((id, i) => {
    const r = Math.floor(i / p.cols);
    const c = i % p.cols;
    const inRow = Math.min(p.cols, p.bricks.length - r * p.cols);
    const rowW = inRow * BW + (inRow - 1) * GX;
    const x0 = p.x + (p.w - rowW) / 2;
    // the last row stands on the plate; earlier rows above it
    const y = p.y - (rows - r) * CELL_H + SH + 2;
    out[id] = { x: x0 + c * (BW + GX), y };
  });
  return out;
}

/** split a long label into at most two balanced lines */
function twoLines(s: string, max = 26): string[] {
  if (s.length <= max) return [s];
  const words = s.split(' ');
  let best = [s];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(a.length, b.length);
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

/** held out: the unseen benchmarks (SOON and CaP-X train in simulation, so they count as training here) */
const heldOut = (b: Bench) => b.split === 'unseen';

function buildLayout() {
  /* ---------- task tree: one column per domain, plates stacked above the domain hub */
  const COLW = 2 * BW + 3 * GX;
  const colGap = (VB_W - 40 - DOMAINS.length * COLW) / (DOMAINS.length - 1);
  const hubY = 622;
  const rootT = { x: VB_W / 2, y: 700 };
  const taskPlates: Plate[] = [];
  const hubs: Record<string, { x: number; y: number }> = {};
  DOMAINS.forEach((d, ci) => {
    const x = 20 + ci * (COLW + colGap);
    hubs[d.id] = { x: x + COLW / 2, y: hubY };
    let y = hubY - 64; // bottom of the lowest plate
    const fams = FAMILIES.filter((f) => f.domain === d.id);
    [...fams].reverse().forEach((f) => {
      const bricks = BENCHES.filter((b) => b.family === f.id).map((b) => b.id);
      const rows = Math.ceil(bricks.length / 2);
      taskPlates.push({ key: f.id, label: twoLines(f.name, 30), x, y, w: COLW, h: 6, cols: 2, bricks });
      y -= rows * CELL_H + PAD + TAB + 26;
    });
  });
  const taskPos: Record<string, { x: number; y: number }> = {};
  taskPlates.forEach((p) => Object.assign(taskPos, brickSlots(p)));

  /* ---------- capability tree: Figure 10 arrangement */
  const COLS: Partial<Record<NodeId, number>> = { c: 3, d: 3, ca: 3, da: 2, e: 1, ef: 1 };
  const ANCHOR: Record<Exclude<NodeId, 'root'>, { x: number; y: number }> = {
    c: { x: 175, y: 566 },
    d: { x: 515, y: 566 },
    a: { x: 815, y: 566 },
    b: { x: 1060, y: 566 },
    e: { x: 1252, y: 566 },
    cd: { x: 150, y: 342 },
    ca: { x: 452, y: 342 },
    da: { x: 795, y: 342 },
    db: { x: 1036, y: 342 },
    ef: { x: 1252, y: 342 },
    cda: { x: 150, y: 132 },
  };
  const capPlates: (Plate & { node: Exclude<NodeId, 'root'> })[] = CAP_NODES.map((n) => {
    const id = n.id as Exclude<NodeId, 'root'>;
    const bricks = BENCHES.filter((b) => b.node === id).map((b) => b.id);
    const s = plateSize(Math.max(1, bricks.length), COLS[id] ?? 2);
    const a = ANCHOR[id];
    const last = n.path[n.path.length - 1];
    return { key: id, node: id, label: [n.path.join(' → '), `${last} · ${capById[last].name}`], x: a.x - s.w / 2, y: a.y, w: s.w, h: 6, cols: s.cols, bricks };
  });
  const capPos: Record<string, { x: number; y: number }> = {};
  capPlates.forEach((p) => Object.assign(capPos, brickSlots(p)));
  const rootC = { x: VB_W / 2 + 10, y: 700 };

  // when each brick takes off: the training benchmarks build the tree depth by depth (a trie grows
  // from the root), left to right within a depth; the unseen ones follow once the tree is fixed
  const depth = (b: Bench) => nodeById[b.node].path.length;
  const byDest = [...BENCHES].sort((a, b) => depth(a) - depth(b) || capPos[a.id].x - capPos[b.id].x || capPos[a.id].y - capPos[b.id].y);
  const start: Record<string, number> = {};
  const spread = (ids: string[], [w0, w1]: [number, number]) => ids.forEach((id, i) => (start[id] = ids.length > 1 ? w0 + (i / (ids.length - 1)) * (w1 - w0 - FLY) : w0));
  [1, 2, 3].forEach((d) => spread(byDest.filter((b) => !heldOut(b) && depth(b) === d).map((b) => b.id), DEPTH_WIN[d]));
  spread(byDest.filter(heldOut).map((b) => b.id), UNSEEN_WIN);

  return { taskPlates, taskPos, hubs, rootT, capPlates, capPos, rootC, start };
}
type Layout = ReturnType<typeof buildLayout>;

const edge = (x1: number, y1: number, x2: number, y2: number) => {
  const my = (y1 + y2) / 2;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${my.toFixed(1)}, ${x2.toFixed(1)} ${my.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

function mixHex(hex: string, w = '#ffffff', k = 0.55) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(w);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

/* ------------------------------------------------------------------ */
/* the choreography: everything is a pure function of the stage S     */
/* ------------------------------------------------------------------ */
const curves = (S: number) => ({
  explore: smooth(0.85, 1.6, S) * (1 - smooth(2.6, 3.0, S)),
  scan: clamp01((S - 1) / 0.85),
  capsTrain: smooth(2.0, 2.45, S),
  capsUnseen: smooth(3.42, 3.54, S),
  hold: smooth(0.9, 1.3, S) * (1 - smooth(3.42, 3.54, S)),
  // the task tree steps back while the tree is built, and goes once the unseen bricks have left it
  taskTree: 1 - 0.78 * smooth(2.9, 3.18, S) - 0.22 * smooth(3.7, 3.94, S),
  capTree: smooth(2.86, 2.98, S),
});
/** a node's plate and its edge appear just before its first bricks land */
const nodeIn = (depth: number, S: number) => smooth(DEPTH_WIN[depth][0] - 0.04, DEPTH_WIN[depth][0] + 0.06, S);
/** a brick's flight: 0 on its task plate, 1 on its capability node */
const flight = (L: Layout, id: string, S: number) => easeInOut(clamp01((S - L.start[id]) / FLY));

type BrickRefs = { el: HTMLDivElement | null; studs: SVGGElement | null; tiles: SVGGElement | null; bar: SVGRectElement | null; last: string; inner: string };

/** a front-view brick with its label; its studs give way to capability tiles once its requirements are known */
const BrickView = memo(function BrickView({ b, scale, fill, light, active, dim, refs, onEnter, onLeave }: {
  b: Bench;
  scale: number;
  fill: string;
  light: string;
  active: boolean;
  dim: boolean;
  refs: BrickRefs;
  onEnter: (id: string) => void;
  onLeave: () => void;
}) {
  const { t } = useTokens();
  const node = nodeById[b.node];
  const split = b.split === 'both';
  const unseen = b.split === 'unseen';
  const body = unseen ? light : fill;
  const ink = unseen ? '#1d2230' : '#ffffff';
  const studs = 4;
  return (
    <div
      ref={(el) => void (refs.el = el)}
      className="pointer-events-auto absolute left-0 top-0"
      style={{ width: BOX.w * scale, height: BOX.h * scale, transformOrigin: `${(BOX.ox + BW / 2) * scale}px ${(BOX.oy + BH / 2) * scale}px`, willChange: 'transform' }}
      onMouseEnter={() => onEnter(b.id)}
      onMouseLeave={onLeave}
    >
      <svg viewBox={`${-BOX.ox} ${-BOX.oy} ${BOX.w} ${BOX.h}`} className="block h-full w-full overflow-visible" style={{ opacity: dim ? 0.22 : 1, transition: 'opacity .25s' }} aria-hidden>
        {/* studs, or capability tiles once the requirements are known */}
        <g ref={(g) => void (refs.studs = g)}>
          {Array.from({ length: studs }, (_, i) => {
            const cx = (BW / studs) * (i + 0.5);
            return <rect key={i} x={cx - 7} y={-SH + 1} width={14} height={SH + 1} rx={2} fill={body} />;
          })}
        </g>
        <g ref={(g) => void (refs.tiles = g)} opacity={0}>
          {node.path.map((c, i) => {
            const n = node.path.length;
            const cx = BW / 2 + (i - (n - 1) / 2) * 17;
            return (
              <g key={c} transform={`translate(${cx - 7.5} ${-SH - 4})`}>
                <rect width={15} height={13} rx={3} fill={t.caps[c]} />
                <text x={7.5} y={9.6} textAnchor="middle" fill="#fff" style={{ fontSize: 9.5, fontWeight: 800 }}>
                  {c}
                </text>
              </g>
            );
          })}
        </g>
        <rect width={BW} height={BH} rx={4} fill={body} stroke={active ? t.ink : 'transparent'} strokeWidth={1.6} />
        {split && <rect x={BW / 2} width={BW / 2} height={BH} rx={4} fill={light} />}
        {split && <rect x={BW / 2} width={6} height={BH} fill={light} />}
        <rect width={BW} height={BH * 0.4} rx={4} fill="#ffffff" opacity={0.18} />
        <rect y={BH - 3} width={BW} height={3} rx={1.5} fill="#000" opacity={0.13} />
        <rect ref={(r) => void (refs.bar = r)} x={3} y={BH - 4} width={0} height={2.6} rx={1.3} fill={split ? '#1d2230' : '#ffffff'} opacity={0.75} />
        <text x={BW / 2} y={BH / 2 + 3.9} textAnchor="middle" fill={split ? '#1d2230' : ink} style={{ fontSize: 11, fontWeight: 680, letterSpacing: '-0.01em' }}>
          {b.short ?? b.name}
          {b.rebuilt ? '*' : ''}
        </text>
      </svg>
    </div>
  );
});

export default function BrickMorph({ signal, fit = false, onStage }: { signal: StageSignal; fit?: boolean; onStage?: (s: number) => void }) {
  const { t, theme } = useTokens();
  const LP = useLegoPalette();
  const reduce = useReducedMotion();
  const L = useMemo(buildLayout, []);
  const [hoverB, setHoverB] = useState<string | null>(null);
  const [hoverN, setHoverN] = useState<NodeId | null>(null);
  const [geo, setGeo] = useState({ s: 1, ox: 0, oy: 0 });
  const geoRef = useRef(geo);
  geoRef.current = geo;
  const wrap = useRef<HTMLDivElement>(null);
  const taskLayer = useRef<SVGSVGElement>(null);
  const capLayer = useRef<SVGSVGElement>(null);
  const sweep = useRef<HTMLDivElement>(null);
  const bricks = useRef<Record<string, BrickRefs>>({});
  const nodeEls = useRef<Record<string, SVGGElement | null>>({});
  const shown = useRef(signal.get());
  const speed = useRef(0);
  const onStageRef = useRef(onStage);
  onStageRef.current = onStage;
  BENCHES.forEach((b) => (bricks.current[b.id] ??= { el: null, studs: null, tiles: null, bar: null, last: '', inner: '' }));

  // the drawing's scale inside its box (like an SVG with preserveAspectRatio "xMidYMid meet")
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = fit ? el.clientHeight : (W * VB_H) / VB_W;
      const s = Math.min(W / VB_W, H / VB_H);
      const next = { s, ox: (W - VB_W * s) / 2, oy: (H - VB_H * s) / 2 };
      setGeo((g) => (Math.abs(g.s - next.s) < 1e-4 && Math.abs(g.ox - next.ox) < 0.5 && Math.abs(g.oy - next.oy) < 0.5 ? g : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  /** one frame: move the layers for stage S */
  const paint = useCallback(
    (S: number) => {
      const { s, ox, oy } = geoRef.current;
      const c = curves(S);
      if (taskLayer.current) {
        taskLayer.current.style.opacity = c.taskTree.toFixed(3);
        taskLayer.current.style.visibility = c.taskTree > 0.001 ? 'visible' : 'hidden';
      }
      if (capLayer.current) {
        capLayer.current.style.opacity = c.capTree.toFixed(3);
        capLayer.current.style.visibility = c.capTree > 0.001 ? 'visible' : 'hidden';
        capLayer.current.style.pointerEvents = c.capTree > 0.5 ? 'auto' : 'none';
      }
      // the tree grows depth by depth: each node rises onto its place just before its bricks land
      for (const n of CAP_NODES) {
        const g = nodeEls.current[n.id];
        if (!g) continue;
        const k = nodeIn(n.path.length, S);
        g.setAttribute('opacity', k.toFixed(3));
        g.setAttribute('transform', `translate(0 ${((1 - k) * 14).toFixed(2)})`);
      }
      if (sweep.current) {
        const o = c.explore * (1 - smooth(0.92, 1, c.scan));
        sweep.current.style.opacity = o.toFixed(3);
        sweep.current.style.visibility = o > 0.01 && c.scan < 1 ? 'visible' : 'hidden';
        sweep.current.style.transform = `translate3d(${(ox + (20 + c.scan * (VB_W - 40) - 46) * s).toFixed(2)}px, ${(oy + 20 * s).toFixed(2)}px, 0)`;
      }
      const sweepX = c.scan * (VB_W - 40) + 20;
      for (const b of BENCHES) {
        const r = bricks.current[b.id];
        if (!r.el) continue;
        const A = L.taskPos[b.id];
        const C = L.capPos[b.id];
        const k = flight(L, b.id, S);
        const dist = Math.hypot(C.x - A.x, C.y - A.y);
        const arc = 4 * k * (1 - k) * Math.min(130, 36 + dist * 0.16);
        const x = lerp(A.x, C.x, k);
        const y = lerp(A.y, C.y, k) - arc;
        const rot = Math.sin(Math.PI * k) * Math.max(-1, Math.min(1, (C.x - A.x) / 260)) * 7;
        const out = heldOut(b);
        // translate and rotate only: a layer that keeps its scale never has to be rasterized again
        const tr = `translate3d(${(ox + (x - BOX.ox) * s).toFixed(2)}px, ${(oy + (y - BOX.oy) * s).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
        const caps = out ? c.capsUnseen : c.capsTrain;
        // the unseen bricks step back while the training ones are explored and organized
        const op = out ? 1 - 0.5 * c.hold : 1;
        // the H0 run completes when the sweep passes a training brick
        const bar = out ? 0 : clamp01((sweepX - A.x) / 60) * c.explore * (b.scores.it[0] / 100);
        const key = `${tr}|${caps.toFixed(3)}|${op.toFixed(3)}|${bar.toFixed(3)}`;
        if (key === r.last) continue;
        r.last = key;
        r.el.style.transform = tr;
        // flying bricks pass over the ones at rest; the order only changes when a brick takes off or lands
        const z = k > 0 && k < 1 ? '2' : '1';
        if (r.el.style.zIndex !== z) r.el.style.zIndex = z;
        const o = op.toFixed(3);
        if (r.el.style.opacity !== o) r.el.style.opacity = o;
        const inner = `${caps.toFixed(3)}|${bar.toFixed(3)}`;
        if (inner !== r.inner) {
          r.inner = inner;
          r.studs?.setAttribute('opacity', (1 - caps).toFixed(3));
          r.tiles?.setAttribute('opacity', caps.toFixed(3));
          r.tiles?.setAttribute('transform', `translate(0 ${(-(1 - caps) * 6).toFixed(2)})`);
          r.bar?.setAttribute('width', Math.max(0, (BW - 6) * bar).toFixed(2));
        }
      }
    },
    [L]
  );

  // the drawn stage follows the page's stage on a critically damped spring with a speed limit, so a
  // wheel notch or a fast flick plays as a glide, then rests until the page moves again
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let running = false;
    const step = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = signal.get();
      let S = shown.current;
      let V = speed.current;
      if (reduce) {
        S = target;
        V = 0;
      } else {
        // sub-steps keep the spring stable when a frame comes late
        const n = Math.ceil(dt / (1 / 240));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
          V += (OMEGA * OMEGA * (target - S) - 2 * OMEGA * V) * h;
          const lim = vmax(S, Math.abs(target - S));
          V = Math.max(-lim, Math.min(lim, V));
          S += V * h;
        }
        if (Math.abs(target - S) < 4e-4 && Math.abs(V) < 4e-3) {
          S = target;
          V = 0;
        }
      }
      shown.current = S;
      speed.current = V;
      paint(S);
      onStageRef.current?.(S);
      if (S !== target || V !== 0) raf = requestAnimationFrame(step);
      else running = false;
    };
    const kick = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const off = signal.subscribe(kick);
    kick();
    return () => {
      off();
      cancelAnimationFrame(raf);
      running = false;
    };
  }, [signal, paint, reduce]);

  // a resize redraws at once; so does a fresh mount, a theme switch and a hover (which re-renders the trees)
  useLayoutEffect(() => {
    Object.values(bricks.current).forEach((r) => {
      r.last = '';
      r.inner = '';
    });
    paint(shown.current);
  }, [geo, paint, theme, hoverB, hoverN]);

  const domColor = (b: Bench) => t.domains[b.domain];
  const light = (b: Bench) => mixHex(domColor(b), theme === 'dark' ? '#2a3044' : '#ffffff', theme === 'dark' ? 0.5 : 0.58);

  // highlights
  const hiB = useMemo(() => {
    if (hoverB) return new Set([hoverB]);
    if (hoverN) return new Set(BENCHES.filter((b) => nodeLineage(b.node).some((n) => n.id === hoverN)).map((b) => b.id));
    return null;
  }, [hoverB, hoverN]);
  const hiN = useMemo(() => {
    if (hoverB) return new Set(nodeLineage(BENCHES.find((b) => b.id === hoverB)!.node).map((n) => n.id));
    if (hoverN) return new Set(nodeLineage(hoverN).map((n) => n.id));
    return null;
  }, [hoverB, hoverN]);
  const enter = useCallback((id: string) => setHoverB(id), []);
  const leave = useCallback(() => setHoverB(null), []);

  const tip = hoverB ? BENCHES.find((b) => b.id === hoverB)! : null;

  const plateEl = (p: Plate, color: string, label: string[], key: string, strong: boolean) => (
    <g key={key}>
      <rect x={p.x} y={p.y} width={p.w} height={7} rx={3} fill={LP.plate} />
      {Array.from({ length: Math.floor(p.w / 14) }, (_, i) => (
        <rect key={i} x={p.x + 5 + i * 14} y={p.y - 2.5} width={8} height={3} rx={1} fill={LP.plate} />
      ))}
      <rect x={p.x} y={p.y + 5.5} width={p.w} height={1.6} rx={0.8} fill={LP.plateEdge} />
      <text x={p.x + p.w / 2} y={p.y + 21} textAnchor="middle" fill={strong ? color : t.ink2} style={{ fontSize: 11.2, fontWeight: strong ? 760 : 640 }}>
        {label[0]}
      </text>
      {label[1] && (
        <text x={p.x + p.w / 2} y={p.y + 34} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.4, fontWeight: 560 }}>
          {label[1]}
        </text>
      )}
    </g>
  );

  const layer = 'absolute inset-0 block h-full w-full';
  return (
    <div
      ref={wrap}
      className={`relative isolate select-none overflow-hidden ${fit ? 'h-full w-full' : 'w-full'}`}
      style={fit ? undefined : { aspectRatio: `${VB_W} / ${VB_H}` }}
      role="img"
      aria-label="Forty-four benchmark bricks move from fifteen task-family plates under five domains to the eleven nodes of the capability tree; the tree is built from the training benchmarks, and the unseen ones are placed on it afterwards"
    >
      {/* ---------------- task tree */}
      <svg ref={taskLayer} viewBox={`0 0 ${VB_W} ${VB_H}`} className={`${layer} pointer-events-none`} style={{ willChange: 'opacity' }} aria-hidden>
        {DOMAINS.map((d) => {
          const h = L.hubs[d.id];
          return <path key={d.id} d={edge(L.rootT.x, L.rootT.y - 12, h.x, h.y + 14)} fill="none" stroke={t.rule2} strokeWidth={1.4} />;
        })}
        {/* each domain's spine runs up its column; a tick joins every family plate */}
        {DOMAINS.map((d) => {
          const h = L.hubs[d.id];
          const plates = L.taskPlates.filter((p) => familyById[p.key as keyof typeof familyById].domain === d.id);
          const sx = plates[0].x - 9;
          const top = Math.min(...plates.map((p) => p.y + 14));
          return (
            <g key={`sp-${d.id}`} stroke={t.domains[d.id]} strokeOpacity={0.45} strokeWidth={1.4} fill="none">
              <path d={`M ${h.x} ${h.y - 13} C ${h.x} ${h.y - 30}, ${sx} ${h.y - 20}, ${sx} ${h.y - 44} L ${sx} ${top}`} />
              {plates.map((p) => (
                <path key={p.key} d={`M ${sx} ${p.y + 14} L ${p.x + 2} ${p.y + 14}`} />
              ))}
            </g>
          );
        })}
        {L.taskPlates.map((p) => plateEl(p, t.ink2, p.label, `tp-${p.key}`, false))}
        {DOMAINS.map((d) => {
          const h = L.hubs[d.id];
          const w = d.name.length * 6.6 + 30;
          return (
            <g key={`hub-${d.id}`} transform={`translate(${h.x} ${h.y})`}>
              <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={t.surface} stroke={t.domains[d.id]} strokeWidth={1.4} />
              <circle cx={-w / 2 + 13} cy={0} r={4} fill={t.domains[d.id]} />
              <text x={6} y={4.3} textAnchor="middle" fill={t.ink} style={{ fontSize: 12, fontWeight: 700 }}>
                {d.name}
              </text>
            </g>
          );
        })}
        <g transform={`translate(${L.rootT.x} ${L.rootT.y})`}>
          <rect x={-74} y={-13} width={148} height={26} rx={13} fill={t.ink} />
          <text y={4.3} textAnchor="middle" fill={t.paper} style={{ fontSize: 12, fontWeight: 720 }}>
            44 benchmarks
          </text>
        </g>
      </svg>

      {/* ---------------- capability tree */}
      <svg ref={capLayer} viewBox={`0 0 ${VB_W} ${VB_H}`} className={layer} style={{ willChange: 'opacity' }} aria-hidden>
        {L.capPlates.map((p) => {
          const n = nodeById[p.node];
          const parent = n.parent === 'root' ? null : L.capPlates.find((q) => q.node === n.parent)!;
          const from = parent ? { x: parent.x + parent.w / 2, y: parent.y - (Math.ceil(parent.bricks.length / parent.cols) || 1) * CELL_H - 10 } : { x: L.rootC.x, y: L.rootC.y - 12 };
          const lit = !hiN || hiN.has(p.node);
          return (
            <g key={`cn-${p.key}`} ref={(g) => void (nodeEls.current[p.node] = g)} opacity={0}>
              <path d={edge(from.x, from.y, p.x + p.w / 2, p.y + 40)} fill="none" stroke={lit ? t.accent : t.rule2} strokeOpacity={lit ? 0.55 : 0.4} strokeWidth={lit && hiN ? 2 : 1.4} />
              <g onMouseEnter={() => setHoverN(p.node)} onMouseLeave={() => setHoverN(null)} style={{ cursor: 'default' }} opacity={lit ? 1 : 0.35}>
                <rect x={p.x - 6} y={p.y - (Math.ceil(p.bricks.length / p.cols) || 1) * CELL_H - 6} width={p.w + 12} height={(Math.ceil(p.bricks.length / p.cols) || 1) * CELL_H + 48} rx={12} fill="transparent" />
                {plateEl(p, t.ink, p.label, `cpl-${p.key}`, true)}
                {p.bricks.length === 0 && (
                  <text x={p.x + p.w / 2} y={p.y - 10} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.5, fontStyle: 'italic' }}>
                    all under e → f
                  </text>
                )}
              </g>
            </g>
          );
        })}
        <g transform={`translate(${L.rootC.x} ${L.rootC.y})`}>
          <rect x={-82} y={-13} width={164} height={26} rx={13} fill={t.ink} />
          <text y={4.3} textAnchor="middle" fill={t.paper} style={{ fontSize: 12, fontWeight: 720 }}>
            Base Harness H₀
          </text>
        </g>
      </svg>

      {/* ---------------- Explorer's sweep over the training benchmarks */}
      <div ref={sweep} className="pointer-events-none absolute left-0 top-0" style={{ width: 92 * geo.s, height: 644 * geo.s, willChange: 'transform, opacity', visibility: 'hidden' }} aria-hidden>
        <div className="absolute inset-x-0 top-0" style={{ height: 600 * geo.s, background: `linear-gradient(90deg, ${t.explorer}00, ${t.explorer}29, ${t.explorer}00)` }} />
        <img src={exploreCat} alt="" className="absolute" style={{ left: 20 * geo.s, top: 592 * geo.s, width: 52 * geo.s, height: 52 * geo.s }} draggable={false} />
      </div>

      {/* ---------------- bricks: one set, moving between the two trees */}
      <div className="pointer-events-none absolute inset-0 isolate">
        {BENCHES.map((b) => (
          <BrickView
            key={b.id}
            b={b}
            scale={geo.s}
            fill={domColor(b)}
            light={light(b)}
            active={hoverB === b.id}
            dim={!!hiB && !hiB.has(b.id)}
            refs={bricks.current[b.id]}
            onEnter={enter}
            onLeave={leave}
          />
        ))}
      </div>

      {tip && (
        <div className="pointer-events-none absolute left-3 top-3 z-[60] max-w-[300px] rounded-xl border border-rule bg-surface/95 px-3.5 py-2.5 text-[12.5px] shadow-lg backdrop-blur">
          <p className="text-[14px] font-[720] text-ink">
            {tip.name}
            {tip.rebuilt && <span className="text-ink-3"> *</span>}
          </p>
          <p className="mt-0.5 text-ink-3">
            {domainById[tip.domain].name} · {familyById[tip.family].name}
          </p>
          <p className="mt-1.5 text-ink-2">
            Requires <span className="font-[700] text-ink">{pathLabel(tip.node)}</span> · node “{nodeById[tip.node].name}”
          </p>
          <p className="mt-1 text-ink-2">
            {tip.split === 'both' ? 'Simulation (train) and real robot (unseen)' : tip.split === 'unseen' ? 'Unseen benchmark, placed on the fixed tree afterwards' : 'Training benchmark'} · H₀ {tip.scores.it[0]} → H(4) {tip.scores.it[4]}
          </p>
        </div>
      )}
    </div>
  );
}
