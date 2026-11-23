"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Container, Label, SwapArrow } from "@/components/ui";
import CompassChart from "@/components/compass/CompassChart";
import CaseStep from "@/components/compass/CaseStep";
import StanceStep from "@/components/compass/StanceStep";
import { EmailStep, RoleStep, type Details } from "@/components/compass/LastStep";
import ResultView, { type EmailState, type Result } from "@/components/compass/ResultView";
import ShareBar from "@/components/compass/ShareBar";
import { NextButton, StageFooter, Status } from "@/components/compass/Stage";
import { ARCHETYPES, CASES, COMPASS, ITEMS, VERDICTS, type Agree, type RegionId, type RoleId, type Verdict } from "@/content/compass";
import { BOOKING_URL } from "@/content/site";
import { START_EVENT, STAGE_EVENT } from "@/lib/compass/events";
import {
  archetypeOf,
  countsFor,
  decodeCalls,
  encodeCalls,
  positionOf,
  splitScore,
  type Answers,
  type CompassStats,
} from "@/lib/compass/score";
import { caseView, stanceView } from "@/lib/compass/summary";
import { loadSaved, save, type Saved } from "@/lib/compass/local";

type Phase = "play" | "role" | "email" | "plotting" | "result";

const PLOT_MS = 1900;
/** How long a hot take's split shows before the next one. */
const DWELL = 2400;
const VERDICT_IDS = VERDICTS.map((v) => v.id);

