import { useState } from 'react';
import { motion } from 'motion/react';
import { FIG6, FIG6_COLS, FIG6_ROWS } from '@/data/results';
import { capById, protocolById } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery, useReducedMotion } from '@/lib/hooks';

/** Figure 6: capability–protocol correlations of the 29 modules at iteration 4 (red positive, blue negative). */
export default function CorrHeatmap() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const phone = !useMediaQuery('(min-width: 640px)');
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const color = (v: number) => {
    const k = Math.min(1, Math.abs(v) / 0.75);
    const pos = theme === 'dark' ? [240, 96, 90] : [214, 59, 52];
    const neg = theme === 'dark' ? [86, 140, 230] : [57, 110, 200];
    const base = theme === 'dark' ? [21, 26, 40] : [255, 255, 255];
    const c = v >= 0 ? pos : neg;
    return `rgb(${base.map((b, i) => Math.round(b + (c[i] - b) * k * 0.92)).join(',')})`;
  };
  return (
    <div className={phone ? '' : 'overflow-x-auto'}>
      <div className={phone ? '' : 'min-w-[520px]'}>
        <div className={`grid ${phone ? 'gap-1' : 'gap-1.5'}`} style={{ gridTemplateColumns: phone ? `58px repeat(${FIG6_COLS.length}, minmax(0,1fr))` : `minmax(150px,1.4fr) repeat(${FIG6_COLS.length}, minmax(0,1fr))` }}>
          <span />
          {FIG6_COLS.map((p, c) => (
            <span key={p} className={`pb-1 text-center text-[12px] font-[700] transition-colors ${hover?.c === c ? 'text-ink' : 'text-ink-3'}`}>
              {protocolById[p].abbr}
            </span>
          ))}
          {FIG6_ROWS.map((cap, r) => (
            <div key={cap} className="contents">
              <span className={`flex items-center font-[640] transition-colors ${phone ? 'gap-1.5 pr-0.5 text-[11.5px]' : 'gap-2 pr-2 text-[12.5px]'} ${hover?.r === r ? 'text-ink' : 'text-ink-2'}`}>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-[10.5px] font-[800] text-white" style={{ background: t.caps[cap] }}>
                  {cap}
                </span>
                <span className={phone ? 'whitespace-nowrap' : 'truncate'}>
                  {capById[cap].abbr}
                  {!phone && <span className="text-ink-3"> · {capById[cap].name}</span>}
                </span>
              </span>
              {FIG6[cap].map((v, c) => {
                const strong = Math.abs(v) >= 0.27;
                const lit = !hover || hover.r === r || hover.c === c;
                return (
                  <motion.div
                    key={c}
                    onMouseEnter={() => setHover({ r, c })}
                    onMouseLeave={() => setHover(null)}
                    className={`relative grid place-items-center rounded-lg tabular ${phone ? 'h-10 text-[11.5px]' : 'h-11 text-[12.5px]'}`}
                    style={{ background: color(v), color: Math.abs(v) > 0.4 ? '#fff' : t.ink, fontWeight: strong ? 780 : 560, opacity: lit ? 1 : 0.35, outline: hover?.r === r && hover?.c === c ? `2px solid ${t.ink}` : 'none' }}
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: lit ? 1 : 0.35, scale: 1 }}
                    viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                    transition={{ duration: 0.45, delay: (r + c) * 0.045, ease: [0.2, 0.9, 0.3, 1.2] }}
                  >
                    {phone ? v.toFixed(2) : v.toFixed(3)}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11.5px] text-ink-3">
          <span>−1</span>
          <span className="h-2 w-40 rounded-full" style={{ background: `linear-gradient(90deg, ${color(-0.75)}, ${color(0)}, ${color(0.75)})` }} />
          <span>+1</span>
          <span className="ml-2">Columns: the six protocols of Section 2.2</span>
        </div>
      </div>
    </div>
  );
}
