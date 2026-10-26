import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight01Icon, Cancel01Icon, CheckmarkCircle02Icon, PauseIcon, PlayIcon, Robot01Icon } from '@hugeicons/core-free-icons';
import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icon';
import Finding from '@/components/ui/Finding';
import PaperFigure from '@/components/ui/PaperFigure';
import { Brick, BrickDefs, Plate } from '@/components/viz/Bricks';
import { benchById } from '@/data/tree';
import { FINDINGS } from '@/data/results';
import { PAPER_FIGS, embodied, recordFrame, trial, type PaperFig, type RecordView } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * Section 4.6 and Appendix E.3, embodied Real2Sim2Real. Both robot tasks sit at node d → a and use
 * the Harnesses evolved there; five trial-and-error episodes in the rebuilt simulator become skills,
 * frozen for the formal tests (Figure 7). Each card plays the paper's recorded frames in order: the
 * real-robot trial of Figure 7, and the Base and evolved runs of Figures 69–72, real robot or
 * simulation, from either camera. The scores are Table 6, as brick towers, ten points a brick, each
 * brick coloured by the iteration that earned it.
 */
type Task = 'soon' | 'capx';
type Mode = 'trial' | 'h0' | 'h4';
const TASKS: {
  id: Task;
  bench: string;
  name: string;
  robot: string;
  goal: string;
  h0: string;
  h4: string;
  steps: string[];
  cams: { id: 'office' | 'head' | 'wrist'; label: string }[];
  figs: { h0: 69 | 71; h4: 70 | 72 };
}[] = [
  {
    id: 'soon',
    bench: 'soon',
    name: 'SOON',
    robot: 'Unitree G1',
    goal: 'Walk from the side room into the office and reach towards the desk beside the white fan. On the real robot, success needs the desk ahead of the outstretched arm, within 30 cm; a collision fails the episode.',
    h0: 'looks left and right and, once the desk looks close, reaches too early: in simulation the hand stops about 0.5 m short, on the robot the arm rises while the desk is out of reach.',
    h4: 'turns towards the desk right after the doorway, does not take a desk that merely looks close as proof of reach, and advances in small steps until the hand ends within the range judged a touch.',
    steps: ['Enter aisle', 'Move closer', 'Before reach', 'Reach (30 cm)'],
    cams: [
      { id: 'office', label: 'Office camera' },
      { id: 'head', label: 'Head camera' },
    ],
    figs: { h0: 69, h4: 70 },
  },
  {
    id: 'capx',
    bench: 'cap-x',
    name: 'CaP-X',
    robot: 'AlohaMini2',
    goal: 'Three paper cups stand upside down on a white table; uncover them and report whether a cube is present and, if it is, its colour and the cup it is under.',
    h0: 'grasps clumsily, knocks cup 1 over, tries cup 3 and answers that there is no cube without ever examining cup 2.',
    h4: 'checks the cups one by one, retries a missed grasp, and answers only after it has seen the cube; on the real robot it sweeps the cups aside to uncover it.',
    steps: ['Inspect cups', 'Approach', 'Align', 'Lift & reveal'],
    cams: [
      { id: 'head', label: 'Head camera' },
      { id: 'wrist', label: 'Wrist camera' },
    ],
    figs: { h0: 71, h4: 72 },
  },
];

const FIG_SIZE: Record<number, [number, number]> = { 69: [1600, 741], 70: [1600, 741], 71: [1400, 984], 72: [1400, 984] };
const CAPTION: Record<number, string> = {
  69: 'Figure 69: SOON with the Base Harness. Rows show simulation and real-robot views from the fixed office camera, followed by the head camera. Faces of people in the real scenes are pixelated.',
  70: 'Figure 70: SOON with the evolved Harness. Rows follow Figure 69. Faces of people in the real scenes are pixelated.',
  71: 'Figure 71: CaP-X with the Base Harness. Rows show head, side and wrist cameras in simulation, followed by the real robot.',
  72: 'Figure 72: CaP-X with the evolved Harness. Rows follow Figure 71.',
};
const figOf = (n: 69 | 70 | 71 | 72): PaperFig => ({ n, src: embodied(n), w: FIG_SIZE[n][0], h: FIG_SIZE[n][1], caption: CAPTION[n] });

const STEP_MS = 1150;

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

