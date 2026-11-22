import type { Metadata } from "next";
import Cite from "@/components/Cite";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import CompassGame from "@/components/compass/CompassGame";
import MiniCompass from "@/components/compass/MiniCompass";
import StartButton from "@/components/compass/StartButton";
import { Block, Container, Faq } from "@/components/ui";
import { ARCHETYPES, ARCHETYPE_ORDER, AXES, CASES, COMPASS, COMPASS_DISCLAIMER, STANCES } from "@/content/compass";
import { breadcrumbSchema, faqSchema, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "The AI Cover Compass: where do you stand on AI cover?",
  description:
    "A live poll for insurance professionals. Make six calls on real-world AI losses, take six positions on where cover should go, and see where you land against the market.",
  path: COMPASS.path,
  image: { url: `${COMPASS.path}/opengraph-image`, alt: "The AI Cover Compass: where do you stand on AI cover?" },
});

const STEPS = [
  {
    n: "01",
    title: `Make ${CASES.length} calls`,
    body: "Real-world AI losses beside the wording that has to answer them. Does it pay? Yes, No, or Arguable.",
  },
  {
    n: "02",
    title: `Take ${STANCES.length} positions`,
    body: "Short statements on where AI cover should go. Agree or disagree, with no middle option.",
  },
  {
    n: "03",
    title: "See where you land",
    body: "Your position on the map, how your peers called each case, and where you rank against everyone who has played.",
  },
];

const FAQ = [
  {
    q: "Is it anonymous?",
    a: "Yes. We keep your role, region and answers under a random ID, never your name. Joining the Founding 200 is optional; if you do, your email is kept separately and used only to confirm you work in insurance and to send you the report.",
  },
  {
    q: "Is there a right answer?",
    a: "No. Each case shows our reading, labelled as one reading, beside how the market called it. Nobody is scored right or wrong; you're only compared with other players.",
  },
  {
    q: "Where does the wording come from?",
    a: "Most clauses are specimens we wrote in the style of common market language, so no insurer's policy is singled out. Where wording comes from a public source, the source is linked beside it. The facts come from real cases, linked, or are marked as illustrative.",
  },
  {
    q: "How is my position worked out?",
    a: `Your ${CASES.length} case calls set how far you think today's policies pay, left to right. Your ${STANCES.length} positions set whether you'd fold AI into standard cover or carve it out, bottom to top. Close to the centre, you're the Arbiter.`,
  },
  {
    q: "What happens to the results?",
    a: "We publish them as the AI Cover Compass report: every split, by role, with the method and sample sizes in full. Individual answers are never published.",
  },
  {
    q: "Who is behind it?",
    a: "VizCo, the AI and emerging risk specialty broker. Reading policies against how AI fails is our day job. We wanted the market's view, not only ours.",
  },
];

