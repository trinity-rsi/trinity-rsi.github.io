import { useMemo } from 'react';
import { CREATOR_LIB, LIB_FAMILIES, type LibModule } from '@/data/results';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { easeInOut, easeOutBack, seg, useLoopClock } from '@/lib/anim';

/**
 * Creator's shared library (Section 3.5 "Creator shared-library update", Appendix C.2, Figure 11).
 * Creator keeps no node inheritance: at the end of iteration 1 the module proposals of all
 * eleven nodes are pooled with the library and consolidated. Nine modules are installed (the
 * nodes that proposed each are drawn as tokens), four pre-RSI rule modules are revised, and near
 * duplicates collapse into one. Iterations 2–4 changed only the node guidance.
 */
const VW = 1280;
const VH = 520;
const NODES = ['a', 'b', 'c', 'd', 'e', 'c→d', 'c→a', 'd→a', 'd→b', 'e→f', 'c→d→a'];
const NODE_X = 70;
const nodeY = (i: number) => 52 + i * 40;
const FUN = { x: 500, y: 250 };
const LB = { x: 650, w: 58, h: 30, gx: 6 };
const ROW_Y = (r: number) => 50 + r * 72;
const COL_X = (c: number) => LB.x + 140 + c * (LB.w + LB.gx);

export default function CreatorLibrary() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const [p] = useLoopClock(12, near && !reduce, reduce ? 0.99 : 0);

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
  // tokens: one per (module, proposing node)
  const tokens = useMemo(
    () =>
      fresh.flatMap((m, mi) => {
        const from = m.from![0] === 'all eleven nodes' ? NODES : m.from!;
        return from.map((n, k) => ({ m, n, k, mi, src: { x: NODE_X + 46, y: nodeY(NODES.indexOf(n)) } }));
      }),
    [fresh]
  );

  // timeline: 0–0.12 library at start · 0.12–0.42 proposals fly in · 0.42–0.55 merge · 0.55–0.75 install · 0.75–0.85 revisions · hold
  const inFly = (k: number) => easeInOut(seg(p, 0.12 + (k % 9) * 0.02, 0.3 + (k % 9) * 0.02));
  const merge = seg(p, 0.42, 0.55);
  const install = (mi: number) => easeOutBack(seg(p, 0.55 + mi * 0.022, 0.66 + mi * 0.022));
  const revise = seg(p, 0.76, 0.86);
  const fade = 1 - seg(p, 0.95, 1);

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

  return (
    <div ref={ref} className="figure-frame overflow-hidden p-4">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="block h-auto w-full" role="img" aria-label="Creator pools module proposals from all eleven nodes, merges and deduplicates them, and installs nine modules into one shared library of 25" style={{ opacity: reduce ? 1 : Math.max(0.35, fade) }}>
        {/* the nodes */}
        <text x={NODE_X} y={22} textAnchor="middle" fill={t.ink3} style={{ fontSize: 12, fontWeight: 700 }}>
          Proposing nodes
        </text>
        {NODES.map((n, i) => (
          <g key={n} transform={`translate(${NODE_X} ${nodeY(i)})`}>
            <rect x={-44} y={-14} width={88} height={28} rx={14} fill={theme === 'dark' ? t.surface2 : t.paper2} stroke={t.rule} />
            <text y={4.5} textAnchor="middle" fill={t.ink} style={{ fontSize: 12.5, fontWeight: 760 }}>
              {n}
            </text>
          </g>
        ))}

        {/* the funnel */}
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

        {/* the library */}
        <text x={COL_X(0)} y={22} fill={t.ink3} style={{ fontSize: 12, fontWeight: 700 }}>
          Shared module library · 25 modules
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
          return <rect key={`slot-${m.id}`} x={s.x} y={s.y} width={LB.w} height={LB.h} rx={5} fill="none" stroke={t.rule2} strokeDasharray="4 4" opacity={1 - install(fresh.indexOf(m))} />;
        })}

        {/* proposals in flight */}
        {tokens.map((tk) => {
          const fly = inFly(tk.k + tk.mi * 2);
          if (fly <= 0 || merge >= 1) return null;
          const cx = tk.src.x + (FUN.x - tk.src.x) * fly;
          const cy = tk.src.y + (FUN.y - tk.src.y) * fly - Math.sin(Math.PI * fly) * 30;
          const op = fly >= 1 ? 1 - merge : 1;
          return (
            <g key={`${tk.m.id}-${tk.n}`} opacity={op}>
              <rect x={cx - 20} y={cy - 9} width={40} height={18} rx={4} fill={famColor(tk.m)} />
              <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" style={{ fontSize: 9.5, fontWeight: 800 }}>
                {tk.m.id}
              </text>
            </g>
          );
        })}

        {/* merged modules go to their slot */}
        {fresh.map((m, mi) => {
          const k = install(mi);
          if (merge < 1 && k <= 0) return null;
          const s = slots[m.id];
          const x = FUN.x - LB.w / 2 + (s.x - (FUN.x - LB.w / 2)) * Math.min(1, k);
          const y = FUN.y - LB.h / 2 + (s.y - (FUN.y - LB.h / 2)) * Math.min(1, k) - Math.sin(Math.PI * Math.min(1, k)) * 40;
          return brick(m, x, y, k > 0 ? 1 : merge, 0, `new-${m.id}`);
        })}

        {/* legend */}
        <g transform={`translate(${COL_X(0) - 140} ${VH - 18})`}>
          <text fill={t.ink3} style={{ fontSize: 11.5 }}>
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
      </svg>
    </div>
  );
}
