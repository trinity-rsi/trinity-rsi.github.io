import { useMemo } from 'react';
import GridMotion from '@/components/reactbits/GridMotion/GridMotion';
import ScrollReveal from '@/components/reactbits/ScrollReveal/ScrollReveal';
import RotatingText from '@/components/reactbits/RotatingText/RotatingText';
import LazyMount from '@/components/ui/LazyMount';
import Icon from '@/components/ui/Icon';
import { Container, Section } from '@/components/ui/Section';
import PairBoard from '@/components/viz/PairBoard';
import { BENCHES, domainById } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery } from '@/lib/hooks';

function BenchTile({ id }: { id: string }) {
  const b = BENCHES.find((x) => x.id === id)!;
  const d = domainById[b.domain];
  return (
    <div className="flex h-full w-full flex-col items-start justify-between p-[0.9em] text-left">
      <span className="flex items-center gap-1.5 text-[0.62em] font-[620] opacity-70">
        <span className="h-[0.6em] w-[0.6em] rounded-full" style={{ background: d.color }} />
        {d.short}
      </span>
      <span className="flex w-full items-end justify-between gap-2">
        <span className="text-[0.95em] font-[720] leading-[1.05] tracking-[-0.01em]" style={{ fontStretch: '108%' }}>
          {b.short ?? b.name}
        </span>
        <Icon icon={b.icon} size={18} className="shrink-0 opacity-60" />
      </span>
    </div>
  );
}

/** Various tasks → shared capabilities: the task space, then pairs that meet on one capability node. */
export default function ExamplesSection() {
  const { t, theme } = useTokens();
  const wide = useMediaQuery('(min-width: 768px)');

  // the 44 benchmarks, every other tile one of their real frames (Appendix E.1)
  const items = useMemo(() => {
    const out: (React.ReactNode | { src: string; alt: string })[] = [];
    BENCHES.forEach((b, i) => {
      out.push(<BenchTile key={b.id} id={b.id} />);
      const other = BENCHES[(i * 7 + 3) % BENCHES.length];
      out.push({ src: e1Frame(other.id, i % 3 === 0 ? 'h4' : 'start'), alt: '' });
    });
    return out;
  }, []);

  return (
    <Section id="examples" className="pt-20">
      <div className="relative h-[86vh] min-h-[560px] overflow-hidden">
        <LazyMount className="absolute inset-0" margin="200px">
          <GridMotion
            items={items}
            rows={wide ? 5 : 4}
            aspectRatio={1.45}
            gap={14}
            radius={14}
            angle={-10}
            speed={18}
            spotlight={0.7}
            dim={theme === 'dark' ? 0.55 : 0.4}
            fade={0.55}
            theme={theme}
            tileColor={t.surface}
            textColor={t.ink}
          />
        </LazyMount>
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(56% 52% at 50% 50%, ${t.paper}f2 30%, ${t.paper}b0 62%, transparent 100%)` }} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-[900px] text-center">
            <p className="kicker pointer-events-auto flex flex-wrap items-center justify-center gap-x-1.5">
              44 benchmarks:
              <RotatingText
                texts={['games and puzzles', 'video and physics', 'multi-agent play', 'embodied control', 'text worlds']}
                mainClassName="inline-flex overflow-hidden rounded-md bg-accent-wash px-1.5 font-[680] text-accent-ink"
                staggerFrom="last"
                staggerDuration={0.022}
                rotationInterval={2400}
                splitLevelClassName="overflow-hidden pb-0.5"
              />
              · images, video, grids and text
            </p>
            <ScrollReveal
              baseOpacity={0.12}
              enableBlur
              baseRotation={2}
              blurStrength={6}
              containerClassName="!my-3"
              textClassName="!text-[clamp(2rem,4.6vw,3.9rem)] !leading-[1.06] !font-[760] tracking-[-0.03em] text-ink [font-stretch:112%]"
              mode="enter"
              duration={1.1}
              stagger={0.07}
            >
              Tasks that look different often need the same capabilities.
            </ScrollReveal>
            <p className="mx-auto max-w-[58ch] font-serif text-[1.15rem] leading-[1.6] text-ink-2">
              Grouping tasks by these shared requirements makes the underlying mechanisms a common learning objective, enabling generalization across tasks.
            </p>
          </div>
        </div>
      </div>

      <Container wide className="relative py-16 sm:py-20">
        <PairBoard />
      </Container>
    </Section>
  );
}
