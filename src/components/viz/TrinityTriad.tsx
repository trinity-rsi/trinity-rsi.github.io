import { useMemo, useState } from 'react';
import { FLOWS, PAPER, ROLES } from '@/data/paper';
import creatorImg from '@/assets/cats/creator.webp';
import explorerImg from '@/assets/cats/explorer.webp';
import evolverImg from '@/assets/cats/evolver.webp';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * The Trinity as in the film: Creator, Explorer and Evolver once each, in one row. Neighbours
 * trade worlds, trajectories and Harness updates over two curved arrows each (the upper one runs
 * right to left, the lower one left to right); Creator and Evolver close the loop with two long
 * arcs under the frozen backbone all three stand on (Figure 2).
 */
type RoleId = 'creator' | 'explorer' | 'evolver';

const W = 1000;
const H = 560;
const X: Record<RoleId, number> = { creator: 122, explorer: 500, evolver: 878 };
const ORDER: RoleId[] = ['creator', 'explorer', 'evolver'];
const CY = 252; // centre line of the cats
const CAT_H = 192;
const CAT_W = 184;
const RAIL_Y = 396;
const RAIL_H = 30;
const RAIL = { x0: 16, x1: 984 };
const IMG: Record<RoleId, string> = { creator: creatorImg, explorer: explorerImg, evolver: evolverImg };

/** the film's wording for what each role does */
const DOES: Record<RoleId, string> = {
  creator: 'builds verifiable worlds',
  explorer: 'acts in worlds, logs every step',
  evolver: 'organizes capabilities, evolves the Harness',
};

/** arrow labels, broken where the gap between two cats is too narrow for one line */
const LINES: Record<string, string[]> = {
  'Adaptive Harness evolution': ['Adaptive Harness', 'evolution'],
  'Trajectory & outcome feedback': ['Trajectory &', 'outcome feedback'],
};

type Pt = [number, number];
type Flow = {
  key: string;
  from: RoleId;
  to: RoleId;
  label: string;
  P: [Pt, Pt, Pt, Pt]; // cubic, in the direction of the flow
  long: boolean;
  upper: boolean;
  order: number;
};

const path = (P: Pt[]) => `M ${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`;
const at = (P: Pt[], u: number): Pt => {
  const a = 1 - u;
  return [
    a * a * a * P[0][0] + 3 * a * a * u * P[1][0] + 3 * a * u * u * P[2][0] + u * u * u * P[3][0],
    a * a * a * P[0][1] + 3 * a * a * u * P[1][1] + 3 * a * u * u * P[2][1] + u * u * u * P[3][1],
  ];
};

function build(): Flow[] {
  return FLOWS.map((f, i) => {
    const from = f.from as RoleId;
    const to = f.to as RoleId;
    const pair = [from, to].sort().join('+');
    if (pair === 'creator+evolver') {
      // the long loop under the rail: World verification feedback outside, Long-horizon evolution inside
      const outer = from === 'creator';
      const y0 = RAIL_Y + RAIL_H + 6;
      const dip = outer ? y0 + 128 : y0 + 62;
      const xa = X.creator + (outer ? -18 : 44);
      const xb = X.evolver + (outer ? 18 : -44);
      const P: [Pt, Pt, Pt, Pt] = outer
        ? [[xa, y0], [xa, dip], [xb, dip], [xb, y0]]
        : [[xb, y0], [xb, dip], [xa, dip], [xa, y0]];
      return { key: `f${i}`, from, to, label: f.label, P, long: true, upper: !outer, order: i };
    }
    const [l, r] = X[from] < X[to] ? [from, to] : [to, from];
    const xl = X[l] + CAT_W / 2 + 6;
    const xr = X[r] - CAT_W / 2 - 6;
    const upper = X[from] > X[to];
    const y = upper ? CY - 30 : CY + 34;
    const bend = upper ? -56 : 50;
    const c = (xr - xl) * 0.3; // a low hump rather than a half circle
    const P: [Pt, Pt, Pt, Pt] = upper
      ? [[xr, y], [xr - c, y + bend], [xl + c, y + bend], [xl, y]]
      : [[xl, y], [xl + c, y + bend], [xr - c, y + bend], [xr, y]];
    return { key: `f${i}`, from, to, label: f.label, P, long: false, upper, order: i };
  });
}

/** an open chevron, tip at the origin, pointing along +x */
const HEAD = 'M -11 -7.5 L 0 0 L -11 7.5';

