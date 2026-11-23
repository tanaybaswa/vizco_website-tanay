"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Mail, MessageCircle, Share2, Users } from "lucide-react";
import { LinkedinIcon } from "@/components/ui";
import { ARCHETYPES, COMPASS, type ArchetypeId } from "@/content/compass";
import { SITE_URL } from "@/content/site";
import type { Position } from "@/lib/compass/score";

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const article = (bare: string) => (/^[aeiou]/i.test(bare) ? "an" : "a");

/** The link a player shares: their type, their dot, and their calls so a colleague can compare. Never a name or email. */
export function shareUrl(archetype: ArchetypeId, pos: Position, code: string | null) {
  const q = new URLSearchParams({ x: String(pos.x), y: String(pos.y) });
  if (code) q.set("c", code);
  return `${SITE_URL}${COMPASS.path}/you/${archetype}?${q.toString()}`;
}

/**
 * Share and challenge in one row. Desktop: every channel professionals use, one click each.
 * Phone: one button that opens the phone's own share sheet (or the same channels if it can't).
 */
export default function ShareBar({ archetype, pos, code }: { archetype: ArchetypeId; pos: Position; code: string | null }) {
  const a = ARCHETYPES[archetype];
  const url = shareUrl(archetype, pos, code);
  const hook = `I'm ${article(a.bare)} ${a.bare} on the ${COMPASS.short}. Where do you stand on AI cover?`;
  const dare = "Take the same 12 calls and see how close you land to me";
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const channels = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, icon: <LinkedinIcon className="h-4 w-4" /> },
    { label: "X", href: `https://x.com/intent/tweet?text=${encodeURIComponent(hook)}&url=${encodeURIComponent(url)}`, icon: <XIcon className="h-3.5 w-3.5" /> },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${hook} ${dare}: ${url}`)}`, icon: <MessageCircle className="h-4 w-4" strokeWidth={1.75} /> },
    {
      label: "Teams",
      href: `https://teams.microsoft.com/share?href=${encodeURIComponent(url)}&msgText=${encodeURIComponent(`${hook} ${dare}.`)}`,
      icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(`I'm ${article(a.bare)} ${a.bare}. Where do you stand on AI cover?`)}&body=${encodeURIComponent(`${a.me}\n\n${dare}:\n${url}`)}`,
      icon: <Mail className="h-4 w-4" strokeWidth={1.75} />,
    },
  ];

  const square =
    "inline-flex h-11 w-11 items-center justify-center border border-line-strong bg-surface text-cream transition-colors hover:border-cream sm:h-12 sm:w-12";

  return (
    <div className="relative flex items-center gap-2">
      {/* Desktop: every channel */}
      <span className="mr-1 hidden text-[0.9375rem] font-medium text-cream lg:inline">Share &amp; challenge</span>
      <div className="hidden items-center gap-1.5 sm:flex">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.label === "Email" ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label={`Share on ${c.label}`}
            title={c.label}
            className={c.label === "LinkedIn" ? `${square} !border-cream !bg-cream !text-ink hover:!bg-accent-deep` : square}
          >
            {c.icon}
          </a>
        ))}
        <button type="button" onClick={copy} aria-label="Copy your challenge link" title="Copy link" className={square}>
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>

      {/* Phone: one button */}
      <button
        type="button"
        onClick={() => (canShare ? navigator.share({ title: hook, text: `${hook} ${dare}.`, url }).catch(() => {}) : setOpen((v) => !v))}
        className="inline-flex h-11 items-center gap-2 bg-cream px-4 text-[0.9375rem] font-medium text-ink sm:hidden"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.75} />
        Share &amp; challenge
      </button>
      <button type="button" onClick={copy} aria-label="Copy your challenge link" className={`${square} sm:hidden`}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-2 grid w-64 grid-cols-1 border border-line-strong bg-surface p-1.5 shadow-[var(--shadow-lift)] sm:hidden">
          {channels.map((c) => (
            <a key={c.label} href={c.href} target={c.label === "Email" ? undefined : "_blank"} rel="noopener noreferrer" className="flex h-11 items-center gap-3 px-3 text-[0.9375rem] text-cream hover:bg-ink-2">
              {c.icon}
              {c.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
