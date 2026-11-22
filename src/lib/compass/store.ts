/**
 * Where Compass votes are kept. Server only.
 *
 * Production: a Redis database over Upstash's REST API. Add "Upstash for Redis" from the
 * Vercel Marketplace (free tier) and it sets the two variables read below. No package needed.
 * Without them: an in-memory store, fine for local play but lost on restart. In production
 * it reports `live: false`, so the page hides live numbers rather than show partial ones.
 * Set COMPASS_MEMORY_STORE=1 to treat the memory store as live (local testing only).
 */

export type Cmd = (string | number)[];

export type Store = {
  live: boolean;
  exec(cmds: Cmd[]): Promise<unknown[]>;
};

/** Every key starts with this, so a new content version starts a clean count. */
export const prefix = (version: string) => `compass:${version}:`;

function upstash(url: string, token: string): Store {
  return {
    live: true,
    async exec(cmds) {
      const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cmds),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Compass store responded ${res.status}`);
      const out = (await res.json()) as { result?: unknown; error?: string }[];
      return out.map((r) => {
        if (r.error) throw new Error(r.error);
        return r.result ?? null;
      });
    },
  };
}

type Value = string | Map<string, string> | string[] | Set<string>;

/** Just enough Redis for the Compass: strings, hashes, lists and sets. */
function memory(live: boolean): Store {
  const g = globalThis as unknown as { __compassMemory?: Map<string, Value> };
  const db = (g.__compassMemory ??= new Map<string, Value>());
  const hash = (k: string) => {
    let v = db.get(k);
    if (!(v instanceof Map)) db.set(k, (v = new Map()));
    return v;
  };
  const list = (k: string) => {
    let v = db.get(k);
    if (!Array.isArray(v)) db.set(k, (v = []));
    return v;
  };
  const set = (k: string) => {
    let v = db.get(k);
    if (!(v instanceof Set)) db.set(k, (v = new Set()));
    return v;
  };
  const run = ([op, ...a]: Cmd): unknown => {
    const k = String(a[0]);
    switch (String(op).toUpperCase()) {
      case "GET": {
        const v = db.get(k);
        return typeof v === "string" ? v : null;
      }
      case "SET": {
        const nx = a.slice(2).some((x) => String(x).toUpperCase() === "NX");
        if (nx && db.has(k)) return null;
        db.set(k, String(a[1]));
        return "OK";
      }
      case "INCR": {
        const n = Number(db.get(k) ?? 0) + 1;
        db.set(k, String(n));
        return n;
      }
      case "EXPIRE":
        return 1;
      case "HINCRBY": {
        const h = hash(k);
        const n = Number(h.get(String(a[1])) ?? 0) + Number(a[2]);
        h.set(String(a[1]), String(n));
        return n;
      }
      case "HGETALL":
        return [...hash(k).entries()].flat();
      case "LPUSH": {
        const l = list(k);
        l.unshift(...a.slice(1).map(String).reverse());
        return l.length;
      }
      case "LRANGE": {
        const l = list(k);
        const end = Number(a[2]);
        return l.slice(Number(a[1]), end < 0 ? l.length + end + 1 : end + 1);
      }
      case "LTRIM": {
        const l = list(k);
        db.set(k, l.slice(Number(a[1]), Number(a[2]) + 1));
        return "OK";
      }
      case "SADD": {
        const s = set(k);
        const had = s.has(String(a[1]));
        s.add(String(a[1]));
        return had ? 0 : 1;
      }
      case "SCARD":
        return set(k).size;
      default:
        throw new Error(`Memory store does not support ${op}`);
    }
  };
  return { live, exec: async (cmds) => cmds.map(run) };
}

let store: Store | undefined;

export function getStore(): Store {
  if (store) return store;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return (store = upstash(url, token));
  const live = process.env.NODE_ENV !== "production" || process.env.COMPASS_MEMORY_STORE === "1";
  if (!live) console.warn("Compass: no Redis configured; votes are not being stored.");
  return (store = memory(live));
}

/** Redis returns a hash as [field, value, field, value, ...]. */
export function toTally(flat: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(flat)) return out;
  for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = Number(flat[i + 1]) || 0;
  return out;
}
