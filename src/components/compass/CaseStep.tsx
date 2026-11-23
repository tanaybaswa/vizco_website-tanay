"use client";

import { useEffect, useRef, type Ref } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import Cite from "@/components/Cite";
import { QuestionMark, SwapArrow } from "@/components/ui";
import PolicyPaper from "@/components/compass/PolicyPaper";
import SplitBars from "@/components/compass/SplitBars";
import { TONE } from "@/components/compass/tones";
import { CASES, ROLES, VERDICTS, type CaseItem, type RoleId, type Verdict } from "@/content/compass";
import { countsFor, splitLabel, splitScore, withVote, type Tally } from "@/lib/compass/score";

const ICONS = { yes: Check, arguable: QuestionMark, no: X } as const;
const VERDICT_IDS = VERDICTS.map((v) => v.id);

/** Splits are shown from this many calls, and called "early" below EARLY. */
export const SHOW_FROM = 5;
export const EARLY = 30;

/**
 * One case, always laid out the same way: the story, then the sketch with the policy paper
 * beside it, then the call.
 */
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
  headingRef,
}: {
  item: CaseItem;
  step: "ask" | "reveal";
  answer?: Verdict;
  tally?: Tally;
  role: RoleId | null;
  live: boolean;
  onVote: (v: Verdict) => void;
  onNext: () => void;
  isLast: boolean;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const number = CASES.findIndex((c) => c.id === item.id) + 1;
  const after = useRef<HTMLDivElement>(null);

  // The reveal lands below the fold on a phone: bring it into view.
  useEffect(() => {
    if (step === "ask" || !after.current) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => after.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 120);
    return () => window.clearTimeout(id);
  }, [step]);

  return (
    <article className="cmp-step-in">
      <p className="eyebrow text-cream-muted">
        <span className="text-cream">Case {String(number).padStart(2, "0")}</span> / {String(CASES.length).padStart(2, "0")}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-4 text-balance text-[2.25rem] leading-[1.02] tracking-[-0.038em] text-cream outline-none sm:text-[3.25rem]"
      >
        {item.title}
      </h2>
      <p className="mt-5 max-w-2xl text-pretty text-[1.1875rem] leading-[1.5] tracking-[-0.016em] text-cream sm:text-[1.375rem]">{item.story}</p>

      {/* The sketch, with the policy laid beside it */}
      <div className="mt-8 grid items-center md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Image
          src={item.art.src}
          alt={item.art.alt}
          width={1024}
          height={768}
          unoptimized
          priority
          className="h-auto w-full select-none"
        />
        <PolicyPaper clause={item.clause} className="relative z-10 -mt-6 ml-auto w-[94%] md:-ml-10 md:mt-0 md:w-auto" />
      </div>

      <div className="mt-10 sm:mt-12">
        <h3 className="font-display text-[2rem] leading-none tracking-[-0.035em] text-cream sm:text-[2.5rem]">Does it pay?</h3>
        <div role="radiogroup" aria-label="Does it pay?" className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {VERDICTS.map((v) => {
            const Icon = ICONS[v.id];
            const t = TONE[v.tone];
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
                className={`group relative flex min-h-[7.5rem] flex-col items-start justify-between gap-4 border p-3.5 text-left transition-[background-color,border-color,color,opacity,translate,box-shadow] duration-300 sm:min-h-[8.5rem] sm:p-5 ${
                  on ? `${t.solid} border-transparent text-white shadow-[var(--shadow-lift)]` : `${t.soft} ${t.line} text-cream`
                } ${locked || on ? "cursor-default" : "hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"} ${dim ? "opacity-40" : ""}`}
              >
                <span className="flex w-full items-start justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center text-white sm:h-11 sm:w-11 ${on ? "bg-white/20" : t.solid}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
                  </span>
                  <span aria-hidden className={`hidden font-mono text-[0.6875rem] sm:inline ${on ? "text-white/70" : "text-subtle"}`}>
                    {v.key}
                  </span>
                </span>
                <span>
                  <span className="font-display block text-[1.25rem] leading-none tracking-[-0.03em] sm:text-[1.75rem]">{v.label}</span>
                  <span className={`mt-1.5 block text-[0.75rem] font-medium leading-snug sm:text-[0.8125rem] ${on ? "text-white/85" : t.text}`}>
                    {v.tag}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[0.8125rem] text-subtle">
          {item.basis.label}
          {item.basis.source ? <Cite s={item.basis.source} /> : null}
        </p>
      </div>

      <div ref={after} className="scroll-mt-8">
        {step === "reveal" && answer ? <CaseReveal answer={answer} tally={tally} role={role} live={live} onNext={onNext} isLast={isLast} /> : null}
      </div>
    </article>
  );
}

function CaseReveal({
  answer,
  tally,
  role,
  live,
  onNext,
  isLast,
}: {
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
  const rows = VERDICTS.map((v, i) => ({ key: v.id, label: v.label, count: counts[i], tone: v.tone }));
  const score = splitScore(counts);
  const leader = rows.reduce((a, b) => (b.count > a.count ? b : a));
  const mine = n ? Math.round((counts[VERDICT_IDS.indexOf(answer)] / n) * 100) : 0;

  const peer = role ? ROLES.find((r) => r.id === role) : null;
  const peerCounts = role ? countsFor(t, VERDICT_IDS, role) : [];
  const peerN = peerCounts.reduce((a, b) => a + b, 0);
  const shown = live && n >= SHOW_FROM;

  return (
    <section aria-live="polite" className="cmp-rise mt-10 border-t border-cream pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="eyebrow text-cream">How everyone&apos;s calling it</p>
        {live ? (
          <p className="eyebrow text-subtle">
            {n} {n === 1 ? "call" : "calls"}
            {shown && n < EARLY ? " · early read" : ""}
          </p>
        ) : null}
      </div>

      {shown ? (
        <>
          <p className="font-display mt-4 text-[1.5rem] leading-tight tracking-[-0.03em] text-cream sm:text-[1.875rem]">
            {mine >= 50 ? `You're with the ${mine}%.` : mine <= 20 ? `Bold call. Only ${mine}% agree with you.` : `${mine}% called it your way.`}
          </p>
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
            <>Noted. The full results go out by email, and we&apos;ll publish them here.</>
          )}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="group relative inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-[background-color,scale] duration-300 hover:bg-accent-deep active:scale-[0.985] sm:w-auto"
        >
          {isLast ? "Last step" : "Next"}
          <SwapArrow />
          <span aria-hidden className="ml-1 hidden font-mono text-[0.6875rem] text-ink/45 sm:inline">
            Enter
          </span>
        </button>
      </div>
    </section>
  );
}
