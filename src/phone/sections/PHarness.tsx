import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import PaperFigure from '@/components/ui/PaperFigure';
import { Cancel01Icon, LockIcon, PauseIcon, PlayIcon, RepeatIcon } from '@hugeicons/core-free-icons';
import { CAP_NODES, benchesOfNode, moduleById, nodeById, nodeLineage, type NodeId } from '@/data/tree';
import { CREATOR_LIB, LIB_FAMILIES, MEANS, type LibModule } from '@/data/results';
import { PAPER_FIGS, nodeLevel } from '@/data/media';
import { BenchBars, ITER_T, ORDER, TOTAL, at, eventDone, localState, undated } from '@/components/viz/HarnessTreeViz';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { easeInOut, easeOutBack, seg, useLoopClock } from '@/lib/anim';
import { Opener } from '../ui/Opener';

/**
 * Stage 3 on a phone. (a) Explorer's Harness tree over iterations 1–4, drawn top-down like the
 * capability tree: one row per node, its module bricks to the right (inherited ones outlined),
 * the node being trained lit, and the node in focus spelled out underneath (Figure 11, Appendix
 * E.2, Table 8). (b) Creator's pass over the same tree and the merge into the next Base Harness
 * (Appendix C.2, Figure 12).
 */
type Nid = Exclude<NodeId, 'root'>;
const ROWS = CAP_NODES.map((n) => n.id as Nid);
const RH = 34;
const ROOT_H = 26;
const TOP = ROOT_H + 12;
const TILE = 15;
const DEPTH_X = (d: number) => 16 + (d - 1) * 15;
const LABEL_W = DEPTH_X(3) + 3 * (TILE + 2) + 8;
const STATUS_W = 30;
const rowY = (i: number) => TOP + i * RH;

type Plate = { id: string; inherited: boolean; rev: number; fresh: number }[];

function ModBrick({ id, inherited, rev, fresh, isNew, w }: { id: string; inherited: boolean; rev: number; fresh: number; isNew: boolean; w: number }) {
  const { t } = useTokens();
  const c = t.caps[moduleById[id].cap];
  const moving = fresh > 0 && fresh < 1;
  const drop = moving && isNew ? -(1 - fresh) * (1 - fresh) * 26 : 0;
  const glint = moving && !isNew ? Math.sin(fresh * Math.PI) : 0;
  const studW = Math.max(5, w * 0.22);
  return (
    <span className="relative block shrink-0" style={{ width: w, height: 23, transform: `translateY(${drop.toFixed(1)}px)`, opacity: moving && fresh < 0.05 ? 0 : 1 }}>
      {[0.27, 0.73].map((u) => (
        <span key={u} className="absolute top-0 h-[5px] rounded-t-[2px]" style={{ left: w * u - studW / 2, width: studW, background: inherited ? t.surface : c, border: inherited ? `1.2px solid ${c}` : undefined, borderBottom: 'none' }} />
      ))}
      <span
        className="absolute inset-x-0 bottom-0 top-[4px] grid place-items-center rounded-[4px] text-[9.5px] font-[820] leading-none"
        style={{ background: inherited ? t.surface : c, border: inherited ? `1.4px solid ${c}` : undefined, color: inherited ? c : '#ffffff', boxShadow: glint > 0.01 ? `0 0 0 ${(1.5 + 3 * glint).toFixed(1)}px ${c}66` : undefined }}
      >
        {!inherited && <span className="absolute inset-x-0 top-0 h-[40%] rounded-t-[4px] bg-white/20" aria-hidden />}
        <span className="relative">{id}</span>
      </span>
      {rev > 0 && !inherited && <span className="absolute -right-1.5 -top-1 grid h-[13px] min-w-[13px] place-items-center rounded-full bg-ink px-[2px] text-[7.5px] font-[820] text-paper ring-2 ring-surface">v{rev + 1}</span>}
    </span>
  );
}