export default function TrinityTriad() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<RoleId | null>(null);
  const colors: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const flows = useMemo(build, []);
  const on = (f: Flow) => !hover || f.from === hover || f.to === hover;

  return (
    <div className="relative mx-auto w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-label="Creator, Explorer and Evolver in one row, as in Figure 2: neighbouring roles exchange worlds, trajectories and Harness updates, Creator and Evolver close the loop underneath, and all three stand on one frozen backbone model"
      >
        <defs>
          <linearGradient id="tri-rail" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={t.creator} />
            <stop offset="0.5" stopColor={t.explorer} />
            <stop offset="1" stopColor={t.evolver} />
          </linearGradient>
          <linearGradient id="tri-glint" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.9} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <clipPath id="tri-rail-clip">
            <rect x={RAIL.x0} y={RAIL_Y} width={RAIL.x1 - RAIL.x0} height={4} rx={2} />
          </clipPath>
          {flows.map((f) => (
            <path key={f.key} id={`tri-path-${f.key}`} d={path(f.P)} />
          ))}
          {/* label paths always run left to right, so the long labels never read upside down */}
          {flows
            .filter((f) => f.long)
            .map((f) => (
              <path key={f.key} id={`tri-label-${f.key}`} d={path(f.P[0][0] < f.P[3][0] ? f.P : [f.P[3], f.P[2], f.P[1], f.P[0]])} />
            ))}
        </defs>

        {/* the frozen backbone */}
        <g className="tri-pop" style={{ animationDelay: '0.15s' }}>
          <rect x={RAIL.x0} y={RAIL_Y} width={RAIL.x1 - RAIL.x0} height={RAIL_H} rx={RAIL_H / 2} fill={theme === 'dark' ? '#121826' : '#1b2131'} />
          <rect x={RAIL.x0} y={RAIL_Y} width={RAIL.x1 - RAIL.x0} height={4} rx={2} fill="url(#tri-rail)" />
          {!reduce && (
            <g clipPath="url(#tri-rail-clip)">
              <rect className="row-glint" x={RAIL.x0 - 180} y={RAIL_Y} width={180} height={4} fill="url(#tri-glint)" style={{ ['--glint-dx' as string]: `${RAIL.x1 - RAIL.x0 + 180}px` }} />
            </g>
          )}
          <text x={W / 2} y={RAIL_Y + 21} textAnchor="middle" fill="#e9ecf4" style={{ fontSize: 17, fontWeight: 620, letterSpacing: '0.02em' }}>
            <tspan style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, fontWeight: 500 }}>f</tspan>
            <tspan dy={3.5} style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13 }}>
              θ
            </tspan>
            <tspan dy={-3.5}>{`  one frozen backbone for all three roles · ${PAPER.backbone}`}</tspan>
          </text>
        </g>

        {/* the six flows */}
        {flows.map((f) => {
          const c = colors[f.from];
          const delay = 0.55 + f.order * 0.12;
          const end = f.P[3];
          const pre = at(f.P, 0.96);
          const ang = (Math.atan2(end[1] - pre[1], end[0] - pre[0]) * 180) / Math.PI;
          const apex = at(f.P, 0.5);
          const lines = LINES[f.label] ?? [f.label];
          const dur = f.long ? 3.6 : 2.6;
          return (
            <g key={f.key} style={{ opacity: on(f) ? 1 : 0.14, transition: 'opacity .35s ease' }}>
              <path d={path(f.P)} stroke={c} strokeOpacity={theme === 'dark' ? 0.16 : 0.1} strokeWidth={9} strokeLinecap="round" fill="none" />
              <path
                d={path(f.P)}
                pathLength={1}
                stroke={c}
                strokeOpacity={0.85}
                strokeWidth={2.6}
                strokeLinecap="round"
                fill="none"
                className="row-line"
                style={{ animationDelay: `${delay}s`, animationDuration: f.long ? '1.1s' : '0.85s' }}
              />
              <g transform={`translate(${end[0]} ${end[1]}) rotate(${ang})`}>
                <path d={HEAD} fill="none" stroke={c} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="row-head" style={{ animationDelay: `${delay + (f.long ? 0.95 : 0.7)}s` }} />
              </g>
              {/* one packet running the arrow */}
              {!reduce && (
                <g opacity={0}>
                  <circle r={8} fill={c} opacity={0.2} />
                  <circle r={4} fill={c} />
                  <circle r={1.5} fill="#fff" opacity={0.9} />
                  <animateMotion dur={`${dur}s`} begin={`${1.8 + f.order * 0.5}s`} repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.3 1">
                    <mpath href={`#tri-path-${f.key}`} />
                  </animateMotion>
                  <animate attributeName="opacity" dur={`${dur}s`} begin={`${1.8 + f.order * 0.5}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.12;0.82;1" />
                </g>
              )}
              {/* label */}
              {f.long ? (
                <text
                  dy={f.upper ? 25 : 26}
                  className="fill-ink-2 row-label"
                  style={{ fontSize: 19, fontWeight: 620, animationDelay: `${delay + 0.35}s`, stroke: t.paper, strokeWidth: 4, strokeLinejoin: 'round', paintOrder: 'stroke' }}
                >
                  <textPath href={`#tri-label-${f.key}`} startOffset="50%" textAnchor="middle">
                    {f.label}
                  </textPath>
                </text>
              ) : (
                <text
                  textAnchor="middle"
                  className="fill-ink-2 row-label"
                  style={{ fontSize: 19, fontWeight: 620, animationDelay: `${delay + 0.3}s`, stroke: t.paper, strokeWidth: 4, strokeLinejoin: 'round', paintOrder: 'stroke' }}
                >
                  {lines.map((l, k) => {
                    const n = lines.length;
                    const y = f.upper ? apex[1] - 13 - (n - 1 - k) * 21 : apex[1] + 27 + k * 21;
                    return (
                      <tspan key={k} x={apex[0]} y={y}>
                        {l}
                      </tspan>
                    );
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* the roles */}
      {ORDER.map((id, i) => {
        const role = ROLES.find((x) => x.id === id)!;
        const dim = hover && hover !== id;
        return (
          <div key={id} className="absolute -translate-x-1/2" style={{ left: `${(X[id] / W) * 100}%`, top: 0, width: `${(300 / W) * 100}%`, height: `${((CY + CAT_H / 2) / H) * 100}%` }}>
            <button
              type="button"
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(id)}
              onBlur={() => setHover(null)}
              className="tri-pop group relative flex h-full w-full cursor-default flex-col items-center outline-none"
              style={{ animationDelay: `${0.2 + i * 0.12}s`, opacity: dim ? 0.35 : 1, transition: 'opacity .35s' }}
              aria-label={`${role.name}: ${DOES[id]}`}
            >
              <span className="pointer-events-none block text-center">
                <span className="block text-[clamp(17px,1.75vw,24px)] font-[760] leading-tight tracking-[-0.01em]" style={{ color: colors[id], fontStretch: '112%' }}>
                  {role.name}
                </span>
                <span className="mx-auto mt-0.5 block max-w-[16em] text-[clamp(11.5px,0.95vw,13.5px)] font-[560] leading-snug text-ink-3 [text-wrap:balance]">{DOES[id]}</span>
              </span>
              <span
                className="absolute rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ left: '14%', right: '14%', top: `${((CY - CAT_H / 2 + 30) / (CY + CAT_H / 2)) * 100}%`, bottom: '4%', background: `radial-gradient(circle, ${colors[id]}55, transparent 70%)` }}
                aria-hidden
              />
              <img
                src={IMG[id]}
                alt=""
                draggable={false}
                className="tri-bob absolute bottom-0 left-1/2 -translate-x-1/2 drop-shadow-[0_14px_16px_rgba(0,0,0,0.22)]"
                style={{ height: `${(CAT_H / (CY + CAT_H / 2)) * 100}%`, width: 'auto', maxWidth: `${(CAT_W / 300) * 100 * 1.12}%`, objectFit: 'contain', animationDelay: `${-i * 1.1}s` }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** the same three roles stacked, for narrow screens */
export function TriadChain() {
  const { t } = useTokens();
  const colors: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const flows = useMemo(build, []);
  const between = (a: RoleId, b: RoleId) => flows.filter((f) => [f.from, f.to].sort().join() === [a, b].sort().join());
  const Arrow = ({ f }: { f: Flow }) => (
    <li className="flex items-center gap-2 text-[12.5px] font-[600] text-ink-2">
      <svg viewBox="0 0 12 16" className="h-4 w-3 shrink-0" aria-hidden>
        <path
          d={ORDER.indexOf(f.to) < ORDER.indexOf(f.from) ? 'M6 15 V3 M2 6.5 L6 2 L10 6.5' : 'M6 1 V13 M2 9.5 L6 14 L10 9.5'}
          fill="none"
          stroke={colors[f.from]}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {f.label}
    </li>
  );
  return (
    <div className="rounded-[22px] border border-rule bg-surface/80 p-4 backdrop-blur-sm">
      {ORDER.map((id, i) => {
        const role = ROLES.find((x) => x.id === id)!;
        const next = ORDER[i + 1];
        return (
          <div key={id}>
            <div className="flex items-center gap-3">
              <img src={IMG[id]} alt="" className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]" draggable={false} />
              <div>
                <p className="text-[16px] font-[760] leading-tight" style={{ color: colors[id], fontStretch: '110%' }}>
                  {role.name}
                </p>
                <p className="text-[12.5px] text-ink-3">{DOES[id]}</p>
              </div>
            </div>
            {next && (
              <ul className="my-1.5 ml-[22px] space-y-1.5 border-l-2 border-dashed border-rule py-1.5 pl-4">
                {between(id, next).map((f) => (
                  <Arrow key={f.key} f={f} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <div className="mt-3 rounded-2xl border border-dashed border-rule px-3 py-2">
        <p className="text-[11.5px] font-[700] uppercase tracking-[0.12em] text-ink-3">Evolver ⇄ Creator</p>
        <ul className="mt-1 space-y-1.5">
          {between('creator', 'evolver').map((f) => (
            <Arrow key={f.key} f={f} />
          ))}
        </ul>
      </div>
      <div className="mt-3 rounded-full bg-[#1b2131] px-3 py-1.5 text-center text-[11.5px] font-[620] text-[#e9ecf4]">
        <i className="font-serif">f</i>
        <sub className="font-serif">θ</sub> one frozen backbone · {PAPER.backbone}
      </div>
    </div>
  );
}
