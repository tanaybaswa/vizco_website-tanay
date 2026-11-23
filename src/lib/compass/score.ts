import {
  ARCHETYPES,
  BONUS,
  CASES,
  ROLES,
  REGIONS,
  STANCES,
  type Agree,
  type ArchetypeId,
  type RegionId,
  type RoleId,
  type Verdict,
} from "@/content/compass";

/** One player's answers, keyed by item id. Cases hold a verdict, positions hold 0 to 3. */
export type Answers = Record<string, Verdict | Agree>;

export type Position = { x: number; y: number };

/** A dot on the shared map: position and role. */
export type Dot = Position & { r: string };

/** Vote counts for one item: "yes", "no", ... and the same split by role as "broker:yes". */
export type Tally = Record<string, number>;

export type CompassStats = {
  /** False when results aren't being stored, so the page hides live numbers. */
  live: boolean;
  players: number;
  /** People who joined the Founding panel. */
  founders: number;
  items: Record<string, Tally>;
  archetypes: Record<string, number>;
  dots: Dot[];
};

const VERDICT_SCORE: Record<Verdict, number> = { yes: 1, arguable: 0, no: -1 };
const AGREE_SCORE = [-1, -1 / 3, 1 / 3, 1];

/** Inside this distance from the centre, a player is the Arbiter. */
export const CENTRE_RADIUS = 0.25;

const round = (n: number) => Math.round(n * 1000) / 1000;

/** x: do today's policies pay (-1 no, +1 yes). y: should cover fold AI in (+1) or carve it out (-1). */
export function positionOf(answers: Answers): Position {
  const xs = CASES.map((c) => answers[c.id]).filter((v): v is Verdict => typeof v === "string" && v in VERDICT_SCORE);
  const ys = STANCES.flatMap((s) => {
    const a = answers[s.id];
    return typeof a === "number" && a >= 0 && a <= 3 ? [AGREE_SCORE[a] * s.pole] : [];
  });
  const mean = (a: number[]) => (a.length ? a.reduce((t, n) => t + n, 0) / a.length : 0);
  return { x: round(mean(xs.map((v) => VERDICT_SCORE[v]))), y: round(mean(ys)) };
}

export function archetypeOf({ x, y }: Position): ArchetypeId {
  if (Math.hypot(x, y) < CENTRE_RADIUS) return "arbiter";
  // An all-"Arguable" reading means cover isn't reliable, so x = 0 sits on the "doesn't pay" side.
  if (x > 0) return y >= 0 ? "steady-hand" : "watchdog";
  return y >= 0 ? "gap-hunter" : "architect";
}

/** True when every scored item has a valid answer. */
export function isComplete(answers: Answers): boolean {
  return CASES.every((c) => isVerdict(answers[c.id])) && STANCES.every((s) => isAgree(answers[s.id]));
}

export const isVerdict = (v: unknown): v is Verdict => v === "yes" || v === "arguable" || v === "no";
export const isAgree = (v: unknown): v is Agree => v === 0 || v === 1 || v === 2 || v === 3;
export const isRole = (v: unknown): v is RoleId => ROLES.some((r) => r.id === v);
export const isRegion = (v: unknown): v is RegionId => REGIONS.some((r) => r.id === v);
export const isArchetype = (v: unknown): v is ArchetypeId => typeof v === "string" && v in ARCHETYPES;

/** Keep only known items with valid answers, so nothing else reaches storage. */
export function cleanAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const c of CASES) if (isVerdict(src[c.id])) out[c.id] = src[c.id] as Verdict;
  for (const s of [...STANCES, BONUS]) if (isAgree(src[s.id])) out[s.id] = src[s.id] as Agree;
  return out;
}

/**
 * How split a vote is: normalised entropy of the counts. 0 when everyone agrees,
 * 1 when votes spread evenly across every option.
 */
export function splitScore(counts: number[]): number {
  const n = counts.reduce((t, c) => t + c, 0);
  if (n === 0 || counts.length < 2) return 0;
  const h = counts.reduce((t, c) => (c > 0 ? t - (c / n) * Math.log(c / n) : t), 0);
  return h / Math.log(counts.length);
}

export function splitLabel(score: number): string {
  if (score >= 0.85) return "Contested";
  if (score >= 0.6) return "Leaning";
  return "Clear call";
}

/** Counts for the given options from a tally, optionally for one role. */
export function countsFor(tally: Tally | undefined, options: readonly (string | number)[], role?: string): number[] {
  return options.map((o) => tally?.[role ? `${role}:${o}` : `${o}`] ?? 0);
}

/** A tally with one more vote added, so a player always sees their own call counted. */
export function withVote(tally: Tally | undefined, option: string | number, role?: string | null): Tally {
  const t: Tally = { ...(tally ?? {}) };
  t[`${option}`] = (t[`${option}`] ?? 0) + 1;
  if (role) t[`${role}:${option}`] = (t[`${role}:${option}`] ?? 0) + 1;
  return t;
}

/** Share of `values` strictly below `v`, plus half of ties: a fair percentile for small samples. */
export function percentile(values: number[], v: number): number {
  if (!values.length) return 0;
  let below = 0;
  let equal = 0;
  for (const n of values) {
    if (n < v) below++;
    else if (n === v) equal++;
  }
  return (below + equal / 2) / values.length;
}

/* ---------- Challenge links ---------- */

const V2C: Record<Verdict, string> = { yes: "y", arguable: "a", no: "n" };
const C2V: Record<string, Verdict> = { y: "yes", a: "arguable", n: "no" };
const CODE = new RegExp(`^[yan]{${CASES.length}}[0-3]{${STANCES.length}}$`);

/**
 * A player's scored calls as a short code: one letter per case (y, a, n), then one digit per
 * statement (0 to 3). Carried in share links so a colleague can compare. No name, no email.
 */
export function encodeCalls(a: Answers): string | null {
  if (!isComplete(a)) return null;
  return CASES.map((c) => V2C[a[c.id] as Verdict]).join("") + STANCES.map((s) => String(a[s.id])).join("");
}

export function decodeCalls(code: unknown): Answers | null {
  if (typeof code !== "string" || !CODE.test(code)) return null;
  const out: Answers = {};
  CASES.forEach((c, i) => (out[c.id] = C2V[code[i]]));
  STANCES.forEach((s, i) => (out[s.id] = Number(code[CASES.length + i]) as Agree));
  return out;
}

/** How many scored calls two players share: the same verdict on a case, the same side on a statement. */
export function agreement(a: Answers, b: Answers) {
  const cases = CASES.filter((c) => a[c.id] === b[c.id]).length;
  const side = (v: unknown) => (typeof v === "number" ? v >= 2 : null);
  const stances = STANCES.filter((s) => side(a[s.id]) !== null && side(a[s.id]) === side(b[s.id])).length;
  return { cases, stances, total: cases + stances, of: CASES.length + STANCES.length };
}

/** Clamp and round a position read from a URL. */
export function parsePosition(x: unknown, y: unknown): Position | null {
  const nx = Number(x);
  const ny = Number(y);
  if (x == null || y == null || !Number.isFinite(nx) || !Number.isFinite(ny)) return null;
  const c = (n: number) => Math.round(Math.max(-1, Math.min(1, n)) * 100) / 100;
  return { x: c(nx), y: c(ny) };
}
