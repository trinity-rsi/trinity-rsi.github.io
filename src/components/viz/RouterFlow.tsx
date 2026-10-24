import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { CAP_NODES, DOMAINS, TRAIN_SETTINGS, UNSEEN_SETTINGS, capById, nodeById, pathLabel, type NodeId, type Setting } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { useLoopClock, seg, easeOut, easeOutBack } from '@/lib/anim';
import { CheckmarkBadge01Icon, Database02Icon, DatabaseAddIcon, FileSearchIcon, Target02Icon } from '@hugeicons/core-free-icons';

/**
 * The Router's context–action–feedback loop on one unseen task (Section 3.6, Figure 2 bottom):
 *   ① read the public task information → ② retrieve verified experience → ③ commit one Harness
 *   → ④ execute and verify → ⑤ append the verified record to memory.
 * Illustrative walk-through: the committed Harness is the branch the task's capabilities point
 * to (Figure 9); retrieved records are training tasks on the same branch; scores are Table 7,
 * whose H(4) column is played with the Harness the Router selects.
 */
const STEPS = [
  { k: '1', title: 'Read the task', icon: FileSearchIcon },
  { k: '2', title: 'Experience memory', icon: Database02Icon },
  { k: '3', title: 'Commit one Harness', icon: Target02Icon },
  { k: '4', title: 'Execute & verify', icon: CheckmarkBadge01Icon },
  { k: '5', title: 'Append experience', icon: DatabaseAddIcon },
];
const T = [0, 0.16, 0.36, 0.6, 0.8, 1];
type Nid = Exclude<NodeId, 'root'>;

