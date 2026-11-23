import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompassChart from "@/components/compass/CompassChart";
import { Button, Container, Label } from "@/components/ui";
import { ARCHETYPES, ARCHETYPE_ORDER, COMPASS, type ArchetypeId } from "@/content/compass";
import { decodeCalls, parsePosition, type Position } from "@/lib/compass/score";
import { pageMeta } from "@/lib/seo";

/**
 * Where a shared result lands: the sharer's type and their own dot, and an invitation to
 * play the same calls. With ?c= the visitor's result compares the two of them.
 */

const SPOT: Record<ArchetypeId, Position> = {
  "gap-hunter": { x: -0.52, y: 0.5 },
  "steady-hand": { x: 0.52, y: 0.5 },
  watchdog: { x: 0.52, y: -0.5 },
  architect: { x: -0.52, y: -0.5 },
  arbiter: { x: 0.04, y: 0.04 },
};

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function read(params: Params, searchParams: Search) {
  const [{ slug }, q] = await Promise.all([params, searchParams]);
  const a = ARCHETYPES[slug as ArchetypeId];
  if (!a) return null;
  const pos = parsePosition(one(q.x), one(q.y));
  const code = decodeCalls(one(q.c)) ? (one(q.c) as string) : null;
  return { a, pos, code };
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const r = await read(params, searchParams);
  if (!r) return {};
  const { a, pos } = r;
  const card = `/api/compass/card?a=${a.id}${pos ? `&x=${pos.x}&y=${pos.y}` : ""}`;
  return {
    ...pageMeta({
      title: `I'm ${/^[aeiou]/i.test(a.bare) ? "an" : "a"} ${a.bare} | ${COMPASS.name}`,
      description: `${a.me} Where do you stand on AI cover? Take the same twelve calls and see how close you land.`,
      path: `${COMPASS.path}/you/${a.id}`,
      image: { url: card, alt: `${a.name} on the AI Cover Compass` },
    }),
    robots: { index: false, follow: true },
  };
}

export default async function SharedResult({ params, searchParams }: { params: Params; searchParams: Search }) {
  const r = await read(params, searchParams);
  if (!r) notFound();
  const { a, pos, code } = r;
  const play = code ? `${COMPASS.path}?c=${code}` : COMPASS.path;

  return (
    <main>
      <section>
        <Container className="pb-20 pt-10 sm:pb-28 sm:pt-16 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16">
            <div>
              <Label live>{code ? "You've been challenged" : `${COMPASS.short} · A shared result`}</Label>
              <h1 className="wipe font-display t-h1 anim-in mt-8 text-balance text-cream sm:mt-10 [&_.block-mark]:inline-block [&_.block-mark]:leading-[1.06]">
                Someone you know is {/^[aeiou]/i.test(a.bare) ? "an" : "a"} <span className="block-mark">{a.bare}.</span>
              </h1>
              <p className="t-lead mt-8 max-w-[34rem] text-pretty text-cream-muted">{a.line}</p>
              <p className="mt-6 border-l-2 border-signal pl-4 text-[1.0625rem] italic text-cream">&ldquo;{a.says}&rdquo;</p>
              <p className="mt-8 max-w-[34rem] text-pretty text-lg font-medium text-cream">
                {code ? "Take the same twelve calls. At the end you'll see exactly where you agree, and where you don't." : "Where do you stand? Twelve calls, four minutes."}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Button href={play} size="lg">
                  {code ? "Take the challenge" : "Where do you stand?"}
                </Button>
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">12 calls &middot; 4 minutes &middot; Anonymous</p>
              </div>
            </div>
            <figure className="mx-auto w-full max-w-[28rem]">
              <CompassChart you={pos ?? SPOT[a.id]} youLabel="THEM" highlight={a.id} title={`${a.name} on the AI Cover Compass map`} />
              <figcaption className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">{a.where}</figcaption>
            </figure>
          </div>

          <div className="mt-20 border-t border-line-dark pt-8">
            <p className="eyebrow text-cream-muted">The other types</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {ARCHETYPE_ORDER.filter((id) => id !== a.id).map((id) => (
                <li key={id}>
                  <Link
                    href={`${COMPASS.path}/you/${id}`}
                    className="inline-flex h-10 items-center border border-line-strong bg-surface px-4 text-sm text-cream transition-colors hover:border-cream"
                  >
                    {ARCHETYPES[id].name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </main>
  );
}
