import { useMemo, useState } from 'react';
import { BENCHES, CAP_NODES, DOMAINS, FAMILIES, capById, domainById, familyById, nodeById, nodeLineage, pathLabel, type Bench, type NodeId } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useLegoPalette } from './Lego';
import exploreCat from '@/assets/cats/explorer-explore.webp';

/**
 * Task tree → capability tree, in bricks (Appendix A → B: Figure 7 → Figure 9).
 * `stage` is a float in [0, 4]:
 *   0–1  task tree: 44 benchmarks on 15 task-family plates, under 5 domains
 *   1–2  world exploration: Explorer runs H0 on every benchmark (bars: H0 score, Table 7)
 *   2–3  requirement organization: every brick's studs become the capabilities it requires
 *   3–4  capability tree: the bricks fly to the node of their capability combination
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

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

export type MorphLayout = ReturnType<typeof buildLayout>;

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
      const s = plateSize(bricks.length, 2);
      const rows = Math.ceil(bricks.length / 2);
      taskPlates.push({ key: f.id, label: twoLines(f.name, 30), x, y, w: COLW, h: 6, cols: 2, bricks });
      y -= rows * CELL_H + PAD + TAB + 26;
      void s;
    });
  });
  const taskPos: Record<string, { x: number; y: number }> = {};
  taskPlates.forEach((p) => Object.assign(taskPos, brickSlots(p)));

  /* ---------- capability tree: Figure 9 arrangement */
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

  // flight order: by destination, left to right, bottom to top
  const order = [...BENCHES].sort((a, b) => capPos[a.id].y - capPos[b.id].y || capPos[a.id].x - capPos[b.id].x).map((b) => b.id);

  return { taskPlates, taskPos, hubs, rootT, capPlates, capPos, rootC, order };
}

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

