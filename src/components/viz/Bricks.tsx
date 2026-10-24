import type { IconSvg } from '@/data/tree';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTokens } from '@/theme/tokens';

/**
 * The film's LEGO bricks, for the page's SVG figures (the same drawing as promo/src/kit.tsx):
 * a rounded body with studs on top, a light band, a dark foot, an optional icon and label.
 * Put <BrickDefs /> once inside the <svg> that uses them.
 */
export function BrickDefs({ id = 'bk' }: { id?: string }) {
  return (
    <defs>
      <filter id={`${id}-sh`} x="-30%" y="-40%" width="160%" height="190%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1c2233" floodOpacity="0.16" />
      </filter>
      <filter id={`${id}-glow`} x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

type BrickProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label?: string;
  labelSize?: number;
  labelColor?: string;
  icon?: IconSvg;
  studs?: number;
  /** an outlined brick: inherited, not owned */
  outline?: boolean;
  glow?: number;
  glowColor?: string;
  shadow?: boolean;
  defs?: string;
};

export function Brick({ x, y, w, h, color, label, labelSize, labelColor = '#ffffff', icon, studs, outline, glow = 0, glowColor, shadow = true, defs = 'bk' }: BrickProps) {
  const { t } = useTokens();
  const n = studs ?? Math.max(1, Math.round(w / (0.84 * h)));
  const pitch = w / n;
  const sw = Math.min(0.5 * h, pitch * 0.6);
  const sh = Math.max(2.5, 0.19 * h);
  const r = Math.min(9, h * 0.13);
  const fs = labelSize ?? Math.min(h * 0.4, 30);
  const gc = glowColor ?? t.accent;
  if (outline) {
    return (
      <g>
        {Array.from({ length: n }, (_, i) => {
          const cx = x + pitch * (i + 0.5);
          return <rect key={i} x={cx - sw / 2} y={y - sh} width={sw} height={sh + r} rx={Math.min(3.5, sh * 0.45)} fill={t.surface} stroke={color} strokeWidth={1.6} />;
        })}
        <rect x={x} y={y} width={w} height={h} rx={r} fill={t.surface} stroke={color} strokeWidth={1.8} />
        {label && (
          <text x={x + w / 2} y={y + h * 0.5 + fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight={720} fill={color} style={{ letterSpacing: '-0.01em' }}>
            {label}
          </text>
        )}
      </g>
    );
  }
  return (
    <g>
      {glow > 0.01 && <rect x={x - 8} y={y - sh - 8} width={w + 16} height={h + sh + 16} rx={r + 8} fill={gc} opacity={0.16 * glow} />}
      <g filter={shadow ? `url(#${defs}-sh)` : undefined}>
        {Array.from({ length: n }, (_, i) => {
          const cx = x + pitch * (i + 0.5);
          return (
            <g key={i}>
              <rect x={cx - sw / 2} y={y - sh} width={sw} height={sh + r} rx={Math.min(4, sh * 0.45)} fill={color} />
              <rect x={cx - sw / 2} y={y - sh} width={sw} height={sh + r} rx={Math.min(4, sh * 0.45)} fill="#000" opacity={0.06} />
              <rect x={cx - sw / 2 + sw * 0.12} y={y - sh + 1.1} width={sw * 0.32} height={sh * 0.62} rx={1.3} fill="#fff" opacity={0.42} />
            </g>
          );
        })}
        <rect x={x} y={y} width={w} height={h} rx={r} fill={color} />
      </g>
      <rect x={x} y={y} width={w} height={h * 0.36} rx={r} fill="#fff" opacity={0.2} />
      <rect x={x + 1} y={y + h - h * 0.14} width={w - 2} height={h * 0.14} rx={r * 0.7} fill="#000" opacity={0.14} />
      {glow > 0.01 && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={r + 3} fill="none" stroke={gc} strokeWidth={2.6} opacity={glow} />}
      {icon && (
        <g transform={`translate(${x + h * 0.3} ${y + h * 0.5 - fs * 0.52})`}>
          <HugeiconsIcon icon={icon} size={fs * 1.05} color={labelColor} strokeWidth={2} />
        </g>
      )}
      {label && (
        <text
          x={icon ? x + h * 0.3 + fs * 1.42 : x + w / 2}
          y={y + h * 0.5 + fs * 0.36}
          textAnchor={icon ? 'start' : 'middle'}
          fontSize={fs}
          fontWeight={720}
          fill={labelColor}
          style={{ fontStretch: '104%', letterSpacing: '-0.01em' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** a grey base plate a node's bricks stand on */
export function Plate({ x, y, w, h = 12, studs = true }: { x: number; y: number; w: number; h?: number; studs?: boolean }) {
  const { theme } = useTokens();
  const top = theme === 'dark' ? '#2a3146' : '#d9dee7';
  const edge = theme === 'dark' ? '#222839' : '#c6ccd8';
  const n = Math.max(1, Math.round(w / 15));
  return (
    <g>
      {studs &&
        Array.from({ length: n }, (_, i) => {
          const cx = x + (w / n) * (i + 0.5);
          return <rect key={i} x={cx - 4} y={y - 3} width={8} height={4.5} rx={1.6} fill={top} />;
        })}
      <rect x={x} y={y} width={w} height={h} rx={h * 0.4} fill={top} />
      <rect x={x} y={y + h * 0.62} width={w} height={h * 0.38} rx={h * 0.3} fill={edge} />
    </g>
  );
}
