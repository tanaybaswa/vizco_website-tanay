"use client";

import type { ReactNode } from "react";
import { SwapArrow } from "@/components/ui";

/**
 * The bar along the bottom of every screen in the game: what just happened on the left,
 * the way forward on the right. Next is always there, waiting until there's an answer.
 */
export function StageFooter({ status, children, wide = false }: { status?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="shrink-0 border-t border-line-dark bg-ink">
      <div className={`mx-auto flex min-h-16 w-full items-center justify-between gap-4 px-5 py-2.5 sm:min-h-[4.5rem] sm:px-8 lg:px-10 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        <div aria-live="polite" className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-cream-muted sm:text-[0.9375rem]">
          {status}
        </div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

/** Status text: one strong line and one quiet one. */
export function Status({ headline, detail }: { headline: ReactNode; detail?: ReactNode }) {
  return (
    <>
      <span className="block truncate font-medium text-cream sm:text-base">{headline}</span>
      {detail ? <span className="block truncate text-[0.75rem] text-subtle sm:text-[0.8125rem]">{detail}</span> : null}
    </>
  );
}

export function NextButton({
  onClick,
  disabled = false,
  label = "Next",
  countdown,
  type = "button",
  form,
}: {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  /** Milliseconds until the game moves on by itself; draws a filling line along the bottom. */
  countdown?: number | null;
  type?: "button" | "submit";
  form?: string;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="group relative inline-flex h-12 min-w-[7.5rem] items-center justify-center gap-2.5 overflow-hidden bg-cream px-6 text-[0.9375rem] font-medium text-ink transition-[background-color,opacity] duration-200 hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink/80 sm:h-[3.25rem] sm:px-7 sm:text-base"
    >
      {label}
      <SwapArrow />
      {countdown && !disabled ? (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/15">
          <span className="cmp-count absolute inset-0 bg-signal" style={{ animationDuration: `${countdown}ms` }} />
        </span>
      ) : null}
    </button>
  );
}
