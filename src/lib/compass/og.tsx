import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ARCHETYPES, AXES, COMPASS, type ArchetypeId } from "@/content/compass";
import type { Position } from "@/lib/compass/score";

/**
 * The share image: paper, ink and one orange square, like the page. Used on LinkedIn and in messages.
 * Built at deploy time. Fonts are Inter (OFL), subset to the characters used, in ./fonts.
 * Every element sets display: flex explicitly; the image renderer needs it.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0a0a0a";
const PAPER = "#fafaf8";
const MUTED = "#55554f";
const LINE = "#cfcfc9";
const TINT = "#e9e9e5";
const SIGNAL = "#ff5a1f";

const QUAD: Record<Exclude<ArchetypeId, "arbiter">, { left: number; top: number }> = {
  "gap-hunter": { left: 0, top: 0 },
  "steady-hand": { left: 1, top: 0 },
  watchdog: { left: 1, top: 1 },
  architect: { left: 0, top: 1 },
};

const fonts = async () => {
  const dir = join(process.cwd(), "src/lib/compass/fonts");
  const [regular, semibold] = await Promise.all([readFile(join(dir, "Inter-400.ttf")), readFile(join(dir, "Inter-600.ttf"))]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
};

function Map({ highlight, pos }: { highlight?: ArchetypeId; pos?: Position | null }) {
  const S = 400;
  const q = highlight && highlight !== "arbiter" ? QUAD[highlight] : null;
  // The player's own dot when we have it; otherwise the middle of their quadrant.
  const dot = pos
    ? { x: S / 2 + pos.x * S * 0.46, y: S / 2 - pos.y * S * 0.46 }
    : q
      ? { x: q.left ? S * 0.74 : S * 0.26, y: q.top ? S * 0.74 : S * 0.26 }
      : { x: S / 2, y: S / 2 };
  const axis = { fontSize: 15, letterSpacing: 2.4, color: MUTED, display: "flex" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={axis}>{`${AXES.y.pos.toUpperCase()} ↑`}</div>
      <div style={{ display: "flex", position: "relative", width: S, height: S, background: "#ffffff", border: `2px solid ${LINE}` }}>
        {q ? <div style={{ display: "flex", position: "absolute", left: q.left * (S / 2), top: q.top * (S / 2), width: S / 2, height: S / 2, background: TINT }} /> : null}
        <div style={{ display: "flex", position: "absolute", left: S / 2 - 2, top: 0, width: 3, height: S - 4, background: INK }} />
        <div style={{ display: "flex", position: "absolute", top: S / 2 - 2, left: 0, height: 3, width: S - 4, background: INK }} />
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: S / 2 - 48,
            top: S / 2 - 48,
            width: 96,
            height: 96,
            borderRadius: 48,
            border: `2px dashed ${MUTED}`,
            background: highlight === "arbiter" ? TINT : "transparent",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: dot.x - 16,
            top: dot.y - 16,
            width: 32,
            height: 32,
            background: SIGNAL,
            border: "4px solid #ffffff",
          }}
        />
      </div>
      <div style={axis}>{`↓ ${AXES.y.neg.toUpperCase()}`}</div>
    </div>
  );
}

function Block({ text, size }: { text: string; size: number }) {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ display: "flex", fontSize: size, fontWeight: 600, letterSpacing: -size * 0.045, background: INK, color: PAPER, padding: "0 16px 6px", lineHeight: 1.12 }}>
        {text}
      </div>
    </div>
  );
}

export async function compassImage(id?: ArchetypeId, pos?: Position | null, headers?: Record<string, string>) {
  const a = id ? ARCHETYPES[id] : null;
  const article = a && /^[aeiou]/i.test(a.bare) ? "an" : "a";

  const headline = a ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", fontSize: 44, color: MUTED, letterSpacing: -1.4, marginBottom: 10 }}>{`I’m ${article}`}</div>
      <Block text={`${a.bare}.`} size={a.bare.length > 10 ? 80 : 92} />
      <div style={{ display: "flex", marginTop: 30, fontSize: 26, lineHeight: 1.4, color: MUTED, maxWidth: 560 }}>{a.me}</div>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", fontSize: 68, fontWeight: 600, letterSpacing: -3, color: INK, lineHeight: 1.04 }}>Where do you</div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 600, letterSpacing: -3, color: INK, lineHeight: 1.04, marginRight: 18 }}>stand on</div>
        <Block text="AI cover?" size={68} />
      </div>
      <div style={{ display: "flex", marginTop: 30, fontSize: 26, lineHeight: 1.4, color: MUTED, maxWidth: 580 }}>
        Twelve calls on real-world AI losses. See where you land against the market.
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, padding: "56px 64px", fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 40 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 19, letterSpacing: 3.4, color: MUTED }}>
            <div style={{ display: "flex", width: 14, height: 14, background: SIGNAL, marginRight: 14 }} />
            {COMPASS.name.toUpperCase()}
          </div>
          {headline}
          <div style={{ display: "flex", alignItems: "center", fontSize: 22 }}>
            <div style={{ display: "flex", alignItems: "center", fontWeight: 600, fontSize: 30, color: INK, marginRight: 18 }}>
              <div style={{ display: "flex" }}>Viz</div>
              <div style={{ display: "flex", background: INK, color: PAPER, padding: "0 6px 2px", marginLeft: 3 }}>Co</div>
            </div>
            <div style={{ display: "flex", color: MUTED }}>vizco.co/compass</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Map highlight={id} pos={pos} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts(), headers },
  );
}
