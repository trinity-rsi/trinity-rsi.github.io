import { useMemo, useState } from 'react';
import { FLOWS, PAPER, ROLES } from '@/data/paper';
import creatorImg from '@/assets/cats/creator.webp';
import explorerImg from '@/assets/cats/explorer.webp';
import evolverImg from '@/assets/cats/evolver.webp';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * The three roles in one row, drawn as the top band of Figure 2: Evolver ⇄ Creator ⇄ Explorer ⇄
 * Evolver, with Evolver at both ends so that every pair of roles that exchange something stand
 * next to each other. Each pair trades two straight arrows, the upper one running right to left
 * and the lower one left to right; all four stand on the same rail, the one frozen backbone.
 */
type RoleId = 'creator' | 'explorer' | 'evolver';

const W = 1200;
const H = 304;
const MARGIN = 94;
const STEP = (W - 2 * MARGIN) / 3;
const STATIONS: { role: RoleId; x: number }[] = (['evolver', 'creator', 'explorer', 'evolver'] as RoleId[]).map((role, i) => ({ role, x: MARGIN + i * STEP }));
const CAT_W = 146; // cat image width, in viewBox units
const CY = 176; // centre line between each pair's two arrows
const LANE = 9; // half the distance between the two arrows
const RAIL_Y = 268;
const RAIL_H = 22;
const IMG: Record<RoleId, string> = { creator: creatorImg, explorer: explorerImg, evolver: evolverImg };

/** label lines for the arrows (the paper's wording, broken where the gap is too narrow) */
const LINES: Record<string, string[]> = {
  'World verification feedback': ['World verification', 'feedback'],
  'Long-horizon Harness evolution': ['Long-horizon', 'Harness evolution'],
  'Adaptive Harness evolution': ['Adaptive Harness', 'evolution'],
  'Trajectory & outcome feedback': ['Trajectory &', 'outcome feedback'],
};

type Arrow = { key: string; from: RoleId; to: RoleId; label: string; x1: number; x2: number; y: number; upper: boolean; order: number };

/** the six flows of Figure 2, each placed between the two stations it connects */
function arrows(): Arrow[] {
  const out: Arrow[] = [];
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const L = STATIONS[i];
    const R = STATIONS[i + 1];
    const xl = L.x + CAT_W / 2 + 16;
    const xr = R.x - CAT_W / 2 - 16;
    // upper lane: right station → left station; lower lane: left → right
    const up = FLOWS.find((f) => f.from === R.role && f.to === L.role)!;
    const down = FLOWS.find((f) => f.from === L.role && f.to === R.role)!;
    out.push({ key: `${i}-u`, from: up.from, to: up.to, label: up.label, x1: xr, x2: xl, y: CY - LANE, upper: true, order: i * 2 });
    out.push({ key: `${i}-d`, from: down.from, to: down.to, label: down.label, x1: xl, x2: xr, y: CY + LANE, upper: false, order: i * 2 + 1 });
  }
  return out;
}

/** a dart-shaped arrowhead, tip at the origin, pointing along +x */
const HEAD = 'M 2 0 L -9.5 -5.6 Q -6.6 0 -9.5 5.6 Z';

