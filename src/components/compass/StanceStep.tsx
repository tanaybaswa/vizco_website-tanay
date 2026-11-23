"use client";

import { useEffect, useState, type Ref } from "react";
import Image from "next/image";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { SwapArrow } from "@/components/ui";
import { TONE } from "@/components/compass/tones";
import { AGREE, STANCES, type Agree, type BonusItem, type StanceItem } from "@/content/compass";
import { countsFor, withVote, type Tally } from "@/lib/compass/score";
import { SHOW_FROM } from "@/components/compass/CaseStep";

const AGREE_IDS = AGREE.map((a) => a.id);
/** How long the market's lean shows before the next statement. */
const DWELL = 2400;

/** Two thumbs for "strongly", one otherwise: the strength reads without colour too. */
function Thumbs({ id, className }: { id: Agree; className: string }) {
  const Icon = id >= 2 ? ThumbsUp : ThumbsDown;
  const strong = id === 0 || id === 3;
  return (
    <span aria-hidden className="flex items-center gap-0.5">
      <Icon className={className} strokeWidth={2.25} />
      {strong ? <Icon className={className} strokeWidth={2.25} /> : null}
    </span>
  );
}

/** A quick statement: one tap, a glance at everyone else, then on to the next. */
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
  const shares = counts.map((c) => (n ? Math.round((c / n) * 100) : 0));
  const agreePct = shares[2] + shares[3];

  return (
    <article className="cmp-step-in">
      <p className="eyebrow text-cream-muted">
        {bonus ? (
          <>
            <span className="text-cream">One more</span> &middot; for the report
          </>
        ) : (
          <>
            <span className="text-cream">Hot take {String(number).padStart(2, "0")}</span> / {String(STANCES.length).padStart(2, "0")}
          </>
        )}
      </p>
      {/* The sketch, with the statement beside it */}
      <div className="mt-6 grid items-center gap-6 sm:mt-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-10">
        <Image
          src={item.art.src}
          alt={item.art.alt}
          width={1024}
          height={1024}
          unoptimized
          priority
          className="mx-auto h-auto w-full max-w-[17rem] select-none md:max-w-none"
        />
        <div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-balance text-[2.25rem] leading-[1.05] tracking-[-0.038em] text-cream outline-none sm:text-[3.25rem]"
          >
            &ldquo;{item.statement}&rdquo;
          </h2>
          <p className="mt-5 text-[0.9375rem] text-cream-muted sm:text-base">
            {bonus ? "Not scored. It goes straight into the report." : "Agree or disagree? No fence to sit on."}
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Agree or disagree?" className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-4 sm:gap-3">
        {AGREE.map((a) => {
          const tone = TONE[a.tone];
          const on = answer === a.id;
          const dim = answer !== undefined && !on;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onVote(a.id)}
              className={`group relative flex min-h-[6.25rem] flex-col justify-between gap-4 overflow-hidden border p-4 text-left transition-[background-color,border-color,color,opacity,translate,box-shadow] duration-300 sm:min-h-[8.5rem] sm:p-5 ${
                on ? `${tone.solid} border-transparent text-white shadow-[var(--shadow-lift)]` : `${tone.soft} ${tone.line} text-cream hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]`
              } ${dim ? "opacity-40" : ""}`}
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${on ? "bg-white/30" : tone.solid}`} />
              <span className="flex w-full items-center justify-between">
                <span className={on ? "text-white" : tone.text}>
                  <Thumbs id={a.id} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span aria-hidden className={`hidden font-mono text-[0.6875rem] sm:inline ${on ? "text-white/70" : "text-subtle"}`}>
                  {a.key}
                </span>
              </span>
              <span className="font-display text-[1.1875rem] leading-[1.1] tracking-[-0.025em] sm:text-[1.375rem]">{a.label}</span>
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
                {/* The four answers as one bar, in their colours */}
                <span aria-hidden className="mt-3 flex h-2.5 w-full max-w-sm overflow-hidden">
                  {AGREE.map((a, i) => (
                    <span key={a.id} className={`cmp-bar block h-full ${TONE[a.tone].solid}`} style={{ width: `${shares[i]}%`, animationDelay: `${i * 60}ms` }} />
                  ))}
                </span>
              </>
            ) : (
              <p className="text-[0.9375rem] text-cream-muted">
                {live ? "You're one of the first to take a side on this." : "Noted. Your dot is moving on the map."}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="group relative inline-flex h-[3.25rem] w-full shrink-0 items-center justify-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-[background-color,scale] duration-300 hover:bg-accent-deep active:scale-[0.985] sm:w-auto"
          >
            {isLast ? "Last step" : "Next"}
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
