import { motion } from 'motion/react';
import ScrollFloat from '@/components/reactbits/ScrollFloat/ScrollFloat';
import { Container, Section } from '@/components/ui/Section';
import Fold from '@/components/ui/Fold';
import Reveal from '@/components/ui/Reveal';
import PaperFigure from '@/components/ui/PaperFigure';
import PBars from '@/phone/ui/PBars';
import IterScrub from '@/components/viz/IterScrub';
import RadialBench from '@/components/viz/RadialBench';
import GainList from '@/components/viz/GainList';
import CorrHeatmap from '@/components/viz/CorrHeatmap';
import { FINDINGS, TABLE2, TABLE3, TABLE5 } from '@/data/results';
import { TRAIN_SETTINGS, UNSEEN_SETTINGS } from '@/data/tree';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery } from '@/lib/hooks';

function Card({ tag, title, sub, note, children, className = '' }: { tag: string; title: string; sub?: string; note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Reveal className={`figure-frame p-5 sm:p-6 ${className}`}>
      <p className="text-[12.5px] font-[700] text-accent">{tag}</p>
      <p className="mt-1 text-[19px] font-[760] leading-snug tracking-[-0.01em] text-ink">{title}</p>
      {sub && <p className="mt-1 text-[13px] leading-snug text-ink-3">{sub}</p>}
      <div className="mt-5">{children}</div>
      {note && <Fold className="mt-4">{note}</Fold>}
    </Reveal>
  );
}

export default function ResultsSection() {
  const { t } = useTokens();
  const phone = !useMediaQuery('(min-width: 640px)');
  const [f1, f2, , f4] = FINDINGS;
  const order = (xs: typeof TRAIN_SETTINGS) => [...xs].sort((a, b) => a.scores.it[4] - a.scores.it[0] - (b.scores.it[4] - b.scores.it[0])).reverse();

  return (
    <Section id="results" tone="alt" className="py-20 sm:py-28">
      <Container wide>
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
          <ScrollFloat containerClassName="!my-0" textClassName="!text-[clamp(2.6rem,6.4vw,5.6rem)] !leading-[0.95] !font-[800] tracking-[-0.04em] text-ink [font-stretch:120%]" animationDuration={1} stagger={0.025} mode="enter">
            Results
          </ScrollFloat>
          <div className="space-y-3">
            <p className="font-serif text-[1.08rem] leading-[1.6] text-ink-2">Same Base Harness H₀, a frozen Claude Opus 5 backbone; 28 training and 18 unseen benchmarks, two real robots among the unseen.</p>
            <PaperFigure fig={PAPER_FIGS.summary} label="Figure 1: the paper’s summary" />
          </div>
        </div>

        {/* recursive self-improvement */}
        <Card className="mt-16" tag={`Figure 5 · Finding ${f2.n}`} title={f2.title} sub="The first iteration brings the largest gain; iterations 2–4 add another 9.4 Train and 6.4 Unseen points." note={f2.text}>
          <IterScrub />
        </Card>

        <Card className="mt-6" tag="Figure 4" title="Every benchmark, from H₀ to iteration 4" sub="One wedge per benchmark, sorted by gain; hover a wedge for its values.">
          {phone ? (
            <GainList train={TRAIN_SETTINGS} unseen={UNSEEN_SETTINGS} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <RadialBench items={order(TRAIN_SETTINGS)} title="Train" />
              <RadialBench items={order(UNSEEN_SETTINGS)} title="Unseen" />
            </div>
          )}
          <div className={`mt-2 flex-wrap items-center justify-center gap-4 text-[12px] text-ink-2 ${phone ? 'hidden' : 'flex'}`}>
            {['Base', 'Iter. 1', 'Iter. 2', 'Iter. 3', 'Iter. 4'].map((l, k) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: t.iters[k] }} />
                {l}
              </span>
            ))}
          </div>
        </Card>

        {/* organisation */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
          <Card tag={`Table 3 · Finding ${f1.n}`} title={f1.title} sub="After one iteration, module-only, no skills; switch to tokens for inference cost." note={f1.text}>
            <PBars
              id="d-table3"
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
          </Card>
          <Card tag="Table 2" title="Modules and skills work best together" sub="At iteration 1: evolved modules, prepared skills, or both.">
              <PBars id="d-table2" range={[30, 70]} rows={TABLE2.map((r) => ({ key: r.name, name: r.name, score: { train: r.train, unseen: r.unseen }, ours: r.ours, muted: r.base }))} />
            </Card>
        </div>

        {/* capability–module relationships */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
          <Card tag={`Figure 6 · Finding ${f4.n}`} title={f4.title} sub="Capability–protocol correlations of the 29 modules; strongest: HCI–Inference 0.744, GVT–Loop 0.444, VEA–Perception 0.347." note={f4.text}>
            <CorrHeatmap />
          </Card>
          <Card tag="Table 5" title="Module interventions" sub="Train (10 %), skills prepared; Δ against each bold baseline.">
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
                  A relevant module adds <span className="font-[760] text-good">19.39</span> points, an irrelevant one 1.02; removing one costs <span className="font-[760] text-bad">2.74</span>.
                </p>
              </div>
            </Card>
        </div>
      </Container>
    </Section>
  );
}
