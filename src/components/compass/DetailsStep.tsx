"use client";

import { useState, type FormEvent, type Ref } from "react";
import { SwapArrow } from "@/components/ui";
import { COMPASS } from "@/content/compass";

export type Details = { email: string; name: string; title: string; take: string; credit: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The last step, at peak curiosity: where to send the full results. Asked before the
 * reveal because that's when people most want to finish, but it can always be skipped.
 * `card` is the compact version on the result screen, for people who skipped.
 */
export default function DetailsStep({
  onSubmit,
  onSkip,
  variant = "step",
  busy = false,
  error = "",
  headingRef,
}: {
  onSubmit: (d: Details) => void;
  onSkip?: () => void;
  variant?: "step" | "card";
  busy?: boolean;
  error?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const [invalid, setInvalid] = useState(false);
  const step = variant === "step";

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return; // hidden from people; bots fill it in
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
        Where should we send the results?
      </h2>
      <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-cream-muted sm:text-[1.0625rem]">
        The full survey results go to you before we publish them, with how every role called every case. The first {COMPASS.founding} get
        credited in the report.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 grid max-w-2xl gap-4">
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
            {busy ? "Saving…" : step ? "Show my result" : "Send me the results"}
            <SwapArrow />
          </button>
          {onSkip ? (
            <button type="button" onClick={onSkip} className="group h-11 text-[0.9375rem] text-cream-muted transition-colors hover:text-cream">
              <span className="link-draw pb-px">Skip, just show my result</span>
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
