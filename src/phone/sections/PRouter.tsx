import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { CheckmarkBadge01Icon, Database02Icon, DatabaseAddIcon, FileSearchIcon, PauseIcon, PlayIcon, RepeatIcon, Target02Icon } from '@hugeicons/core-free-icons';
import { CAP_NODES, DOMAINS, TRAIN_SETTINGS, UNSEEN_SETTINGS, capById, nodeById, pathLabel, type NodeId } from '@/data/tree';
import { FINDINGS, TABLE4 } from '@/data/results';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { useLoopClock, seg, easeOut, easeOutBack } from '@/lib/anim';
import { Opener } from '../ui/Opener';
import More from '../ui/More';
import PBars from '../ui/PBars';

/**
 * The Router on a phone (Section 3.6): one unseen task goes through the context–action–feedback
 * loop, down a rail of five steps. Illustrative walk-through: the committed Harness is the branch
 * the task's capabilities point to (Figure 10), the retrieved records are training tasks on the
 * same branch, the scores are Table 8. Then Table 4 and Finding 3.
 */
type Nid = Exclude<NodeId, 'root'>;
const STEPS = [
  { title: 'Read the task', icon: FileSearchIcon },
  { title: 'Retrieve experience', icon: Database02Icon },
  { title: 'Commit one Harness', icon: Target02Icon },
  { title: 'Execute and verify', icon: CheckmarkBadge01Icon },
  { title: 'Append experience', icon: DatabaseAddIcon },
];
const T = [0, 0.16, 0.36, 0.6, 0.8, 1];

