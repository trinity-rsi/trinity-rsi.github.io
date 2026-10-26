import { Container, Section } from '@/components/ui/Section';
import { PAPER } from '@/data/paper';

/** The paper's abstract. */
export default function AbstractSection() {
  return (
    <Section id="abstract" className="scroll-mt-24 py-20 sm:py-28">
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
      </Container>
    </Section>
  );
}
