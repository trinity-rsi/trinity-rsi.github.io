import { useEffect, useMemo, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BrainIcon, Database01Icon, EyeIcon, LockIcon, RepeatIcon, Route01Icon, ToolboxIcon } from '@hugeicons/core-free-icons';
import { PROTOCOLS, type ProtocolId } from '@/data/tree';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { clamp01, easeInOut, lerp, useLoopClock } from '@/lib/anim';
import Tex from '@/components/ui/Tex';
import lhExplore from '@/assets/photos/lh-explore.webp';
import lhPlan from '@/assets/photos/lh-plan.webp';
import lhCollect from '@/assets/photos/lh-collect.webp';
import lhAchieve from '@/assets/photos/lh-achieve.webp';

/**
 * One step of an agent, animated (Section 2.2): the observation from the environment flows
 * through the six public-control components in their dependency order; each component
 * calls the frozen backbone f_θ and hands its product to the next; Loop resolves the action,
 * the environment answers with the next observation.
 */

const W = 640;
const H = 380;
const C = { x: 320, y: 196 };
const RX = 236;
const RY = 136;

const ICON: Record<ProtocolId, typeof EyeIcon> = {
  per: EyeIcon,
  mem: Database01Icon,
  inf: BrainIcon,
  plan: Route01Icon,
  orch: ToolboxIcon,
  loop: RepeatIcon,
};

/** stops around the orbit (degrees, 0 = right, clockwise); env sits between Loop and Perception */
const STOPS: { id: ProtocolId | 'env'; deg: number; carry: string }[] = [
  { id: 'per', deg: -90, carry: 'f_t' },
  { id: 'mem', deg: -30, carry: 'v_t' },
  { id: 'inf', deg: 30, carry: '\\mathrm{Cand}_t' },
  { id: 'plan', deg: 90, carry: 'd_t' },
  { id: 'orch', deg: 150, carry: '\\mathcal{C}_t' },
  { id: 'loop', deg: 210, carry: 'e_t,\\, c_t' },
  { id: 'env', deg: 238, carry: 'o_{t+1}' },
];
const FRAMES = [lhExplore, lhPlan, lhCollect, lhAchieve];
const DWELL = 0.42; // share of each stop's time spent computing at the node
const DUR = 9.8;

const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C.x + RX * Math.cos(a), y: C.y + RY * Math.sin(a) };
};
const ENV = { x: 96, y: 40 }; // environment card centre (outside the orbit, top-left)

