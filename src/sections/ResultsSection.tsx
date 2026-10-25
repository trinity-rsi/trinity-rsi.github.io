import { motion } from 'motion/react';
import ScrollFloat from '@/components/reactbits/ScrollFloat/ScrollFloat';
import { Container, Section } from '@/components/ui/Section';
import Finding from '@/components/ui/Finding';
import Reveal from '@/components/ui/Reveal';
import PaperFigure from '@/components/ui/PaperFigure';
import MetricBars from '@/components/viz/MetricBars';
import IterCurves from '@/components/viz/IterCurves';
import RadialBench from '@/components/viz/RadialBench';
import CorrHeatmap from '@/components/viz/CorrHeatmap';
import { FINDINGS, HEADLINE, TABLE2, TABLE3, TABLE5 } from '@/data/results';
import { TRAIN_SETTINGS, UNSEEN_SETTINGS } from '@/data/tree';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';

function Card({ tag, title, sub, children, className = '' }: { tag: string; title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <Reveal className={`figure-frame p-5 sm:p-6 ${className}`}>
      <p className="text-[12.5px] font-[700] text-accent">{tag}</p>
      <p className="mt-1 text-[17px] font-[740] leading-snug text-ink">{title}</p>
      {sub && <p className="mt-1 text-[13px] leading-snug text-ink-3">{sub}</p>}
      <div className="mt-5">{children}</div>
    </Reveal>
  );
}

