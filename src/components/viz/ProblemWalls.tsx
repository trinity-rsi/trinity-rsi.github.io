import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Globe02Icon, Robot01Icon, UserIcon } from '@hugeicons/core-free-icons';
import Icon from '@/components/ui/Icon';
import { Brick, BrickDefs } from '@/components/viz/Bricks';
import { useTokens } from '@/theme/tokens';
import { useMediaQuery, useNearViewport, useReducedMotion } from '@/lib/hooks';

/**
 * The problem as the Introduction frames it: multimodal intelligence as an evolving loop (worlds
 * provide tasks, humans guide learning, agents produce verifiable outcomes) that runs into two
 * bottlenecks and a challenge. The loop is a ring through World, Human and Agent with a wall of
 * bricks on each stretch; a light runs the ring and hits each wall in turn while the matching
 * problem lights up in the list. Hovering a problem holds its wall.
 */
export type Wall = { kind: 'Bottleneck' | 'Challenge'; at: 'World' | 'Human' | 'Agent'; title: string; text: string };

const VB = { w: 600, h: 604 };
const O = { x: 300, y: 300 };
const R = 212;
const NODE_R = 46;
// degrees between a node and the ends of its stretches; the bottom stretch keeps clear of the captions
const OUT = [17, 28, 17];
const IN = [17, 17, 28];
const rad = (a: number) => (a * Math.PI) / 180;
const pt = (a: number, r = R) => ({ x: O.x + r * Math.cos(rad(a)), y: O.y + r * Math.sin(rad(a)) });

const NODES = [
  { key: 'World', a: -90, icon: Globe02Icon, does: 'provides tasks' },
  { key: 'Human', a: 150, icon: UserIcon, does: 'guides learning' },
  { key: 'Agent', a: 30, icon: Robot01Icon, does: 'verifiable outcomes' },
] as const;

/** the loop's three stretches, World → Human → Agent → World (angles fall along each) */
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

/* a wall: two bricks with one on top, standing upright across the middle of a stretch */
const WB = { w: 32, h: 21, gap: 4 };
const WALL_U = 0.5;
const HALF = { w: WB.w + 1, h: WB.h + WB.gap / 2 + 2.5 };
/** where the light stops: just short of the wall, measured along the stretch */
const STOP = ARCS.map((_, k) => {
  const a = rad(angAt(k, WALL_U));
  return WALL_U - (Math.abs(Math.sin(a)) * HALF.w + Math.abs(Math.cos(a)) * HALF.h + 11) / ARC_LEN[k];
});

/* the light's beat on each stretch: run into the wall, recoil, fade */
const RUN = 1.35;
const BUMP = 0.45;
const REST = 1.5;
const STEP = RUN + BUMP + REST;
const START = 2.0; // once the walls are down
const TRAIL = 7;

