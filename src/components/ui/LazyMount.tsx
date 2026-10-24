import { type ReactNode } from 'react';
import { useNearViewport } from '@/lib/hooks';

/**
 * Mounts heavy (WebGL / canvas) children only while their box is near the viewport,
 * so the page never holds more than a couple of GPU contexts at once.
 */
export default function LazyMount({
  children,
  className = '',
  margin = '300px',
  keep = false,
  fallback = null,
}: {
  children: ReactNode;
  className?: string;
  margin?: string;
  keep?: boolean;
  fallback?: ReactNode;
}) {
  const [ref, near] = useNearViewport<HTMLDivElement>(margin);
  const show = near || (keep && ref.current?.dataset.seen === '1');
  if (near && ref.current) ref.current.dataset.seen = '1';
  return (
    <div ref={ref} className={className}>
      {show ? children : fallback}
    </div>
  );
}
