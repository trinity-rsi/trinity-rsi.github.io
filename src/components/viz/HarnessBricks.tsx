import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BrainIcon, Database01Icon, EyeIcon, LockIcon, PauseIcon, PlayIcon, RepeatIcon, Route01Icon, ToolboxIcon } from '@hugeicons/core-free-icons';
import Icon from '@/components/ui/Icon';
import Tex from '@/components/ui/Tex';
import { Brick, BrickDefs } from '@/components/viz/Bricks';
import { PROTOCOLS, type ProtocolId } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * What evolves: the Harness, built the way the film builds it. The six control-flow protocols are
 * six bricks that drop into a ring around the frozen model; one step of an agent is a light that
 * runs the ring in order and lights each protocol as it passes. Hover a brick to hold it, click
 * one to stop on it.
 */
const PICON: Record<ProtocolId, typeof EyeIcon> = { per: EyeIcon, mem: Database01Icon, inf: BrainIcon, plan: Route01Icon, orch: ToolboxIcon, loop: RepeatIcon };
const COLOR: Record<ProtocolId, string> = { per: '#0e8f86', mem: '#2a78d6', inf: '#6f55c9', plan: '#c27a00', orch: '#3d4a6b', loop: '#c8102e' };
const COLOR_DARK: Record<ProtocolId, string> = { per: '#169c8e', mem: '#3987e5', inf: '#8a6fe0', plan: '#c98a12', orch: '#56638a', loop: '#e5405c' };

