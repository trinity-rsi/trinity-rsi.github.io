import ScrollVelocity from '@/components/reactbits/ScrollVelocity/ScrollVelocity';
import { DOMAINS } from '@/data/tree';
import { useTokens } from '@/theme/tokens';

/** Divider between the overview and the four key ideas: the five task domains, moving with scroll velocity. */
export default function DomainMarquee() {
  const { t } = useTokens();
  const row = (
    <span className="inline-flex items-center">
      {DOMAINS.map((d) => (
        <span key={d.id} className="inline-flex items-center">
          <span className="mx-[0.45em] inline-block h-[0.32em] w-[0.32em] rounded-full align-middle" style={{ background: d.color }} />
          {d.name}
        </span>
      ))}
    </span>
  );
  return (
    <div className="relative overflow-hidden border-y border-rule bg-paper py-6" aria-hidden>
      <ScrollVelocity
        texts={[row, <span key="b">Rule discovery from feedback, search under constraints, perception and control, other agents, thousands of steps</span>]}
        velocity={42}
        numCopies={4}
        fadeEdges
        skewWithVelocity={4}
        outlineAlternate
        gap={36}
        fontSize="clamp(1.6rem, 3.4vw, 3rem)"
        fontWeight={780}
        color={t.ink}
        parallaxClassName="py-1"
        scrollerClassName="[font-stretch:112%] tracking-[-0.02em]"
      />
    </div>
  );
}
