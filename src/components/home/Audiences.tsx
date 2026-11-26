import Link from "next/link";
import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";
import { CertificateCard, VendorStack } from "@/components/pages/Visuals";
import { Container, Label, SwapArrow } from "@/components/ui";

const AUDIENCES: { label: string; title: ReactNode; line: string; visual: ReactNode; href: string; more: string }[] = [
  {
    label: "For enterprises",
    title: "The AI you run. The AI you buy.",
    line: "We assess both, check what your vendors' cover leaves exposed, and cover the gaps.",
    visual: <VendorStack />,
    href: "/enterprise",
    more: "How it works for enterprises",
  },
  {
    label: "For AI startups",
    title: "Get your AI through procurement.",
    line: "Enterprise buyers want proof your AI is insured before they sign. We get you that proof.",
    visual: <CertificateCard />,
    href: "/startups",
    more: "How it works for startups",
  },
];

/** Who it's for: the two buyers side by side, each with the thing we hand them. */
export default function Audiences() {
  return (
    <section aria-label="Who we work with" className="relative py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-20 border-t border-line-dark pt-16 sm:pt-20 lg:grid-cols-2 lg:gap-0">
          {AUDIENCES.map((a, i) => (
            <Reveal
              key={a.href}
              delay={i * 100}
              className={`flex flex-col ${i === 0 ? "lg:pr-14 xl:pr-20" : "border-t border-line-dark pt-20 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0 xl:pl-20"}`}
            >
              <Label>{a.label}</Label>
              <h2 className="font-display mt-7 text-balance text-[2.25rem] leading-[1.02] tracking-[-0.04em] text-cream sm:text-5xl">{a.title}</h2>
              <p className="mt-5 max-w-md text-pretty text-[1.0625rem] leading-relaxed text-cream-muted sm:text-lg">{a.line}</p>
              <div className="mt-12 flex flex-1 items-center">{a.visual}</div>
              <Link href={a.href} className="group mt-12 inline-flex w-fit items-center gap-2.5 text-[0.9375rem] font-medium text-cream">
                <span className="link-signal">{a.more}</span>
                <SwapArrow />
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
