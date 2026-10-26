import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { motion, useInView } from 'motion/react';
import PaperFigure from '@/components/ui/PaperFigure';
import GainList from '@/components/viz/GainList';
import { ModulesAndSkills } from '@/components/viz/ResultBits';
import { FIG6, FIG6_COLS, FIG6_ROWS, FINDINGS, MEANS, TABLE3, TABLE5 } from '@/data/results';
import { TRAIN_SETTINGS, UNSEEN_SETTINGS, capById, protocolById } from '@/data/tree';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';
import More from '../ui/More';
import Seg from '../ui/Seg';
import PBars from '../ui/PBars';

/**
 * Results on a phone. Each block leads with the paper's own finding as its title, then the figure
 * or table, made to be touched: the RSI curves are scrubbed with a finger, the tables switch
 * between scores and token costs, the correlations open on a tap. The finding's full text folds.
 */
function Block({ tag, title, children, note }: { tag: string; title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="mt-12 px-5">
      <p className="text-[12.5px] font-[700] text-accent">{tag}</p>
      <h3 className="p-subtitle mt-1">{title}</h3>
      <div className="mt-4">{children}</div>
      {note && (
        <More lines={0} lineHeight={1} label="What the paper says" className="mt-1">
          <p className="pt-1 text-[13.5px] leading-[1.6] text-ink-2">{note}</p>
        </More>
      )}
    </div>
  );
}

