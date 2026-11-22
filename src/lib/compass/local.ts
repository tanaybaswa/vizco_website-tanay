import { COMPASS, type ArchetypeId, type RegionId, type RoleId } from "@/content/compass";
import type { Answers } from "@/lib/compass/score";

/** What the browser remembers between visits. Storage can be blocked, so every access is guarded. */
export type Saved = {
  pid: string;
  role?: RoleId | null;
  region?: RegionId | null;
  result?: {
    answers: Answers;
    x: number;
    y: number;
    archetype: ArchetypeId;
    player?: number | null;
    counted?: boolean;
    reason?: "replay" | "flagged" | null;
    at: string;
  } | null;
  joined?: boolean;
};

const KEY = `vizco-compass-${COMPASS.version}`;

const newPid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export function loadSaved(): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Saved;
      if (s && typeof s.pid === "string") return s;
    }
  } catch {
    /* storage blocked or corrupt: start fresh */
  }
  return { pid: newPid() };
}

export function save(s: Saved) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: the game still works, it just won't remember */
  }
}
