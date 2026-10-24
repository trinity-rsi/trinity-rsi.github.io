import { useTokens } from '@/theme/tokens';

/**
 * Front-view LEGO bricks, the page's building-block language: a Harness is a stack of module
 * bricks, inherited bricks are grey, bricks earned at a node are cardinal, Creator's worlds amber.
 */
export function useLegoPalette() {
  const { t, theme } = useTokens();
  const dark = theme === 'dark';
  return {
    t,
    dark,
    slate: dark ? '#56617e' : '#aab3c4',
    plate: dark ? '#262d40' : '#d9dee7',
    plateEdge: dark ? '#323a52' : '#c6ccd8',
  };
}

/** a brick whose bottom-left corner sits at (x, y + h) — studs stick out above y */
export function LegoBrick({
  x,
  y,
  w,
  h,
  color,
  studs,
  outline,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  studs?: number;
  outline?: string;
}) {
  const n = studs ?? Math.max(1, Math.round(w / (h * 1.45)));
  const sw = Math.min(w / n - 1.6, h * 0.62);
  const sh = Math.max(1.4, h * 0.3);
  const r = Math.min(2.4, h * 0.32);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cx = x + (w / n) * (i + 0.5);
        return (
          <g key={i}>
            <rect x={cx - sw / 2} y={y - sh + 0.4} width={sw} height={sh + 0.6} rx={Math.min(1.2, sh / 2)} fill={color} />
            <rect x={cx - sw / 2} y={y - sh + 0.4} width={sw * 0.45} height={sh * 0.7} rx={0.6} fill="#ffffff" opacity={0.28} />
          </g>
        );
      })}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={color} stroke={outline} strokeWidth={outline ? 1.2 : undefined} />
      <rect x={x} y={y} width={w} height={h * 0.38} rx={r} fill="#ffffff" opacity={0.2} />
      <rect x={x + 0.5} y={y + h - Math.max(1.2, h * 0.16)} width={w - 1} height={Math.max(1.2, h * 0.16)} rx={0.6} fill="#000000" opacity={0.14} />
    </g>
  );
}

export function LegoPlate({ x, y, w, h = 4 }: { x: number; y: number; w: number; h?: number }) {
  const P = useLegoPalette();
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={P.plate} />
      <rect x={x} y={y + h - 1.2} width={w} height={1.2} rx={0.6} fill={P.plateEdge} />
    </g>
  );
}
