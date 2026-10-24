import { useRef } from 'react';
import VariableProximity from '@/components/reactbits/VariableProximity/VariableProximity';
import StarBorder from '@/components/reactbits/StarBorder/StarBorder';
import Magnet from '@/components/reactbits/Magnet/Magnet';
import CountUp from '@/components/reactbits/CountUp/CountUp';
import SideRays from '@/components/reactbits/SideRays/SideRays';
import TrinityRow, { TrinityChain } from '@/components/viz/TrinityRow';
import LetterGlitch from '@/components/reactbits/LetterGlitch/LetterGlitch';
import LazyMount from '@/components/ui/LazyMount';
import Icon from '@/components/ui/Icon';
import { Container } from '@/components/ui/Section';
import { Github01Icon, Pdf02Icon, PlayIcon, QuoteDownIcon } from '@hugeicons/core-free-icons';
import { LINKS, PAPER } from '@/data/paper';
import { HEADLINE } from '@/data/results';
import { FILM, fmtTime, playFilm } from '@/data/film';
import { useTokens } from '@/theme/tokens';
import { scrollToId, useReducedMotion } from '@/lib/hooks';
import logoLight from '@/assets/brand/infrec-light.webp';
import logoDark from '@/assets/brand/infrec-dark.webp';

function LinkButton({ href, icon, children, onClick }: { href: string; icon?: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  const disabled = !href && !onClick;
  return (
    <a
      href={href || undefined}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      target={href ? '_blank' : undefined}
      rel="noreferrer"
      aria-disabled={disabled || undefined}
      className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-3 text-[14px] font-[620] text-ink transition-colors hover:border-rule-2 hover:bg-surface-2 aria-disabled:cursor-default aria-disabled:border-dashed aria-disabled:text-ink-2"
    >
      {icon}
      {children}
      {disabled && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-[12px] font-[650] text-paper opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Coming with the release
        </span>
      )}
    </a>
  );
}

