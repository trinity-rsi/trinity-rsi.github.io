import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FLOWS, PAPER, ROLES } from '@/data/paper';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import creatorImg from '@/assets/cats/creator.webp';
import explorerImg from '@/assets/cats/explorer.webp';
import evolverImg from '@/assets/cats/evolver.webp';

/**
 * The Trinity as a triangle (Figure 2), drawn for a phone: Evolver on top, Creator and Explorer
 * below, two flows on every side. The six labels are too long to sit on the arcs at this size, so
 * one side at a time comes forward and its two flows are spelled out underneath; it moves on by
 * itself, or with a tap. Feedback flows are purple, the flows that build or evolve something ink.
 */
type RoleId = 'creator' | 'explorer' | 'evolver';
type P = [number, number];
type Side = 'base' | 'right' | 'left';

const VB = { w: 360, h: 300 };
const CAT: Record<RoleId, { x: number; top: number; h: number; ar: number; img: string; nameY: number }> = {
  evolver: { x: 180, top: 2, h: 92, ar: 0.933, img: evolverImg, nameY: 114 },
  creator: { x: 58, top: 172, h: 84, ar: 0.747, img: creatorImg, nameY: 278 },
  explorer: { x: 302, top: 172, h: 84, ar: 0.899, img: explorerImg, nameY: 278 },
};

const ARC: Record<string, { side: Side; P: [P, P, P, P] }> = {
  'creator>explorer': { side: 'base', P: [[98, 200], [140, 181], [220, 181], [262, 200]] },
  'explorer>creator': { side: 'base', P: [[262, 238], [220, 259], [140, 259], [98, 238]] },
  'explorer>evolver': { side: 'right', P: [[270, 186], [242, 178], [210, 152], [203, 126]] },
  'evolver>explorer': { side: 'right', P: [[228, 48], [298, 50], [344, 114], [318, 170]] },
  'creator>evolver': { side: 'left', P: [[42, 170], [16, 114], [62, 50], [132, 48]] },
  'evolver>creator': { side: 'left', P: [[157, 126], [150, 152], [118, 178], [90, 186]] },
};
const SIDES: Side[] = ['base', 'right', 'left'];
const SIDE_ROLES: Record<Side, [RoleId, RoleId]> = { base: ['creator', 'explorer'], right: ['explorer', 'evolver'], left: ['creator', 'evolver'] };
const DWELL = 4.2; // seconds a side stays forward

const FLOW_LIST = FLOWS.map((f, i) => {
  const a = ARC[`${f.from}>${f.to}`];
  return { i, from: f.from as RoleId, to: f.to as RoleId, label: f.label, feedback: /feedback/i.test(f.label), side: a.side, P: a.P };
});

const d = (P: P[]) => `M ${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`;
const headAngle = (P: P[]) => (Math.atan2(P[3][1] - P[2][1], P[3][0] - P[2][0]) * 180) / Math.PI;
const roleName = (id: RoleId) => ROLES.find((r) => r.id === id)!.name;