/** a small segmented switch over the picture */
function Seg<T extends string>({ value, items, onChange, id, label }: { value: T; items: { v: T; l: string; off?: boolean }[]; onChange: (v: T) => void; id: string; label: string }) {
  return (
    <div className="inline-flex rounded-full bg-[rgba(12,14,22,0.58)] p-1 backdrop-blur-md" role="radiogroup" aria-label={label}>
      {items.map((x) => (
        <button
          key={x.v}
          type="button"
          role="radio"
          aria-checked={value === x.v}
          disabled={x.off}
          onClick={() => onChange(x.v)}
          className={`relative rounded-full px-2.5 py-1 text-[11.5px] font-[700] transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${value === x.v ? 'text-[#12141c]' : 'text-white/80 hover:text-white'}`}
        >
          {value === x.v && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
          <span className="relative">{x.l}</span>
        </button>
      ))}
    </div>
  );
}

/** the paper's recorded frames, played in order */
function Replay({ task }: { task: (typeof TASKS)[number] }) {
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [mode, setMode] = useState<Mode>('trial');
  const [real, setReal] = useState(true);
  const [cam, setCam] = useState(task.cams[0].id);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const n = mode === 'trial' ? 4 : 6;
  const running = playing && near && !reduce;

  useEffect(() => setK(0), [mode, task.id]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setK((v) => (v + 1) % n), mode === 'trial' ? STEP_MS * 1.25 : STEP_MS);
    return () => window.clearInterval(id);
  }, [running, n, mode]);

  // decode the frames of this view ahead of time
  useEffect(() => {
    if (!near) return;
    for (let i = 1; i <= n; i++) {
      const im = new Image();
      im.src = frameSrc(task.id, mode, real, cam, i);
      im.decode?.().catch(() => undefined);
    }
  }, [near, task.id, mode, real, cam, n]);

  const src = frameSrc(task.id, mode, real, cam, k + 1);
  const label =
    mode === 'trial'
      ? `${k + 1}. ${task.steps[k]}`
      : `${real ? 'Real robot' : 'Simulation'} · ${task.cams.find((c) => c.id === cam)!.label.toLowerCase()} · frame ${k + 1} of 6`;
  const source = mode === 'trial' ? `Real-robot trial, Figure 7 (${task.id === 'soon' ? 'SOON E01' : 'CaP-X C-01'})` : `${mode === 'h0' ? 'Base Harness H₀' : 'Evolved Harness H(4)'}, Figure ${task.figs[mode]}`;
  const good = mode === 'h4' || mode === 'trial';

  return (
    <div ref={ref} className="relative aspect-[4/3] select-none overflow-hidden bg-[#0c0e15]">
      <AnimatePresence initial={false}>
        <motion.img
          key={src}
          src={src}
          alt={`${task.name}: ${label}`}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          transition={{ opacity: { duration: 0.42 }, scale: { duration: STEP_MS / 1000 + 0.4, ease: 'linear' } }}
          draggable={false}
        />
      </AnimatePresence>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" aria-hidden />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />

      {/* what is playing */}
      <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center justify-between gap-2">
        <Seg
          id={`rw-mode-${task.id}`}
          label="Which run"
          value={mode}
          onChange={setMode}
          items={[
            { v: 'trial', l: 'Robot trial' },
            { v: 'h0', l: 'Base H₀' },
            { v: 'h4', l: 'Evolved H(4)' },
          ]}
        />
        {mode !== 'trial' && (
          <div className="flex flex-wrap gap-2">
            <Seg
              id={`rw-real-${task.id}`}
              label="Real robot or simulation"
              value={real ? 'real' : 'sim'}
              onChange={(v) => setReal(v === 'real')}
              items={[
                { v: 'real', l: 'Real' },
                { v: 'sim', l: 'Sim.' },
              ]}
            />
            <Seg id={`rw-cam-${task.id}`} label="Camera" value={cam} onChange={setCam} items={task.cams.map((c) => ({ v: c.id, l: c.label.replace(' camera', '') }))} />
          </div>
        )}
      </div>

      {/* progress, caption and controls */}
      <div className="absolute inset-x-3 bottom-3">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p key={label} className="truncate text-[14px] font-[760] text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.25 }}>
                {label}
              </motion.p>
            </AnimatePresence>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] font-[620] text-white/75">
              <Icon icon={good ? CheckmarkCircle02Icon : Cancel01Icon} size={13} stroke={2.2} color={good ? '#5fe08a' : '#ff8a8a'} />
              {source}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/90 text-[#12141c] shadow"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <Icon icon={playing ? PauseIcon : PlayIcon} size={14} stroke={2.2} />
          </button>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: n }, (_, i) => (
            <button key={i} type="button" onClick={() => setK(i)} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/25" aria-label={`Frame ${i + 1}`}>
              {i < k && <span className="absolute inset-0 bg-white/85" />}
              {i === k && (
                <motion.span
                  key={`${mode}-${k}-${running}`}
                  className="absolute inset-y-0 left-0 bg-white"
                  initial={{ width: running ? '0%' : '100%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: running ? (mode === 'trial' ? STEP_MS * 1.25 : STEP_MS) / 1000 : 0, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <span className="pointer-events-none absolute left-3 top-14 inline-flex items-center gap-1.5 rounded-[10px] bg-[rgba(12,14,22,0.62)] px-2.5 py-1 text-white backdrop-blur-md">
        <Icon icon={Robot01Icon} size={14} stroke={2} />
        <span className="text-[12.5px] font-[760]">
          {task.name} <span className="text-white/55">·</span> {task.robot}
        </span>
      </span>
      <span className="sr-only">Frames from the paper, played in order</span>
    </div>
  );
}

function frameSrc(task: Task, mode: Mode, real: boolean, cam: string, k: number) {
  if (mode === 'trial') return trial(task, k);
  const view = `${real ? 'real' : 'sim'}-${cam}` as RecordView;
  return recordFrame(task, mode, view, k);
}

function RobotCard({ task, i }: { task: (typeof TASKS)[number]; i: number }) {
  const { t, theme } = useTokens();
  const b = benchById[task.bench];
  const teal = theme === 'dark' ? ['#2b5f5a', '#2f857d', '#22a597', '#5fd1c4'] : ['#a7dcd6', '#62c1b8', '#25a397', '#0e8f86'];
  return (
    <Reveal delay={i * 0.08} className="overflow-hidden rounded-[26px] border border-rule bg-surface shadow-[0_40px_90px_-60px_rgba(20,24,40,0.7)]">
      <Replay task={task} />

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
          <p className="mt-1.5 text-center text-[11px] text-ink-3">Table 6 · success rate (%) with prepared skills</p>
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
            <PaperFigure fig={figOf(task.figs.h0)} label={`All frames · H₀ (Fig. ${task.figs.h0})`} />
            <PaperFigure fig={figOf(task.figs.h4)} label={`All frames · H(4) (Fig. ${task.figs.h4})`} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** Figure 7's three steps: real site → simulation → real test */
function Flow() {
  const { t } = useTokens();
  const steps = [
    { n: '1', k: 'Real', title: 'Site and task', text: 'Each robot task is mapped by its capability requirements to node d → a and uses the Harness evolved there.', color: t.accent },
    { n: '2', k: 'Sim', title: '5 trials → skills', text: 'Holding the Harness fixed, five trial-and-error episodes in the simulator rebuilt from the site are summarized into skills.', color: t.explorer },
    { n: '3', k: 'Real', title: 'Test with fixed Harness and skills', text: 'The skills are frozen for the formal simulation and real-robot tests; the preparation episodes are not counted.', color: t.good },
  ];
  return (
    <Reveal className="mt-12 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.15fr)] md:items-stretch">
      {steps.map((s, i) => (
        <div key={s.n} className="contents">
          <div className="rounded-[20px] border border-rule bg-surface p-4">
            <p className="flex items-baseline gap-2">
              <span className="text-[26px] font-[850] leading-none" style={{ color: s.color, fontStretch: '115%' }}>
                {s.n}
              </span>
              <span className="text-[12px] font-[780] uppercase tracking-[0.14em]" style={{ color: s.color }}>
                {s.k}
              </span>
              <span className="text-[15px] font-[740] text-ink">{s.title}</span>
            </p>
            <p className="mt-1.5 text-[13.5px] leading-[1.5] text-ink-2">{s.text}</p>
          </div>
          {i < steps.length - 1 && (
            <span className="hidden items-center justify-center text-ink-3 md:flex" aria-hidden>
              <Icon icon={ArrowRight01Icon} size={20} stroke={2} />
            </span>
          )}
        </div>
      ))}
    </Reveal>
  );
}

export default function RealWorldSection() {
  const f5 = FINDINGS[4];
  return (
    <Section id="real-world" className="overflow-hidden pb-10 pt-20 sm:pt-28">
      <Container wide>
        <SectionHeader kicker="Embodied Real2Sim2Real · Section 4.6, Appendix E.3" title="From simulated worlds to two real robots" aside={<PaperFigure fig={PAPER_FIGS.embodied} />}>
          Each robot task runs in a simulation rebuilt from its real site, with a model of the same robot. Skills prepared in simulation are frozen, then every Harness, from H₀ to H(4), is tested in simulation and on the real robot.
        </SectionHeader>
        <Flow />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {TASKS.map((task, i) => (
            <RobotCard key={task.id} task={task} i={i} />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          <Finding n={f5.n} title={f5.title}>
            {f5.text}
          </Finding>
          <p className="text-[13px] leading-[1.55] text-ink-3">
            Recorded deployments differ in message handling, interfaces, guidance and acceptance rules (including lifting versus pushing), so these comparisons evaluate complete Harness–skill configurations and do not isolate module evolution from skill preparation. The pictures are the paper’s recorded frames, shown in order; real and simulated scenes: Figure 68.
          </p>
        </div>
      </Container>
    </Section>
  );
}
