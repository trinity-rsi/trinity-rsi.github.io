import type { ReactNode } from 'react';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import StrokeText from '@/components/reactbits/StrokeText/StrokeText';
import { useTokens } from '@/theme/tokens';

/** a section's header: optional stroked numeral, kicker, a title that rises in letter by letter, prose and an aside */
export default function SectionHeader({ n, kicker, title, children, aside, color }: { n?: string; kicker: string; title: string; children?: ReactNode; aside?: ReactNode; color?: string }) {
  const { t } = useTokens();
  const c = color ?? t.accent;
  return (
    <div className="grid items-end gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="flex items-start gap-5 sm:gap-7">
        {n && (
          <div className="-mt-3 shrink-0 select-none leading-none" aria-hidden>
            <StrokeText text={n} trigger="scroll" fontSize={150} fontWeight={850} fontFamily="'Hubot Sans Variable', sans-serif" strokeColor={c} fillColor={t.accentWash} strokeWidth={1.6} drawDuration={1.5} fillDelay={0.1} letterSpacing={-6} className="block w-[72px] sm:w-[108px]" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-[700]" style={{ color: c }}>
            {kicker}
          </p>
          <h2 className="display-lg mt-2 text-[clamp(2.3rem,5vw,4.4rem)] text-ink">
            <SplitText text={title} tag="span" splitType="words, chars" effect="rise" delay={18} duration={0.7} textAlign="left" mask className="!block" />
          </h2>
          {children && <div className="prose-serif mt-5">{children}</div>}
        </div>
      </div>
      {aside && <div className="lg:pb-2">{aside}</div>}
    </div>
  );
}
