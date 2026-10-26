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

/** The Trinity's three roles, then the method as a sequence: three stages and the Router (Section 3). */
const CAT: Record<string, string> = { creator: creatorImg, explorer: explorerImg, evolver: evolverImg };

export default function PTrinity() {
  const { t } = useTokens();
  const color = (who: string) => (who === 'creator' ? t.creator : who === 'explorer' ? t.explorer : who === 'evolver' ? t.evolver : t.ink2);
  const name = (w: string) => (w === 'router' ? 'Router' : w[0].toUpperCase() + w.slice(1));

  return (
    <section id="trinity" className="scroll-mt-16 pt-20">
      <Opener
        kicker="Three roles, one frozen backbone"
        title={
          <>
            <span style={{ color: t.creator }}>Creator</span>, <span style={{ color: t.explorer }}>Explorer</span>, <span style={{ color: t.evolver }}>Evolver</span>
          </>
        }
      >
        <p className="p-lede">
          We propose The Trinity, a recursive self-improvement framework coupling world generation with Harness evolution. The three roles share the same frozen backbone but work through separate Harnesses, and every update enters the system only after host verification.
        </p>
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

      {/* the method, stage by stage */}
      <div className="mt-14 px-5">
        <h3 className="p-subtitle">Three stages, then routing</h3>
        <p className="p-lede mt-3">Benchmarks become a task tree, verified trajectories turn it into a capability tree, and Harnesses evolve along that tree. A Router then picks the right one for each task.</p>
        <ol className="mt-7">
          {STAGES.map((s, i) => (
            <li key={s.key} className="relative pb-8 pl-[52px] last:pb-0">
              {i < STAGES.length - 1 && <span className="absolute bottom-0 left-[14px] top-[34px] w-[2px] rounded-full bg-rule" aria-hidden />}
              <span className="absolute left-0 top-0">
                <StageMark stage={s.n} />
              </span>
              <p className="text-[12.5px] font-[700] text-ink-3">{s.kicker}</p>
              <p className="mt-0.5 text-[19px] font-[760] leading-tight tracking-[-0.015em] text-ink" style={{ fontStretch: '106%' }}>
                {s.title}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {s.who.map((w) => (
                  <span key={w} className="rounded-full px-2 py-0.5 text-[11.5px] font-[720]" style={{ background: `${color(w)}1c`, color: color(w) }}>
                    {name(w)}
                  </span>
                ))}
              </p>
              <p className="p-body mt-2.5">{s.text}</p>
              <p className="mt-2.5 flex flex-wrap gap-1.5">
                {s.parts.map((st, k) => (
                  <span key={st} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-surface px-2.5 py-1 text-[12px] font-[620] text-ink-2">
                    <span className="tabular text-[10.5px] font-[780] text-ink-3">{k + 1}</span>
                    {st}
                  </span>
                ))}
              </p>
              <button type="button" onClick={() => goTo(s.href)} className="p-press mt-3 inline-flex h-8 items-center gap-1 text-[13.5px] font-[700] text-ink">
                {s.key === 'router' ? 'See the Router' : `See ${s.title.toLowerCase()}`}
                <Icon icon={ArrowRight01Icon} size={14} stroke={2.2} />
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <PaperFigure fig={PAPER_FIGS.overview} label="Overview: Figure 2 in the paper" />
        </div>
      </div>
    </section>
  );
}