export default function ResultsSection() {
  const { t } = useTokens();
  const [f1, f2, , f4] = FINDINGS;
  const order = (xs: typeof TRAIN_SETTINGS) => [...xs].sort((a, b) => a.scores.it[4] - a.scores.it[0] - (b.scores.it[4] - b.scores.it[0])).reverse();

  return (
    <Section id="results" tone="alt" className="py-28">
      <Container wide>
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
          <ScrollFloat containerClassName="!my-0" textClassName="!text-[clamp(2.6rem,6.4vw,5.6rem)] !leading-[0.95] !font-[800] tracking-[-0.04em] text-ink [font-stretch:120%]" animationDuration={1} stagger={0.025} mode="enter">
            Results
          </ScrollFloat>
          <div className="space-y-3">
            <p className="font-serif text-[1.08rem] leading-[1.6] text-ink-2">
              Every variant starts from the same Base Harness H₀ and uses a frozen Claude Opus 5 backbone. 28 training and 18 unseen benchmarks, the two real robots among the unseen; means weight benchmarks equally.
            </p>
            <PaperFigure fig={PAPER_FIGS.summary} label="Figure 1: the paper’s summary" />
          </div>
        </div>

        {/* recursive self-improvement */}
        <div className="mt-16 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card tag="Figure 5" title="RSI mean performance across benchmarks" sub="Train covers all 28 benchmarks, with a dashed curve for the 17 native ones; Unseen and its Codex and DeepSeek references cover the 16 non-robot benchmarks. The first iteration brings the largest gain; iterations 2–4 add another 9.4 Train and 6.4 Unseen points.">
            <IterCurves />
          </Card>
          <div className="flex flex-col justify-center gap-4">
            <Finding n={f2.n} title={f2.title}>
              {f2.text}
            </Finding>
            <Reveal className="grid grid-cols-2 gap-3">
              {[
                { v: `+${HEADLINE.trainGain.toFixed(1)}`, l: `points on ${HEADLINE.trainCount} training benchmarks (39.06 → 73.16)` },
                { v: `+${HEADLINE.unseenGain.toFixed(1)}`, l: `points on ${HEADLINE.unseenCount} unseen benchmarks, robots included (37.45 → 63.61)` },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl border border-rule bg-surface p-4">
                  <p className="tabular text-[34px] font-[820] leading-none tracking-[-0.03em] text-accent [font-stretch:112%]">{x.v}</p>
                  <p className="mt-1.5 text-[13px] text-ink-3">{x.l}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        <Card className="mt-6" tag="Figure 4" title="Benchmark-level Harness evolution" sub="28 Train and 18 Unseen benchmarks; each wedge is one benchmark, its five bars Base and iterations 1–4 (sorted by gain). Scores keep each benchmark’s own metric on a 0–100 scale: ALE-Bench percentiles, BALROG progress for NetHack and Crafter, DiG-bench’s levels passed. Hover a wedge for its values.">
          <div className="grid gap-4 lg:grid-cols-2">
            <RadialBench items={order(TRAIN_SETTINGS)} title="Train" />
            <RadialBench items={order(UNSEEN_SETTINGS)} title="Unseen" />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[12px] text-ink-2">
            {['Base', 'Iter. 1', 'Iter. 2', 'Iter. 3', 'Iter. 4'].map((l, k) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: t.iters[k] }} />
                {l}
              </span>
            ))}
          </div>
        </Card>

        {/* organisation */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card tag="Table 3" title="Harness organization and training curricula" sub="After one RSI iteration, all with module-only evaluation and no skills. # H Harness configurations, # Env. training environments; tokens are totals in M.">
            <MetricBars
              min={30}
              max={65}
              metrics={[
                { key: 'train', label: 'Train', color: t.accent },
                { key: 'unseen', label: 'Unseen', color: t.explorer },
              ]}
              extraCols={['Training', 'Inf. Unseen']}
              rows={TABLE3.map((r, i) => ({
                key: `${r.name}-${i}`,
                name: `${r.name}${r.curriculum !== '–' ? ` (${r.curriculum})` : ''}`,
                sub: r.base ? 'no evolution' : `${r.nH} Harness${r.nH === '1' ? '' : 'es'} · ${r.nEnv} environment${r.nEnv === '1' ? '' : 's'}`,
                group: r.group === 'A' ? 'A. Task vs. capability organization' : r.group === 'B' ? 'B. Real tasks vs. capability simulation' : undefined,
                values: { train: r.train, unseen: r.unseen },
                extra: [r.training === null ? null : r.training.toFixed(2), r.infUnseen.toFixed(2)],
                ours: r.ours,
                muted: r.base,
              }))}
            />
          </Card>
          <div className="flex flex-col gap-4">
            <Finding n={f1.n} title={f1.title}>
              {f1.text}
            </Finding>
            <Card tag="Table 2" title="Preliminary comparison: modules and skills" sub="At iteration 1. Module means evolved modules beyond the Base Harness; a skill comes from five preparation trials per benchmark and Harness. Combining both beats either alone.">
              <MetricBars
                min={30}
                max={70}
                metrics={[
                  { key: 'train', label: 'Train', color: t.accent },
                  { key: 'unseen', label: 'Unseen', color: t.explorer },
                ]}
                compact
                rows={TABLE2.map((r) => ({ key: r.name, name: r.name, values: { train: r.train, unseen: r.unseen }, ours: r.ours, muted: r.base }))}
              />
            </Card>
          </div>
        </div>

        {/* capability–module relationships */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card tag="Figure 6" title="Capability–protocol correlations of the 29 modules at iteration 4" sub="The strongest positive association in each row links PST to Memory (0.306), HCI to Inference (0.744), CFR to Planning (0.274), GVT to Loop (0.444) and VEA to Perception (0.347); VC correlates equally with Perception and Memory (0.286).">
            <CorrHeatmap />
          </Card>
          <div className="flex flex-col gap-4">
            <Card tag="Table 5" title="Module interventions" sub="Train (10 %), skills prepared as in Section 4.1. Δ is the difference from each bold baseline; inference tokens in M.">
              <div className="space-y-2">
                {TABLE5.map((r, i) => (
                  <div key={r.name} className={`grid grid-cols-[132px_minmax(0,1fr)_44px_52px] items-center gap-3 text-[13px] ${r.baseline && i ? 'mt-3 border-t border-rule pt-3' : ''}`}>
                    <span className={r.baseline ? 'font-[720] text-ink' : 'text-ink-2'}>{r.name}</span>
                    <span className="relative h-3 rounded-full bg-paper-2">
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
                <p className="pt-2 text-[12.5px] leading-[1.5] text-ink-2">
                  A relevant module lifts the Base score by <span className="font-[760] text-good">19.39</span> points, an irrelevant one by 1.02. Removing one relevant module from H⁽⁴⁾ costs <span className="font-[760] text-bad">2.74</span> points and raises tokens from 496.70M to 517.26M.
                </p>
              </div>
            </Card>
            <Finding n={f4.n} title={f4.title}>
              {f4.text}
            </Finding>
          </div>
        </div>
      </Container>
    </Section>
  );
}
