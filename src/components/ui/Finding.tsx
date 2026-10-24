import type { ReactNode } from 'react';

/** "Finding n" box, styled after the paper's findings. */
export default function Finding({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-rule bg-surface py-4 pl-5 pr-5">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden />
      <p className="text-[12.5px] font-[700] text-accent">Finding {n}</p>
      <p className="mt-1 text-[16px] font-[720] leading-snug text-ink">{title}</p>
      <div className="mt-2 text-[14px] leading-[1.6] text-ink-2">{children}</div>
    </div>
  );
}
