import { useRef, useState, type ReactNode } from 'react';
import { motion, useInView } from 'motion/react';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import Seg from './Seg';

/**
 * A results table for a phone: one compact row per method, its two scores (Train, Unseen) as
 * numbers and as two thin bars. When the table also reports token costs, a switch turns the same
 * bars into costs (fewer is better). Bars grow in once the table is on screen.
 */
type Pair = { train: number; unseen?: number };
export type PRow = { key: string; name: ReactNode; sub?: ReactNode; group?: string; score: Pair; cost?: Pair; ours?: boolean; muted?: boolean };

export default function PBars({ id, rows, range, costRange }: { id: string; rows: PRow[]; range: [number, number]; costRange?: [number, number] }) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<'score' | 'cost'>('score');
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, margin: '0px 0px -8% 0px' });
  const cost = mode === 'cost' && !!costRange;
  const [lo, hi] = cost ? costRange! : range;
  const pct = (v: number) => Math.max(2, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const hasUnseen = rows.some((r) => r.score.unseen !== undefined);
  let last: string | undefined;
  return (
    <div ref={box}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11.5px] font-[700] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.accent }} /> Train
          </span>
          {hasUnseen && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.explorer }} /> Unseen
            </span>
          )}
        </div>
        {costRange && (
          <Seg
            id={`pbars-${id}`}
            label="Show"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'score', label: 'Score' },
              { value: 'cost', label: 'Tokens' },
            ]}
          />
        )}
      </div>
      {cost && <p className="mb-1 text-[11.5px] text-ink-3">Estimated total inference tokens (M); fewer is better.</p>}
      <ul>
        {rows.map((r, i) => {
          const head = r.group && r.group !== last ? r.group : null;
          last = r.group ?? last;
          const v = cost ? r.cost! : r.score;
          return (
            <li key={r.key}>
              {head && <p className="pb-0.5 pt-3 text-[12px] font-[720] italic text-accent">{head}</p>}
              <div className={`-mx-2 rounded-[12px] px-2 py-2 ${r.ours ? 'bg-accent-wash' : ''}`} style={{ opacity: r.muted ? 0.72 : 1 }}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`min-w-0 text-[14px] leading-tight text-ink ${r.ours ? 'font-[780]' : 'font-[640]'}`}>{r.name}</p>
                  <p className="tabular shrink-0 text-[13px] font-[760]">
                    <span className="text-accent">{v.train.toFixed(cost ? 1 : 2)}</span>
                    {v.unseen !== undefined && <span className="ml-2 text-explorer">{v.unseen.toFixed(cost ? 1 : 2)}</span>}
                  </p>
                </div>
                {r.sub && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{r.sub}</p>}
                <div className="mt-1.5 space-y-[3px]">
                  {(['train', 'unseen'] as const).map((k, j) =>
                    v[k] === undefined ? null : (
                      <span key={k} className="relative block h-[5px] overflow-hidden rounded-full bg-paper-2">
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: k === 'train' ? t.accent : t.explorer, opacity: r.ours ? 1 : 0.72 }}
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: seen || reduce ? `${pct(v[k]!)}%` : 0 }}
                          transition={{ duration: 0.8, delay: reduce ? 0 : 0.05 + i * 0.06 + j * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
                        />
                      </span>
                    )
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