export default function CompassPage() {
  return (
    <main>
      <JsonLd data={faqSchema(FAQ)} />
      <JsonLd data={breadcrumbSchema([{ name: COMPASS.name, path: COMPASS.path }])} />

      <CompassGame />

      <Block id="how" number="01" label="How it works" title="Twelve calls. One map of the market.">
        <ol className="mt-12 grid gap-px border border-line-dark bg-line-dark md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 80} className="bg-surface p-7 sm:p-8">
              <span className="font-mono text-[0.6875rem] text-subtle">{s.n}</span>
              <h3 className="font-display t-h3 mt-8 text-cream">{s.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-cream-muted sm:text-base">{s.body}</p>
            </Reveal>
          ))}
        </ol>
        <dl className="mt-10 grid gap-6 sm:grid-cols-2">
          {[AXES.x, AXES.y].map((a, i) => (
            <div key={a.title} className="border-t border-cream pt-5">
              <dt className="eyebrow text-cream-muted">
                {i === 0 ? "Left to right" : "Bottom to top"} &middot; {a.title}
              </dt>
              <dd className="font-display mt-3 text-[1.5rem] leading-tight tracking-[-0.03em] text-cream sm:text-[1.75rem]">{a.question}</dd>
              <dd className="mt-2 text-[0.9375rem] text-cream-muted">
                {a.neg} &larr; &rarr; {a.pos}
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block id="positions" number="02" label="The five positions" title="Every player lands in one." sub="Which one are you? Make your calls before you decide.">
        <ul className="mt-12 grid gap-px border border-line-dark bg-line-dark sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPE_ORDER.map((id, i) => {
            const a = ARCHETYPES[id];
            return (
              <Reveal as="li" key={id} delay={i * 60} className="flex flex-col bg-surface p-7 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <MiniCompass id={id} />
                  <span className="eyebrow text-right !text-[0.65625rem] text-subtle">{a.where}</span>
                </div>
                <h3 className="font-display t-h3 mt-8 text-cream">{a.name}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-cream-muted sm:text-base">{a.line}</p>
                <p className="mt-auto pt-6 text-[0.9375rem] italic text-cream">&ldquo;{a.says}&rdquo;</p>
              </Reveal>
            );
          })}
          <Reveal as="li" delay={300} className="flex flex-col justify-between gap-8 bg-cream p-7 text-ink sm:p-8">
            <p className="font-display text-[1.75rem] leading-tight tracking-[-0.03em]">Find out which one you are.</p>
            <StartButton className="!bg-ink !text-cream hover:!bg-ink-3 w-fit">Start</StartButton>
          </Reveal>
        </ul>
      </Block>

      <Block id="why" number="03" label="Why we're running it" title="The market is arguing about AI cover without shared evidence.">
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-5 text-base leading-relaxed text-cream-muted sm:text-[1.0625rem]">
            <p>
              Standard wording that writes generative AI out of business policies has been available to insurers since January 2026, and is on file
              in 49 US states.
              <Cite s="insuranceBusiness" />
            </p>
            <p>
              Most policies still say nothing about AI at all. Whether they pay is argued after the loss, by people reading the same words
              differently.
            </p>
            <p className="text-cream">
              If professionals can&apos;t agree whether a policy pays, that policy is silent. The Compass measures that disagreement, case by case
              and role by role, and publishes it.
            </p>
          </div>
          <ul className="border-t border-line-dark">
            {["Every split, overall and by role", "The map of where professionals stand", "Method, thresholds and sample sizes, in full", "Never an individual's answers"].map(
              (t, i) => (
                <li key={t} className="flex items-center gap-4 border-b border-line-dark py-4">
                  <span className="w-6 shrink-0 font-mono text-[0.6875rem] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden className="h-2 w-2 shrink-0 bg-signal" />
                  <span className="text-base text-cream">{t}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </Block>

      <section className="relative overflow-hidden bg-cream py-20 text-ink sm:py-28">
        <div aria-hidden className="grid-texture pointer-events-none absolute inset-0" />
        <Container className="relative">
          <Reveal className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow flex items-center gap-3 text-ink/55">
                <span aria-hidden className="signal-dot is-live" />
                <span className="text-ink">04</span> The Founding {COMPASS.founding}
              </p>
              <h2 className="font-display t-h2 mt-7 max-w-3xl text-balance">Early players shape what this becomes.</h2>
              <p className="t-lead mt-6 max-w-2xl text-pretty text-ink/65">
                The first {COMPASS.founding} professionals to play and join are credited by name in the first AI Cover Compass report, see the
                results before anyone else, and tell us what to test next.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <StartButton className="!bg-ink !text-cream hover:!bg-ink-3">Claim your place</StartButton>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink/45">Play first. Join at the end.</p>
            </div>
          </Reveal>
        </Container>
      </section>

      <Block id="faq" number="05" label="Questions" title="Before you play.">
        <Faq items={FAQ} className="mt-10 max-w-3xl" />
        <p className="mt-10 max-w-3xl text-[0.8125rem] leading-relaxed text-subtle">{COMPASS_DISCLAIMER}</p>
      </Block>
    </main>
  );
}
