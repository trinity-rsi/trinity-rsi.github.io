import { useMemo } from 'react';
import { motion } from 'motion/react';
import LogoLoop from '@/components/reactbits/LogoLoop/LogoLoop';
import Icon from '@/components/ui/Icon';
import Reveal from '@/components/ui/Reveal';
import PaperFigure from '@/components/ui/PaperFigure';
import { Container, Section } from '@/components/ui/Section';
import { CAP_NODES, benchById, pathLabel, type NodeId } from '@/data/tree';
import { PAPER_FIGS, e1Frame, nodeLevel } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { useLoopClock, seg, easeOut, easeOutBack, window01 } from '@/lib/anim';
import { CheckmarkCircle02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import creatorBuild from '@/assets/cats/creator-build.webp';

/**
 * Stage 2, world creation: Capability-Driven Real2Sim2Real (Section 3.3, Figures 2 and 3).
 *   1. Figure 3: four tasks at node d share one decision, and Creator builds a world for it.
 *   2. The pipeline of Figure 2: generation input → verifier pool → generation world → host
 *      verification → difficulty screening.
 *   3. The levels Creator built: one per node and iteration (Appendix E.2).
 */
const FIG3 = [
  { id: 'euro-ncap-aeb', q: 'Noisy range: break or hold?' },
  { id: 'among-us', q: 'Conflicting accounts: what to claim?' },
  { id: 'glee-persuasion', q: 'Buyer feedback: which message?' },
  { id: 'pinverify', q: 'Hidden detail: inspect or decide?' },
];

function Converge() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [p] = useLoopClock(9, near && !reduce, reduce ? 0.6 : 0);
  // 0–0.25 tasks appear · 0.25–0.45 lines draw to the node · 0.45–0.6 the world appears · 0.6–0.95 the two outcomes
  const lines = easeOut(seg(p, 0.22, 0.45));
  const world = easeOutBack(seg(p, 0.44, 0.58));
  const good = seg(p, 0.6, 0.7);
  const bad = seg(p, 0.7, 0.8);
  const fade = 1 - seg(p, 0.94, 1);
  return (
    <div ref={ref} className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_120px_minmax(0,1fr)]" style={{ opacity: reduce ? 1 : Math.min(1, 0.25 + fade) }}>
      <div className="grid grid-cols-2 gap-3">
        {FIG3.map((x, i) => {
          const b = benchById[x.id];
          const k = reduce ? 1 : easeOut(seg(p, 0.02 + i * 0.045, 0.14 + i * 0.045));
          return (
            <div key={x.id} className="overflow-hidden rounded-2xl border border-rule bg-surface" style={{ opacity: k, transform: `translateY(${(1 - k) * 14}px) scale(${0.96 + 0.04 * k})` }}>
              <div className="relative aspect-[16/10]">
                <img src={e1Frame(b.id, 'start')} alt={b.name} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-0.5 text-[12px] font-[700] text-white">{b.name}</span>
              </div>
              <p className="px-3 py-2 text-[13px] font-[620] text-ink-2">{x.q}</p>
            </div>
          );
        })}
      </div>

      {/* the four decisions converge on one requirement */}
      <svg viewBox="0 0 120 300" className="hidden h-[300px] w-full lg:block" aria-hidden>
        {[45, 115, 185, 255].map((y, i) => (
          <path key={i} d={`M 0 ${y} C 60 ${y}, 60 150, 112 150`} fill="none" stroke={t.creator} strokeWidth={1.8} strokeOpacity={0.7} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lines} />
        ))}
        <circle cx={112} cy={150} r={5 + 3 * world} fill={t.creator} opacity={lines} />
      </svg>

      <div className="relative" style={{ opacity: reduce ? 1 : world, transform: `scale(${0.92 + 0.08 * world})` }}>
        <div className="overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_24px_60px_-34px_rgba(0,0,0,0.5)]">
          <div className="relative aspect-[16/10] bg-paper-2">
            <img src={nodeLevel('d', 1)} alt="The world Creator built for node d" className="absolute inset-0 h-full w-full object-cover" />
            <img src={creatorBuild} alt="" className="absolute -bottom-2 -right-1 h-24 w-24 object-contain drop-shadow-lg" />
          </div>
          <div className="space-y-2 p-4">
            <p className="text-[12px] font-[700] uppercase tracking-[0.1em] text-creator">Node d · Creator’s world</p>
            <p className="text-[15px] font-[680] leading-snug text-ink">Is Q7 the object described by all the attributes? (YES / NO)</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-[700]" style={{ background: `${t.good}18`, color: t.good, opacity: reduce ? 1 : good }}>
                <Icon icon={CheckmarkCircle02Icon} size={14} /> Evidence-gated commitment
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-[700]" style={{ background: `${t.bad}18`, color: t.bad, opacity: reduce ? 1 : bad }}>
                <Icon icon={Cancel01Icon} size={14} /> Premature commitment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PIPE = [
  { k: '1', title: 'Generation input', items: ['Templates', 'Capability', 'Constraints', 'Scale', 'Difficulty', 'Notes'], text: 'Node requirements, descendants and representative training tasks’ public specifications. No target layouts, private proofs or solution traces.' },
  { k: '2', title: 'Verifier pool', items: ['Fixed: interface, runtime', 'Task-conditioned: goals, solvability'], text: 'Creator implements the specification with its shared Harness and Evolver’s verifier pool; verifier code stays private.' },
  { k: '3', title: 'Generation world', items: ['Browser world', '3D scene', 'Public rules'], text: 'A simplified level that preserves the required decision. Training relies on task mechanisms, not visual aesthetics.' },
  { k: '4', title: 'Host verification', items: ['Node binding', 'Execution', 'Transitions', 'Rendering', 'Completion'], text: 'Failed checks return feedback through public contracts, and Creator revises the world.' },
  { k: '5', title: 'Difficulty screening', items: ['Too hard', 'Admit', 'Too easy'], text: 'A frozen screening Harness admits only worlds whose completion counts fall inside a prespecified intermediate band.' },
];

