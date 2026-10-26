import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import BrickMorph, { VB_W, createStageSignal } from '@/components/viz/BrickMorph';
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
import { useMediaQuery } from '@/lib/hooks';
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
    text: 'Web search across research benchmarks, AI competitions, human contests, game communities and professional practice yields 44 benchmarks. Each is normalized into a specification of goals, observations, actions, feedback, completion criteria and budgets: five domains, fifteen task families, and a training / unseen split fixed before capability induction.',
  },
  {
    key: 'explore',
    stage: 'Stage 1',
    label: 'Explore',
    title: 'World exploration',
    who: 'Explorer',
    cat: explorerCat,
    text: 'Explorer collects trajectories from sampled training instances with the Base Harness H₀ under fixed settings. Only training records support capability-tree construction, world generation, module learning and Router training; completed runs are retained, and hash-chain checks verify the execution records.',
  },
  {
    key: 'diagnose',
    stage: 'Stage 2',
    label: 'Requirements',
    title: 'Requirement organization',
    who: 'Evolver',
    cat: evolverDiagnose,
    text: 'Using training-task specifications and trajectories, independent agents propose capability categories, a judge consolidates them, and reviewers check definitions, evidence, assignments and coverage: six capabilities and thirty defect types. Every training task receives a fixed requirement set.',
  },
  {
    key: 'cap',
    stage: 'Stage 2',
    label: 'Capability tree',
    title: 'The capability tree',
    who: 'Evolver',
    cat: evolverCat,
    text: 'Sorted in a fixed order, each training task’s requirement set becomes a path, and a trie merges common prefixes across domains: eleven nodes below the root. The unseen benchmarks are placed on the fixed tree afterwards, for evaluation only. An edge adds a capability; it does not say one depends on another.',
  },
];

/** what the figure shows, in steps the captions follow (only these re-render the section) */
type View = { active: number; explored: boolean; thinking: boolean; live: boolean };
const viewOf = (s: number): View => ({ active: Math.min(3, Math.floor(s)), explored: s >= 1.9, thinking: s < 2.7, live: s >= 2 && s < 3 });
const sameView = (a: View, b: View) => a.active === b.active && a.explored === b.explored && a.thinking === b.thinking && a.live === b.live;

/** where each step settles: after its animation, before the next one */
const REST = [0.5, 1.95, 2.62, 4];

function Extra({ i, view }: { i: number; view: View }) {
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
        <LatticeLoader label="Explorer runs H₀ on the training benchmarks" doneLabel="Training trajectories recorded" status={view.explored ? 'done' : 'working'} color={t.explorer} doneColor={t.good} fontSize={13} cellSize={5} showTimer />
        <span className="text-[12.5px] text-ink-3">bar inside a brick: its H₀ score (Table 8) · faded: unseen, held out</span>
      </div>
    );
  if (i === 2)
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ThoughtLine
          key={view.live ? 'live' : 'idle'}
          label="Evolver is organizing requirements"
          doneLabel="Requirement sets fixed"
          steps={[]}
          working={view.thinking}
          color={t.ink2}
          glyphColor={t.evolver}
          fontSize={13}
          collapseOnSettle
        />
        <span className="flex flex-wrap items-center gap-2">
          {CAPS.map((c) => {
            const all = benchesNeeding(c.id);
            const train = all.filter((b) => b.split !== 'unseen').length;
            return (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-md border border-rule bg-surface px-1.5 py-0.5 text-[12px] font-[640] text-ink-2" title={c.name}>
                <span className="grid h-4 w-4 place-items-center rounded-[4px] text-[10px] font-[800] text-white" style={{ background: t.caps[c.id] }}>
                  {c.id}
                </span>
                <span className="tabular">{train}</span>
                <span className="tabular text-ink-3">+{all.length - train}</span>
              </span>
            );
          })}
          <span className="text-[12px] text-ink-3">training (+ unseen) benchmarks requiring each capability</span>
        </span>
      </div>
    );
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
      <span className="rounded-full bg-accent-wash px-2.5 py-1 font-[640] text-accent-ink">ARC-AGI-3 and Micromouse both sit at d → a</span>
      <span className="text-ink-3">Training benchmarks build the tree; the unseen ones join it last. Hover a node or a brick to trace its path.</span>
    </div>
  );
}

