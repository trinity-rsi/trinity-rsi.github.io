import { useMemo } from 'react';
import { CREATOR_LIB, LIB_FAMILIES, type LibModule } from '@/data/results';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { easeInOut, easeOutBack, seg, useLoopClock } from '@/lib/anim';

/**
 * Creator's RSI over one iteration (Section 3.5 "Creator Base Harness update", Appendix C.2,
 * Figure 12). Creator follows Explorer along the same capability tree, top-down: the root's
 * children start from its Base Harness and every other node inherits its parent's updated
 * modules. The proposals the nodes make are pooled at the end of the iteration with the Base
 * Harness modules and consolidated into the next Base Harness, the shared library: in iteration 1
 * nine modules were installed (the proposing nodes are drawn as tokens) and four pre-RSI rule
 * modules revised. Iterations 2–4 changed only the node guidance.
 */
const VW = 1280;
const VH = 520;

/* the capability tree, drawn sideways: depth to the right, leaves one row each */
type TNode = { id: string; parent: string | null; depth: number; row: number };
const TREE: TNode[] = [
  { id: 'c', parent: null, depth: 1, row: 0.5 },
  { id: 'c→d', parent: 'c', depth: 2, row: 0 },
  { id: 'c→d→a', parent: 'c→d', depth: 3, row: 0 },
  { id: 'c→a', parent: 'c', depth: 2, row: 1 },
  { id: 'd', parent: null, depth: 1, row: 2.5 },
  { id: 'd→a', parent: 'd', depth: 2, row: 2 },
  { id: 'd→b', parent: 'd', depth: 2, row: 3 },
  { id: 'a', parent: null, depth: 1, row: 4 },
  { id: 'b', parent: null, depth: 1, row: 5 },
  { id: 'e', parent: null, depth: 1, row: 6 },
  { id: 'e→f', parent: 'e', depth: 2, row: 6 },
];
const ROOT = { x: 70, y: 70 + 3.6 * 58 };
const DEPTH_X = [ROOT.x, 168, 262, 356];
const nodeXY = (n: TNode) => ({ x: DEPTH_X[n.depth], y: 70 + n.row * 58 });
const chipW = (label: string) => 22 + label.length * 7;
const byId = Object.fromEntries(TREE.map((n) => [n.id, n])) as Record<string, TNode>;

/* the pass: one node after another, parents before children */
const PASS0 = 0.07;
const PASS_STEP = 0.03;
const nodeAt = (i: number) => PASS0 + i * PASS_STEP;

const FUN = { x: 575, y: 262 };
const LB = { x: 650, w: 58, h: 30, gx: 6 };
const ROW_Y = (r: number) => 50 + r * 72;
const COL_X = (c: number) => LB.x + 140 + c * (LB.w + LB.gx);

