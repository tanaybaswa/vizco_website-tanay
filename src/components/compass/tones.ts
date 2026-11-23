import type { Tone } from "@/content/compass";

/**
 * Class names per answer tone, written out in full so Tailwind can see them.
 * Tokens live in globals.css (--agree-2, --disagree-1-soft, ...).
 */
export const TONE: Record<Tone, { solid: string; soft: string; text: string; line: string }> = {
  "agree-2": { solid: "bg-agree-2", soft: "bg-agree-2-soft", text: "text-agree-2", line: "border-agree-2/35" },
  "agree-1": { solid: "bg-agree-1", soft: "bg-agree-1-soft", text: "text-agree-1", line: "border-agree-1/35" },
  maybe: { solid: "bg-maybe", soft: "bg-maybe-soft", text: "text-maybe", line: "border-maybe/35" },
  "disagree-1": { solid: "bg-disagree-1", soft: "bg-disagree-1-soft", text: "text-disagree-1", line: "border-disagree-1/35" },
  "disagree-2": { solid: "bg-disagree-2", soft: "bg-disagree-2-soft", text: "text-disagree-2", line: "border-disagree-2/35" },
};
