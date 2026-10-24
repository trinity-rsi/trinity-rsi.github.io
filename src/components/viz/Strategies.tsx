import { useId, useMemo, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cards01Icon,
  Chess01Icon,
  Film01Icon,
  Grid3x3Icon,
  MazeIcon,
  Robot01Icon,
  BrickWallIcon,
  Book01Icon,
} from '@hugeicons/core-free-icons';
import { useTokens, type Tokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { bez, bump, easeInOut, easeOut, easeOutBack, lerp, seg, useLoopClock, vlink, window01, type Pt } from '@/lib/anim';
import type { IconSvg } from '@/data/tree';

/**
 * Three ways to organise Harness evolution (Introduction of the paper), drawn as little
 * motion-graphics scenes. A Harness is a stack of module bricks; tasks are tiles.
 *   1. one global Harness pulled between conflicting demands
 *   2. one isolated Harness per task: duplicated modules, nothing for an unseen task
 *   3. a capability tree: shared modules flow down, an unseen task is routed and composed
 */

const VW = 360;
const VH = 240;

type Palette = ReturnType<typeof usePalette>;
function usePalette() {
  const { t, theme } = useTokens();
  const dark = theme === 'dark';
  return {
    t,
    dark,
    slate: dark ? '#465069' : '#b4bccb',
    slateHi: dark ? '#56617e' : '#c9d0dc',
    plate: dark ? '#1b2132' : '#dfe3ea',
    tile: dark ? '#161b29' : '#ffffff',
    tileEdge: dark ? 'rgba(255,255,255,0.08)' : 'rgba(18,20,28,0.08)',
    shadow: dark ? '#000000' : '#283048',
    shadowOp: dark ? 0.55 : 0.16,
    bg0: dark ? '#121726' : '#f7f8fb',
    bg1: dark ? '#0d111c' : '#eef0f5',
    dot: dark ? 'rgba(255,255,255,0.06)' : 'rgba(18,20,28,0.07)',
  };
}

/** run the clock only while the scene is on screen */
function useScene(duration: number) {
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('0px');
  const [p] = useLoopClock(duration, near && !reduce, 0.62);
  return { ref, p };
}

function Scene({ children, label, sceneRef }: { children: (ids: Ids) => ReactNode; label: string; sceneRef: React.Ref<HTMLDivElement> }) {
  const P = usePalette();
  const uid = useId().replace(/:/g, '');
  const ids: Ids = { shadow: `sh-${uid}`, glow: `gl-${uid}`, dots: `dt-${uid}`, bg: `bg-${uid}` };
  return (
    <div ref={sceneRef} className="relative overflow-hidden rounded-[14px]" style={{ boxShadow: `inset 0 0 0 1px ${P.tileEdge}` }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="block h-auto w-full" role="img" aria-label={label}>
        <defs>
          <filter id={ids.shadow} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2.2" stdDeviation="2.4" floodColor={P.shadow} floodOpacity={P.shadowOp} />
          </filter>
          <filter id={ids.glow} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={ids.dots} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill={P.dot} />
          </pattern>
          <radialGradient id={ids.bg} cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor={P.bg0} />
            <stop offset="100%" stopColor={P.bg1} />
          </radialGradient>
        </defs>
        <rect width={VW} height={VH} fill={`url(#${ids.bg})`} />
        <rect width={VW} height={VH} fill={`url(#${ids.dots})`} />
        {children(ids)}
      </svg>
    </div>
  );
}
type Ids = { shadow: string; glow: string; dots: string; bg: string };

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */
function Brick({
  x,
  y,
  w = 34,
  h = 9,
  fill,
  ghost,
  P,
  opacity = 1,
  scale = 1,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  fill: string;
  ghost?: boolean;
  P: Palette;
  opacity?: number;
  scale?: number;
}) {
  const sw = Math.max(4, w * 0.17);
  return (
    <g opacity={opacity} transform={`translate(${x + w / 2} ${y + h}) scale(${scale}) translate(${-w / 2} ${-h})`}>
      {ghost ? (
        <rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={2.6} fill="none" stroke={P.t.ink3} strokeOpacity={0.55} strokeDasharray="2.5 2" />
      ) : (
        <>
          <rect x={w * 0.2} y={-2.6} width={sw} height={3.4} rx={1.2} fill={fill} />
          <rect x={w * 0.62} y={-2.6} width={sw} height={3.4} rx={1.2} fill={fill} />
          <rect width={w} height={h} rx={2.6} fill={fill} />
          <rect width={w} height={h * 0.42} rx={2.6} fill="#ffffff" opacity={0.2} />
          <rect y={h - 1.6} width={w} height={1.6} rx={0.8} fill="#000000" opacity={0.12} />
        </>
      )}
    </g>
  );
}

function Plate({ cx, y, w, P }: { cx: number; y: number; w: number; P: Palette }) {
  return <rect x={cx - w / 2} y={y} width={w} height={5} rx={2.5} fill={P.plate} />;
}

function Tile({
  c,
  icon,
  color,
  P,
  ids,
  ring,
  ringOpacity = 1,
  dashed,
  opacity = 1,
  scale = 1,
  label,
}: {
  c: Pt;
  icon?: IconSvg;
  color: string;
  P: Palette;
  ids: Ids;
  ring?: string;
  ringOpacity?: number;
  dashed?: boolean;
  opacity?: number;
  scale?: number;
  label?: string;
}) {
  const s = 34;
  return (
    <g opacity={opacity} transform={`translate(${c.x} ${c.y}) scale(${scale})`}>
      {dashed ? (
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={10} fill={P.dark ? '#0f1320' : '#fbfbfd'} stroke={P.t.ink3} strokeDasharray="3 2.6" strokeWidth={1.2} />
      ) : (
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={10} fill={P.tile} filter={`url(#${ids.shadow})`} />
      )}
      {!dashed && <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={10} fill="none" stroke={P.tileEdge} />}
      {ring && <rect x={-s / 2 - 2.5} y={-s / 2 - 2.5} width={s + 5} height={s + 5} rx={12} fill="none" stroke={ring} strokeWidth={1.8} opacity={ringOpacity} />}
      {icon && (
        <g transform="translate(-8.5 -8.5)" color={color}>
          <HugeiconsIcon icon={icon} size={17} strokeWidth={1.8} />
        </g>
      )}
      {label && (
        <text y={5.5} textAnchor="middle" fontSize={16} fontWeight={760} fill={P.t.ink3}>
          {label}
        </text>
      )}
    </g>
  );
}

function Particle({ at, color, ids, r = 2.8, opacity = 1 }: { at: Pt; color: string; ids: Ids; r?: number; opacity?: number }) {
  return <circle cx={at.x} cy={at.y} r={r} fill={color} filter={`url(#${ids.glow})`} opacity={opacity} />;
}

function Tag({ at, text, color, P, opacity = 1 }: { at: Pt; text: string; color: string; P: Palette; opacity?: number }) {
  const w = text.length * 6.1 + 14;
  return (
    <g opacity={opacity} transform={`translate(${at.x} ${at.y})`}>
      <rect x={-w / 2} y={-9} width={w} height={18} rx={9} fill={color} />
      <text y={4} textAnchor="middle" fontSize={10.5} fontWeight={720} fill="#ffffff">
        {text}
      </text>
      <path d="M -4 9 L 0 13.5 L 4 9 Z" fill={color} />
    </g>
  );
}

const linkPt = (a: Pt, b: Pt, k: number, t: number) => {
  const { c1, c2 } = vlink(a, b, k);
  return bez(a, c1, c2, b, t);
};

/* ------------------------------------------------------------------ */
/* 1 · one global Harness                                              */
/* ------------------------------------------------------------------ */
const G_TASKS: { icon: IconSvg; d: keyof Tokens['domains'] }[] = [
  { icon: Grid3x3Icon, d: 'rule' },
  { icon: Robot01Icon, d: 'percep' },
  { icon: Cards01Icon, d: 'multi' },
  { icon: Film01Icon, d: 'percep' },
  { icon: Chess01Icon, d: 'constraint' },
  { icon: MazeIcon, d: 'long' },
];
const G_X = [38, 95, 152, 209, 266, 323];

export function GlobalHarness() {
  const P = usePalette();
  const { t } = P;
  const { ref, p } = useScene(7.5);

  // conflict A (needs speed) then conflict B (needs depth)
  const a = window01(p, 0.26, 0.54, 0.06);
  const b = window01(p, 0.56, 0.84, 0.06);
  const tilt = -7 * easeInOut(a) + 7 * easeInOut(b) + Math.sin(p * Math.PI * 18) * 0.6 * (a + b);
  const base: Pt = { x: 180, y: 114 };
  const bricks = [P.slate, t.explorer, P.slate, t.creator, P.slateHi, t.accent];

  return (
    <Scene sceneRef={ref} label="One Harness for every task, pulled in opposite directions by conflicting demands">
      {(ids) => (
        <>
          {G_X.map((x, i) => {
            const hot = (i === 1 && a > 0.02) || (i === 4 && b > 0.02);
            const heat = i === 1 ? a : i === 4 ? b : 0;
            const tile: Pt = { x, y: 172 };
            const k = lerp(0.55, 0.12, heat);
            const L = vlink(base, tile, k);
            const flow = (p * 2.4 + i * 0.19) % 1;
            return (
              <g key={i}>
                <path d={L.d} fill="none" stroke={hot ? t.bad : t.rule2} strokeWidth={lerp(1.3, 2.4, heat)} strokeOpacity={hot ? 0.95 : 0.9} />
                <Particle at={linkPt(base, tile, k, flow)} color={hot ? t.bad : t.accent} ids={ids} r={2.4} opacity={0.85} />
              </g>
            );
          })}

          {/* the single tower, rocking between the two demands */}
          <g transform={`rotate(${tilt.toFixed(2)} ${base.x} ${base.y})`}>
            <Plate cx={base.x} y={base.y} w={50} P={P} />
            {bricks.map((c, k) => (
              <Brick key={k} x={base.x - 18} y={base.y - 10 - k * 10.5} w={36} h={9} fill={c} P={P} />
            ))}
          </g>

          {G_X.map((x, i) => {
            const g = G_TASKS[i];
            const heat = i === 1 ? a : i === 4 ? b : 0;
            // the two demands seesaw: helping one hurts the other
            const score = i === 1 ? 0.5 + 0.38 * a - 0.32 * b : i === 4 ? 0.5 + 0.38 * b - 0.32 * a : 0.46 + 0.05 * Math.sin(i * 1.7 + p * 6.28);
            return (
              <g key={`t${i}`}>
                <Tile c={{ x, y: 190 }} icon={g.icon} color={t.domains[g.d]} P={P} ids={ids} ring={heat > 0.02 ? t.bad : undefined} ringOpacity={heat} />
                <rect x={x - 14} y={213} width={28} height={4} rx={2} fill={P.plate} />
                <rect x={x - 14} y={213} width={28 * score} height={4} rx={2} fill={heat > 0.02 ? t.bad : t.ink3} opacity={0.9} />
              </g>
            );
          })}

          <Tag at={{ x: 95, y: lerp(160, 150, easeOut(a)) }} text="needs speed" color={t.bad} P={P} opacity={a} />
          <Tag at={{ x: 266, y: lerp(160, 150, easeOut(b)) }} text="needs depth" color={t.bad} P={P} opacity={b} />
          <text x={180} y={24} textAnchor="middle" fontSize={11} fontWeight={650} fill={t.ink3}>
            one Harness, every task
          </text>
        </>
      )}
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 2 · one Harness per task                                            */
/* ------------------------------------------------------------------ */
const S_X = [48, 120, 192, 264];
const S_TASKS: { icon: IconSvg; d: keyof Tokens['domains'] }[] = [
  { icon: Grid3x3Icon, d: 'rule' },
  { icon: Robot01Icon, d: 'percep' },
  { icon: Chess01Icon, d: 'constraint' },
  { icon: MazeIcon, d: 'long' },
];

export function PerTaskHarness() {
  const P = usePalette();
  const { t } = P;
  const { ref, p } = useScene(8);
  const unseen: Pt = { x: 326, y: 190 };

  // each silo grows its own tower; the teal "perception" brick is rebuilt in every silo
  const grow = (i: number, k: number) => easeOutBack(seg(p, 0.04 + k * 0.1 + i * 0.025, 0.1 + k * 0.1 + i * 0.025));
  const dup = window01(p, 0.33, 0.52, 0.04);
  const ask = window01(p, 0.5, 0.95, 0.05);
  const sweep = seg(p, 0.58, 0.82); // beam goes right → left over the silos
  const beamX = lerp(300, 18, easeInOut(sweep));
  const fail = window01(p, 0.82, 0.95, 0.03);
  const shake = Math.sin(p * Math.PI * 70) * 2.2 * fail;

  return (
    <Scene sceneRef={ref} label="One Harness per task: isolated silos rebuild the same module, and an unseen task finds nothing to reuse">
      {(ids) => (
        <>
          {S_X.map((x, i) => {
            const passed = sweep > 0 && beamX < x + 28 && beamX > x - 28;
            const tower = [P.slate, t.explorer, i % 2 ? t.creator : P.slateHi];
            return (
              <g key={i}>
                <rect
                  x={x - 30}
                  y={34}
                  width={60}
                  height={180}
                  rx={14}
                  fill={P.dark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.55)'}
                  stroke={passed ? t.bad : t.rule2}
                  strokeWidth={passed ? 1.6 : 1.1}
                  strokeDasharray="4 3"
                />
                <Plate cx={x} y={150} w={40} P={P} />
                <Brick x={x - 14} y={140} w={28} h={8} fill={P.slate} P={P} />
                {tower.map((c, k) => {
                  const g = grow(i, k);
                  return <Brick key={k} x={x - 14} y={130 - k * 10} w={28} h={8} fill={c} P={P} opacity={Math.min(1, g * 1.4)} scale={0.6 + 0.4 * g} />;
                })}
                <Tile c={{ x, y: 190 }} icon={S_TASKS[i].icon} color={t.domains[S_TASKS[i].d]} P={P} ids={ids} />
                {passed && (
                  <text x={x} y={58} textAnchor="middle" fontSize={15} fontWeight={800} fill={t.bad}>
                    ×
                  </text>
                )}
              </g>
            );
          })}

          {/* the same module, learned four times */}
          <g opacity={dup}>
            <path d={`M ${S_X[0] + 16} 124 L ${S_X[3] - 16} 124`} stroke={t.explorer} strokeWidth={1.2} strokeDasharray="2 3" />
            <Tag at={{ x: 156, y: 104 }} text="same module ×4" color={t.explorer} P={P} />
          </g>

          {/* an unseen task looks for a Harness to reuse */}
          <g transform={`translate(${shake.toFixed(2)} 0)`}>
            <Tile c={unseen} P={P} ids={ids} color={t.ink3} dashed label="?" opacity={0.35 + 0.65 * ask} scale={0.85 + 0.15 * easeOutBack(seg(p, 0.5, 0.58))} ring={fail > 0.05 ? t.bad : undefined} ringOpacity={fail} />
          </g>
          {sweep > 0 && sweep < 1 && (
            <rect x={beamX - 9} y={38} width={18} height={172} rx={9} fill={t.accent} opacity={0.1 * Math.sin(Math.PI * sweep) + 0.04} />
          )}
          <Tag at={{ x: 318, y: 156 }} text="nothing to reuse" color={t.bad} P={P} opacity={fail} />
          <text x={156} y={24} textAnchor="middle" fontSize={11} fontWeight={650} fill={t.ink3}>
            isolated Harnesses
          </text>
          <text x={326} y={24} textAnchor="middle" fontSize={11} fontWeight={650} fill={t.ink3}>
            unseen
          </text>
        </>
      )}
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 3 · a capability tree (The Trinity)                                 */
/* ------------------------------------------------------------------ */
const ROOT: Pt = { x: 180, y: 66 };
const BR = [
  { at: { x: 88, y: 128 }, label: 'Perception', color: 'explorer' as const, kids: [42, 88, 134] },
  { at: { x: 276, y: 128 }, label: 'Constraints', color: 'creator' as const, kids: [232, 276, 320] },
];
const C_TASKS: { icon: IconSvg; d: keyof Tokens['domains'] }[][] = [
  [
    { icon: Grid3x3Icon, d: 'rule' },
    { icon: MazeIcon, d: 'long' },
    { icon: Film01Icon, d: 'percep' },
  ],
  [
    { icon: Chess01Icon, d: 'constraint' },
    { icon: Cards01Icon, d: 'multi' },
    { icon: BrickWallIcon, d: 'percep' },
  ],
];

export function CapabilityTree() {
  const P = usePalette();
  const { t } = P;
  const { ref, p } = useScene(9);
  const NEW: Pt = { x: 172, y: 190 };

  const down = seg(p, 0.02, 0.18); // shared brick travels root → branches
  const landed = easeOutBack(seg(p, 0.16, 0.24));
  const toLeaves = seg(p, 0.24, 0.38);
  const skills = easeOutBack(seg(p, 0.36, 0.46));
  const appear = easeOutBack(seg(p, 0.48, 0.56));
  const route = easeInOut(seg(p, 0.56, 0.7)); // routing beam root → branch → new task
  const dock = easeOutBack(seg(p, 0.7, 0.8));
  const fade = 1 - seg(p, 0.92, 1);
  const routeTo = 0; // the new task needs "Grounding"

  const rootBase = { x: ROOT.x, y: ROOT.y + 10 };
  const brickPath = useMemo(() => BR.map((b) => ({ a: rootBase, b: { x: b.at.x, y: b.at.y - 22 } })), []);

  return (
    <Scene sceneRef={ref} label="A capability tree: shared modules flow down to every descendant, and an unseen task is routed to the branch it needs">
      {(ids) => (
        <>
          {/* edges */}
          {BR.map((b, bi) => {
            const L = vlink(rootBase, { x: b.at.x, y: b.at.y - 22 }, 0.6);
            const lit = bi === routeTo ? route : 0;
            return (
              <g key={bi}>
                <path d={L.d} fill="none" stroke={t.rule2} strokeWidth={1.4} />
                <path d={L.d} fill="none" stroke={t.accent} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lit} opacity={fade} />
                {b.kids.map((kx, ki) => {
                  const KL = vlink({ x: b.at.x, y: b.at.y + 8 }, { x: kx, y: 172 }, 0.55);
                  return <path key={ki} d={KL.d} fill="none" stroke={t.rule2} strokeWidth={1.2} />;
                })}
              </g>
            );
          })}
          {/* routing edge to the unseen task */}
          {(() => {
            const L = vlink({ x: BR[routeTo].at.x, y: BR[routeTo].at.y + 8 }, { x: NEW.x, y: NEW.y - 19 }, 0.5);
            return <path d={L.d} fill="none" stroke={t.accent} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seg(p, 0.66, 0.74)} opacity={fade} />;
          })()}

          {/* root Harness */}
          <Plate cx={ROOT.x} y={ROOT.y + 10} w={46} P={P} />
          <Brick x={ROOT.x - 17} y={ROOT.y} w={34} h={9} fill={P.slate} P={P} />
          <Brick x={ROOT.x - 17} y={ROOT.y - 10.5} w={34} h={9} fill={t.accent} P={P} />
          <text x={ROOT.x} y={ROOT.y - 22} textAnchor="middle" fontSize={11} fontWeight={700} fill={t.ink2}>
            base Harness
          </text>

          {/* shared brick in flight */}
          {down > 0 && down < 1 &&
            brickPath.map((bp, i) => {
              const at = linkPt(bp.a, bp.b, 0.6, easeInOut(down));
              return <rect key={i} x={at.x - 8} y={at.y - 4} width={16} height={7} rx={2} fill={t.accent} filter={`url(#${ids.glow})`} />;
            })}

          {/* branches: inherited brick (accent) lands on top of the local one */}
          {BR.map((b, bi) => (
            <g key={bi}>
              <Plate cx={b.at.x} y={b.at.y} w={42} P={P} />
              <Brick x={b.at.x - 15} y={b.at.y - 10} w={30} h={8.5} fill={t[b.color]} P={P} />
              <Brick x={b.at.x - 15} y={b.at.y - 20.5} w={30} h={8.5} fill={t.accent} P={P} opacity={fade * Math.min(1, landed * 1.3)} scale={0.5 + 0.5 * landed} />
              {landed < 0.98 && <Brick x={b.at.x - 15} y={b.at.y - 20.5} w={30} h={8.5} fill="none" ghost P={P} opacity={1 - landed} />}
              <text x={b.at.x + (bi ? 24 : -24)} y={b.at.y - 4} textAnchor={bi ? 'start' : 'end'} fontSize={11} fontWeight={700} fill={t.ink2}>
                {b.label}
              </text>
              {/* modules flow on to every task below */}
              {toLeaves > 0 &&
                toLeaves < 1 &&
                b.kids.map((kx, ki) => (
                  <Particle key={ki} at={linkPt({ x: b.at.x, y: b.at.y + 8 }, { x: kx, y: 172 }, 0.55, easeInOut(toLeaves))} color={t.accent} ids={ids} r={2.6} />
                ))}
            </g>
          ))}

          {/* tasks with their leaf skills */}
          {BR.map((b, bi) =>
            b.kids.map((kx, ki) => {
              const glow = bump(p, 0.34 + ki * 0.01, 0.5);
              return (
                <g key={`${bi}-${ki}`}>
                  <Tile c={{ x: kx, y: 190 }} icon={C_TASKS[bi][ki].icon} color={t.domains[C_TASKS[bi][ki].d]} P={P} ids={ids} ring={t.accent} ringOpacity={glow * 0.9} />
                  <g opacity={fade * Math.min(1, skills * 1.2)} transform={`translate(${kx + 12} ${208}) scale(${0.4 + 0.6 * skills})`} color={t.ink3}>
                    <rect x={-7} y={-7} width={14} height={14} rx={4} fill={P.tile} filter={`url(#${ids.shadow})`} />
                    <g transform="translate(-5 -5)">
                      <HugeiconsIcon icon={Book01Icon} size={10} strokeWidth={2} />
                    </g>
                  </g>
                </g>
              );
            })
          )}

          {/* the unseen task: routed, docked, composed */}
          <g opacity={fade}>
            <Tile
              c={NEW}
              P={P}
              ids={ids}
              color={t.domains.percep}
              icon={dock > 0.5 ? Robot01Icon : undefined}
              dashed={dock < 0.5}
              label={dock < 0.5 ? '?' : undefined}
              opacity={Math.min(1, appear * 1.2)}
              scale={0.7 + 0.3 * appear}
              ring={dock > 0.05 ? t.accent : undefined}
              ringOpacity={dock}
            />
            {/* the composed stack it receives */}
            <g opacity={Math.min(1, dock * 1.3)}>
              <Brick x={NEW.x + 21} y={NEW.y + 4} w={18} h={6} fill={P.slate} P={P} scale={dock} />
              <Brick x={NEW.x + 21} y={NEW.y - 4} w={18} h={6} fill={t.explorer} P={P} scale={dock} />
              <Brick x={NEW.x + 21} y={NEW.y - 12} w={18} h={6} fill={t.accent} P={P} scale={dock} />
            </g>
            <g opacity={Math.min(1, seg(p, 0.78, 0.84) * 1.5)} transform={`translate(${NEW.x - 15} ${NEW.y - 16})`}>
              <circle r={7} fill={t.good} />
              <path d="M -3 0 L -0.8 2.4 L 3.2 -2.2" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <Tag at={{ x: NEW.x, y: lerp(160, 152, easeOut(appear)) }} text="unseen task" color={t.ink2} P={P} opacity={window01(p, 0.48, 0.66, 0.04)} />
            <Tag at={{ x: NEW.x, y: 152 }} text="routed + composed" color={t.accent} P={P} opacity={window01(p, 0.76, 0.93, 0.04)} />
          </g>
        </>
      )}
    </Scene>
  );
}
