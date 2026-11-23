import { isArchetype, parsePosition } from "@/lib/compass/score";
import { compassImage } from "@/lib/compass/og";

/**
 * A player's own share card: their position name and their dot on the map.
 * /api/compass/card?a=watchdog&x=0.42&y=-0.5. The same inputs always give the same image,
 * so it caches forever.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const a = q.get("a");
  if (!isArchetype(a)) return new Response("Not found", { status: 404 });
  return compassImage(a, parsePosition(q.get("x"), q.get("y")), {
    "Cache-Control": "public, max-age=31536000, immutable",
  });
}
