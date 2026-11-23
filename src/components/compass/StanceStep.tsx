"use client";

import type { Ref } from "react";
import Image from "next/image";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { TONE } from "@/components/compass/tones";
import { AGREE, STANCES, type Agree, type BonusItem, type StanceItem } from "@/content/compass";
import type { View } from "@/lib/compass/summary";

/** Two thumbs for "strongly", one otherwise: the strength reads without colour too. */
function Thumbs({ id, className }: { id: Agree; className: string }) {
  const Icon = id >= 2 ? ThumbsUp : ThumbsDown;
  const strong = id === 0 || id === 3;
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-0.5">
      <Icon className={className} strokeWidth={2.25} />
      {strong ? <Icon className={className} strokeWidth={2.25} /> : null}
    </span>
  );
}

/**
 * A hot take, laid out to fit a single screen: the sketch beside the statement, the four
 * answers along the bottom. Once answered, each tile shows its share.
 */
export default function StanceStep({
  item,
  answer,
  view,
  onVote,
  headingRef,
}: {
  item: StanceItem | BonusItem;
  answer?: Agree;
  view: View | null;
  onVote: (a: Agree) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const bonus = item.kind === "bonus";
  const number = bonus ? 0 : STANCES.findIndex((s) => s.id === item.id) + 1;

  return (
    <article className="cmp-step-in grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-5 short:gap-3">
      <p className="eyebrow text-cream-muted">
        {bonus ? (
          <>
            <span className="text-cream">One more</span> &middot; for the report, not scored
          </>
        ) : (
          <>
            <span className="text-cream">Hot take {String(number).padStart(2, "0")}</span> / {String(STANCES.length).padStart(2, "0")}
          </>
        )}
      </p>

      {/* The sketch, with the statement beside it */}
      <div className="flex min-h-0 flex-col gap-3 md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center md:gap-10">
        <div className="relative min-h-0 flex-1 md:h-full">
          <Image src={item.art.src} alt={item.art.alt} fill unoptimized priority sizes="(min-width: 768px) 40vw, 100vw" className="select-none object-contain" />
        </div>
        <div className="shrink-0">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-balance text-[1.625rem] leading-[1.06] tracking-[-0.036em] text-cream outline-none sm:text-[2.5rem] lg:text-[3.25rem] short:lg:text-[2.625rem]"
          >
            &ldquo;{item.statement}&rdquo;
          </h2>
          <p className="mt-2 text-[0.875rem] text-cream-muted sm:mt-4 sm:text-base">Agree or disagree? No fence to sit on.</p>
        </div>
      </div>

      {/* The answers */}
      <div role="radiogroup" aria-label="Agree or disagree?" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {AGREE.map((a, i) => {
          const tone = TONE[a.tone];
          const on = answer === a.id;
          const share = view?.shares[i] ?? null;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${a.label}${share !== null ? `, ${share}% of players` : ""}`}
              onClick={() => onVote(a.id)}
              className={`relative flex min-h-[3.5rem] items-center justify-between gap-2 overflow-hidden border px-3 py-2 text-left transition-[background-color,border-color,color,box-shadow] duration-200 sm:min-h-[6.5rem] sm:flex-col sm:items-start sm:p-4 short:sm:min-h-[5rem] ${
                on ? `${tone.solid} border-transparent text-white shadow-[var(--shadow-lift)]` : `${tone.soft} ${tone.line} text-cream hover:shadow-[var(--shadow-card)]`
              }`}
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${on ? "bg-white/30" : tone.solid}`} />
              {share !== null && !on ? (
                <span aria-hidden className={`cmp-bar absolute inset-y-0 left-0 ${tone.solid} opacity-[0.14]`} style={{ width: `${share}%` }} />
              ) : null}
              <span className="relative flex items-center gap-2.5 sm:w-full sm:justify-between">
                <span className={on ? "text-white" : tone.text}>
                  <Thumbs id={a.id} className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                {share !== null ? (
                  <span className="font-display hidden text-[1.5rem] tabular-nums leading-none tracking-[-0.03em] sm:inline">{share}%</span>
                ) : (
                  <span aria-hidden className={`hidden font-mono text-[0.6875rem] sm:inline ${on ? "text-white/70" : "text-subtle"}`}>
                    {a.key}
                  </span>
                )}
              </span>
              <span className="font-display relative flex-1 text-[0.9375rem] leading-[1.1] tracking-[-0.02em] sm:flex-none sm:text-[1.25rem]">{a.label}</span>
              {share !== null ? <span className="font-display relative text-base tabular-nums sm:hidden">{share}%</span> : null}
            </button>
          );
        })}
      </div>
    </article>
  );
}
