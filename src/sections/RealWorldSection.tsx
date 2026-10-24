import { useState } from 'react';
import { motion } from 'motion/react';
import { Cancel01Icon, CheckmarkCircle02Icon, Robot01Icon } from '@hugeicons/core-free-icons';
import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icon';
import PaperFigure from '@/components/ui/PaperFigure';
import { Brick, BrickDefs, Plate } from '@/components/viz/Bricks';
import { benchById } from '@/data/tree';
import { embodied, scene, type PaperFig } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';

/**
 * Appendix E.3: the two embodied benchmarks, the way the film shows them. The real robot comes
 * first (hover or switch to see the simulation rebuilt from its scene, Figure 67); the scores are
 * brick towers, ten points a brick, each brick coloured by the iteration that earned it (Table 7);
 * the frame-by-frame record of Base and evolved Harness (Figures 68–71) opens on request.
 */
const TASKS = [
  {
    id: 'soon' as const,
    bench: 'soon',
    name: 'SOON',
    robot: 'Unitree G1',
    goal: 'Walk from the side room into the office and touch the desk next to the white fan, judging distance from head-camera images alone.',
    h0: 'stops and reaches as soon as the desk looks close.',
    h4: 'turns towards the desk after the doorway and advances in small steps until the hand touches it.',
    figs: { base: 68 as const, evolved: 69 as const },
  },
  {
    id: 'capx' as const,
    bench: 'cap-x',
    name: 'CaP-X',
    robot: 'AlohaMini2',
    goal: 'Three upside-down paper cups on a white table: report the colour of the cube and the cup it is under, having lifted that cup.',
    h0: 'knocks cup 1 over, tries cup 3, and answers “no cube” without examining cup 2.',
    h4: 'checks the cups one by one, retries a missed grasp, and answers only after it has seen the cube.',
    figs: { base: 70 as const, evolved: 71 as const },
  },
];

const FIG_SIZE: Record<number, [number, number]> = { 68: [1600, 741], 69: [1600, 741], 70: [1400, 984], 71: [1400, 984] };
const figOf = (n: 68 | 69 | 70 | 71, task: string, evolved: boolean): PaperFig => ({
  n,
  src: embodied(n),
  w: FIG_SIZE[n][0],
  h: FIG_SIZE[n][1],
  caption: `Figure ${n}: ${task}, ${evolved ? 'evolved Harness H(4)' : 'Base Harness H₀'}, in simulation and on the real robot (frame by frame). Faces of people in the real scenes are pixelated.`,
});

/* tower geometry (one brick = ten points) */
const TW = { w: 250, h: 236, col: 66, brickH: 15, gap: 3, base: 186 };
const towerX = (k: number) => 34 + k * 112;

