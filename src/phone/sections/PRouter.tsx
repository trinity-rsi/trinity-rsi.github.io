import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { CheckmarkBadge01Icon, Database02Icon, DatabaseAddIcon, FileSearchIcon, PauseIcon, PlayIcon, RepeatIcon, Target02Icon } from '@hugeicons/core-free-icons';
import { CAP_NODES, DOMAINS, TRAIN_SETTINGS, UNSEEN_SETTINGS, capById, domainById, nodeById, pathLabel, type NodeId } from '@/data/tree';
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
 * loop, five steps on a rail, the step in front as one card. Illustrative walk-through: the committed Harness is the branch
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

  // what each step shows; at rest (live = false) it is drawn for measuring the card
  const body = (i: number, live: boolean) => {
    if (i === 0)
      return (
        <p className="text-[13px] leading-snug text-ink-2">
          Public goal, metadata and images only; {task.bench.measure}. Its capability labels are hidden from the Router.
        </p>
      );
    if (i === 1)
      return (
        <>
          <p className="mb-2 text-[12px] text-ink-3">Verified records retrieved (cosine at least 0.5, at most 10)</p>
          <ul className="grid grid-cols-2 gap-2">
            {retrieved.map((r, k) => {
              const v = live ? easeOut(seg(p, T[1] + 0.02 + k * 0.03, T[1] + 0.1 + k * 0.03)) : 1;
              return (
                <li key={r.key} className="rounded-[12px] border border-rule bg-surface px-2.5 py-2" style={{ opacity: Math.max(0.25, v), transform: `translateY(${(1 - v) * 8}px)` }}>
                  <p className="truncate text-[12.5px] font-[720] text-ink">{r.label}</p>
                  <p className="tabular text-[11px] text-ink-3">
                    ran {pathLabel(r.bench.node)}: {r.scores.it[4]} vs H₀ {r.scores.it[0]}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      );
    if (i === 2)
      return (
        <>
          <p className="mb-2 text-[12px] text-ink-3">Candidate Harnesses on the tree; one is committed before execution</p>
          <div className="flex flex-wrap gap-1.5">
            {['root', ...CAP_NODES.map((n) => n.id)].map((id) => {
              const chosen = id === node;
              return (
                <span
                  key={id}
                  className="rounded-lg border px-2 py-1 text-[12px] font-[720] transition-colors duration-300"
                  style={{ borderColor: chosen ? t.accent : t.rule, background: chosen ? t.accent : t.surface, color: chosen ? '#fff' : t.ink2, transform: chosen && live ? `scale(${1 + 0.12 * commit})` : undefined }}
                >
                  {id === 'root' ? 'H₀' : pathLabel(id as Nid)}
                </span>
              );
            })}
          </div>
          <p className="mt-2 rounded-[12px] bg-accent-wash px-3 py-2 text-[12.5px] leading-snug text-ink-2" style={{ opacity: live ? Math.max(0.2, commit) : 1 }}>
            <span className="font-[720] text-accent-ink">Rationale:</span> the task needs{' '}
            {nodeById[node].path.map((c, k) => (
              <span key={c}>
                {k ? ' then ' : ''}
                <span className="font-[700] text-ink">{capById[c].name.toLowerCase()}</span>
              </span>
            ))}
            , so it commits “{nodeById[node].name}”.
          </p>
        </>
      );
    if (i === 3)
      return (
        <>
          <p className="mb-2 text-[12px] text-ink-3">Verified outcome on {task.label} (Table 8)</p>
          <div className="space-y-1.5">
            {[
              { label: 'Base Harness H₀', v: task.scores.it[0], c: t.iters[0], k: 1 },
              { label: 'Routed Harness H(4)', v: task.scores.it[4], c: t.accent, k: live ? bar : 1 },
            ].map((r) => (
              <div key={r.label} className="grid grid-cols-[124px_minmax(0,1fr)_38px] items-center gap-2 text-[12.5px]">
                <span className="text-ink-2">{r.label}</span>
                <span className="h-2.5 rounded-full bg-paper-2">
                  <span className="block h-full rounded-full" style={{ width: `${r.v * r.k}%`, background: r.c }} />
                </span>
                <span className="tabular text-right font-[740] text-ink">{r.v}</span>
              </div>
            ))}
          </div>
        </>
      );
    return (
      <div className="flex items-start gap-3 rounded-[12px] border border-dashed border-rule-2 px-3 py-2.5 text-[12.5px] leading-snug text-ink-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: t.explorer, transform: `translateY(${live ? (1 - drop) * -10 : 0}px)` }}>
          <Icon icon={DatabaseAddIcon} size={14} />
        </span>
        The verified record ({task.label}, {pathLabel(node)}, outcome, cost) joins a 20,000-record FIFO memory, for later tasks only.
      </div>
    );
  };
  const card = (i: number, live: boolean) => (
    <>
      <p className="text-[12px] font-[700] text-ink-3">
        Step {i + 1} of {STEPS.length}
      </p>
      <p className="mb-2.5 mt-0.5 text-[16px] font-[760] leading-tight tracking-[-0.01em] text-ink" style={{ fontStretch: '106%' }}>
        {STEPS[i].title}
      </p>
      {body(i, live)}
    </>
  );

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

      <div className="p-tray mt-3 px-4 pb-4 pt-4">
        {/* the task being routed */}
        <div className="flex items-center gap-3">
          <div className="relative aspect-[16/10] w-[44%] shrink-0 overflow-hidden rounded-[14px] bg-paper-2">
            <AnimatePresence mode="wait">
              <motion.img key={task.bench.id} src={e1Frame(task.bench.id, 'start')} alt={`${task.bench.name}: initial observation`} className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} draggable={false} />
            </AnimatePresence>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-[700] text-ink-3">Unseen task</p>
            <p className="mt-0.5 text-[17px] font-[760] leading-tight tracking-[-0.01em] text-ink" style={{ fontStretch: '106%' }}>
              {task.label}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.domains[task.bench.domain] }} />
              {domainById[task.bench.domain].short}
            </p>
            {!reduce && (
              <div className="mt-2 flex items-center gap-1.5">
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
        </div>

        {/* the loop's five steps */}
        <div className="relative mt-5 flex justify-between px-1">
          <span className="absolute left-[22px] right-[22px] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-rule" aria-hidden>
            <span className="block h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </span>
          {STEPS.map((S, i) => {
            const on = i === step;
            const done = i < step;
            return (
              <button
                key={S.title}
                type="button"
                onClick={() => jump(i)}
                className="relative z-10 grid h-9 w-9 place-items-center rounded-full transition-colors duration-500"
                style={{ background: on || done ? t.accent : t.paper2, color: on || done ? '#fff' : t.ink3, boxShadow: on ? `0 0 0 5px ${t.accent}22` : `0 0 0 3px ${t.surface}` }}
                aria-label={`Step ${i + 1}: ${S.title}`}
                aria-current={on ? 'step' : undefined}
              >
                <Icon icon={S.icon} size={16} stroke={1.9} />
              </button>
            );
          })}
        </div>

        {/* the step in front; every step sits unseen in the same cell, so the card keeps one height */}
        <div className="mt-4 grid rounded-[18px] border border-rule bg-surface">
          {STEPS.map((S, i) => (
            <div key={S.title} className="invisible p-3.5 [grid-area:1/1]" aria-hidden>
              {card(i, false)}
            </div>
          ))}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${key}-${step}`} className="p-3.5 [grid-area:1/1]" initial={{ opacity: 0, x: reduce ? 0 : 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -10 }} transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}>
              {card(step, true)}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-3 text-[11.5px] leading-snug text-ink-3">{reduce || paused ? 'Tap a step to see it. ' : ''}Illustrative walk-through: the committed branch is the one Figure 10 assigns; scores are Table 8.</p>
      </div>
    </div>
  );
}

export default function PRouter() {
  const f3 = FINDINGS[2];
  return (
    <section id="router" className="scroll-mt-16 pt-14">
      <Opener kicker="Deployment, capability-aware routing" stage="→" title="Routing a new task to the right Harness">
        <More lines={3}>
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

      <div className="mt-10 px-5">
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
