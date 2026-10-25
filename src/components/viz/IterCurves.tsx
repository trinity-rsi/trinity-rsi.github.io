import { motion } from 'motion/react';
import { MEANS } from '@/data/results';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/** Figure 5: RSI mean performance across benchmarks; horizontal lines are the Unseen reference means. */
function Panel({ title, series, lo, hi, refs }: { title: string; series: { label: string; vals: number[]; color: string; dashed?: boolean }[]; lo: number; hi: number; refs?: { label: string; v: number }[] }) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const W = 420;
  const H = 260;
  const P = { l: 34, r: 16, t: 26, b: 30 };
  const x = (i: number) => P.l + (i / 4) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const d = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) / 3) * i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${title}: mean performance across iterations`}>
      <text x={W / 2} y={14} textAnchor="middle" fill={t.ink} style={{ fontSize: 13, fontWeight: 760, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
        {title}
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
        <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.5 }}>
          {i}
        </text>
      ))}
      {refs?.map((r, i) => (
        <g key={r.label}>
          <line x1={P.l} x2={W - P.r} y1={y(r.v)} y2={y(r.v)} stroke={i ? t.accent : t.ink2} strokeOpacity={0.6} strokeDasharray={i ? '2 3' : '6 4'} strokeWidth={1.3} />
          <text x={W - P.r} y={y(r.v) + (i ? 13 : -5)} textAnchor="end" fill={i ? t.accent : t.ink2} style={{ fontSize: 10.5, fontWeight: 700 }}>
            {r.label} {r.v}
          </text>
        </g>
      ))}
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
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 1.6, delay: 0.2 + si * 0.25, ease: [0.4, 0, 0.2, 1] }}
          />
          {s.vals.map((v, i) => (
            <motion.circle
              key={i}
              cx={x(i)}
              cy={y(v)}
              r={i === 0 ? 4 : s.dashed ? 3 : 4.2}
              fill={i === 0 ? t.ink3 : s.color}
              stroke={t.surface}
              strokeWidth={1.5}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.35, delay: 0.25 + si * 0.25 + i * 0.32 }}
            />
          ))}
          <motion.text
            x={x(4) - 6}
            y={y(s.vals[4]) + (s.dashed ? 16 : -10)}
            textAnchor="end"
            fill={s.color}
            style={{ fontSize: 13, fontWeight: 800 }}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.8 }}
          >
            {s.vals[4].toFixed(1)}
          </motion.text>
        </g>
      ))}
    </svg>
  );
}

export default function IterCurves() {
  const { t } = useTokens();
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel
          title="Train"
          lo={35}
          hi={80}
          series={[
            { label: 'Benchmark mean', vals: MEANS.train, color: t.accent },
            { label: 'Native Train', vals: MEANS.native, color: t.ink2, dashed: true },
          ]}
        />
        <Panel
          title="Unseen"
          lo={40}
          hi={70}
          series={[{ label: 'Benchmark mean', vals: MEANS.unseen, color: t.explorer }]}
          refs={[
            { label: 'Codex', v: MEANS.codex },
            { label: 'DeepSeek', v: MEANS.deepseek },
          ]}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded" style={{ background: t.accent }} /> Train mean (28)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[2px] w-5 border-t-2 border-dashed" style={{ borderColor: t.ink2 }} /> Native Train (17)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded" style={{ background: t.explorer }} /> Unseen mean (16)
        </span>
        <span>Iteration 0 = Base Harness H₀</span>
      </div>
    </div>
  );
}
