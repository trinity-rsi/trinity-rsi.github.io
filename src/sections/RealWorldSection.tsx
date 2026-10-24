import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'motion/react';
import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/ui/Reveal';
import { benchById } from '@/data/tree';
import { embodied, scene } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * Appendix E.3: the two embodied benchmarks, each run in a simulation rebuilt from its real scene
 * (Figure 67) and on the real robot; Base vs evolved Harness (Figures 68–71). Scores: Table 7.
 */
const TASKS = [
  {
    id: 'soon' as const,
    title: 'SOON · Unitree G1',
    goal: 'Walk from the side room into the office and touch the desk next to the white fan, judging distance from head-camera images alone.',
    h0: 'H₀ spends actions looking around and, once the desk looks close, stops and reaches too early.',
    h4: 'H(4) turns towards the desk after the doorway, does not take “looks close” as proof of reach, and advances in small steps until the hand touches the desk.',
    figs: { base: 68 as const, evolved: 69 as const },
  },
  {
    id: 'capx' as const,
    title: 'CaP-X · AlohaMini2',
    goal: 'Three upside-down paper cups on a white table; report the colour of the cube and the cup it is under, having lifted that cup.',
    h0: 'H₀ knocks cup 1 over, tries cup 3, then answers that there is no cube without ever examining cup 2.',
    h4: 'H(4) checks the cups one by one, retries a missed grasp, and answers only after it has seen the cube.',
    figs: { base: 70 as const, evolved: 71 as const },
  },
];

/** drag (or watch) the divider: simulation on the left, the real scene on the right */
function Compare({ task }: { task: 'soon' | 'capx' }) {
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-20% 0px');
  const [x, setX] = useState(0.5);
  const box = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  useEffect(() => {
    if (!near || reduce || touched.current) return;
    const ctl = animate(0.5, [0.5, 0.82, 0.18, 0.5], { duration: 5.5, ease: 'easeInOut', onUpdate: (v) => !touched.current && setX(v) });
    return () => ctl.stop();
  }, [near, reduce]);
  const move = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.max(0.02, Math.min(0.98, (clientX - r.left) / r.width)));
  };
  return (
    <div ref={ref}>
      <div
        ref={box}
        className="relative aspect-[900/593] cursor-ew-resize select-none overflow-hidden rounded-2xl bg-paper-2"
        onPointerDown={(e) => {
          touched.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => e.buttons && move(e.clientX)}
      >
        <img src={scene(task, 'real')} alt="Real scene" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${(1 - x) * 100}% 0 0)` }}>
          <img src={scene(task, 'sim')} alt="Simulated scene" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
        <div className="absolute inset-y-0 w-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${x * 100}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[13px] font-[800] text-[#12141c] shadow-lg">⇆</span>
        </div>
        <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11.5px] font-[700] text-white">Simulation</span>
        <span className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11.5px] font-[700] text-white">Real</span>
      </div>
    </div>
  );
}

function Spark({ vals, color, label }: { vals: number[]; color: string; label: string }) {
  const { t } = useTokens();
  const W = 150;
  const H = 46;
  const x = (i: number) => 6 + (i / 4) * (W - 12);
  const y = (v: number) => H - 6 - (v / 100) * (H - 14);
  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[46px] w-[150px]" aria-label={`${label}: ${vals.join(', ')}`}>
        <line x1={6} x2={W - 6} y1={y(0)} y2={y(0)} stroke={t.rule} />
        <motion.path d={vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
        {vals.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={i ? color : t.ink3} />
        ))}
      </svg>
      <div className="text-[12.5px] leading-tight">
        <p className="font-[700] text-ink">{label}</p>
        <p className="tabular text-ink-3">
          {vals[0]} → <span className="font-[760]" style={{ color }}>{vals[4]}</span>
        </p>
      </div>
    </div>
  );
}

export default function RealWorldSection() {
  const { t } = useTokens();
  const [mode, setMode] = useState<Record<string, 'base' | 'evolved'>>({ soon: 'evolved', capx: 'evolved' });
  return (
    <Section id="real-world" className="overflow-hidden pt-28 pb-10">
      <Container wide>
        <SectionHeader kicker="Real → Sim → Real · Appendix E.3" title="From simulated worlds to two real robots">
          Each embodied benchmark runs in a simulation rebuilt from its real scene, with a model of the same robot. The simulation trains; the real robot is unseen.
        </SectionHeader>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {TASKS.map((task, ti) => {
            const b = benchById[task.id === 'capx' ? 'cap-x' : 'soon'];
            const m = mode[task.id];
            return (
              <Reveal key={task.id} delay={ti * 0.08} className="figure-frame flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[19px] font-[780] text-ink">{task.title}</p>
                  <p className="text-[12.5px] text-ink-3">node {b.node === 'da' ? 'd → a' : b.node}</p>
                </div>
                <Compare task={task.id} />
                <p className="text-[14px] leading-[1.55] text-ink-2">{task.goal}</p>
                <div className="flex flex-wrap gap-5">
                  <Spark vals={b.scores.it} color={t.explorer} label="Simulation (train)" />
                  <Spark vals={b.robot!.it} color={t.accent} label="Real robot (unseen)" />
                </div>
                <div>
                  <div className="inline-flex rounded-full bg-paper-2 p-1">
                    {(['base', 'evolved'] as const).map((k) => (
                      <button key={k} type="button" onClick={() => setMode((s) => ({ ...s, [task.id]: k }))} className={`rounded-full px-3 py-1 text-[12.5px] font-[700] transition-colors ${m === k ? 'bg-surface text-ink shadow-sm' : 'text-ink-3'}`}>
                        {k === 'base' ? 'Base Harness H₀' : 'Evolved Harness H(4)'}
                      </button>
                    ))}
                  </div>
                  <div className="relative mt-3 overflow-hidden rounded-xl border border-rule bg-white">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`${task.id}-${m}`}
                        src={embodied(task.figs[m])}
                        alt={`${task.title}: ${m === 'base' ? 'Base Harness' : 'evolved Harness'}, simulation and real robot`}
                        className="block h-auto w-full"
                        initial={{ opacity: 0, x: m === 'evolved' ? 24 : -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                      />
                    </AnimatePresence>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-[1.55]" style={{ color: m === 'base' ? t.bad : t.good }}>
                    {m === 'base' ? task.h0 : task.h4}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
