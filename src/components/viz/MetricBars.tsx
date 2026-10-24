import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * A table drawn as bars: one row per method, one bar per metric (Train / Unseen), the value at the
 * bar's end, extra columns (token costs) as text. Bars grow in when the table scrolls into view.
 */
export type BarRow = {
  key: string;
  name: ReactNode;
  sub?: ReactNode;
  group?: string;
  values: Record<string, number>;
  extra?: (string | number | null)[];
  ours?: boolean;
  muted?: boolean;
};
export type Metric = { key: string; label: string; color: string };

export default function MetricBars({ rows, metrics, min = 0, max = 100, extraCols = [], refLine, compact = false }: { rows: BarRow[]; metrics: Metric[]; min?: number; max?: number; extraCols?: string[]; refLine?: { label: string; values: Record<string, number> }; compact?: boolean }) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const grid = `${compact ? 'minmax(96px,0.8fr)' : 'minmax(170px,1.1fr)'} ${metrics.map(() => 'minmax(0,1.5fr)').join(' ')} ${extraCols.map(() => '78px').join(' ')}`;
  let lastGroup: string | undefined;
  return (
    <div className="overflow-x-auto">
      <div className={compact ? "min-w-[360px]" : "min-w-[640px]"}>
        <div className="grid items-end gap-x-4 border-b border-rule pb-2 text-[12px] font-[700] text-ink-3" style={{ gridTemplateColumns: grid }}>
          <span>Method</span>
          {metrics.map((m) => (
            <span key={m.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} />
              {m.label} <span className="font-[500]">(%)</span>
            </span>
          ))}
          {extraCols.map((c) => (
            <span key={c} className="text-right">
              {c}
            </span>
          ))}
        </div>
        {rows.map((r, i) => {
          const head = r.group && r.group !== lastGroup ? r.group : null;
          lastGroup = r.group ?? lastGroup;
          return (
            <div key={r.key}>
              {head && <p className="pt-3 text-[12px] font-[700] italic text-accent">{head}</p>}
              <div
                className={`grid items-center gap-x-4 rounded-xl px-2 py-2.5 ${r.ours ? 'bg-accent-wash' : ''}`}
                style={{ gridTemplateColumns: grid, marginInline: '-0.5rem', opacity: r.muted ? 0.75 : 1 }}
              >
                <div className="min-w-0">
                  <p className={`text-[14px] leading-tight ${r.ours ? 'font-[780] text-ink' : 'font-[620] text-ink'}`}>{r.name}</p>
                  {r.sub && <p className="mt-0.5 text-[11.5px] text-ink-3">{r.sub}</p>}
                </div>
                {metrics.map((m) => {
                  const v = r.values[m.key];
                  const ref = refLine?.values[m.key];
                  return (
                    <div key={m.key} className="relative h-6">
                      <div className="absolute inset-y-0 left-0 right-12">
                        <div className="absolute inset-x-0 inset-y-[9px] rounded-full bg-paper-2" />
                        {ref !== undefined && <div className="absolute inset-y-[3px] w-[2px] rounded-full bg-ink-3/60" style={{ left: `${pct(ref)}%` }} title={`${refLine!.label} ${ref}`} />}
                        <motion.div
                          className="absolute inset-y-[7px] left-0 origin-left rounded-full"
                          style={{ width: `${pct(v)}%`, background: r.muted ? t.iters[0] : m.color }}
                          initial={reduce ? false : { scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                          transition={{ duration: 1.1, delay: 0.1 + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
                        />
                        <motion.span
                          className={`tabular absolute top-1/2 -translate-y-1/2 pl-1.5 text-[12.5px] ${r.ours ? 'font-[800] text-ink' : 'font-[650] text-ink-2'}`}
                          style={{ left: `${pct(v)}%` }}
                          initial={reduce ? false : { opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                          transition={{ duration: 0.6, delay: 0.7 + i * 0.07 }}
                        >
                          {v.toFixed(2)}
                        </motion.span>
                      </div>
                    </div>
                  );
                })}
                {(r.extra ?? []).map((x, j) => (
                  <span key={j} className="tabular text-right text-[12.5px] text-ink-2">
                    {x ?? '–'}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {refLine && (
          <p className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-3">
            <span className="inline-block h-3 w-[2px] rounded bg-ink-3/60" /> {refLine.label}
          </p>
        )}
      </div>
    </div>
  );
}
