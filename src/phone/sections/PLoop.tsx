import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Globe02Icon, Robot01Icon, UserIcon } from '@hugeicons/core-free-icons';
import Icon from '@/components/ui/Icon';
import { Brick, BrickDefs } from '@/components/viz/Bricks';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * The evolving loop of the Introduction, for a phone: World → Human → Agent, a wall of bricks on
 * each stretch. A light runs the loop and stops at each wall; the problem that wall stands for is
 * written out underneath. A tap on a wall, or on the pager, holds it.
 */
export type Wall = { kind: 'Bottleneck' | 'Challenge'; at: 'World' | 'Human' | 'Agent'; title: string; text: string };

const VB = { w: 360, h: 300 };
const O = { x: 180, y: 166 };
const R = 116;
const NODE_R = 31;
const OUT = [21, 31, 21];
const IN = [21, 21, 31];
const rad = (a: number) => (a * Math.PI) / 180;
const pt = (a: number, r = R) => ({ x: O.x + r * Math.cos(rad(a)), y: O.y + r * Math.sin(rad(a)) });

const NODES = [
  { key: 'World', a: -90, icon: Globe02Icon, does: 'provides tasks' },
  { key: 'Human', a: 150, icon: UserIcon, does: 'guides learning' },
  { key: 'Agent', a: 30, icon: Robot01Icon, does: 'verifiable outcomes' },
] as const;
const ARCS = NODES.map((n, i) => {
  let b: number = NODES[(i + 1) % 3].a;
  while (b >= n.a) b -= 360;
  return { from: n.a - OUT[i], to: b + IN[(i + 1) % 3] };
});
const angAt = (k: number, u: number) => ARCS[k].from + (ARCS[k].to - ARCS[k].from) * u;
const arcAt = (k: number, u: number) => pt(angAt(k, u));
const ARC_LEN = ARCS.map((a) => (Math.abs(a.to - a.from) * Math.PI * R) / 180);
const arcPath = (k: number, u0 = 0, u1 = 1) => {
  const A = arcAt(k, u0);
  const B = arcAt(k, u1);
  return `M ${A.x} ${A.y} A ${R} ${R} 0 0 0 ${B.x} ${B.y}`;
};
const WB = { w: 22, h: 14, gap: 3 };
const WALL_U = 0.5;
const STOP = ARCS.map((_, k) => {
  const a = rad(angAt(k, WALL_U));
  return WALL_U - (Math.abs(Math.sin(a)) * (WB.w + 1) + Math.abs(Math.cos(a)) * (WB.h + 3) + 9) / ARC_LEN[k];
});

const RUN = 1.4;
const BUMP = 0.45;
const REST = 4.4;
const STEP = RUN + BUMP + REST;
const START = 1.3;
const TRAIL = 6;

