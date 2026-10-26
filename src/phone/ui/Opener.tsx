import type { ReactNode } from 'react';

/** a LEGO brick with a stage number on its face: the method's stages are the page's only numbered sequence */
function NumBrick({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 30 26" className="block h-[26px] w-[30px]" aria-hidden>
      <rect x="5" y="0.5" width="7" height="6.5" rx="1.8" fill="var(--accent)" />
      <rect x="18" y="0.5" width="7" height="6.5" rx="1.8" fill="var(--accent)" />
      <rect x="6" y="1.4" width="2.6" height="3.4" rx="1" fill="#fff" opacity="0.35" />
      <rect x="19" y="1.4" width="2.6" height="3.4" rx="1" fill="#fff" opacity="0.35" />
      <rect x="0" y="5" width="30" height="21" rx="3.5" fill="var(--accent)" />
      <rect x="0" y="5" width="30" height="8" rx="3.5" fill="#fff" opacity="0.18" />
      <rect x="0.5" y="22.6" width="29" height="3.4" rx="1.7" fill="#000" opacity="0.15" />
      <text x="15" y="20.2" textAnchor="middle" fill="#fff" style={{ fontSize: 13.5, fontWeight: 820, fontFamily: 'var(--font-display)' }}>
        {label}
      </text>
    </svg>
  );
}

export function StageMark({ stage }: { stage: string }) {
  const parts = stage.includes('–') ? stage.split('–') : [stage];
  return (
    <span className="inline-flex items-end gap-[3px]" aria-label={`Stage ${stage}`}>
      {parts.map((p) => (
        <NumBrick key={p} label={p} />
      ))}
    </span>
  );
}

/** a chapter's opening: the kicker (with the stage bricks for the method), the title, then its lede */
export function Opener({ kicker, title, stage, aside, children }: { kicker: string; title: ReactNode; stage?: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <header className="px-5">
      <div className="flex min-h-[26px] items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {stage && <StageMark stage={stage} />}
          <p className="p-kicker">{kicker}</p>
        </div>
        {aside}
      </div>
      <h2 className="p-title mt-3">{title}</h2>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