async function fetchStats(fresh = false): Promise<CompassStats | null> {
  try {
    const res = await fetch(`/api/compass/stats${fresh ? `?t=${Date.now()}` : ""}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CompassStats;
  } catch {
    return null;
  }
}

/**
 * The Compass: the landing hero, then the game in place of it. While playing, the game is one
 * fixed-height stage under the site header: progress along the top, the step in the middle,
 * and a footer with the way forward. Every step is laid out to fit that screen without scrolling.
 */
export default function CompassGame() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [stats, setStats] = useState<CompassStats | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("play");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [role, setRole] = useState<RoleId | null>(null);
  const [region, setRegion] = useState<RegionId | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [challenger, setChallenger] = useState<Answers | null>(null);
  const [email, setEmail] = useState<EmailState>({ status: "none" });
  const [auto, setAuto] = useState(true);

  const startedAt = useRef(0);
  const statsAt = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);

  const item = ITEMS[index];
  const isLast = index === ITEMS.length - 1;
  const answer = answers[item.id];
  const live = !!stats?.live;
  const view =
    item.kind === "case"
      ? caseView(stats?.items[item.id], answer as Verdict | undefined, live)
      : stanceView(stats?.items[item.id], answer as Agree | undefined, live);

  // Remember the player between visits, pick up a colleague's challenge, load the live numbers.
  useEffect(() => {
    const s = loadSaved();
    setSaved(s);
    setRole(s.role ?? null);
    setRegion(s.region ?? null);
    if (s.result) setResult(s.result);
    if (s.email) setEmail({ status: "saved", email: s.email, member: s.member ?? null });
    setChallenger(decodeCalls(new URLSearchParams(window.location.search).get("c")));
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    fetchStats().then((st) => {
      if (st) {
        setStats(st);
        statsAt.current = Date.now();
      }
    });
  }, []);

  const persist = useCallback((patch: Partial<Saved>) => {
    setSaved((prev) => {
      const next = { ...(prev ?? loadSaved()), ...patch };
      save(next);
      return next;
    });
  }, []);

  // Tell the rest of the page (the header, the landing sections) when the game takes over.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(STAGE_EVENT, { detail: open }));
  }, [open]);

  // Every step starts with the page at the top and focus on its heading.
  useEffect(() => {
    if (!open) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    const id = window.setTimeout(() => heading.current?.focus({ preventScroll: true }), 40);
    return () => window.clearTimeout(id);
  }, [open, index, phase]);

  const start = useCallback(() => {
    setAnswers({});
    setIndex(0);
    setPhase("play");
    setOpen(true);
    startedAt.current = Date.now();
    if (Date.now() - statsAt.current > 60_000) {
      fetchStats(true).then((st) => {
        if (st) {
          setStats(st);
          statsAt.current = Date.now();
        }
      });
    }
  }, []);

  const showResult = useCallback(() => {
    setPhase("result");
    setOpen(true);
  }, []);

  const exit = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onStart = () => start();
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [start]);

  // One answer per question: the split is shown straight after, so the call is locked in.
  const vote = useCallback(
    (v: Verdict | Agree) => {
      if (answers[item.id] !== undefined) return;
      setAnswers((a) => ({ ...a, [item.id]: v }));
      navigator.vibrate?.(8);
    },
    [answers, item],
  );

  /** Send the email details. Never blocks the result. */
  const sendDetails = useCallback(
    async (d: Details, archetype: string) => {
      setEmail({ status: "saving", email: d.email });
      try {
        const res = await fetch("/api/compass/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...d, pid: saved?.pid, role, archetype, player: saved?.result?.player ?? null }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; member?: number };
        if (!res.ok) throw new Error(data.error || "We couldn't save that. Please try again.");
        setEmail({ status: "saved", email: d.email, member: data.member ?? null });
        persist({ email: d.email, member: data.member ?? null });
      } catch (err) {
        setEmail({ status: "error", email: d.email, error: err instanceof Error ? err.message : "We couldn't save that. Please try again." });
      }
    },
    [persist, role, saved],
  );

  const finish = useCallback(
    async (details: Details | null) => {
      const pos = positionOf(answers);
      const archetype = archetypeOf(pos);
      setPhase("plotting");
      const t0 = Date.now();
      const pid = saved?.pid ?? loadSaved().pid;
      persist({ role, region });

      let player: number | null = null;
      let counted = false;
      let reason: Result["reason"] = null;
      const run = (async () => {
        try {
          const res = await fetch("/api/compass/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pid, role, region, answers, ms: Date.now() - startedAt.current }),
          });
          if (res.ok) {
            const data = (await res.json()) as { counted?: boolean; player?: number; reason?: Result["reason"] };
            counted = !!data.counted;
            player = data.player ?? null;
            reason = data.reason ?? null;
          }
        } catch {
          /* offline: the result still stands, it just isn't counted */
        }
      })();
      await Promise.all([run, details ? sendDetails(details, archetype) : null]);
      const fresh = await fetchStats(true);
      if (fresh) {
        setStats(fresh);
        statsAt.current = Date.now();
      }
      await new Promise((r) => window.setTimeout(r, Math.max(0, PLOT_MS - (Date.now() - t0))));

      // A replay keeps the first run's player number.
      const next: Result = { answers, ...pos, archetype, player: player ?? saved?.result?.player ?? null, counted, reason };
      setResult(next);
      persist({ pid, role, region, result: { ...next, at: new Date().toISOString() } });
      setPhase("result");
    },
    [answers, persist, region, role, saved, sendDetails],
  );

  const next = useCallback(() => {
    if (answers[item.id] === undefined) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    // Known role and email from an earlier run: straight to the result.
    if (role && email.status === "saved") void finish(null);
    else setPhase(role ? "email" : "role");
  }, [answers, email.status, finish, isLast, item, role]);

  // A hot take moves on by itself once answered (not the last one, and not with reduced motion).
  useEffect(() => {
    if (!open || phase !== "play" || item.kind === "case" || answer === undefined || isLast || !auto) return;
    const id = window.setTimeout(next, DWELL);
    return () => window.clearTimeout(id);
  }, [open, phase, item, answer, isLast, auto, next]);

  // Warm the next sketch so it's there the moment they move on.
  useEffect(() => {
    if (!open || phase !== "play") return;
    const upcoming = ITEMS[index + 1];
    if (upcoming) new window.Image().src = upcoming.art.src;
  }, [open, phase, index]);

  // Keyboard: 1 2 3 for a case, 1 to 4 for a hot take, Enter for next.
  useEffect(() => {
    if (!open || phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter" && t?.tagName !== "BUTTON" && t?.tagName !== "A") {
        next();
        return;
      }
      const n = Number(e.key);
      if (item.kind === "case") {
        const v = VERDICTS.find((x) => x.key === e.key);
        if (v) vote(v.id);
      } else if (n >= 1 && n <= 4) vote((n - 1) as Agree);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, item, next, vote]);

  const players = live ? (stats?.players ?? 0) : 0;
  const placesLeft = Math.max(0, COMPASS.founding - (stats?.founders ?? 0));
  const done = saved?.result ? ARCHETYPES[saved.result.archetype] : null;
  const theirArch = challenger ? ARCHETYPES[archetypeOf(positionOf(challenger))] : null;

  // The most divisive case so far, as a hook on the landing.
  const divisive = live
    ? CASES.map((c) => {
        const counts = countsFor(stats?.items[c.id], VERDICT_IDS);
        const n = counts.reduce((a, b) => a + b, 0);
        return { c, n, score: splitScore(counts), counts };
      })
        .filter((k) => k.n >= 30)
        .sort((a, b) => b.score - a.score)[0]
    : null;

  if (open) {
    const wide = phase === "result";
    return (
      <section aria-label={COMPASS.name} className="-mt-9 flex h-[calc(100dvh-4.25rem)] flex-col">
        <ProgressBar index={index} total={ITEMS.length} phase={phase} onExit={exit} wide={wide} />
        <div className={`mx-auto min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden px-5 py-3 sm:px-8 sm:py-5 lg:px-10 short:py-3 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
          {phase === "play" && item.kind === "case" ? (
            <CaseStep key={item.id} item={item} answer={answer as Verdict | undefined} view={view} onVote={vote} headingRef={heading} />
          ) : null}
          {phase === "play" && item.kind !== "case" ? (
            <StanceStep key={item.id} item={item} answer={answer as Agree | undefined} view={view} onVote={vote} headingRef={heading} />
          ) : null}
          {phase === "role" ? <RoleStep role={role} region={region} onRole={setRole} onRegion={setRegion} headingRef={heading} /> : null}
          {phase === "email" ? <EmailStep headingRef={heading} onSubmit={(d) => void finish(d)} /> : null}
          {phase === "plotting" ? <Plotting /> : null}
          {phase === "result" && result ? (
            <ResultView
              result={result}
              stats={stats}
              role={role}
              challenger={challenger}
              email={email}
              onEmail={(d) => void sendDetails(d, result.archetype)}
              headingRef={heading}
            />
          ) : null}
        </div>

        {phase === "play" ? (
          <StageFooter
            status={
              view ? (
                <Status headline={view.headline} detail={view.detail} />
              ) : item.kind === "case" ? (
                <Status headline="Make your call." detail="Yes, Arguable or No. You'll see how everyone called it." />
              ) : (
                <Status headline="Take a side." detail="Then see how everyone else leans." />
              )
            }
          >
            <NextButton
              onClick={next}
              disabled={answer === undefined}
              label={isLast ? "Last step" : "Next"}
              countdown={item.kind !== "case" && answer !== undefined && !isLast && auto ? DWELL : null}
            />
          </StageFooter>
        ) : null}
        {phase === "role" ? (
          <StageFooter status={<Status headline="One tap." detail="Then where to send the results." />}>
            <NextButton onClick={() => setPhase("email")} disabled={!role} />
          </StageFooter>
        ) : null}
        {phase === "email" ? (
          <StageFooter status={<span className="hidden sm:inline">Your email is never shown with your answers.</span>}>
            <button type="button" onClick={() => void finish(null)} className="group h-12 px-2 text-[0.875rem] text-cream-muted transition-colors hover:text-cream sm:px-3 sm:text-[0.9375rem]">
              <span className="link-draw pb-px">Skip</span>
            </button>
            <NextButton type="submit" form="compass-email" label="Send, show my result" />
          </StageFooter>
        ) : null}
        {phase === "result" && result ? (
          <StageFooter wide status={<ShareBar archetype={result.archetype} pos={{ x: result.x, y: result.y }} code={encodeCalls(result.answers)} />}>
            <button
              type="button"
              onClick={start}
              aria-label="Play again"
              className="inline-flex h-11 items-center gap-2 border border-line-strong bg-surface px-3 text-[0.9375rem] font-medium text-cream transition-colors hover:border-cream sm:h-12 sm:px-4"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Play again</span>
            </button>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative hidden h-12 items-center gap-2.5 overflow-hidden bg-cream px-5 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-accent-deep md:inline-flex"
            >
              Talk to us
              <SwapArrow />
            </a>
          </StageFooter>
        ) : null}
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <Container className="pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16">
          <div>
            {theirArch && !done ? (
              <p className="anim-in mb-8 inline-flex max-w-full items-center gap-3 border border-cream bg-surface py-2 pl-2 pr-4 text-[0.9375rem] text-cream shadow-[var(--shadow-card)]">
                <span className="bg-cream px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink">Challenge</span>
                A colleague is {/^[aeiou]/i.test(theirArch.bare) ? "an" : "a"} {theirArch.bare}. How close will you land?
              </p>
            ) : null}
            <div className="anim-in">
              <Label live>{COMPASS.short} &middot; Live poll</Label>
            </div>
            <h1
              className="wipe font-display t-h1 anim-in mt-8 max-w-[12em] text-balance text-cream sm:mt-10 [&_.block-mark]:my-[0.05em] [&_.block-mark]:inline-block [&_.block-mark]:leading-[1.06]"
              style={{ animationDelay: "80ms" }}
            >
              Where do you stand on <span className="block-mark">AI cover?</span>
            </h1>
            <p className="t-lead anim-in mt-8 max-w-[34rem] text-pretty text-cream-muted" style={{ animationDelay: "180ms" }}>
              Six real AI losses. Six hot takes. Four minutes. Find out which of five AI cover types you are, then see who agrees with you.
            </p>

            <div className="anim-in mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: "260ms" }}>
              {done ? (
                <>
                  <button type="button" onClick={showResult} className={primary}>
                    See your result
                    <SwapArrow />
                    <Underline />
                  </button>
                  <button type="button" onClick={start} className={outline}>
                    Play again
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={start} className={primary}>
                    {theirArch ? "Take the challenge" : "Make your first call"}
                    <SwapArrow />
                    <Underline />
                  </button>
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">4 minutes &middot; Anonymous &middot; No sign-up</p>
                </>
              )}
            </div>

            <div className="anim-in mt-10 space-y-2.5 text-[0.9375rem] text-cream-muted" style={{ animationDelay: "340ms" }}>
              {done ? (
                <p className="flex items-center gap-3">
                  <span aria-hidden className="h-2 w-2 bg-signal" />
                  Welcome back. You&apos;re <span className="font-medium text-cream">{done.name}</span>.
                </p>
              ) : live ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span aria-hidden className="h-2 w-2 bg-signal" />
                  {players > 0 ? (
                    <>
                      <span className="font-medium text-cream">{players.toLocaleString("en")}</span> {players === 1 ? "player so far" : "players so far"}
                      <span aria-hidden className="text-line-strong">/</span>
                      {placesLeft > 0 ? `${placesLeft} of ${COMPASS.founding} Founding places left` : `The Founding ${COMPASS.founding} is full`}
                    </>
                  ) : (
                    `All ${COMPASS.founding} Founding places are open. Be the first.`
                  )}
                </p>
              ) : null}
              {divisive ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span aria-hidden className="h-2 w-2 bg-cream" />
                  Most divisive so far: <span className="font-medium text-cream">{divisive.c.title}</span>
                  <span className="font-mono text-[0.8125rem] text-subtle">
                    {VERDICTS.map((v, i) => `${Math.round((divisive.counts[i] / divisive.n) * 100)}% ${v.label}`).join(" · ")}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <figure className="anim-in relative mx-auto w-full max-w-[28rem]" style={{ animationDelay: "200ms" }}>
            <CompassChart
              ghost={!done}
              you={done && saved?.result ? { x: saved.result.x, y: saved.result.y } : null}
              highlight={saved?.result?.archetype ?? null}
              dots={live ? stats?.dots : []}
              title="The map every player lands on: today's wording against where cover should go"
            />
            <figcaption className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">
              {live && players > 0 ? "Every grey square is a player. " : ""}Where will you land?
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}

const primary =
  "group relative inline-flex h-[3.25rem] select-none items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap bg-cream px-7 text-base font-medium tracking-[-0.012em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-[background-color,scale] duration-300 hover:bg-accent-deep active:scale-[0.985]";
const outline =
  "inline-flex h-[3.25rem] items-center justify-center border border-line-strong bg-surface px-7 text-base font-medium text-cream transition-colors hover:border-cream";

function Underline() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-signal transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
    />
  );
}

