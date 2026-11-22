import { readStats } from "@/lib/compass/server";

export const dynamic = "force-dynamic";

/** Live results for the Compass: counts per item, archetype shares and the map's dots. */
export async function GET() {
  try {
    const stats = await readStats();
    return Response.json(stats, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("Compass stats failed", err);
    return Response.json({ live: false, players: 0, founders: 0, items: {}, archetypes: {}, dots: [] }, { status: 503 });
  }
}
