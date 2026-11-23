"use client";

import type { ReactNode } from "react";
import { SwapArrow } from "@/components/ui";
import { START_EVENT } from "@/lib/compass/events";

/** Starts the Compass from anywhere on the page. */
export default function StartButton({ children = "Make your first call", className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(START_EVENT))}
      className={`group relative inline-flex h-[3.25rem] select-none items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap bg-cream px-7 text-base font-medium tracking-[-0.012em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-[background-color,scale] duration-300 hover:bg-accent-deep active:scale-[0.985] ${className}`}
    >
      {children}
      <SwapArrow />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-signal transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
    </button>
  );
}
