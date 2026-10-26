import type { ReactNode } from 'react';
import { Container, Section } from '@/components/ui/Section';
import Fold from '@/components/ui/Fold';
import Reveal from '@/components/ui/Reveal';
import PaperFigure from '@/components/ui/PaperFigure';
import CountUp from '@/components/reactbits/CountUp/CountUp';
import PBars from '@/phone/ui/PBars';
import IterScrub from '@/components/viz/IterScrub';
import RadialBench from '@/components/viz/RadialBench';
import GainList from '@/components/viz/GainList';
import CorrHeatmap from '@/components/viz/CorrHeatmap';
import { Interventions, ModulesAndSkills } from '@/components/viz/ResultBits';
import { FINDINGS, HEADLINE, TABLE3 } from '@/data/results';
import { TRAIN_SETTINGS, UNSEEN_SETTINGS } from '@/data/tree';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery } from '@/lib/hooks';

/**
 * Results, told finding by finding. Each finding of the paper is a row: its claim, the one or two
 * numbers that carry it and a folded explanation on one side, the figure or table on the other,
 * sides alternating down the page. Figure 4 (every benchmark) runs the full width between them.
 */

/** the words of one finding: tag, claim, a sentence, its numbers, the paper's explanation folded */
function Claim({ tag, title, children, figures, note }: { tag: string; title: string; children?: ReactNode; figures?: ReactNode; note?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-[700] text-accent">{tag}</p>
      <h3 className="display-md mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] text-ink">{title}</h3>
      {children && <p className="mt-3 max-w-[46ch] font-serif text-[1.06rem] leading-[1.6] text-ink-2">{children}</p>}
      {figures && <div className="mt-6 max-w-[560px]">{figures}</div>}
      {note && <Fold className="mt-5">{note}</Fold>}
    </div>
  );
}

