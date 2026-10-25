import { useState } from 'react';
import { FLOWS, PAPER, ROLES } from '@/data/paper';
import creatorImg from '@/assets/cats/creator.webp';
import explorerImg from '@/assets/cats/explorer.webp';
import evolverImg from '@/assets/cats/evolver.webp';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * The Trinity as a triangle: Evolver on top, Creator and Explorer below, co-evolving. Every side
 * carries two curved arrows, one each way: the outer arc and the inner arc on the two upper
 * sides, and Generate world / Explore world along the base with "Co-evolution" between them.
 * Feedback flows are purple, the flows that build or evolve something are ink.
 */
type RoleId = 'creator' | 'explorer' | 'evolver';
type Pt = [number, number];

const VB = { x: 0, y: 22, w: 1000, h: 684 };
const CAT_H = 176;
const C: Record<RoleId, Pt> = { evolver: [500, 178], creator: [160, 548], explorer: [840, 548] };
const IMG: Record<RoleId, string> = { creator: creatorImg, explorer: explorerImg, evolver: evolverImg };
const ORDER: RoleId[] = ['evolver', 'creator', 'explorer'];

/** a flow of Figure 2: its arc (in the direction of the flow), where its label sits, and its lines */
type Flow = { from: RoleId; to: RoleId; label: string; P: [Pt, Pt, Pt, Pt]; feedback: boolean; side: 'outer' | 'inner' | 'top' | 'bottom'; lines: string[] };

const GEO: Record<string, { P: [Pt, Pt, Pt, Pt]; side: Flow['side']; lines?: string[] }> = {
  'creator>explorer': { P: [[262, 520], [370, 474], [630, 474], [738, 520]], side: 'top' },
  'explorer>creator': { P: [[738, 612], [630, 662], [370, 662], [262, 612]], side: 'bottom' },
  'creator>evolver': { P: [[150, 448], [126, 298], [248, 166], [402, 160]], side: 'outer', lines: ['World verification', 'feedback'] },
  'evolver>creator': { P: [[440, 284], [432, 372], [352, 454], [262, 470]], side: 'inner', lines: ['Long-horizon Harness', 'evolution'] },
  'evolver>explorer': { P: [[598, 160], [752, 166], [874, 298], [850, 448]], side: 'outer', lines: ['Adaptive Harness', 'evolution'] },
  'explorer>evolver': { P: [[738, 470], [648, 454], [568, 372], [560, 284]], side: 'inner', lines: ['Trajectory and', 'outcome-level feedback'] },
};

const FLOW_LIST: Flow[] = FLOWS.map((f) => {
  const g = GEO[`${f.from}>${f.to}`];
  return { from: f.from as RoleId, to: f.to as RoleId, label: f.label, P: g.P, side: g.side, feedback: /feedback/i.test(f.label), lines: g.lines ?? [f.label] };
});

const path = (P: Pt[]) => `M ${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`;
const at = (P: Pt[], u: number): Pt => {
  const a = 1 - u;
  return [
    a * a * a * P[0][0] + 3 * a * a * u * P[1][0] + 3 * a * u * u * P[2][0] + u * u * u * P[3][0],
    a * a * a * P[0][1] + 3 * a * a * u * P[1][1] + 3 * a * u * u * P[2][1] + u * u * u * P[3][1],
  ];
};
/** labels follow an arc but always read left to right */
const ltr = (P: [Pt, Pt, Pt, Pt]): [Pt, Pt, Pt, Pt] => (P[0][0] <= P[3][0] ? P : [P[3], P[2], P[1], P[0]]);
const HEAD = 'M -12 -8 L 0 0 L -12 8';

