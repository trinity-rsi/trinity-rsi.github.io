import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A tiny motion-graphics clock: returns p in [0, 1) that loops every `duration` seconds
 * while `running`. Every element of an illustration is a pure function of p, so a whole
 * choreography stays in perfect sync and can be paused or scrubbed.
 */
export function useLoopClock(duration: number, running: boolean, initial = 0) {
  const [p, setP] = useState(initial);
  const pRef = useRef(initial);
  const startRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    startRef.current = performance.now() - pRef.current * duration * 1000;
    const tick = (now: number) => {
      const v = (((now - startRef.current) / 1000) % duration) / duration;
      pRef.current = v;
      setP(v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, duration]);
  // stable across renders (it is used in effect dependencies), and a running clock continues from v
  const set = useCallback(
    (v: number) => {
      pRef.current = v;
      startRef.current = performance.now() - v * duration * 1000;
      setP(v);
    },
    [duration]
  );
  return [p, set] as const;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 0 → 1 as p moves from a to b */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
/** rises over [a, a+r], holds, falls over [b-r, b] */
export const window01 = (p: number, a: number, b: number, r = 0.04) => Math.min(seg(p, a, a + r), 1 - seg(p, b - r, b));
/** a single smooth bump centred in [a, b] */
export const bump = (p: number, a: number, b: number) => {
  const t = seg(p, a, b);
  return Math.sin(Math.PI * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Pt = { x: number; y: number };
/** point on a cubic bezier */
export const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};
/** vertical "S" link from a to b, as control points and an SVG path */
export const vlink = (a: Pt, b: Pt, k = 0.55) => {
  const dy = (b.y - a.y) * k;
  const c1 = { x: a.x, y: a.y + dy };
  const c2 = { x: b.x, y: b.y - dy };
  return { c1, c2, d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}` };
};
