import { memo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { ClosedCaptionIcon } from '@hugeicons/core-free-icons';
import { FILM_CUES, type Cue } from '@/data/film';

/**
 * The film's subtitles for the strip under the picture: the English that is spoken, the Chinese of
 * the same words beneath it. Every cue also sits unseen in the same grid cell, so the strip takes
 * the height of the longest one at the current width and never jumps between lines.
 */
export type SubtitleSize = 'phone' | 'page' | 'full';

const SIZE: Record<SubtitleSize, string> = {
  phone: 'py-2.5 text-[15px] font-[640]',
  page: 'max-w-[88ch] py-3 text-[clamp(14.5px,1.35vw,18px)] font-[620]',
  full: 'max-w-[88ch] py-4 text-[clamp(18px,2vw,26px)] font-[620]',
};

function Lines({ cue }: { cue: Cue }) {
  return (
    <>
      <span className="block leading-snug tracking-[-0.005em] text-ink">{cue[2]}</span>
      <span lang="zh-Hans" className="mt-[0.2em] block font-zh text-[0.92em] font-[500] leading-[1.5] text-ink-2">
        {cue[3]}
      </span>
    </>
  );
}

const Ghosts = memo(function Ghosts({ cls }: { cls: string }) {
  return FILM_CUES.map((c) => (
    <p key={c[0]} className={`invisible [grid-area:1/1] ${cls}`}>
      <Lines cue={c} />
    </p>
  ));
});

/** before the film starts: what you will hear and read */
export function SubtitleHint({ small = false }: { small?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 text-left font-[620] text-ink-3 ${small ? 'text-[12.5px]' : 'text-[13px]'}`}>
      <Icon icon={ClosedCaptionIcon} size={small ? 16 : 17} stroke={2} className="shrink-0" />
      <span className="leading-[1.45]">
        <span className="block">English narration, bilingual subtitles</span>
        <span lang="zh-Hans" className="block font-zh font-[500]">
          英文配音，中英双语字幕
        </span>
      </span>
    </span>
  );
}

export default function FilmSubtitles({ cue, size, hint, className = '' }: { cue: Cue | null; size: SubtitleSize; hint?: ReactNode; className?: string }) {
  const cls = SIZE[size];
  return (
    <div data-subtitles className={`grid place-items-center text-center [text-wrap:balance] ${className}`}>
      <Ghosts cls={cls} />
      <AnimatePresence mode="wait" initial={false}>
        {cue ? (
          <motion.p
            key={cue[0]}
            className={`[grid-area:1/1] ${cls}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Lines cue={cue} />
          </motion.p>
        ) : hint ? (
          <motion.div key="hint" className="[grid-area:1/1] py-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {hint}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
