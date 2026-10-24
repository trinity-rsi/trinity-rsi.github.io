import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';
import ElectricBorder from '@/components/reactbits/ElectricBorder/ElectricBorder';
import ScrollFloat from '@/components/reactbits/ScrollFloat/ScrollFloat';
import Icon from '@/components/ui/Icon';
import Reveal from '@/components/ui/Reveal';
import { Container, Section } from '@/components/ui/Section';
import { CapabilityTree, GlobalHarness, PerTaskHarness } from '@/components/viz/Strategies';
import { useTokens } from '@/theme/tokens';
import { CodeIcon, Globe02Icon, Wrench01Icon } from '@hugeicons/core-free-icons';

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

const BOTTLENECKS = [
  { icon: Globe02Icon, title: 'Verifiable worlds are costly', text: 'Constructing large-scale, heterogeneous and verifiable environments by hand does not scale.' },
  { icon: Wrench01Icon, title: 'Manual Harness iteration lags', text: 'Agent capability is increasingly constrained by the Harness, and hand-tuning cannot keep pace with task diversity.' },
  { icon: CodeIcon, title: 'Harness RSI stays task-driven', text: 'Current Harness RSI focuses on text-modality tasks such as coding and math, and evolves task by task.' },
];

export default function ProblemSection() {
  const { t, theme } = useTokens();
  return (
    <Section id="problem" className="pt-24 sm:pt-28">
      <Container wide>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-end">
          <div>
            <p className="kicker">The problem</p>
            <ScrollFloat
              containerClassName="!my-2"
              textClassName="!text-[clamp(2.2rem,4.6vw,4rem)] !leading-[1.02] !font-[780] tracking-[-0.03em] text-ink [font-stretch:114%]"
              animationDuration={1}
              ease="back.inOut(2)"
              mode="enter"
              stagger={0.02}
            >
              Self-improvement is still trained task by task
            </ScrollFloat>
          </div>
          <p className="font-serif text-[1.1rem] leading-[1.62] text-ink-2">
            We view multimodal intelligence as an evolving loop: worlds provide tasks, humans guide learning, and agents interact with the world to produce verifiable outcomes. As tasks grow more complex and diverse, the loop hits three walls.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {BOTTLENECKS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08} className="group relative overflow-hidden rounded-[20px] border border-rule bg-surface p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper-2 text-ink-2 transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                <Icon icon={b.icon} size={19} />
              </span>
              <p className="mt-4 text-[17px] font-[720] leading-tight text-ink">{b.title}</p>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-ink-2">{b.text}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-24">
          <div className="grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-end">
            <h3 className="display-md max-w-[20ch] text-[clamp(1.8rem,3.4vw,2.8rem)] text-ink">What should a Harness be evolved around?</h3>
            <p className="font-serif text-[1.06rem] leading-[1.6] text-ink-2">
              Task-specific evolution overfits; a global Harness is pulled between conflicting demands. The key insight: tasks with different modalities and surface forms can share the same underlying capability requirements.
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