/** Figure 5, scrubbed: a finger on the chart picks the iteration and reads its means */
function Curves() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [split, setSplit] = useState<'train' | 'unseen'>('train');
  const [it, setIt] = useState(4);
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, margin: '0px 0px -10% 0px' });
  const W = 340;
  const H = 210;
  const P = { l: 30, r: 16, t: 18, b: 26 };
  const [lo, hi] = split === 'train' ? [35, 80] : [40, 70];
  const x = (i: number) => P.l + (i / 4) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const d = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const series: { label: string; vals: number[]; color: string; dashed?: boolean }[] =
    split === 'train'
      ? [
          { label: 'Mean of 28', vals: MEANS.train, color: t.accent },
          { label: 'Native 17', vals: MEANS.native, color: t.ink2, dashed: true },
        ]
      : [{ label: 'Mean of 16', vals: MEANS.unseen, color: t.explorer }];
  const refs = split === 'unseen' ? [{ label: 'Codex', v: MEANS.codex }, { label: 'DeepSeek', v: MEANS.deepseek }] : [];
  const pick = (e: RPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const u = ((e.clientX - r.left) / r.width) * W;
    setIt(Math.max(0, Math.min(4, Math.round(((u - P.l) / (W - P.l - P.r)) * 4))));
  };
  const ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) / 3) * i);
  return (
    <div ref={box}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Seg
          id="curves"
          label="Benchmarks"
          value={split}
          onChange={(v) => setSplit(v)}
          options={[
            { value: 'train', label: 'Train' },
            { value: 'unseen', label: 'Unseen' },
          ]}
        />
        <p className="text-right text-[11.5px] leading-tight text-ink-3">Drag along the chart</p>
      </div>
      <div className="rounded-[18px] border border-rule bg-surface p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-pan-y" onPointerDown={pick} onPointerMove={(e) => e.buttons && pick(e)} role="img" aria-label="Mean performance across RSI iterations (Figure 5)">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={t.rule} strokeWidth={0.8} />
              <text x={P.l - 6} y={y(v) + 3.5} textAnchor="end" fill={t.ink3} style={{ fontSize: 10 }}>
                {Math.round(v)}
              </text>
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fill={i === it ? t.ink : t.ink3} style={{ fontSize: 10.5, fontWeight: i === it ? 760 : 500 }}>
              {i === 0 ? 'H₀' : i}
            </text>
          ))}
          {refs.map((r, i) => (
            <g key={r.label}>
              <line x1={P.l} x2={W - P.r} y1={y(r.v)} y2={y(r.v)} stroke={i ? t.accent : t.ink2} strokeOpacity={0.6} strokeDasharray={i ? '2 3' : '6 4'} strokeWidth={1.2} />
              <text x={W - P.r} y={y(r.v) + (i ? 12 : -5)} textAnchor="end" fill={i ? t.accent : t.ink2} style={{ fontSize: 10, fontWeight: 700 }}>
                {r.label} {r.v}
              </text>
            </g>
          ))}
          <line x1={x(it)} x2={x(it)} y1={P.t - 4} y2={H - P.b} stroke={t.ink} strokeOpacity={0.18} strokeWidth={1.5} />
          {series.map((s, si) => (
            <g key={`${split}-${s.label}`}>
              <motion.path
                d={d(s.vals)}
                fill="none"
                stroke={s.color}
                strokeWidth={s.dashed ? 1.8 : 2.6}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: seen || reduce ? 1 : 0 }}
                transition={{ duration: 1.2, delay: 0.1 + si * 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
              {s.vals.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={i === it ? 5.5 : 3.6} fill={i === 0 ? t.ink3 : s.color} stroke={t.surface} strokeWidth={1.5} style={{ transition: 'r .2s' }} />
              ))}
            </g>
          ))}
        </svg>
        <div className="grid grid-cols-2 gap-2 border-t border-rule px-2 pb-1 pt-2.5">
          {series.map((s) => (
            <div key={s.label}>
              <p className="flex items-center gap-1.5 text-[11.5px] font-[650] text-ink-3">
                <span className="h-[3px] w-4 rounded-full" style={{ background: s.color }} /> {s.label}
              </p>
              <p className="tabular mt-0.5 text-[20px] font-[800] leading-none" style={{ color: s.color }}>
                {s.vals[it].toFixed(2)}
                {it > 0 && <span className="ml-1.5 text-[12px] font-[700] text-good">+{(s.vals[it] - s.vals[0]).toFixed(1)}</span>}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-3">{it === 0 ? 'Base Harness H₀' : `after iteration ${it}`}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Figure 6: tap a cell for its capability, protocol and correlation */
function Heat() {
  const { t, theme } = useTokens();
  const [sel, setSel] = useState<{ r: number; c: number }>({ r: 1, c: 2 });
  const color = (v: number) => {
    const k = Math.min(1, Math.abs(v) / 0.75);
    const pos = theme === 'dark' ? [240, 96, 90] : [214, 59, 52];
    const neg = theme === 'dark' ? [86, 140, 230] : [57, 110, 200];
    const base = theme === 'dark' ? [21, 26, 40] : [255, 255, 255];
    const c = v >= 0 ? pos : neg;
    return `rgb(${base.map((b, i) => Math.round(b + (c[i] - b) * k * 0.92)).join(',')})`;
  };
  const cap = FIG6_ROWS[sel.r];
  const prot = FIG6_COLS[sel.c];
  const v = FIG6[cap][sel.c];
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${FIG6_COLS.length}, minmax(0,1fr))` }}>
        <span />
        {FIG6_COLS.map((p, c) => (
          <span key={p} className={`pb-1 text-center text-[11px] font-[700] ${sel.c === c ? 'text-ink' : 'text-ink-3'}`}>
            {protocolById[p].abbr.replace('.', '')}
          </span>
        ))}
        {FIG6_ROWS.map((cp, r) => (
          <div key={cp} className="contents">
            <span className="flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded-[5px] text-[10.5px] font-[820] text-white" style={{ background: t.caps[cp] }}>
                {cp}
              </span>
            </span>
            {FIG6[cp].map((val, c) => {
              const on = sel.r === r && sel.c === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSel({ r, c })}
                  className="tabular grid h-10 place-items-center rounded-[8px] text-[11px] font-[700] transition-transform"
                  style={{ background: color(val), color: Math.abs(val) > 0.42 ? '#fff' : t.ink2, outline: on ? `2px solid ${t.ink}` : undefined, outlineOffset: 1, transform: on ? 'scale(1.06)' : undefined }}
                  aria-label={`${capById[cp].name} and ${protocolById[FIG6_COLS[c]].name}: ${val.toFixed(3)}`}
                >
                  {val.toFixed(2)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <motion.p key={`${sel.r}-${sel.c}`} className="mt-3 rounded-[14px] bg-paper-2 px-3 py-2.5 text-[13px] leading-snug text-ink-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <span className="font-[740] text-ink">{capById[cap].name}</span> and <span className="font-[740] text-ink">{protocolById[prot].name}</span>: <span className="tabular font-[800]" style={{ color: v >= 0 ? t.bad : t.caps.c }}>{v.toFixed(3)}</span>
      </motion.p>
    </div>
  );
}

/** Table 5: what adding or removing one relevant module does */
function Interventions() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, margin: '0px 0px -8% 0px' });
  return (
    <div ref={box} className="space-y-2.5">
      {TABLE5.map((r, i) => (
        <div key={r.name} className={r.baseline && i ? 'border-t border-rule pt-3' : ''}>
          <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className={r.baseline ? 'font-[740] text-ink' : 'text-ink-2'}>{r.name}</span>
            <span className="tabular shrink-0">
              <span className={`font-[760] ${r.baseline ? 'text-ink' : 'text-ink-2'}`}>{r.train.toFixed(2)}</span>
              {r.delta !== null && <span className={`ml-2 text-[12px] font-[760] ${r.delta > 0 ? 'text-good' : 'text-bad'}`}>{`${r.delta > 0 ? '+' : '−'}${Math.abs(r.delta).toFixed(2)}`}</span>}
            </span>
          </div>
          <span className="relative mt-1.5 block h-2 overflow-hidden rounded-full bg-paper-2">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: r.ours ? t.accent : r.baseline ? t.iters[0] : r.delta! > 0 ? t.iters[2] : t.iters[1] }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: seen || reduce ? `${(r.train / 80) * 100}%` : 0 }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PResults() {
  const [f1, f2, , f4] = FINDINGS;
  return (
    <section id="results" className="scroll-mt-16 pt-20">
      <Opener kicker="Results" title="+34.1 on training, +26.2 on unseen benchmarks">
        <p className="p-lede">All variants start from the same Base Harness H₀ on a frozen Claude Opus 5: 28 training and 18 unseen benchmarks, the two real robots among the unseen.</p>
      </Opener>

      <Block tag={`Figure 5, Finding ${f2.n}`} title={f2.title} note={<>{f2.text} The first iteration brings the largest gain; iterations 2–4 add another 9.4 Train and 6.4 Unseen points. Unseen and its Codex and DeepSeek references cover the 16 non-robot benchmarks.</>}>
        <Curves />
      </Block>

      <Block tag="Figure 4" title="Every benchmark, from H₀ to iteration 4" note="Each benchmark keeps its own metric on a 0–100 scale: ALE-Bench percentiles, BALROG progress for NetHack and Crafter, DiG-bench’s levels passed.">
        <GainList train={TRAIN_SETTINGS} unseen={UNSEEN_SETTINGS} />
      </Block>

      <Block tag={`Table 3, Finding ${f1.n}`} title={f1.title} note={<>{f1.text} After one RSI iteration, module-only evaluation, no skills.</>}>
        <PBars
          id="table3"
          range={[30, 65]}
          costRange={[480, 620]}
          rows={TABLE3.map((r, i) => ({
            key: `${r.name}-${i}`,
            name: `${r.name}${r.curriculum !== '–' ? ` (${r.curriculum})` : ''}`,
            sub: r.base ? 'no evolution' : `${r.nH} Harness${r.nH === '1' ? '' : 'es'}, ${r.nEnv} environment${r.nEnv === '1' ? '' : 's'}`,
            group: r.group === 'A' ? 'Task vs. capability organization' : r.group === 'B' ? 'Real tasks vs. capability simulation' : undefined,
            score: { train: r.train, unseen: r.unseen },
            cost: { train: r.infTrain, unseen: r.infUnseen },
            ours: r.ours,
            muted: r.base,
          }))}
        />
      </Block>

      <Block tag="Table 2" title="Modules and skills work best together" note="At iteration 1. Module means evolved modules beyond the Base Harness; a skill comes from five preparation trials per benchmark and Harness.">
        <p className="mb-2 flex items-center gap-3 text-[11.5px] font-[700] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Train
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-explorer" /> Unseen
          </span>
        </p>
        <ModulesAndSkills />
      </Block>

      <Block tag={`Figure 6, Table 5, Finding ${f4.n}`} title={f4.title} note={f4.text}>
        <Heat />
        <p className="mb-3 mt-7 text-[13px] font-[700] text-ink">Adding or removing one relevant module (Train, 10%)</p>
        <Interventions />
      </Block>

      <div className="mt-6 px-5">
        <PaperFigure fig={PAPER_FIGS.summary} label="Figure 1: the paper’s summary" />
      </div>
    </section>
  );
}
