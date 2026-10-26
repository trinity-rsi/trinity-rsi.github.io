import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import Finding from '@/components/ui/Finding';
import Reveal from '@/components/ui/Reveal';
import { PlaceholderNote } from '@/components/ui/Ph';
import RouterFlow from '@/components/viz/RouterFlow';
import MetricBars from '@/components/viz/MetricBars';
import { FINDINGS, TABLE4 } from '@/data/results';
import { useTokens } from '@/theme/tokens';


export default function RouterSection() {
  const { t } = useTokens();
  const f3 = FINDINGS[2];
  return (
    <Section id="router" className="pt-24 sm:pt-32">
      <Container wide>
        <SectionHeader kicker="Capability-aware Harness routing" title="Routing a new task to the right Harness" aside={<PlaceholderNote>Walk-through: the committed branch is the one Figure 10 assigns; scores are Table 8</PlaceholderNote>}>
          The evolved Harnesses specialize in different capabilities, so deployment needs a task-dependent choice. The Router follows a context–action–feedback loop: public task information, retrieved verified experience and observed performance–cost summaries guide the choice of one Harness from the tree.
        </SectionHeader>

        <div className="mt-12">
          <h3 className="display-md mb-6 text-[clamp(1.5rem,2.6vw,2.1rem)] text-ink">Try it: route an unseen task</h3>
          <RouterFlow />
        </div>

        <div className="mt-14 grid gap-8 sm:mt-20 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal className="figure-frame p-5 sm:p-6">
            <p className="text-[12.5px] font-[700] text-accent">Table 4</p>
            <p className="mt-1 text-[17px] font-[740] text-ink">Capability-aware Harness routing on the iteration-4 tree H⁽⁴⁾</p>
            <p className="mb-4 mt-1 text-[13px] text-ink-3">Benchmark-equal performance and estimated total inference tokens (M), covering skill preparation, routing and formal inference.</p>
            <MetricBars
              min={30}
              max={80}
              metrics={[
                { key: 'train', label: 'Train', color: t.accent },
                { key: 'unseen', label: 'Unseen', color: t.explorer },
              ]}
              extraCols={['Train tok.', 'Unseen tok.']}
              rows={TABLE4.map((r, i) => ({
                key: `${r.name}-${i}`,
                name: r.name,
                sub: r.cap === null ? (r.oracle ? 'best compatible Harness, chosen retrospectively' : 'one candidate per task at random') : `${r.cap ? '+ capability definitions' : 'task information and interfaces only'}${r.mem ? ' + retrieved experience' : ''}`,
                values: { train: r.train, unseen: r.unseen },
                extra: [r.trainTok.toFixed(2), r.unseenTok.toFixed(2)],
                ours: r.ours,
                muted: r.random,
              }))}
            />
          </Reveal>
          <div className="flex flex-col gap-4">
            <Finding n={f3.n} title={f3.title}>
              {f3.text} Full self-routing scores 71.27 on Train and 60.96 on Unseen, against Oracle’s 73.16 and 63.61.
            </Finding>
          </div>
        </div>
      </Container>
    </Section>
  );
}
