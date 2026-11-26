"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Cite from "@/components/Cite";
import Reveal from "@/components/Reveal";
import { Container, Label } from "@/components/ui";
import { DEPTH, EXPOSURE_GROUPS, type Exposure } from "@/content/exposures";
import { BOOKING_URL } from "@/content/site";

type Risk = Exposure & { n: number; group: number; groupName: string };

const RISKS: Risk[] = EXPOSURE_GROUPS.flatMap((g, gi) => g.items.map((e) => ({ ...e, group: gi, groupName: g.name }))).map((r, n) => ({ ...r, n }));
const COUNT = RISKS.length;
const GROUP_START = EXPOSURE_GROUPS.reduce<number[]>((acc, g, i) => [...acc, i === 0 ? 0 : acc[i - 1] + EXPOSURE_GROUPS[i - 1].items.length], []);
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

const pad = (n: number) => String(n + 1).padStart(2, "0");

/*
 * Geometry, in the SVG's 0–100 units so the HTML labels can sit at the same percentages.
 * One spoke per risk, clockwise from the top; one ring per depth, outermost first.
 */
const C = 50;
const RINGS = [33, 25, 17, 9.5];
const CORE = 4;
const LABEL_R = 36;
const STEP = 360 / COUNT;
const rad = (deg: number) => (deg * Math.PI) / 180;
const spokeAngle = (k: number) => rad(-90 + (k + 0.5) * STEP);
const edgeAngle = (k: number) => rad(-90 + k * STEP);
const at = (r: number, a: number) => [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
const f = (v: number) => v.toFixed(3);
const ringPoints = (r: number) =>
  RISKS.map((_, k) => at(r, spokeAngle(k)))
    .map(([x, y]) => `${f(x)},${f(y)}`)
    .join(" ");
/** A group's slice of the web, following the outer ring's straight edges. */
const wedge = (g: number) => {
  const start = GROUP_START[g];
  const end = start + EXPOSURE_GROUPS[g].items.length;
  const mid = RINGS[0] * Math.cos(rad(STEP / 2));
  const pts = [[C, C], at(mid, edgeAngle(start)), ...RISKS.slice(start, end).map((_, j) => at(RINGS[0], spokeAngle(start + j))), at(mid, edgeAngle(end))];
  return pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
};

/** The four groups sit in the four corners, clockwise from top right, beside their slice. */
const CORNERS = ["right-0 top-0 items-end text-right", "bottom-0 right-0 items-end text-right", "bottom-0 left-0 items-start text-left", "left-0 top-0 items-start text-left"];

/** A small target: four rings, the given depth picked out. Same order as the map. */
function DepthGlyph({ level }: { level: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0">
      {[11, 8, 5].map((r, i) => (
        <circle key={r} cx="12" cy="12" r={r} fill="none" strokeWidth={i === level ? 1.75 : 1} className={i === level ? "stroke-cream" : "stroke-line-strong"} />
      ))}
      <rect x="10.25" y="10.25" width="3.5" height="3.5" className={level === 3 ? "fill-signal" : "fill-line-strong"} />
    </svg>
  );
}

/**
 * What we cover, as a risk map: twelve spokes for the ways AI goes wrong, grouped into four
 * slices, and four rings for how deep we go on each, from the policy wording to the AI
 * running live. Picking a risk lights its spoke ring by ring, and the panel says why it
 * matters and what we check at every depth, for that risk. Every risk gets every ring;
 * the map shows structure, not scores.
 */
export default function RiskMap() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [hoverGroup, setHoverGroup] = useState<number | null>(null);
  const [ring, setRing] = useState<number | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const map = useRef<HTMLDivElement>(null);
  // The first scan waits until the map is on screen, so it isn't over before anyone sees it
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = map.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const choose = (i: number, focus = false) => {
    const next = (i + COUNT) % COUNT;
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const moves: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: COUNT - 1 };
    if (e.key in moves) {
      e.preventDefault();
      choose(moves[e.key], true);
    }
  };

  const sel = RISKS[active];
  const lit = hoverGroup ?? (hover !== null ? RISKS[hover].group : null);
  const a = spokeAngle(active);

  return (
    <section id="coverage" className="relative py-20 sm:py-28 lg:py-32">
      <Container>
        <Reveal className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16">
          <div>
            <Label>What we cover</Label>
            <h2 className="font-display t-h2 mt-7 text-balance text-cream">
              {WORDS[COUNT] ?? COUNT} risks. {WORDS[DEPTH.length] ?? DEPTH.length} layers deep.
            </h2>
          </div>
          <p className="t-lead max-w-md text-pretty text-cream-muted">
            Pick a risk to see why it matters, and how far we take it: from the wording of your policy to your AI running live.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-14 lg:mt-20 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] xl:gap-16">
          {/* The map: above the panel up to 1280px wide, then beside it and pinned while you read */}
          <div ref={map} className="xl:sticky xl:top-36">
            <Reveal className="relative mx-auto aspect-square w-full max-w-[38rem] sm:w-[80%] xl:w-[86%]">
              <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
                <g className="map-web">
                  {/* The chosen risk's slice, and any slice being pointed at */}
                  {EXPOSURE_GROUPS.map((g, gi) => (
                    <polygon
                      key={g.name}
                      points={wedge(gi)}
                      className={`transition-[fill] duration-500 ${gi === sel.group ? "fill-ink-3" : gi === lit ? "fill-ink-2" : "fill-transparent"}`}
                    />
                  ))}

                  {/* Rings, outermost first */}
                  {RINGS.map((r, i) => (
                    <polygon
                      key={r}
                      points={ringPoints(r)}
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth={ring === i ? 2 : 1}
                      className={`transition-[stroke] duration-300 ${ring === i ? "stroke-cream" : i === 0 ? "stroke-cream" : "stroke-line-strong"}`}
                    />
                  ))}

                  {/* Where one group ends and the next begins */}
                  {GROUP_START.map((start) => {
                    const [x, y] = at(RINGS[0] * Math.cos(rad(STEP / 2)), edgeAngle(start));
                    return (
                      <line
                        key={start}
                        x1={C}
                        y1={C}
                        x2={f(x)}
                        y2={f(y)}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="2 4"
                        className="stroke-line-strong"
                      />
                    );
                  })}

                  {/* Spokes, and the web's knots */}
                  {RISKS.map((r, k) => {
                    const ak = spokeAngle(k);
                    const [x1, y1] = at(CORE + 1.5, ak);
                    const [x2, y2] = at(RINGS[0], ak);
                    return (
                      <g key={r.short}>
                        <line
                          x1={f(x1)}
                          y1={f(y1)}
                          x2={f(x2)}
                          y2={f(y2)}
                          vectorEffect="non-scaling-stroke"
                          className={`transition-[stroke] duration-300 ${k === hover && k !== active ? "stroke-cream-muted" : "stroke-line-dark"}`}
                        />
                        {RINGS.map((rr) => {
                          const [x, y] = at(rr, ak);
                          return <rect key={rr} x={f(x - 0.45)} y={f(y - 0.45)} width="0.9" height="0.9" className="fill-line-strong" />;
                        })}
                      </g>
                    );
                  })}
                </g>

                {/* The chosen spoke, lit ring by ring from the policy in to your AI */}
                {seen ? (
                  <g key={active}>
                    <line
                      className="spoke-in stroke-cream"
                      x1={f(at(CORE + 1.5, a)[0])}
                      y1={f(at(CORE + 1.5, a)[1])}
                      x2={f(at(RINGS[0], a)[0])}
                      y2={f(at(RINGS[0], a)[1])}
                      vectorEffect="non-scaling-stroke"
                      strokeWidth={2}
                    />
                    {RINGS.map((rr, i) => {
                      const [x, y] = at(rr, a);
                      const s = ring === i ? 3.2 : 2.3;
                      return (
                        <g key={rr}>
                          {i === RINGS.length - 1 ? <rect className="map-ping fill-signal" x={f(x - 1.15)} y={f(y - 1.15)} width="2.3" height="2.3" /> : null}
                          <rect
                            className="scan-node fill-signal transition-[width,height,x,y] duration-300"
                            style={{ animationDelay: `${80 + i * 150}ms` }}
                            x={f(x - s / 2)}
                            y={f(y - s / 2)}
                            width={f(s)}
                            height={f(s)}
                          />
                        </g>
                      );
                    })}
                  </g>
                ) : null}

                {/* Your AI, at the core */}
                <rect x={C - CORE} y={C - CORE} width={CORE * 2} height={CORE * 2} className="fill-cream" />
                <text x={C} y={C + 1.15} textAnchor="middle" className="fill-ink font-display" style={{ fontSize: 3.2, letterSpacing: "-0.04em" }}>
                  AI
                </text>
              </svg>

              {/* Depth labels, down the gap between the last group and the first */}
              <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
                {DEPTH.map((d, i) => {
                  const [x, y] = at(RINGS[i] * Math.cos(rad(STEP / 2)), edgeAngle(0));
                  return (
                    <span
                      key={d.key}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 bg-ink px-1.5 font-mono text-[0.5625rem] uppercase leading-4 tracking-[0.14em] transition-colors duration-300 ${
                        ring === i ? "text-cream" : "text-subtle"
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {d.short}
                    </span>
                  );
                })}
              </div>

              {/* The groups, in the corners beside their slices */}
              <div className="pointer-events-none absolute -inset-x-2 -inset-y-2 hidden sm:block lg:-inset-x-6">
                {EXPOSURE_GROUPS.map((g, gi) => {
                  const start = GROUP_START[gi];
                  return (
                    <p
                      key={g.name}
                      onMouseEnter={() => setHoverGroup(gi)}
                      onMouseLeave={() => setHoverGroup(null)}
                      className={`pointer-events-auto absolute flex max-w-[9.5rem] flex-col gap-1 ${CORNERS[gi % CORNERS.length]}`}
                    >
                      <span className="font-mono text-[0.625rem] tracking-[0.12em] text-subtle">
                        {pad(start)}–{pad(start + g.items.length - 1)}
                      </span>
                      <span className={`text-[0.875rem] font-semibold leading-tight tracking-[-0.015em] transition-colors ${gi === sel.group || gi === lit ? "text-cream" : "text-cream-muted"}`}>
                        {g.name}
                      </span>
                    </p>
                  );
                })}
              </div>

              {/* The risks: one tab per spoke, by the end of it */}
              <div role="tablist" aria-label="Ways AI goes wrong" className="pointer-events-none absolute inset-0">
                {RISKS.map((r, k) => {
                  const ak = spokeAngle(k);
                  const [x, y] = at(LABEL_R, ak);
                  const right = Math.cos(ak) >= 0;
                  const on = k === active;
                  return (
                    <button
                      key={r.short}
                      ref={(el) => {
                        tabs.current[k] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`risk-tab-${k}`}
                      aria-selected={on}
                      aria-controls={`risk-panel-${k}`}
                      tabIndex={on ? 0 : -1}
                      onClick={() => choose(k)}
                      onKeyDown={(e) => onKey(e, k)}
                      onMouseEnter={() => setHover(k)}
                      onMouseLeave={() => setHover(null)}
                      className={`pointer-events-auto absolute flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center gap-2 whitespace-nowrap px-2 py-1 text-[0.8125rem] font-medium tracking-[-0.01em] transition-colors duration-300 ${
                        right ? "" : "-translate-x-full flex-row-reverse"
                      } ${on ? "bg-cream text-ink" : k === hover ? "bg-surface text-cream shadow-[var(--shadow-card)]" : "text-cream-muted hover:text-cream"}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <span className={`font-mono text-[0.6875rem] ${on ? "text-ink/60" : "text-subtle"}`}>{pad(k)}</span>
                      <span className="hidden sm:inline">{r.short}</span>
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>

          {/* The chosen risk. Every panel is in the page; the others are hidden in place so the height never jumps. */}
          <div className="mx-auto grid w-full max-w-2xl xl:max-w-none">
            {RISKS.map((r) => {
              const on = r.n === active;
              return (
                <div
                  key={r.short}
                  role="tabpanel"
                  id={`risk-panel-${r.n}`}
                  aria-labelledby={`risk-tab-${r.n}`}
                  inert={!on}
                  className={`col-start-1 row-start-1 ${on ? "" : "invisible"}`}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-cream pb-4">
                    <p className="eyebrow flex min-w-0 items-center gap-3 text-cream-muted">
                      <span className="text-cream">{pad(r.n)}</span>
                      <span className="truncate">{r.groupName}</span>
                    </p>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => choose(active - 1)}
                        aria-label="Previous risk"
                        className="flex h-9 w-9 items-center justify-center border border-line-strong text-cream transition-colors hover:border-cream hover:bg-cream hover:text-ink"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => choose(active + 1)}
                        aria-label="Next risk"
                        className="flex h-9 w-9 items-center justify-center border border-line-strong text-cream transition-colors hover:border-cream hover:bg-cream hover:text-ink"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className={`mt-7 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cream-muted ${on ? "anim-in" : ""}`}>{r.short}</p>
                  <h3 className={`font-display mt-2 text-balance text-[2rem] leading-[1.04] tracking-[-0.038em] text-cream sm:text-[2.5rem] ${on ? "anim-in" : ""}`}>
                    {r.headline}
                  </h3>
                  <p className={`mt-3 text-lg leading-snug tracking-[-0.015em] text-cream-muted ${on ? "anim-in" : ""}`} style={{ animationDelay: "60ms" }}>
                    {r.line}
                  </p>

                  <div
                    className={`mt-7 border border-line-dark bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 ${on ? "anim-in" : ""}`}
                    style={{ animationDelay: "120ms" }}
                  >
                    <p className="eyebrow flex items-center gap-2.5 text-cream-muted">
                      <span aria-hidden className="h-2 w-2 bg-signal" />
                      Why it matters
                    </p>
                    <p className="mt-3 text-[1.0625rem] font-medium leading-snug tracking-[-0.015em] text-cream sm:text-lg">{r.why}</p>
                    {r.record ? (
                      <p className="mt-4 border-t border-line-dark pt-4 text-[0.875rem] leading-relaxed text-cream-muted">
                        <span className="eyebrow mr-2 !text-[0.625rem] text-cream">On record</span>
                        {r.record.text}
                        <Cite s={r.record.s} />
                      </p>
                    ) : null}
                  </div>

                  <p className="eyebrow mt-9 text-cream-muted">How deep we go</p>
                  <ol className="mt-3" onMouseLeave={() => setRing(null)}>
                    {DEPTH.map((d, i) => (
                      <li
                        key={d.key}
                        onMouseEnter={() => setRing(i)}
                        className={`grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 border-t border-line-dark py-4 transition-colors duration-300 last:border-b ${
                          ring === i ? "bg-surface" : ""
                        } ${on ? "anim-in" : ""}`}
                        style={{ animationDelay: `${200 + i * 110}ms` }}
                      >
                        <DepthGlyph level={i} />
                        <div>
                          <p className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-cream">{d.name}</p>
                          <p className="mt-1 text-[0.9375rem] leading-relaxed text-cream-muted">{r.depth[d.key]}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-8 text-[0.9375rem] leading-relaxed text-cream-muted">
                    We check all {COUNT}, at every depth, against your policies and your AI.{" "}
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="link-signal font-medium text-cream">
                      Talk to us
                    </a>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
