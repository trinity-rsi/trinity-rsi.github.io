import type { ReactNode } from 'react';
import Fold from '@/components/ui/Fold';

/** the words of one finding: tag, claim, a sentence, its numbers, the paper's explanation folded */
export default function Claim({ tag, title, children, figures, note }: { tag: string; title: string; children?: ReactNode; figures?: ReactNode; note?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-[700] text-accent">{tag}</p>
      <h3 className="display-md mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] text-ink">{title}</h3>
      {children && <p className="mt-3 max-w-[46ch] font-serif text-[1.06rem] leading-[1.6] text-ink-2">{children}</p>}
      {figures && <div className="mt-6 max-w-[560px]">{figures}</div>}
      {note && <Fold className="mt-5">{note}</Fold>}
    </div>
  );
}
