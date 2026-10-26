import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ArrowUp02Icon, ComputerIcon, Copy01Icon, CopyCheckIcon } from '@hugeicons/core-free-icons';
import { AFFILIATIONS, AUTHORS, BIBTEX, PAPER } from '@/data/paper';
import { useTokens } from '@/theme/tokens';
import { Opener } from '../ui/Opener';
import More from '../ui/More';
import { P_CHAPTERS } from '../chapters';
import { switchView } from '../mode';
import logoLight from '@/assets/brand/infrec-light.webp';
import logoDark from '@/assets/brand/infrec-dark.webp';
import group from '@/assets/cats/group.webp';

/** while the phone mode is a preview: what is still to come */
export function PreviewNote() {
  const next = P_CHAPTERS.filter((c) => !c.ready);
  return (
    <aside className="mx-5 mt-20 rounded-[22px] border border-dashed border-rule-2 px-5 py-5">
      <p className="text-[16px] font-[760] text-ink" style={{ fontStretch: '106%' }}>
        More chapters in the next preview
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{next.map((c) => c.title).join(', ')}. Until then, they are on the desktop layout.</p>
      <button type="button" onClick={() => switchView('desktop', next[0]?.id)} className="p-press mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
        <Icon icon={ComputerIcon} size={16} stroke={1.9} />
        Open the desktop layout
      </button>
    </aside>
  );
}

export function PAbstract() {
  return (
    <section id="abstract" className="scroll-mt-16 pt-20">
      <Opener kicker="The paper" title="Abstract">
        <p className="text-[14px] font-[600] leading-snug text-ink-3">
          {PAPER.title}: {PAPER.subtitle}. {PAPER.team}, {PAPER.date}.
        </p>
      </Opener>
      <More lines={9} className="mt-5 px-5" label="Read the whole abstract">
        <div className="space-y-4">
          {PAPER.abstract.map((p, i) => (
            <p key={i} className="p-lede">
              {p}
            </p>
          ))}
        </div>
      </More>
    </section>
  );
}

export function PTeam() {
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
    <section id="cite" className="scroll-mt-16 pt-20">
      <Opener kicker="Team and citation" title={PAPER.team} />
      <div className="mt-6 px-5">
        <img src={group} alt="Creator, Explorer and Evolver around a planning table" className="mx-auto w-[min(260px,70%)] drop-shadow-[0_20px_24px_rgba(0,0,0,0.18)]" />
        <div className="mt-8 space-y-7">
          {AUTHORS.map((g) => (
            <div key={g.group}>
              <p className="text-[13px] font-[720] text-accent">{g.group}</p>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
                {g.people.map((p) => (
                  <li key={p.name} className="text-[16.5px] font-[680] tracking-[-0.01em] text-ink">
                    {p.name}
                    <sup className="ml-0.5 text-[0.62em] font-[620] text-ink-3">{p.aff.join(',')}</sup>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ol className="space-y-1 border-t border-rule pt-5 text-[13.5px] text-ink-2">
            {AFFILIATIONS.map((a) => (
              <li key={a.n}>
                <sup className="mr-1.5 text-ink-3">{a.n}</sup>
                {a.name}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-12 px-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="p-subtitle">Cite the Trinity</h3>
          <button type="button" onClick={copy} className="p-press inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-[700] text-paper">
            <Icon icon={copied ? CopyCheckIcon : Copy01Icon} size={16} />
            {copied ? 'Copied' : 'Copy BibTeX'}
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-rule bg-surface p-4 font-mono text-[11.5px] leading-[1.6] text-ink-2">
          <code>{BIBTEX}</code>
        </pre>
        <p className="mt-2.5 text-[12.5px] text-ink-3">The entry will be updated with the arXiv identifier once the paper is public.</p>
      </div>
    </section>
  );
}

export function PFooter() {
  const { theme } = useTokens();
  return (
    <footer className="mt-20 border-t border-rule px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8">
      <img src={theme === 'dark' ? logoDark : logoLight} alt="InfRec, Cardinal AI Lab" className="h-8 w-auto" />
      <p className="mt-3 text-[13px] leading-snug text-ink-3">
        {PAPER.title}: {PAPER.subtitle}
        <br />
        {PAPER.team}, {PAPER.date}
      </p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-press inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
          <Icon icon={ArrowUp02Icon} size={16} stroke={1.9} />
          Back to the top
        </button>
        <button type="button" onClick={() => switchView('desktop')} className="p-press inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
          <Icon icon={ComputerIcon} size={16} stroke={1.9} />
          Desktop layout
        </button>
      </div>
      <p className="mt-6 text-[12px] text-ink-3">Mascots from the paper’s figures.</p>
    </footer>
  );
}
