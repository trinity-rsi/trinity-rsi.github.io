import { Container, Section } from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import Fold from '@/components/ui/Fold';
import Reveal from '@/components/ui/Reveal';
import { PlaceholderNote } from '@/components/ui/Ph';
import RouterFlow from '@/components/viz/RouterFlow';
import PBars from '@/phone/ui/PBars';
import { FINDINGS, TABLE4 } from '@/data/results';


export default function RouterSection() {
  const f3 = FINDINGS[2];
  return (
    <Section id="router" className="pt-24 sm:pt-32">
      <Container wide>
        <SectionHeader kicker="Capability-aware Harness routing" title="Routing a new task to the right Harness" aside={<PlaceholderNote>Walk-through: the committed branch is the one Figure 10 assigns; scores are Table 8</PlaceholderNote>}>
          Each evolved Harness specializes in different capabilities. The Router reads public task information and retrieved experience, then commits one Harness from the tree before execution.
        </SectionHeader>

        <div className="mt-12">
          <h3 className="display-md mb-6 text-[clamp(1.5rem,2.6vw,2.1rem)] text-ink">Try it: route an unseen task</h3>
          <RouterFlow />
        </div>

        <div className="mt-14 grid gap-10 sm:mt-20 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-center">
          {/* the finding, with its two numbers */}
          <div>
            <p className="text-[12.5px] font-[700] text-accent">Table 4 · Finding {f3.n}</p>
            <h3 className="display-md mt-2 text-[clamp(1.6rem,2.6vw,2.3rem)] text-ink">{f3.title}</h3>
            <div className="mt-7 grid grid-cols-2 gap-6">
              {[
                { v: 71.27, o: 73.16, l: 'Train', c: 'text-accent' },
                { v: 60.96, o: 63.61, l: 'Unseen', c: 'text-explorer' },
              ].map((x) => (
                <div key={x.l}>
                  <p className={`tabular text-[clamp(2.4rem,4vw,3.4rem)] font-[820] leading-none tracking-[-0.03em] ${x.c}`} style={{ fontStretch: '112%' }}>
                    {x.v}
                  </p>
                  <p className="mt-2 text-[13px] font-[620] text-ink-2">{x.l}, full self-routing</p>
                  <p className="tabular text-[12.5px] text-ink-3">Oracle {x.o}</p>
                </div>
              ))}
            </div>
            <Fold className="mt-6">{f3.text}</Fold>
          </div>
          <Reveal className="figure-frame p-5 sm:p-6">
            <p className="text-[17px] font-[740] text-ink">Routing on the iteration-4 tree H⁽⁴⁾</p>
            <p className="mb-4 mt-1 text-[13px] text-ink-3">Benchmark-equal scores; switch to tokens for the cost of preparation, routing and inference.</p>
            <PBars
              id="d-table4"
              range={[30, 80]}
              costRange={[450, 610]}
              rows={TABLE4.map((r, i) => ({
                key: `${r.name}-${i}`,
                name: r.name,
                sub: r.cap === null ? (r.oracle ? 'best compatible Harness, chosen retrospectively' : 'one candidate per task at random') : `${r.cap ? '+ capability definitions' : 'task information and interfaces only'}${r.mem ? ' + retrieved experience' : ''}`,
                score: { train: r.train, unseen: r.unseen },
                cost: { train: r.trainTok, unseen: r.unseenTok },
                ours: r.ours,
                muted: r.random,
              }))}
            />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
