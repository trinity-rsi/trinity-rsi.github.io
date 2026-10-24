import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import BrickMorph from '@/components/viz/BrickMorph';
import { Container, Section } from '@/components/ui/Section';
import PaperFigure from '@/components/ui/PaperFigure';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import ThoughtLine from '@/components/reactbits/ThoughtLine/ThoughtLine';
import LatticeLoader from '@/components/reactbits/LatticeLoader/LatticeLoader';
import StrokeText from '@/components/reactbits/StrokeText/StrokeText';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import { BENCHES, CAPS, DOMAINS, benchesNeeding } from '@/data/tree';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery, useStickyProgress } from '@/lib/hooks';
import evolverCollect from '@/assets/cats/evolver-collect.webp';
import explorerCat from '@/assets/cats/explorer-explore.webp';
import evolverDiagnose from '@/assets/cats/evolver-diagnose.webp';
import evolverCat from '@/assets/cats/evolver.webp';

const STEPS = [
  {
    key: 'task',
    stage: 'Stage 1',
    label: 'Task tree',
    title: 'Benchmark organization',
    who: 'Evolver',
    cat: evolverCollect,
    text: 'Web search across research benchmarks, AI competitions, human contests, game communities and professional practice yields 44 benchmarks. Each is normalized into a specification of goals, observations, actions, feedback, completion criteria and budgets: five domains, fifteen task families, a training / unseen split fixed in advance.',
  },
  {
    key: 'explore',
    stage: 'Stage 1',
    label: 'Explore',
    title: 'World exploration',
    who: 'Explorer',
    cat: explorerCat,
    text: 'Explorer runs the Base Harness H₀ on sampled instances of every task, training and unseen alike, under fixed settings. Completed runs are retained, and hash-chain checks verify observations, actions, responses, outcomes and image logs.',
  },
  {
    key: 'diagnose',
    stage: 'Stage 2',
    label: 'Requirements',
    title: 'Requirement organization',
    who: 'Evolver',
    cat: evolverDiagnose,
    text: 'Evolver links rules and trajectory steps to the requirements they satisfy or violate. Independent agents propose capability categories, a judge consolidates them, and reviewers check definitions, evidence and coverage: six capabilities and thirty defect types. Every task receives a fixed requirement set.',
  },
  {
    key: 'cap',
    stage: 'Stage 2',
    label: 'Capability tree',
    title: 'The capability tree',
    who: 'Evolver',
    cat: evolverCat,
    text: 'Sorted in a fixed order, each requirement set becomes a path, and a trie merges common prefixes across domains: eleven nodes below the root. A benchmark hangs below the node of its own combination, whatever its domain. An edge adds a capability; it does not say one depends on another.',
  },
];

function Extra({ i, stage }: { i: number; stage: number }) {
  const { t } = useTokens();
  if (i === 0)
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2">
        {DOMAINS.map((d) => (
          <span key={d.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            {d.name}
            <span className="tabular text-ink-3">{BENCHES.filter((b) => b.domain === d.id).length}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-ink-3">
          <span className="h-2.5 w-4 rounded-[3px]" style={{ background: t.ink2 }} /> train
          <span className="ml-1 h-2.5 w-4 rounded-[3px] border border-rule-2" style={{ background: t.surface2 }} /> unseen · * rebuilt
        </span>
      </div>
    );
  if (i === 1)
    return (
      <div className="flex flex-wrap items-center gap-4">
        <LatticeLoader label="Explorer runs H₀ on all 44 benchmarks" doneLabel="Trajectories recorded" status={stage >= 1.9 ? 'done' : 'working'} color={t.explorer} doneColor={t.good} fontSize={13} cellSize={5} showTimer />
        <span className="text-[12.5px] text-ink-3">bar inside each brick: H₀ score (Table 7)</span>
      </div>
    );
  if (i === 2)
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ThoughtLine
          key={stage >= 2 && stage < 3 ? 'live' : 'idle'}
          label="Evolver is organizing requirements"
          doneLabel="Requirement sets fixed"
          steps={[]}
          working={stage < 2.7}
          color={t.ink2}
          glyphColor={t.evolver}
          fontSize={13}
          collapseOnSettle
        />
        <span className="flex flex-wrap items-center gap-2">
          {CAPS.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-md border border-rule bg-surface px-1.5 py-0.5 text-[12px] font-[640] text-ink-2" title={c.name}>
              <span className="grid h-4 w-4 place-items-center rounded-[4px] text-[10px] font-[800] text-white" style={{ background: t.caps[c.id] }}>
                {c.id}
              </span>
              <span className="tabular">{benchesNeeding(c.id).length}</span>
            </span>
          ))}
          <span className="text-[12px] text-ink-3">benchmarks requiring each capability</span>
        </span>
      </div>
    );
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
      <span className="rounded-full bg-accent-wash px-2.5 py-1 font-[640] text-accent-ink">ARC-AGI-3 and Micromouse both sit at d → a</span>
      <span className="text-ink-3">Hover a node or a brick to trace its path.</span>
    </div>
  );
}

