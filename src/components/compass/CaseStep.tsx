"use client";

import { Fragment, useEffect, useRef, type ReactNode, type Ref } from "react";
import { Check, X } from "lucide-react";
import Cite from "@/components/Cite";
import { QuestionMark, SwapArrow } from "@/components/ui";
import SplitBars from "@/components/compass/SplitBars";
import { CASES, ROLES, VERDICTS, type CaseItem, type RoleId, type Verdict } from "@/content/compass";
import { countsFor, splitLabel, splitScore, withVote, type Tally } from "@/lib/compass/score";

const ICONS = { yes: Check, arguable: QuestionMark, no: X } as const;
const LEAN: Record<Verdict, string> = { yes: "Pays", arguable: "Arguable", no: "Doesn't pay" };
const VERDICT_IDS = VERDICTS.map((v) => v.id);

/** Splits are shown from this many calls, and called "early" below EARLY. */
export const SHOW_FROM = 5;
export const EARLY = 30;

/** Renders the wording, underlining each [[defined term]]. */
function Wording({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[(.+?)\]\]/g).map((part, i) =>
        i % 2 ? (
          <span key={i} className="underline decoration-signal decoration-2 underline-offset-[0.3em]">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export default function CaseStep({
  item,
  step,
  answer,
  tally,
  role,
  live,
  onVote,
  onNext,
  isLast,
  who,
  headingRef,
}: {
  item: CaseItem;
  step: "ask" | "who" | "reveal";
  answer?: Verdict;
  tally?: Tally;
  role: RoleId | null;
  live: boolean;
  onVote: (v: Verdict) => void;
  onNext: () => void;
  isLast: boolean;
  who: ReactNode;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const number = CASES.findIndex((c) => c.id === item.id) + 1;
  const after = useRef<HTMLDivElement>(null);

  // On a phone the role picker and the reveal land below the fold: bring them into view.
  useEffect(() => {
    if (step === "ask" || !after.current) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => after.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 120);
    return () => window.clearTimeout(id);
  }, [step]);

  return (
    <article className="cmp-step-in">
      <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-cream-muted">
        <span className="text-cream">Case {String(number).padStart(2, "0")}</span>
        <span aria-hidden className="h-px w-5 bg-line-strong" />
        <span>{item.insured}</span>
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-5 text-balance text-[2.25rem] leading-[1.02] tracking-[-0.038em] text-cream outline-none sm:text-[3.25rem]"
      >
        {item.title}
      </h2>
      <p className="t-lead mt-5 max-w-2xl text-pretty text-cream-muted">{item.facts}</p>

      <figure className="mt-8 border border-line-dark bg-surface shadow-[var(--shadow-paper)]">
        <div className="px-5 pt-5 sm:px-7 sm:pt-6">
          <p className="eyebrow text-subtle">The policy</p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-cream-muted sm:text-base">{item.policy}</p>
        </div>
        <blockquote className="mx-5 mt-5 border-l-2 border-cream pl-4 sm:mx-7 sm:pl-5">
          <p className="eyebrow text-subtle">The wording</p>
          <p className="mt-2 text-pretty text-[1.0625rem] leading-relaxed tracking-[-0.012em] text-cream sm:text-[1.25rem] sm:leading-[1.55]">
            &ldquo;<Wording text={item.clause} />&rdquo;
          </p>
        </blockquote>
        {item.terms ? (
          <dl className="mx-5 mt-5 bg-ink-2 px-4 py-3.5 sm:mx-7 sm:px-5">
            {Object.entries(item.terms).map(([term, def]) => (
              <div key={term}>
                <dt className="eyebrow !text-[0.65625rem] text-cream-muted">Defined term: {term}</dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-cream">{def}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <figcaption className="mt-5 border-t border-line-dark px-5 py-3 text-[0.75rem] leading-relaxed text-subtle sm:px-7">
          {item.wording.note}
          {item.wording.source ? <Cite s={item.wording.source} /> : null}
        </figcaption>
      </figure>
      <p className="mt-3 text-[0.8125rem] text-subtle">
        {item.basis.label}
        {item.basis.source ? <Cite s={item.basis.source} /> : null}
      </p>

      <div className="mt-10 sm:mt-12">
        <h3 className="font-display text-[2rem] leading-none tracking-[-0.035em] text-cream sm:text-[2.75rem]">Does it pay?</h3>
        <p className="mt-3 max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-cream-muted sm:text-base">{item.crux}</p>
        <div role="radiogroup" aria-label="Does it pay?" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {VERDICTS.map((v) => {
            const Icon = ICONS[v.id];
            const on = answer === v.id;
            const dim = answer !== undefined && !on;
            const locked = step === "reveal";
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-disabled={locked}
                onClick={() => !locked && onVote(v.id)}
                className={`group relative flex min-h-[7.5rem] flex-col items-start justify-between gap-4 border p-3.5 text-left transition-[background-color,border-color,color,opacity,translate] duration-300 sm:min-h-[9rem] sm:p-5 ${
                  on
                    ? "border-cream bg-cream text-ink"
                    : `border-line-strong bg-surface text-cream ${locked ? "cursor-default" : "hover:-translate-y-0.5 hover:border-cream"}`
                } ${dim ? "opacity-40" : ""}`}
              >
                <span className="flex w-full items-start justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center sm:h-11 sm:w-11 ${
                      on ? "bg-signal text-signal-ink" : "border border-line-strong text-cream group-hover:border-cream"
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                  </span>
                  <span aria-hidden className={`hidden font-mono text-[0.6875rem] sm:inline ${on ? "text-ink/50" : "text-subtle"}`}>{v.key}</span>
                </span>
                <span>
                  <span className="font-display block text-[1.25rem] leading-none tracking-[-0.03em] sm:text-[1.75rem]">{v.label}</span>
                  <span className={`mt-1.5 block text-[0.75rem] leading-snug sm:text-[0.8125rem] ${on ? "text-ink/65" : "text-cream-muted"}`}>
                    {v.tag}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={after} className="scroll-mt-20 sm:scroll-mt-24">
        {step === "who" ? who : null}
        {step === "reveal" && answer ? (
          <CaseReveal item={item} answer={answer} tally={tally} role={role} live={live} onNext={onNext} isLast={isLast} />
        ) : null}
      </div>
    </article>
  );
}

function CaseReveal({
  item,
  answer,
  tally,
  role,
  live,
  onNext,
  isLast,
}: {
  item: CaseItem;
  answer: Verdict;
  tally?: Tally;
  role: RoleId | null;
  live: boolean;
  onNext: () => void;
  isLast: boolean;
}) {
  const t = withVote(tally, answer, role);
  const counts = countsFor(t, VERDICT_IDS);
  const n = counts.reduce((a, b) => a + b, 0);
  const rows = VERDICTS.map((v, i) => ({ key: v.id, label: v.label, count: counts[i] }));
  const score = splitScore(counts);
  const leader = rows.reduce((a, b) => (b.count > a.count ? b : a));

  const peer = role ? ROLES.find((r) => r.id === role) : null;
  const peerCounts = role ? countsFor(t, VERDICT_IDS, role) : [];
  const peerN = peerCounts.reduce((a, b) => a + b, 0);

  return (
    <section aria-live="polite" className="cmp-rise mt-10 border-t border-cream pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="eyebrow text-cream">How the market called it</p>
        {live ? (
          <p className="eyebrow text-subtle">
            {n} {n === 1 ? "call" : "calls"}
            {n >= SHOW_FROM && n < EARLY ? " · early read" : ""}
          </p>
        ) : null}
      </div>

      {live && n >= SHOW_FROM ? (
        <>
          <SplitBars rows={rows} mine={answer} early={n < EARLY} />
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.9375rem] text-cream-muted">
            <span className="flex items-center gap-3">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">Split</span>
              <span aria-hidden className="relative block h-1.5 w-24 bg-ink-3">
                <span className="cmp-bar absolute inset-y-0 left-0 bg-signal" style={{ width: `${Math.round(score * 100)}%`, animationDelay: "400ms" }} />
              </span>
              <span className="font-mono tabular-nums text-cream">{Math.round(score * 100)}/100</span>
            </span>
            <span>
              {splitLabel(score)}
              {score < 0.85 ? `, towards ${leader.label}` : ""}
            </span>
          </div>
          {peer && peerN >= SHOW_FROM ? (
            <p className="mt-3 text-[0.9375rem] text-cream-muted">
              <span className="text-cream">{peer.plural}:</span>{" "}
              {VERDICTS.map((v, i) => `${Math.round((peerCounts[i] / peerN) * 100)}% ${v.label}`).join(", ")}{" "}
              <span className="text-subtle">({peerN} calls)</span>
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-cream-muted">
          {live ? (
            <>
              You&apos;re one of the first {n <= 1 ? "" : `${n} `}to call this case. The split appears once {SHOW_FROM} people have.
            </>
          ) : (
            <>Live results switch on soon. Your call still shapes your position on the map.</>
          )}
        </p>
      )}

      <div className="mt-8 bg-ink-2 p-5 sm:p-7">
        <p className="eyebrow flex items-center gap-3 text-cream-muted">
          <span aria-hidden className="signal-dot" />
          Our reading <span className="text-cream">{LEAN[item.reading.lean]}</span>
        </p>
        <p className="mt-3 text-pretty text-[1.0625rem] leading-relaxed text-cream">{item.reading.text}</p>
        <p className="mt-3 text-[0.8125rem] text-subtle">
          {answer !== item.reading.lean ? "You read it differently. That's what the poll is for. " : ""}
          One reading, not the answer: nobody is scored right or wrong.
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="group relative inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-[background-color,scale] duration-300 hover:bg-accent-deep active:scale-[0.985] sm:w-auto"
        >
          {isLast ? "See where you land" : "Next"}
          <SwapArrow />
          <span aria-hidden className="ml-1 hidden font-mono text-[0.6875rem] text-ink/45 sm:inline">
            Enter
          </span>
        </button>
      </div>
    </section>
  );
}