export default function ProblemWalls({ walls, head, lead }: { walls: Wall[]; head: ReactNode; lead: ReactNode }) {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const fs = useMediaQuery('(min-width: 640px)') ? 1 : 1.35; // the figure's type, larger on phones
  const [ref, near] = useNearViewport<HTMLDivElement>('-10% 0px');
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState<number | null>(null);
  const clock = useRef(0);
  const shownK = useRef(-1);
  const bumped = useRef(-1);
  const prevHold = useRef<number | null>(null);
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

  // let go of a held wall: the light, waiting at it, hits it and moves on
  useEffect(() => {
    const k = prevHold.current;
    if (hold === null && k !== null) {
      let n = Math.max(0, Math.floor((clock.current - START) / STEP));
      while (n % 3 !== k) n++;
      clock.current = START + n * STEP + RUN;
    }
    prevHold.current = hold;
  }, [hold]);

  // the light runs on a ref; React only hears which problem is in focus
  useEffect(() => {
    if (!seen || reduce || !near) return;
    let raf = 0;
    let last = performance.now();
    const hit = (k: number) => {
      shake.current[k]?.animate(
        [{ transform: 'translateX(0px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0px)' }],
        { duration: 420, easing: 'ease-out' },
      );
      const c = arcAt(k, STOP[k] + 9 / ARC_LEN[k]);
      spark.current?.setAttribute('transform', `translate(${c.x} ${c.y})`);
      sparkRing.current?.animate(
        [
          { transform: 'scale(0.3)', opacity: 0.85 },
          { transform: 'scale(1.7)', opacity: 0 },
        ],
        { duration: 560, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
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
            o = Math.max(0, Math.min(1, (RUN + BUMP + REST - w) / 0.8)); // stays at the wall, then fades
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
        c?.setAttribute('opacity', String(o * 0.34 * (1 - i / TRAIL)));
      });
      bars.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleX(${i === k && hold === null ? progress : 0})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, reduce, near, hold]);

  const focus = hold ?? active;
  const grey = theme === 'dark' ? ['#566079', '#454e66'] : ['#b3bccb', '#9aa4b8'];
  const nodeFill = theme === 'dark' ? t.surface2 : '#ffffff';

  return (
    <div
      ref={ref}
      className="grid gap-x-14 [grid-template-areas:'head'_'lead'_'fig'_'list'] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] lg:[grid-template-areas:'head_head'_'lead_fig'_'list_fig']"
    >
      <div className="[grid-area:head]">{head}</div>
      <div className="[grid-area:lead] mt-5 lg:mt-8">{lead}</div>

      {/* ---------------- the problems, in words ---------------- */}
      <ol className="[grid-area:list] mt-6 space-y-2.5 lg:self-start">
        {walls.map((w, k) => {
          const on = seen && focus === k;
          return (
            <motion.li
              key={w.title}
              initial={reduce ? false : { opacity: 0, x: -16 }}
              animate={seen ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.6, delay: 1.0 + k * 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <button
                type="button"
                onMouseEnter={() => setHold(k)}
                onMouseLeave={() => setHold(null)}
                onFocus={() => setHold(k)}
                onBlur={() => setHold(null)}
                className={`relative grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 overflow-hidden rounded-[20px] border px-4 py-4 text-left transition-[background-color,border-color,box-shadow] duration-500 sm:gap-x-5 sm:px-5 ${
                  on ? 'border-accent/30 bg-surface shadow-[0_26px_54px_-36px_rgba(160,16,40,0.6)]' : 'border-rule/80 bg-surface/45'
                }`}
              >
                <span
                  className="tabular select-none pt-0.5 text-[clamp(2.4rem,3.6vw,3.1rem)] font-[850] leading-[0.82] tracking-[-0.04em] transition-colors duration-500"
                  style={{ fontStretch: '118%', WebkitTextStroke: `1.5px ${on ? t.accent : theme === 'dark' ? `${t.ink3}99` : t.rule2}`, color: on ? t.accent : 'transparent' }}
                  aria-hidden
                >
                  {String(k + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-[clamp(16.5px,1.45vw,19px)] font-[760] leading-tight tracking-[-0.015em] text-ink" style={{ fontStretch: '106%' }}>
                      {w.title}
                    </span>
                    <span className={`rounded-full px-2 py-[3px] text-[10px] font-[760] uppercase leading-none tracking-[0.11em] transition-colors duration-500 ${on ? 'bg-accent text-white' : 'bg-paper-2 text-ink-3'}`}>
                      {w.kind} · {w.at}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[14.5px] leading-[1.55] text-ink-2">{w.text}</span>
                </span>
                {!reduce && <span ref={(el) => void (bars.current[k] = el)} className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-accent/70" aria-hidden />}
              </button>
            </motion.li>
          );
        })}
      </ol>

      {/* ---------------- the loop and its walls ---------------- */}
      <div className="[grid-area:fig] mx-auto mt-10 w-full max-w-[400px] sm:max-w-[520px] lg:mt-2 lg:max-w-[590px] lg:self-center">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label="The evolving loop: the world provides tasks, humans guide learning, agents produce verifiable outcomes. A wall stands on each stretch of the loop: two bottlenecks and a challenge."
        >
          <BrickDefs id="pw" />
          <defs>
            <radialGradient id="pw-halo">
              <stop offset="0%" stopColor={t.accent} stopOpacity={theme === 'dark' ? 0.12 : 0.07} />
              <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="pw-wall">
              <stop offset="0%" stopColor={t.accent} stopOpacity={theme === 'dark' ? 0.34 : 0.22} />
              <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={O.x} cy={O.y} r={R - 40} fill="url(#pw-halo)" />

          {/* the loop: dotted up to each wall, faint past it */}
          {ARCS.map((_, k) => {
            const end = arcAt(k, 1);
            const pre = arcAt(k, 0.97);
            const ang = (Math.atan2(end.y - pre.y, end.x - pre.x) * 180) / Math.PI;
            const lit = seen && focus === k;
            return (
              <motion.g key={k} initial={reduce ? false : { opacity: 0 }} animate={seen ? { opacity: 1 } : undefined} transition={{ duration: 0.5, delay: 0.25 + k * 0.15 }}>
                <path d={arcPath(k, 0, WALL_U)} fill="none" stroke={lit ? t.accent : t.ink3} strokeOpacity={lit ? 0.75 : 0.5} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="0.5 10" style={{ transition: 'stroke .5s, stroke-opacity .5s' }} />
                <path d={arcPath(k, WALL_U, 1)} fill="none" stroke={t.ink3} strokeOpacity={0.2} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="0.5 10" />
                <path d="M -10 -6.5 L 0 0 L -10 6.5" transform={`translate(${end.x} ${end.y}) rotate(${ang})`} fill="none" stroke={t.ink3} strokeOpacity={0.35} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </motion.g>
            );
          })}

          {/* the middle: what the loop runs into */}
          <motion.g initial={reduce ? false : { opacity: 0, y: 8 }} animate={seen ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.6, delay: 0.55 }}>
            <text x={O.x} y={O.y - 34 * fs} textAnchor="middle" fill={t.ink3} style={{ fontSize: 12 * fs, fontWeight: 760, letterSpacing: '0.18em' }}>
              THE EVOLVING LOOP
            </text>
            <text x={O.x} y={O.y + 4 * fs} textAnchor="middle" fill={t.ink} style={{ fontSize: 31 * fs, fontWeight: 800, letterSpacing: '-0.02em', fontStretch: '110%' }}>
              <tspan fill={t.accent}>2</tspan> bottlenecks
            </text>
            <text x={O.x} y={O.y + 40 * fs} textAnchor="middle" fill={t.ink} style={{ fontSize: 31 * fs, fontWeight: 800, letterSpacing: '-0.02em', fontStretch: '110%' }}>
              <tspan fill={t.accent}>1</tspan> challenge
            </text>
          </motion.g>

          {/* World, Human, Agent, and what each brings to the loop (outside the ring) */}
          {NODES.map((n, k) => {
            const p = pt(n.a);
            const cy = k === 0 ? p.y - NODE_R - 15 : p.y + NODE_R + 25 * fs;
            const lit = seen && focus === k;
            return (
              <motion.g
                key={n.key}
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={seen ? { scale: 1, opacity: 1 } : undefined}
                transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.1 + k * 0.12 }}
              >
                <circle cx={p.x} cy={p.y} r={NODE_R + 8} fill={t.accent} opacity={lit ? (theme === 'dark' ? 0.16 : 0.09) : 0} style={{ transition: 'opacity .5s' }} />
                <circle cx={p.x} cy={p.y} r={NODE_R} fill={nodeFill} stroke={lit ? `${t.accent}80` : t.rule} strokeWidth={1.6} filter="url(#pw-sh)" style={{ transition: 'stroke .5s' }} />
                <g transform={`translate(${p.x - 16} ${p.y - 25})`}>
                  <Icon icon={n.icon} size={32} stroke={1.7} color={t.ink} />
                </g>
                <text x={p.x} y={p.y + 25} textAnchor="middle" fill={t.ink} style={{ fontSize: 13.5 * Math.min(fs, 1.2), fontWeight: 760, letterSpacing: '0.01em' }}>
                  {n.key}
                </text>
                <text x={p.x} y={cy} textAnchor="middle" fill={lit ? t.accent : t.ink3} style={{ fontSize: 14.5 * fs, fontWeight: 500, fontStyle: 'italic', fontFamily: 'var(--font-serif)', transition: 'fill .5s' }}>
                  {n.does}
                </text>
              </motion.g>
            );
          })}

          {/* the light, and the spark where it hits */}
          {!reduce && (
            <>
              {Array.from({ length: TRAIL }, (_, i) => (
                <circle key={i} ref={(el) => void (trail.current[i] = el)} r={5.5 - i * 0.55} fill={t.accent} opacity={0} />
              ))}
              <g ref={spark}>
                <circle ref={sparkRing} r={13} fill="none" stroke={t.accent} strokeWidth={2.4} opacity={0} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
              </g>
              <g ref={light} opacity={0}>
                <circle r={15} fill={t.accent} opacity={0.16} />
                <circle r={7.5} fill={t.accent} />
                <circle r={2.8} fill="#fff" />
              </g>
            </>
          )}

          {/* the walls */}
          {walls.map((w, k) => {
            const p = arcAt(k, WALL_U);
            const on = seen && focus === k;
            const yb = p.y + 4; // the bottom row; the stack is centred on the loop
            const lo = on ? t.accent : grey[1];
            const hi = on ? (theme === 'dark' ? '#ff6f86' : '#e2405a') : grey[0];
            return (
              <motion.g
                key={w.title}
                initial={reduce ? false : { y: -110, opacity: 0 }}
                animate={seen ? { y: 0, opacity: 1 } : undefined}
                transition={{ y: { type: 'spring', stiffness: 430, damping: 16, delay: 1.0 + k * 0.25 }, opacity: { duration: 0.15, delay: 1.0 + k * 0.25 } }}
              >
                <g ref={(el) => void (shake.current[k] = el)}>
                  <ellipse cx={p.x} cy={p.y} rx={70} ry={56} fill="url(#pw-wall)" opacity={on ? 1 : 0} style={{ transition: 'opacity .5s' }} />
                  <Brick x={p.x - WB.w - 1} y={yb} w={WB.w} h={WB.h} color={lo} studs={2} defs="pw" />
                  <Brick x={p.x + 1} y={yb} w={WB.w} h={WB.h} color={lo} studs={2} defs="pw" />
                  <Brick x={p.x - WB.w / 2} y={yb - WB.h - WB.gap} w={WB.w} h={WB.h} color={hi} studs={2} defs="pw" />
                  {/* the number sits on the side the light does not come from */}
                  <g transform={`translate(${k === 0 ? p.x - WB.w - 4 : p.x + WB.w + 4} ${yb - WB.h - 6})`}>
                    <circle r={12.5} fill={on ? t.accent : nodeFill} stroke={on ? nodeFill : t.rule2} strokeWidth={on ? 2.5 : 1.5} style={{ transition: 'fill .4s' }} />
                    <text y={4.6} textAnchor="middle" fill={on ? '#fff' : t.ink2} style={{ fontSize: 13, fontWeight: 820 }}>
                      {k + 1}
                    </text>
                  </g>
                </g>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
