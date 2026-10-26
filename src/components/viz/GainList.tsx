import { useState } from 'react';
import { motion } from 'motion/react';
import type { Setting } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * Figure 4 for phones, where the radial charts' labels would be too small to read: the same
 * scores (Table 8) as a ranked list, Base to iteration 4, one split at a time.
 */
export default function GainList({ train, unseen }: { train: Setting[]; unseen: Setting[] }) {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [split, setSplit] = useState<'train' | 'unseen'>('train');
  const [all, setAll] = useState(false);
  const items = [...(split === 'train' ? train : unseen)].sort((a, b) => b.scores.it[4] - b.scores.it[0] - (a.scores.it[4] - a.scores.it[0]));
  const shown = all ? items : items.slice(0, 10);
  const ink = split === 'train' ? t.accent : t.explorer;
  return (
    <div>
      <div className="mb-4 inline-flex rounded-full bg-paper-2 p-1" role="radiogroup" aria-label="Split">
        {(['train', 'unseen'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={split === k}
            onClick={() => {
              setSplit(k);
              setAll(false);
            }}
            className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-[700] transition-colors ${split === k ? 'text-ink' : 'text-ink-3'}`}
          >
            {split === k && <motion.span layoutId="gain-split" className="absolute inset-0 rounded-full bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">
              {k === 'train' ? 'Train' : 'Unseen'} · {(k === 'train' ? train : unseen).length}
            </span>
          </button>
        ))}
      </div>
      <ol className="space-y-2.5">
        {shown.map((s, i) => {
          const b = s.scores.it[0];
          const e = s.scores.it[4];
          return (
            <li key={`${split}-${s.key}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1">
              <span className="truncate text-[14px] font-[650] text-ink">{s.label}</span>
              <span className="tabular text-[13px] text-ink-3">
                {b} → <b className="font-[780]" style={{ color: ink }}>{e}</b>
              </span>
              <span className="relative col-span-2 h-2 overflow-hidden rounded-full bg-paper-2">
                <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${b}%`, background: t.iters[0] }} />
                <motion.span
                  className="absolute inset-y-0 rounded-full"
                  style={{ left: `${b}%`, background: ink }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${Math.max(0, e - b)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: Math.min(i, 10) * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </span>
            </li>
          );
        })}
      </ol>
      {items.length > 10 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-4 inline-flex h-10 items-center rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
          {all ? 'Show the top ten' : `Show all ${items.length}`}
        </button>
      )}
      <p className="mt-3 flex items-center gap-2 text-[12px] text-ink-3">
        <span className="h-2 w-4 rounded-full" style={{ background: t.iters[0] }} /> Base
        <span className="ml-1 h-2 w-4 rounded-full" style={{ background: ink }} /> gain by iteration 4 · sorted by gain
      </p>
    </div>
  );
}
