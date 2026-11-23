"use client";

import { useMemo, type Ref } from "react";
import Image from "next/image";
import { Check, RotateCcw } from "lucide-react";
import { SwapArrow } from "@/components/ui";
import CompassChart from "@/components/compass/CompassChart";
import DetailsStep, { type Details } from "@/components/compass/DetailsStep";
import ShareBlock from "@/components/compass/ShareBlock";
import { SHOW_FROM } from "@/components/compass/CaseStep";
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
import { BOOKING_URL, CONTACT_EMAIL } from "@/content/site";
import { agreement, archetypeOf, countsFor, encodeCalls, positionOf, type Answers, type CompassStats } from "@/lib/compass/score";

/** Rarity and rankings appear once this many players are on the map. */
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

export default function ResultView({
  result,
  stats,
  role,
  challenger,
  email,
  onEmail,
  onReplay,
  headingRef,
}: {
  result: Result;
  stats: CompassStats | null;
  role: RoleId | null;
  /** The calls of the colleague whose link brought this player here. */
  challenger: Answers | null;
  email: EmailState;
  onEmail: (d: Details) => void;
  onReplay: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const arch = ARCHETYPES[result.archetype];
  const pos = { x: result.x, y: result.y };
  const live = !!stats?.live;
  const dots = useMemo(() => (live ? (stats?.dots ?? []) : []), [live, stats]);
  const code = encodeCalls(result.answers);

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

  // Rarity: how many players share this position.
  const archTotal = ARCHETYPE_ORDER.reduce((t, a) => t + (stats?.archetypes[a] ?? 0), 0);
  const rarity = live && archTotal >= RANK_FROM ? Math.round(((stats?.archetypes[result.archetype] ?? 0) / archTotal) * 100) : null;

  // The boldest call: the case where the fewest players agreed with this one.
  const calls = CASES.map((c) => {
    const mine = result.answers[c.id] as Verdict;
    const counts = countsFor(stats?.items[c.id], VERDICT_IDS);
    const n = counts.reduce((a, b) => a + b, 0);
    return { c, mine, n, share: n ? counts[VERDICT_IDS.indexOf(mine)] / n : 1, majority: n >= SHOW_FROM ? VERDICT_IDS[counts.indexOf(Math.max(...counts))] : null };
  });
  const enough = live && calls.every((k) => k.n >= SHOW_FROM * 2);
  const boldest = enough ? calls.reduce((a, b) => (b.share < a.share ? b : a)) : null;
  const withMajority = calls.filter((k) => k.majority === k.mine).length;

  // What the player's own role tends to be.
  const peer = ROLES.find((r) => r.id === role);
  const peerTally = role ? ARCHETYPE_ORDER.map((a) => ({ a, n: stats?.archetypes[`${role}:${a}`] ?? 0 })).sort((p, q) => q.n - p.n) : [];
  const peerTotal = peerTally.reduce((t, p) => t + p.n, 0);

  // A challenge: compare with the colleague who sent the link.
  const them = challenger ? { answers: challenger, pos: positionOf(challenger) } : null;
  const theirArch = them ? ARCHETYPES[archetypeOf(them.pos)] : null;
  const match = them ? agreement(result.answers, them.answers) : null;
  const splitCase = them ? CASES.find((c) => result.answers[c.id] !== them.answers[c.id]) : null;

  return (
    <div className="cmp-step-in">
      {/* The reveal */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="signal-dot is-live" />
            Your position
            {result.player ? <span className="text-cream">Player #{result.player}</span> : null}
          </p>
          <Image
            src={arch.art.src}
            alt={arch.art.alt}
            width={1024}
            height={1024}
            unoptimized
            priority
            className="cmp-rise mt-6 h-auto w-full max-w-[17rem] select-none sm:max-w-[20rem]"
          />
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="wipe font-display mt-2 text-balance text-[2.75rem] leading-[0.98] tracking-[-0.042em] text-cream outline-none sm:text-[4.5rem] [&_.block-mark]:inline-block [&_.block-mark]:leading-[1.04]"
          >
            You&apos;re {article(arch.bare)} <span className="block-mark">{arch.bare}.</span>
          </h2>
          <p className="t-lead mt-6 max-w-xl text-pretty text-cream-muted">{arch.line}</p>
          <p className="mt-6 border-l-2 border-signal pl-4 text-[1.0625rem] italic text-cream">Most likely to say: &ldquo;{arch.says}&rdquo;</p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {arch.traits.map((t) => (
              <li key={t} className="border border-line-strong bg-surface px-3 py-1.5 text-[0.8125rem] text-cream-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <figure>
          <CompassChart
            you={pos}
            other={them ? { ...them.pos, label: "THEM" } : null}
            dots={dots}
            centroids={centroids}
            highlight={result.archetype}
            animate
            title={`Your position on the map: ${arch.name}`}
          />
          <figcaption className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">
            <span>{live && dots.length ? `${dots.length} players on the map` : "The map fills in as people play"}</span>
            {centroids.length ? <span>Black squares: average by role</span> : null}
          </figcaption>
        </figure>
      </div>

      {/* Two numbers worth talking about */}
      <div className="mt-14 grid gap-px border border-line-dark bg-line-dark sm:grid-cols-2">
        <Stat
          label="How rare you are"
          value={rarity !== null ? `${rarity}%` : null}
          text={
            rarity !== null
              ? `of players are ${arch.bare}s.${rarity <= 15 ? " A rare breed." : ""}`
              : `You're one of the first to land here. Rarity shows once ${RANK_FROM} people have played.`
          }
        />
        <Stat
          label="Your boldest call"
          value={boldest ? `${Math.round(boldest.share * 100)}%` : null}
          text={
            boldest
              ? `agreed with your ${verdict(boldest.mine).label} on ${boldest.c.title.replace(/^The /, "the ")}. You sided with the majority on ${withMajority} of ${CASES.length} cases.`
              : "Shows once every case has enough calls. Challenge a colleague to get there faster."
          }
        />
      </div>

      {live && peer && peerTotal >= SHOW_FROM ? (
        <p className="mt-5 text-base text-cream-muted">
          <span className="text-cream">Most {peer.plural.toLowerCase()} are {ARCHETYPES[peerTally[0].a].bare}s</span> (
          {Math.round((peerTally[0].n / peerTotal) * 100)}%).{" "}
          {peerTally[0].a === result.archetype ? "You're with your crowd." : "You're the exception."}
        </p>
      ) : null}

      {/* The challenge */}
      {them && match && theirArch ? (
        <section className="mt-14 border border-cream bg-surface p-6 sm:p-8" aria-labelledby="vs-title">
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="h-2 w-2 bg-cream" />
            You vs the colleague who challenged you
          </p>
          <h3 id="vs-title" className="font-display mt-4 text-balance text-[2rem] leading-[1.05] tracking-[-0.035em] text-cream sm:text-[2.75rem]">
            You agree on {match.total} of {match.of} calls.
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-muted sm:text-[1.0625rem]">
            They&apos;re {article(theirArch.bare)} <span className="font-medium text-cream">{theirArch.bare}</span>
            {theirArch.id === result.archetype ? ", same as you." : "."}{" "}
            {splitCase
              ? `You split on ${splitCase.title.replace(/^The /, "the ")}: you said ${verdict(result.answers[splitCase.id] as Verdict).label}, they said ${verdict(them.answers[splitCase.id] as Verdict).label}.`
              : "You made the same call on every case."}
          </p>
        </section>
      ) : null}

      {/* Share */}
      <div className="mt-14">
        <ShareBlock archetype={result.archetype} pos={pos} code={code} />
      </div>

      {/* The full results */}
      <div className="mt-14">
        {email.status === "saved" ? (
          <section className="flex flex-col gap-5 border border-line-dark bg-ink-2 p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-cream text-ink">
              <Check className="h-6 w-6" strokeWidth={2} />
            </span>
            <div>
              <p className="font-display text-[1.5rem] leading-tight tracking-[-0.03em] text-cream sm:text-[1.875rem]">
                The full results are coming to {email.email}.
              </p>
              <p className="mt-2 text-base text-cream-muted">
                {email.member && email.member <= COMPASS.founding ? `You're Founding member #${email.member}. ` : ""}
                You&apos;ll get them before we publish the survey here, with how every role called every case.
              </p>
            </div>
          </section>
        ) : (
          <DetailsStep variant="card" onSubmit={onEmail} busy={email.status === "saving"} error={email.status === "error" ? email.error : ""} />
        )}
      </div>

      {/* Your calls */}
      <section className="mt-14">
        <p className="eyebrow flex items-center gap-3 text-cream-muted">
          <span aria-hidden className="signal-dot" />
          Your calls
        </p>
        <ol className="mt-6 grid border-t border-line-dark lg:grid-cols-2 lg:gap-x-12">
          {calls.map(({ c, mine, majority }) => {
            const v = verdict(mine);
            return (
              <li key={c.id} className="flex items-baseline justify-between gap-4 border-b border-line-dark py-3 text-[0.9375rem]">
                <span className="text-cream">{c.title}</span>
                <span className="shrink-0 text-right">
                  <span className={`font-medium ${TONE[v.tone].text}`}>{v.label}</span>
                  {majority && majority !== mine ? <span className="text-subtle"> &middot; most said {verdict(majority).label}</span> : null}
                </span>
              </li>
            );
          })}
          {STANCES.map((s) => {
            const a = AGREE[result.answers[s.id] as Agree];
            return (
              <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-line-dark py-3 text-[0.9375rem]">
                <span className="text-cream">{s.topic}</span>
                <span className={`shrink-0 font-medium ${a ? TONE[a.tone].text : ""}`}>{a?.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Close */}
      <div className="mt-16 flex flex-col gap-8 border-t border-cream pt-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-cream sm:text-[2.25rem]">Want to know how your own policies read?</p>
          <p className="mt-2 text-base text-cream-muted">We read the wording against how your AI can fail, and place cover that names it.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex h-[3.25rem] items-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-colors duration-300 hover:bg-accent-deep"
          >
            Talk to us
            <SwapArrow />
          </a>
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex h-[3.25rem] items-center gap-2.5 border border-line-strong bg-surface px-6 text-base font-medium text-cream transition-colors hover:border-cream"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            Play again
          </button>
        </div>
      </div>
      <p className="mt-8 max-w-3xl text-[0.75rem] leading-relaxed text-subtle">
        {result.reason === "replay" ? "Replays don't change the results: only your first run counts. " : ""}
        Spotted a case we should add or fix?{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("AI Cover Compass feedback")}`} className="underline underline-offset-2 hover:text-cream">
          Tell us
        </a>
        . {COMPASS_DISCLAIMER}
      </p>
    </div>
  );
}

function Stat({ label, value, text }: { label: string; value: string | null; text: string }) {
  return (
    <div className="bg-surface p-6 sm:p-8">
      <p className="eyebrow text-subtle">{label}</p>
      {value ? <p className="font-display mt-4 text-[3.25rem] leading-none tracking-[-0.045em] text-cream">{value}</p> : null}
      <p className={`text-pretty text-base leading-relaxed text-cream-muted ${value ? "mt-2" : "mt-4"}`}>{text}</p>
    </div>
  );
}
