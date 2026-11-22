import { ARCHETYPES, ARCHETYPE_ORDER, type ArchetypeId } from "@/content/compass";
import { compassImage, OG_SIZE } from "@/lib/compass/og";

export const alt = "A position on the AI Cover Compass";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return ARCHETYPE_ORDER.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return compassImage(slug in ARCHETYPES ? (slug as ArchetypeId) : undefined);
}
