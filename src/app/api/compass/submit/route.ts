import { CASES, ITEMS, STANCES } from "@/content/compass";
import { archetypeOf, cleanAnswers, isComplete, isRegion, isRole, positionOf } from "@/lib/compass/score";
import { getStore, type Cmd } from "@/lib/compass/store";
import { KEYS, MAX_DOTS, isPid, json, overLimit, readJson } from "@/lib/compass/server";

export const dynamic = "force-dynamic";

/** Faster than this for twelve calls is not a real read, so the run is kept but not counted. */
const MIN_MS = 25_000;

/**
 * One finished run. The server recomputes the position and archetype from the answers,
 * counts each player once, and keeps the raw run for the report.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return json({ error: "Bad request" }, { status: 400 });

  const { pid, role, region, ms } = body;
  const answers = cleanAnswers(body.answers);
  if (!isPid(pid) || !isRole(role) || !isComplete(answers)) return json({ error: "Incomplete run" }, { status: 400 });

  const store = getStore();
  try {
    if (await overLimit(req, "submit", 12)) return json({ error: "Too many runs. Try again later." }, { status: 429 });

    const pos = positionOf(answers);
    const archetype = archetypeOf(pos);
    // No database connected: the player still gets their result, but nothing is counted or numbered.
    if (!store.live) return json({ counted: false, archetype, ...pos });
    const duration = typeof ms === "number" && Number.isFinite(ms) ? Math.round(ms) : null;
    const flag = duration !== null && duration < MIN_MS ? "too-fast" : null;

    // Count each player once. A replay still gets its result, but doesn't move the numbers.
    const [first] = await store.exec([["SET", KEYS.player(pid), "1", "NX", "EX", 60 * 60 * 24 * 365]]);
    if (first === null) return json({ counted: false, reason: "replay", archetype, ...pos });

    const run = JSON.stringify({
      pid,
      at: new Date().toISOString(),
      role,
      region: isRegion(region) ? region : null,
      answers,
      x: pos.x,
      y: pos.y,
      archetype,
      ms: duration,
      flag,
    });

    if (flag) {
      await store.exec([["LPUSH", KEYS.flagged, run]]);
      return json({ counted: false, reason: "flagged", archetype, ...pos });
    }

    const cmds: Cmd[] = [["INCR", KEYS.players]];
    for (const it of ITEMS) {
      const a = answers[it.id];
      if (a === undefined) continue;
      cmds.push(["HINCRBY", KEYS.item(it.id), `${a}`, 1], ["HINCRBY", KEYS.item(it.id), `${role}:${a}`, 1]);
    }
    cmds.push(
      ["HINCRBY", KEYS.archetypes, archetype, 1],
      ["HINCRBY", KEYS.archetypes, `${role}:${archetype}`, 1],
      ["LPUSH", KEYS.dots, `${pos.x}|${pos.y}|${role}`],
      ["LTRIM", KEYS.dots, 0, MAX_DOTS - 1],
      ["LPUSH", KEYS.runs, run],
    );
    const [player] = await store.exec(cmds);
    return json({ counted: true, player: Number(player), archetype, ...pos, scored: CASES.length + STANCES.length });
  } catch (err) {
    console.error("Compass submit failed", err);
    return json({ error: "Could not save your run" }, { status: 503 });
  }
}
