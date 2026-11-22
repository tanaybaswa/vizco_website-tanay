"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { SwapArrow } from "@/components/ui";
import { COMPASS, type ArchetypeId, type RoleId } from "@/content/compass";

/** The Founding 200: credit in the first report, early results, and a direct line for feedback. */
export default function FoundingForm({
  pid,
  role,
  archetype,
  player,
  joined,
  onJoined,
  open = true,
}: {
  /** False once the Founding places have all been taken. */
  open?: boolean;
  pid: string;
  role: RoleId | null;
  archetype: ArchetypeId;
  player?: number | null;
  joined: boolean;
  onJoined: () => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(joined ? "done" : "idle");
  const [error, setError] = useState("");
  const [member, setMember] = useState<number | null>(null);
  const window_ = open;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/compass/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid,
          role,
          archetype,
          player: player ?? null,
          name: f.get("name"),
          email: f.get("email"),
          company: f.get("company"),
          credit: f.get("credit") === "on",
          feedback: f.get("feedback"),
          website: f.get("website"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; member?: number };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setMember(data.member ?? null);
      setState("done");
      onJoined();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  const field =
    "h-12 w-full border border-ink/25 bg-transparent px-4 text-base text-ink placeholder:text-ink/40 transition-colors focus:border-ink focus:outline-none";

  return (
    <section className="relative overflow-hidden bg-cream text-ink" aria-labelledby="founding-title">
      <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 lg:p-12">
        <div>
          <p className="eyebrow flex items-center gap-3 text-ink/60">
            <span aria-hidden className="signal-dot is-live" />
            {player ? `Player #${player}` : "Early player"}
            {window_ ? " · Founding window open" : ""}
          </p>
          <h3 id="founding-title" className="font-display mt-5 text-balance text-[2.25rem] leading-[1.02] tracking-[-0.038em] sm:text-[3rem]">
            {window_ ? `Join the Founding ${COMPASS.founding}.` : "Join the panel."}
          </h3>
          <ul className="mt-7 space-y-3.5 text-[0.9375rem] leading-relaxed text-ink/75 sm:text-base">
            {[
              "Your name in the first AI Cover Compass report, if you want it there.",
              "The results before anyone else, with the full split by role.",
              "A direct line to the team: tell us what to fix, and help shape version two.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-signal" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {state === "done" ? (
          <div className="cmp-rise flex flex-col justify-center border border-ink/20 p-6 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center bg-signal text-signal-ink">
              <Check className="h-6 w-6" strokeWidth={2} />
            </span>
            <p className="font-display mt-6 text-[1.75rem] leading-tight tracking-[-0.03em]">You&apos;re in.</p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/70">
              {member ? `Founding member #${member}. ` : ""}We&apos;ll be in touch before the report goes out. Thank you for helping build
              this.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3" noValidate={false}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="eyebrow text-ink/55">Name</span>
                <input name="name" autoComplete="name" className={field} placeholder="For the credits" maxLength={120} />
              </label>
              <label className="grid gap-1.5">
                <span className="eyebrow text-ink/55">Company</span>
                <input name="company" autoComplete="organization" className={field} placeholder="Optional" maxLength={120} />
              </label>
            </div>
            <label className="grid gap-1.5">
              <span className="eyebrow text-ink/55">Work email</span>
              <input name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" maxLength={200} />
            </label>
            <label className="grid gap-1.5">
              <span className="eyebrow text-ink/55">What should we add or fix?</span>
              <textarea
                name="feedback"
                rows={3}
                maxLength={2000}
                className={`${field} h-auto resize-y py-3`}
                placeholder="A case we got wrong, a wording to test, a question we should ask"
              />
            </label>
            {/* Hidden from people; bots fill it in */}
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <label className="mt-1 flex cursor-pointer items-start gap-3 text-[0.875rem] leading-relaxed text-ink/75">
              <input name="credit" type="checkbox" defaultChecked className="mt-1 h-4 w-4 shrink-0 accent-[#ff5a1f]" />
              Credit me by name in the report. Your answers are never shown with your name.
            </label>
            <button
              type="submit"
              disabled={state === "sending"}
              className="group relative mt-3 inline-flex h-[3.25rem] items-center justify-center gap-2.5 overflow-hidden bg-ink px-7 text-base font-medium text-cream transition-[background-color,opacity] duration-300 hover:bg-ink-3 disabled:opacity-60 sm:w-fit"
            >
              {state === "sending" ? "Joining…" : window_ ? `Join the Founding ${COMPASS.founding}` : "Join the panel"}
              <SwapArrow />
            </button>
            {error ? (
              <p role="alert" className="text-[0.875rem] text-signal">
                {error}
              </p>
            ) : null}
            <p className="text-[0.75rem] leading-relaxed text-ink/50">
              We use your email to confirm you work in insurance and to send you the report. Nothing else, and never shared. Ask us to delete it
              any time at info@vizco.co.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
