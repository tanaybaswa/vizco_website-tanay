import { COMPASS } from "@/content/compass";
import { isArchetype, isRole } from "@/lib/compass/score";
import { getStore } from "@/lib/compass/store";
import { KEYS, isPid, json, overLimit, readJson, text } from "@/lib/compass/server";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The last step of the game: a work email to send the results to (and to verify the player
 * works in insurance), with an optional name for the credits, job title and one-line take.
 * Kept in its own list; answers are never published with a name.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return json({ error: "Bad request" }, { status: 400 });

  // A hidden field people never see. Bots fill it in.
  if (text(body.website, 200)) return json({ ok: true });

  const email = text(body.email, 200).toLowerCase();
  if (!EMAIL.test(email)) return json({ error: "Please enter a valid work email." }, { status: 400 });

  const store = getStore();
  if (!store.live) return json({ error: "Sign-ups open soon. Email info@vizco.co and we'll add you." }, { status: 503 });
  try {
    if (await overLimit(req, "join", 6)) return json({ error: "Too many tries. Try again later." }, { status: 429 });

    const record = JSON.stringify({
      at: new Date().toISOString(),
      pid: isPid(body.pid) ? body.pid : null,
      email,
      domain: email.split("@")[1],
      name: text(body.name, 120),
      title: text(body.title, 120),
      take: text(body.take, 280),
      credit: body.credit === true,
      role: isRole(body.role) ? body.role : null,
      archetype: isArchetype(body.archetype) ? body.archetype : null,
      player: typeof body.player === "number" ? body.player : null,
    });
    const [added, , count] = await store.exec([
      ["SADD", KEYS.founderEmails, email],
      ["LPUSH", KEYS.founders, record],
      ["SCARD", KEYS.founderEmails],
    ]);
    const n = Number(count);
    return json({ ok: true, again: Number(added) === 0, member: n, founding: n <= COMPASS.founding });
  } catch (err) {
    console.error("Compass join failed", err);
    return json({ error: "Could not save that. Please try again." }, { status: 503 });
  }
}
