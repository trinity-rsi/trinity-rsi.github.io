import Icon from '@/components/ui/Icon';
import PaperFigure from '@/components/ui/PaperFigure';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { ROLES, STAGES } from '@/data/paper';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { Opener, StageMark } from '../ui/Opener';
import { goTo } from '../chapters';
import creatorImg from '@/assets/cats/creator.webp';
import explorerImg from '@/assets/cats/explorer.webp';
import evolverImg from '@/assets/cats/evolver.webp';

/** The Trinity's three roles, then the method's stages and the Router (Section 3), each opening its chapter. */
const CAT: Record<string, string> = { creator: creatorImg, explorer: explorerImg, evolver: evolverImg };

export default function PTrinity() {
  const { t } = useTokens();
  const color = (who: string) => (who === 'creator' ? t.creator : who === 'explorer' ? t.explorer : who === 'evolver' ? t.evolver : t.ink2);
  const name = (w: string) => (w === 'router' ? 'Router' : w[0].toUpperCase() + w.slice(1));

  return (
    <section id="trinity" className="scroll-mt-16 pt-14">
      <Opener
        kicker="Three roles, one frozen backbone"
        title={
          <>
            <span style={{ color: t.creator }}>Creator</span>, <span style={{ color: t.explorer }}>Explorer</span>, <span style={{ color: t.evolver }}>Evolver</span>
          </>
        }
      >
        <p className="p-lede">World generation and Harness evolution, coupled in one loop: three roles on one frozen backbone, each with its own Harness. Every update enters only after host verification.</p>
      </Opener>

      {/* the roles */}
      <ul className="mt-6 grid grid-cols-3 gap-2 px-4">
        {ROLES.map((r) => (
          <li key={r.id} className="flex flex-col items-center rounded-[20px] border border-rule bg-surface px-2 pb-3 pt-3 text-center">
            <img src={CAT[r.id]} alt="" className="h-[74px] w-auto object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]" draggable={false} />
            <p className="mt-2 text-[15.5px] font-[780] leading-tight" style={{ color: color(r.id), fontStretch: '110%' }}>
              {r.name}
            </p>
            <p className="mt-0.5 text-[12px] font-[600] leading-snug text-ink-2">{r.verb}</p>
            <p className="mt-1 text-[11px] text-ink-3">{r.stages}</p>
          </li>
        ))}
      </ul>

      {/* the method: the stages, each a way into its chapter */}
      <div className="mt-10 px-5">
        <h3 className="p-subtitle">Three stages, then routing</h3>
        <p className="mt-1.5 text-[13px] text-ink-3">Tap a stage to go to it.</p>
      </div>
      <ol className="mx-4 mt-4 overflow-hidden rounded-[22px] border border-rule bg-surface">
        {STAGES.map((s) => (
          <li key={s.key} className="border-t border-rule first:border-t-0">
            <button type="button" onClick={() => goTo(s.href)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-paper-2">
              <StageMark stage={s.n} />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-[740] leading-tight tracking-[-0.01em] text-ink" style={{ fontStretch: '106%' }}>
                  {s.title}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {s.who.map((w) => (
                    <span key={w} className="rounded-full px-1.5 py-[1px] text-[11px] font-[720]" style={{ background: `${color(w)}1c`, color: color(w) }}>
                      {name(w)}
                    </span>
                  ))}
                </span>
              </span>
              <Icon icon={ArrowRight01Icon} size={16} stroke={2} className="shrink-0 text-ink-3" />
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-4 px-5">
        <PaperFigure fig={PAPER_FIGS.overview} label="Overview: Figure 2 in the paper" />
      </div>
    </section>
  );
}