export default function TreeSection() {
  const { t } = useTokens();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [wrapRef, p] = useStickyProgress<HTMLDivElement>();
  const [mobileStage, setMobileStage] = useState(0);
  const mobileRef = useRef(0);

  const stage = desktop ? Math.max(0, Math.min(4, p * 4.6 - 0.25)) : mobileStage;
  const active = Math.min(3, Math.floor(stage));
  const s = STEPS[active];

  const jump = (i: number) => {
    if (desktop) {
      const el = wrapRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const target = (i + 0.6 + 0.25) / 4.6;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + total * target, behavior: 'smooth' });
    } else {
      animate(mobileRef.current, i + 0.75, {
        duration: 1.4,
        ease: [0.4, 0, 0.2, 1],
        onUpdate: (v) => {
          mobileRef.current = v;
          setMobileStage(v);
        },
      });
    }
  };
  useEffect(() => {
    if (!desktop) jump(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop]);

  const segment = (
    <RubberSegment
      items={STEPS.map((x) => ({ value: x.key, label: x.label }))}
      value={s.key}
      onChange={(_v, i) => jump(i)}
      size="sm"
      trackColor={t.paper2}
      thumbColor={t.surface}
      textColor={t.ink3}
      activeTextColor={t.ink}
      aria-label="Step"
    />
  );

  const caption = (
    <div className="grid items-center gap-x-6 gap-y-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
      <div className="flex min-w-0 items-start gap-3">
        <img src={s.cat} alt="" className="hidden h-12 w-12 shrink-0 object-contain sm:block" />
        <div className="min-w-0">
          <p className="text-[15px] font-[730] text-ink">
            <span className="mr-2 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-[760] uppercase tracking-[0.08em] text-paper">{s.stage}</span>
            {s.title}
            <span className="ml-2 text-[12.5px] font-[560] text-ink-3">{s.who}</span>
          </p>
          <p className="mt-1 text-[13px] leading-[1.5] text-ink-2 lg:line-clamp-3">{s.text}</p>
        </div>
      </div>
      <div className="min-w-0">
        <Extra i={active} stage={stage} />
      </div>
    </div>
  );

  return (
    <Section id="stage-1" className="pt-28">
      <Container wide>
        <div className="grid items-end gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="flex items-start gap-5 sm:gap-7">
            <div className="-mt-3 shrink-0 select-none leading-none" aria-hidden>
              <StrokeText text="1" trigger="scroll" fontSize={150} fontWeight={850} fontFamily="'Hubot Sans Variable', sans-serif" strokeColor={t.accent} fillColor={t.accentWash} strokeWidth={1.6} drawDuration={1.5} fillDelay={0.1} letterSpacing={-6} className="block w-[72px] sm:w-[108px]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-[700] text-accent">Stages 1 and 2</p>
              <h2 className="display-lg mt-2 text-[clamp(2.3rem,5vw,4.4rem)] text-ink">
                <SplitText text="From a task tree to a capability tree" tag="span" splitType="words, chars" effect="rise" delay={18} duration={0.7} textAlign="left" mask className="!block" />
              </h2>
              <p className="prose-serif mt-5">
                Evolver regroups the benchmarks by what they <em>require</em>, not by what they look like. Scroll to watch 44 bricks leave their five domains and settle on the eleven nodes of the capability tree.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end lg:pb-2">
            <PaperFigure fig={PAPER_FIGS.taskTree} />
            <PaperFigure fig={PAPER_FIGS.flatTree} />
            <PaperFigure fig={PAPER_FIGS.capTree} />
          </div>
        </div>
      </Container>

      {desktop ? (
        <div ref={wrapRef} className="relative mt-10" style={{ height: '460vh' }}>
          {/* where the scroll reaches Stage 2 (requirement organization) */}
          <span id="stage-2" className="absolute left-0" style={{ top: '48.5%' }} aria-hidden />
          <div className="sticky top-[60px] flex h-[calc(100vh-60px)] items-center">
            <Container wide className="flex h-full flex-col gap-2.5 pb-14 pt-2.5">
              <div className="rounded-2xl border border-rule bg-surface px-4 py-2.5">
                <div className="mb-2 flex items-center justify-between gap-4">
                  {segment}
                  <span className="text-[12.5px] text-ink-3">Hover a brick or a node</span>
                </div>
                {caption}
              </div>
              <figure className="figure-frame relative min-h-0 flex-1 overflow-hidden p-3">
                <div className="absolute inset-3">
                  <BrickMorph stage={stage} fit />
                </div>
              </figure>
            </Container>
          </div>
        </div>
      ) : (
        <Container className="mt-10 space-y-5 pb-10">
          <span id="stage-2" aria-hidden />
          <div className="overflow-x-auto">
            <div className="min-w-[470px]">{segment}</div>
          </div>
          <figure className="figure-frame overflow-x-auto p-3">
            <div className="min-w-[860px]">
              <BrickMorph stage={stage} />
            </div>
          </figure>
          {caption}
        </Container>
      )}
    </Section>
  );
}