export default function TrinityTriangle() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<RoleId | null>(null);
  const role: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const ink = theme === 'dark' ? '#c9cedc' : '#2a2f3d';
  const purple = t.caps.b;
  const on = (f: Flow) => !hover || f.from === hover || f.to === hover;

  return (
    <div className="relative mx-auto w-full select-none" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <svg
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-label="The Trinity as a triangle, as in Figure 2: Evolver on top, Creator and Explorer below. Creator generates worlds and Explorer explores them; Explorer sends trajectory and outcome-level feedback to Evolver, which returns adaptive Harness evolution; Creator sends world verification feedback to Evolver, which returns long-horizon Harness evolution. All three co-evolve on one frozen backbone."
      >
        <defs>
          {FLOW_LIST.map((f, i) => (
            <g key={i}>
              <path id={`tt-path-${i}`} d={path(f.P)} />
              <path id={`tt-label-${i}`} d={path(ltr(f.P))} />
            </g>
          ))}
        </defs>

        {/* the six flows */}
        {FLOW_LIST.map((f, i) => {
          const c = f.feedback ? purple : ink;
          const delay = 0.55 + i * 0.12;
          const end = f.P[3];
          const pre = at(f.P, 0.95);
          const ang = (Math.atan2(end[1] - pre[1], end[0] - pre[0]) * 180) / Math.PI;
          const apex = at(f.P, 0.5);
          const dur = 2.8;
          const labelStyle = {
            fontSize: 19,
            fontWeight: 650,
            animationDelay: `${delay + 0.3}s`,
            stroke: t.paper,
            strokeWidth: 5,
            strokeLinejoin: 'round' as const,
            paintOrder: 'stroke' as const,
          };
          return (
            <g key={i} style={{ opacity: on(f) ? 1 : 0.13, transition: 'opacity .35s ease' }}>
              <path d={path(f.P)} stroke={c} strokeOpacity={theme === 'dark' ? 0.14 : 0.08} strokeWidth={10} strokeLinecap="round" fill="none" />
              <path d={path(f.P)} pathLength={1} stroke={c} strokeOpacity={0.9} strokeWidth={3} strokeLinecap="round" fill="none" className="row-line" style={{ animationDelay: `${delay}s` }} />
              <g transform={`translate(${end[0]} ${end[1]}) rotate(${ang})`}>
                <path d={HEAD} fill="none" stroke={c} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className="row-head" style={{ animationDelay: `${delay + 0.7}s` }} />
              </g>
              {!reduce && (
                <g opacity={0}>
                  <circle r={9} fill={c} opacity={0.18} />
                  <circle r={4.4} fill={c} />
                  <circle r={1.6} fill="#fff" opacity={0.9} />
                  <animateMotion dur={`${dur}s`} begin={`${1.9 + i * 0.47}s`} repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.3 1">
                    <mpath href={`#tt-path-${i}`} />
                  </animateMotion>
                  <animate attributeName="opacity" dur={`${dur}s`} begin={`${1.9 + i * 0.47}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.12;0.82;1" />
                </g>
              )}
              {f.side === 'top' || f.side === 'bottom' ? (
                <text x={apex[0]} y={f.side === 'top' ? apex[1] - 15 : apex[1] + 32} textAnchor="middle" fill={c} className="row-label" style={labelStyle}>
                  {f.label}
                </text>
              ) : (
                // two lines along the arc: outside the triangle above the arc, inside below it
                f.lines.map((l, k) => (
                  <text key={k} dy={f.side === 'outer' ? -14 - (f.lines.length - 1 - k) * 22 : 25 + k * 21} fill={c} className="row-label" style={{ ...labelStyle, fontSize: f.side === 'inner' ? 17.5 : 19 }}>
                    <textPath href={`#tt-label-${i}`} startOffset={f.side === 'inner' ? (f.to === 'creator' ? '60%' : '40%') : '50%'} textAnchor="middle">
                      {l}
                    </textPath>
                  </text>
                ))
              )}
            </g>
          );
        })}

        {/* co-evolution, on one frozen backbone */}
        <g className="row-label" style={{ animationDelay: '1.4s' }}>
          <text x={500} y={580} textAnchor="middle" fill={t.ink} style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', fontStretch: '108%' }}>
            Co-evolution
          </text>
          <text x={500} y={607} textAnchor="middle" fill={t.ink3} style={{ fontSize: 14.5, fontWeight: 600 }}>
            <tspan style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17, fontWeight: 500 }}>f</tspan>
            <tspan dy={3} style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11 }}>
              θ
            </tspan>
            <tspan dy={-3}>{`  one frozen backbone · ${PAPER.backbone}`}</tspan>
          </text>
        </g>

        {/* the role names: Evolver above its cat, Creator and Explorer below theirs */}
        {ORDER.map((id) => {
          const r = ROLES.find((x) => x.id === id)!;
          const [x, y] = C[id];
          const above = id === 'evolver';
          return (
            <text
              key={id}
              x={x}
              y={above ? y - CAT_H / 2 - 18 : y + CAT_H / 2 + 44}
              textAnchor="middle"
              fill={role[id]}
              className="row-label"
              style={{ fontSize: 38, fontWeight: 780, letterSpacing: '-0.01em', fontStretch: '112%', animationDelay: '0.35s', opacity: hover && hover !== id ? 0.35 : undefined, transition: 'opacity .35s' }}
            >
              {r.name}
            </text>
          );
        })}
      </svg>

      {/* the cats */}
      {ORDER.map((id, i) => {
        const r = ROLES.find((x) => x.id === id)!;
        const [x, y] = C[id];
        const dim = hover && hover !== id;
        return (
          <button
            key={id}
            type="button"
            onMouseEnter={() => setHover(id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(id)}
            onBlur={() => setHover(null)}
            className="tri-pop group absolute -translate-x-1/2 cursor-default outline-none"
            style={{
              left: `${((x - VB.x) / VB.w) * 100}%`,
              top: `${((y - CAT_H / 2 - VB.y) / VB.h) * 100}%`,
              height: `${(CAT_H / VB.h) * 100}%`,
              animationDelay: `${0.15 + i * 0.12}s`,
              opacity: dim ? 0.35 : 1,
              transition: 'opacity .35s',
            }}
            aria-label={`${r.name}: ${r.verb}`}
          >
            <span className="absolute inset-[-12%] rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${role[id]}50, transparent 68%)` }} aria-hidden />
            <img src={IMG[id]} alt="" draggable={false} className="tri-bob relative block h-full w-auto drop-shadow-[0_14px_16px_rgba(0,0,0,0.22)]" style={{ animationDelay: `${-i * 1.1}s` }} />
          </button>
        );
      })}
    </div>
  );
}

