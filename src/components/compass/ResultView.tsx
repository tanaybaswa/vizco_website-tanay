"use client";

import { useMemo, useState, type ReactNode, type Ref } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import CompassChart from "@/components/compass/CompassChart";
import { EmailForm, type Details } from "@/components/compass/LastStep";
import { TONE } from "@/components/compass/tones";
import {
  AGREE,
  ARCHETYPES,
  ARCHETYPE_ORDER,
  CASES,
  COMPASS,
  COMPASS_DISCLAIMER,
  ROLES,
  STANCES,
  VERDICTS,
  type Agree,
  type ArchetypeId,
  type RoleId,
  type Verdict,
} from "@/content/compass";
import { CONTACT_EMAIL } from "@/content/site";
import { agreement, archetypeOf, countsFor, positionOf, type Answers, type CompassStats } from "@/lib/compass/score";
import { SHOW_FROM } from "@/lib/compass/summary";

/** Rarity appears once this many players are on the map. */
const RANK_FROM = 20;
const VERDICT_IDS = VERDICTS.map((v) => v.id);
const verdict = (v: Verdict) => VERDICTS.find((x) => x.id === v)!;
const article = (bare: string) => (/^[aeiou]/i.test(bare) ? "an" : "a");

export type Result = {
  answers: Answers;
  x: number;
  y: number;
  archetype: ArchetypeId;
  player?: number | null;
  counted?: boolean;
  /** Why a run didn't count: a replay, or a run the checks set aside. */
  reason?: "replay" | "flagged" | null;
};

/** Where the results email stands. */
export type EmailState = { status: "none" | "saving" | "saved" | "error"; email?: string; member?: number | null; error?: string };

type Panel = "you" | "map" | "calls" | "results";
const LABELS: Record<Panel, string> = { you: "You", map: "The map", calls: "Your calls", results: "Full results" };

/**
 * The result, on one screen. Desktop: you on the left, the map, your calls and the full
 * results as tabs on the right. Phone: the same four as tabs. Sharing lives in the footer.
 */