function HarnessTree() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(358);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pick, setPick] = useState<Nid | null>(null);
  const timeRef = useRef(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const running = playing && near && !reduce && time < TOTAL;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      timeRef.current = Math.min(TOTAL, timeRef.current + dt);
      setTime(timeRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  useEffect(() => {
    if (reduce) {
      timeRef.current = TOTAL;
      setTime(TOTAL);
    }
  }, [reduce]);
  // the levels of every node, decoded ahead so the card never shows an empty frame
  useEffect(() => {
    if (!near) return;
    ROWS.forEach((n) =>
      [1, 2, 3, 4].forEach((it) => {
        const im = new Image();
        im.src = nodeLevel(n, it);
        im.decode?.().catch(() => undefined);
      })
    );
  }, [near]);
  const seek = (v: number) => {
    timeRef.current = Math.max(0, Math.min(TOTAL, v));
    setTime(timeRef.current);
  };

  const cur = at(time);
  const visiting: Nid | null = cur.k >= 0 && cur.k < ORDER.length && !cur.done ? ORDER[cur.k] : null;
  const focus: Nid = pick ?? visiting ?? (cur.done ? 'cda' : 'c');
  const completed = cur.done ? 4 : eventDone('cda', cur.it, cur) ? cur.it : cur.it - 1;
  const status = visiting ? (cur.phase < 0.25 ? 'level' : cur.phase < 0.45 ? 'fail' : cur.phase < 0.7 ? 'evolve' : 'ok') : null;

  // each node's bricks as of now: inherited (from its ancestors) first, then its own
  const plates = useMemo(() => {
    const out = {} as Record<Nid, Plate>;
    for (const id of ROWS) {
      const list: Plate = [];
      for (const anc of nodeLineage(id)) {
        if (anc.id === 'root') continue;
        const st = localState(anc.id as Nid, cur);
        const mine = anc.id === id;
        const childSeen = mine || cur.done || cur.it > 1 || ORDER.indexOf(id) < cur.k || (ORDER.indexOf(id) === cur.k && cur.phase > 0.15);
        if (!childSeen) continue;
        anc.local.forEach((m) => {
          if (!st.has(m)) {
            if (cur.done && !anc.events.some((e) => e.module === m)) list.push({ id: m, inherited: !mine, rev: 0, fresh: 0 });
            return;
          }
          let fresh = 0;
          if (mine && visiting === id) {
            const e = nodeById[id].events[cur.it - 1];
            if (e && e.module === m) fresh = Math.max(0, Math.min(1, (cur.phase - 0.45) / 0.25));
          }
          list.push({ id: m, inherited: !mine, rev: st.get(m)!, fresh });
        });
      }
      out[id] = list;
    }
    return out;
  }, [cur, visiting]);

  const BW = Math.max(26, Math.min(34, Math.floor((W - LABEL_W - STATUS_W) / 7) - 3));
  const H = TOP + ROWS.length * RH + 4;
  const lineage = new Set(nodeLineage(focus).map((n) => n.id));
  const fn = nodeById[focus];
  const focusIt = visiting === focus ? cur.it : Math.max(1, [1, 2, 3, 4].filter((i) => eventDone(focus, i, cur)).pop() ?? 1);
  const ev = fn.events[focusIt - 1];
  const evDone = eventDone(focus, focusIt, cur);
  const evMod = ev ? moduleById[ev.module] : null;

  return (
    <div ref={ref}>
      <div className="p-tray pb-4 pt-3">
        {/* controls and the counter: the model stays frozen while the means rise */}
        <div className="flex items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => {
              if (time >= TOTAL) {
                seek(0);
                setPlaying(true);
              } else setPlaying((v) => !v);
            }}
            className="p-press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper"
            aria-label={time >= TOTAL ? 'Replay' : playing ? 'Pause' : 'Play'}
          >
            <Icon icon={time >= TOTAL ? RepeatIcon : playing ? PauseIcon : PlayIcon} size={15} stroke={2.2} />
          </button>
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  seek(i === 4 ? TOTAL : i * ITER_T - 0.001);
                }}
                className={`h-8 flex-1 rounded-full text-[12px] font-[720] transition-colors ${i === cur.it && !cur.done ? 'bg-accent text-white' : i <= (cur.done ? 4 : cur.it) ? 'bg-accent-wash text-accent-ink' : 'bg-paper-2 text-ink-3'}`}
              >
                It. {i}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-[16px] border border-rule bg-paper px-3 py-2">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#2a3150,#12141c)] text-[#f3f4f7]">
            <span className="font-serif text-[16px] italic leading-none">
              f<sub className="text-[10px]">θ</sub>
            </span>
            <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-surface text-ink-3 shadow">
              <Icon icon={LockIcon} size={9} stroke={2.4} />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-[700] text-ink-3">Iteration</span>
            <span className="tabular block text-[18px] font-[800] leading-none text-ink">
              {cur.done ? 4 : cur.it}
              <span className="text-[12px] font-[700] text-ink-3"> / 4</span>
            </span>
          </span>
          <span className="tabular text-right">
            <span className="block text-[11px] font-[700] text-ink-3">Train</span>
            <span className="block text-[16px] font-[800] leading-none text-accent">{MEANS.train[completed].toFixed(2)}</span>
          </span>
          <span className="tabular text-right">
            <span className="block text-[11px] font-[700] text-ink-3">Unseen</span>
            <span className="block text-[16px] font-[800] leading-none text-explorer">{MEANS.unseen18[completed].toFixed(2)}</span>
          </span>
        </div>

        {/* the tree */}
        <div ref={box} className="relative mx-4 mt-3" style={{ height: H }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {ROWS.map((id, i) => {
              const n = nodeById[id];
              const pi = n.parent === 'root' ? -1 : ROWS.indexOf(n.parent as Nid);
              const px = pi < 0 ? 7 : DEPTH_X(nodeById[n.parent as Nid].path.length) + TILE / 2;
              const py = pi < 0 ? ROOT_H : rowY(pi) + RH / 2 + TILE / 2 + 1;
              const cy = rowY(i) + RH / 2;
              const x0 = DEPTH_X(n.path.length);
              const lit = lineage.has(id);
              return <path key={id} d={`M ${px} ${py} V ${cy - 4} Q ${px} ${cy} ${px + 4} ${cy} H ${x0 - 3}`} stroke={lit ? t.accent : t.rule2} strokeWidth={lit ? 1.8 : 1.4} fill="none" />;
            })}
          </svg>
          <span className="absolute left-0 top-0 inline-flex h-[26px] items-center whitespace-nowrap rounded-full bg-ink px-2.5 text-[11.5px] font-[740] text-paper">Base Harness H₀, no learned module</span>
          {ROWS.map((id, i) => {
            const n = nodeById[id];
            const vis = visiting === id;
            const sel = focus === id;
            const isNew = nodeById[id].events[cur.it - 1]?.kind === 'new';
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPick((p) => (p === id ? null : id))}
                className="absolute inset-x-0 flex items-center text-left"
                style={{ top: rowY(i), height: RH }}
                aria-label={`${n.path.join(' then ')}: ${n.name}`}
                aria-pressed={pick === id}
              >
                <span className={`absolute inset-y-[3px] right-0 rounded-[10px] transition-colors duration-300 ${vis ? 'bg-accent-wash' : sel ? 'bg-paper-2' : ''}`} style={{ left: DEPTH_X(n.path.length) - 6 }} aria-hidden />
                <span className="relative flex gap-[2px]" style={{ marginLeft: DEPTH_X(n.path.length), width: LABEL_W - DEPTH_X(n.path.length) }}>
                  {n.path.map((c, k) => (
                    <span key={c} className="grid place-items-center rounded-[4px] text-[10px] font-[820] text-white" style={{ width: TILE, height: TILE, background: t.caps[c], opacity: k === n.path.length - 1 ? 1 : 0.55 }}>
                      {c}
                    </span>
                  ))}
                </span>
                <span className="relative flex flex-1 items-end gap-[3px] pt-1">
                  {plates[id].map((m) => (
                    <ModBrick key={m.id} id={m.id} inherited={m.inherited} rev={m.rev} fresh={m.fresh} isNew={isNew} w={BW} />
                  ))}
                </span>
                <span className="relative grid shrink-0 place-items-center" style={{ width: STATUS_W }}>
                  {vis && status && (
                    status === 'level' ? (
                      // playing Creator's level
                      <span className="relative grid h-[22px] w-[22px] place-items-center rounded-full border-2" style={{ borderColor: t.creator }} aria-label="playing the level">
                        <span className="h-2 w-2 animate-ping rounded-full" style={{ background: t.creator }} />
                      </span>
                    ) : (
                      <span
                        className="grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] font-[820]"
                        style={{ background: status === 'fail' ? t.bad : status === 'ok' ? t.good : t.ink, color: status === 'evolve' ? t.paper : '#fff' }}
                        aria-label={status === 'fail' ? 'failed' : status === 'ok' ? 'solved' : isNew ? 'new module' : 'revised module'}
                      >
                        {status === 'fail' ? '✗' : status === 'ok' ? '✓' : isNew ? '+' : '↻'}
                      </span>
                    )
                  )}
                </span>
              </button>
            );
          })}
          {/* the iteration's banner */}
          <AnimatePresence>
            {cur.k === -1 && !cur.done && (
              <motion.span
                key={`banner-${cur.it}`}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-accent px-5 py-2.5 text-[16px] font-[800] text-white shadow-[0_16px_36px_-14px_rgba(200,16,46,0.8)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                Iteration {cur.it}, a top-down pass
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* the timeline */}
        <div className="mx-4 mt-2">
          <div
            className="relative h-2 rounded-full bg-paper-2"
            onClick={(e) => {
              const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              setPlaying(false);
              seek(((e.clientX - r.left) / r.width) * TOTAL);
            }}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${(time / TOTAL) * 100}%` }} />
            {[1, 2, 3].map((i) => (
              <span key={i} className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-surface" style={{ left: `${(i / 4) * 100}%` }} />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-[3px]" style={{ background: t.caps.c }} /> learned at the node
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-[3px] border-[1.5px]" style={{ borderColor: t.caps.c }} /> inherited
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="grid h-[13px] min-w-[13px] place-items-center rounded-full bg-ink px-[2px] text-[7.5px] font-[820] text-paper">v2</span> revised
            </span>
          </div>
        </div>

        {/* the node in focus */}
        <div className="mx-3 mt-4 rounded-[20px] border border-rule bg-surface p-3.5" style={{ background: theme === 'dark' ? t.surface2 : t.surface }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11.5px] font-[700] text-ink-3">{pick ? 'Selected node' : visiting ? `Iteration ${cur.it}, being trained` : 'Node'}</p>
              <p className="mt-1 flex items-start gap-2 text-[16px] font-[760] leading-tight text-ink">
                <span className="flex shrink-0 gap-[3px] pt-[1px]">
                  {fn.path.map((c) => (
                    <span key={c} className="grid h-[18px] w-[18px] place-items-center rounded-[5px] text-[11px] font-[820] text-white" style={{ background: t.caps[c] }}>
                      {c}
                    </span>
                  ))}
                </span>
                {fn.name}
              </p>
            </div>
            {pick && (
              <button type="button" onClick={() => setPick(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-3" aria-label="Follow the training again">
                <Icon icon={Cancel01Icon} size={14} stroke={2.2} />
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[124px_minmax(0,1fr)] gap-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-paper-2">
              <AnimatePresence initial={false}>
                <motion.img
                  key={`${focus}-${focusIt}`}
                  src={nodeLevel(focus, focusIt)}
                  alt={`The level Creator built for this node, iteration ${focusIt}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
                  transition={{ duration: 0.35 }}
                  draggable={false}
                />
              </AnimatePresence>
            </div>
            <div className="min-w-0 text-[12.5px] leading-snug text-ink-2">
              <p className="text-[11px] font-[700] text-ink-3">Creator’s level, iteration {focusIt}</p>
              {evMod && (
                <p className="mt-1" style={{ opacity: evDone ? 1 : 0.55 }}>
                  <span className="mr-1 inline-grid h-[18px] place-items-center rounded-[5px] px-1.5 align-[-3px] text-[10.5px] font-[820] text-white" style={{ background: t.caps[evMod.cap] }}>
                    {evMod.id}
                  </span>
                  <span className="font-[720] text-ink">{ev.kind === 'new' ? 'new module' : 'revised'}</span>, {evMod.name}
                </p>
              )}
            </div>
          </div>
          <ol className="mt-3 space-y-1 border-t border-rule pt-3">
            {fn.events.map((e, i) => {
              const done = eventDone(focus, i + 1, cur);
              const m = moduleById[e.module];
              return (
                <li key={i} className={`flex items-start gap-2 rounded-lg px-1.5 py-1 text-[12px] ${i + 1 === focusIt && done ? 'bg-accent-wash' : ''}`} style={{ opacity: done ? 1 : 0.4 }}>
                  <span className="tabular mt-px w-7 shrink-0 text-[11px] font-[760] text-ink-3">it {i + 1}</span>
                  <span className="mt-px grid h-[17px] shrink-0 place-items-center rounded-[5px] px-1.5 text-[10px] font-[820] text-white" style={{ background: t.caps[m.cap] }}>
                    {m.id}
                  </span>
                  <span className="min-w-0 leading-snug text-ink-2">
                    <span className="font-[700] text-ink">{e.kind === 'new' ? 'new' : 'revised'}</span>, {m.name}
                  </span>
                </li>
              );
            })}
          </ol>
          {cur.done && undated(focus).length > 0 && (
            <p className="mt-2 text-[11.5px] leading-snug text-ink-3">
              {undated(focus).join(', ')} {undated(focus).length > 1 ? 'are' : 'is'} in the iteration-4 tree (Figure 11) without a recorded event.
            </p>
          )}
          <div className="mt-3 border-t border-rule pt-3">
            {benchesOfNode(focus).length > 0 ? (
              <>
                <p className="mb-1.5 text-[11.5px] font-[700] text-ink-3">Benchmarks at this node, H₀ to now (Table 8)</p>
                <BenchBars focus={focus} cur={cur} compact />
              </>
            ) : (
              <p className="text-[12px] leading-snug text-ink-3">No benchmark ends at this node; Video-Index and Video-MME-v2 sit one level below, at e → f.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Creator's pass and the next Base Harness                              */
/* ------------------------------------------------------------------ */
const PASS = ['c', 'c→d', 'c→d→a', 'c→a', 'd', 'd→a', 'd→b', 'a', 'b', 'e', 'e→f'];
const VW = 360;
const PASS0 = 0.07;
const PASS_STEP = 0.03;
const nodeAt = (i: number) => PASS0 + i * PASS_STEP;
const FUN = { x: 180, y: 178 };
const LB = { w: 41, h: 22, gx: 5, x0: 14 };
const ROW_Y = (r: number) => 252 + r * 50;
const chipW = (s: string) => 18 + s.length * 6.4;

function CreatorPass() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const [p] = useLoopClock(14, near && !reduce, reduce ? 0.9 : 0);

  // the chips of the pass, flowing over two lines
  const chips = useMemo(() => {
    const out: Record<string, { x: number; y: number; w: number }> = {};
    let x = 12;
    let y = 46;
    PASS.forEach((id) => {
      const w = chipW(id);
      if (x + w > VW - 12) {
        x = 12;
        y += 40;
      }
      out[id] = { x: x + w / 2, y, w };
      x += w + 8;
    });
    return out;
  }, []);
  const slots = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    LIB_FAMILIES.forEach((f, r) => CREATOR_LIB.filter((m) => m.family === f.id).forEach((m, c) => (out[m.id] = { x: LB.x0 + c * (LB.w + LB.gx), y: ROW_Y(r) })));
    return out;
  }, []);
  const fresh = CREATOR_LIB.filter((m) => m.origin === 'it1');
  const tokens = useMemo(() => {
    const per: Record<string, number> = {};
    return fresh.flatMap((m) => {
      const from = m.from![0] === 'all eleven nodes' ? PASS : m.from!;
      return from.map((id) => {
        const j = (per[id] = (per[id] ?? -1) + 1);
        const c = chips[id];
        return { m, id, i: PASS.indexOf(id), park: { x: c.x - c.w / 2 + 6 + (j % 4) * 9, y: c.y - 19 - Math.floor(j / 4) * 8 } };
      });
    });
  }, [fresh, chips]);

  const lit = (i: number) => seg(p, nodeAt(i), nodeAt(i) + 0.02);
  const fly = (k: number) => easeInOut(seg(p, 0.42 + (k % 12) * 0.006, 0.52 + (k % 12) * 0.006));
  const merge = seg(p, 0.56, 0.62);
  const install = (mi: number) => easeOutBack(seg(p, 0.62 + mi * 0.018, 0.71 + mi * 0.018));
  const revise = seg(p, 0.8, 0.88);
  const fade = 1 - seg(p, 0.96, 1);
  const famColor = (m: LibModule) => LIB_FAMILIES.find((f) => f.id === m.family)!.color;
  const chipFill = theme === 'dark' ? t.surface2 : t.paper2;
  const VH = ROW_Y(LIB_FAMILIES.length - 1) + LB.h + 44;

  const brick = (m: LibModule, x: number, y: number, ring = 0, key?: string) => (
    <g key={key ?? m.id} transform={`translate(${x} ${y})`}>
      {[0, 1].map((s) => (
        <rect key={s} x={7 + s * 18} y={-4} width={9} height={5} rx={1.5} fill={famColor(m)} />
      ))}
      <rect width={LB.w} height={LB.h} rx={4} fill={famColor(m)} />
      <rect width={LB.w} height={LB.h * 0.4} rx={4} fill="#fff" opacity={0.2} />
      {ring > 0 && <rect x={-3} y={-7} width={LB.w + 6} height={LB.h + 10} rx={7} fill="none" stroke={t.ink} strokeWidth={1.8} strokeOpacity={ring} />}
      <text x={LB.w / 2} y={LB.h / 2 + 4} textAnchor="middle" fill="#fff" style={{ fontSize: 10.5, fontWeight: 800 }}>
        {m.id}
      </text>
    </g>
  );

  return (
    <div ref={ref} className="p-tray px-3 pb-3 pt-2">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="block h-auto w-full" style={{ opacity: reduce ? 1 : Math.max(0.35, fade), fontFamily: 'var(--font-display)' }} role="img" aria-label="Creator evolves along the capability tree top-down in iteration 1; the nodes' proposals are merged and deduplicated with the Base Harness modules into the next Base Harness, a shared library of 25 modules.">
        <text x={12} y={16} fill={t.ink3} style={{ fontSize: 11.5, fontWeight: 700 }}>
          Iteration 1: the nodes evolve top-down
        </text>
        {PASS.map((id, i) => {
          const c = chips[id];
          const k = lit(i);
          const cur = p > PASS0 && p < nodeAt(PASS.length) && Math.floor((p - PASS0) / PASS_STEP) === i;
          return (
            <g key={id} transform={`translate(${c.x} ${c.y})`}>
              {cur && <rect x={-c.w / 2 - 4} y={-16} width={c.w + 8} height={32} rx={16} fill={t.creator} opacity={0.16} />}
              <rect x={-c.w / 2} y={-12} width={c.w} height={24} rx={12} fill={k > 0.5 ? (theme === 'dark' ? '#3a2c10' : '#fbefd9') : chipFill} stroke={k > 0.5 ? t.creator : t.rule} strokeWidth={k > 0.5 ? 1.5 : 1} />
              <text y={4} textAnchor="middle" fill={t.ink} style={{ fontSize: 11.5, fontWeight: 760 }}>
                {id}
              </text>
            </g>
          );
        })}
        {tokens.map((tk, k) => {
          const born = easeOutBack(seg(p, nodeAt(tk.i) + 0.012, nodeAt(tk.i) + 0.03));
          if (born <= 0 || merge >= 1) return null;
          const f = fly(k);
          const x = tk.park.x + (FUN.x - tk.park.x) * f;
          const y = tk.park.y + (FUN.y - tk.park.y) * f - Math.sin(Math.PI * f) * 26;
          return (
            <g key={`${tk.m.id}-${tk.id}`} transform={`translate(${x} ${y}) scale(${Math.min(1, born) * (1 + 0.5 * f)})`} opacity={f >= 1 ? 1 - merge : 1}>
              <rect x={-4} y={-3.5} width={8} height={7} rx={1.6} fill={famColor(tk.m)} />
            </g>
          );
        })}
        <g transform={`translate(${FUN.x} ${FUN.y})`}>
          <circle r={34} fill={t.creator} opacity={0.08 + 0.14 * Math.sin(Math.PI * merge)} />
          <circle r={24} fill="none" stroke={t.creator} strokeWidth={1.5} strokeDasharray="4 5" />
          <text y={-42} textAnchor="middle" fill={t.creator} style={{ fontSize: 12, fontWeight: 780 }}>
            Merge and deduplicate
          </text>
        </g>
        <text x={12} y={ROW_Y(0) - 24} fill={t.ink3} style={{ fontSize: 11.5, fontWeight: 700 }}>
          The next Base Harness: a shared library of 25 modules
        </text>
        {LIB_FAMILIES.map((f, r) => (
          <text key={f.id} x={LB.x0} y={ROW_Y(r) - 8} fill={t.ink2} style={{ fontSize: 10.5, fontWeight: 650 }}>
            {f.name}
          </text>
        ))}
        {CREATOR_LIB.filter((m) => m.origin !== 'it1').map((m) => brick(m, slots[m.id].x, slots[m.id].y, m.revisedIt1 ? Math.sin(Math.PI * revise) : 0))}
        {fresh.map((m, mi) => (
          <rect key={`slot-${m.id}`} x={slots[m.id].x} y={slots[m.id].y} width={LB.w} height={LB.h} rx={4} fill="none" stroke={t.rule2} strokeDasharray="3 3" opacity={1 - Math.min(1, install(mi))} />
        ))}
        {fresh.map((m, mi) => {
          const k = install(mi);
          if (merge < 1 && k <= 1e-6) return null;
          const s = slots[m.id];
          const x = FUN.x - LB.w / 2 + (s.x - (FUN.x - LB.w / 2)) * Math.min(1, k);
          const y = FUN.y - LB.h / 2 + (s.y - (FUN.y - LB.h / 2)) * Math.min(1, k) - Math.sin(Math.PI * Math.min(1, k)) * 30;
          return brick(m, x, y, 0, `new-${m.id}`);
        })}
        <text x={VW / 2} y={VH - 22} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.5 }}>
          11 bootstrap and 5 rule modules before RSI;
        </text>
        <text x={VW / 2} y={VH - 8} textAnchor="middle" fill={t.ink3} style={{ fontSize: 10.5 }}>
          9 installed and 4 revised at the end of iteration 1
        </text>
      </svg>
    </div>
  );
}

