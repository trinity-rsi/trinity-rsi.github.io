import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import CountUp from '@/components/reactbits/CountUp/CountUp';
import { Pdf02Icon, PlayIcon, QuoteDownIcon } from '@hugeicons/core-free-icons';
import { LINKS, PAPER } from '@/data/paper';
import { HEADLINE } from '@/data/results';
import { FILM, fmtTime, playFilm } from '@/data/film';
import { useTokens } from '@/theme/tokens';
import { useReducedMotion } from '@/lib/hooks';
import PTriangle from './PTriangle';
import { AbstractSheet } from './PClosing';
import { goTo } from '../chapters';
import logoLight from '@/assets/brand/infrec-light.webp';
import logoDark from '@/assets/brand/infrec-dark.webp';

function Stat({ to, decimals = 0, plus, label, delay }: { to: number; decimals?: number; plus?: boolean; label: string; delay: number }) {
  return (
    <div className="min-w-0">
      <p className="tabular text-[30px] font-[800] leading-none tracking-[-0.03em] text-ink" style={{ fontStretch: '112%' }}>
        {plus && <span className="text-accent">+</span>}
        <CountUp to={to} decimals={decimals} duration={2} delay={delay} />
      </p>
      <p className="mt-1.5 text-[12.5px] font-[580] leading-snug text-ink-3">{label}</p>
    </div>
  );
}

/** the title on one line, as wide as the column: measured, so it never runs off the screen */
function FitTitle({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const b = box.current;
      const t = text.current;
      if (!b || !t) return;
      t.style.fontSize = '100px';
      const w = t.getBoundingClientRect().width;
      if (w > 0) t.style.fontSize = `${Math.min(92, (100 * b.clientWidth) / w - 0.4)}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={className} style={style}>
      <h1 className="leading-[0.9]">
        <span ref={text} className="inline-block whitespace-nowrap font-[800] tracking-[-0.045em] text-ink" style={{ fontStretch: '116%' }}>
          {children}
        </span>
      </h1>
    </div>
  );
}

/** the opening screen: the title, the three roles, the film, and the paper's position with its headline numbers */
export default function PHero() {
  const { theme } = useTokens();
  const reduce = useReducedMotion();
  const rise = (s: number) => (reduce ? undefined : { animationDelay: `${s}s` });
  const [abstract, setAbstract] = useState(false);
  const closeAbstract = useCallback(() => setAbstract(false), []);

  return (
    <header id="top" className="relative overflow-hidden pt-[74px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(70%_55%_at_80%_28%,color-mix(in_oklch,var(--evolver)_9%,transparent),transparent_70%),radial-gradient(60%_45%_at_0%_70%,color-mix(in_oklch,var(--explorer)_8%,transparent),transparent_70%)]" aria-hidden />
      <div className="relative px-5">
        <div className="p-rise flex items-center gap-3" style={rise(0.05)}>
          <img src={theme === 'dark' ? logoDark : logoLight} alt="InfRec, Cardinal AI Lab" className="h-7 w-auto" />
          <span className="h-5 w-px bg-rule-2" aria-hidden />
          <span className="text-[13px] font-[580] text-ink-3">Technical report, {PAPER.date}</span>
        </div>

        <FitTitle className="p-rise mt-5" style={rise(0.12)}>
          The Trinity
        </FitTitle>
        <p className="p-subtitle p-rise mt-3 max-w-[20ch]" style={rise(0.22)}>
          Capability-driven recursive self-improvement for multimodal agents
        </p>


        <div className="p-rise mt-6 space-y-2.5" style={rise(0.32)}>
          <button
            type="button"
            onClick={playFilm}
            className="p-press flex h-[56px] w-full items-center gap-3 rounded-full bg-accent pl-2 pr-5 text-left text-white shadow-[0_18px_36px_-18px_color-mix(in_oklch,var(--accent)_80%,transparent)]"
          >
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-accent">
              {!reduce && <span className="p-ring absolute inset-0 rounded-full" aria-hidden />}
              <Icon icon={PlayIcon} size={17} stroke={2.6} className="translate-x-[1px]" />
            </span>
            <span className="flex-1 text-[16.5px] font-[740] tracking-[-0.01em]">Watch the film</span>
            <span className="tabular text-[14px] font-[650] text-white/80">{fmtTime(FILM.duration)}</span>
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={LINKS.paper || '#top'}
              target={LINKS.paper ? '_blank' : undefined}
              rel="noreferrer"
              onClick={(e) => {
                if (!LINKS.paper) {
                  e.preventDefault();
                  setAbstract(true);
                }
              }}
              className="p-press flex h-12 items-center justify-center gap-2 rounded-full border border-rule bg-surface text-[14.5px] font-[700] text-ink"
            >
              <Icon icon={Pdf02Icon} size={17} stroke={1.9} />
              {LINKS.paper ? 'Read the paper' : 'Read the abstract'}
            </a>
            <AbstractSheet open={abstract} onClose={closeAbstract} />
            <button type="button" onClick={() => goTo('cite')} className="p-press flex h-12 items-center justify-center gap-2 rounded-full border border-rule bg-surface text-[14.5px] font-[700] text-ink">
              <Icon icon={QuoteDownIcon} size={17} stroke={1.9} />
              Cite
            </button>
          </div>
        </div>

        <div className="p-rise mt-9" style={rise(0.44)}>
          <PTriangle />
        </div>

        {/* the paper's position, and what it achieves */}
        <section className="mt-12" aria-label="Position">
          <div className="border-l-[3px] border-accent pl-4">
            <p className="p-kicker">Position</p>
            <p className="p-subtitle mt-1.5">From task-driven to capability-driven RSI.</p>
          </div>
          <p className="p-lede mt-4">{PAPER.positionShort}</p>
          <div className="mt-7 grid grid-cols-3 gap-4 border-t border-rule pt-5">
            <Stat to={HEADLINE.trainGain} decimals={1} plus label={`points on ${HEADLINE.trainCount} training benchmarks`} delay={0.2} />
            <Stat to={HEADLINE.unseenGain} decimals={1} plus label={`points on ${HEADLINE.unseenCount} unseen benchmarks`} delay={0.3} />
            <Stat to={HEADLINE.realWorld} label="real-world embodied tasks" delay={0.4} />
          </div>
        </section>
      </div>
    </header>
  );
}
