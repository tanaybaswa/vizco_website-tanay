import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Check, X } from "lucide-react";
import { QuestionMark } from "@/components/ui";

/*
 * The serif policies are set in, shared with the Compass's policy paper (Source Serif 4,
 * OFL, self-hosted). Not preloaded: the papers sit well below the fold.
 */
const serif = localFont({
  src: "../compass/fonts/source-serif-4-latin-variable.woff2",
  weight: "400 600",
  style: "normal",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/**
 * The objects in "What happens when your AI gets it wrong": the chat where the AI makes
 * the promise, the claim that follows, and the policy it lands on. Illustrations of the
 * scenario, not real documents, so they're hidden from screen readers; the story's text
 * carries everything they show.
 */

const tag = "font-mono text-[0.625rem] uppercase tracking-[0.16em]";

function Lines({ widths }: { widths: string[] }) {
  return (
    <div aria-hidden className="space-y-2">
      {widths.map((w, i) => (
        <span key={i} className="block h-[3px] bg-ink-3" style={{ width: w }} />
      ))}
    </div>
  );
}

export function ChatCard({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`border border-line-dark bg-surface shadow-[var(--shadow-paper)] ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-line-dark px-5 py-3.5">
        <p className={`flex items-center gap-2.5 text-cream-muted ${tag}`}>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 bg-line-strong" />
            <span className="h-1.5 w-1.5 bg-line-strong" />
            <span className="h-1.5 w-1.5 bg-line-strong" />
          </span>
          Support chat
        </p>
        <p className={`flex items-center gap-2 text-cream-muted ${tag}`}>
          <span className="h-1.5 w-1.5 bg-signal" />
          AI assistant
        </p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <p className="ml-auto w-fit max-w-[85%] bg-ink-2 px-4 py-2.5 text-[0.9375rem] leading-snug text-cream">
          Can I still get a refund? It&apos;s been two months.
        </p>
        <div className="max-w-[88%]">
          <p className="bg-cream px-4 py-2.5 text-[0.9375rem] leading-snug text-ink">Yes! You&apos;re entitled to a full refund. I&apos;ve noted it on your account.</p>
          <p className={`mt-2 text-subtle ${tag}`}>Sent by your AI, in your name</p>
        </div>
      </div>
    </div>
  );
}

export function ClaimLetter({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`border border-line-dark bg-paper p-6 shadow-[var(--shadow-paper)] sm:p-7 ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-cream pb-3">
        <p className={`font-medium text-cream ${tag}`}>Notice of claim</p>
        <p className={`text-subtle ${tag}`}>To: your company</p>
      </div>
      <p className={`mt-5 text-cream-muted ${tag}`}>Re: a refund your AI promised</p>
      <p className={`${serif.className} mt-2 text-[1.1875rem] leading-snug text-cream sm:text-[1.3125rem]`}>
        &ldquo;Your assistant promised me a full refund. I&apos;m holding you to it.&rdquo;
      </p>
      <div className="mt-5">
        <Lines widths={["92%", "78%"]} />
      </div>
    </div>
  );
}

export type Verdict = "maybe" | "no" | "yes";

const STAMP: Record<Verdict, { word: string; tag: string; cls: string; Icon: (p: { className?: string }) => ReactNode }> = {
  maybe: { word: "Maybe", tag: "Silent", cls: "border-2 border-cream bg-paper text-cream", Icon: (p) => <QuestionMark {...p} strokeWidth={2.25} /> },
  no: { word: "No", tag: "Excluded", cls: "border-2 border-cream bg-cream text-ink", Icon: (p) => <X {...p} strokeWidth={2.25} /> },
  yes: { word: "Yes", tag: "Covered", cls: "border-2 border-signal bg-signal text-signal-ink", Icon: (p) => <Check {...p} strokeWidth={2.25} /> },
};

/** The answer, stamped across the policy. Re-keyed on each change so it lands again. */
export function Stamp({ verdict }: { verdict: Verdict }) {
  const s = STAMP[verdict];
  return (
    <span key={verdict} className={`stamp-in flex items-center gap-3 px-4 py-2.5 shadow-[0_10px_24px_-12px_rgba(10,10,10,0.45)] ${s.cls}`}>
      <s.Icon className="h-6 w-6" />
      <span className="flex flex-col">
        <span className="font-display text-[1.75rem] leading-none tracking-[-0.04em]">{s.word}</span>
        <span className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.18em] opacity-75">{s.tag}</span>
      </span>
    </span>
  );
}

/**
 * The policy: specimen wording that never mentions AI (silent), and an exclusion page
 * clipped to it at renewal (excluded). Both ways a policy fails an AI claim, on one page.
 */
export function PolicySheet({ stamp, className = "" }: { stamp?: ReactNode; className?: string }) {
  return (
    <figure aria-hidden className={`relative ${className}`}>
      <div className="relative bg-[#fffefa] px-6 pb-8 pt-5 shadow-[var(--shadow-paper)] ring-1 ring-black/[0.06] sm:px-8">
        <span
          className="absolute right-0 top-0 h-7 w-7"
          style={{ background: "linear-gradient(225deg, var(--ink) 50%, #e4e4df 50%)", boxShadow: "-2px 2px 3px rgba(10,10,10,0.08)" }}
        />
        <div className="flex items-center justify-between gap-4 border-b border-cream pb-2.5 pr-7">
          <span className={`font-medium text-cream ${tag}`}>Your policy</span>
          <span className={`text-subtle ${tag}`}>Specimen wording</span>
        </div>
        <p className={`${serif.className} mt-4 text-pretty text-[1.0625rem] leading-[1.5] text-cream sm:text-[1.1875rem]`}>
          &ldquo;We will pay for loss arising from your business, subject to the terms and exclusions that follow.&rdquo;
        </p>
        <div className="mt-4">
          <Lines widths={["94%", "86%"]} />
        </div>
        <p className={`mt-4 w-fit max-w-[52%] border border-dashed border-line-strong px-3 py-2 leading-relaxed text-subtle ${tag}`}>
          Artificial intelligence: not mentioned
        </p>
        <div className="mt-4 w-[52%]">
          <Lines widths={["100%", "82%", "64%"]} />
        </div>

        {/* The page added at renewal, clipped over the wording */}
        <div className="absolute -right-3 bottom-5 w-[44%] rotate-[3.5deg] border border-line-dark bg-surface px-4 pb-4 pt-3.5 shadow-[var(--shadow-card)] sm:-right-5">
          <span className="absolute -top-3 left-6 h-7 w-2.5 rounded-full border-2 border-cream-muted/70 bg-transparent" />
          <p className={`text-cream-muted ${tag}`}>Added at renewal</p>
          <p className="mt-1.5 text-[0.9375rem] font-semibold tracking-[-0.015em] text-cream">AI exclusion</p>
          <div className="mt-2.5">
            <Lines widths={["100%", "70%"]} />
          </div>
        </div>

        {stamp ? <div className="absolute -bottom-7 left-6 -rotate-[8deg] sm:left-10">{stamp}</div> : null}
      </div>
    </figure>
  );
}