export default function PLoop({ walls }: { walls: Wall[] }) {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState<number | null>(null);
  const clock = useRef(0);
  const shownK = useRef(-1);
  const bumped = useRef(-1);
  const light = useRef<SVGGElement>(null);
  const trail = useRef<(SVGCircleElement | null)[]>([]);
  const history = useRef<{ x: number; y: number }[]>([]);
  const shake = useRef<(SVGGElement | null)[]>([]);
  const spark = useRef<SVGGElement>(null);
  const sparkRing = useRef<SVGCircleElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (near) setSeen(true);
  }, [near]);

  // a held wall lets go after a while; the light then carries on from it
  useEffect(() => {
    if (hold === null) return;
    const id = window.setTimeout(() => {
      let n = Math.max(0, Math.floor((clock.current - START) / STEP));
      while (n % 3 !== hold) n++;
      clock.current = START + n * STEP + RUN + BUMP;
      bumped.current = n;
      setHold(null);
    }, 9000);
    return () => window.clearTimeout(id);
  }, [hold]);

  useEffect(() => {
    if (!seen || reduce || !near) return;
    let raf = 0;
    let last = performance.now();
    const hit = (k: number) => {
      shake.current[k]?.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-1.5px)' }, { transform: 'translateX(0)' }],
        { duration: 420, easing: 'ease-out' }
      );
      const c = arcAt(k, STOP[k] + 7 / ARC_LEN[k]);
      spark.current?.setAttribute('transform', `translate(${c.x} ${c.y})`);
      sparkRing.current?.animate(
        [
          { transform: 'scale(0.3)', opacity: 0.85 },
          { transform: 'scale(1.7)', opacity: 0 },
        ],
        { duration: 560, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
      );
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let k = 0;
      let u = 0;
      let o = 0;
      let progress = 0;
      if (hold !== null) {
        k = hold;
        u = STOP[k];
        o = 1;
      } else {
        clock.current += dt;
        const time = clock.current - START;
        if (time >= 0) {
          const n = Math.floor(time / STEP);
          k = n % 3;
          const w = time - n * STEP;
          progress = w / STEP;
          if (w < RUN) {
            u = STOP[k] * (1 - Math.cos(((w / RUN) * Math.PI) / 2));
            o = Math.min(1, w / 0.2);
          } else if (w < RUN + BUMP) {
            u = STOP[k] - 0.035 * Math.sin((Math.PI * (w - RUN)) / BUMP);
            o = 1;
            if (bumped.current !== n) {
              bumped.current = n;
              hit(k);
            }
          } else {
            u = STOP[k];
            o = Math.max(0, Math.min(1, (STEP - w) / 0.8));
          }
          if (k !== shownK.current) {
            shownK.current = k;
            history.current = [];
            setActive(k);
          }
        }
      }
      const p = arcAt(k, u);
      light.current?.setAttribute('transform', `translate(${p.x} ${p.y})`);
      light.current?.setAttribute('opacity', String(o));
      const h = history.current;
      h.unshift(p);
      if (h.length > TRAIL) h.pop();
      trail.current.forEach((c, i) => {
        const q = h[Math.min(i + 1, h.length - 1)] ?? p;
        c?.setAttribute('cx', String(q.x));
        c?.setAttribute('cy', String(q.y));
        c?.setAttribute('opacity', String(o * 0.32 * (1 - i / TRAIL)));
      });
      bars.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleX(${hold === null ? (i === k ? progress : i < k ? 1 : 0) : i === hold ? 1 : 0})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, reduce, near, hold]);

  const focus = hold ?? active;
  const w = walls[focus];
  const grey = theme === 'dark' ? ['#566079', '#454e66'] : ['#b3bccb', '#9aa4b8'];
  const nodeFill = theme === 'dark' ? t.surface2 : '#ffffff';

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="block h-auto w-full overflow-visible" style={{ fontFamily: 'var(--font-display)' }} role="img" aria-label="The evolving loop: the world provides tasks, humans guide learning, agents produce verifiable outcomes. A wall stands on each stretch: two bottlenecks and a challenge.">
        <BrickDefs id="pl" />
        {ARCS.map((_, k) => {
          const end = arcAt(k, 1);
          const pre = arcAt(k, 0.96);
          const ang = (Math.atan2(end.y - pre.y, end.x - pre.x) * 180) / Math.PI;
          const lit = seen && focus === k;
          return (
            <g key={k}>
              <path d={arcPath(k, 0, WALL_U)} fill="none" stroke={lit ? t.accent : t.ink3} strokeOpacity={lit ? 0.8 : 0.45} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="0.5 8" style={{ transition: 'stroke .5s, stroke-opacity .5s' }} />
              <path d={arcPath(k, WALL_U, 1)} fill="none" stroke={t.ink3} strokeOpacity={0.2} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="0.5 8" />
              <path d="M -8 -5 L 0 0 L -8 5" transform={`translate(${end.x} ${end.y}) rotate(${ang})`} fill="none" stroke={t.ink3} strokeOpacity={0.4} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        <text x={O.x} y={O.y - 22} textAnchor="middle" fill={t.ink3} style={{ fontSize: 11.5, fontWeight: 650 }}>
          The evolving loop
        </text>
        <text x={O.x} y={O.y + 4} textAnchor="middle" fill={t.ink} style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', fontStretch: '110%' }}>
          <tspan fill={t.accent}>2</tspan> bottlenecks
        </text>
        <text x={O.x} y={O.y + 28} textAnchor="middle" fill={t.ink} style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', fontStretch: '110%' }}>
          <tspan fill={t.accent}>1</tspan> challenge
        </text>

        {NODES.map((n, k) => {
          const p = pt(n.a);
          const lit = seen && focus === k;
          // above the World; below Human and Agent, nudged outwards, clear of the bottom stretch
          const tx = k === 0 ? p.x : p.x + (k === 1 ? -18 : 18);
          const ty = k === 0 ? p.y - NODE_R - 9 : p.y + NODE_R + 27;
          return (
            <g key={n.key}>
              <circle cx={p.x} cy={p.y} r={NODE_R + 6} fill={t.accent} opacity={lit ? (theme === 'dark' ? 0.16 : 0.09) : 0} style={{ transition: 'opacity .5s' }} />
              <circle cx={p.x} cy={p.y} r={NODE_R} fill={nodeFill} stroke={lit ? `${t.accent}90` : t.rule} strokeWidth={1.5} filter="url(#pl-sh)" style={{ transition: 'stroke .5s' }} />
              <g transform={`translate(${p.x - 11} ${p.y - 19})`}>
                <Icon icon={n.icon} size={22} stroke={1.8} color={t.ink} />
              </g>
              <text x={p.x} y={p.y + 17} textAnchor="middle" fill={t.ink} style={{ fontSize: 10.5, fontWeight: 760 }}>
                {n.key}
              </text>
              <text x={tx} y={ty} textAnchor="middle" fill={lit ? t.accent : t.ink3} style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', fontFamily: 'var(--font-serif)', transition: 'fill .5s' }}>
                {n.does}
              </text>
            </g>
          );
        })}

        {!reduce && (
          <>
            {Array.from({ length: TRAIL }, (_, i) => (
              <circle key={i} ref={(el) => void (trail.current[i] = el)} r={4.4 - i * 0.5} fill={t.accent} opacity={0} />
            ))}
            <g ref={spark}>
              <circle ref={sparkRing} r={10} fill="none" stroke={t.accent} strokeWidth={2} opacity={0} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            </g>
            <g ref={light} opacity={0}>
              <circle r={11} fill={t.accent} opacity={0.18} />
              <circle r={5.5} fill={t.accent} />
              <circle r={2} fill="#fff" />
            </g>
          </>
        )}

        {walls.map((wall, k) => {
          const p = arcAt(k, WALL_U);
          const on = seen && focus === k;
          const yb = p.y + 2;
          const lo = on ? t.accent : grey[1];
          const hi = on ? (theme === 'dark' ? '#ff6f86' : '#e2405a') : grey[0];
          return (
            <g key={wall.title} onClick={() => setHold(k)} style={{ cursor: 'pointer' }}>
              <circle cx={p.x} cy={p.y} r={30} fill="transparent" />
              <g ref={(el) => void (shake.current[k] = el)}>
                <Brick x={p.x - WB.w - 0.5} y={yb} w={WB.w} h={WB.h} color={lo} studs={2} defs="pl" />
                <Brick x={p.x + 0.5} y={yb} w={WB.w} h={WB.h} color={lo} studs={2} defs="pl" />
                <Brick x={p.x - WB.w / 2} y={yb - WB.h - WB.gap} w={WB.w} h={WB.h} color={hi} studs={2} defs="pl" />
                <g transform={`translate(${k === 0 ? p.x - WB.w - 6 : p.x + WB.w + 6} ${yb - WB.h - 4})`}>
                  <circle r={9.5} fill={on ? t.accent : nodeFill} stroke={on ? nodeFill : t.rule2} strokeWidth={on ? 2 : 1.3} style={{ transition: 'fill .4s' }} />
                  <text y={3.8} textAnchor="middle" fill={on ? '#fff' : t.ink2} style={{ fontSize: 10.5, fontWeight: 820 }}>
                    {k + 1}
                  </text>
                </g>
              </g>
            </g>
          );
        })}
      </svg>

      {/* the problem in front */}
      <div className="relative mt-3 min-h-[148px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={focus} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }} aria-live="polite">
            <p className="flex items-center gap-2 text-[12.5px] font-[700] text-accent">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-[820] text-white">{focus + 1}</span>
              {w.at} {w.kind.toLowerCase()}
            </p>
            <p className="mt-1.5 text-[19px] font-[760] leading-tight tracking-[-0.015em] text-ink" style={{ fontStretch: '106%' }}>
              {w.title}
            </p>
            <p className="p-body mt-1.5">{w.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-1.5">
        {walls.map((wall, k) => (
          <button key={wall.title} type="button" onClick={() => setHold(k)} className="flex h-6 flex-1 items-center" aria-label={wall.title} aria-pressed={focus === k}>
            <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-rule">
              <span ref={(el) => void (bars.current[k] = el)} className="absolute inset-0 origin-left bg-ink" style={{ transform: `scaleX(${reduce ? (focus === k ? 1 : 0) : 0})` }} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
