"use client";

import { useRef, useState, type FormEvent, type Ref } from "react";
import { SwapArrow } from "@/components/ui";
import { COMPASS, REGIONS, ROLES, type RegionId, type RoleId } from "@/content/compass";

export type Details = { email: string; name: string; title: string; take: string; credit: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The last step, at peak curiosity: who's calling (one tap, needed to split results by role)
 * and where to send the full results. Asked once, at the end, never mid-game. The email can
 * be skipped; the role can't. `card` is the compact email-only version on the result screen.
 */
export default function DetailsStep({
  onSubmit,
  onSkip,
  variant = "step",
  busy = false,
  error = "",
  headingRef,
  role = null,
  region = null,
  onRole,
  onRegion,
}: {
  onSubmit: (d: Details) => void;
  onSkip?: () => void;
  variant?: "step" | "card";
  busy?: boolean;
  error?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  role?: RoleId | null;
  region?: RegionId | null;
  onRole?: (r: RoleId) => void;
  onRegion?: (r: RegionId | null) => void;
}) {
  const [invalid, setInvalid] = useState(false);
  const [needRole, setNeedRole] = useState(false);
  const roles = useRef<HTMLFieldSetElement>(null);
  const step = variant === "step";
  const askRole = step && !!onRole;

  /** The role comes first. Without it, point at the chips instead of moving on. */
  const roleMissing = () => {
    if (!askRole || role) return false;
    setNeedRole(true);
    roles.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  };

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return; // hidden from people; bots fill it in
    if (roleMissing()) return;
    const email = String(f.get("email") ?? "").trim();
    if (!EMAIL.test(email)) {
      setInvalid(true);
      return;
    }
    onSubmit({
      email,
      name: String(f.get("name") ?? "").trim(),
      title: String(f.get("title") ?? "").trim(),
      take: String(f.get("take") ?? "").trim(),
      credit: f.get("credit") === "on",
    });
  }

  const field =
    "h-12 w-full border border-line-strong bg-surface px-4 text-base text-cream placeholder:text-subtle transition-colors focus:border-cream focus:outline-none";
  const label = "eyebrow text-cream-muted";

  return (
    <section className={step ? "cmp-step-in" : "border border-line-dark bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"} aria-labelledby="details-title">
      <p className="eyebrow flex items-center gap-3 text-cream-muted">
        <span aria-hidden className="signal-dot is-live" />
        {step ? "Last step" : "Get the full results"}
      </p>
      <h2
        id="details-title"
        ref={headingRef}
        tabIndex={-1}
        className={`font-display text-balance tracking-[-0.038em] text-cream outline-none ${step ? "mt-6 text-[2.25rem] leading-[1.04] sm:text-[3.25rem]" : "mt-4 text-[1.75rem] leading-tight sm:text-[2.25rem]"}`}
      >
        {step ? "One last thing." : "Where should we send the results?"}
      </h2>
      <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-cream-muted sm:text-[1.0625rem]">
        {step ? "Tell us what you do, so we can split the results by role. Leave your work email and the full results come to you before we publish them. " : "The full survey results go to you before we publish them, with how every role called every case. "}
        The first {COMPASS.founding} get credited in the report.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 grid max-w-2xl gap-4">
        {askRole ? (
          <fieldset ref={roles} className="mb-4 grid gap-3">
            <legend className="font-display mb-3 text-[1.375rem] leading-tight tracking-[-0.025em] text-cream">What do you do?</legend>
            <div role="radiogroup" aria-label="What do you do?" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ROLES.map((r) => {
                const on = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      onRole?.(r.id);
                      setNeedRole(false);
                    }}
                    className={`flex min-h-12 items-center justify-between gap-2 border px-3.5 py-3 text-left text-[0.9375rem] font-medium tracking-[-0.01em] transition-[background-color,border-color,color] duration-200 ${
                      on ? "border-cream bg-cream text-ink" : `bg-surface text-cream hover:border-cream ${needRole ? "border-disagree-2/60" : "border-line-strong"}`
                    }`}
                  >
                    {r.label}
                    {on ? <span aria-hidden className="h-2 w-2 shrink-0 bg-signal" /> : null}
                  </button>
                );
              })}
            </div>
            {needRole ? (
              <p role="alert" className="text-[0.875rem] text-disagree-2">
                Pick one first. It&apos;s how we split the results by role.
              </p>
            ) : null}
            <p className="eyebrow mt-3 text-subtle">Where you work &middot; optional</p>
            <div role="radiogroup" aria-label="Where you work" className="flex flex-wrap gap-2">
              {REGIONS.map((r) => {
                const on = region === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onRegion?.(on ? null : r.id)}
                    className={`h-10 border px-3.5 text-sm transition-[background-color,border-color,color] duration-200 ${
                      on ? "border-cream bg-cream text-ink" : "border-line-strong bg-surface text-cream-muted hover:border-cream hover:text-cream"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        {askRole ? (
          <p className="font-display text-[1.375rem] leading-tight tracking-[-0.025em] text-cream">Where should we send the results?</p>
        ) : null}
        <label className="grid gap-2">
          <span className={label}>Work email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            maxLength={200}
            aria-invalid={invalid}
            aria-describedby={invalid ? "email-error" : undefined}
            onChange={() => invalid && setInvalid(false)}
            className={`${field} ${invalid ? "!border-disagree-2" : ""}`}
          />
          {invalid ? (
            <span id="email-error" className="text-[0.875rem] text-disagree-2">
              Please enter a valid work email.
            </span>
          ) : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={label}>Name &middot; optional</span>
            <input name="name" autoComplete="name" placeholder="For the credits" maxLength={120} className={field} />
          </label>
          <label className="grid gap-2">
            <span className={label}>Job title &middot; optional</span>
            <input name="title" autoComplete="organization-title" placeholder="e.g. Head of Claims" maxLength={120} className={field} />
          </label>
        </div>
        <label className="grid gap-2">
          <span className={label}>Your take on AI cover, in one line &middot; optional</span>
          <textarea
            name="take"
            rows={2}
            maxLength={280}
            placeholder="e.g. Silent cover is still cover."
            className={`${field} h-auto resize-none py-3`}
          />
          <span className="text-[0.8125rem] text-subtle">We may quote it in the report, without your name.</span>
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-cream-muted">
          <input name="credit" type="checkbox" defaultChecked className="mt-1 h-4 w-4 shrink-0 accent-[#0a0a0a]" />
          If I&apos;m in the first {COMPASS.founding}, credit me by name in the report.
        </label>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={busy}
            className="group relative inline-flex h-[3.25rem] items-center justify-center gap-2.5 overflow-hidden bg-cream px-7 text-base font-medium text-ink transition-[background-color,opacity] duration-300 hover:bg-accent-deep disabled:opacity-60"
          >
            {busy ? "Saving…" : step ? "Send them, and show my result" : "Send me the results"}
            <SwapArrow />
          </button>
          {onSkip ? (
            <button
              type="button"
              onClick={() => !roleMissing() && onSkip()}
              className="group h-11 text-[0.9375rem] text-cream-muted transition-colors hover:text-cream"
            >
              <span className="link-draw pb-px">Skip the email, just show my result</span>
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-[0.875rem] text-disagree-2">
            {error}
          </p>
        ) : null}
        <p className="text-[0.75rem] leading-relaxed text-subtle">
          Your answers are never shown with your name or email. We use your email to send the results and confirm you work in insurance,
          nothing else. Ask us to delete it any time at info@vizco.co.
        </p>
      </form>
    </section>
  );
}
