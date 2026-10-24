import type { ReactNode } from 'react';

/** A number that is a placeholder until the paper's results are final. */
export default function Ph({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`ph tabular ${className}`} title="Placeholder value: will be replaced by the final result">
      {children}
    </span>
  );
}

export function PlaceholderNote({ children = 'Illustrative data, to be replaced by final results', className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[0.8125rem] text-ink-3 ${className}`}>
      <span className="ph inline-block h-3 w-5 rounded-[3px]" aria-hidden />
      {children}
    </span>
  );
}
