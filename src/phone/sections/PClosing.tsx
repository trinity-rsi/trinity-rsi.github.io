import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ArrowUp02Icon, Cancel01Icon, ComputerIcon, Copy01Icon, CopyCheckIcon, Github01Icon } from '@hugeicons/core-free-icons';
import { AFFILIATIONS, AUTHORS, BIBTEX, LINKS, PAPER } from '@/data/paper';
import { useTokens } from '@/theme/tokens';
import { Opener } from '../ui/Opener';
import More from '../ui/More';
import Sheet from '../ui/Sheet';
import { P_CHAPTERS } from '../chapters';
import { switchView } from '../mode';
import logoLight from '@/assets/brand/infrec-light.webp';
import logoDark from '@/assets/brand/infrec-dark.webp';
import group from '@/assets/cats/group.webp';

/** the chapters not yet drawn for phones: where to find them meanwhile */
export function PreviewNote() {
  const next = P_CHAPTERS.filter((c) => !c.ready);
  if (!next.length) return null;
  return (
    <aside className="mx-5 mt-20 rounded-[22px] border border-dashed border-rule-2 px-5 py-5">
      <p className="text-[16px] font-[760] text-ink" style={{ fontStretch: '106%' }}>
        More of the paper in the desktop layout
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{next.map((c) => c.title).join(', ')}: these chapters are not drawn for phones yet.</p>
      <button type="button" onClick={() => switchView('desktop', next[0]?.id)} className="p-press mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
        <Icon icon={ComputerIcon} size={16} stroke={1.9} />
        Open the desktop layout
      </button>
    </aside>
  );
}

/** the abstract, in a sheet the hero opens: the page itself stays short */
export function AbstractSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Abstract">
      <div className="flex items-center justify-between px-5 pb-2 pt-1">
        <p className="text-[19px] font-[780] tracking-[-0.015em] text-ink" style={{ fontStretch: '108%' }}>
          Abstract
        </p>
        <button type="button" onClick={onClose} className="p-press grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink-2" aria-label="Close">
          <Icon icon={Cancel01Icon} size={16} stroke={2} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <p className="text-[13px] font-[600] leading-snug text-ink-3">
          {PAPER.title}: {PAPER.subtitle}. {PAPER.team}, {PAPER.date}.
        </p>
        <div className="mt-4 space-y-4">
          {PAPER.abstract.map((x, k) => (
            <p key={k} className="p-lede">
              {x}
            </p>
          ))}
        </div>
      </div>
    </Sheet>
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
    <section id="cite" className="scroll-mt-16 pt-14">
      <Opener kicker="Team and citation" title={PAPER.team} />
      <div className="mt-6 px-5">
        <img src={group} alt="Creator, Explorer and Evolver around a planning table" className="mx-auto w-[min(200px,54%)] drop-shadow-[0_20px_24px_rgba(0,0,0,0.18)]" />
        <div className="mt-6 space-y-5">
          {AUTHORS.map((g) => (
            <div key={g.group}>
              <p className="text-[13px] font-[720] text-accent">{g.group}</p>
              <ul className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5">
                {g.people.map((p) => (
                  <li key={p.name} className="text-[15.5px] font-[680] tracking-[-0.01em] text-ink">
                    {p.name}
                    <sup className="ml-0.5 text-[0.62em] font-[620] text-ink-3">{p.aff.join(',')}</sup>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ol className="space-y-0.5 border-t border-rule pt-4 text-[12.5px] leading-snug text-ink-2">
            {AFFILIATIONS.map((a) => (
              <li key={a.n}>
                <sup className="mr-1.5 text-ink-3">{a.n}</sup>
                {a.name}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-10 px-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="p-subtitle">Cite the Trinity</h3>
          <button type="button" onClick={copy} className="p-press inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-[700] text-paper">
            <Icon icon={copied ? CopyCheckIcon : Copy01Icon} size={16} />
            {copied ? 'Copied' : 'Copy BibTeX'}
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-rule bg-surface px-4 pb-2 pt-4">
          <More lines={6} lineHeight={18.4} label="Show the whole entry" on="surface">
            <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.6] text-ink-2">
              <code>{BIBTEX}</code>
            </pre>
          </More>
        </div>
        <p className="mt-2.5 text-[12.5px] text-ink-3">The entry will be updated with the arXiv identifier once the paper is public.</p>
      </div>
    </section>
  );
}

export function PFooter() {
  const { theme } = useTokens();
  return (
    <footer className="mt-14 border-t border-rule px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8">
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
        {LINKS.code && (
          <a href={LINKS.code} target="_blank" rel="noreferrer" className="p-press inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
            <Icon icon={Github01Icon} size={16} stroke={1.9} />
            Code
          </a>
        )}
        <button type="button" onClick={() => switchView('desktop')} className="p-press inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-[700] text-ink">
          <Icon icon={ComputerIcon} size={16} stroke={1.9} />
          Desktop layout
        </button>
      </div>
      <p className="mt-6 text-[12px] text-ink-3">Mascots from the paper’s figures.</p>
    </footer>
  );
}