function Pipeline() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const [p] = useLoopClock(11, near && !reduce, reduce ? 0.95 : 0);
  // the world token visits steps 1..5; at step 4 the first attempt fails and is revised
  const stepAt = (x: number) => (x < 0.14 ? 0 : x < 0.28 ? 1 : x < 0.42 ? 2 : x < 0.66 ? 3 : 4);
  const cur = stepAt(p);
  const failing = window01(p, 0.44, 0.53, 0.02);
  const revised = p > 0.53;
  // screening needle: lands in the admit band
  const needle = easeOutBack(seg(p, 0.7, 0.84));
  const admitted = p > 0.84;
  return (
    <div ref={ref}>
      <div className="relative grid gap-3 md:grid-cols-5">
        {/* the rail the world travels on */}
        <div className="pointer-events-none absolute left-[10%] right-[10%] top-[34px] hidden h-[2px] bg-rule md:block" aria-hidden>
          <div className="h-full bg-creator transition-[width] duration-300" style={{ width: `${(Math.min(cur, 4) / 4) * 100}%` }} />
        </div>
        {PIPE.map((s, i) => {
          const on = i === cur;
          const done = i < cur;
          return (
            <div key={s.k} className={`relative rounded-2xl border bg-surface p-4 transition-all duration-500 ${on ? 'border-creator/60 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.5)]' : 'border-rule'}`}>
              <div className="flex items-center gap-2.5">
                <span
                  className="relative z-10 grid h-9 w-9 place-items-center rounded-full text-[13px] font-[780] transition-colors duration-500"
                  style={{ background: on || done ? t.creator : t.paper2, color: on || done ? '#fff' : t.ink3 }}
                >
                  {i === 3 && on && failing > 0.5 ? '✗' : done ? '✓' : s.k}
                </span>
                <p className="text-[14.5px] font-[720] leading-tight text-ink">{s.title}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.items.map((it, j) => {
                  const band = i === 4;
                  const admit = band && j === 1;
                  return (
                    <span
                      key={it}
                      className="rounded-md border px-1.5 py-0.5 text-[11.5px] font-[620] transition-colors duration-500"
                      style={{
                        borderColor: band && admit && admitted ? t.good : t.rule,
                        background: band && admit && admitted ? `${t.good}18` : band && !admit ? t.surface2 : t.surface,
                        color: band && admit && admitted ? t.good : t.ink2,
                      }}
                    >
                      {it}
                    </span>
                  );
                })}
              </div>
              {i === 3 && (
                <p className="mt-2 text-[11.5px] font-[650]" style={{ color: failing > 0.5 ? t.bad : revised ? t.good : t.ink3 }}>
                  {failing > 0.5 ? 'Check failed: revise' : revised ? 'Passed after revision' : 'Waiting for the world'}
                </p>
              )}
              {i === 4 && (
                <div className="relative mt-3 h-6">
                  <div className="absolute inset-x-0 top-2.5 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${t.bad}55 0 33%, ${t.good}66 33% 66%, ${t.ink3}44 66%)` }} />
                  <motion.div className="absolute top-0 h-6 w-[3px] rounded-full bg-ink" style={{ left: `${10 + needle * 40}%` }} />
                </div>
              )}
              <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-2">{s.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WorldSection() {
  const { t } = useTokens();
  const levels = useMemo(
    () =>
      CAP_NODES.flatMap((n) =>
        [1, 2, 3, 4].map((it) => ({
          node: n.id as Exclude<NodeId, 'root'>,
          it,
        }))
      ),
    []
  );
  return (
    <Section id="world-creation" tone="alt" className="py-28">
      <Container wide>
        <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          <div>
            <p className="text-[14px] font-[700] text-creator">Stage 2 · World creation</p>
            <h2 className="display-lg mt-2 text-[clamp(2.1rem,4.6vw,4rem)] text-ink">Capability-Driven Real2Sim2Real</h2>
          </div>
          <div>
            <p className="font-serif text-[1.08rem] leading-[1.6] text-ink-2">
              Heterogeneous tasks at the same node share a learning objective. Creator abstracts their common requirements into simplified, verifiable worlds for capability learning, while evaluation on the original tasks measures transfer.
            </p>
            <PaperFigure fig={PAPER_FIGS.worlds} className="mt-4" />
          </div>
        </div>

        <Reveal className="mt-14">
          <Converge />
        </Reveal>

        <div className="mt-20">
          <h3 className="display-md text-[clamp(1.5rem,2.6vw,2.1rem)] text-ink">From a requirement to an admitted world</h3>
          <p className="mt-3 max-w-[70ch] font-serif text-[1.04rem] leading-[1.6] text-ink-2">Trial count, band, action budget and retry limit are fixed beforehand; screening trials stay separate from training.</p>
          <div className="mt-8">
            <Pipeline />
          </div>
        </div>
      </Container>

      <div className="mt-20">
        <Container wide>
          <p className="mb-4 text-center text-[13.5px] font-[650] text-ink-3">
            The 44 levels Creator built: one per node and iteration, each solved by the node’s evolving Harness (Appendix E.2)
          </p>
        </Container>
        {[0, 1].map((row) => (
          <div key={row} className={row ? 'mt-3' : ''}>
            <LogoLoop
              logos={levels
                .filter((_, i) => i % 2 === row)
                .map((l) => ({
                  node: (
                    <span className="relative block h-[112px] w-[176px] overflow-hidden rounded-xl border border-rule bg-surface">
                      <img src={nodeLevel(l.node, l.it)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-[700] text-white">
                        {pathLabel(l.node)} · iter {l.it}
                      </span>
                    </span>
                  ),
                  title: `${pathLabel(l.node)}, iteration ${l.it}`,
                }))}
              speed={row ? 34 : 26}
              direction={row ? 'right' : 'left'}
              logoHeight={112}
              gap={12}
              pauseOnHover
              fadeOut
              fadeOutColor={t.paper2}
              scaleOnHover
              ariaLabel="Levels built by Creator for each capability node"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