export default function TrinityRow() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<RoleId | null>(null);
  const colors: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const list = useMemo(arrows, []);
  const on = (a: Arrow) => !hover || a.from === hover || a.to === hover;

  return (
    <div className="relative mx-auto w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-label="Evolver, Creator, Explorer and Evolver again in one row, as in Figure 2: neighbouring roles exchange worlds, trajectories and Harness updates, and all stand on one frozen backbone model"
      >
        <defs>
          <linearGradient id="row-rail" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={t.evolver} />
            <stop offset="0.36" stopColor={t.creator} />
            <stop offset="0.64" stopColor={t.explorer} />
            <stop offset="1" stopColor={t.evolver} />
          </linearGradient>
          <linearGradient id="row-glint" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          {(['creator', 'explorer', 'evolver'] as RoleId[]).map((r) => (
            <linearGradient key={r} id={`row-tail-${r}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={colors[r]} stopOpacity={0} />
              <stop offset="1" stopColor={colors[r]} stopOpacity={0.85} />
            </linearGradient>
          ))}
          <clipPath id="row-rail-clip">
            <rect x={22} y={RAIL_Y} width={W - 44} height={4} rx={2} />
          </clipPath>
        </defs>

        {/* the shared frozen backbone: every role stands on it */}
        <g className="tri-pop" style={{ animationDelay: '0.1s' }}>
          <rect x={22} y={RAIL_Y} width={W - 44} height={RAIL_H} rx={RAIL_H / 2} fill={theme === 'dark' ? '#121826' : '#1b2131'} />
          <rect x={22} y={RAIL_Y} width={W - 44} height={3.5} rx={1.75} fill="url(#row-rail)" />
          {!reduce && (
            <g clipPath="url(#row-rail-clip)">
              <rect className="row-glint" x={-160} y={RAIL_Y} width={160} height={4} fill="url(#row-glint)" style={{ ['--glint-dx' as string]: `${W + 160}px` }} />
            </g>
          )}
          <text x={W / 2} y={RAIL_Y + 15.5} textAnchor="middle" fill="#e9ecf4" style={{ fontSize: 12.5, fontWeight: 620, letterSpacing: '0.02em' }}>
            <tspan style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, fontWeight: 500 }}>f</tspan>
            <tspan dy={3} style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10 }}>
              θ
            </tspan>
            <tspan dy={-3}>{`  one frozen backbone for all three roles · ${PAPER.backbone}`}</tspan>
          </text>
        </g>

        {/* the six flows */}
        {list.map((a) => {
          const c = colors[a.from];
          const dir = Math.sign(a.x2 - a.x1);
          const len = Math.abs(a.x2 - a.x1);
          const lineEnd = a.x2 - dir * 7; // the dart covers the last few units
          const lines = LINES[a.label] ?? [a.label];
          const delay = 0.5 + a.order * 0.09;
          const mid = (a.x1 + a.x2) / 2;
          return (
            <g key={a.key} style={{ opacity: on(a) ? 1 : 0.14, transition: 'opacity .35s ease' }}>
              {/* soft lane under the arrow */}
              <path d={`M ${a.x1} ${a.y} L ${a.x2} ${a.y}`} stroke={c} strokeOpacity={theme === 'dark' ? 0.16 : 0.11} strokeWidth={8} strokeLinecap="round" fill="none" />
              <path
                d={`M ${a.x1} ${a.y} L ${lineEnd} ${a.y}`}
                pathLength={1}
                stroke={c}
                strokeWidth={2.2}
                strokeLinecap="round"
                fill="none"
                className="row-line"
                style={{ animationDelay: `${delay}s` }}
              />
              <g transform={`translate(${a.x2} ${a.y}) rotate(${dir > 0 ? 0 : 180})`}>
                <path d={HEAD} fill={c} className="row-head" style={{ animationDelay: `${delay + 0.55}s` }} />
              </g>
              {/* one packet travelling the arrow, with a short tail behind it */}
              {!reduce && (
                <g transform={`translate(${a.x1} ${a.y}) scale(${dir} 1)`}>
                  <g className="row-packet" style={{ ['--packet-dx' as string]: `${len - 12}px`, animationDelay: `${1.6 + a.order * 0.55}s`, animationDuration: `${2.6 + (a.order % 3) * 0.25}s` }}>
                    <rect x={-22} y={-1.6} width={22} height={3.2} rx={1.6} fill={`url(#row-tail-${a.from})`} />
                    <circle r={7} fill={c} opacity={0.18} />
                    <circle r={3.4} fill={c} />
                    <circle r={1.3} fill="#fff" opacity={0.9} />
                  </g>
                </g>
              )}
              {/* label: above the upper arrow, below the lower one */}
              <text
                textAnchor="middle"
                className="fill-ink-2 row-label"
                style={{ fontSize: 13, fontWeight: 620, animationDelay: `${delay + 0.2}s`, stroke: t.paper, strokeWidth: 4, strokeLinejoin: 'round', paintOrder: 'stroke' }}
              >
                {lines.map((l, k) => {
                  const n = lines.length;
                  const y = a.upper ? a.y - 12 - (n - 1 - k) * 15.5 : a.y + 22 + k * 15.5;
                  return (
                    <tspan key={k} x={mid} y={y}>
                      {l}
                    </tspan>
                  );
                })}
              </text>
            </g>
          );
        })}
      </svg>

      {/* the roles */}
      {STATIONS.map((s, i) => {
        const role = ROLES.find((x) => x.id === s.role)!;
        const dim = hover && hover !== s.role;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2"
            style={{ left: `${(s.x / W) * 100}%`, top: 0, width: `${((CAT_W + 46) / W) * 100}%`, height: `${((RAIL_Y + 3) / H) * 100}%` }}
          >
            <button
              type="button"
              onMouseEnter={() => setHover(s.role)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.role)}
              onBlur={() => setHover(null)}
              className="tri-pop group relative flex h-full w-full cursor-default flex-col items-center justify-end outline-none"
              style={{ animationDelay: `${0.15 + i * 0.1}s`, opacity: dim ? 0.35 : 1, transition: 'opacity .35s' }}
              aria-label={`${role.name}: ${role.verb}`}
            >
              <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-center">
                <span className="block text-[clamp(13px,1.35vw,17px)] font-[740] tracking-[-0.01em]" style={{ color: colors[s.role], fontStretch: '112%' }}>
                  {role.name}
                </span>
                <span className="block text-[clamp(11px,1.05vw,13px)] font-[560] text-ink-3">{role.verb}</span>
              </span>
              <span
                className="absolute inset-x-[12%] bottom-[6%] top-[34%] rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${colors[s.role]}55, transparent 70%)` }}
                aria-hidden
              />
              <img
                src={IMG[s.role]}
                alt=""
                draggable={false}
                className="tri-bob relative mb-[1%] drop-shadow-[0_14px_16px_rgba(0,0,0,0.25)]"
                style={{ width: `${(CAT_W / (CAT_W + 46)) * 100}%`, animationDelay: `${-i * 1.1}s` }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** the same chain stacked vertically, for narrow screens */
export function TrinityChain() {
  const { t } = useTokens();
  const colors: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const list = useMemo(arrows, []);
  return (
    <div className="rounded-[22px] border border-rule bg-surface/80 p-4 backdrop-blur-sm">
      {STATIONS.map((s, i) => {
        const role = ROLES.find((x) => x.id === s.role)!;
        const pair = i < STATIONS.length - 1 ? list.filter((a) => a.key.startsWith(`${i}-`)) : [];
        return (
          <div key={i}>
            <div className="flex items-center gap-3">
              <img src={IMG[s.role]} alt="" className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]" draggable={false} />
              <div>
                <p className="text-[16px] font-[760] leading-tight" style={{ color: colors[s.role], fontStretch: '110%' }}>
                  {role.name}
                </p>
                <p className="text-[12.5px] text-ink-3">{role.verb}</p>
              </div>
            </div>
            {pair.length > 0 && (
              <div className="my-1.5 ml-[22px] flex items-stretch gap-3 border-l-2 border-dashed border-rule py-1.5 pl-4">
                <ul className="space-y-1.5">
                  {pair.map((a) => (
                    <li key={a.key} className="flex items-center gap-2 text-[12.5px] font-[600] text-ink-2">
                      <svg viewBox="0 0 12 16" className="h-4 w-3 shrink-0" aria-hidden>
                        <path d={a.upper ? 'M6 15 V3 M2 6.5 L6 2 L10 6.5' : 'M6 1 V13 M2 9.5 L6 14 L10 9.5'} fill="none" stroke={colors[a.from]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {a.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-3 rounded-full bg-[#1b2131] px-3 py-1.5 text-center text-[11.5px] font-[620] text-[#e9ecf4]">
        <i className="font-serif">f</i>
        <sub className="font-serif">θ</sub> one frozen backbone · {PAPER.backbone}
      </div>
    </div>
  );
}