export default function PTriangle() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('0px');
  const [k, setK] = useState(0);
  const [held, setHeld] = useState(false);
  const fill = useRef<HTMLSpanElement>(null);
  const side = SIDES[k];
  const roleColor: Record<RoleId, string> = { creator: t.creator, explorer: t.explorer, evolver: t.evolver };
  const ink = theme === 'dark' ? '#c9cedc' : '#2a2f3d';
  const purple = t.caps.b;

  // one side after another while the figure is on screen; a tap takes over for a while
  useEffect(() => {
    if (reduce || !near || held) {
      if (fill.current) fill.current.style.transform = 'scaleX(1)';
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = (now - t0) / 1000 / DWELL;
      if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, u)})`;
      if (u >= 1) setK((v) => (v + 1) % 3);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [k, near, held, reduce]);

  useEffect(() => {
    if (!held) return;
    const id = window.setTimeout(() => setHeld(false), 9000);
    return () => window.clearTimeout(id);
  }, [held, k]);

  const pick = (i: number) => {
    setK(i);
    setHeld(true);
  };
  const flows = FLOW_LIST.filter((f) => f.side === side);

  return (
    <div ref={ref} className="select-none">
      <button type="button" onClick={() => pick((k + 1) % 3)} className="relative block w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }} aria-label="The three roles and the flows between them; tap for the next pair">
        <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full overflow-visible" style={{ fontFamily: 'var(--font-display)' }} aria-hidden>
          <defs>
            {FLOW_LIST.map((f) => (
              <path key={f.i} id={`ptri-${f.i}`} d={d(f.P)} />
            ))}
          </defs>
          {FLOW_LIST.map((f) => {
            const on = f.side === side;
            const c = f.feedback ? purple : ink;
            return (
              <g key={f.i} style={{ opacity: on ? 1 : 0.2, transition: 'opacity .5s ease' }}>
                {on && <path d={d(f.P)} stroke={c} strokeOpacity={theme === 'dark' ? 0.16 : 0.1} strokeWidth={9} strokeLinecap="round" fill="none" />}
                <path d={d(f.P)} stroke={c} strokeWidth={on ? 2.3 : 1.6} strokeLinecap="round" fill="none" style={{ transition: 'stroke-width .4s' }} />
                <path d="M -7.5 -5 L 0 0 L -7.5 5" transform={`translate(${f.P[3][0]} ${f.P[3][1]}) rotate(${headAngle(f.P)})`} fill="none" stroke={c} strokeWidth={on ? 2.4 : 1.7} strokeLinecap="round" strokeLinejoin="round" />
                {on && !reduce && (
                  <g key={`${side}-${f.i}`} opacity={0}>
                    <circle r={7} fill={c} opacity={0.2} />
                    <circle r={3.4} fill={c} />
                    <circle r={1.2} fill="#fff" opacity={0.9} />
                    <animateMotion dur="2.1s" begin={`${f.i % 2 ? 1.05 : 0}s`} repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.3 1">
                      <mpath href={`#ptri-${f.i}`} />
                    </animateMotion>
                    <animate attributeName="opacity" dur="2.1s" begin={`${f.i % 2 ? 1.05 : 0}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.14;0.8;1" />
                  </g>
                )}
              </g>
            );
          })}
          <text x={180} y={225} textAnchor="middle" fill={t.ink} style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.01em', fontStretch: '108%' }}>
            Co-evolution
          </text>
          {(Object.keys(CAT) as RoleId[]).map((id) => {
            const lit = SIDE_ROLES[side].includes(id);
            return (
              <text key={id} x={CAT[id].x} y={CAT[id].nameY} textAnchor="middle" fill={roleColor[id]} style={{ fontSize: 16, fontWeight: 780, fontStretch: '112%', opacity: lit ? 1 : 0.4, transition: 'opacity .5s' }}>
                {roleName(id)}
              </text>
            );
          })}
        </svg>
        {(Object.keys(CAT) as RoleId[]).map((id, i) => {
          const c = CAT[id];
          const lit = SIDE_ROLES[side].includes(id);
          const w = c.h * c.ar;
          return (
            <span
              key={id}
              className="absolute block"
              style={{
                left: `${((c.x - w / 2) / VB.w) * 100}%`,
                top: `${(c.top / VB.h) * 100}%`,
                width: `${(w / VB.w) * 100}%`,
                height: `${(c.h / VB.h) * 100}%`,
                opacity: lit ? 1 : 0.45,
                transform: lit ? 'scale(1)' : 'scale(0.94)',
                transition: 'opacity .5s ease, transform .6s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <span className="absolute inset-[-14%] rounded-full blur-xl" style={{ background: `radial-gradient(circle, ${roleColor[id]}40, transparent 66%)`, opacity: lit ? 1 : 0, transition: 'opacity .5s' }} aria-hidden />
              <img src={c.img} alt="" draggable={false} className="p-bob relative block h-full w-full object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]" style={{ animationDelay: `${-i * 1.3}s` }} />
            </span>
          );
        })}
      </button>

      {/* the two flows of the side in front */}
      <div className="relative mt-1 h-[78px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={side}
            className="absolute inset-0 grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            aria-live="polite"
          >
            {flows.map((f) => (
              <div key={f.i} className="min-w-0">
                <p className="text-[12px] font-[680]">
                  <span style={{ color: roleColor[f.from] }}>{roleName(f.from)}</span>
                  <span className="mx-1 text-ink-3">to</span>
                  <span style={{ color: roleColor[f.to] }}>{roleName(f.to)}</span>
                </p>
                <p className="mt-0.5 text-[15px] font-[720] leading-[1.22] tracking-[-0.01em]" style={{ color: f.feedback ? purple : t.ink, fontStretch: '104%' }}>
                  {f.label}
                </p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* which side is in front, and how long it stays */}
      <div className="mt-2 flex items-center gap-1.5">
        {SIDES.map((s, i) => (
          <button key={s} type="button" onClick={() => pick(i)} className="group flex h-6 flex-1 items-center" aria-label={`Show ${roleName(SIDE_ROLES[s][0])} and ${roleName(SIDE_ROLES[s][1])}`} aria-pressed={i === k}>
            <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-rule">
              {i < k && <span className="absolute inset-0 bg-ink-3" />}
              {i === k && <span ref={fill} className="absolute inset-0 origin-left bg-ink" style={{ transform: 'scaleX(0)' }} />}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-[#1b2131] px-3 py-2 text-[12.5px] font-[620] text-[#e9ecf4]">
        <span className="font-serif text-[14px] italic">
          f<sub className="text-[10px]">θ</sub>
        </span>
        one frozen backbone, {PAPER.backbone}
      </p>
    </div>
  );
}
