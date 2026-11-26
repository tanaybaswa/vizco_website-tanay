import Reveal from "@/components/Reveal";
import { Container, Label } from "@/components/ui";
import { EXPOSURE_COUNT, EXPOSURE_GROUPS } from "@/content/exposures";

const pad = (n: number) => String(n).padStart(2, "0");

/** Start number (1-based) of each group, so items run 01 to 12 across groups. */
const STARTS = EXPOSURE_GROUPS.reduce<number[]>((acc, g, i) => [...acc, i === 0 ? 1 : acc[i - 1] + EXPOSURE_GROUPS[i - 1].items.length], []);

/**
 * Rules between the groups: stacked on phones, two by two on tablets, four across on
 * desktop. Each group's padding and dividing lines, by position.
 */
const COLUMN = [
  "sm:pr-6",
  "border-t sm:border-l sm:border-t-0 sm:pl-6 lg:px-6",
  "border-t sm:pr-6 lg:border-l lg:border-t-0 lg:px-6",
  "border-t sm:border-l sm:pl-6 lg:border-t-0",
];

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/**
 * What we cover, as an index: every way AI goes wrong on one screen, in four columns,
 * so a buyer can scan for their own risk instead of waiting for a carousel.
 */
export default function CoverageIndex() {
  return (
    <section id="coverage" className="relative py-20 sm:py-28 lg:py-32">
      <Container>
        <Reveal className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16">
          <div>
            <Label>What we cover</Label>
            <h2 className="font-display t-h2 mt-7 text-balance text-cream">{WORDS[EXPOSURE_COUNT] ?? EXPOSURE_COUNT} ways AI goes wrong.</h2>
          </div>
          <p className="t-lead max-w-md text-pretty text-cream-muted">We read your policies against each one, and place cover for the gaps.</p>
        </Reveal>

        <div className="mt-14 grid border-t border-cream sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {EXPOSURE_GROUPS.map((g, gi) => {
            const start = STARTS[gi];
            return (
              <Reveal key={g.name} delay={gi * 80} className={`border-line-dark ${COLUMN[gi % COLUMN.length]}`}>
                <div className="flex items-baseline justify-between gap-4 pb-5 pt-6">
                  <h3 className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-cream">{g.name}</h3>
                  <span className="shrink-0 font-mono text-[0.6875rem] text-subtle">
                    {pad(start)}–{pad(start + g.items.length - 1)}
                  </span>
                </div>
                <ol className="border-t border-line-dark">
                  {g.items.map((e, j) => (
                    <li key={e.headline} className="group border-b border-line-dark py-6 last:border-b-0">
                      <p className="flex items-center gap-2.5 font-mono text-[0.6875rem] text-subtle">
                        <span aria-hidden className="h-1.5 w-1.5 bg-line-strong transition-colors duration-300 group-hover:bg-signal" />
                        {pad(start + j)}
                      </p>
                      <p className="font-display mt-3 text-[1.375rem] leading-[1.12] tracking-[-0.03em] text-cream">{e.headline}</p>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-cream-muted">{e.line}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