function Towers({ sim, real, delay }: { sim: number[]; real: number[]; delay: number }) {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const teal = theme === 'dark' ? ['#2b5f5a', '#2f857d', '#22a597', '#5fd1c4'] : ['#a7dcd6', '#62c1b8', '#25a397', '#0e8f86'];
  const red = t.iters.slice(1, 5);
  const grey = theme === 'dark' ? '#4a5268' : '#b8bcc8';
  const cols = [
    { vals: sim, shades: teal, label: 'Simulation', sub: 'train', ink: t.explorer },
    { vals: real, shades: red, label: 'Real robot', sub: 'unseen', ink: t.accent },
  ];
  return (
    <svg viewBox={`0 0 ${TW.w} ${TW.h}`} className="block h-auto w-full max-w-[250px]" role="img" aria-label={`Simulation ${sim[0]} → ${sim[4]}, real robot ${real[0]} → ${real[4]} over four iterations`}>
      <BrickDefs id="tw" />
      {cols.map((c, k) => {
        // one brick per ten points, coloured by the iteration that earned it
        const bricks: { it: number }[] = [];
        for (let i = 0; i < Math.round(c.vals[0] / 10); i++) bricks.push({ it: 0 });
        for (let it = 1; it <= 4; it++) for (let i = Math.round(c.vals[it - 1] / 10); i < Math.round(c.vals[it] / 10); i++) bricks.push({ it });
        const x = towerX(k);
        const top = TW.base - bricks.length * (TW.brickH + TW.gap);
        return (
          <g key={c.label}>
            {bricks.map((b, i) => (
              <motion.g
                key={i}
                initial={reduce ? false : { y: -90, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                transition={{ y: { type: 'spring', stiffness: 520, damping: 22, delay: delay + k * 0.25 + i * 0.09 }, opacity: { duration: 0.15, delay: delay + k * 0.25 + i * 0.09 } }}
              >
                <Brick x={x} y={TW.base - (i + 1) * (TW.brickH + TW.gap) + TW.gap} w={TW.col} h={TW.brickH} color={b.it === 0 ? grey : c.shades[b.it - 1]} studs={3} defs="tw" shadow={false} />
              </motion.g>
            ))}
            <motion.text
              x={x + TW.col / 2}
              y={top - 16}
              textAnchor="middle"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: delay + k * 0.25 + bricks.length * 0.09 + 0.2 }}
            >
              <tspan fill={t.ink3} style={{ fontSize: 13, fontWeight: 700 }}>
                {c.vals[0]} →{' '}
              </tspan>
              <tspan fill={c.ink} style={{ fontSize: 24, fontWeight: 820 }}>
                {c.vals[4]}
              </tspan>
            </motion.text>
            <Plate x={x - 10} y={TW.base + 2} w={TW.col + 20} h={9} />
            <text x={x + TW.col / 2} y={TW.base + 29} textAnchor="middle" fill={t.ink} style={{ fontSize: 12.5, fontWeight: 740 }}>
              {c.label}
            </text>
            <text x={x + TW.col / 2} y={TW.base + 44} textAnchor="middle" fill={t.ink3} style={{ fontSize: 11, fontWeight: 600 }}>
              {c.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RobotCard({ task, i }: { task: (typeof TASKS)[number]; i: number }) {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const b = benchById[task.bench];
  const [view, setView] = useState<'real' | 'sim'>('real');
  const [peek, setPeek] = useState(false);
  const shown = peek ? (view === 'real' ? 'sim' : 'real') : view;
  const teal = theme === 'dark' ? ['#2b5f5a', '#2f857d', '#22a597', '#5fd1c4'] : ['#a7dcd6', '#62c1b8', '#25a397', '#0e8f86'];
  return (
    <Reveal delay={i * 0.08} className="overflow-hidden rounded-[26px] border border-rule bg-surface shadow-[0_40px_90px_-60px_rgba(20,24,40,0.7)]">
      {/* the robot first */}
      <div
        className="group relative aspect-[900/593] select-none overflow-hidden bg-paper-2"
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
      >
        <img
          src={scene(task.id, 'real')}
          alt={`${task.name} on the ${task.robot}: the real scene`}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1.8s] ease-out ${reduce ? '' : 'group-hover:scale-[1.035]'}`}
          draggable={false}
        />
        <motion.img
          src={scene(task.id, 'sim')}
          alt={`${task.name}: the simulation rebuilt from the real scene`}
          className="absolute inset-0 h-full w-full object-cover"
          animate={{ opacity: shown === 'sim' ? 1 : 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          draggable={false}
        />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" aria-hidden />
        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-[12px] bg-[rgba(12,14,22,0.72)] px-3 py-1.5 text-white backdrop-blur-md">
          <Icon icon={Robot01Icon} size={15} stroke={2} />
          <span className="text-[13.5px] font-[760]">
            {task.name} <span className="text-white/60">·</span> {task.robot}
          </span>
        </span>
        {/* real ⇄ simulation */}
        <div className="absolute right-3 top-3 inline-flex rounded-full bg-[rgba(12,14,22,0.55)] p-1 backdrop-blur-md" role="radiogroup" aria-label="Real scene or simulation">
          {(['real', 'sim'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={view === k}
              onClick={() => {
                setView(k);
                setPeek(false);
              }}
              className={`relative rounded-full px-2.5 py-1 text-[11.5px] font-[700] transition-colors ${shown === k ? 'text-[#12141c]' : 'text-white/80 hover:text-white'}`}
            >
              {shown === k && <motion.span layoutId={`rw-${task.id}`} className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
              <span className="relative">{k === 'real' ? 'Real robot' : 'Simulation'}</span>
            </button>
          ))}
        </div>
        {/* the result, on the picture, as in the film */}
        <span
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-[780] text-white shadow-lg transition-colors duration-300"
          style={{ background: shown === 'real' ? '#14a23a' : teal[3] }}
        >
          {shown === 'real' ? 'real robot' : 'simulation'} {shown === 'real' ? b.robot!.it[0] : b.scores.it[0]} → {shown === 'real' ? b.robot!.it[4] : b.scores.it[4]}
        </span>
        <span className="absolute bottom-3.5 right-3 hidden text-[11.5px] font-[600] text-white/80 sm:block">hover to see the simulation</span>
      </div>

      {/* scores as bricks, and what changed */}
      <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-center">
        <div className="mx-auto w-full max-w-[250px]">
          <Towers sim={b.scores.it as unknown as number[]} real={b.robot!.it as unknown as number[]} delay={0.15 + i * 0.1} />
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10.5px] font-[650] text-ink-3">
            <span className="h-2.5 w-3.5 rounded-[3px]" style={{ background: theme === 'dark' ? '#4a5268' : '#b8bcc8' }} /> H₀
            {[1, 2, 3, 4].map((k) => (
              <span key={k} className="inline-flex items-center gap-1 pl-1">
                <span className="h-2.5 w-3.5 rounded-[3px]" style={{ background: `linear-gradient(90deg, ${teal[k - 1]} 50%, ${t.iters[k]} 50%)` }} />
                it {k}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[14px] leading-[1.55] text-ink-2">{task.goal}</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2.5 rounded-[12px] bg-paper-2/70 px-3 py-2 text-[13px] leading-snug text-ink-2">
              <Icon icon={Cancel01Icon} size={16} stroke={2.2} color={t.bad} className="mt-0.5 shrink-0" />
              <span>
                <b className="font-[750] text-ink">Base Harness H₀</b> {task.h0}
              </span>
            </li>
            <li className="flex items-start gap-2.5 rounded-[12px] px-3 py-2 text-[13px] leading-snug text-ink-2" style={{ background: `${t.good}14` }}>
              <Icon icon={CheckmarkCircle02Icon} size={16} stroke={2.2} color={t.good} className="mt-0.5 shrink-0" />
              <span>
                <b className="font-[750] text-ink">Evolved Harness H(4)</b> {task.h4}
              </span>
            </li>
          </ul>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <PaperFigure fig={figOf(task.figs.base, task.name, false)} label={`Frames · H₀ (Fig. ${task.figs.base})`} />
            <PaperFigure fig={figOf(task.figs.evolved, task.name, true)} label={`Frames · H(4) (Fig. ${task.figs.evolved})`} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function RealWorldSection() {
  return (
    <Section id="real-world" className="overflow-hidden pt-28 pb-10">
      <Container wide>
        <SectionHeader kicker="Real → Sim → Real · Appendix E.3" title="From simulated worlds to two real robots">
          Each embodied benchmark runs in a simulation rebuilt from its real scene, with a model of the same robot. The simulation trains; the real robot is unseen.
        </SectionHeader>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {TASKS.map((task, i) => (
            <RobotCard key={task.id} task={task} i={i} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
