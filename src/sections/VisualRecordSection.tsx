import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import { BENCHES, DOMAINS, domainById, pathLabel, type Bench, type DomainId } from '@/data/tree';
import { e1Frame } from '@/data/media';
import { useTokens } from '@/theme/tokens';

/**
 * Appendix E.1, the visual record: for every benchmark, the final frame of a failed H0 run and of
 * a completed H4 run on the same configuration. Scores: Table 8 (simulation scores for SOON and CaP-X).
 */
type Filter = 'all' | 'train' | 'unseen' | DomainId;

function Card({ b }: { b: Bench }) {
  const { t } = useTokens();
  const d = domainById[b.domain];
  const s = b.scores.it;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_24px_50px_-30px_rgba(20,24,40,0.55)]"
    >
      <div className="grid grid-cols-2 gap-px bg-rule">
        {(['h0', 'h4'] as const).map((k) => (
          <div key={k} className="relative aspect-[16/9] overflow-hidden bg-[#0c1018]">
            <img src={e1Frame(b.id, k)} alt={`${b.name}: final frame, ${k === 'h0' ? 'H0' : 'H4'}`} loading="lazy" className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.05]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 border-b border-rule text-center text-[11px] font-[700]">
        <span style={{ color: t.bad }}>H₀ · Base Harness</span>
        <span style={{ color: t.good }}>H₄ · iteration 4</span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-[720] text-ink">
            {b.name}
            {b.rebuilt && <span className="text-ink-3">*</span>}
          </p>
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            {b.split === 'unseen' ? 'unseen' : b.split === 'both' ? 'sim. train · robot unseen' : 'train'} · {pathLabel(b.node)}
          </p>
        </div>
        <p className="tabular shrink-0 text-right text-[12.5px] leading-tight">
          <span className="text-ink-3">{s[0]}</span>
          <span className="mx-1 text-ink-3">→</span>
          <span className="font-[780] text-accent">{s[4]}</span>
        </p>
      </div>
    </motion.article>
  );
}

/** shown before "show all": one benchmark from each domain, and the two robots */
const FIRST = ['arc-agi-3', 'chess-tactics', 'soon', 'among-us', 'nethack', 'cap-x'];

export default function VisualRecordSection() {
  const [f, setF] = useState<Filter>('all');
  const [all, setAll] = useState(false);
  const full = useMemo(
    () =>
      BENCHES.filter((b) => (f === 'all' ? true : f === 'train' ? b.split !== 'unseen' : f === 'unseen' ? b.split !== 'train' : b.domain === f)),
    [f]
  );
  // until the reader asks for all of them, a filter shows its first six, and the default view a sample across the domains
  const list = all ? full : f === 'all' ? FIRST.map((id) => BENCHES.find((b) => b.id === id)!) : full.slice(0, 6);
  const hidden = full.length - list.length;
  const chips: { k: Filter; l: string }[] = [
    { k: 'all', l: `All ${BENCHES.length}` },
    { k: 'train', l: 'Train' },
    { k: 'unseen', l: 'Unseen' },
    ...DOMAINS.map((d) => ({ k: d.id as Filter, l: d.name })),
  ];
  return (
    <Section id="visual-record" tone="alt" className="py-20 sm:py-28">
      <Container wide>
        <SectionHeader kicker="Visual record · Appendix E.1" title="H₀ and H₄ on the same configuration">
          For every benchmark: the final frame of a failed run with the Base Harness H₀ and of a completed run with the iteration-4 Harness, from the same start. Rows come from recorded runs, demonstrations or scripted runs, as detailed in the paper; the scored results are those of Table 8.
        </SectionHeader>
        <div className="mt-10 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.k}
              type="button"
              onClick={() => {
                setF(c.k);
              }}
              className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-[650] transition-colors ${f === c.k ? 'text-paper' : 'text-ink-2 hover:text-ink'}`}
            >
              {f === c.k && <motion.span layoutId="vr-chip" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <span className="relative">{c.l}</span>
            </button>
          ))}
        </div>
        <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((b) => (
              <Card key={b.id} b={b} />
            ))}
          </AnimatePresence>
        </motion.div>
        {(hidden > 0 || all) && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (all) document.getElementById('visual-record')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setAll((v) => !v);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-surface px-5 text-[14px] font-[700] text-ink shadow-[0_14px_30px_-22px_rgba(20,24,40,0.5)] transition-colors hover:border-rule-2"
              aria-expanded={all}
            >
              {all ? 'Show fewer' : `Show all ${full.length}`}
              {!all && <span className="tabular rounded-full bg-paper-2 px-2 py-0.5 text-[12px] font-[700] text-ink-3">+{hidden}</span>}
            </button>
          </div>
        )}
      </Container>
    </Section>
  );
}
