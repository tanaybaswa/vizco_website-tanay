import Link from "next/link";
import FixNote from "@/components/home/FixNote";
import HeroPortrait from "@/components/home/portrait/HeroPortrait";
import { Button, Container, SwapArrow } from "@/components/ui";
import { BOOKING_URL, CHECKER_URL, PROMO, TAGLINE } from "@/content/site";

const AUDIENCES = [
  { href: "/enterprise", label: "For enterprises" },
  { href: "/startups", label: "For AI startups" },
];

/**
 * Home hero: the thesis, one line on what we do, actions, and the two audiences, with the
 * engraved portrait beside them (below them on smaller screens).
 */
export default function Thesis() {
  return (
    <section className="relative isolate">
      <Container className="hero-grid relative pb-20 pt-10 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        {/* The AI Cover Compass, while it's new */}
        <Link
          href={PROMO.href}
          className="group anim-in relative z-10 mb-9 inline-flex w-fit max-w-full items-center gap-3 border border-line-strong bg-surface py-1.5 pl-1.5 pr-3.5 text-[0.875rem] tracking-[-0.01em] text-cream shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-300 hover:border-cream hover:shadow-[var(--shadow-lift)] sm:mb-11"
        >
          <span className="bg-signal px-2 py-1 font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em] text-signal-ink">
            {PROMO.badge}
          </span>
          <span className="truncate font-medium">AI Cover Compass</span>
          <span className="hidden truncate text-cream-muted md:inline">{PROMO.label}</span>
          <span aria-hidden className="h-4 w-px shrink-0 bg-line-strong" />
          <span className="flex shrink-0 items-center gap-1.5 font-medium">
            Play now
            <SwapArrow className="h-3.5 w-3.5" />
          </span>
        </Link>
        <h1 className="wipe font-display t-display anim-in relative z-10 max-w-[15em] text-balance text-cream" style={{ animationDelay: "40ms" }}>
          Your insurance <br className="hidden md:inline" />
          wasn&apos;t written for AI.{" "}
          {/* On desktop the portrait sits to the right, so the note always takes its own line. */}
          <br className="hidden lg:inline" />
          {/* From md up the note starts its own line, so it hangs left by the block's 0.12em
              padding: the letters line up with "Your" and the black block sits in the margin. */}
          <FixNote className="my-[0.05em] inline-block whitespace-nowrap leading-[1.06] md:-ml-[0.12em]">We fix that.</FixNote>
        </h1>
        <p
          className="anim-in relative z-10 mt-9 flex items-center gap-4 text-[clamp(1.125rem,0.9rem+0.8vw,1.625rem)] font-medium leading-tight tracking-[-0.028em] text-cream sm:mt-10"
          style={{ animationDelay: "140ms" }}
        >
          <span aria-hidden className="h-[2px] w-8 shrink-0 bg-signal sm:w-10" />
          {TAGLINE}
        </p>
        <div className="relative z-10 mt-5">
          <p className="t-lead anim-in max-w-[34rem] text-pretty text-cream-muted" style={{ animationDelay: "180ms" }}>
            We assess and reduce your AI risk, place the cover, and keep monitoring your AI so your cover keeps up.
          </p>
          <div className="anim-in mt-10 flex w-fit flex-wrap items-center gap-3" style={{ animationDelay: "260ms" }}>
            <Button href={BOOKING_URL} external size="lg">
              Talk to us
            </Button>
            <Button href={CHECKER_URL} external variant="outline" size="lg">
              Check your AI coverage
            </Button>
          </div>
        </div>
        <HeroPortrait className="plate-hero mx-auto mt-20 w-full max-w-[26rem] sm:mt-24" />
        <div className="anim-in relative z-10 mt-16 grid max-w-[38rem] gap-3 sm:mt-20 sm:grid-cols-2" style={{ animationDelay: "340ms" }}>
          {AUDIENCES.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className="wipe-hover group flex items-center justify-between gap-4 border border-line-dark px-5 py-[1.125rem] text-cream shadow-[var(--shadow-card)]"
            >
              <span className="flex items-center gap-4">
                <span className="font-mono text-[0.6875rem] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-base font-medium tracking-[-0.015em]">{a.label}</span>
              </span>
              <SwapArrow />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