export default function HarnessLoop({ onActive }: { onActive?: (id: ProtocolId | 'env') => void }) {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('0px');
  const [hold, setHold] = useState<number | null>(null);
  const [p, setP] = useLoopClock(DUR, near && !reduce && hold === null, 0.02);

  // where along the orbit we are
  const n = STOPS.length;
  const f = p * n;
  const k = Math.floor(f) % n;
  const local = f - Math.floor(f);
  const moving = clamp01((local - DWELL) / (1 - DWELL));
  const from = STOPS[k];
  const to = STOPS[(k + 1) % n];
  const toDeg = to.deg <= from.deg ? to.deg + 360 : to.deg;
  const deg = lerp(from.deg, toDeg, easeInOut(moving));
  const pos = at(deg);
  const computing = local < DWELL ? Math.sin((local / DWELL) * Math.PI) : 0;
  const cycle = Math.floor(performance.now() / (DUR * 1000)) % FRAMES.length;

  const lastActive = useRef<string>('');
  useEffect(() => {
    if (lastActive.current !== from.id) {
      lastActive.current = from.id;
      onActive?.(from.id);
    }
  }, [from.id, onActive]);

  // the comet tail: a few segments behind the packet, fading out
  const tail = useMemo(() => {
    if (moving <= 0) return [];
    const segs = [];
    const span = Math.min(38, (toDeg - from.deg) * easeInOut(moving));
    for (let i = 0; i < 12; i++) {
      const d0 = deg - (span * i) / 12;
      const d1 = deg - (span * (i + 1)) / 12;
      const a = at(d0);
      const b = at(d1);
      segs.push({ a, b, o: 1 - i / 12 });
    }
    return segs;
  }, [deg, moving, from.deg, toDeg]);

  const proto = from.id === 'env' ? null : PROTOCOLS.find((x) => x.id === from.id)!;
  const coreDark = '#0b0e17';

  const jump = (i: number) => {
    setHold(i);
    setP((i + DWELL * 0.5) / n);
  };

  return (
    <div ref={ref} className="absolute inset-0 flex flex-col">
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-[640/380] max-h-full w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <radialGradient id="hl-core" cx="50%" cy="38%" r="70%">
                  <stop offset="0%" stopColor="#262d44" />
                  <stop offset="100%" stopColor={coreDark} />
                </radialGradient>
                <radialGradient id="hl-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={t.accent} stopOpacity={theme === 'dark' ? 0.32 : 0.22} />
                  <stop offset="60%" stopColor={t.explorer} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={t.creator} stopOpacity={0} />
                </radialGradient>
                <filter id="hl-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="3.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="hl-beam" gradientUnits="userSpaceOnUse" x1={C.x} y1={C.y} x2={at(from.deg).x} y2={at(from.deg).y}>
                  <stop offset="0%" stopColor={t.accent} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={t.accent} stopOpacity={0.15} />
                </linearGradient>
              </defs>

              {/* orbit */}
              <ellipse cx={C.x} cy={C.y} rx={RX} ry={RY} fill="none" stroke={t.rule2} strokeWidth={1.3} />
              <ellipse cx={C.x} cy={C.y} rx={RX} ry={RY} fill="none" stroke={t.rule2} strokeWidth={6} strokeOpacity={0.22} />

              {/* environment link: Loop → env → Perception */}
              <path
                d={`M ${at(210).x - 4} ${at(210).y - 18} C ${at(210).x - 40} ${ENV.y + 70}, ${ENV.x - 40} ${ENV.y + 46}, ${ENV.x - 26} ${ENV.y + 24}`}
                fill="none"
                stroke={from.id === 'loop' && moving > 0 ? t.accent : t.rule2}
                strokeWidth={1.4}
                strokeDasharray="4 4"
              />
              <path
                d={`M ${ENV.x + 50} ${ENV.y} C ${ENV.x + 130} ${ENV.y - 6}, ${at(-90).x - 90} ${at(-90).y - 14}, ${at(-90).x - 44} ${at(-90).y - 6}`}
                fill="none"
                stroke={from.id === 'env' && moving > 0 ? t.accent : t.rule2}
                strokeWidth={1.4}
                strokeDasharray="4 4"
              />

              {/* core halo + rotating ring */}
              <circle cx={C.x} cy={C.y} r={96} fill="url(#hl-halo)" />
              <g style={{ transformOrigin: `${C.x}px ${C.y}px`, transform: `rotate(${(p * 360 * 2).toFixed(1)}deg)` }}>
                <circle cx={C.x} cy={C.y} r={64} fill="none" stroke={t.accent} strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="2 7" />
              </g>
              <g style={{ transformOrigin: `${C.x}px ${C.y}px`, transform: `rotate(${(-p * 360).toFixed(1)}deg)` }}>
                <circle cx={C.x} cy={C.y} r={72} fill="none" stroke={t.explorer} strokeOpacity={0.3} strokeWidth={1} strokeDasharray="14 22" />
              </g>

              {/* model call: beam from the core to the computing node */}
              {from.id !== 'env' && computing > 0.01 && (
                <g opacity={computing}>
                  <line x1={C.x} y1={C.y} x2={at(from.deg).x} y2={at(from.deg).y} stroke="url(#hl-beam)" strokeWidth={2.4} strokeLinecap="round" />
                  {[0, 0.33, 0.66].map((o) => {
                    const q = (local / DWELL + o) % 1;
                    const b = at(from.deg);
                    return <circle key={o} cx={lerp(C.x, b.x, q)} cy={lerp(C.y, b.y, q)} r={2.6} fill={t.accent} filter="url(#hl-glow)" />;
                  })}
                </g>
              )}

              <circle cx={C.x} cy={C.y} r={52 + computing * 2} fill="url(#hl-core)" />
              <circle cx={C.x} cy={C.y} r={52 + computing * 2} fill="none" stroke="#ffffff" strokeOpacity={0.08} />

              {/* comet carrying the product of the last component */}
              {tail.map((s, i) => (
                <line key={i} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={t.accent} strokeWidth={3.4 * s.o + 0.6} strokeOpacity={s.o * 0.9} strokeLinecap="round" />
              ))}
              <circle cx={pos.x} cy={pos.y} r={5.2} fill={t.accent} filter="url(#hl-glow)" />
              <circle cx={pos.x} cy={pos.y} r={2.2} fill="#ffffff" />
            </svg>

            {/* the frozen backbone */}
            <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${(C.x / W) * 100}%`, top: `${(C.y / H) * 100}%` }}>
              <div className="text-[clamp(20px,2.4vw,30px)] leading-none text-white">
                <Tex>{'f_\\theta'}</Tex>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-[10.5px] font-[650] text-white/60">
                <HugeiconsIcon icon={LockIcon} size={10} strokeWidth={2} /> frozen
              </div>
            </div>

            {/* environment */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(ENV.x / W) * 100}%`, top: `${(ENV.y / H) * 100}%`, width: `${(104 / W) * 100}%` }}
            >
              <div
                className="overflow-hidden rounded-[10px] border transition-[box-shadow,border-color] duration-300"
                style={{
                  borderColor: from.id === 'env' || from.id === 'loop' ? t.accent : t.rule,
                  boxShadow: from.id === 'env' ? `0 0 0 3px ${t.accent}33` : '0 8px 20px -12px rgba(0,0,0,0.5)',
                }}
              >
                <img src={FRAMES[cycle]} alt="" className="aspect-[16/10] w-full object-cover" />
              </div>
              <p className="mt-1 text-center text-[10.5px] font-[650] text-ink-3">environment</p>
            </div>

            {/* the six components */}
            {STOPS.slice(0, 6).map((s, i) => {
              const pt = at(s.deg);
              const pr = PROTOCOLS.find((x) => x.id === s.id)!;
              const on = from.id === s.id;
              const glow = on ? 0.35 + 0.65 * computing : 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseEnter={() => jump(i)}
                  onMouseLeave={() => setHold(null)}
                  onFocus={() => jump(i)}
                  onBlur={() => setHold(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 outline-none"
                  style={{ left: `${(pt.x / W) * 100}%`, top: `${(pt.y / H) * 100}%` }}
                  aria-label={`${pr.name}: ${pr.role}`}
                >
                  <span
                    className="flex items-center gap-2 rounded-2xl border py-1.5 pl-1.5 pr-3 backdrop-blur-md transition-[transform,border-color,background-color] duration-300"
                    style={{
                      borderColor: on ? t.accent : t.rule,
                      background: on ? (theme === 'dark' ? '#2a1018e6' : '#fff5f6f0') : theme === 'dark' ? '#151a28e6' : '#ffffffe6',
                      transform: `scale(${1 + glow * 0.06})`,
                      boxShadow: on ? `0 0 0 ${2 + glow * 4}px ${t.accent}26, 0 14px 30px -16px ${t.accent}` : '0 10px 24px -18px rgba(0,0,0,0.55)',
                    }}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-xl transition-colors duration-300"
                      style={{ background: on ? t.accent : t.surface2, color: on ? '#fff' : t.ink2 }}
                    >
                      <HugeiconsIcon icon={ICON[s.id as ProtocolId]} size={16} strokeWidth={1.8} />
                    </span>
                    <span className="text-left leading-tight">
                      <span className="block text-[12.5px] font-[720] text-ink">{pr.name}</span>
                      <span className="block text-[11.5px] text-ink-3">
                        <Tex>{pr.sym}</Tex>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}

            {/* the quantity being carried */}
            {moving > 0.08 && moving < 0.82 && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[12px] shadow-md"
                style={{
                  // ride just outside the orbit, so it never lands on a component card
                  left: `${((pos.x + ((pos.x - C.x) / RX) * 30) / W) * 100}%`,
                  top: `${((pos.y + ((pos.y - C.y) / RY) * 24) / H) * 100}%`,
                  background: t.surface,
                  borderColor: t.accent,
                  color: t.ink,
                  opacity: Math.min(1, (moving - 0.08) * 8, (0.82 - moving) * 8),
                }}
              >
                <Tex>{from.carry}</Tex>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* live caption */}
      <div className="mt-2 flex min-h-[52px] items-center gap-3 rounded-xl border border-rule bg-surface-2 px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-white">
          {proto ? <HugeiconsIcon icon={ICON[proto.id]} size={15} strokeWidth={1.9} /> : <span className="text-[11px] font-[800]">env</span>}
        </span>
        <div key={from.id} className="min-w-0 animate-[rise-in_.45s_ease_both]">
          <p className="text-[13px] font-[720] text-ink">
            {proto ? proto.name : 'Environment'}
            <span className="ml-2 text-[13px] font-normal text-ink-2">
              <Tex>{proto ? proto.eq : 'o_{t+1} = \\mathrm{Env}(e_t)'}</Tex>
            </span>
          </p>
          <p className="truncate text-[12px] text-ink-3">{proto ? proto.role : 'The host executes the action and returns the next observation; θ never changes.'}</p>
        </div>
      </div>
    </div>
  );
}
