"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Container, Label, SwapArrow } from "@/components/ui";
import CompassChart from "@/components/compass/CompassChart";
import CaseStep from "@/components/compass/CaseStep";
import StanceStep from "@/components/compass/StanceStep";
import WhoSheet from "@/components/compass/WhoSheet";
import ResultView, { type Result } from "@/components/compass/ResultView";
import { ARCHETYPES, COMPASS, ITEMS, VERDICTS, type Agree, type RegionId, type RoleId, type Verdict } from "@/content/compass";
import { archetypeOf, positionOf, type Answers, type CompassStats } from "@/lib/compass/score";
import { loadSaved, save, type Saved } from "@/lib/compass/local";

type Phase = "play" | "plotting" | "result";
type CaseStepName = "ask" | "who" | "reveal";

/** Other parts of the page start the game by dispatching this event. */
export const START_EVENT = "compass:start";

const PLOT_MS = 1900;

async function fetchStats(fresh = false): Promise<CompassStats | null> {
  try {
    const res = await fetch(`/api/compass/stats${fresh ? `?t=${Date.now()}` : ""}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CompassStats;
  } catch {
    return null;
  }
}

export default function CompassGame() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [stats, setStats] = useState<CompassStats | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("play");
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<CaseStepName>("ask");
  const [answers, setAnswers] = useState<Answers>({});
  const [role, setRole] = useState<RoleId | null>(null);
  const [region, setRegion] = useState<RegionId | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const startedAt = useRef(0);
  const statsAt = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const item = ITEMS[index];
  const isLast = index === ITEMS.length - 1;

  // Remember the player between visits; load the live numbers for the hero.
  useEffect(() => {
    const s = loadSaved();
    setSaved(s);
    setRole(s.role ?? null);
    setRegion(s.region ?? null);
    if (s.result) setResult(s.result);
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

  const start = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setAnswers({});
    setIndex(0);
    setStep("ask");
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
    opener.current = document.activeElement as HTMLElement | null;
    setPhase("result");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => opener.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    const onStart = () => start();
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [start]);

  // Lock the page behind the stage.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Each new step starts at the top, with focus on its heading for screen readers.
  useEffect(() => {
    if (!open) return;
    stage.current?.scrollTo({ top: 0 });
    const id = window.setTimeout(() => heading.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(id);
  }, [open, index, phase]);

  const voteCase = useCallback(
    (v: Verdict) => {
      setAnswers((a) => ({ ...a, [item.id]: v }));
      navigator.vibrate?.(8);
      setStep(role ? "reveal" : "who");
    },
    [item, role],
  );

  const voteStance = useCallback(
    (a: Agree) => {
      setAnswers((prev) => ({ ...prev, [item.id]: a }));
      navigator.vibrate?.(8);
    },
    [item],
  );

  const finish = useCallback(async () => {
    const pos = positionOf(answers);
    const archetype = archetypeOf(pos);
    setPhase("plotting");
    const t0 = Date.now();
    const pid = saved?.pid ?? loadSaved().pid;

    let player: number | null = null;
    let counted = false;
    let reason: Result["reason"] = null;
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
    const fresh = await fetchStats(true);
    if (fresh) {
      setStats(fresh);
      statsAt.current = Date.now();
    }
    await new Promise((r) => window.setTimeout(r, Math.max(0, PLOT_MS - (Date.now() - t0))));

    // A replay keeps the first run's player number.
    const keepPlayer = player ?? saved?.result?.player ?? null;
    const next: Result = { answers, ...pos, archetype, player: keepPlayer, counted, reason };
    setResult(next);
    persist({ pid, role, region, result: { ...next, at: new Date().toISOString() } });
    setPhase("result");
  }, [answers, persist, region, role, saved]);

  const next = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    setIndex((i) => i + 1);
    setStep("ask");
  }, [finish, isLast]);

  // Keyboard play: 1 2 3 for a case, 1 to 4 for a position, Enter to move on, Esc to leave.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || phase !== "play") return;
      if (item.kind === "case") {
        if (step === "ask") {
          const v = VERDICTS.find((x) => x.key === e.key);
          if (v) voteCase(v.id);
        } else if (step === "reveal" && e.key === "Enter" && t?.tagName !== "BUTTON" && t?.tagName !== "A") {
          next();
        }
      } else {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) voteStance((n - 1) as Agree);
        else if (e.key === "Enter" && answers[item.id] !== undefined && t?.tagName !== "BUTTON" && t?.tagName !== "A") next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, item, step, answers, close, next, voteCase, voteStance]);

  const live = !!stats?.live;
  const players = live ? stats?.players ?? 0 : 0;
  const placesLeft = Math.max(0, COMPASS.founding - (stats?.founders ?? 0));
  const done = saved?.result ? ARCHETYPES[saved.result.archetype] : null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container className="pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16">
            <div>
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
                Six real-world AI losses. Six positions on where cover should go. Make your calls, see how the market split, and find out
                where you land.
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
                      Make your first call
                      <SwapArrow />
                      <Underline />
                    </button>
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">4 minutes &middot; Anonymous &middot; No sign-up</p>
                  </>
                )}
              </div>

              <p className="anim-in mt-10 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-cream-muted" style={{ animationDelay: "340ms" }}>
                {done ? (
                  <>
                    <span aria-hidden className="h-2 w-2 bg-signal" />
                    Welcome back. You&apos;re <span className="font-medium text-cream">{done.name}</span>.
                  </>
                ) : live ? (
                  <>
                    <span aria-hidden className="h-2 w-2 bg-signal" />
                    {players > 0 ? (
                      <>
                        <span className="font-medium text-cream">{players}</span> {players === 1 ? "player so far" : "players so far"}
                        <span aria-hidden className="text-line-strong">/</span>
                        {placesLeft > 0 ? `${placesLeft} of ${COMPASS.founding} Founding places left` : `The Founding ${COMPASS.founding} is full`}
                      </>
                    ) : (
                      `All ${COMPASS.founding} Founding places are open. Be the first.`
                    )}
                  </>
                ) : null}
              </p>
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

      {/* The stage */}
      {open ? (
        <div
          ref={stage}
          role="dialog"
          aria-modal="true"
          aria-label={COMPASS.name}
          className="cmp-stage-in fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-ink"
        >
          <StageBar
            index={index}
            total={ITEMS.length}
            phase={phase}
            onClose={close}
          />
          <div className={`mx-auto w-full px-5 pb-24 pt-8 sm:px-8 sm:pt-14 ${phase === "result" ? "max-w-6xl" : "max-w-3xl"}`}>
            {phase === "play" && item.kind === "case" ? (
              <CaseStep
                key={item.id}
                item={item}
                step={step}
                answer={answers[item.id] as Verdict | undefined}
                tally={stats?.items[item.id]}
                role={role}
                live={live}
                onVote={voteCase}
                onNext={next}
                isLast={isLast}
                headingRef={heading}
                who={
                  <WhoSheet
                    role={role}
                    region={region}
                    onRole={setRole}
                    onRegion={setRegion}
                    onDone={() => {
                      persist({ role, region });
                      setStep("reveal");
                    }}
                  />
                }
              />
            ) : null}
            {phase === "play" && item.kind !== "case" ? (
              <StanceStep
                key={item.id}
                item={item}
                answer={answers[item.id] as Agree | undefined}
                tally={stats?.items[item.id]}
                role={role}
                live={live}
                onVote={voteStance}
                onNext={next}
                isLast={isLast}
                headingRef={heading}
              />
            ) : null}
            {phase === "plotting" ? <Plotting /> : null}
            {phase === "result" && result ? (
              <ResultView
                result={result}
                stats={stats}
                role={role}
                pid={saved?.pid ?? ""}
                joined={!!saved?.joined}
                onJoined={() => persist({ joined: true })}
                onReplay={start}
                headingRef={heading}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
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

function StageBar({ index, total, phase, onClose }: { index: number; total: number; phase: Phase; onClose: () => void }) {
  const doneCount = phase === "play" ? index : total;
  return (
    <div className="sticky top-0 z-10 border-b border-line-dark bg-ink/90 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-5 sm:h-16 sm:gap-6 sm:px-8">
        <span className="flex shrink-0 items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cream">
          <span aria-hidden className="h-2 w-2 bg-signal" />
          <span className="hidden sm:inline">{COMPASS.short}</span>
          <span className="sm:hidden">Compass</span>
        </span>
        <div
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={doneCount}
          className="flex flex-1 gap-[3px]"
        >
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 transition-colors duration-500 ${
                i < doneCount ? "bg-cream" : i === index && phase === "play" ? "bg-signal" : "bg-line-dark"
              }`}
            />
          ))}
        </div>
        <span className="hidden shrink-0 font-mono text-[0.6875rem] tabular-nums text-cream-muted sm:inline">
          {phase === "play" ? `${String(index + 1).padStart(2, "0")} / ${total}` : "Done"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the Compass"
          className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center text-cream-muted transition-colors hover:text-cream"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function Plotting() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center" role="status">
      <div className="relative h-24 w-24">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-cream cmp-bar" />
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-cream" />
        <span aria-hidden className="signal-dot is-live absolute left-1/2 top-1/2 !h-3 !w-3 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="eyebrow mt-10 text-cream-muted">Plotting your position</p>
      <p className="font-display mt-4 text-[2rem] leading-tight tracking-[-0.035em] text-cream sm:text-[2.75rem]">Against everyone who&apos;s played.</p>
    </div>
  );
}
