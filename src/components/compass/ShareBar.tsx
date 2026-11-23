"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { Check, Copy, Link2, Mail, MessageCircle, Share2, Users } from "lucide-react";
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

type Channel = { label: string; href: string; icon: ReactNode };

/** Everything both share layouts need: the link, the words, the channels and copy-to-clipboard. */
function useShare(archetype: ArchetypeId, pos: Position, code: string | null) {
  const a = ARCHETYPES[archetype];
  const url = shareUrl(archetype, pos, code);
  const hook = `I'm ${article(a.bare)} ${a.bare} on the ${COMPASS.short}. Where do you stand on AI cover?`;
  const dare = "Take the same 12 calls and see how close you land to me";
  const post = `I'm ${article(a.bare)} ${a.bare} on the ${COMPASS.short}. ${a.me}\n\nWhere do you stand on AI cover? ${dare}:\n${url}`;
  const [copied, setCopied] = useState<"link" | "post" | null>(null);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  const copy = async (what: "link" | "post") => {
    try {
      await navigator.clipboard.writeText(what === "post" ? post : url);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard blocked */
    }
  };
  const nativeShare = () => navigator.share({ title: hook, text: `${hook} ${dare}.`, url }).catch(() => {});

  const channels: Channel[] = [
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
  return { a, url, channels, copy, copied, canShare, nativeShare };
}

const target = (c: Channel) => (c.label === "Email" ? undefined : "_blank");

/** The full share section on the result page: every channel, labelled, with a preview of the card people will see. */
export function SharePanel({ archetype, pos, code }: { archetype: ArchetypeId; pos: Position; code: string | null }) {
  const { a, channels, copy, copied, canShare, nativeShare } = useShare(archetype, pos, code);
  const btn =
    "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap border border-line-strong bg-surface px-3 text-[0.875rem] font-medium text-cream transition-colors hover:border-cream";
  return (
    <section className="border border-line-dark bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8" aria-labelledby="share-title">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
        <div>
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="signal-dot" />
            Share and challenge
          </p>
          <h3 id="share-title" className="font-display mt-4 text-balance text-[1.875rem] leading-[1.08] tracking-[-0.035em] text-cream sm:text-[2.5rem]">
            Who do you know that would land somewhere else?
          </h3>
          <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-cream-muted">
            Your link opens the same twelve calls. When they finish, they see exactly where you agree, and where you don&apos;t.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a href={channels[0].href} target="_blank" rel="noopener noreferrer" className={`${btn} col-span-2 !border-cream !bg-cream !text-ink hover:!bg-accent-deep`}>
              {channels[0].icon}
              Share on LinkedIn
            </a>
            {channels.slice(1).map((c) => (
              <a key={c.label} href={c.href} target={target(c)} rel="noopener noreferrer" className={btn}>
                {c.icon}
                {c.label}
              </a>
            ))}
            <button type="button" onClick={() => copy("link")} className={btn}>
              {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={() => copy("post")} className={btn}>
              {copied === "post" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
              {copied === "post" ? "Copied" : "Copy post"}
            </button>
            {canShare ? (
              <button type="button" onClick={nativeShare} className={`${btn} col-span-2 sm:col-span-4`}>
                <Share2 className="h-4 w-4" strokeWidth={1.75} />
                More ways to share
              </button>
            ) : null}
          </div>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-subtle">Your link carries your calls so colleagues can compare. Never your name or email.</p>
        </div>
        <figure>
          <Image
            src={`/api/compass/card?a=${archetype}&x=${pos.x}&y=${pos.y}`}
            alt={`Share card: I'm ${article(a.bare)} ${a.bare} on the AI Cover Compass, with my dot on the map`}
            width={1200}
            height={630}
            unoptimized
            className="h-auto w-full border border-line-dark shadow-[var(--shadow-paper)]"
          />
          <figcaption className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">What people see when you share. Your dot, nobody else&apos;s.</figcaption>
        </figure>
      </div>
    </section>
  );
}

/** The compact version for a phone's sticky bar: one button for the phone's own share sheet, and copy link. */
export default function ShareBar({ archetype, pos, code }: { archetype: ArchetypeId; pos: Position; code: string | null }) {
  const { channels, copy, copied, canShare, nativeShare } = useShare(archetype, pos, code);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => (canShare ? nativeShare() : setOpen((v) => !v))}
        className="inline-flex h-11 items-center gap-2 bg-cream px-4 text-[0.9375rem] font-medium text-ink"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.75} />
        Share &amp; challenge
      </button>
      <button
        type="button"
        onClick={() => copy("link")}
        aria-label="Copy your challenge link"
        className="inline-flex h-11 w-11 items-center justify-center border border-line-strong bg-surface text-cream"
      >
        {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-2 grid w-64 grid-cols-1 border border-line-strong bg-surface p-1.5 shadow-[var(--shadow-lift)]">
          {channels.map((c) => (
            <a key={c.label} href={c.href} target={target(c)} rel="noopener noreferrer" className="flex h-11 items-center gap-3 px-3 text-[0.9375rem] text-cream hover:bg-ink-2">
              {c.icon}
              {c.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
