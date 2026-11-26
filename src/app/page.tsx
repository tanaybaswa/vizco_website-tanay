import type { Metadata } from "next";
import { faqSchema, pageMeta } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import Thesis from "@/components/home/Thesis";
import Backers from "@/components/home/Backers";
import ClaimStory from "@/components/home/ClaimStory";
import WhyNow from "@/components/home/WhyNow";
import CoverageIndex from "@/components/home/CoverageIndex";
import PolicyYear from "@/components/home/PolicyYear";
import Audiences from "@/components/home/Audiences";
import FinalCta from "@/components/FinalCta";
import { Container, Faq, Label } from "@/components/ui";
import { BOOKING_URL } from "@/content/site";

export const metadata: Metadata = pageMeta({
  title: "VizCo | AI Liability Insurance & Emerging Risk Broker",
  absoluteTitle: true,
  description:
    "AI liability insurance for enterprises and AI startups. We find where your policies are silent on or exclude AI, prove your AI to insurers and place the cover.",
  path: "/",
});

const FAQ = [
  {
    q: "What is AI liability insurance?",
    a: "Cover for the harm your AI causes: wrong answers people relied on, actions it took without permission, data it exposed.",
  },
  {
    q: "Doesn't my existing insurance already cover AI?",
    a: "Usually not clearly. Most policies say nothing about AI, and more now exclude it. We read yours and tell you where you stand.",
  },
  {
    q: "What is silent AI?",
    a: "A policy that never mentions AI. Whether it pays for an AI loss is only decided when you claim.",
  },
  {
    q: "How do you assess AI risk?",
    a: "We map the AI you run and buy, test it, review its controls, and read your policies against how it can fail.",
  },
  {
    q: "What happens if our AI changes after we're insured?",
    a: "We monitor for changes like model updates, new data and new uses, and report them to your insurers so your cover keeps up.",
  },
  {
    q: "Do you help if we need to claim?",
    a: "Yes. We keep the record of your AI that insurers need, and argue the claim for you.",
  },
  {
    q: "How are you paid?",
    a: "By insurer commission or an agreed fee. We tell you which before anything is bound.",
  },
];

/*
 * The home page tells one story, and each section has its own form so it never reads as
 * a stack of the same panel: the hero, who backs us, a claim from start to finish (why it
 * matters), the numbers (why now), every way AI goes wrong (what we cover), the policy
 * year (how we work), the two buyers, then questions and the close.
 */
export default function Home() {
  return (
    <main>
      <JsonLd data={faqSchema(FAQ)} />
      <Thesis />
      <Backers />
      <ClaimStory />
      <WhyNow />
      <CoverageIndex />
      <PolicyYear />
      <Audiences />

      <section id="faq" className="relative py-20 sm:py-28 lg:py-32">
        <Container>
          <div className="grid gap-12 border-t border-line-dark pt-16 sm:pt-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
            <Reveal className="self-start lg:sticky lg:top-32">
              <Label>Questions</Label>
              <h2 className="font-display t-h2 mt-7 text-balance text-cream">What buyers ask us.</h2>
              <p className="mt-6 max-w-xs text-[1.0625rem] leading-relaxed text-cream-muted">
                Something else?{" "}
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="link-signal font-medium text-cream">
                  Talk to us
                </a>
                .
              </p>
            </Reveal>
            <Faq items={FAQ} className="lg:mt-2" />
          </div>
        </Container>
      </section>

      <FinalCta />
    </main>
  );
}
