"use client";

import { useState, type FormEvent, type Ref } from "react";
import { SwapArrow } from "@/components/ui";
import { COMPASS, REGIONS, ROLES, type RegionId, type RoleId } from "@/content/compass";

export type Details = { email: string; name: string; title: string; take: string; credit: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const chip = (on: boolean) =>
  `border text-left font-medium tracking-[-0.01em] transition-[background-color,border-color,color] duration-200 ${
    on ? "border-cream bg-cream text-ink" : "border-line-strong bg-surface text-cream hover:border-cream"
  }`;

/** Last step, part one: what the player does (one tap) and where (optional). Fits one screen. */
export function RoleStep({
  role,
  region,
  onRole,
  onRegion,
  headingRef,
}: {
  role: RoleId | null;
  region: RegionId | null;
  onRole: (r: RoleId) => void;
  onRegion: (r: RegionId | null) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  return (
    <section className="cmp-step-in flex h-full flex-col">
      <div className="my-auto">
        <p className="eyebrow flex items-center gap-3 text-cream-muted">
          <span aria-hidden className="signal-dot is-live" />
          Last step &middot; 1 of 2
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display mt-3 text-[2rem] leading-[1.04] tracking-[-0.038em] text-cream outline-none sm:mt-5 sm:text-[3rem] short:sm:text-[2.5rem]"
        >
          What do you do?
        </h2>
        <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-cream-muted sm:mt-3 sm:text-[1.0625rem]">
          So the results can be split by role. Never published with your name.
        </p>
        <div role="radiogroup" aria-label="What do you do?" className="mt-5 grid max-w-3xl grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-4 short:mt-4">
          {ROLES.map((r) => {
            const on = role === r.id;
            return (
              <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => onRole(r.id)} className={`flex min-h-12 items-center justify-between gap-2 px-3.5 py-2.5 text-[0.9375rem] sm:min-h-14 sm:text-base short:min-h-11 ${chip(on)}`}>
                {r.label}
                {on ? <span aria-hidden className="h-2 w-2 shrink-0 bg-signal" /> : null}
              </button>
            );
          })}
        </div>
        <p className="eyebrow mt-5 text-subtle sm:mt-8 short:mt-4">Where you work &middot; optional</p>
        <div role="radiogroup" aria-label="Where you work" className="mt-2.5 flex flex-wrap gap-2">
          {REGIONS.map((r) => {
            const on = region === r.id;
            return (
              <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => onRegion(on ? null : r.id)} className={`h-10 px-3.5 text-sm ${chip(on)}`}>
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * The email fields. In the game (part two of the last step) the submit button lives in the
 * footer and targets this form by id; on the result screen it brings its own button.
 */
export function EmailForm({
  id,
  onSubmit,
  compact = false,
  busy = false,
  error = "",
}: {
  id: string;
  onSubmit: (d: Details) => void;
  compact?: boolean;
  busy?: boolean;
  error?: string;
}) {
  const [invalid, setInvalid] = useState(false);

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
    "h-11 w-full border border-line-strong bg-surface px-3.5 text-base text-cream placeholder:text-subtle transition-colors focus:border-cream focus:outline-none sm:h-12 sm:px-4 short:h-10";
  const label = "eyebrow text-cream-muted";

  return (
    <form id={id} onSubmit={submit} noValidate className="grid max-w-2xl gap-3 sm:gap-4 short:gap-2.5">
      <label className="grid gap-1.5">
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
          onChange={() => invalid && setInvalid(false)}
          className={`${field} ${invalid ? "!border-disagree-2" : ""}`}
        />
        {invalid ? <span className="text-[0.8125rem] text-disagree-2">Please enter a valid work email.</span> : null}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <label className="grid gap-1.5">
          <span className={label}>Name</span>
          <input name="name" autoComplete="name" placeholder="Optional" maxLength={120} className={field} />
        </label>
        <label className="grid gap-1.5">
          <span className={label}>Job title</span>
          <input name="title" autoComplete="organization-title" placeholder="Optional" maxLength={120} className={field} />
        </label>
      </div>
      {compact ? null : (
        <label className="grid gap-1.5">
          <span className={label}>Your take on AI cover, in one line</span>
          <input name="take" maxLength={280} placeholder="Optional. e.g. Silent cover is still cover." className={field} />
        </label>
      )}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex cursor-pointer items-start gap-2.5 text-[0.8125rem] leading-snug text-cream-muted sm:text-[0.9375rem]">
        <input name="credit" type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 shrink-0 accent-[#0a0a0a]" />
        If I&apos;m in the first {COMPASS.founding}, credit me by name. My answers are never shown with my name.
      </label>
      {compact ? (
        <button
          type="submit"
          disabled={busy}
          className="group relative inline-flex h-12 w-fit items-center justify-center gap-2.5 overflow-hidden bg-cream px-6 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {busy ? "Saving…" : "Send me the results"}
          <SwapArrow />
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-[0.8125rem] text-disagree-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}

/** Last step, part two: where to send the results. Fits one screen; the footer holds the buttons. */
export function EmailStep({ onSubmit, headingRef }: { onSubmit: (d: Details) => void; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <section className="cmp-step-in flex h-full flex-col">
      <div className="my-auto">
        <p className="eyebrow flex items-center gap-3 text-cream-muted">
          <span aria-hidden className="signal-dot is-live" />
          Last step &middot; 2 of 2
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display mt-3 text-[2rem] leading-[1.04] tracking-[-0.038em] text-cream outline-none sm:mt-5 sm:text-[3rem] short:mt-2 short:text-[1.625rem] short:sm:text-[2.5rem]"
        >
          Where should we send the results?
        </h2>
        <p className="mb-5 mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-cream-muted sm:mb-8 sm:mt-3 sm:text-[1.0625rem] short:mb-3 short:text-[0.875rem] short:leading-snug">
          The full results come to you before we publish them. The first {COMPASS.founding} get credited in the report.
        </p>
        <EmailForm id="compass-email" onSubmit={onSubmit} />
      </div>
    </section>
  );
}
