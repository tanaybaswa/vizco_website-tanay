import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Cite from "@/components/Cite";
import Reveal from "@/components/Reveal";
import { Container, SwapArrow } from "@/components/ui";
import type { SourceKey } from "@/content/sources";

/* Every figure here is cited beside it. Add the source to src/content/sources.ts first. */
const INCIDENTS = [
  { year: "2024", value: 233 },
  { year: "2025", value: 362 },
];
const MAX = Math.max(...INCIDENTS.map((d) => d.value));
const STATES_ON_FILE = 49;

type Fact = { text: ReactNode; s: SourceKey | SourceKey[] };

const LIABILITY: Fact[] = [
  { text: "Courts are holding businesses to what their AI does, and letting claims against AI vendors proceed.", s: ["moffatt", "mobley"] },
  { text: "From 9 December 2026, EU rules treat AI as a product, with liability regardless of fault.", s: "pld" },
];

const COVER: Fact[] = [
  { text: "More than 80% of insurers' requests to exclude AI had been approved by April 2026.", s: "csis" },
  { text: "Generative AI fails three of nine standard tests of insurability.", s: "csis" },
];

function Side({
  dir,
  label,
  figure,
  caption,
  chart,
  facts,
}: {
  dir: "up" | "down";
  label: string;
  figure: string;
  caption: ReactNode;
  chart: ReactNode;
  facts: Fact[];
}) {
  const Arrow = dir === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <>
      <p className="eyebrow flex items-center gap-3 text-ink/60">
        <span aria-hidden className="flex h-6 w-6 items-center justify-center bg-signal text-signal-ink">
          <Arrow className="h-4 w-4" strokeWidth={2.25} />
        </span>
        {label}
      </p>
      <p className="font-display mt-8 text-[clamp(5rem,3.4rem+5vw,8.5rem)] leading-[0.86] tracking-[-0.055em]">{figure}</p>
      <p className="mt-5 max-w-md text-lg leading-snug tracking-[-0.015em] text-ink/75">{caption}</p>
      <div className="mt-8">{chart}</div>
      <ul className="mt-10 space-y-4 border-t border-ink/15 pt-8">
        {facts.map((f, i) => (
          <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink/65 sm:text-base">
            <span aria-hidden className="mt-[0.62em] h-1.5 w-1.5 shrink-0 bg-ink/50" />
            <span>
              {f.text}
              <Cite s={f.s} />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Two bars on one zero baseline: last year grey, this year in full, every value printed. */
function IncidentBars() {
  return (
    <figure>
      <figcaption className="sr-only">AI incidents recorded: 233 in 2024, 362 in 2025.</figcaption>
      <div aria-hidden className="max-w-md space-y-2.5">
        {INCIDENTS.map((d, i) => {
          const last = i === INCIDENTS.length - 1;
          return (
            <div key={d.year} className="grid grid-cols-[2.75rem_1fr] items-center gap-3">
              <span className={`font-mono text-xs ${last ? "text-ink" : "text-ink/50"}`}>{d.year}</span>
              <span className="flex items-center gap-3">
                <span
                  className={`grow-x h-3.5 ${last ? "bg-ink" : "bg-ink/30"}`}
                  style={{ width: `calc((100% - 3rem) * ${d.value / MAX})`, transitionDelay: `${250 + i * 150}ms` }}
                />
                <span className={`font-mono text-xs tabular-nums ${last ? "text-ink" : "text-ink/50"}`}>{d.value}</span>
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

/** One square per US state, filled for each with AI exclusion wording on file. */
function StateGrid() {
  return (
    <figure>
      <figcaption className="sr-only">{STATES_ON_FILE} of 50 US states.</figcaption>
      <div aria-hidden className="flex items-end gap-4">
        <div className="grid w-fit grid-cols-10 gap-1.5">
          {Array.from({ length: 50 }, (_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 ${i < STATES_ON_FILE ? "fill-in bg-ink" : "border border-ink/40"}`}
              style={i < STATES_ON_FILE ? { transitionDelay: `${300 + i * 18}ms` } : undefined}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-ink/50">of 50</span>
      </div>
    </figure>
  );
}

/** Why now: liability for AI is rising while cover for it falls away. The page's one dark band. */
export default function WhyNow() {
  return (
    <section aria-labelledby="why-now-title" className="bg-cream text-ink">
      <Container className="py-20 sm:py-28 lg:py-32">
        <Reveal>
          <h2 id="why-now-title" className="font-display t-h1 max-w-5xl text-balance">
            Liability for AI is growing. <span className="text-ink/45">Cover for it is shrinking.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid border-t border-ink/20 lg:mt-20 lg:grid-cols-2">
          <Reveal className="pt-10 lg:pr-14 lg:pt-12">
            <Side
              dir="up"
              label="Liability"
              figure="362"
              caption={
                <>
                  AI incidents recorded in 2025, up from 233 in 2024.
                  <Cite s="aiIndex" />
                </>
              }
              chart={<IncidentBars />}
              facts={LIABILITY}
            />
          </Reveal>
          <Reveal delay={120} className="mt-14 border-t border-ink/20 pt-10 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-12">
            <Side
              dir="down"
              label="Cover"
              figure={String(STATES_ON_FILE)}
              caption={
                <>
                  US states with standard AI exclusion wording on file, by mid-2026.
                  <Cite s="insuranceBusiness" />
                </>
              }
              chart={<StateGrid />}
              facts={COVER}
            />
          </Reveal>
        </div>

        <Reveal className="mt-16 flex flex-col gap-6 border-t border-ink/20 pt-10 sm:flex-row sm:items-end sm:justify-between lg:mt-20">
          <p className="font-display max-w-2xl text-[1.75rem] leading-tight tracking-[-0.035em] sm:text-[2.25rem]">
            Insurers write out what they can&apos;t see. Evidence changes that.
          </p>
          <Link href="/the-problem" className="group inline-flex shrink-0 items-center gap-2.5 text-[0.9375rem] font-medium">
            <span className="link-signal">Read the evidence, with sources</span>
            <SwapArrow />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
