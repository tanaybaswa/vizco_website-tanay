"use client";

import { useMemo, useState, type Ref } from "react";
import { Check, Copy, RotateCcw, Share2 } from "lucide-react";
import { LinkedinIcon, SwapArrow } from "@/components/ui";
import CompassChart from "@/components/compass/CompassChart";
import FoundingForm from "@/components/compass/FoundingForm";
import { EARLY, SHOW_FROM } from "@/components/compass/CaseStep";
import {
  AGREE,
  ARCHETYPES,
  ARCHETYPE_ORDER,
  AXES,
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
import { BOOKING_URL, SITE_URL } from "@/content/site";
import { countsFor, percentile, type Answers, type CompassStats } from "@/lib/compass/score";

/** Rankings appear once this many players are on the map. */
const RANK_FROM = 20;
const VERDICT_IDS = VERDICTS.map((v) => v.id);
const verdictLabel = (v: Verdict) => VERDICTS.find((x) => x.id === v)?.label ?? v;

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

export default function ResultView({
  result,
  stats,
  role,
  pid,
  joined,
  onJoined,
  onReplay,
  headingRef,
}: {
  result: Result;
  stats: CompassStats | null;
  role: RoleId | null;
  pid: string;
  joined: boolean;
  onJoined: () => void;
  onReplay: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const arch = ARCHETYPES[result.archetype];
  const live = !!stats?.live;
  const dots = useMemo(() => (live ? (stats?.dots ?? []) : []), [live, stats]);
  const peer = ROLES.find((r) => r.id === role);

  // Where each role sits on average, once it has enough players to mean something.
  const centroids = useMemo(() => {
    const groups = new Map<string, { x: number; y: number; n: number }>();
    for (const d of dots) {
      const g = groups.get(d.r) ?? { x: 0, y: 0, n: 0 };
      groups.set(d.r, { x: g.x + d.x, y: g.y + d.y, n: g.n + 1 });
    }
    return ROLES.flatMap((r) => {
      const g = groups.get(r.id);
      return g && g.n >= SHOW_FROM ? [{ label: r.abbr, one: r.one, x: g.x / g.n, y: g.y / g.n }] : [];
    });
  }, [dots]);

  const nearest = useMemo(() => {
    if (!centroids.length) return null;
    return centroids.reduce((a, b) =>
      Math.hypot(b.x - result.x, b.y - result.y) < Math.hypot(a.x - result.x, a.y - result.y) ? b : a,
    );
  }, [centroids, result.x, result.y]);

  // How each case's market call compares with yours.
  const calls = CASES.map((c) => {
    const mine = result.answers[c.id] as Verdict;
    const counts = countsFor(stats?.items[c.id], VERDICT_IDS);
    const n = counts.reduce((a, b) => a + b, 0);
    const top = Math.max(...counts);
    const majority = n >= SHOW_FROM ? VERDICT_IDS[counts.indexOf(top)] : null;
    const share = n ? counts[VERDICT_IDS.indexOf(mine)] / n : 0;
    return { c, mine, n, majority, share };
  });
  const enough = calls.every((k) => k.n >= SHOW_FROM * 2);
  const withMajority = calls.filter((k) => k.majority === k.mine).length;
  const contrarian = enough ? calls.reduce((a, b) => (b.share < a.share ? b : a)) : null;

  const ranked = dots.length >= RANK_FROM;
  const xPct = Math.round(percentile(dots.map((d) => d.x), result.x) * 100);
  const yPct = Math.round(percentile(dots.map((d) => d.y), result.y) * 100);

  const archTotal = ARCHETYPE_ORDER.reduce((t, a) => t + (stats?.archetypes[a] ?? 0), 0);
  const peerTally = role
    ? ARCHETYPE_ORDER.map((a) => ({ a, n: stats?.archetypes[`${role}:${a}`] ?? 0 })).sort((p, q) => q.n - p.n)
    : [];
  const peerTotal = peerTally.reduce((t, p) => t + p.n, 0);

  return (
    <div className="cmp-step-in">
      {/* The reveal */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="signal-dot is-live" />
            Your position
            {result.player ? <span className="text-cream">Player #{result.player}</span> : null}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="wipe font-display mt-6 text-balance text-[2.75rem] leading-[0.98] tracking-[-0.042em] text-cream outline-none sm:text-[4.5rem] [&_.block-mark]:inline-block [&_.block-mark]:leading-[1.04]"
          >
            You&apos;re {/^[aeiou]/i.test(arch.bare) ? "an" : "a"} <span className="block-mark">{arch.bare}.</span>
          </h2>
          <p className="t-lead mt-6 max-w-xl text-pretty text-cream-muted">{arch.line}</p>
          <p className="mt-6 border-l-2 border-signal pl-4 text-[1.0625rem] italic text-cream">
            Most likely to say: &ldquo;{arch.says}&rdquo;
          </p>
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
            you={{ x: result.x, y: result.y }}
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

      {/* The numbers */}
      <div className="mt-16 grid gap-px border border-line-dark bg-line-dark sm:grid-cols-3">
        <Stat
          label={AXES.x.title}
          value={ranked ? `${xPct}%` : null}
          text={
            ranked
              ? `of players think today's policies pay less often than you do.`
              : `Your ranking unlocks when ${RANK_FROM} people have played${live && dots.length ? `. ${RANK_FROM - dots.length} to go` : ""}.`
          }
        />
        <Stat
          label={AXES.y.title}
          value={ranked ? `${yPct}%` : null}
          text={ranked ? "of players would fold AI into standard cover less than you would." : "You'll see how far you lean against everyone who has played."}
        />
        <Stat
          label={contrarian ? "Your boldest call" : "With the majority"}
          value={contrarian ? `${Math.round(contrarian.share * 100)}%` : enough ? `${withMajority}/6` : null}
          text={
            contrarian
              ? `called ${contrarian.c.title.replace(/^The /, "the ")} the way you did (${verdictLabel(contrarian.mine)}). You sided with the majority on ${withMajority} of 6 cases.`
              : "Your boldest call shows here once each case has enough votes."
          }
        />
      </div>

      {nearest || (peer && peerTotal >= SHOW_FROM) ? (
        <div className="mt-6 grid gap-3 text-base text-cream-muted sm:grid-cols-2">
          {nearest ? (
            <p>
              <span className="text-cream">Closest to you:</span> the average {nearest.one}.
            </p>
          ) : null}
          {peer && peerTotal >= SHOW_FROM ? (
            <p>
              <span className="text-cream">Most common among {peer.plural.toLowerCase()}:</span> {ARCHETYPES[peerTally[0].a].name} (
              {Math.round((peerTally[0].n / peerTotal) * 100)}%).
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Share */}
      <ShareBlock archetype={result.archetype} />

      {/* Founding 200 */}
      <div className="mt-16">
        <FoundingForm
          pid={pid}
          role={role}
          archetype={result.archetype}
          player={result.player}
          joined={joined}
          onJoined={onJoined}
          open={(stats?.founders ?? 0) < COMPASS.founding}
        />
      </div>

      {/* Where everyone landed */}
      <section className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="signal-dot" />
            Where everyone landed
          </p>
          {live && archTotal >= SHOW_FROM * 2 ? (
            <ul className="mt-6 space-y-4">
              {ARCHETYPE_ORDER.map((a, i) => {
                const n = stats?.archetypes[a] ?? 0;
                const pct = Math.round((n / archTotal) * 100);
                const me = a === result.archetype;
                return (
                  <li key={a}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className={`flex items-center gap-2 text-base ${me ? "font-semibold text-cream" : "text-cream-muted"}`}>
                        {me ? <span aria-hidden className="h-2 w-2 bg-signal" /> : null}
                        {ARCHETYPES[a].name}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-cream">{pct}%</span>
                    </div>
                    <span aria-hidden className="mt-2 block h-2 bg-ink-2">
                      <span
                        className={`cmp-bar block h-full ${archTotal < EARLY ? "bg-subtle" : me ? "bg-cream" : "bg-cream-muted"}`}
                        style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }}
                      />
                    </span>
                  </li>
                );
              })}
              <li className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">
                {archTotal} players{archTotal < EARLY ? " · early read" : ""}
              </li>
            </ul>
          ) : (
            <p className="mt-6 max-w-md text-base leading-relaxed text-cream-muted">
              You&apos;re early. The split across all five positions appears once ten people have played. Share your result to speed that up.
            </p>
          )}
        </div>

        <div>
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="signal-dot" />
            Your calls
          </p>
          <ol className="mt-6 border-t border-line-dark">
            {calls.map(({ c, mine, majority }) => (
              <li key={c.id} className="flex items-baseline justify-between gap-4 border-b border-line-dark py-3 text-[0.9375rem]">
                <span className="text-cream">{c.title}</span>
                <span className="shrink-0 text-right text-cream-muted">
                  <span className="font-medium text-cream">{verdictLabel(mine)}</span>
                  {majority ? <span className="text-subtle"> &middot; most said {verdictLabel(majority)}</span> : null}
                </span>
              </li>
            ))}
            {STANCES.map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-line-dark py-3 text-[0.9375rem]">
                <span className="text-cream">{s.topic}</span>
                <span className="shrink-0 font-medium text-cream">{AGREE[result.answers[s.id] as Agree]?.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Close */}
      <div className="mt-16 flex flex-col gap-8 border-t border-cream pt-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-cream sm:text-[2.25rem]">
            Want to know how your own policies read?
          </p>
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
        {COMPASS_DISCLAIMER}
      </p>
    </div>
  );
}

function Stat({ label, value, text }: { label: string; value: string | null; text: string }) {
  return (
    <div className="bg-surface p-6 sm:p-7">
      <p className="eyebrow text-subtle">{label}</p>
      {value ? <p className="font-display mt-4 text-[2.75rem] leading-none tracking-[-0.04em] text-cream">{value}</p> : null}
      <p className={`text-pretty text-[0.9375rem] leading-relaxed ${value ? "mt-2 text-cream-muted" : "mt-4 text-cream-muted"}`}>{text}</p>
    </div>
  );
}

function ShareBlock({ archetype }: { archetype: ArchetypeId }) {
  const arch = ARCHETYPES[archetype];
  const url = `${SITE_URL}${COMPASS.path}/you/${archetype}`;
  const post = `I'm ${/^[aeiou]/i.test(arch.bare) ? "an" : "a"} ${arch.bare} on the ${COMPASS.short}. ${arch.me}\n\nWhere do you stand on AI cover? ${url}`;
  const [copied, setCopied] = useState<"post" | "link" | null>(null);

  const copy = async (what: "post" | "link") => {
    try {
      await navigator.clipboard.writeText(what === "post" ? post : url);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      /* clipboard blocked: the link is visible to copy by hand */
    }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const btn =
    "inline-flex h-12 items-center gap-2.5 border border-line-strong bg-surface px-5 text-[0.9375rem] font-medium text-cream transition-colors hover:border-cream";

  return (
    <section className="mt-16 border border-line-dark bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8" aria-labelledby="share-title">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow flex items-center gap-3 text-cream-muted">
            <span aria-hidden className="signal-dot" />
            Share your position
          </p>
          <p id="share-title" className="font-display mt-4 text-balance text-[1.75rem] leading-tight tracking-[-0.03em] text-cream sm:text-[2.25rem]">
            &ldquo;I&apos;m {/^[aeiou]/i.test(arch.bare) ? "an" : "a"} {arch.bare}. Where do you stand?&rdquo;
          </p>
          <p className="mt-3 text-[0.875rem] text-subtle">Your link shows your position, never your answers. Challenge a colleague and compare.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2.5 bg-cream px-5 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-accent-deep"
          >
            <LinkedinIcon className="h-4 w-4" />
            Share on LinkedIn
          </a>
          <button type="button" onClick={() => copy("post")} className={btn}>
            {copied === "post" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
            {copied === "post" ? "Post copied" : "Copy post"}
          </button>
          <button type="button" onClick={() => copy("link")} className={btn}>
            {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
          {canShare ? (
            <button
              type="button"
              onClick={() => navigator.share({ title: `${arch.name} | ${COMPASS.name}`, text: post.split("\n")[0], url }).catch(() => {})}
              className={btn}
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} />
              Share
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
