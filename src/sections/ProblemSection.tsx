import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';
import ElectricBorder from '@/components/reactbits/ElectricBorder/ElectricBorder';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import { Container, Section } from '@/components/ui/Section';
import { CapabilityTree, GlobalHarness, PerTaskHarness } from '@/components/viz/Strategies';
import ProblemWalls, { type Wall } from '@/components/viz/ProblemWalls';
import { useTokens } from '@/theme/tokens';

/** The problem (Introduction): why today's RSI is task-driven, and what to evolve around instead. */
const STRATEGIES = [
  {
    key: 'global',
    title: 'One global Harness',
    body: 'Struggles to accommodate conflicting task demands, such as the performance–efficiency trade-offs of embodied tasks.',
    Fig: GlobalHarness,
  },
  {
    key: 'task',
    title: 'One Harness per task',
    body: 'Suits tasks with similar requirements, but leads to Harness overfitting and poor generalization across heterogeneous tasks.',
    Fig: PerTaskHarness,
  },
  {
    key: 'cap',
    title: 'Evolve along shared capabilities',
    body: 'Group tasks by the capability requirements they share. Each requirement becomes a common learning objective, and specialized Harnesses grow from it.',
    Fig: CapabilityTree,
    ours: true,
  },
];

const WALLS: Wall[] = [
  {
    kind: 'Bottleneck',
    at: 'World',
    title: 'Verifiable worlds are costly',
    text: 'Building large, heterogeneous, verifiable environments by hand is costly; worlds must be generated automatically.',
  },
  {
    kind: 'Bottleneck',
    at: 'Human',
    title: 'Manual Harness iteration lags',
    text: 'The Harness increasingly limits agents, and hand-tuning it cannot keep pace with growing task diversity.',
  },
  {
    kind: 'Challenge',
    at: 'Agent',
    title: 'Harness RSI stays task-driven',
    text: 'Harness RSI evolves task by task on text tasks such as coding and math, overfitting and generalizing poorly.',
  },
];

export default function ProblemSection() {
  const { t, theme } = useTokens();
  return (
    <Section id="problem" className="pt-20 sm:pt-28">
      <Container wide>
        <ProblemWalls
          walls={WALLS}
          head={
            <>
              <p className="kicker">The problem</p>
              <h2 className="display-lg mt-2 text-[clamp(2.3rem,4.6vw,4rem)] leading-[1.02] text-ink">
                <SplitText text="RSI is still trained task by task" tag="span" splitType="words, chars" effect="rise" delay={16} duration={0.7} textAlign="left" mask className="!block" />
              </h2>
            </>
          }
          lead={
            <p className="max-w-[52ch] font-serif text-[1.1rem] leading-[1.62] text-ink-2">
              Worlds provide tasks, humans guide learning, agents produce verifiable outcomes. As tasks grow more complex, this loop meets two bottlenecks and a challenge.
            </p>
          }
        />

        <div className="mt-16 sm:mt-24">
          <div className="grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-end">
            <h3 className="display-md max-w-[20ch] text-[clamp(1.8rem,3.4vw,2.8rem)] text-ink">What should a Harness be evolved around?</h3>
            <p className="font-serif text-[1.06rem] leading-[1.6] text-ink-2">
              The key insight: tasks with different modalities and surface forms can share the same underlying capability requirements.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STRATEGIES.map(({ key, title, body, Fig, ours }) => {
              const card = (
                <SpotlightCard
                  key={key}
                  theme={theme}
                  spotlightColor={ours ? `${t.accent}55` : undefined}
                  className="h-full rounded-[20px] p-6"
                  style={{ '--spotlight-card-surface': t.surface } as React.CSSProperties}
                >
                  <Fig />
                  <p className="mt-5 flex flex-wrap items-center gap-2 text-[18px] font-[720] text-ink" style={{ fontStretch: '106%' }}>
                    {title}
                    {ours && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-[700] text-white">The Trinity</span>}
                  </p>
                  <p className="mt-2 text-[15px] leading-[1.55] text-ink-2">{body}</p>
                </SpotlightCard>
              );
              return ours ? (
                <ElectricBorder key={key} color={t.accent} theme={theme} borderRadius={20} thickness={1.4} chaos={0.35} speed={0.7} glow={theme === 'dark' ? 0.7 : 0.35} className="h-full">
                  {card}
                </ElectricBorder>
              ) : (
                card
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
