import { ArrowRight, Repeat } from "lucide-react";
import Reveal from "@/components/Reveal";
import { Container, Label } from "@/components/ui";
import { PROCESS } from "@/content/process";

const pad = (n: number) => String(n + 1).padStart(2, "0");

/** Steps before cover starts, and the two that run all year once it has. */
const BEFORE = PROCESS.slice(0, 3);
const DURING = PROCESS.slice(3);

/** Changes that land between renewals. `at` is the mark's place along the year, in %. */
const CHANGES = [
  { label: "Model update", at: 14, tall: false },
  { label: "New data", at: 35, tall: true },
  { label: "New use", at: 56, tall: false },
  { label: "New vendor", at: 77, tall: true },
];

function StepText({ index, className = "" }: { index: number; className?: string }) {
  const s = PROCESS[index];
  return (
    <div className={className}>
      <p className="font-mono text-[0.6875rem] text-subtle">{pad(index)}</p>
      <h3 className="font-display mt-3 text-[2rem] leading-none tracking-[-0.04em] text-cream xl:text-[2.25rem]">{s.title}</h3>
      <p className="mt-3 text-base font-medium leading-snug tracking-[-0.015em] text-cream">{s.short}</p>
      <p className="mt-4 max-w-xs text-[0.875rem] leading-relaxed text-cream-muted">
        <span className="eyebrow mr-1.5 !text-[0.625rem]">You get</span>
        {s.get}
      </p>
    </div>
  );
}

/** A change landing on the line: an orange square that pings in turn with the others. */
function ChangeMark({ i }: { i: number }) {
  return (
    <span aria-hidden className="relative block h-2.5 w-2.5 shrink-0 bg-signal">
      <span className="event-ping absolute inset-0 bg-signal" style={{ animationDelay: `${i * 1.1}s` }} />
    </span>
  );
}

/**
 * How we work, drawn as a policy year. Assess, mitigate and place happen before cover
 * starts; then the line thickens into the year the policy is in force, changes land on it,
 * and monitoring and reporting run underneath until renewal comes round again.
 * A horizontal track on desktop, a vertical one on smaller screens.
 */
export default function PolicyYear() {
  return (
    <section id="process" className="relative py-20 sm:py-28 lg:py-32">
      <Container>
        <Reveal className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16">
          <div>
            <Label>How we work</Label>
            <h2 className="font-display t-h2 mt-7 text-balance text-cream">Cover that keeps up with your AI.</h2>
          </div>
          <p className="t-lead max-w-md text-pretty text-cream-muted">
            Insurance is set at renewal. Your AI doesn&apos;t wait for it, so we don&apos;t stop at the policy.
          </p>
        </Reveal>

        {/* Desktop: one horizontal line through the year */}
        <Reveal className="mt-20 hidden lg:grid lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,2.35fr)]">
          {BEFORE.map((s, i) => (
            <div key={s.title}>
              <div className="flex h-16 items-end pb-3">
                {i === 0 ? <p className="eyebrow text-cream-muted">Before cover starts</p> : null}
              </div>
              <div className="relative flex h-6 items-center">
                <span aria-hidden className="grow-x absolute inset-x-0 top-1/2 h-px bg-line-strong" style={{ transitionDelay: `${i * 120}ms` }} />
                <span aria-hidden className="relative h-3 w-3 bg-cream" />
              </div>
              <StepText index={i} className="pr-8 pt-6" />
            </div>
          ))}

          <div>
            {/* The changes, pinned above the year they land in, and renewal at the end */}
            <div className="relative h-16">
              {CHANGES.map((c) => (
                <span key={c.label} className="absolute bottom-0 -translate-x-1/2" style={{ left: `${c.at}%` }}>
                  <span aria-hidden className={`mx-auto block w-px bg-line-strong ${c.tall ? "h-9" : "h-4"}`} />
                  <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.12em] text-cream">
                    {c.label}
                  </span>
                </span>
              ))}
              <p className="absolute bottom-3 right-0 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-cream-muted">
                <Repeat aria-hidden className="h-3 w-3" strokeWidth={2} />
                Renewal
              </p>
            </div>
            <div className="relative flex h-6 items-center">
              <span aria-hidden className="grow-x absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-cream" style={{ transitionDelay: "360ms" }} />
              <ArrowRight aria-hidden className="absolute -right-1.5 top-1/2 h-5 w-5 -translate-y-1/2 text-cream" strokeWidth={2.5} />
              {CHANGES.map((c, i) => (
                <span key={c.label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${c.at}%` }}>
                  <ChangeMark i={i} />
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6">
              {DURING.map((s, j) => (
                <StepText key={s.title} index={BEFORE.length + j} />
              ))}
            </div>
          </div>
        </Reveal>

        {/* Smaller screens: the same year, top to bottom */}
        <ol className="mt-14 lg:hidden">
          {BEFORE.map((s, i) => (
            <li key={s.title} className="relative pb-12 pl-10">
              <span aria-hidden className="absolute bottom-0 left-[0.3125rem] top-3 w-px bg-line-strong" />
              <span aria-hidden className="absolute left-0 top-1 h-3 w-3 bg-cream" />
              <StepText index={i} />
            </li>
          ))}
          <li className="relative pb-12 pl-10">
            <span aria-hidden className="absolute bottom-0 left-[0.25rem] top-0 w-[3px] bg-cream" />
            <p className="eyebrow text-cream-muted">Then your AI changes</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {CHANGES.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2.5 border border-line-dark bg-surface px-3 py-2 text-[0.875rem] text-cream">
                  <ChangeMark i={i} />
                  {c.label}
                </li>
              ))}
            </ul>
          </li>
          {DURING.map((s, j) => (
            <li key={s.title} className="relative pb-12 pl-10">
              <span aria-hidden className="absolute bottom-0 left-[0.25rem] top-0 w-[3px] bg-cream" />
              <StepText index={BEFORE.length + j} />
            </li>
          ))}
          <li className="relative pl-10">
            <span aria-hidden className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center text-cream">
              <Repeat className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="eyebrow pt-0.5 text-cream-muted">Renewal, and round again</p>
          </li>
        </ol>

        <Reveal className="mt-20 border-t border-line-dark pt-10 lg:mt-24">
          <p className="font-display max-w-3xl text-balance text-[1.75rem] leading-tight tracking-[-0.035em] text-cream sm:text-[2.25rem]">
            If you need to claim, the record is already there. <span className="text-cream-muted">And we argue the claim for you.</span>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
