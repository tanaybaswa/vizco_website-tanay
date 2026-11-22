"use client";

import { ROLES, REGIONS, type RegionId, type RoleId } from "@/content/compass";
import { SwapArrow } from "@/components/ui";

/** Asked once, between the first call and its reveal: the reveal is the reward for answering. */
export default function WhoSheet({
  role,
  region,
  onRole,
  onRegion,
  onDone,
}: {
  role: RoleId | null;
  region: RegionId | null;
  onRole: (r: RoleId) => void;
  onRegion: (r: RegionId | null) => void;
  onDone: () => void;
}) {
  return (
    <section className="cmp-rise mt-10 border border-cream bg-surface p-5 shadow-[var(--shadow-lift)] sm:p-8" aria-labelledby="who-title">
      <p className="eyebrow flex items-center gap-3 text-cream-muted">
        <span aria-hidden className="signal-dot is-live" />
        Before the split
      </p>
      <h3 id="who-title" className="font-display mt-4 text-[1.75rem] leading-tight tracking-[-0.03em] text-cream sm:text-[2.25rem]">
        What do you do?
      </h3>
      <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-cream-muted">
        One tap, so we can show you how your peers called it. Asked once, and never published with your name.
      </p>

      <div role="radiogroup" aria-label="Your role" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROLES.map((r) => {
          const on = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onRole(r.id)}
              className={`flex min-h-12 items-center justify-between gap-2 border px-3.5 py-3 text-left text-[0.9375rem] font-medium tracking-[-0.01em] transition-[background-color,border-color,color] duration-200 ${
                on ? "border-cream bg-cream text-ink" : "border-line-strong bg-surface text-cream hover:border-cream"
              }`}
            >
              {r.label}
              {on ? <span aria-hidden className="h-2 w-2 shrink-0 bg-signal" /> : null}
            </button>
          );
        })}
      </div>

      <p className="eyebrow mt-7 text-subtle">Where you work &middot; optional</p>
      <div role="radiogroup" aria-label="Where you work" className="mt-3 flex flex-wrap gap-2">
        {REGIONS.map((r) => {
          const on = region === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onRegion(on ? null : r.id)}
              className={`h-10 border px-3.5 text-sm transition-[background-color,border-color,color] duration-200 ${
                on ? "border-cream bg-cream text-ink" : "border-line-strong bg-surface text-cream-muted hover:border-cream hover:text-cream"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onDone}
        disabled={!role}
        className="group relative mt-8 inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-[background-color,opacity] duration-300 hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto"
      >
        Show me the split
        <SwapArrow />
      </button>
    </section>
  );
}
