import { motion } from 'motion/react';
import { TABLE2, TABLE5 } from '@/data/results';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/** Table 2 as four columns of paired bars */
export function ModulesAndSkills() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const h = (v: number) => `${Math.max(4, ((v - 30) / 40) * 100)}%`;
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
      {TABLE2.map((r, i) => (
        <div key={r.name} className={`rounded-[16px] px-1.5 pb-3 pt-4 sm:px-3 ${r.ours ? 'bg-accent-wash' : ''}`} style={{ opacity: r.base ? 0.78 : 1 }}>
          <div className="flex h-[112px] items-end justify-center gap-1.5 border-b border-rule pb-0 sm:h-[132px] sm:gap-2">
            {(['train', 'unseen'] as const).map((k, j) => (
              <motion.span
                key={k}
                className="block w-5 origin-bottom rounded-t-[6px] sm:w-6"
                style={{ height: h(r[k]), background: k === 'train' ? t.accent : t.explorer, opacity: r.ours ? 1 : 0.72 }}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.08 + j * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              />
            ))}
          </div>
          <p className={`mt-2.5 text-center text-[12px] leading-tight sm:text-[13.5px] ${r.ours ? 'font-[780] text-ink' : 'font-[640] text-ink'}`}>{r.name}</p>
          <p className="tabular mt-0.5 text-center text-[11.5px] font-[740] sm:text-[13px]">
            <span className="text-accent">{r.train.toFixed(2)}</span> <span className="text-explorer">{r.unseen.toFixed(2)}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

/** Table 5: adding or removing one relevant module */
export function Interventions() {
  const { t } = useTokens();
  return (
    <div className="space-y-2">
      {TABLE5.map((r, i) => (
        <div key={r.name} className={`grid grid-cols-[136px_minmax(0,1fr)_48px_54px] items-center gap-3 text-[13px] ${r.baseline && i ? 'mt-3 border-t border-rule pt-3' : ''}`}>
          <span className={r.baseline ? 'font-[720] text-ink' : 'text-ink-2'}>{r.name}</span>
          <span className="relative h-2.5 rounded-full bg-paper-2">
            <motion.span
              className="absolute inset-y-0 left-0 origin-left rounded-full"
              style={{ width: `${(r.train / 80) * 100}%`, background: r.ours ? t.accent : r.baseline ? t.iters[0] : r.delta! > 0 ? t.iters[2] : t.iters[1] }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.15 + i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </span>
          <span className={`tabular text-right font-[720] ${r.baseline ? 'text-ink' : 'text-ink-2'}`}>{r.train.toFixed(2)}</span>
          <span className={`tabular text-right text-[12px] font-[720] ${r.delta === null ? 'text-ink-3' : r.delta > 0 ? 'text-good' : 'text-bad'}`}>
            {r.delta === null ? '–' : `${r.delta > 0 ? '+' : '−'}${Math.abs(r.delta).toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
}
