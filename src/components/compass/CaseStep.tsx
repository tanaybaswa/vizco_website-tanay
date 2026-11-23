"use client";

import type { Ref } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import Cite from "@/components/Cite";
import { QuestionMark } from "@/components/ui";
import PolicyPaper from "@/components/compass/PolicyPaper";
import { TONE } from "@/components/compass/tones";
import { CASES, VERDICTS, type CaseItem, type Verdict } from "@/content/compass";
import type { View } from "@/lib/compass/summary";

const ICONS = { yes: Check, arguable: QuestionMark, no: X } as const;

/**
 * One case, laid out to fit a single screen: the story along the top, the sketch with the
 * policy paper beside it in the middle (it takes whatever height is left), the call along
 * the bottom. Once answered, the tiles themselves show how everyone called it.
 */
export default function CaseStep({
  item,
  answer,
  view,
  onVote,
  headingRef,
}: {
  item: CaseItem;
  answer?: Verdict;
  view: View | null;
  onVote: (v: Verdict) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const number = CASES.findIndex((c) => c.id === item.id) + 1;

  return (
    <article className="cmp-step-in grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-5 lg:h-auto lg:grid-rows-none lg:gap-4 short:gap-3 short:lg:gap-3">
      {/* The story */}
      {/* Headline and standfirst on one left edge: case, title, then the story beneath it */}
      <header className="lg:max-w-[46rem]">
        <p className="eyebrow text-cream-muted">
          <span className="text-cream">Case {String(number).padStart(2, "0")}</span> / {String(CASES.length).padStart(2, "0")}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display mt-1.5 text-balance text-[1.75rem] leading-[1.02] tracking-[-0.038em] text-cream outline-none sm:mt-2 sm:text-[2.5rem] lg:text-[2.75rem] short:text-[1.375rem] short:sm:text-[2.25rem] short:lg:text-[2.375rem]"
        >
          {item.title}
        </h2>
        <p className="mt-1.5 text-pretty text-[0.9375rem] leading-snug tracking-[-0.012em] text-cream sm:mt-2 sm:text-lg lg:mt-3 lg:text-[1.1875rem] lg:leading-[1.45] short:text-[0.875rem] short:sm:text-base short:lg:mt-2 short:lg:text-[1.0625rem]">
          {item.story}{" "}
          {/* The source: inline on a phone to save a line, its own quiet line on a laptop */}
          <span className="text-[0.75rem] text-subtle sm:text-[0.8125rem] lg:mt-1.5 lg:block">
            {item.basis.label}
            {item.basis.source ? <Cite s={item.basis.source} /> : null}
          </span>
        </p>
      </header>

      {/* The sketch, with the policy laid beside it */}
      <div className="flex min-h-0 flex-col md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* On a phone the paper overlaps the sketch's lower edge, so both keep their room */}
        <div className="relative min-h-[6.5rem] flex-1 md:h-full md:min-h-0 lg:h-[clamp(10rem,calc(100dvh-36.5rem),21rem)] lg:flex-none short:min-h-[5rem] short:lg:h-[clamp(10rem,calc(100dvh-33rem),15rem)]">
          <Image src={item.art.src} alt={item.art.alt} fill unoptimized priority sizes="(min-width: 768px) 55vw, 100vw" className="select-none object-contain object-top md:object-center" />
        </div>
        <PolicyPaper clause={item.clause} className="relative z-10 -mt-6 ml-auto mr-1 w-[90%] shrink-0 md:-ml-8 md:mr-0 md:mt-0 md:w-auto short:-mt-4" />
      </div>

      {/* The call */}
      <div className="grid gap-2 sm:gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-8">
        <h3 className="font-display text-[1.375rem] leading-none tracking-[-0.03em] text-cream sm:text-[1.75rem] lg:text-[1.875rem] short:text-[1.25rem]">Does it pay?</h3>
        <div role="radiogroup" aria-label="Does it pay?" className="grid grid-cols-3 gap-2 sm:gap-3">
          {VERDICTS.map((v, i) => {
            const Icon = ICONS[v.id];
            const t = TONE[v.tone];
            const on = answer === v.id;
            const share = view?.shares[i] ?? null;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${v.label}, ${v.tag}${share !== null ? `, ${share}% of players` : ""}`}
                onClick={() => onVote(v.id)}
                className={`group relative flex min-h-[4.5rem] flex-col justify-between gap-2 overflow-hidden border p-2.5 text-left short:min-h-[3.75rem] short:gap-1 short:py-2 transition-[background-color,border-color,color,box-shadow] duration-200 sm:min-h-[6.25rem] sm:gap-3 sm:p-4 lg:min-h-[5.25rem] short:sm:min-h-[5rem] ${
                  on ? `${t.solid} border-transparent text-white shadow-[var(--shadow-lift)]` : `${t.soft} ${t.line} text-cream hover:shadow-[var(--shadow-card)]`
                }`}
              >
                {/* Once answered, each tile fills to its share of the vote */}
                {share !== null && !on ? (
                  <span aria-hidden className={`cmp-bar absolute inset-y-0 left-0 ${t.solid} opacity-[0.14]`} style={{ width: `${share}%` }} />
                ) : null}
                <span className="relative flex w-full items-center justify-between gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center text-white sm:h-9 sm:w-9 ${on ? "bg-white/20" : t.solid}`}>
                    <Icon className="h-3.5 w-3.5 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.5} />
                  </span>
                  {share !== null ? (
                    <span className="font-display text-[1.125rem] tabular-nums leading-none tracking-[-0.03em] sm:text-[1.625rem]">{share}%</span>
                  ) : (
                    <span aria-hidden className={`hidden font-mono text-[0.6875rem] sm:inline ${on ? "text-white/70" : "text-subtle"}`}>
                      {v.key}
                    </span>
                  )}
                </span>
                <span className="relative">
                  <span className="font-display block text-[1.0625rem] leading-none tracking-[-0.03em] sm:text-[1.5rem]">{v.label}</span>
                  <span className={`mt-1 block truncate text-[0.6875rem] font-medium sm:text-[0.8125rem] ${on ? "text-white/85" : t.text}`}>
                    {on ? "Your call" : v.tag}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
