"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import Cite from "@/components/Cite";
import Reveal from "@/components/Reveal";
import { Container, Label, QuestionMark } from "@/components/ui";
import { ChatCard, ClaimLetter, PolicySheet, Stamp, type Verdict } from "@/components/home/ClaimPapers";

type Step = { label: string; title: string; body?: ReactNode; paper?: ReactNode };

const STEPS: Step[] = [
  {
    label: "The promise",
    title: "Your chatbot promises a customer a refund it shouldn't.",
    body: "It sounded certain. It spoke for you.",
    paper: <ChatCard />,
  },
  {
    label: "The claim",
    title: "The customer holds you to it.",
    body: (
      <>
        It&apos;s happened. A tribunal held an airline liable for its chatbot&apos;s wrong refund advice, and rejected the argument that the chatbot
        was responsible for its own actions.
        <Cite s="moffatt" />
      </>
    ),
    paper: <ClaimLetter />,
  },
  {
    label: "The policy",
    title: "You turn to your insurance. It was written before AI.",
    body: (
      <>
        Most policies never mention AI.
        <Cite s="csis" /> More now write it out, often on an extra page added at renewal.
        <Cite s="moneyGeek" />
      </>
    ),
    paper: <PolicySheet />,
  },
  { label: "The answer", title: "Does it pay?" },
];

const ANSWERS: { key: Verdict; answer: string; tag: string; line: string; Icon: (p: { className?: string }) => ReactNode }[] = [
  {
    key: "maybe",
    answer: "Maybe",
    tag: "Silent",
    line: "Your policy never mentions AI. Whether it pays is argued after the loss.",
    Icon: (p) => <QuestionMark {...p} strokeWidth={2} />,
  },
  { key: "no", answer: "No", tag: "Excluded", line: "Your policy writes AI out.", Icon: (p) => <X {...p} strokeWidth={2} /> },
  { key: "yes", answer: "Yes", tag: "Covered", line: "Only if your policy names AI and covers it.", Icon: (p) => <Check {...p} strokeWidth={2} /> },
];

const LAST = STEPS.length - 1;
const CYCLE = 1900; // ms each answer holds on the stamp before the next

/**
 * Why it matters, told as one claim from start to finish. On desktop the papers stay
 * pinned beside the text and pile up as each step scrolls past; on smaller screens each
 * step shows its own paper inline. At the last step the stamp runs Maybe, No, then lands
 * on Yes, and pointing at an answer shows it.
 */
