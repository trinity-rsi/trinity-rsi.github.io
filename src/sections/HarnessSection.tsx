import StrokeText from '@/components/reactbits/StrokeText/StrokeText';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import { Container, Section } from '@/components/ui/Section';
import Tex from '@/components/ui/Tex';
import Reveal from '@/components/ui/Reveal';
import PaperFigure from '@/components/ui/PaperFigure';
import HarnessBricks from '@/components/viz/HarnessBricks';
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
    <Section id="stage-3" className="pt-32">
      <Container wide>
        <div className="flex items-start gap-5 sm:gap-7">
          <div className="-mt-3 shrink-0 select-none leading-none" aria-hidden>
            <StrokeText text="3" trigger="scroll" fontSize={150} fontWeight={850} fontFamily="'Hubot Sans Variable', sans-serif" strokeColor={t.accent} fillColor={t.accentWash} strokeWidth={1.6} drawDuration={1.5} fillDelay={0.1} letterSpacing={-6} className="block w-[72px] sm:w-[108px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-[700] text-accent">Stage 3 · Harness tree construction</p>
            <h2 className="display-lg mt-2 text-[clamp(2.3rem,5vw,4.4rem)] text-ink">
              <SplitText text="Harnesses evolve along the capability tree" tag="span" splitType="words, chars" effect="rise" delay={18} duration={0.7} textAlign="left" mask className="!block" />
            </h2>
            <p className="prose-serif mt-5">
              Every node of the capability tree owns a Harness. Explorer plays the node’s worlds with inherited and local modules, Evolver compares successful and failed runs and turns them into reusable modules, and validated updates accumulate across iterations within the fixed tree. Creator follows at the same nodes.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <SubHead k="a" title="What evolves: the Harness">
            A Harness configuration coordinates a frozen model through six control-flow protocols. They are independent of task categories and tree nodes, so every evolved module has a clear place to go.
          </SubHead>
          <HarnessBricks />
        </div>

        <div className="mt-24">
          <SubHead k="b" title="The Harness tree, iteration by iteration" aside={<PaperFigure fig={PAPER_FIGS.harnessTree} />}>
            Each iteration is one top-down pass. At every node Explorer plays the level Creator built, a failing run becomes a new module or a revision, and the next run solves the level. The modules M01–M29 are the paper’s own: 28 are recorded per node and iteration, and M29 sits at node d in the iteration-4 tree.
          </SubHead>
          <HarnessTreeViz />
        </div>

        <div className="mt-24 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <Reveal>
            <h3 className="display-md text-[clamp(1.5rem,2.6vw,2.15rem)] text-ink">
              <span className="mr-3 text-accent">c</span>Selective inheritance
            </h3>
            <p className="mt-4 max-w-[52ch] font-serif text-[1.06rem] leading-[1.6] text-ink-2">
              A child compares its previous inherited registry with the parent’s update, holding its own modules fixed, and keeps the update only if it verifies strictly better on identical validation tasks, trials and budget. Completed nodes export their retained state to children; sibling branches evolve independently.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-[22px] border border-rule bg-surface p-6">
            <div className="space-y-4 text-[15px] text-ink">
              <div>
                <p className="mb-1 text-[12px] font-[700] uppercase tracking-[0.1em] text-ink-3">A node’s Harness: inherited registry ⊕ local modules</p>
                <Tex block>{String.raw`\mathcal{H}^{(i)}_{E,v} = P^{(i)}_v \oplus L^{(i)}_v,\qquad (P \oplus L)[m] = \begin{cases} L[m], & m \in \mathrm{dom}(L) \\ P[m], & m \in \mathrm{dom}(P) \setminus \mathrm{dom}(L) \end{cases}`}</Tex>
              </div>
              <div>
                <p className="mb-1 text-[12px] font-[700] uppercase tracking-[0.1em] text-ink-3">Continual refinement</p>
                <Tex block>{String.raw`Z^{(i+1)}_v = \mathrm{Rollout}\big(P^{(i+1)}_v \oplus L^{(i)}_v,\ \mathcal{D}^{(i+1)}_v\big),\quad \tilde L^{(i+1)}_v = \mathrm{Evolve}\big(L^{(i)}_v,\ Z^{(i+1)}_v,\ \mathcal{F}^{(i)}_v\big)`}</Tex>
              </div>
              <p className="text-[13px] leading-[1.55] text-ink-2">
                Host checks validate evidence, ownership, interfaces, lineage and typed input–output assertions before a local version advances; ancestor-owned modules are preserved.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-24">
          <SubHead k="d" title="Creator consolidates a new Base Harness" aside={<PaperFigure fig={PAPER_FIGS.creatorLib} />}>
            Creator evolves along the same tree, top-down within each iteration: the root’s children start from its Base Harness, every other node inherits its parent’s updated modules, and a node evolves only when a verifier detects a failure. At the end of the iteration the validated proposals are consolidated with the Base Harness modules into the next Base Harness: revisions replace their predecessors, partial overlaps merge, near-duplicates keep the earlier-learned module.
          </SubHead>
          <CreatorLibrary />
        </div>
      </Container>
    </Section>
  );
}
