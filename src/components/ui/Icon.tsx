import { HugeiconsIcon } from '@hugeicons/react';
import type { IconSvg } from '@/data/tree';

export default function Icon({
  icon,
  size = 18,
  stroke = 1.6,
  className = '',
  color = 'currentColor',
}: {
  icon: IconSvg;
  size?: number;
  stroke?: number;
  className?: string;
  color?: string;
}) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={stroke} color={color} className={className} aria-hidden />;
}