export default function CreatorLibrary() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const [p] = useLoopClock(14, near && !reduce, reduce ? 0.9 : 0);

  const slots = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    LIB_FAMILIES.forEach((f, r) => {
      CREATOR_LIB.filter((m) => m.family === f.id).forEach((m, c) => {
        out[m.id] = { x: COL_X(c), y: ROW_Y(r) };
      });
    });
    return out;
  }, []);

  const fresh = CREATOR_LIB.filter((m) => m.origin === 'it1');
  // proposals: one token per (module, proposing node), parked beside the node once the pass reaches it
  const tokens = useMemo(() => {
    const perNode: Record<string, number> = {};
    return fresh.flatMap((m, mi) => {
      const from = m.from![0] === 'all eleven nodes' ? TREE.map((n) => n.id) : m.from!;
      return from.map((id) => {
        const n = byId[id];
        const j = (perNode[id] = (perNode[id] ?? -1) + 1);
        const c = nodeXY(n);
        const w = chipW(id);
        return { m, mi, id, i: TREE.indexOf(n), park: { x: c.x + w / 2 + 6 + (j % 3) * 13, y: c.y - 13 + Math.floor(j / 3) * 12 } };
      });
    });
  }, [fresh]);

  // 0.07–0.40 the top-down pass · 0.42–0.56 proposals fly to the merge · 0.56–0.62 merge · 0.62–0.80 install · 0.80–0.88 revisions · hold
  const lit = (i: number) => seg(p, nodeAt(i), nodeAt(i) + 0.02);
  const fly = (k: number) => easeInOut(seg(p, 0.42 + (k % 12) * 0.006, 0.52 + (k % 12) * 0.006));
  const merge = seg(p, 0.56, 0.62);
  const install = (mi: number) => easeOutBack(seg(p, 0.62 + mi * 0.018, 0.71 + mi * 0.018));
  const revise = seg(p, 0.8, 0.88);
  const fade = 1 - seg(p, 0.96, 1);
  const passing = p > PASS0 && p < nodeAt(TREE.length);
  const cur = passing ? Math.min(TREE.length - 1, Math.floor((p - PASS0) / PASS_STEP)) : -1;

  const famColor = (m: LibModule) => LIB_FAMILIES.find((f) => f.id === m.family)!.color;
  const brick = (m: LibModule, x: number, y: number, opacity: number, ring = 0, key?: string) => (
    <g key={key ?? m.id} transform={`translate(${x} ${y})`} opacity={opacity}>
      {[0, 1, 2].map((s) => (
        <rect key={s} x={8 + s * 18} y={-5} width={12} height={6} rx={1.5} fill={famColor(m)} />
      ))}
      <rect width={LB.w} height={LB.h} rx={5} fill={famColor(m)} />
      <rect width={LB.w} height={LB.h * 0.4} rx={5} fill="#fff" opacity={0.2} />
      {ring > 0 && <rect x={-4} y={-8} width={LB.w + 8} height={LB.h + 12} rx={8} fill="none" stroke={t.ink} strokeWidth={2} strokeOpacity={ring} />}
      <text x={LB.w / 2} y={LB.h / 2 + 4.5} textAnchor="middle" fill="#fff" style={{ fontSize: 12, fontWeight: 800 }}>
        {m.id}
      </text>
    </g>
  );
  const chipFill = theme === 'dark' ? t.surface2 : t.paper2;

  return (
    <div ref={ref} className="figure-frame overflow-hidden p-4">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Creator evolves along the capability tree top-down: the root's children start from its Base Harness and every other node inherits its parent's updated modules. At the end of the iteration the nodes' proposals are merged and deduplicated with the Base Harness modules into the next Base Harness, a shared library of 25 modules."
        style={{ opacity: reduce ? 1 : Math.max(0.35, fade) }}
      >
        {/* the tree Creator walks, top-down */}
        <text x={ROOT.x - 40} y={24} fill={t.ink3} style={{ fontSize: 12, fontWeight: 700 }}>
          Iteration 1 · nodes evolve top-down, children inherit
        </text>
        {TREE.map((n) => {
          const a = n.parent ? nodeXY(byId[n.parent]) : ROOT;
          const aw = n.parent ? chipW(n.parent) : 104;
          const b = nodeXY(n);
          const bw = chipW(n.id);
          const x1 = a.x + aw / 2;
          const x2 = b.x - bw / 2;
          const k = lit(TREE.indexOf(n));
          const d = `M ${x1} ${a.y} C ${x1 + (x2 - x1) * 0.55} ${a.y}, ${x2 - (x2 - x1) * 0.55} ${b.y}, ${x2} ${b.y}`;
          return (
            <g key={`e-${n.id}`}>
              <path d={d} fill="none" stroke={t.rule2} strokeWidth={1.6} />
              <path d={d} fill="none" stroke={t.creator} strokeWidth={2.4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - k} strokeOpacity={0.85} />
            </g>
          );
        })}
        <g transform={`translate(${ROOT.x} ${ROOT.y})`}>
          <rect x={-52} y={-24} width={104} height={48} rx={14} fill={t.ink} />
          <text y={-3} textAnchor="middle" fill={t.paper} style={{ fontSize: 12, fontWeight: 760 }}>
            Base Harness
          </text>
          <text y={13} textAnchor="middle" fill={t.paper} opacity={0.7} style={{ fontSize: 11, fontWeight: 600 }}>
            of Creator
          </text>
        </g>
        {TREE.map((n, i) => {
          const c = nodeXY(n);
          const w = chipW(n.id);
          const k = lit(i);
          const on = i === cur;
          return (
            <g key={n.id} transform={`translate(${c.x} ${c.y})`}>
              {on && <rect x={-w / 2 - 6} y={-20} width={w + 12} height={40} rx={20} fill={t.creator} opacity={0.16} />}
              <rect x={-w / 2} y={-14} width={w} height={28} rx={14} fill={k > 0.5 ? (theme === 'dark' ? '#3a2c10' : '#fbefd9') : chipFill} stroke={k > 0.5 ? t.creator : t.rule} strokeWidth={k > 0.5 ? 1.6 : 1} />
              <text y={4.5} textAnchor="middle" fill={t.ink} style={{ fontSize: 12.5, fontWeight: 760 }}>
                {n.id}
              </text>
            </g>
          );
        })}

        {/* proposals: parked at their node, then pooled */}
        {tokens.map((tk, k) => {
          const born = easeOutBack(seg(p, nodeAt(tk.i) + 0.012, nodeAt(tk.i) + 0.03));
          if (born <= 0 || merge >= 1) return null;
          const f = fly(k);
          const x = tk.park.x + (FUN.x - tk.park.x) * f;
          const y = tk.park.y + (FUN.y - tk.park.y) * f - Math.sin(Math.PI * f) * 34;
          const s = Math.min(1, born) * (1 + 0.6 * f);
          return (
            <g key={`${tk.m.id}-${tk.id}`} transform={`translate(${x} ${y}) scale(${s})`} opacity={f >= 1 ? 1 - merge : 1}>
              <rect x={-5.5} y={-4.5} width={11} height={9} rx={2} fill={famColor(tk.m)} />
              <rect x={-5.5} y={-4.5} width={11} height={3.6} rx={2} fill="#fff" opacity={0.25} />
            </g>
          );
        })}

        {/* the merge */}
        <g transform={`translate(${FUN.x} ${FUN.y})`}>
          <circle r={58} fill={t.creator} opacity={0.08 + 0.14 * Math.sin(Math.PI * merge)} />
          <circle r={40} fill="none" stroke={t.creator} strokeWidth={1.6} strokeDasharray="5 6" />
          <text y={-74} textAnchor="middle" fill={t.creator} style={{ fontSize: 13, fontWeight: 780 }}>
            Merge &amp; deduplicate
          </text>
          <text y={84} textAnchor="middle" fill={t.ink3} style={{ fontSize: 11 }}>
            end of iteration 1
          </text>
        </g>

        {/* the library: the next Base Harness */}
        <text x={COL_X(0)} y={22} fill={t.ink3} style={{ fontSize: 12, fontWeight: 700 }}>
          Next Base Harness · shared library of 25 modules
        </text>
        {LIB_FAMILIES.map((f, r) => (
          <text key={f.id} x={COL_X(0) - 14} y={ROW_Y(r) + 20} textAnchor="end" fill={t.ink2} style={{ fontSize: 11.5, fontWeight: 650 }}>
            {f.name}
          </text>
        ))}
        {CREATOR_LIB.filter((m) => m.origin !== 'it1').map((m) => {
          const s = slots[m.id];
          const ring = m.revisedIt1 ? Math.sin(Math.PI * revise) : 0;
          return brick(m, s.x, s.y, 1, ring);
        })}
        {/* empty slots waiting for the new modules */}
        {fresh.map((m) => {
          const s = slots[m.id];
          return <rect key={`slot-${m.id}`} x={s.x} y={s.y} width={LB.w} height={LB.h} rx={5} fill="none" stroke={t.rule2} strokeDasharray="4 4" opacity={1 - Math.min(1, install(fresh.indexOf(m)))} />;
        })}

        {/* merged modules go to their slot */}
        {fresh.map((m, mi) => {
          const k = install(mi);
          // (easeOutBack(0) is not exactly 0 in floating point)
          if (merge < 1 && k <= 1e-6) return null;
          const s = slots[m.id];
          const x = FUN.x - LB.w / 2 + (s.x - (FUN.x - LB.w / 2)) * Math.min(1, k);
          const y = FUN.y - LB.h / 2 + (s.y - (FUN.y - LB.h / 2)) * Math.min(1, k) - Math.sin(Math.PI * Math.min(1, k)) * 40;
          return brick(m, x, y, k > 1e-6 ? 1 : merge, 0, `new-${m.id}`);
        })}

        {/* legend */}
        <g transform={`translate(${VW - 12} ${VH - 18})`}>
          <text textAnchor="end" fill={t.ink3} style={{ fontSize: 11.5 }}>
            <tspan fontWeight={700} fill={t.ink2}>
              11
            </tspan>{' '}
            bootstrap audits and{' '}
            <tspan fontWeight={700} fill={t.ink2}>
              5
            </tspan>{' '}
            rule modules before RSI ·{' '}
            <tspan fontWeight={700} fill={t.ink2}>
              9
            </tspan>{' '}
            installed and{' '}
            <tspan fontWeight={700} fill={t.ink2}>
              4
            </tspan>{' '}
            revised at the end of iteration 1 · iterations 2–4 changed only node guidance
          </text>
        </g>
        <text x={ROOT.x - 40} y={VH - 18} fill={t.ink3} style={{ fontSize: 11.5 }}>
          a coloured token = a module a node proposed
        </text>
      </svg>
    </div>
  );
}
