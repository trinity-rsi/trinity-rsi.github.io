import { useState } from 'react';
import Shuffle from '@/components/reactbits/Shuffle/Shuffle';
import ClickSpark from '@/components/reactbits/ClickSpark/ClickSpark';
import Dock from '@/components/reactbits/Dock/Dock';
import { Container, Section } from '@/components/ui/Section';
import Icon from '@/components/ui/Icon';
import { AFFILIATIONS, AUTHORS, BIBTEX, LINKS, PAPER } from '@/data/paper';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { scrollToId } from '@/lib/hooks';
import {
  ArrowUp02Icon,
  Copy01Icon,
  CopyCheckIcon,
  Github01Icon,
  Moon02Icon,
  Pdf02Icon,
  QuoteDownIcon,
  Sun03Icon,
} from '@hugeicons/core-free-icons';
import logoLight from '@/assets/brand/infrec-light.webp';
import logoDark from '@/assets/brand/infrec-dark.webp';
import group from '@/assets/cats/group.webp';

export function Team() {
  return (
    <Section id="team" className="py-20 sm:py-28">
      <Container wide>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <h2 className="display-lg text-[clamp(2.2rem,4.6vw,3.8rem)] text-ink">{PAPER.team}</h2>
            <img src={group} alt="Creator, Explorer and Evolver around a planning table" className="mt-8 w-[min(320px,80%)] drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)]" />
          </div>
          <div className="space-y-10">
            {AUTHORS.map((g) => (
              <div key={g.group}>
                <p className="text-[13px] font-[700] text-accent">{g.group}</p>
                <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-3">
                  {g.people.map((p) => (
                    <li key={p.name} className="text-[clamp(1.05rem,1.6vw,1.3rem)] font-[680] tracking-[-0.01em] text-ink">
                      <Shuffle
                        text={p.name}
                        tag="span"
                        shuffleDirection="up"
                        duration={0.35}
                        shuffleTimes={1}
                        animationMode="evenodd"
                        stagger={0.02}
                        triggerOnHover
                        triggerOnce
                        style={{ fontFamily: 'inherit', textTransform: 'none', fontSize: 'inherit', lineHeight: 'inherit', letterSpacing: 'inherit' }}
                      />
                      <sup className="ml-0.5 text-[0.62em] font-[620] text-ink-3">{p.aff.join(',')}</sup>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <ol className="grid gap-x-8 gap-y-1.5 border-t border-rule pt-6 text-[14px] text-ink-2 sm:grid-cols-2">
              {AFFILIATIONS.map((a) => (
                <li key={a.n}>
                  <sup className="mr-1.5 text-ink-3">{a.n}</sup>
                  {a.name}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function Cite() {
  const { t } = useTokens();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = BIBTEX;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Section id="cite" tone="alt" className="py-16 sm:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg text-[clamp(2rem,4vw,3.2rem)] text-ink">Cite the Trinity</h2>
          <ClickSpark sparkColor={[t.evolver, t.explorer, t.creator]} sparkCount={12} sparkRadius={34} sparkSize={9} shape="star">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14.5px] font-[680] text-paper transition-transform active:scale-95"
            >
              <Icon icon={copied ? CopyCheckIcon : Copy01Icon} size={17} />
              {copied ? 'Copied' : 'Copy BibTeX'}
            </button>
          </ClickSpark>
        </div>
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-rule bg-surface p-6 font-mono text-[13.5px] leading-[1.7] text-ink-2">
          <code>{BIBTEX}</code>
        </pre>
        <p className="mt-3 text-[13px] text-ink-3">The entry will be updated with the arXiv identifier once the paper is public.</p>
      </Container>
    </Section>
  );
}

export function Footer() {
  const { theme, toggle } = useTheme();
  const { t } = useTokens();
  const open = (u: string) => u && window.open(u, '_blank', 'noopener');
  return (
    <footer className="relative overflow-hidden bg-paper pb-28 pt-16">
      <Container wide>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-rule pt-8">
          <div className="flex items-center gap-4">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="InfRec, Cardinal AI Lab" className="h-9 w-auto" />
            <p className="text-[13.5px] leading-snug text-ink-3">
              {PAPER.title}: {PAPER.subtitle}
              <br />
              {PAPER.team}, {PAPER.date}
            </p>
          </div>
          <p className="text-[12.5px] text-ink-3">Effects and components from React Bits. Mascots from the paper’s figures.</p>
        </div>
      </Container>
      <div className="mt-14 flex justify-center">
        <div>
          <Dock
            theme={theme}
            position="bottom"
            baseItemSize={42}
            magnification={64}
            panelHeight={58}
            autoHide={false}
            showLabels
            accentColor={t.accent}
            items={[
              { icon: <Icon icon={ArrowUp02Icon} size={20} />, label: 'Back to top', onClick: () => scrollToId('top') },
              { icon: <Icon icon={Pdf02Icon} size={20} />, label: LINKS.paper ? 'Paper' : 'Abstract', onClick: () => (LINKS.paper ? open(LINKS.paper) : scrollToId('abstract')) },
              { icon: <Icon icon={Github01Icon} size={20} />, label: LINKS.code ? 'Code' : 'Code (soon)', onClick: () => open(LINKS.code) },
              { icon: <span className="text-[19px]">🤗</span>, label: LINKS.huggingface ? 'Hugging Face' : 'Hugging Face (soon)', onClick: () => open(LINKS.huggingface) },
              { icon: <Icon icon={QuoteDownIcon} size={20} />, label: 'Cite', onClick: () => scrollToId('cite') },
              { separator: true },
              { icon: <Icon icon={theme === 'dark' ? Sun03Icon : Moon02Icon} size={20} />, label: theme === 'dark' ? 'Light mode' : 'Dark mode', onClick: toggle },
            ]}
          />
        </div>
      </div>
    </footer>
  );
}