const W = 1100;
const H = 620;
const LC = { x: 550, y: 318 };
const RX = 410;
const RY = 200;
const BW = 236;
const BH = 64;
const DWELL = 1.5; // seconds the light rests on a protocol
const MOVE = 0.55; // seconds it takes to reach the next one
const STEP = DWELL + MOVE;
const ang = (k: number) => -90 + k * 60;
const posAt = (deg: number) => ({ x: LC.x + RX * Math.cos((deg * Math.PI) / 180), y: LC.y + RY * Math.sin((deg * Math.PI) / 180) });
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export default function HarnessBricks() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [seen, setSeen] = useState(false);
  const [clock, setClock] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const start = useRef(0);
  const colors = theme === 'dark' ? COLOR_DARK : COLOR;

  useEffect(() => {
    if (near) setSeen(true);
  }, [near]);

  // the light's clock: runs while the figure is on screen and nobody holds a brick
  const running = seen && near && !reduce && !paused && hover === null && picked === null;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    start.current = performance.now() - clock * 1000;
    const tick = (now: number) => {
      setClock((now - start.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    // let the bricks land before the first lap
    const wait = window.setTimeout(() => (raf = requestAnimationFrame(tick)), clock === 0 ? 1900 : 0);
    return () => {
      window.clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const lap = clock / STEP;
  const k = Math.floor(lap) % 6;
  const within = (lap - Math.floor(lap)) * STEP;
  const moving = within > DWELL;
  const u = moving ? ease((within - DWELL) / MOVE) : 0;
  const deg = ang(k) + 60 * u;
  const light = posAt(deg);
  const auto = moving ? (u > 0.5 ? (k + 1) % 6 : k) : k;
  const active = picked ?? hover ?? (reduce ? 0 : auto);
  const p = PROTOCOLS[active];
  const lit = (i: number) => {
    if (picked !== null || hover !== null) return i === active ? 1 : 0;
    if (!seen || reduce) return 0;
    if (i === k) return moving ? 1 - u : 1;
    if (i === (k + 1) % 6 && moving) return u;
    return 0;
  };

  return (
    <div ref={ref} className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:gap-10">
      <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="The six control-flow protocols of a Harness, Perception, Memory, Inference, Planning, Orchestration and Loop, as bricks in a ring around the frozen model">
          <BrickDefs id="hb" />
          <defs>
            <radialGradient id="hb-core" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#2a3150" />
              <stop offset="100%" stopColor="#12141c" />
            </radialGradient>
            <radialGradient id="hb-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={t.accent} stopOpacity={0.2} />
              <stop offset="55%" stopColor={t.explorer} stopOpacity={0.07} />
              <stop offset="100%" stopColor={t.creator} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* the ring the light runs */}
          <motion.ellipse
            cx={LC.x}
            cy={LC.y}
            rx={RX}
            ry={RY}
            fill="none"
            stroke={t.rule2}
            strokeWidth={3.5}
            initial={reduce ? false : { pathLength: 0 }}
            animate={seen ? { pathLength: 1 } : undefined}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
          />
          {/* arrows on the ring: the order of one step */}
          {PROTOCOLS.map((_, i) => {
            const a = ang(i) + 30;
            const q = posAt(a);
            const q2 = posAt(a + 1);
            const r = (Math.atan2(q2.y - q.y, q2.x - q.x) * 180) / Math.PI;
            return (
              <motion.path
                key={i}
                d="M -7 -6 L 3 0 L -7 6"
                transform={`translate(${q.x} ${q.y}) rotate(${r})`}
                fill="none"
                stroke={t.ink3}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { opacity: 0 }}
                animate={seen ? { opacity: 0.7 } : undefined}
                transition={{ delay: 1.2 + i * 0.05 }}
              />
            );
          })}

          {/* the light, with a short trail */}
          {seen && !reduce && picked === null && hover === null && (
            <g>
              {Array.from({ length: 8 }, (_, j) => {
                const q = posAt(deg - j * 3.2);
                return <circle key={j} cx={q.x} cy={q.y} r={10 - j * 0.9} fill={t.accent} opacity={(1 - j / 8) * 0.45 * (moving ? 1 : 0.35)} />;
              })}
              <circle cx={light.x} cy={light.y} r={11} fill={t.accent} filter="url(#hb-glow)" />
              <circle cx={light.x} cy={light.y} r={4.2} fill="#fff" />
            </g>
          )}

          {/* the frozen model */}
          <motion.g initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={seen ? { scale: 1, opacity: 1 } : undefined} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }} style={{ originX: `${LC.x}px`, originY: `${LC.y}px` }}>
            <circle cx={LC.x} cy={LC.y} r={150} fill="url(#hb-halo)" />
            <circle cx={LC.x} cy={LC.y} r={102 + lit(active) * 6} fill="none" stroke={t.accent} strokeOpacity={0.28} strokeWidth={2} />
            <circle cx={LC.x} cy={LC.y} r={92} fill="url(#hb-core)" filter="url(#hb-sh)" />
            <text x={LC.x} y={LC.y + 8} textAnchor="middle" fontSize={58} fill="#f3f4f7" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              f
              <tspan dy={10} fontSize={32}>
                θ
              </tspan>
            </text>
            <g transform={`translate(${LC.x} ${LC.y + 42})`}>
              <rect x={-44} y={-12} width={88} height={25} rx={12.5} fill="#fff" opacity={0.1} />
              <g transform="translate(-34 -7)">
                <Icon icon={LockIcon} size={14} stroke={2.2} color="#c9cfdd" />
              </g>
              <text x={8} y={5.5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#c9cfdd" style={{ letterSpacing: '0.04em' }}>
                frozen
              </text>
            </g>
          </motion.g>

          {/* the six protocols */}
          {PROTOCOLS.map((pr, i) => {
            const q = posAt(ang(i));
            return (
              <motion.g
                key={pr.id}
                initial={reduce ? false : { y: -220, opacity: 0 }}
                animate={seen ? { y: 0, opacity: 1 } : undefined}
                transition={{ y: { type: 'spring', stiffness: 420, damping: 19, mass: 0.9, delay: 0.45 + i * 0.14 }, opacity: { duration: 0.2, delay: 0.45 + i * 0.14 } }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setPicked((v) => (v === i ? null : i))}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={pr.name}
              >
                <g transform={`translate(0 ${-lit(i) * 6})`}>
                  <Brick x={q.x - BW / 2} y={q.y - BH / 2} w={BW} h={BH} color={colors[pr.id]} label={pr.name} labelSize={25} icon={PICON[pr.id]} studs={4} glow={lit(i)} glowColor={colors[pr.id]} defs="hb" />
                </g>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* ---------------- the protocol in the light ---------------- */}
      <div className="rounded-[24px] border border-rule bg-surface p-6 shadow-[0_30px_70px_-50px_rgba(20,24,40,0.6)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12.5px] font-[750] uppercase tracking-[0.12em] text-ink-3">One step of an agent</p>
          <button
            type="button"
            onClick={() => {
              if (picked !== null) setPicked(null);
              else setPaused((v) => !v);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule bg-surface-2 px-2.5 text-[12px] font-[680] text-ink-2 transition-colors hover:text-ink"
          >
            <Icon icon={picked !== null || paused ? PlayIcon : PauseIcon} size={13} stroke={2.2} />
            {picked !== null || paused ? 'Run the loop' : 'Pause'}
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[13px] text-white shadow-sm" style={{ background: colors[p.id] }}>
                <Icon icon={PICON[p.id]} size={21} stroke={2} />
              </span>
              <div>
                <p className="tabular text-[12px] font-[700] text-ink-3">
                  {active + 1} / 6
                </p>
                <p className="text-[24px] font-[780] leading-tight tracking-[-0.02em]" style={{ color: colors[p.id], fontStretch: '108%' }}>
                  {p.name}
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-[14px] border border-rule bg-surface-2 px-4 py-3 text-[17px] text-ink">
              <Tex>{p.eq}</Tex>
            </div>
            <p className="mt-3 min-h-[3em] text-[14.5px] leading-[1.5] text-ink-2">{p.role}</p>
          </motion.div>
        </AnimatePresence>
        <ol className="mt-4 flex flex-wrap items-center gap-1">
          {PROTOCOLS.map((pr, i) => (
            <li key={pr.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPicked(i)}
                className={`rounded-full px-2.5 py-1 text-[12px] font-[700] transition-colors ${i === active ? 'text-white' : 'bg-surface-2 text-ink-3 hover:text-ink'}`}
                style={i === active ? { background: colors[pr.id] } : undefined}
                aria-pressed={i === active}
              >
                {pr.abbr}
              </button>
              {i < 5 && <span className="text-[11px] text-ink-3">→</span>}
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-4 border-t border-rule pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[13.5px] font-[720] text-ink">Modules</p>
            <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-2">Pure functions of public records, each bound to one of the six protocols. They live at tree nodes and pass to descendants by selective inheritance.</p>
          </div>
          <div>
            <p className="text-[13.5px] font-[720] text-ink">Fixed backbone</p>
            <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-2">
              Evolution changes module configurations only; the weights <Tex>{'\\theta'}</Tex> never change. Evaluation-time skills are prepared separately, not stored in the tree.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