export default function RouterFlow() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const tasks = UNSEEN_SETTINGS;
  const [key, setKey] = useState('nethack');
  const [p, setP] = useLoopClock(10, near && !reduce, reduce ? 0.99 : 0);
  useEffect(() => setP(0), [key, setP]);
  const task = tasks.find((x) => x.key === key)!;
  const node = task.bench.node as Nid;
  const step = T.findIndex((v, i) => p >= v && p < T[i + 1]);

  const retrieved = useMemo(() => {
    const same = TRAIN_SETTINGS.filter((x) => x.bench.node === node);
    const near = TRAIN_SETTINGS.filter((x) => x.bench.node !== node && nodeById[x.bench.node].path[0] === nodeById[node].path[0]);
    return [...same, ...near].slice(0, 4);
  }, [node]);

  const k = (i: number) => easeOut(seg(p, T[i], T[i] + 0.08));
  const commit = easeOutBack(seg(p, T[2] + 0.12, T[2] + 0.2));
  const bar = easeOut(seg(p, T[3] + 0.02, T[3] + 0.16));
  const drop = easeOut(seg(p, T[4] + 0.02, T[4] + 0.12));
  const h0 = task.scores.it[0];
  const h4 = task.scores.it[4];

  return (
    <div ref={ref} className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      {/* unseen tasks */}
      <div className="rounded-[22px] border border-rule bg-surface p-3">
        <p className="px-1.5 pb-2 text-[12px] font-[700] uppercase tracking-[0.1em] text-ink-3">Unseen tasks · pick one</p>
        <div className="flex max-h-[520px] flex-wrap gap-1.5 overflow-y-auto xl:flex-col xl:flex-nowrap">
          {DOMAINS.map((d) => (
            <div key={d.id} className="contents">
              {tasks
                .filter((x) => x.bench.domain === d.id)
                .map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    onClick={() => setKey(x.key)}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-[620] transition-colors ${x.key === key ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-surface-2'}`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="truncate">{x.label}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="figure-frame p-5">
        {/* the loop */}
        <ol className="grid grid-cols-5 gap-2">
          {STEPS.map((s, i) => {
            const on = i === step;
            const done = i < step;
            return (
              <li key={s.k} className={`relative flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-500 ${on ? 'border-accent/50 bg-accent-wash' : 'border-rule bg-surface'}`}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors duration-500" style={{ background: on || done ? t.accent : t.paper2, color: on || done ? '#fff' : t.ink3 }}>
                  <Icon icon={s.icon} size={14} />
                </span>
                <span className="hidden text-[12.5px] font-[700] leading-tight text-ink md:block">{s.title}</span>
                {on && <span className="absolute inset-x-2 bottom-0 h-[2px] origin-left rounded-full bg-accent" style={{ transform: `scaleX(${seg(p, T[i], T[i + 1])})` }} />}
              </li>
            );
          })}
        </ol>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* ① the task as the Router sees it */}
          <div style={{ opacity: Math.max(0.35, k(0)) }}>
            <div className="overflow-hidden rounded-2xl border border-rule bg-surface">
              <div className="relative aspect-[16/10] bg-paper-2">
                <AnimatePresence mode="wait">
                  <motion.img key={task.bench.id} src={e1Frame(task.bench.id, 'start')} alt={`${task.bench.name}: initial observation`} className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
                </AnimatePresence>
                <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11.5px] font-[700] text-white">initial observation</span>
              </div>
              <div className="space-y-1 p-3.5 text-[13px]">
                <p className="text-[16px] font-[760] text-ink">{task.label}</p>
                <p className="text-ink-3">Public goal, metadata and images only · {task.bench.measure}</p>
                <p className="text-ink-3">Its capability labels are hidden from the Router.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* ② retrieved experience */}
            <div style={{ opacity: step >= 1 ? 1 : 0.35 }}>
              <p className="mb-2 text-[12px] font-[700] text-ink-3">Retrieved verified records (cosine ≥ 0.5, at most 10)</p>
              <ul className="grid grid-cols-2 gap-2">
                {retrieved.map((r: Setting, i) => {
                  const kk = easeOut(seg(p, T[1] + 0.02 + i * 0.03, T[1] + 0.1 + i * 0.03));
                  return (
                    <li key={r.key} className="rounded-xl border border-rule bg-surface px-3 py-2" style={{ opacity: Math.max(0.2, kk), transform: `translateX(${(1 - kk) * 14}px)` }}>
                      <p className="truncate text-[12.5px] font-[700] text-ink">{r.label}</p>
                      <p className="text-[11.5px] text-ink-3">
                        ran {pathLabel(r.bench.node)} · {r.scores.it[4]} vs H₀ {r.scores.it[0]}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ③ candidates, one committed */}
            <div style={{ opacity: step >= 2 ? 1 : 0.35 }}>
              <p className="mb-2 text-[12px] font-[700] text-ink-3">Candidate Harnesses on the tree · commit one before execution</p>
              <div className="flex flex-wrap gap-1.5">
                {['root', ...CAP_NODES.map((n) => n.id)].map((id) => {
                  const chosen = id === node && step >= 2;
                  return (
                    <span
                      key={id}
                      className="relative rounded-lg border px-2 py-1 text-[12px] font-[720] transition-colors duration-300"
                      style={{
                        borderColor: chosen ? t.accent : t.rule,
                        background: chosen ? t.accent : t.surface,
                        color: chosen ? '#fff' : t.ink2,
                        transform: chosen ? `scale(${1 + 0.12 * commit})` : undefined,
                      }}
                    >
                      {id === 'root' ? 'H₀' : pathLabel(id as Nid)}
                    </span>
                  );
                })}
              </div>
              <AnimatePresence>
                {step >= 2 && (
                  <motion.p key={`why-${key}`} className="mt-2 rounded-lg bg-accent-wash px-3 py-2 text-[12.5px] leading-snug text-ink-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <span className="font-[700] text-accent-ink">Rationale:</span> the task needs{' '}
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
            </div>

            {/* ④ verified outcome */}
            <div style={{ opacity: step >= 3 ? 1 : 0.35 }}>
              <p className="mb-2 text-[12px] font-[700] text-ink-3">Verified outcome on {task.label} (Table 7)</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Base Harness H₀', v: h0, c: t.iters[0] },
                  { label: 'Routed Harness, H(4)', v: h4, c: t.accent },
                ].map((r) => (
                  <div key={r.label} className="grid grid-cols-[150px_minmax(0,1fr)_40px] items-center gap-2 text-[12.5px]">
                    <span className="text-ink-2">{r.label}</span>
                    <span className="h-2.5 rounded-full bg-paper-2">
                      <span className="block h-full rounded-full" style={{ width: `${r.v * (r.label.startsWith('Base') ? 1 : bar)}%`, background: r.c }} />
                    </span>
                    <span className="tabular text-right font-[720] text-ink">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ⑤ memory grows */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-rule-2 px-3 py-2 text-[12.5px] text-ink-2" style={{ opacity: step >= 4 ? 1 : 0.35 }}>
              <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ background: t.explorer, transform: `translateY(${(1 - drop) * -10}px)` }}>
                <Icon icon={DatabaseAddIcon} size={14} />
              </span>
              Verified record ({task.label}, {pathLabel(node)}, outcome, cost) appended to a 20,000-record FIFO memory, for later tasks only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
