"use client";

import { useEffect, useState, type Ref } from "react";
import { SwapArrow } from "@/components/ui";
import { AGREE, STANCES, type Agree, type BonusItem, type StanceItem } from "@/content/compass";
import { countsFor, withVote, type Tally } from "@/lib/compass/score";
import { SHOW_FROM } from "@/components/compass/CaseStep";

const AGREE_IDS = AGREE.map((a) => a.id);
/** How long the market's lean shows before the next statement. */
const DWELL = 2400;

/** A quick position: one tap, a glance at the market, then on to the next. */
export default function StanceStep({
  item,
  answer,
  tally,
  role,
  live,
  onVote,
  onNext,
  isLast,
  headingRef,
}: {
  item: StanceItem | BonusItem;
  answer?: Agree;
  tally?: Tally;
  role: string | null;
  live: boolean;
  onVote: (a: Agree) => void;
  onNext: () => void;
  isLast: boolean;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [auto, setAuto] = useState(true);
  const bonus = item.kind === "bonus";
  const number = bonus ? 0 : STANCES.findIndex((s) => s.id === item.id) + 1;

  useEffect(() => {
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Moves on by itself once answered. Changing the answer restarts the wait.
  useEffect(() => {
    if (answer === undefined || !auto || isLast) return;
    const id = window.setTimeout(onNext, DWELL);
    return () => window.clearTimeout(id);
  }, [answer, auto, isLast, onNext]);

  const t = answer === undefined ? tally : withVote(tally, answer, role);
  const counts = countsFor(t, AGREE_IDS);
  const n = counts.reduce((a, b) => a + b, 0);
  const agree = counts[2] + counts[3];
  const agreePct = n ? Math.round((agree / n) * 100) : 0;

  return (
    <article className="cmp-step-in">
      <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-cream-muted">
        {bonus ? (
          <>
            <span className="text-cream">One more</span>
            <span aria-hidden className="h-px w-5 bg-line-strong" />
            <span>For the report</span>
          </>
        ) : (
          <>
            <span className="text-cream">Position {String(number).padStart(2, "0")}</span>
            <span aria-hidden className="h-px w-5 bg-line-strong" />
            <span>{item.topic}</span>
          </>
        )}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-6 max-w-[18em] text-balance text-[2.125rem] leading-[1.06] tracking-[-0.036em] text-cream outline-none sm:mt-8 sm:text-[3.5rem]"
      >
        &ldquo;{item.statement}&rdquo;
      </h2>
      <p className="mt-5 text-[0.9375rem] text-cream-muted sm:text-base">
        {bonus ? "Not scored. It goes straight into the report." : "Where do you stand? No middle option: take a side."}
      </p>

      <div role="radiogroup" aria-label="Where do you stand?" className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-4 sm:gap-3">
        {AGREE.map((a) => {
          const on = answer === a.id;
          const dim = answer !== undefined && !on;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onVote(a.id)}
              className={`group flex min-h-[5.5rem] flex-col justify-between gap-3 border p-3.5 text-left transition-[background-color,border-color,color,opacity,translate] duration-300 sm:min-h-[8rem] sm:p-5 ${
                on ? "border-cream bg-cream text-ink" : "border-line-strong bg-surface text-cream hover:-translate-y-0.5 hover:border-cream"
              } ${dim ? "opacity-40" : ""}`}
            >
              <span className="flex w-full items-center justify-between">
                {/* Where this option sits on the four-step scale */}
                <span aria-hidden className="flex gap-1">
                  {AGREE_IDS.map((s) => (
                    <span
                      key={s}
                      className={`h-2.5 w-2.5 ${s === a.id ? (on ? "bg-signal" : "bg-cream") : on ? "bg-ink/20" : "bg-line-dark"}`}
                    />
                  ))}
                </span>
                <span aria-hidden className={`hidden font-mono text-[0.6875rem] sm:inline ${on ? "text-ink/50" : "text-subtle"}`}>{a.key}</span>
              </span>
              <span className="font-display text-[1.125rem] leading-[1.1] tracking-[-0.025em] sm:text-[1.375rem]">{a.label}</span>
            </button>
          );
        })}
      </div>

      {answer !== undefined ? (
        <div aria-live="polite" className="cmp-rise mt-8 flex flex-col gap-6 border-t border-line-dark pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {live && n >= SHOW_FROM ? (
              <>
                <p className="text-[0.9375rem] text-cream-muted">
                  <span className="font-display text-2xl tracking-[-0.03em] text-cream">{agreePct}%</span> agree so far
                  <span className="text-subtle"> &middot; {n} answers</span>
                </p>
                <span aria-hidden className="mt-3 flex h-2 w-full max-w-sm bg-line-strong">
                  <span className="cmp-bar block h-full bg-cream" style={{ width: `${agreePct}%` }} />
                </span>
              </>
            ) : (
              <p className="text-[0.9375rem] text-cream-muted">
                {live ? "You're one of the first to take a position on this." : "Noted. Your position is moving on the map."}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="group relative inline-flex h-[3.25rem] w-full shrink-0 items-center justify-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-[background-color,scale] duration-300 hover:bg-accent-deep active:scale-[0.985] sm:w-auto"
          >
            {isLast ? "See where you land" : "Next"}
            <SwapArrow />
            {auto && !isLast ? (
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/15">
                <span key={answer} className="cmp-count absolute inset-0 bg-signal" style={{ animationDuration: `${DWELL}ms` }} />
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
    </article>
  );
}