export default function ResultView({
  result,
  stats,
  role,
  challenger,
  email,
  onEmail,
  headingRef,
}: {
  result: Result;
  stats: CompassStats | null;
  role: RoleId | null;
  challenger: Answers | null;
  email: EmailState;
  onEmail: (d: Details) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [panel, setPanel] = useState<Panel>("you");
  const right: Panel = panel === "you" ? "map" : panel;
  const arch = ARCHETYPES[result.archetype];
  const pos = { x: result.x, y: result.y };
  const live = !!stats?.live;
  const dots = useMemo(() => (live ? (stats?.dots ?? []) : []), [live, stats]);

  // Where each role sits on average, once it has enough players to mean something.
  const centroids = useMemo(() => {
    const groups = new Map<string, { x: number; y: number; n: number }>();
    for (const d of dots) {
      const g = groups.get(d.r) ?? { x: 0, y: 0, n: 0 };
      groups.set(d.r, { x: g.x + d.x, y: g.y + d.y, n: g.n + 1 });
    }
    return ROLES.flatMap((r) => {
      const g = groups.get(r.id);
      return g && g.n >= SHOW_FROM ? [{ label: r.abbr, x: g.x / g.n, y: g.y / g.n }] : [];
    });
  }, [dots]);

  // Rarity, the boldest call, and what the player's role tends to be.
  const archTotal = ARCHETYPE_ORDER.reduce((t, a) => t + (stats?.archetypes[a] ?? 0), 0);
  const rarity = live && archTotal >= RANK_FROM ? Math.round(((stats?.archetypes[result.archetype] ?? 0) / archTotal) * 100) : null;
  const calls = CASES.map((c) => {
    const mine = result.answers[c.id] as Verdict;
    const counts = countsFor(stats?.items[c.id], VERDICT_IDS);
    const n = counts.reduce((a, b) => a + b, 0);
    return { c, mine, n, share: n ? counts[VERDICT_IDS.indexOf(mine)] / n : 1, majority: n >= SHOW_FROM ? VERDICT_IDS[counts.indexOf(Math.max(...counts))] : null };
  });
  const boldest = live && calls.every((k) => k.n >= SHOW_FROM * 2) ? calls.reduce((a, b) => (b.share < a.share ? b : a)) : null;
  const peer = ROLES.find((r) => r.id === role);
  const peerTally = role ? ARCHETYPE_ORDER.map((a) => ({ a, n: stats?.archetypes[`${role}:${a}`] ?? 0 })).sort((p, q) => q.n - p.n) : [];
  const peerTotal = peerTally.reduce((t, p) => t + p.n, 0);

  // A challenge: compare with the colleague who sent the link.
  const them = challenger ? { answers: challenger, pos: positionOf(challenger) } : null;
  const theirArch = them ? ARCHETYPES[archetypeOf(them.pos)] : null;
  const match = them ? agreement(result.answers, them.answers) : null;

  const facts: { key: string; text: ReactNode; strong?: boolean }[] = [];
  if (them && match && theirArch)
    facts.push({
      key: "vs",
      strong: true,
      text: (
        <>
          You and your colleague agree on {match.total} of {match.of} calls. They&apos;re {article(theirArch.bare)} {theirArch.bare}.
        </>
      ),
    });
  facts.push({
    key: "rare",
    text: rarity !== null ? `${rarity}% of players are ${arch.bare}s.${rarity <= 15 ? " A rare breed." : ""}` : "You're one of the first to land here.",
  });
  if (boldest)
    facts.push({
      key: "bold",
      text: `Boldest call: only ${Math.round(boldest.share * 100)}% agreed with your ${verdict(boldest.mine).label} on ${boldest.c.title.replace(/^The /, "the ")}.`,
    });
  if (live && peer && peerTotal >= SHOW_FROM)
    facts.push({
      key: "peer",
      text: `Most ${peer.plural.toLowerCase()} are ${ARCHETYPES[peerTally[0].a].bare}s. ${peerTally[0].a === result.archetype ? "You're with your crowd." : "You're the exception."}`,
    });

  return (
    <div className="cmp-step-in flex h-full min-h-0 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
      <Tabs className="flex lg:hidden" items={["you", "map", "calls", "results"]} active={panel} onChange={setPanel} dot={email.status !== "saved"} />

      {/* You */}
      <section className={`${panel === "you" ? "flex" : "hidden"} min-h-0 flex-1 flex-col lg:flex`}>
        <p className="eyebrow flex items-center gap-3 text-cream-muted">
          <span aria-hidden className="signal-dot is-live" />
          Your position
          {result.player ? <span className="text-cream">Player #{result.player}</span> : null}
        </p>
        <div className="relative mt-1 min-h-[6rem] flex-1">
          <Image src={arch.art.src} alt={arch.art.alt} fill unoptimized priority sizes="(min-width: 1024px) 40vw, 80vw" className="select-none object-contain object-center lg:object-left" />
        </div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="wipe font-display mt-1 shrink-0 text-[2.25rem] leading-[1] tracking-[-0.042em] text-cream outline-none sm:text-[3.25rem] lg:text-[3.75rem] short:lg:text-[3rem] [&_.block-mark]:inline-block [&_.block-mark]:leading-[1.04]"
        >
          You&apos;re {article(arch.bare)} <span className="block-mark">{arch.bare}.</span>
        </h2>
        <p className="mt-2 shrink-0 text-pretty text-[0.9375rem] leading-snug text-cream-muted sm:mt-3 sm:text-lg">{arch.line}</p>
        <ul className="mt-2.5 shrink-0 space-y-1 text-[0.8125rem] leading-snug sm:mt-4 sm:text-[0.9375rem]">
          {facts.map((f) => (
            <li key={f.key} className={`flex gap-2.5 ${f.strong ? "font-medium text-cream" : "text-cream-muted"}`}>
              <span aria-hidden className={`mt-[0.45em] h-1.5 w-1.5 shrink-0 ${f.strong ? "bg-cream" : "bg-signal"}`} />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* The map, your calls, the full results */}
      <section className={`${panel !== "you" ? "flex" : "hidden"} min-h-0 flex-1 flex-col lg:flex`}>
        <Tabs className="hidden lg:flex" items={["map", "calls", "results"]} active={right} onChange={setPanel} dot={email.status !== "saved"} />

        {right === "map" ? (
          <div className="flex min-h-0 flex-1 flex-col lg:mt-4">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0">
                <CompassChart
                  fit
                  you={pos}
                  other={them ? { ...them.pos, label: "THEM" } : null}
                  dots={dots}
                  centroids={centroids}
                  highlight={result.archetype}
                  animate
                  title={`Your position on the map: ${arch.name}`}
                />
              </div>
            </div>
            <p className="mt-2 flex shrink-0 flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-subtle sm:text-[0.6875rem]">
              <span>{live && dots.length ? `${dots.length} players on the map` : "The map fills in as people play"}</span>
              {centroids.length ? <span>Black squares: average by role</span> : null}
            </p>
          </div>
        ) : null}

        {right === "calls" ? (
          <div className="min-h-0 flex-1 overflow-y-auto lg:mt-4">
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <ol>
                <li className="eyebrow pb-1.5 text-subtle">The cases</li>
                {calls.map(({ c, mine, majority }) => {
                  const v = verdict(mine);
                  return (
                    <li key={c.id} className="flex items-baseline justify-between gap-3 border-t border-line-dark py-1.5 text-[0.8125rem] sm:py-2 sm:text-[0.9375rem]">
                      <span className="truncate text-cream">{c.title}</span>
                      <span className="shrink-0 text-right">
                        <span className={`font-medium ${TONE[v.tone].text}`}>{v.label}</span>
                        {majority && majority !== mine ? <span className="text-subtle"> &middot; most: {verdict(majority).label}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <ol>
                <li className="eyebrow pb-1.5 text-subtle">The hot takes</li>
                {STANCES.map((s) => {
                  const a = AGREE[result.answers[s.id] as Agree];
                  return (
                    <li key={s.id} className="flex items-baseline justify-between gap-3 border-t border-line-dark py-1.5 text-[0.8125rem] sm:py-2 sm:text-[0.9375rem]">
                      <span className="truncate text-cream">{s.topic}</span>
                      <span className={`shrink-0 font-medium ${a ? TONE[a.tone].text : ""}`}>{a?.label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className="mt-4 text-[0.6875rem] leading-relaxed text-subtle">
              {result.reason === "replay" ? "Replays don't change the results: only your first run counts. " : ""}
              Spotted a case we should add or fix?{" "}
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("AI Cover Compass feedback")}`} className="underline underline-offset-2 hover:text-cream">
                Tell us
              </a>
              . {COMPASS_DISCLAIMER}
            </p>
          </div>
        ) : null}

        {right === "results" ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center lg:mt-4">
            {email.status === "saved" ? (
              <div className="flex flex-col gap-4">
                <span className="flex h-12 w-12 items-center justify-center bg-cream text-ink">
                  <Check className="h-6 w-6" strokeWidth={2} />
                </span>
                <p className="font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-cream sm:text-[2.25rem]">The full results are coming to {email.email}.</p>
                <p className="text-base text-cream-muted">
                  {email.member && email.member <= COMPASS.founding ? `You're Founding member #${email.member}. ` : ""}
                  You&apos;ll get them before we publish the survey here, with how every role called every case.
                </p>
              </div>
            ) : (
              <>
                <p className="font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-cream sm:text-[2.25rem]">Get the full results first.</p>
                <p className="mb-5 mt-2 text-[0.9375rem] text-cream-muted sm:text-base">
                  How every role called every case, before we publish it here. The first {COMPASS.founding} get credited.
                </p>
                <EmailForm id="compass-email-result" compact onSubmit={onEmail} busy={email.status === "saving"} error={email.status === "error" ? email.error : ""} />
              </>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Tabs({
  items,
  active,
  onChange,
  dot,
  className = "",
}: {
  items: Panel[];
  active: Panel;
  onChange: (p: Panel) => void;
  dot: boolean;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label="Your result" className={`shrink-0 gap-1 border-b border-line-dark ${className}`}>
      {items.map((p) => {
        const on = p === active;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(p)}
            className={`relative -mb-px flex h-10 items-center gap-1.5 border-b-2 px-2.5 text-[0.8125rem] font-medium transition-colors sm:px-3 sm:text-[0.9375rem] ${
              on ? "border-cream text-cream" : "border-transparent text-cream-muted hover:text-cream"
            }`}
          >
            {LABELS[p]}
            {p === "results" && dot ? <span aria-hidden className="h-1.5 w-1.5 bg-signal" /> : null}
          </button>
        );
      })}
    </div>
  );
}
