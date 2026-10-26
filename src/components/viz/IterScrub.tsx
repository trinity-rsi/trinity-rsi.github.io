import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { motion, useInView } from 'motion/react';
import { MEANS } from '@/data/results';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * Figure 5, to be read with the pointer: Train and Unseen side by side, one cursor across both.
 * Moving over either chart picks the iteration; the means and their gains over H0 are read out
 * underneath. Unseen and its Codex and DeepSeek references cover the 16 non-robot benchmarks.
 * The panel is shared with Table 6 (the robots), which reads whole percentages.
 */
export type Series = { label: string; vals: number[]; color: string; dashed?: boolean };
const W = 420;
const H = 250;
const P = { l: 34, r: 16, t: 22, b: 28 };
const x = (i: number) => P.l + (i / 4) * (W - P.l - P.r);

export function ScrubPanel({
  title,
  sub,
  series,
  lo,
  hi,
  ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) / 3) * i),
  digits = 2,
  unit = '',
  refs,
  it,
  setIt,
  seen,
  label = `${title}: mean performance across iterations (Figure 5)`,
}: {
  title: string;
  sub?: string;
  series: Series[];
  lo: number;
  hi: number;
  ticks?: number[];
  digits?: number;
  unit?: string;
  refs?: { label: string; v: number }[];
  it: number;
  setIt: (i: number) => void;
  seen: boolean;
  label?: string;
}) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const d = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const pick = (e: RPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const u = ((e.clientX - r.left) / r.width) * W;
    setIt(Math.max(0, Math.min(4, Math.round(((u - P.l) / (W - P.l - P.r)) * 4))));
  };
  return (
    <div className="rounded-[18px] border border-rule bg-surface p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full cursor-crosshair touch-pan-y" onPointerMove={pick} onPointerDown={pick} role="img" aria-label={label}>
        <text x={P.l} y={13} fill={t.ink} style={{ fontSize: 13, fontWeight: 760, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
          {title}
          {sub && (
            <tspan dx={7} fill={t.ink3} style={{ fontSize: 11, fontWeight: 600, fontStyle: 'normal', fontFamily: 'var(--font-sans)' }}>
              {sub}
            </tspan>
          )}
        </text>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={t.rule} strokeWidth={0.8} />
            <text x={P.l - 6} y={y(v) + 3.5} textAnchor="end" fill={t.ink3} style={{ fontSize: 10 }}>
              {Math.round(v)}
            </text>
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fill={i === it ? t.ink : t.ink3} style={{ fontSize: 10.5, fontWeight: i === it ? 760 : 500 }}>
            {i === 0 ? 'H₀' : i}
          </text>
        ))}
        {refs?.map((r, i) => (
          <g key={r.label}>
            <line x1={P.l} x2={W - P.r} y1={y(r.v)} y2={y(r.v)} stroke={i ? t.accent : t.ink2} strokeOpacity={0.6} strokeDasharray={i ? '2 3' : '6 4'} strokeWidth={1.2} />
            <text x={W - P.r} y={y(r.v) + (i ? 13 : -5)} textAnchor="end" fill={i ? t.accent : t.ink2} style={{ fontSize: 10.5, fontWeight: 700 }}>
              {r.label} {r.v}
            </text>
          </g>
        ))}
        <motion.line x1={x(it)} x2={x(it)} y1={P.t} y2={H - P.b} stroke={t.ink} strokeOpacity={0.16} strokeWidth={2} animate={{ x1: x(it), x2: x(it) }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
        {series.map((s, si) => (
          <g key={s.label}>
            <motion.path
              d={d(s.vals)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.dashed ? 1.8 : 2.6}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: seen || reduce ? 1 : 0 }}
              transition={{ duration: 1.4, delay: 0.15 + si * 0.25, ease: [0.4, 0, 0.2, 1] }}
            />
            {s.vals.map((v, i) => (
              <motion.circle key={i} cx={x(i)} cy={y(v)} fill={i === 0 ? t.ink3 : s.color} stroke={t.surface} strokeWidth={1.5} animate={{ r: i === it ? 6 : s.dashed ? 3 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule px-1 pt-2.5">
        {series.map((s) => (
          <div key={s.label}>
            <p className="flex items-center gap-1.5 text-[11.5px] font-[650] text-ink-3">
              <span className="h-[3px] w-4 rounded-full" style={{ background: s.color }} /> {s.label}
            </p>
            <p className="tabular mt-0.5 text-[22px] font-[800] leading-none" style={{ color: s.color }}>
              {s.vals[it].toFixed(digits)}
              {unit && <span className="text-[14px] font-[760]">{unit}</span>}
              {it > 0 && <span className="ml-1.5 text-[12.5px] font-[700] text-good">+{(s.vals[it] - s.vals[0]).toFixed(Math.min(digits, 1))}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IterScrub() {
  const { t } = useTokens();
  const [it, setIt] = useState(4);
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, margin: '0px 0px -10% 0px' });
  return (
    <div ref={box}>
      <div className="grid gap-4 md:grid-cols-2">
        <ScrubPanel
          title="Train"
          lo={35}
          hi={80}
          it={it}
          setIt={setIt}
          seen={seen}
          series={[
            { label: 'Mean of 28', vals: MEANS.train, color: t.accent },
            { label: 'Native 17', vals: MEANS.native, color: t.ink2, dashed: true },
          ]}
        />
        <ScrubPanel
          title="Unseen"
          lo={40}
          hi={70}
          it={it}
          setIt={setIt}
          seen={seen}
          series={[{ label: 'Mean of 16', vals: MEANS.unseen, color: t.explorer }]}
          refs={[
            { label: 'Codex', v: MEANS.codex },
            { label: 'DeepSeek', v: MEANS.deepseek },
          ]}
        />
      </div>
      <p className="mt-2 text-center text-[12px] text-ink-3">Move across a chart to read an iteration · iteration 0 is the Base Harness H₀</p>
    </div>
  );
}
