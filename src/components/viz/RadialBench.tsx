import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Setting } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * Figure 5: benchmark-level Harness evolution, one radial chart per split. Every benchmark gets a
 * wedge with five bars (Base, iterations 1–4) that grow outwards in turn when the chart scrolls in.
 * Values: Table 7 (rows keep their reported measures).
 */
const R0 = 56; // inner radius
const R1 = 176; // radius at 100
const SIZE = 600;

function polar(r: number, a: number) {
  return { x: SIZE / 2 + r * Math.cos(a), y: SIZE / 2 + r * Math.sin(a) };
}

function wedgePath(a0: number, a1: number, r0: number, r1: number) {
  const p0 = polar(r0, a0);
  const p1 = polar(r1, a0);
  const p2 = polar(r1, a1);
  const p3 = polar(r0, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} A ${r1} ${r1} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r0} ${r0} 0 ${large} 0 ${p0.x} ${p0.y} Z`;
}

export default function RadialBench({ items, title }: { items: Setting[]; title: string }) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (near) setSeen(true);
  }, [near]);
  const [hover, setHover] = useState<string | null>(null);
  const n = items.length;
  const gapA = 0.012;
  // start at the top, leave a small opening for the scale
  const span = Math.PI * 2 * 0.94;
  const start = -Math.PI / 2 + Math.PI * 2 * 0.03;
  const slot = span / n;

  const sorted = useMemo(() => items, [items]);
  const h = hover ? sorted.find((x) => x.key === hover) : null;

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-auto w-full" role="img" aria-label={`${title}: per-benchmark scores at Base and iterations 1 to 4`}>
        {/* rings */}
        {[25, 50, 75, 100].map((v) => (
          <circle key={v} cx={SIZE / 2} cy={SIZE / 2} r={R0 + ((R1 - R0) * v) / 100} fill="none" stroke={t.rule} strokeWidth={0.8} />
        ))}
        {[0, 25, 50, 75, 100].map((v) => {
          const p = polar(R0 + ((R1 - R0) * v) / 100, -Math.PI / 2);
          return (
            <text key={v} x={p.x + 3} y={p.y + 3} fill={t.ink3} style={{ fontSize: 9 }}>
              {v}
            </text>
          );
        })}
        {sorted.map((s, i) => {
          const a0 = start + i * slot + gapA;
          const a1 = start + (i + 1) * slot - gapA;
          const bw = (a1 - a0) / 5;
          const on = !hover || hover === s.key;
          const mid = (a0 + a1) / 2;
          const lp = polar(R1 + 12, mid);
          const deg = (mid * 180) / Math.PI;
          const flip = deg > 90 && deg < 270;
          return (
            <g key={s.key} onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)} opacity={on ? 1 : 0.25} style={{ transition: 'opacity .25s' }}>
              <path d={wedgePath(a0 - gapA, a1 + gapA, R0 - 4, R1 + 6)} fill="transparent" />
              {s.scores.it.map((v, k) => {
                const r = R0 + ((R1 - R0) * Math.max(0.5, v)) / 100;
                const d = wedgePath(a0 + k * bw, a0 + (k + 1) * bw - 0.0015, R0, r);
                return (
                  <motion.path
                    key={k}
                    d={d}
                    fill={t.iters[k]}
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    animate={seen ? { opacity: 1, scale: 1 } : undefined}
                    style={{ transformOrigin: `${SIZE / 2}px ${SIZE / 2}px` }}
                    transition={{ duration: 0.7, delay: 0.15 + k * 0.42 + (i / n) * 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                );
              })}
              <text
                x={lp.x}
                y={lp.y}
                fill={hover === s.key ? t.ink : t.ink2}
                transform={`rotate(${flip ? deg + 180 : deg} ${lp.x} ${lp.y})`}
                textAnchor={flip ? 'end' : 'start'}
                dominantBaseline="middle"
                style={{ fontSize: 10.5, fontWeight: hover === s.key ? 760 : 560 }}
              >
                {s.label}
                {s.bench.rebuilt ? '*' : ''}
              </text>
            </g>
          );
        })}
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" fill={t.ink} style={{ fontSize: 20, fontWeight: 800, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
          {title}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" fill={t.ink3} style={{ fontSize: 11 }}>
          {n} settings
        </text>
      </svg>
      {h && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[190px] -translate-x-1/2 translate-y-[34px] rounded-xl border border-rule bg-surface/95 px-3 py-2 text-[12px] shadow-lg backdrop-blur">
          <p className="font-[740] text-ink">{h.label}</p>
          <p className="mt-0.5 text-ink-3">{h.bench.measure}</p>
          <div className="mt-1.5 flex justify-between">
            {h.scores.it.map((v, k) => (
              <span key={k} className="text-center">
                <span className="block text-[10px] text-ink-3">{k ? `it ${k}` : 'H₀'}</span>
                <span className="tabular font-[720]" style={{ color: k === 4 ? t.accent : t.ink2 }}>
                  {v}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
