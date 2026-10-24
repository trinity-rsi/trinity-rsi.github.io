import { Container, Section } from '@/components/ui/Section';
import Reveal from '@/components/ui/Reveal';
import { PAPER } from '@/data/paper';

/** The paper's abstract and its three contributions. */
export default function AbstractSection() {
  return (
    <Section id="abstract" className="scroll-mt-24 py-28">
      <Container wide>
        <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="display-lg text-[clamp(2rem,3.6vw,3rem)] text-ink">Abstract</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-3">
              {PAPER.title}: {PAPER.subtitle}
              <br />
              {PAPER.team} · {PAPER.date}
            </p>
          </div>
          <div className="prose-serif !max-w-[72ch] space-y-4">
            {PAPER.abstract.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
        <div className="mt-16 grid gap-4 lg:ml-[340px] lg:grid-cols-3">
          {PAPER.contributions.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} className="relative overflow-hidden rounded-[20px] border border-rule bg-surface p-5">
              <span className="text-[30px] font-[820] leading-none text-accent [font-stretch:120%]">{['❶', '❷', '❸'][i]}</span>
              <p className="mt-3 text-[16px] font-[740] leading-snug text-ink">{c.title}</p>
              <p className="mt-2 text-[14px] leading-[1.55] text-ink-2">{c.text}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
