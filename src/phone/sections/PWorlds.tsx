import Icon from '@/components/ui/Icon';
import PaperFigure from '@/components/ui/PaperFigure';
import { CheckmarkCircle02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { benchById } from '@/data/tree';
import { FIG3, PIPE_AT, WORLD_PIPE as PIPE } from '@/data/steps';
import { PAPER_FIGS, e1Frame, nodeLevel } from '@/data/media';
import { useTokens } from '@/theme/tokens';
import { useNearViewport, useReducedMotion } from '@/lib/hooks';
import { useLoopClock, seg, easeOut, easeOutBack, window01 } from '@/lib/anim';
import { Opener } from '../ui/Opener';
import creatorBuild from '@/assets/cats/creator-build.webp';

/**
 * Stage 2, world creation (Section 3.3, Figures 2 and 3), drawn top to bottom for a phone:
 * four tasks at node d that share one decision converge on the world Creator builds for it,
 * then the pipeline that admits a world, step by step down a rail.
 */


function Converge() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLDivElement>('-15% 0px');
  const [p] = useLoopClock(9, near && !reduce, reduce ? 0.62 : 0);
  const lines = easeOut(seg(p, 0.22, 0.45));
  const world = easeOutBack(seg(p, 0.44, 0.58));
  const good = seg(p, 0.6, 0.7);
  const bad = seg(p, 0.7, 0.8);
  const fade = 1 - seg(p, 0.94, 1);
  return (
    <div ref={ref} style={{ opacity: reduce ? 1 : Math.min(1, 0.3 + fade) }}>
      <div className="grid grid-cols-2 gap-2.5">
        {FIG3.map((x, i) => {
          const b = benchById[x.id];
          const k = reduce ? 1 : easeOut(seg(p, 0.02 + i * 0.045, 0.14 + i * 0.045));
          return (
            <div key={x.id} className="overflow-hidden rounded-[16px] border border-rule bg-surface" style={{ opacity: k, transform: `translateY(${(1 - k) * 12}px) scale(${0.96 + 0.04 * k})` }}>
              <div className="relative aspect-[16/10]">
                <img src={e1Frame(b.id, 'start')} alt={b.name} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-[700] text-white">{b.short ?? b.name}</span>
              </div>
              <p className="px-2.5 py-2 text-[12.5px] font-[620] leading-snug text-ink-2">{x.q}</p>
            </div>
          );
        })}
      </div>

      {/* the four decisions converge on one requirement */}
      <svg viewBox="0 0 360 64" className="block h-16 w-full" preserveAspectRatio="none" aria-hidden>
        {[45, 135, 225, 315].map((x, i) => (
          <path key={i} d={`M ${x} 0 C ${x} 34, 180 30, 180 58`} fill="none" stroke={t.creator} strokeWidth={1.8} strokeOpacity={0.75} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lines} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="-mt-2 flex justify-center" aria-hidden>
        <span className="h-3 w-3 rounded-full" style={{ background: t.creator, opacity: lines, transform: `scale(${1 + 0.4 * world})` }} />
      </div>

      <div className="mt-2" style={{ opacity: reduce ? 1 : world, transform: `scale(${0.94 + 0.06 * world})` }}>
        <div className="overflow-hidden rounded-[20px] border border-rule bg-surface shadow-[0_24px_50px_-34px_rgba(0,0,0,0.5)]">
          <div className="relative aspect-[16/10] bg-paper-2">
            <img src={nodeLevel('d', 1)} alt="The world Creator built for node d" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <img src={creatorBuild} alt="" className="absolute -bottom-1 -right-1 h-20 w-20 object-contain drop-shadow-lg" draggable={false} />
          </div>
          <div className="space-y-2 p-3.5">
            <p className="text-[12.5px] font-[720] text-creator">Node d, Creator’s world</p>
            <p className="text-[15px] font-[680] leading-snug text-ink">Is Q7 the object described by all the attributes? (YES / NO)</p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-[700]" style={{ background: `${t.good}18`, color: t.good, opacity: reduce ? 1 : good }}>
                <Icon icon={CheckmarkCircle02Icon} size={14} /> Evidence-gated commitment
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-[700]" style={{ background: `${t.bad}18`, color: t.bad, opacity: reduce ? 1 : bad }}>
                <Icon icon={Cancel01Icon} size={14} /> Premature commitment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function Pipeline() {
  const { t } = useTokens();
  const reduce = useReducedMotion();
  const [ref, near] = useNearViewport<HTMLOListElement>('-10% 0px');
  const [p, setP] = useLoopClock(11, near && !reduce, reduce ? 0.95 : 0);
  const stepAt = (x: number) => (x < 0.14 ? 0 : x < 0.28 ? 1 : x < 0.42 ? 2 : x < 0.66 ? 3 : 4);
  const cur = stepAt(p);
  const failing = window01(p, 0.44, 0.53, 0.02);
  const revised = p > 0.53;
  const needle = easeOutBack(seg(p, 0.7, 0.84));
  const admitted = p > 0.84;
  return (
    <ol ref={ref} className="relative">
      {/* the rail the world travels down */}
      <span className="absolute bottom-6 left-[17px] top-5 w-[2px] rounded-full bg-rule" aria-hidden>
        <span className="block w-full rounded-full bg-creator transition-[height] duration-500" style={{ height: `${(Math.min(cur, 4) / 4) * 100}%` }} />
      </span>
      {PIPE.map((s, i) => {
        const on = i === cur;
        const done = i < cur;
        return (
          <li key={s.k} className="relative pb-4 pl-12 last:pb-0">
            <button
              type="button"
              onClick={() => setP(PIPE_AT[i] + 0.001)}
              aria-label={`Jump to ${s.title}`}
              className="absolute left-0 top-1 z-10 grid h-9 w-9 place-items-center rounded-full text-[13px] font-[780] transition-colors duration-500"
              style={{ background: on || done ? t.creator : t.paper2, color: on || done ? '#fff' : t.ink3, boxShadow: on ? `0 0 0 5px ${t.creator}26` : undefined }}
            >
              {i === 3 && on && failing > 0.5 ? '✗' : done ? '✓' : s.k}
            </button>
            <div className={`rounded-[18px] border bg-surface p-3.5 transition-[border-color,box-shadow] duration-500 ${on ? 'border-creator/60 shadow-[0_18px_36px_-26px_rgba(0,0,0,0.5)]' : 'border-rule'}`}>
              <p className="text-[15.5px] font-[740] leading-tight text-ink">{s.title}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.items.map((it, j) => {
                  const band = i === 4;
                  const admit = band && j === 1;
                  return (
                    <span
                      key={it}
                      className="rounded-md border px-1.5 py-0.5 text-[11.5px] font-[620] transition-colors duration-500"
                      style={{
                        borderColor: band && admit && admitted ? t.good : t.rule,
                        background: band && admit && admitted ? `${t.good}18` : band && !admit ? t.surface2 : t.surface,
                        color: band && admit && admitted ? t.good : t.ink2,
                      }}
                    >
                      {it}
                    </span>
                  );
                })}
              </div>
              {i === 3 && (
                <p className="mt-2 text-[12px] font-[680]" style={{ color: failing > 0.5 ? t.bad : revised ? t.good : t.ink3 }}>
                  {failing > 0.5 ? 'Check failed: revise' : revised ? 'Passed after revision' : 'Waiting for the world'}
                </p>
              )}
              {i === 4 && (
                <div className="relative mt-3 h-6">
                  <div className="absolute inset-x-0 top-2.5 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${t.bad}55 0 33%, ${t.good}66 33% 66%, ${t.ink3}44 66%)` }} />
                  <div className="absolute top-0 h-6 w-[3px] rounded-full bg-ink" style={{ left: `${10 + needle * 40}%` }} />
                </div>
              )}
              <p className="mt-2 text-[13.5px] leading-[1.5] text-ink-2">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function PWorlds() {
  return (
    <section id="world-creation" className="scroll-mt-16 pt-20">
      <Opener kicker="Stage 2, world creation" stage="2" title="Capability-Driven Real2Sim2Real">
        <p className="p-lede">Four different tasks at node d all need evidence verification before deciding. Creator turns that shared requirement into simplified, verifiable worlds; the original tasks measure transfer.</p>
      </Opener>
      <div className="mt-7 px-4">
        <Converge />
      </div>
      <div className="mt-4 px-5">
        <PaperFigure fig={PAPER_FIGS.worlds} />
      </div>

      <div className="mt-14 px-5">
        <h3 className="p-subtitle">From a requirement to an admitted world</h3>
        <p className="mt-2 text-[13px] text-ink-3">Tap a number to jump to that step.</p>
        <div className="mt-6">
          <Pipeline />
        </div>
      </div>
    </section>
  );
}