function Walkthrough() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const tasks = UNSEEN_SETTINGS;
  const [key, setKey] = useState('nethack');
  const [paused, setPaused] = useState(false);
  const [p, setP] = useLoopClock(10, near && !reduce && !paused, reduce ? 0.99 : 0);
  useEffect(() => setP(0), [key, setP]);
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = row.current;
    const item = list?.querySelector<HTMLElement>(`[data-key="${key}"]`);
    if (list && item) list.scrollTo({ left: Math.max(0, item.offsetLeft - 20), behavior: 'auto' });
  }, [key]);
  const task = tasks.find((x) => x.key === key)!;
  const node = task.bench.node as Nid;
  const step = Math.max(0, T.findIndex((v, i) => p >= v && p < T[i + 1]));
  const retrieved = useMemo(() => {
    const same = TRAIN_SETTINGS.filter((x) => x.bench.node === node);
    const near2 = TRAIN_SETTINGS.filter((x) => x.bench.node !== node && nodeById[x.bench.node].path[0] === nodeById[node].path[0]);
    return [...same, ...near2].slice(0, 4);
  }, [node]);
  const commit = easeOutBack(seg(p, T[2] + 0.12, T[2] + 0.2));
  const bar = easeOut(seg(p, T[3] + 0.02, T[3] + 0.16));
  const drop = easeOut(seg(p, T[4] + 0.02, T[4] + 0.12));
  const jump = (i: number) => setP(T[i] + 0.002);
  const ordered = DOMAINS.flatMap((d) => tasks.filter((x) => x.bench.domain === d.id));

  const block = (i: number, children: React.ReactNode) => {
    const on = i === step;
    const done = i < step;
    const S = STEPS[i];
    return (
      <li className="relative pb-6 pl-12 last:pb-0">
        {i < STEPS.length - 1 && <span className="absolute bottom-0 left-[17px] top-10 w-[2px] rounded-full" style={{ background: done ? t.accent : t.rule }} aria-hidden />}
        <button
          type="button"
          onClick={() => jump(i)}
          className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full transition-colors duration-500"
          style={{ background: on || done ? t.accent : t.paper2, color: on || done ? '#fff' : t.ink3, boxShadow: on ? `0 0 0 5px ${t.accent}22` : undefined }}
          aria-label={`Step ${i + 1}: ${S.title}`}
        >
          <Icon icon={S.icon} size={16} stroke={1.9} />
        </button>
        <p className="flex h-9 items-center text-[15.5px] font-[740] text-ink">{S.title}</p>
        <div className="mt-1 transition-opacity duration-500" style={{ opacity: i <= step ? 1 : 0.32 }}>
          {children}
        </div>
      </li>
    );
  };

  return (
    <div ref={ref}>
      {/* unseen tasks to route */}
      <div ref={row} className="p-noscroll flex gap-1.5 overflow-x-auto px-5 pb-1">
        {ordered.map((x) => (
          <button
            key={x.key}
            data-key={x.key}
            type="button"
            onClick={() => setKey(x.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-[650] transition-colors ${x.key === key ? 'border-ink bg-ink text-paper' : 'border-rule bg-surface text-ink-2'}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: t.domains[x.bench.domain] }} />
            {x.label}
          </button>
        ))}
      </div>

      <div className="p-tray mt-3 px-4 pb-5 pt-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[12.5px] font-[620] text-ink-3">
            <span className="relative flex h-2 w-2" aria-hidden>
              {!paused && !reduce && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />}
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: paused || reduce ? t.ink3 : t.accent }} />
            </span>
            {reduce || paused ? 'Tap a step to see it' : 'Playing the loop'}
          </p>
          {!reduce && (
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPaused((v) => !v)} className="p-press grid h-8 w-8 place-items-center rounded-full border border-rule bg-surface text-ink-2" aria-label={paused ? 'Play' : 'Pause'}>
                <Icon icon={paused ? PlayIcon : PauseIcon} size={14} stroke={2.2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setP(0);
                  setPaused(false);
                }}
                className="p-press grid h-8 w-8 place-items-center rounded-full border border-rule bg-surface text-ink-2"
                aria-label="Replay"
              >
                <Icon icon={RepeatIcon} size={14} stroke={2.2} />
              </button>
            </div>
          )}
        </div>

        <ol>
          {block(
            0,
            <div className="overflow-hidden rounded-[16px] border border-rule bg-surface">
              <div className="relative aspect-[16/10] bg-paper-2">
                <AnimatePresence mode="wait">
                  <motion.img key={task.bench.id} src={e1Frame(task.bench.id, 'start')} alt={`${task.bench.name}: initial observation`} className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} draggable={false} />
                </AnimatePresence>
                <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-[700] text-white">initial observation</span>
              </div>
              <div className="space-y-0.5 p-3 text-[12.5px] leading-snug">
                <p className="text-[15px] font-[760] text-ink">{task.label}</p>
                <p className="text-ink-3">Public goal, metadata and images only; {task.bench.measure}.</p>
                <p className="text-ink-3">Its capability labels are hidden from the Router.</p>
              </div>
            </div>
          )}
          {block(
            1,
            <>
              <p className="mb-2 text-[12px] text-ink-3">Verified records retrieved (cosine at least 0.5, at most 10)</p>
              <ul className="grid grid-cols-2 gap-2">
                {retrieved.map((r, i) => {
                  const k = easeOut(seg(p, T[1] + 0.02 + i * 0.03, T[1] + 0.1 + i * 0.03));
                  return (
                    <li key={r.key} className="rounded-[12px] border border-rule bg-surface px-2.5 py-2" style={{ opacity: step >= 1 ? Math.max(0.25, k) : 1, transform: `translateY(${step === 1 ? (1 - k) * 8 : 0}px)` }}>
                      <p className="truncate text-[12.5px] font-[720] text-ink">{r.label}</p>
                      <p className="tabular text-[11px] text-ink-3">
                        ran {pathLabel(r.bench.node)}: {r.scores.it[4]} vs H₀ {r.scores.it[0]}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {block(
            2,
            <>
              <p className="mb-2 text-[12px] text-ink-3">Candidate Harnesses on the tree; one is committed before execution</p>
              <div className="flex flex-wrap gap-1.5">
                {['root', ...CAP_NODES.map((n) => n.id)].map((id) => {
                  const chosen = id === node && step >= 2;
                  return (
                    <span
                      key={id}
                      className="rounded-lg border px-2 py-1 text-[12px] font-[720] transition-colors duration-300"
                      style={{ borderColor: chosen ? t.accent : t.rule, background: chosen ? t.accent : t.surface, color: chosen ? '#fff' : t.ink2, transform: chosen ? `scale(${1 + 0.12 * commit})` : undefined }}
                    >
                      {id === 'root' ? 'H₀' : pathLabel(id as Nid)}
                    </span>
                  );
                })}
              </div>
              <AnimatePresence>
                {step >= 2 && (
                  <motion.p key={`why-${key}`} className="mt-2 rounded-[12px] bg-accent-wash px-3 py-2 text-[12.5px] leading-snug text-ink-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <span className="font-[720] text-accent-ink">Rationale:</span> the task needs{' '}
                    {nodeById[node].path.map((c, i) => (
                      <span key={c}>
                        {i ? ' then ' : ''}
                        <span className="font-[700] text-ink">{capById[c].name.toLowerCase()}</span>
                      </span>
                    ))}
                    , so it commits “{nodeById[node].name}”.
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          )}
          {block(
            3,
            <>
              <p className="mb-2 text-[12px] text-ink-3">Verified outcome on {task.label} (Table 8)</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Base Harness H₀', v: task.scores.it[0], c: t.iters[0], k: 1 },
                  { label: 'Routed Harness H(4)', v: task.scores.it[4], c: t.accent, k: bar },
                ].map((r) => (
                  <div key={r.label} className="grid grid-cols-[124px_minmax(0,1fr)_38px] items-center gap-2 text-[12.5px]">
                    <span className="text-ink-2">{r.label}</span>
                    <span className="h-2.5 rounded-full bg-paper-2">
                      <span className="block h-full rounded-full" style={{ width: `${r.v * (step >= 3 ? r.k : r.label.startsWith('Base') ? 1 : 0)}%`, background: r.c }} />
                    </span>
                    <span className="tabular text-right font-[740] text-ink">{r.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {block(
            4,
            <div className="flex items-start gap-3 rounded-[12px] border border-dashed border-rule-2 px-3 py-2.5 text-[12.5px] leading-snug text-ink-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: t.explorer, transform: `translateY(${step >= 4 ? (1 - drop) * -10 : 0}px)` }}>
                <Icon icon={DatabaseAddIcon} size={14} />
              </span>
              The verified record ({task.label}, {pathLabel(node)}, outcome, cost) joins a 20,000-record FIFO memory, for later tasks only.
            </div>
          )}
        </ol>
        <p className="mt-4 text-[11.5px] leading-snug text-ink-3">Illustrative walk-through: the committed branch is the one Figure 10 assigns; scores are Table 8.</p>
      </div>
    </div>
  );
}

export default function PRouter() {
  const f3 = FINDINGS[2];
  return (
    <section id="router" className="scroll-mt-16 pt-20">
      <Opener kicker="Deployment, capability-aware routing" stage="→" title="Routing a new task to the right Harness">
        <More lines={5}>
          <p className="p-lede">
            The evolved Harnesses specialize in different capabilities, so deployment needs a task-dependent choice. The Router follows a context–action–feedback loop: public task information, retrieved verified experience and observed performance–cost summaries guide the choice of one Harness from the tree.
          </p>
        </More>
      </Opener>

      <div className="mt-8">
        <h3 className="p-subtitle px-5">Try it: route an unseen task</h3>
        <div className="mt-4">
          <Walkthrough />
        </div>
      </div>

      <div className="mt-12 px-5">
        <p className="text-[12.5px] font-[700] text-accent">Table 4, Finding {f3.n}</p>
        <h3 className="p-subtitle mt-1">{f3.title}</h3>
        <p className="mt-2 text-[13.5px] leading-snug text-ink-2">Full self-routing scores 71.27 on Train and 60.96 on Unseen, against Oracle’s 73.16 and 63.61, on the iteration-4 tree.</p>
        <div className="mt-4">
          <PBars
            id="table4"
            range={[30, 80]}
            costRange={[450, 610]}
            rows={TABLE4.map((r, i) => ({
              key: `${r.name}-${i}`,
              name: r.name,
              sub: r.cap === null ? (r.oracle ? 'best compatible Harness, chosen retrospectively' : 'one candidate per task at random') : `${r.cap ? '+ capability definitions' : 'task information and interfaces only'}${r.mem ? ' + retrieved experience' : ''}`,
              score: { train: r.train, unseen: r.unseen },
              cost: { train: r.trainTok, unseen: r.unseenTok },
              ours: r.ours,
              muted: r.random,
            }))}
          />
        </div>
        <More lines={0} lineHeight={1} label="What the Finding says" className="mt-2">
          <p className="pt-1 text-[13.5px] leading-[1.6] text-ink-2">{f3.text}</p>
        </More>
      </div>
    </section>
  );
}