/** Progress across the top of the stage, with the way out. */
function ProgressBar({ index, total, phase, onExit, wide }: { index: number; total: number; phase: Phase; onExit: () => void; wide: boolean }) {
  const doneCount = phase === "play" ? index : total;
  const label = phase === "play" ? `${String(index + 1).padStart(2, "0")} / ${total}` : phase === "role" || phase === "email" ? "Last step" : "Done";
  return (
    <div className="shrink-0 border-b border-line-dark bg-ink">
      <div className={`mx-auto flex h-12 w-full items-center gap-4 px-5 sm:h-14 sm:gap-6 sm:px-8 lg:px-10 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit the Compass"
          className="group -ml-1 inline-flex h-10 shrink-0 items-center gap-2 px-1 text-[0.875rem] font-medium text-cream-muted transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
          <span className="hidden sm:inline">Exit</span>
        </button>
        <div role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount} className="flex flex-1 gap-[3px]">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 transition-colors duration-500 ${i < doneCount ? "bg-cream" : i === index && phase === "play" ? "bg-signal" : "bg-line-dark"}`}
            />
          ))}
        </div>
        <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-cream-muted">{label}</span>
      </div>
    </div>
  );
}

function Plotting() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center" role="status">
      <div className="relative h-24 w-24">
        <span aria-hidden className="cmp-bar absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-cream" />
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-cream" />
        <span aria-hidden className="signal-dot is-live absolute left-1/2 top-1/2 !h-3 !w-3 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="eyebrow mt-10 text-cream-muted">Plotting your position</p>
      <p className="font-display mt-4 text-[2rem] leading-tight tracking-[-0.035em] text-cream sm:text-[2.75rem]">Against everyone who&apos;s played.</p>
    </div>
  );
}
