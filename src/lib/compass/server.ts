import { createHash } from "node:crypto";
import { ARCHETYPE_ORDER, COMPASS, ITEMS } from "@/content/compass";
import type { CompassStats, Dot } from "@/lib/compass/score";
import { getStore, prefix, toTally } from "@/lib/compass/store";

/** Server-side helpers shared by the Compass API routes. */

export const P = prefix(COMPASS.version);
export const KEYS = {
  players: `${P}players`,
  item: (id: string) => `${P}item:${id}`,
  archetypes: `${P}archetypes`,
  dots: `${P}dots`,
  runs: `${P}runs`,
  flagged: `${P}flagged`,
  player: (pid: string) => `${P}pid:${pid}`,
  rate: (who: string, what: string) => `${P}rate:${what}:${who}`,
  founders: `${P}founders`,
  founderEmails: `${P}founder-emails`,
};

/** How many dots the shared map keeps. */
export const MAX_DOTS = 2000;

export async function readStats(): Promise<CompassStats> {
  const store = getStore();
  const cmds = [
    ["GET", KEYS.players],
    ["SCARD", KEYS.founderEmails],
    ["HGETALL", KEYS.archetypes],
    ["LRANGE", KEYS.dots, 0, MAX_DOTS - 1],
    ...ITEMS.map((it) => ["HGETALL", KEYS.item(it.id)]),
  ];
  const [players, founders, archetypes, dots, ...items] = await store.exec(cmds);
  return {
    live: store.live,
    players: Number(players) || 0,
    founders: Number(founders) || 0,
    // Totals per position, plus the same split by role as "broker:watchdog".
    archetypes: { ...Object.fromEntries(ARCHETYPE_ORDER.map((a) => [a, 0])), ...toTally(archetypes) },
    items: Object.fromEntries(ITEMS.map((it, i) => [it.id, toTally(items[i])])),
    dots: (Array.isArray(dots) ? dots : []).flatMap((d): Dot[] => {
      const [x, y, r] = String(d).split("|");
      const dot = { x: Number(x), y: Number(y), r: r ?? "" };
      return Number.isFinite(dot.x) && Number.isFinite(dot.y) ? [dot] : [];
    }),
  };
}

/** A daily-salted hash of the caller's network address. The raw address is never stored. */
export function callerHash(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${process.env.COMPASS_SALT ?? "vizco-compass"}:${day}:${ip}`)
    .digest("hex")
    .slice(0, 24);
}

/** At most `limit` calls per hour per caller for `what`. */
export async function overLimit(req: Request, what: string, limit: number): Promise<boolean> {
  const key = KEYS.rate(callerHash(req), what);
  const [n] = await getStore().exec([
    ["INCR", key],
    ["EXPIRE", key, 3600],
  ]);
  return Number(n) > limit;
}

export async function readJson(req: Request, maxBytes = 8_000): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init.headers ?? {}) } });

/** Trim a free-text field and cap its length. */
export const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const isPid = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9-]{8,64}$/i.test(v);
