import TrueFocus from '@/components/reactbits/TrueFocus/TrueFocus';
import ScrollStack, { ScrollStackItem } from '@/components/reactbits/ScrollStack/ScrollStack';
import { Container, Section } from '@/components/ui/Section';
import Icon from '@/components/ui/Icon';
import PaperFigure from '@/components/ui/PaperFigure';
import { STAGES } from '@/data/paper';
import { PAPER_FIGS } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { scrollToId, useMediaQuery } from '@/lib/hooks';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import evolverCollect from '@/assets/cats/evolver-collect.webp';
import evolverDiagnose from '@/assets/cats/evolver-diagnose.webp';
import group from '@/assets/cats/group.webp';
import titleCat from '@/assets/cats/titlecat.webp';

const STAGE_CAT = [evolverCollect, evolverDiagnose, group, titleCat];

export default function TrinitySection() {
  const { t } = useTokens();
  const wide = useMediaQuery('(min-width: 900px)');
  const roleColor = (who: string) => (who === 'creator' ? t.creator : who === 'explorer' ? t.explorer : who === 'evolver' ? t.evolver : t.ink2);

  return (
    <Section id="trinity" tone="alt" className="py-20 sm:py-28">
      <Container wide>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-end">
          <div>
            <p className="kicker">We propose The Trinity: three roles, one frozen backbone, separate Harnesses</p>
            <div className="mt-4 text-[clamp(2.2rem,5.6vw,5.2rem)] font-[800] leading-none tracking-[-0.035em] text-ink [font-stretch:118%] [&_span]:!font-[800]">
              <TrueFocus
                sentence="Creator Explorer Evolver"
                separator=" "
                blurAmount={wide ? 3 : 0}
                borderColor={t.accent}
                glowColor={`${t.accent}66`}
                animationDuration={0.55}
                pauseBetweenAnimations={1.4}
                focusStyle="brackets"
                cornerSize={14}
                borderWidth={3}
              />
            </div>
          </div>
          <div>
            <p className="font-serif text-[1.08rem] leading-[1.6] text-ink-2">World generation and Harness evolution, coupled in one loop. Every update enters only after host verification.</p>
            <PaperFigure fig={PAPER_FIGS.overview} className="mt-4" label="Overview: Figure 2 in the paper" />
          </div>
        </div>

      </Container>

      {/* the method, stage by stage (Section 3) */}
      <Container wide className="mt-14 sm:mt-24">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-end">
          <h2 className="display-lg text-[clamp(2rem,4.2vw,3.4rem)] text-ink">Three stages, then routing</h2>
          <p className="font-serif text-[1.08rem] leading-[1.6] text-ink-2">
            Benchmarks become a task tree, verified trajectories turn it into a capability tree, and Harnesses evolve along that tree. A Router then picks the right one for each task.
          </p>
        </div>
        {wide ? (
          <ScrollStack useWindowScroll itemDistance={60} itemStackDistance={22} stackPosition="16%" baseScale={0.9} itemScale={0.02} dimAmount={0.12} blurAmount={0} holdDistance={120}>
            {STAGES.map((s, i) => (
              <ScrollStackItem key={s.key} itemClassName="!h-auto !p-0 overflow-hidden border border-rule" style={{ background: t.surface, color: t.ink }}>
                <StageCard s={s} i={i} colorOf={roleColor} />
              </ScrollStackItem>
            ))}
          </ScrollStack>
        ) : (
          <div className="space-y-4">
            {STAGES.map((s, i) => (
              <div key={s.key} className="overflow-hidden rounded-[24px] border border-rule bg-surface">
                <StageCard s={s} i={i} colorOf={roleColor} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

function StageCard({ s, i, colorOf }: { s: (typeof STAGES)[number]; i: number; colorOf: (who: string) => string }) {
  const color = colorOf(s.who[0]);
  const name = (w: string) => (w === 'router' ? 'Router' : w[0].toUpperCase() + w.slice(1));
  return (
    <div className="grid min-h-[300px] grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex flex-col p-7 sm:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[44px] font-[820] leading-none tracking-[-0.04em] [font-stretch:120%]" style={{ color }}>
            {s.n}
          </span>
          <span className="text-[13px] font-[700] uppercase tracking-[0.12em] text-ink-3">{s.kicker}</span>
          {s.who.map((w) => (
            <span key={w} className="rounded-full px-2.5 py-1 text-[12px] font-[700]" style={{ background: `${colorOf(w)}1c`, color: colorOf(w) }}>
              {name(w)}
            </span>
          ))}
        </div>
        <h3 className="mt-4 text-[26px] font-[760] leading-tight tracking-[-0.02em] text-ink [font-stretch:110%]">{s.title}</h3>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">{s.text}</p>
        <ol className="mt-5 flex flex-wrap gap-2">
          {s.parts.map((st, k) => (
            <li key={st} className="flex items-center gap-2 rounded-full border border-rule bg-surface-2 px-3 py-1.5 text-[13px] font-[600] text-ink-2">
              <span className="tabular text-[11px] font-[760]" style={{ color }}>
                {k + 1}
              </span>
              {st}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => scrollToId(s.href)}
          className="mt-auto inline-flex w-fit items-center gap-1.5 pt-6 text-[13.5px] font-[680] text-ink-2 transition-colors hover:text-accent"
        >
          See {s.key === 'router' ? 'the Router' : s.title.toLowerCase()}
          <Icon icon={ArrowRight02Icon} size={14} />
        </button>
      </div>
      <div className="relative hidden items-center justify-center md:flex" style={{ background: `radial-gradient(circle at 50% 55%, ${color}24, transparent 70%)` }}>
        <img src={STAGE_CAT[i]} alt="" className="max-h-[220px] w-auto object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.2)]" />
      </div>
    </div>
  );
}
