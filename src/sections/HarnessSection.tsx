import StrokeText from '@/components/reactbits/StrokeText/StrokeText';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import { Container, Section } from '@/components/ui/Section';
import PaperFigure from '@/components/ui/PaperFigure';
import HarnessTreeViz from '@/components/viz/HarnessTreeViz';
import CreatorLibrary from '@/components/viz/CreatorLibrary';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';

function SubHead({ k, title, children, aside }: { k: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-7 grid gap-3 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-end lg:gap-12">
      <h3 className="display-md text-[clamp(1.5rem,2.6vw,2.15rem)] text-ink">
        <span className="mr-3 text-accent">{k}</span>
        {title}
      </h3>
      <div>
        <p className="max-w-[66ch] font-serif text-[1.06rem] leading-[1.6] text-ink-2">{children}</p>
        {aside && <div className="mt-3">{aside}</div>}
      </div>
    </div>
  );
}

export default function HarnessSection() {
  const { t } = useTokens();
  return (
    <Section id="stage-3" className="pt-24 sm:pt-32">
      <Container wide>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-7">
          <div className="shrink-0 select-none leading-none sm:-mt-3" aria-hidden>
            <StrokeText text="3" trigger="scroll" fontSize={150} fontWeight={850} fontFamily="'Hubot Sans Variable', sans-serif" strokeColor={t.accent} fillColor={t.accentWash} strokeWidth={1.6} drawDuration={1.5} fillDelay={0.1} letterSpacing={-6} className="block w-[52px] sm:w-[108px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-[700] text-accent">Stage 3 · Harness tree construction</p>
            <h2 className="display-lg mt-2 text-[clamp(2.3rem,5vw,4.4rem)] text-ink">
              <SplitText text="Harnesses evolve along the capability tree" tag="span" splitType="words, chars" effect="rise" delay={18} duration={0.7} textAlign="left" mask className="!block" />
            </h2>
            <p className="prose-serif mt-5">
              Every node owns a Harness: one frozen model, six control-flow protocols, and evolved modules that plug in. Validated updates accumulate across iterations within the fixed tree.
            </p>
          </div>
        </div>

        <div className="mt-14 sm:mt-20">
          <SubHead k="a" title="The Harness tree, iteration by iteration" aside={<PaperFigure fig={PAPER_FIGS.harnessTree} />}>
            One top-down pass per iteration: at every node a failing run becomes a new module or a revision. Children inherit their parent’s modules (outlined).
          </SubHead>
          <HarnessTreeViz />
        </div>

        <div className="mt-16 sm:mt-24">
          <SubHead k="b" title="Creator consolidates a new Base Harness" aside={<PaperFigure fig={PAPER_FIGS.creatorLib} />}>
            Creator evolves along the same tree; at the end of each iteration its validated proposals merge into the next Base Harness.
          </SubHead>
          <CreatorLibrary />
        </div>
      </Container>
    </Section>
  );
}
