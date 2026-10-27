import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import PaperFigure from '@/components/ui/PaperFigure';
import { Cancel01Icon, CheckmarkCircle02Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { benchById } from '@/data/tree';
import { FINDINGS } from '@/data/results';
import { PAPER_FIGS } from '@/data/media';
import { STEP_MS, TASKS, Towers, figOf, frameSrc, type Mode } from '@/sections/RealWorldSection';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';
import More from '../ui/More';
import Seg from '../ui/Seg';

/**
 * Embodied Real2Sim2Real on a phone (Section 4.6, Appendix E.3): one robot at a time. The paper's
 * recorded frames play in order (the real-robot trial of Figure 7, or the Base and evolved runs of
 * Figures 69–72), with the choices under the picture rather than over it; the scores (Table 6) are
 * brick towers, ten points a brick, coloured by the iteration that earned them.
 */
type T = (typeof TASKS)[number];

function Replay({ task, mode, setMode }: { task: T; mode: Mode; setMode: (m: Mode) => void }) {
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [real, setReal] = useState(true);
  const [cam, setCam] = useState<string>(task.cams[0].id);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const n = mode === 'trial' ? 4 : 6;
  const running = playing && near && !reduce;
  const step = mode === 'trial' ? STEP_MS * 1.25 : STEP_MS;

  useEffect(() => {
    setK(0);
    setCam(task.cams[0].id);
  }, [task.id, task.cams]);
  useEffect(() => setK(0), [mode]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setK((v) => (v + 1) % n), step);
    return () => window.clearInterval(id);
  }, [running, n, step]);
  useEffect(() => {
    if (!near) return;
    for (let i = 1; i <= n; i++) {
      const im = new Image();
      im.src = frameSrc(task.id, mode, real, cam, i);
      im.decode?.().catch(() => undefined);
    }
  }, [near, task.id, mode, real, cam, n]);

  const src = frameSrc(task.id, mode, real, cam, k + 1);
  const label = mode === 'trial' ? `${k + 1}. ${task.steps[k]}` : `${real ? 'Real robot' : 'Simulation'}, ${task.cams.find((c) => c.id === cam)!.label.toLowerCase()}, frame ${k + 1} of 6`;
  const good = mode !== 'h0';

  return (
    <div ref={ref}>
      <div className="relative aspect-[4/3] select-none overflow-hidden bg-[#0c0e15]">
        <AnimatePresence initial={false}>
          <motion.img
            key={src}
            src={src}
            alt={`${task.name}: ${label}`}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ opacity: { duration: 0.4 }, scale: { duration: step / 1000 + 0.4, ease: 'linear' } }}
            draggable={false}
          />
        </AnimatePresence>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" aria-hidden />
        <div className="absolute inset-x-3 bottom-3">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-[760] text-white">{label}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] font-[620] text-white/80">
                <Icon icon={good ? CheckmarkCircle02Icon : Cancel01Icon} size={13} stroke={2.2} color={good ? '#5fe08a' : '#ff8a8a'} />
                {mode === 'trial' ? `Real-robot trial, Figure 7` : `${mode === 'h0' ? 'Base Harness H₀' : 'Evolved Harness H(4)'}, Figure ${task.figs[mode]}`}
              </p>
            </div>
            <button type="button" onClick={() => setPlaying((v) => !v)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/90 text-[#12141c] shadow" aria-label={playing ? 'Pause' : 'Play'}>
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
                    transition={{ duration: running ? step / 1000 : 0, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* what is playing */}
      <div className="space-y-2 px-3 pb-1 pt-3">
        <Seg
          id={`pr-mode-${task.id}`}
          label="Which run"
          full
          small
          value={mode}
          onChange={setMode}
          options={[
            { value: 'trial', label: 'Robot trial' },
            { value: 'h0', label: 'Base H₀' },
            { value: 'h4', label: 'Evolved H(4)' },
          ]}
        />
        {mode !== 'trial' && (
          <div className="flex gap-2">
            <Seg
              small
              id={`pr-real-${task.id}`}
              label="Real robot or simulation"
              value={real ? 'real' : 'sim'}
              onChange={(v) => setReal(v === 'real')}
              options={[
                { value: 'real', label: 'Real' },
                { value: 'sim', label: 'Sim.' },
              ]}
            />
            <Seg small id={`pr-cam-${task.id}`} label="Camera" value={cam} onChange={setCam} options={task.cams.map((c) => ({ value: c.id as string, label: c.label.replace(' camera', '') }))} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PRobots() {
  const { t, theme } = useTokens();
  const [id, setId] = useState<T['id']>('soon');
  const [mode, setMode] = useState<Mode>('trial');
  const task = TASKS.find((x) => x.id === id)!;
  const b = benchById[task.bench];
  const f5 = FINDINGS[4];
  const teal = theme === 'dark' ? ['#2b5f5a', '#2f857d', '#22a597', '#5fd1c4'] : ['#a7dcd6', '#62c1b8', '#25a397', '#0e8f86'];

  return (
    <section id="real-world" className="scroll-mt-16 pt-14">
      <Opener kicker="Embodied Real2Sim2Real" title="From simulated worlds to two real robots">
        <p className="p-lede">Skills prepared in a simulation of each real site are frozen; every Harness, from H₀ to H(4), is then tested in simulation and on the real robot.</p>
      </Opener>

      <More lines={0} lineHeight={1} label="How the skills are prepared" className="mt-2 px-5">
        <p className="pt-1 text-[13.5px] leading-[1.6] text-ink-2">
          Each robot task is mapped by its capability requirements to node d → a and uses the Harness evolved there. Holding the Harness fixed, five trial-and-error episodes in the simulator rebuilt from the site are summarized into skills, frozen for the formal simulation and real-robot tests; the preparation episodes are not counted.
        </p>
      </More>

      <div className="mt-5 px-4">
        <Seg
          id="robot"
          label="Robot"
          full
          value={id}
          onChange={(v) => {
            setId(v);
            setMode('trial');
          }}
          options={TASKS.map((x) => ({ value: x.id, label: `${x.name}, ${x.robot}` }))}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={id} className="mx-3 mt-3 overflow-hidden rounded-[24px] border border-rule bg-surface shadow-[0_30px_60px_-44px_rgba(20,24,40,0.7)]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
          <Replay task={task} mode={mode} setMode={setMode} />
          <div className="px-4 pb-4 pt-3">
            <div className="mx-auto w-full max-w-[250px]">
              <Towers sim={b.scores.it as unknown as number[]} real={b.robot!.it as unknown as number[]} delay={0.1} />
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10.5px] font-[650] text-ink-3">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-3.5 rounded-[3px]" style={{ background: theme === 'dark' ? '#4a5268' : '#b8bcc8' }} /> H₀
                </span>
                {[1, 2, 3, 4].map((k) => (
                  <span key={k} className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-3.5 rounded-[3px]" style={{ background: `linear-gradient(90deg, ${teal[k - 1]} 50%, ${t.iters[k]} 50%)` }} />
                    it {k}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-center text-[11px] text-ink-3">Table 6, success rate (%) with prepared skills</p>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={mode}
                className="mt-4 flex items-start gap-2.5 rounded-[12px] px-3 py-2.5 text-[13.5px] leading-snug text-ink-2"
                style={{ background: mode === 'h0' ? t.paper2 : mode === 'h4' ? `${t.good}14` : t.paper2 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                {mode !== 'trial' && <Icon icon={mode === 'h0' ? Cancel01Icon : CheckmarkCircle02Icon} size={16} stroke={2.2} color={mode === 'h0' ? t.bad : t.good} className="mt-0.5 shrink-0" />}
                <span>
                  <b className="font-[750] text-ink">{mode === 'trial' ? 'The task' : mode === 'h0' ? 'Base Harness H₀' : 'Evolved Harness H(4)'}</b> {mode === 'trial' ? task.goal : mode === 'h0' ? task.h0 : task.h4}
                </span>
              </motion.p>
            </AnimatePresence>
            <div className="mt-2 flex flex-wrap gap-2">
              <PaperFigure fig={figOf(task.figs.h0)} label={`All frames, H₀ (Fig. ${task.figs.h0})`} />
              <PaperFigure fig={figOf(task.figs.h4)} label={`All frames, H(4) (Fig. ${task.figs.h4})`} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 px-5">
        <p className="text-[12.5px] font-[700] text-accent">Finding {f5.n}</p>
        <p className="mt-1 text-[17px] font-[760] leading-snug text-ink">{f5.title}</p>
        <More lines={0} lineHeight={1} label="What the paper says" className="mt-1">
          <p className="pt-1 text-[13.5px] leading-[1.6] text-ink-2">
            {f5.text} Recorded deployments differ in message handling, interfaces, guidance and acceptance rules, so these comparisons evaluate complete Harness–skill configurations and do not isolate module evolution from skill preparation.
          </p>
        </More>
        <div className="mt-3">
          <PaperFigure fig={PAPER_FIGS.embodied} />
        </div>
      </div>
    </section>
  );
}
