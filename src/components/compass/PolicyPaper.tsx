import { Fragment } from "react";
import localFont from "next/font/local";

/*
 * A serif for wording, the way real policies are set. Loaded only where the paper appears.
 * Source Serif 4 (OFL, see fonts/OFL.txt), self-hosted: the Google Fonts loader can fail
 * the build when Google serves this family without a file extension.
 */
const policySerif = localFont({
  src: "./fonts/source-serif-4-latin-variable.woff2",
  weight: "400 600",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** The wording, with the phrase that matters set in the black block. Marked [[like this]]. */
function Wording({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[(.+?)\]\]/g).map((part, i) =>
        i % 2 ? (
          <span key={i} className="block-mark">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * The policy, always as the same piece of paper: a specimen page laid beside the sketch,
 * slightly turned, with a folded corner. Every case renders its wording through this.
 */
export default function PolicyPaper({ clause, className = "" }: { clause: string; className?: string }) {
  return (
    <figure className={`relative rotate-[1.25deg] ${className}`}>
      <div className="relative bg-[#fffefa] px-4 pb-4 pt-3.5 shadow-[var(--shadow-paper)] ring-1 ring-black/[0.06] sm:px-7 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 short:pb-4 short:pt-3.5">
        {/* Folded corner */}
        <span
          aria-hidden
          className="absolute right-0 top-0 h-7 w-7"
          style={{ background: "linear-gradient(225deg, var(--ink) 50%, #e4e4df 50%)", boxShadow: "-2px 2px 3px rgba(10,10,10,0.08)" }}
        />
        <div className="flex items-center justify-between gap-4 border-b border-cream pb-2 pr-6 sm:pb-3">
          <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.18em] text-cream">The policy</span>
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-subtle">Specimen wording</span>
        </div>
        <blockquote
          className={`${policySerif.className} mt-2.5 text-pretty text-[1.0625rem] leading-[1.45] text-cream sm:mt-4 sm:text-[1.25rem] sm:leading-[1.5] lg:text-[1.25rem] xl:text-[1.375rem] short:text-[1rem] short:sm:text-[1.125rem]`}
        >
          &ldquo;<Wording text={clause} />&rdquo;
        </blockquote>
        {/* The rest of the page, suggested */}
        <div aria-hidden className="mt-5 hidden space-y-2.5 sm:block lg:hidden xl:block short:hidden">
          <span className="block h-[3px] w-[94%] bg-ink-3" />
          <span className="block h-[3px] w-[86%] bg-ink-3" />
          <span className="block h-[3px] w-[58%] bg-ink-3" />
        </div>
      </div>
    </figure>
  );
}
