import { timingSafeEqual } from "node:crypto";
import { getStore } from "@/lib/compass/store";
import { KEYS, json, readStats } from "@/lib/compass/server";

export const dynamic = "force-dynamic";

/**
 * Staff export of every run, flagged run and Founding sign-up, for the report.
 * Send `Authorization: Bearer <COMPASS_ADMIN_KEY>`. Without that variable set, this route doesn't exist.
 */
export async function GET(req: Request) {
  const key = process.env.COMPASS_ADMIN_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const want = Buffer.from(key);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return new Response("Unauthorized", { status: 401 });

  const parse = (rows: unknown) => (Array.isArray(rows) ? rows : []).map((r) => JSON.parse(String(r)));
  const [runs, flagged, founders] = await getStore().exec([
    ["LRANGE", KEYS.runs, 0, -1],
    ["LRANGE", KEYS.flagged, 0, -1],
    ["LRANGE", KEYS.founders, 0, -1],
  ]);
  return json({ exportedAt: new Date().toISOString(), stats: await readStats(), runs: parse(runs), flagged: parse(flagged), founders: parse(founders) });
}