/** big numbers with what they are */
function Nums({ items }: { items: { v: string; l: string; sub?: string; c: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-9 gap-y-4">
      {items.map((x) => (
        <div key={x.l}>
          <p className="tabular text-[clamp(2rem,3vw,2.6rem)] font-[820] leading-none tracking-[-0.03em]" style={{ color: x.c, fontStretch: '112%' }}>
            {x.v}
          </p>
          <p className="mt-1.5 text-[13px] font-[620] text-ink-2">{x.l}</p>
          {x.sub && <p className="tabular text-[12.5px] text-ink-3">{x.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export default function ResultsSection() {
  const { t } = useTokens();
  const phone = !useMediaQuery('(min-width: 640px)');
  const [f1, f2, , f4] = FINDINGS;
  const order = (xs: typeof TRAIN_SETTINGS) => [...xs].sort((a, b) => a.scores.it[4] - a.scores.it[0] - (b.scores.it[4] - b.scores.it[0])).reverse();
  const tree = TABLE3.find((r) => r.ours)!;
  const global = TABLE3.find((r) => r.name === 'Global')!;

  return (
    <Section id="results" tone="alt" className="py-20 sm:py-28">
      <Container wide>
        {/* the headline */}
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div>
            <p className="text-[14px] font-[700] text-accent">Results</p>
            <h2 className="display-lg mt-2 text-[clamp(2.3rem,4.6vw,4.2rem)] text-ink [text-wrap:balance]">
              <span className="text-accent">+</span>
              <CountUp to={HEADLINE.trainGain} decimals={1} duration={1.8} /> on training, <span className="text-explorer">+</span>
              <CountUp to={HEADLINE.unseenGain} decimals={1} duration={1.8} delay={0.15} /> on unseen benchmarks
            </h2>
          </div>
          <div className="lg:pb-2">
            <p className="font-serif text-[1.06rem] leading-[1.6] text-ink-2">
              {HEADLINE.trainCount} training and {HEADLINE.unseenCount} unseen benchmarks, two real robots among the unseen; the same Base Harness H₀ and a frozen Claude Opus 5 throughout.
            </p>
            <PaperFigure fig={PAPER_FIGS.summary} label="Figure 1: the paper’s summary" className="mt-4" />
          </div>
        </div>

        {/* Finding 2: RSI keeps improving */}
        <div className="mt-16 grid items-center gap-x-14 gap-y-8 sm:mt-20 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <Claim tag={`Figure 5 · Finding ${f2.n}`} title={f2.title} note={f2.text}>
            The first iteration brings the largest gain; iterations 2–4 add another 9.4 Train and 6.4 Unseen points. Move across the charts to read each iteration.
          </Claim>
          <Reveal>
            <IterScrub />
          </Reveal>
        </div>

        {/* Figure 4: every benchmark */}
        <Reveal className="figure-frame mt-16 p-5 sm:mt-20 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <div>
              <p className="text-[13px] font-[700] text-accent">Figure 4</p>
              <h3 className="display-md mt-2 text-[clamp(1.5rem,2.2vw,2rem)] text-ink">Every benchmark, from H₀ to iteration 4</h3>
            </div>
            <div className={`flex-wrap items-center gap-4 text-[12px] text-ink-2 ${phone ? 'hidden' : 'flex'}`}>
              {['Base', 'Iter. 1', 'Iter. 2', 'Iter. 3', 'Iter. 4'].map((l, k) => (
                <span key={l} className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm" style={{ background: t.iters[k] }} />
                  {l}
                </span>
              ))}
              <span className="text-ink-3">One wedge per benchmark, sorted by gain; hover for values.</span>
            </div>
          </div>
          <div className="mt-4">
            {phone ? (
              <GainList train={TRAIN_SETTINGS} unseen={UNSEEN_SETTINGS} />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <RadialBench items={order(TRAIN_SETTINGS)} title="Train" />
                <RadialBench items={order(UNSEEN_SETTINGS)} title="Unseen" />
              </div>
            )}
          </div>
        </Reveal>

        {/* Finding 1: organize by capability */}
        <div className="mt-16 grid items-center gap-x-12 gap-y-8 sm:mt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:gap-x-14">
          <Reveal className="figure-frame p-5 sm:p-6 lg:order-1">
            <p className="mb-3 text-[13px] text-ink-3">Table 3: after one iteration, module-only, no skills</p>
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
          </Reveal>
          <div className="lg:order-2">
            <Claim
              tag={`Table 3 · Finding ${f1.n}`}
              title={f1.title}
              note={f1.text}
              figures={
                <Nums
                  items={[
                    { v: tree.train.toFixed(2), l: 'Capability tree, simulated worlds', sub: `with ${tree.nEnv} environments; Global: ${global.train.toFixed(2)} with ${global.nEnv}`, c: t.accent },
                    { v: tree.unseen.toFixed(2), l: 'Unseen', sub: `Global: ${global.unseen.toFixed(2)}`, c: t.explorer },
                  ]}
                />
              }
            >
              Trained in simulated worlds along the capability tree, the Harnesses beat one global Harness trained on all {global.nEnv} real environments, with fewer inference tokens.
            </Claim>
          </div>
        </div>

        {/* Table 2: modules and skills */}
        <Reveal className="figure-frame mt-16 grid items-center gap-x-12 gap-y-6 p-5 sm:mt-20 sm:p-7 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div>
            <p className="text-[13px] font-[700] text-accent">Table 2</p>
            <h3 className="display-md mt-2 text-[clamp(1.4rem,2vw,1.8rem)] text-ink">Modules and skills work best together</h3>
            <p className="mt-3 text-[14px] leading-[1.55] text-ink-2">At iteration 1: evolved modules alone, prepared skills alone, or both.</p>
            <p className="mt-4 flex items-center gap-4 text-[12px] font-[650] text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.accent }} /> Train
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.explorer }} /> Unseen
              </span>
            </p>
          </div>
          <ModulesAndSkills />
        </Reveal>

        {/* Finding 4: which modules matter */}
        <div className="mt-16 grid items-center gap-x-12 gap-y-8 sm:mt-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-x-14">
          <Claim tag={`Figure 6 · Table 5 · Finding ${f4.n}`} title={f4.title} note={f4.text} figures={<Interventions />}>
            Adding one relevant module lifts the Base Harness by 19.39 points, an irrelevant one by 1.02; removing one relevant module from H(4) costs 2.74.
          </Claim>
          <Reveal className="figure-frame p-5 sm:p-6">
            <p className="mb-4 text-[13px] text-ink-3">Figure 6: capability–protocol correlations of the 29 modules at iteration 4; strongest, HCI–Inference 0.744</p>
            <CorrHeatmap />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