export default function PHarness() {
  return (
    <section id="stage-3" className="scroll-mt-16 pt-20">
      <Opener kicker="Stage 3, the Harness tree" stage="3" title="Harnesses evolve along the capability tree">
        <p className="p-lede">Every node owns a Harness: one frozen model, six control-flow protocols, and evolved modules that plug in. Validated updates accumulate across iterations within the fixed tree.</p>
      </Opener>

      <div className="mt-10 px-5">
        <h3 className="p-subtitle">The Harness tree, iteration by iteration</h3>
        <p className="p-lede mt-3">One top-down pass per iteration: at every node a failing run becomes a new module or a revision. Children inherit their parent’s modules (outlined).</p>
      </div>
      <div className="mt-5">
        <HarnessTree />
      </div>
      <div className="mt-4 px-5">
        <PaperFigure fig={PAPER_FIGS.harnessTree} />
      </div>

      <div className="mt-14 px-5">
        <h3 className="p-subtitle">Creator consolidates a new Base Harness</h3>
        <p className="p-lede mt-3">Creator evolves along the same tree; at the end of each iteration its validated proposals merge into the next Base Harness.</p>
      </div>
      <div className="mt-5">
        <CreatorPass />
      </div>
      <div className="mt-4 px-5">
        <PaperFigure fig={PAPER_FIGS.creatorLib} />
      </div>
    </section>
  );
}
