import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import CompareFrames from '@/components/viz/CompareFrames';
import { BENCHES, DOMAINS, domainById, pathLabel, type DomainId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';

/**
 * The visual record (Appendix E.1) on a phone: for each benchmark, the final frame of a failed H0
 * run and of a completed H4 run from the same start, one over the other; a finger drags the
 * divider between them. One benchmark at a time, paged, filtered by split or domain. Scores:
 * Table 8 (simulation scores for SOON and CaP-X).
 */
type Filter = 'all' | 'train' | 'unseen' | DomainId;
const FIRST = ['arc-agi-3', 'chess-tactics', 'soon', 'among-us', 'nethack', 'cap-x'];
const ALL = [...FIRST.map((id) => BENCHES.find((b) => b.id === id)!), ...BENCHES.filter((b) => !FIRST.includes(b.id))];

export default function PRecord() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [f, setF] = useState<Filter>('all');
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const list = useMemo(() => ALL.filter((b) => (f === 'all' ? true : f === 'train' ? b.split !== 'unseen' : f === 'unseen' ? b.split !== 'train' : b.domain === f)), [f]);
  const b = list[idx % list.length];
  const d = domainById[b.domain];
  const s = b.scores.it;
  const chips: { k: Filter; l: string }[] = [
    { k: 'all', l: `All ${BENCHES.length}` },
    { k: 'train', l: 'Train' },
    { k: 'unseen', l: 'Unseen' },
    ...DOMAINS.map((x) => ({ k: x.id as Filter, l: x.short })),
  ];
  const go = (k: number) => {
    setDir(k);
    setIdx((i) => (i + k + list.length) % list.length);
  };

  // the next benchmark's frames, decoded ahead
  useEffect(() => {
    const n = list[(idx + 1) % list.length];
    (['h0', 'h4'] as const).forEach((w) => {
      const im = new Image();
      im.src = e1Frame(n.id, w);
      im.decode?.().catch(() => undefined);
    });
  }, [list, idx]);

  return (
    <section id="visual-record" className="scroll-mt-16 pt-14">
      <Opener kicker="Visual record" title="H₀ and H₄ from the same start">
        <p className="p-lede">For every benchmark, the final frame of a failed H₀ run and of a completed H₄ run. Drag across the picture to compare.</p>
      </Opener>
      <div className="p-noscroll mt-6 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {chips.map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => {
              setF(c.k);
              setIdx(0);
              setDir(1);
            }}
            className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-[680] transition-colors ${f === c.k ? 'text-paper' : 'text-ink-2'}`}
          >
            {f === c.k && <motion.span layoutId="pr-chip" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {f !== c.k && <span className="absolute inset-0 rounded-full border border-rule bg-surface" aria-hidden />}
            <span className="relative">{c.l}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 px-3">
        <div className="overflow-hidden rounded-[20px] border border-rule bg-surface">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.article
              key={`${f}-${b.id}`}
              custom={dir}
              initial={{ opacity: 0, x: reduce ? 0 : 28 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : -20 * dir, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <CompareFrames b={b} hint={f === 'all' && idx === 0} />
              <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-[740] text-ink">
                    {b.name}
                    {b.rebuilt && <span className="text-ink-3">*</span>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {b.split === 'unseen' ? 'unseen' : b.split === 'both' ? 'sim. train, robot unseen' : 'train'}, {pathLabel(b.node)}
                  </p>
                </div>
                <p className="tabular shrink-0 text-right text-[13px] leading-tight">
                  <span className="text-ink-3">{s[0]}</span>
                  <span className="mx-1 text-ink-3">→</span>
                  <span className="text-[16px] font-[800]" style={{ color: t.accent }}>
                    {s[4]}
                  </span>
                </p>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* paging */}
        <div className="mt-3 flex items-center justify-between px-1">
          <button type="button" onClick={() => go(-1)} className="p-press grid h-11 w-11 place-items-center rounded-full border border-rule bg-surface text-ink" aria-label="Previous benchmark">
            <Icon icon={ArrowLeft01Icon} size={18} stroke={2} />
          </button>
          <p className="tabular text-[13px] font-[680] text-ink-3" aria-live="polite">
            <span className="text-ink">{(idx % list.length) + 1}</span> of {list.length}
          </p>
          <button type="button" onClick={() => go(1)} className="p-press flex h-11 items-center gap-1.5 rounded-full bg-ink pl-4 pr-3 text-[14px] font-[700] text-paper" aria-label="Next benchmark">
            Next
            <Icon icon={ArrowRight01Icon} size={17} stroke={2.2} />
          </button>
        </div>
      </div>
    </section>
  );
}
