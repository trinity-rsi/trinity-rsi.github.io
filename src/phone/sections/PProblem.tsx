import { useEffect, useRef, useState } from 'react';
import { CapabilityTree, GlobalHarness, PerTaskHarness } from '@/components/viz/Strategies';
import { Opener } from '../ui/Opener';
import PLoop, { type Wall } from './PLoop';

/** The problem (Introduction): the loop's two bottlenecks and a challenge, then what to evolve a Harness around. */
const WALLS: Wall[] = [
  {
    kind: 'Bottleneck',
    at: 'World',
    title: 'Verifiable worlds are costly',
    text: 'Building large, heterogeneous, verifiable environments by hand is costly; worlds must be generated automatically.',
  },
  {
    kind: 'Bottleneck',
    at: 'Human',
    title: 'Manual Harness iteration lags',
    text: 'The Harness increasingly limits agents, and hand-tuning it cannot keep pace with growing task diversity.',
  },
  {
    kind: 'Challenge',
    at: 'Agent',
    title: 'Harness RSI stays task-driven',
    text: 'Harness RSI evolves task by task on text tasks such as coding and math, overfitting and generalizing poorly.',
  },
];

const STRATEGIES = [
  {
    key: 'global',
    title: 'One global Harness',
    body: 'Struggles to accommodate conflicting task demands, such as the performance–efficiency trade-offs of embodied tasks.',
    Fig: GlobalHarness,
  },
  {
    key: 'task',
    title: 'One Harness per task',
    body: 'Suits tasks with similar requirements, but leads to Harness overfitting and poor generalization across heterogeneous tasks.',
    Fig: PerTaskHarness,
  },
  {
    key: 'cap',
    title: 'Evolve along shared capabilities',
    body: 'Group tasks by the capability requirements they share. Each requirement becomes a common learning objective, and specialized Harnesses grow from it.',
    Fig: CapabilityTree,
    ours: true,
  },
];

/** cards that snap into place, with a pager that follows them */
function Strategies() {
  const row = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const on = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft + c.clientWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].clientWidth / 2 - mid)) best = i;
      });
      setAt(best);
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  const go = (i: number) => {
    const el = row.current;
    const c = el?.children[i] as HTMLElement | undefined;
    if (el && c) el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.clientWidth) / 2, behavior: 'smooth' });
  };
  return (
    <div>
      <div ref={row} className="p-noscroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 scroll-px-5">
        {STRATEGIES.map(({ key, title, body, Fig, ours }) => (
          <article
            key={key}
            className={`w-[84%] shrink-0 snap-center rounded-[22px] border bg-surface p-3 pb-4 ${ours ? 'border-accent/60 shadow-[0_22px_44px_-30px_color-mix(in_oklch,var(--accent)_70%,transparent)]' : 'border-rule'}`}
          >
            <Fig />
            <div className="px-1.5">
              <p className="mt-3.5 flex flex-wrap items-center gap-2 text-[17px] font-[740] leading-tight text-ink" style={{ fontStretch: '106%' }}>
                {title}
                {ours && <span className="rounded-full bg-accent px-2 py-[3px] text-[11px] font-[720] leading-none text-white">The Trinity</span>}
              </p>
              <p className="p-body mt-1.5 text-[14.5px]">{body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Strategies">
        {STRATEGIES.map((s, i) => (
          <button key={s.key} type="button" role="tab" aria-selected={at === i} onClick={() => go(i)} className="grid h-6 w-6 place-items-center" aria-label={s.title}>
            <span className={`block h-1.5 rounded-full transition-all duration-300 ${at === i ? 'w-5 bg-ink' : 'w-1.5 bg-rule-2'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PProblem() {
  return (
    <section id="problem" className="scroll-mt-16 pt-14">
      <Opener kicker="The problem" title="RSI is still trained task by task">
        <p className="p-lede">Worlds provide tasks, humans guide learning, agents produce verifiable outcomes. As tasks grow more complex, this loop meets two bottlenecks and a challenge.</p>
      </Opener>
      <div className="mt-7 px-5">
        <PLoop walls={WALLS} />
      </div>

      <div className="mt-10 px-5">
        <h3 className="p-subtitle">What should a Harness be evolved around?</h3>
      </div>
      <div className="mt-5">
        <Strategies />
      </div>
    </section>
  );
}