export default function ClaimStory() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState<Verdict>("maybe");
  const [hover, setHover] = useState<Verdict | null>(null);
  const steps = useRef<(HTMLLIElement | null)[]>([]);

  // The step crossing the middle of the screen is the current one
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-52% 0px -48% 0px" },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Reaching the answer: Maybe, then No, then Yes, where we get you
  useEffect(() => {
    if (active !== LAST) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto("yes");
      return;
    }
    setAuto("maybe");
    const a = window.setTimeout(() => setAuto("no"), CYCLE);
    const b = window.setTimeout(() => setAuto("yes"), CYCLE * 2);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [active]);

  const verdict = hover ?? auto;

  return (
    <section id="why" className="relative py-20 sm:py-28 lg:pb-16 lg:pt-32">
      <Container>
        <Reveal className="max-w-4xl">
          <Label>Why it matters</Label>
          <h2 className="font-display t-h2 mt-7 text-balance text-cream">What happens when your AI gets it wrong?</h2>
        </Reveal>

        <div className="mt-14 grid gap-x-16 lg:mt-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-x-24">
          <ol className="space-y-20 sm:space-y-24 lg:space-y-0">
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <li
                  key={s.label}
                  ref={(el) => {
                    steps.current[i] = el;
                  }}
                  data-step={i}
                  className={`transition-opacity duration-500 lg:flex lg:min-h-[52vh] lg:items-center lg:py-12 lg:first:min-h-[44vh] lg:first:items-start lg:first:pt-20 ${on ? "" : "lg:opacity-30"}`}
                >
                  <div className="w-full">
                    <p className="eyebrow flex items-center gap-3 text-cream-muted">
                      <span aria-hidden className={`h-2 w-2 transition-colors duration-500 ${on ? "bg-signal" : "bg-line-strong"}`} />
                      {s.label}
                    </p>
                    <h3 className="font-display mt-5 text-balance text-[2rem] leading-[1.04] tracking-[-0.038em] text-cream sm:text-[2.5rem] lg:text-[2.75rem]">
                      {s.title}
                    </h3>
                    {s.body ? <p className="mt-5 max-w-lg text-pretty text-[1.0625rem] leading-relaxed text-cream-muted sm:text-lg">{s.body}</p> : null}

                    {i === LAST ? (
                      <>
                        <ul className="mt-8 border-b border-line-dark" onMouseLeave={() => setHover(null)}>
                          {ANSWERS.map((a) => {
                            const lit = verdict === a.key;
                            return (
                              <li
                                key={a.key}
                                onMouseEnter={() => setHover(a.key)}
                                className="grid grid-cols-[auto_1fr] items-start gap-x-5 border-t border-line-dark py-5"
                              >
                                <span
                                  aria-hidden
                                  className={`flex h-11 w-11 items-center justify-center transition-colors duration-300 ${
                                    a.key === "yes" ? "bg-signal text-signal-ink" : lit ? "bg-cream text-ink" : "border border-line-strong text-cream"
                                  }`}
                                >
                                  <a.Icon className="h-5 w-5" />
                                </span>
                                <div>
                                  <p className="flex items-baseline gap-3">
                                    <span className="font-display text-2xl leading-none tracking-[-0.035em] text-cream">{a.answer}</span>
                                    <span className="eyebrow !text-[0.625rem] text-cream-muted">{a.tag}</span>
                                  </p>
                                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-cream-muted">{a.line}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                        <p className="font-display mt-10 text-[2rem] leading-tight tracking-[-0.04em] text-cream sm:text-[2.5rem]">
                          We get you to <span className="block-mark">Yes.</span>
                        </p>
                      </>
                    ) : null}

                    {/* Smaller screens: each step's own paper, inline */}
                    {s.paper ? <div className="mt-10 max-w-md lg:hidden">{s.paper}</div> : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Desktop: the papers, pinned while the steps scroll past */}
          <div className="hidden lg:block">
            <div className="sticky top-[max(8rem,calc(50vh-13.5rem))] h-[34rem]">
              <Scene step={active} verdict={verdict} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** How far each paper on the pile sits below the one before, so its header still shows. */
const PEEK = 3.5; // rem
const PILE = [
  { x: "0%", tilt: "-1deg" },
  { x: "7%", tilt: "1.25deg" },
  { x: "3%", tilt: "-0.75deg" },
];

/**
 * The papers as a pile on the desk: each new one slides in on top, a little lower, and
 * the ones beneath step back so only their headers show.
 */
function Scene({ step, verdict }: { step: number; verdict: Verdict }) {
  const papers = [<ChatCard key="chat" />, <ClaimLetter key="claim" />, <PolicySheet key="policy" stamp={step >= LAST ? <Stamp verdict={verdict} /> : null} />];
  const top = Math.min(step, papers.length - 1);
  return (
    <div aria-hidden className="relative h-full">
      {papers.map((paper, i) => {
        const shown = i <= top;
        const depth = top - i;
        return (
          <div
            key={i}
            className="absolute left-0 top-4 w-[86%] origin-top transition-[opacity,translate,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              zIndex: i,
              opacity: shown ? 1 : 0,
              translate: `${PILE[i].x} ${i * PEEK + (shown ? 0 : 3)}rem`,
              scale: shown ? `${1 - depth * 0.035}` : "1",
              rotate: PILE[i].tilt,
            }}
          >
            {paper}
          </div>
        );
      })}

      {/* Where we are in the story */}
      <div className="absolute -bottom-6 right-0 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s.label} className={`h-1.5 transition-all duration-500 ${i === step ? "w-6 bg-cream" : i < step ? "w-1.5 bg-cream" : "w-1.5 bg-line-strong"}`} />
        ))}
      </div>
    </div>
  );
}