/** a front-view brick with its label; `caps` replaces the studs with capability tiles */
function Brick({ b, x, y, rot, opacity, fill, light, caps, scoreW, active, onEnter, onLeave }: {
  b: Bench;
  x: number;
  y: number;
  rot: number;
  opacity: number;
  fill: string;
  light: string;
  caps: number;
  scoreW: number;
  active: boolean;
  onEnter: () => void;
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
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)} ${BW / 2} ${BH / 2})`} opacity={opacity} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ cursor: 'default' }}>
      {/* studs, or capability tiles while diagnosing */}
      {Array.from({ length: studs }, (_, i) => {
        const cx = (BW / studs) * (i + 0.5);
        return <rect key={i} x={cx - 7} y={-SH + 1} width={14} height={SH + 1} rx={2} fill={body} opacity={1 - caps} />;
      })}
      {caps > 0.01 &&
        node.path.map((c, i) => {
          const n = node.path.length;
          const cx = BW / 2 + (i - (n - 1) / 2) * 17;
          return (
            <g key={c} opacity={caps} transform={`translate(${cx - 7.5} ${-SH - 4 - (1 - caps) * 6})`}>
              <rect width={15} height={13} rx={3} fill={t.caps[c]} />
              <text x={7.5} y={9.6} textAnchor="middle" fill="#fff" style={{ fontSize: 9.5, fontWeight: 800 }}>
                {c}
              </text>
            </g>
          );
        })}
      <rect width={BW} height={BH} rx={4} fill={body} stroke={active ? t.ink : 'transparent'} strokeWidth={1.6} />
      {split && <rect x={BW / 2} width={BW / 2} height={BH} rx={4} fill={light} />}
      {split && <rect x={BW / 2} width={6} height={BH} fill={light} />}
      <rect width={BW} height={BH * 0.4} rx={4} fill="#ffffff" opacity={0.18} />
      <rect y={BH - 3} width={BW} height={3} rx={1.5} fill="#000" opacity={0.13} />
      {scoreW > 0 && <rect x={3} y={BH - 4} width={Math.max(0, (BW - 6) * scoreW)} height={2.6} rx={1.3} fill={unseen || split ? '#1d2230' : '#ffffff'} opacity={0.75} />}
      <text x={BW / 2} y={BH / 2 + 3.9} textAnchor="middle" fill={split ? '#1d2230' : ink} style={{ fontSize: 11, fontWeight: 680, letterSpacing: '-0.01em' }}>
        {b.short ?? b.name}
        {b.rebuilt ? '*' : ''}
      </text>
    </g>
  );
}

export default function BrickMorph({ stage, fit = false }: { stage: number; fit?: boolean }) {
  const { t, theme } = useTokens();
  const LP = useLegoPalette();
  const L = useMemo(buildLayout, []);
  const [hoverB, setHoverB] = useState<string | null>(null);
  const [hoverN, setHoverN] = useState<NodeId | null>(null);

  const explore = smooth(0.85, 1.6, stage);
  const exploreOn = explore * (1 - smooth(2.6, 3.0, stage));
  const scan = clamp01((stage - 1) / 0.85); // the Explorer's sweep across the domains
  const caps = smooth(2.0, 2.45, stage);
  const morph = smooth(2.85, 3.75, stage);
  const taskTree = 1 - smooth(2.9, 3.3, stage);
  const capTree = smooth(3.15, 3.6, stage);

  const domColor = (b: Bench) => t.domains[b.domain];
  const light = (b: Bench) => mixHex(domColor(b), theme === 'dark' ? '#2a3044' : '#ffffff', theme === 'dark' ? 0.5 : 0.58);

  const tOf = (id: string) => {
    const i = L.order.indexOf(id);
    const delay = (i / L.order.length) * 0.42;
    return ease(clamp01((morph - delay) / 0.58));
  };

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
  const on = (id: string) => !hiB || hiB.has(id);

  const tip = hoverB ? BENCHES.find((b) => b.id === hoverB)! : null;

  const plateEl = (p: Plate, color: string, opacity: number, label: string[], key: string, strong: boolean) => (
    <g key={key} opacity={opacity}>
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

  return (
    <div className={fit ? 'relative h-full w-full' : 'relative'}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={fit ? 'block h-full w-full' : 'block h-auto w-full'} role="img" aria-label="Forty-four benchmark bricks move from fifteen task-family plates under five domains to eleven capability-tree nodes">
        {/* ---------------- task tree */}
        <g opacity={taskTree} pointerEvents={taskTree > 0.5 ? 'auto' : 'none'}>
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
          {L.taskPlates.map((p) => plateEl(p, t.ink2, 1, p.label, `tp-${p.key}`, false))}
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
        </g>

        {/* ---------------- capability tree */}
        <g opacity={capTree} pointerEvents={capTree > 0.5 ? 'auto' : 'none'}>
          {L.capPlates.map((p) => {
            const n = nodeById[p.node];
            const parent = n.parent === 'root' ? null : L.capPlates.find((q) => q.node === n.parent)!;
            const from = parent ? { x: parent.x + parent.w / 2, y: parent.y - (Math.ceil(parent.bricks.length / parent.cols) || 1) * CELL_H - 10 } : { x: L.rootC.x, y: L.rootC.y - 12 };
            const lit = !hiN || hiN.has(p.node);
            return <path key={`ce-${p.key}`} d={edge(from.x, from.y, p.x + p.w / 2, p.y + 40)} fill="none" stroke={lit ? t.accent : t.rule2} strokeOpacity={lit ? 0.55 : 0.4} strokeWidth={lit && hiN ? 2 : 1.4} />;
          })}
          {L.capPlates.map((p) => {
            const lit = !hiN || hiN.has(p.node);
            return (
              <g key={`cp-${p.key}`} onMouseEnter={() => setHoverN(p.node)} onMouseLeave={() => setHoverN(null)} style={{ cursor: 'default' }} opacity={lit ? 1 : 0.35}>
                <rect x={p.x - 6} y={p.y - (Math.ceil(p.bricks.length / p.cols) || 1) * CELL_H - 6} width={p.w + 12} height={(Math.ceil(p.bricks.length / p.cols) || 1) * CELL_H + 48} rx={12} fill="transparent" />
                {plateEl(p, t.ink, 1, p.label, `cpl-${p.key}`, true)}
                {p.bricks.length === 0 && (
                  <text x={p.x + p.w / 2} y={p.y - 10} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.5, fontStyle: 'italic' }}>
                    all under e → f
                  </text>
                )}
              </g>
            );
          })}
          <g transform={`translate(${L.rootC.x} ${L.rootC.y})`}>
            <rect x={-82} y={-13} width={164} height={26} rx={13} fill={t.ink} />
            <text y={4.3} textAnchor="middle" fill={t.paper} style={{ fontSize: 12, fontWeight: 720 }}>
              Base Harness H₀
            </text>
          </g>
        </g>

        {/* ---------------- Explorer's sweep */}
        {exploreOn > 0.02 && scan < 1 && (
          <g opacity={exploreOn * (1 - smooth(0.92, 1, scan))}>
            <rect x={20 + scan * (VB_W - 40) - 46} y={20} width={92} height={600} fill={`url(#bm-scan)`} />
            <image href={exploreCat} x={20 + scan * (VB_W - 40) - 26} y={612} width={52} height={52} />
          </g>
        )}
        <defs>
          <linearGradient id="bm-scan" x1="0" x2="1">
            <stop offset="0" stopColor={t.explorer} stopOpacity={0} />
            <stop offset="0.5" stopColor={t.explorer} stopOpacity={0.16} />
            <stop offset="1" stopColor={t.explorer} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* ---------------- bricks (one set, moving between the two trees) */}
        {[...BENCHES]
          .sort((a, b) => tOf(a.id) - tOf(b.id))
          .map((b) => {
            const A = L.taskPos[b.id];
            const C = L.capPos[b.id];
            const k = tOf(b.id);
            const lift = Math.sin(Math.PI * k) * 64;
            const x = lerp(A.x, C.x, k);
            const y = lerp(A.y, C.y, k) - lift;
            const rot = Math.sin(Math.PI * k) * (C.x > A.x ? 6 : -6);
            // each brick's H0 run completes when the sweep passes it
            const ran = clamp01((scan * (VB_W - 40) + 20 - A.x) / 60) * exploreOn;
            const base = b.scores.it[0] / 100;
            return (
              <Brick
                key={b.id}
                b={b}
                x={x}
                y={y}
                rot={rot}
                opacity={on(b.id) ? 1 : 0.22}
                fill={domColor(b)}
                light={light(b)}
                caps={caps}
                scoreW={ran * base}
                active={hoverB === b.id}
                onEnter={() => setHoverB(b.id)}
                onLeave={() => setHoverB(null)}
              />
            );
          })}
      </svg>

      {tip && (
        <div className="pointer-events-none absolute left-3 top-3 max-w-[300px] rounded-xl border border-rule bg-surface/95 px-3.5 py-2.5 text-[12.5px] shadow-lg backdrop-blur">
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
            {tip.split === 'both' ? 'Simulation (train) and real robot (unseen)' : tip.split === 'unseen' ? 'Unseen benchmark' : 'Training benchmark'} · H₀ {tip.scores.it[0]} → H(4) {tip.scores.it[4]}
          </p>
        </div>
      )}
    </div>
  );
}