/** the same three roles stacked, for narrow screens */
export function TriangleChain() {
  const { t } = useTokens();
  const role: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const ink = t.ink2;
  const pairs: [RoleId, RoleId][] = [
    ['creator', 'explorer'],
    ['explorer', 'evolver'],
    ['evolver', 'creator'],
  ];
  const DOES: Record<RoleId, string> = { creator: 'builds verifiable worlds', explorer: 'acts in worlds, logs every step', evolver: 'organizes capabilities, evolves the Harness' };
  const Head = ({ id }: { id: RoleId }) => {
    const r = ROLES.find((x) => x.id === id)!;
    return (
      <div className="flex items-center gap-3">
        <img src={IMG[id]} alt="" className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]" draggable={false} />
        <div>
          <p className="text-[16px] font-[760] leading-tight" style={{ color: role[id], fontStretch: '110%' }}>
            {r.name}
          </p>
          <p className="text-[12.5px] text-ink-3">{DOES[id]}</p>
        </div>
      </div>
    );
  };
  return (
    <div className="rounded-[22px] border border-rule bg-surface/80 p-4 backdrop-blur-sm">
      {pairs.map(([a, b], k) => (
        <div key={k}>
          {k === 0 && <Head id={a} />}
          <ul className="my-1.5 ml-[22px] space-y-1.5 border-l-2 border-dashed border-rule py-1.5 pl-4">
            {FLOW_LIST.filter((f) => (f.from === a && f.to === b) || (f.from === b && f.to === a)).map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-[12.5px] font-[600]" style={{ color: f.feedback ? t.caps.b : ink }}>
                <svg viewBox="0 0 12 16" className="h-4 w-3 shrink-0" aria-hidden>
                  <path d={f.from === a ? 'M6 1 V13 M2 9.5 L6 14 L10 9.5' : 'M6 15 V3 M2 6.5 L6 2 L10 6.5'} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f.label}
              </li>
            ))}
          </ul>
          {k < pairs.length - 1 ? <Head id={b} /> : <p className="ml-1 text-[12px] font-[700] uppercase tracking-[0.12em] text-ink-3">back to Creator · co-evolution</p>}
        </div>
      ))}
      <div className="mt-3 rounded-full bg-[#1b2131] px-3 py-1.5 text-center text-[11.5px] font-[620] text-[#e9ecf4]">
        <i className="font-serif">f</i>
        <sub className="font-serif">θ</sub> one frozen backbone · {PAPER.backbone}
      </div>
    </div>
  );
}
