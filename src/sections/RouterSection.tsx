import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import Finding from '@/components/ui/Finding';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icon';
import { PlaceholderNote } from '@/components/ui/Ph';
import RouterFlow from '@/components/viz/RouterFlow';
import MetricBars from '@/components/viz/MetricBars';
import { FINDINGS, TABLE4 } from '@/data/results';
import { useTokens } from '@/theme/tokens';
import { Database02Icon, FileSearchIcon, ShieldCheck } from '@hugeicons/core-free-icons';

const FACTS = [
  { icon: FileSearchIcon, title: 'Context', text: 'The public goal, initial observation, metadata and images of the task. Unseen task–capability assignments stay out of the routing context.' },
  { icon: Database02Icon, title: 'Memory', text: 'Seeded once with verified training-side H₀ trajectories; retrieval takes at most ten records with cosine similarity ≥ 0.5 from a 20,000-record FIFO memory.' },
  { icon: ShieldCheck, title: 'Commitment', text: 'One Harness is committed with an evidence-based rationale before execution. Technical failures score zero; invalid selections receive no fallback.' },
];

export default function RouterSection() {
  const { t } = useTokens();
  const f3 = FINDINGS[2];
  return (
    <Section id="router" className="pt-32">
      <Container wide>
        <SectionHeader kicker="Capability-aware Harness routing" title="Routing a new task to the right Harness" aside={<PlaceholderNote>Walk-through: the committed branch is the one Figure 10 assigns; scores are Table 8</PlaceholderNote>}>
          The evolved Harnesses specialize in different capabilities, so deployment needs a task-dependent choice. The Router follows a context–action–feedback loop: public task information, retrieved verified experience and observed performance–cost summaries guide the choice of one Harness from the tree.
        </SectionHeader>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FACTS.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className="rounded-[20px] border border-rule bg-surface p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-paper-2 text-accent">
                <Icon icon={f.icon} size={18} />
              </span>
              <p className="mt-3 text-[16px] font-[720] text-ink">{f.title}</p>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-ink-2">{f.text}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-14">
          <h3 className="display-md mb-6 text-[clamp(1.5rem,2.6vw,2.1rem)] text-ink">Try it: route an unseen task</h3>
          <RouterFlow />
        </div>

        <div className="mt-20 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
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