function Stat({ to, decimals = 0, unit, label, delay }: { to: number; decimals?: number; unit?: string; label: string; delay: number }) {
  return (
    <div className="min-w-0">
      <p className="tabular text-[clamp(1.9rem,3vw,2.6rem)] font-[800] leading-none tracking-[-0.03em] text-ink [font-stretch:112%]">
        {unit === '+' && <span className="text-accent">+</span>}
        <CountUp to={to} decimals={decimals} duration={2.2} delay={delay} />
        {unit && unit !== '+' && <span className="ml-1 text-[0.5em] font-[680] tracking-normal text-ink-3">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[13px] font-[560] leading-snug text-ink-3">{label}</p>
    </div>
  );
}

export default function Hero() {
  const { t, theme } = useTokens();
  const reduce = useReducedMotion();
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <header id="top" className="relative isolate overflow-hidden pt-20 sm:pt-[clamp(4.5rem,9vh,6rem)]">
      {/* light: pixel letters glitching on paper (React Bits LetterGlitch) · dark: shafts of sunlight from the top-right (React Bits SideRays) */}
      <LazyMount key={theme} className="absolute inset-0 -z-10" margin="0px">
        {theme === 'dark' ? (
          <SideRays
            rayColor1="#ff6f86"
            rayColor2="#ffc46b"
            blend={0.55}
            origin="top-right"
            speed={reduce ? 0 : 1.6}
            intensity={1.7}
            spread={2.2}
            density={6}
            sharpness={0.45}
            falloff={1.7}
            glow={0.9}
            dust={0.35}
            followMouse={!reduce}
            mouseInfluence={0.35}
            intro
            opacity={0.95}
          />
        ) : (
          <LetterGlitch
            lightMode
            fontFamily="'Press Start 2P', monospace"
            fontSize={16}
            spacing={0.6}
            density={0}
            baseColor={t.ink3}
            baseOpacity={0.16}
            glitchColors={['#a0a6b6', '#e2687c']}
            glitchAmount={0.5}
            speed={0.3}
            flow={0.5}
            cursorRadius={140}
            clickEffect="tear"
          />
        )}
      </LazyMount>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            theme === 'dark'
              ? `radial-gradient(60% 50% at 75% 45%, ${t.evolver}1f, transparent 70%), radial-gradient(40% 40% at 10% 90%, ${t.explorer}14, transparent 70%)`
              : `radial-gradient(60% 50% at 75% 45%, ${t.evolver}12, transparent 70%), radial-gradient(40% 40% at 10% 90%, ${t.explorer}10, transparent 70%)`,
        }}
      />

      <Container wide className="pb-8">
        <div className="rise-in flex flex-wrap items-center gap-x-4 gap-y-2" style={{ animationDelay: '0.05s' }}>
          <img src={theme === 'dark' ? logoDark : logoLight} alt="InfRec, Cardinal AI Lab" className="h-9 w-auto sm:h-10" />
          <span className="h-6 w-px bg-rule-2" aria-hidden />
          <span className="text-[14px] font-[560] text-ink-3">Technical report, {PAPER.date}</span>
        </div>

        <div className="mt-[clamp(0.75rem,2.2vh,1.25rem)] grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
          <div className="relative z-10">
            <h1 ref={titleRef} className="text-[clamp(3.6rem,min(8.2vw,13.5vh),8.2rem)] leading-[0.84] tracking-[-0.045em] text-ink" style={{ fontWeight: 800, fontStretch: '118%' }}>
              <span className="rise-in block" style={{ animationDelay: '0.12s' }}>
                <VariableProximity label="The" fromFontVariationSettings="'wght' 760, 'wdth' 112" toFontVariationSettings="'wght' 900, 'wdth' 125" containerRef={titleRef} radius={170} falloff="gaussian" style={{ fontFamily: 'inherit' }} />
              </span>
              <span className="rise-in block" style={{ animationDelay: '0.22s' }}>
                <VariableProximity label="Trinity" fromFontVariationSettings="'wght' 760, 'wdth' 112" toFontVariationSettings="'wght' 900, 'wdth' 125" containerRef={titleRef} radius={170} falloff="gaussian" toColor={t.accent} style={{ fontFamily: 'inherit' }} />
              </span>
            </h1>

            <p className="rise-in mt-[clamp(0.75rem,2.2vh,1.25rem)] max-w-[30ch] text-[clamp(1.3rem,min(2.1vw,3.4vh),1.85rem)] font-[660] leading-[1.14] tracking-[-0.015em] text-ink" style={{ animationDelay: '0.32s', fontStretch: '104%' }}>
              Capability-driven recursive self-improvement for multimodal agents
            </p>

            <div className="rise-in mt-[clamp(0.9rem,2.6vh,1.5rem)] flex flex-wrap items-center gap-2" style={{ animationDelay: '0.52s' }}>
              <Magnet padding={50} magnetStrength={4}>
                <StarBorder
                  as="a"
                  href={LINKS.paper || '#abstract'}
                  onClick={(e: React.MouseEvent) => {
                    if (!LINKS.paper) {
                      e.preventDefault();
                      scrollToId('abstract');
                    }
                  }}
                  color={t.accent}
                  theme={theme}
                  radius={999}
                  thickness={1.5}
                  duration={5}
                  sparkle
                  backgroundColor={t.ink}
                  textColor={t.paper}
                  className="inline-flex h-10 items-center gap-2 px-4 text-[14px] font-[680]"
                >
                  <Icon icon={Pdf02Icon} size={17} />
                  {LINKS.paper ? 'Read the paper' : 'Read the abstract'}
                </StarBorder>
              </Magnet>
              <button
                type="button"
                onClick={playFilm}
                className="group inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface pl-1.5 pr-3.5 text-[14px] font-[650] text-ink transition-colors hover:border-rule-2 hover:bg-surface-2"
              >
                <span className="relative grid h-7 w-7 place-items-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:scale-110">
                  {!reduce && <span className="film-ring absolute inset-0 rounded-full" aria-hidden />}
                  <Icon icon={PlayIcon} size={13} stroke={2.6} className="translate-x-[1px]" />
                </span>
                Watch the film
                <span className="tabular text-[12.5px] font-[600] text-ink-3">{fmtTime(FILM.duration)}</span>
              </button>
              {LINKS.code || LINKS.huggingface ? (
                <>
                  <LinkButton href={LINKS.code} icon={<Icon icon={Github01Icon} size={17} />}>
                    Code
                  </LinkButton>
                  <LinkButton href={LINKS.huggingface} icon={<span aria-hidden>🤗</span>}>
                    Hugging Face
                  </LinkButton>
                </>
              ) : (
                <LinkButton href="" icon={<Icon icon={Github01Icon} size={17} />}>
                  Code &amp; data
                </LinkButton>
              )}
              <LinkButton href="" onClick={() => scrollToId('cite')} icon={<Icon icon={QuoteDownIcon} size={17} />}>
                Cite
              </LinkButton>
            </div>
          </div>

          {/* the paper's position statement */}
          <div className="rise-in relative z-10" style={{ animationDelay: '0.5s' }}>
            <div className="relative overflow-hidden rounded-[26px] border border-rule bg-surface/85 p-6 shadow-[0_30px_70px_-46px_rgba(20,24,40,0.55)] backdrop-blur-md sm:p-[clamp(1.25rem,3vh,1.75rem)]">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden />
              <p className="flex items-center gap-2 text-[12.5px] font-[760] uppercase tracking-[0.14em] text-accent">
                <span className="slogan-star" aria-hidden>
                  ✦
                </span>
                Position
              </p>
              <p className="mt-3 text-[clamp(1.45rem,2.2vw,1.95rem)] font-[760] leading-[1.12] tracking-[-0.02em] text-ink [font-stretch:108%]">
                From task-driven to <span className="text-accent">capability-driven</span> self-improvement.
              </p>
              <p className="mt-3 font-serif text-[15px] leading-[1.55] text-ink-2">{PAPER.position}</p>
              <div className="mt-[clamp(0.9rem,2.4vh,1.25rem)] grid grid-cols-3 gap-4 border-t border-rule pt-4">
                <Stat to={HEADLINE.trainGain} decimals={1} unit="+" label={`points on ${HEADLINE.trainCount} training benchmarks`} delay={0.8} />
                <Stat to={HEADLINE.unseenGain} decimals={1} unit="+" label={`points on ${HEADLINE.unseenCount} unseen benchmarks`} delay={0.9} />
                <Stat to={HEADLINE.realWorld} label="real-world embodied settings" delay={1} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-2 hidden w-full sm:block" style={{ maxWidth: 'clamp(760px, (100vh - 605px) * 3.95, 1180px)' }}>
          <TrinityRow />
        </div>
        <div className="relative z-10 mt-7 sm:hidden">
          <TrinityChain />
        </div>

        {/* in the flow, under the row, so it never sits on the diagram */}
        <div className="mt-2 hidden justify-center lg:flex [@media(max-height:860px)]:!hidden">
          <button
            type="button"
            onClick={() => scrollToId('film')}
            className="flex flex-col items-center gap-2 text-[12.5px] font-[600] text-ink-3 transition-colors hover:text-ink"
          >
            Scroll to explore
            <span className="relative block h-8 w-px overflow-hidden bg-rule">
              <span className="scroll-cue absolute inset-0 bg-ink-2" />
            </span>
          </button>
        </div>
      </Container>
    </header>
  );
}