export default function TreeSection() {
  const { t } = useTokens();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const wrapRef = useRef<HTMLDivElement>(null);
  const signal = useMemo(() => createStageSignal(0), []);
  const [view, setView] = useState<View>(() => viewOf(0));
  const viewRef = useRef(view);

  // the figure reports the stage it draws; the captions follow it
  // phones: the figure is wider than the screen, so a camera keeps the action in view
  // (left while the task tree stands, on the sweep while Explorer runs, then on d → a)
  const panRef = useRef<HTMLElement>(null);
  const touched = useRef(0);
  const follow = (s: number) => {
    const el = panRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 4 || performance.now() - touched.current < 3500) return;
    const k = (el.scrollWidth - 24) / VB_W; // px per drawing unit (the figure has 12 px of padding each side)
    const x = s < 1 ? 0 : s < 1.9 ? 20 + Math.min(1, (s - 1) / 0.85) * (VB_W - 40) : s < 2.9 ? VB_W / 2 : 795;
    const left = s < 1 ? 0 : x * k + 12 - el.clientWidth / 2;
    const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, left));
    el.scrollLeft += (target - el.scrollLeft) * (s > 1 && s < 1.9 ? 1 : 0.14);
  };
  const onStage = useCallback((s: number) => {
    follow(s);
    const v = viewOf(s);
    if (!sameView(v, viewRef.current)) {
      viewRef.current = v;
      setView(v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wide screens: the page's scroll sets the stage (the figure eases towards it)
  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      signal.set(Math.max(0, Math.min(4, p * 4.6 - 0.25)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [desktop, signal]);

  const jump = (i: number) => {
    if (desktop) {
      const el = wrapRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const target = (REST[i] + 0.25) / 4.6;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + total * target, behavior: 'smooth' });
    } else {
      // the figure glides to the step on its own spring
      signal.set(REST[i]);
    }
  };
  useEffect(() => {
    if (!desktop) signal.set(REST[0]);
  }, [desktop, signal]);

  const s = STEPS[view.active];

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

  // the caption keeps its height from step to step, so the figure below never resizes mid-scroll
  const caption = (
    <div className="grid items-center gap-x-6 gap-y-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
      <div className="relative min-w-0 lg:h-[86px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={s.key}
            className="flex min-w-0 items-start gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.16 } }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <img src={s.cat} alt="" className="hidden h-12 w-12 shrink-0 object-contain sm:block" />
            <div className="min-w-0">
              <p className="text-[15px] font-[730] text-ink">
                <span className="mr-2 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-[760] uppercase tracking-[0.08em] text-paper">{s.stage}</span>
                {s.title}
                <span className="ml-2 text-[12.5px] font-[560] text-ink-3">{s.who}</span>
              </p>
              <p className="mt-1 text-[13px] leading-[1.5] text-ink-2 lg:line-clamp-3">{s.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="relative min-w-0 lg:min-h-[52px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={view.active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.14 } }} transition={{ duration: 0.3 }}>
            <Extra i={view.active} view={view} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <Section id="stage-1" className="pt-20 sm:pt-28">
      <Container wide>
        <div className="grid items-end gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-7">
            <div className="shrink-0 select-none leading-none sm:-mt-3" aria-hidden>
              <StrokeText text="1" trigger="scroll" fontSize={150} fontWeight={850} fontFamily="'Hubot Sans Variable', sans-serif" strokeColor={t.accent} fillColor={t.accentWash} strokeWidth={1.6} drawDuration={1.5} fillDelay={0.1} letterSpacing={-6} className="block w-[52px] sm:w-[108px]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-[700] text-accent">Stages 1 and 2</p>
              <h2 className="display-lg mt-2 text-[clamp(2.3rem,5vw,4.4rem)] text-ink">
                <SplitText text="From a task tree to a capability tree" tag="span" splitType="words, chars" effect="rise" delay={18} duration={0.7} textAlign="left" mask className="!block" />
              </h2>
              <p className="prose-serif mt-5">
                Evolver regroups the benchmarks by what they <em>require</em>, not by what they look like. Scroll to watch the training benchmarks leave their five domains and build the eleven nodes of the capability tree; the unseen ones are placed on it afterwards.
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
                  <BrickMorph signal={signal} onStage={onStage} fit />
                </div>
              </figure>
            </Container>
          </div>
        </div>
      ) : (
        <Container className="mt-10 space-y-5 pb-10">
          <span id="stage-2" aria-hidden />
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="min-w-[470px]">{segment}</div>
          </div>
          {caption}
          <figure
            ref={panRef}
            className="figure-frame overflow-x-auto overscroll-x-contain p-3"
            onPointerDown={() => (touched.current = performance.now())}
            onTouchStart={() => (touched.current = performance.now())}
          >
            <div className="min-w-[1120px]">
              <BrickMorph signal={signal} onStage={onStage} />
            </div>
          </figure>
          <p className="-mt-2 text-center text-[12px] font-[600] text-ink-3">The figure follows each step; swipe to look around</p>
        </Container>
      )}
    </Section>
  );
}
