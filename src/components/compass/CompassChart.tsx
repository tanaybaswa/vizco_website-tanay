"use client";

import { useEffect, useState } from "react";
import { ARCHETYPES, AXES, type ArchetypeId } from "@/content/compass";
import { CENTRE_RADIUS, type Dot, type Position } from "@/lib/compass/score";

/**
 * The map: today's wording left to right (doesn't pay to pays), where cover should go
 * bottom to top (carve AI out to fold AI in). Paper, ink and one orange square: you.
 */

const C = 240; // centre
const H = 200; // half the plot
const K = 184; // a score of 1 lands just inside the frame
const px = (x: number) => C + Math.max(-1, Math.min(1, x)) * K;
const py = (y: number) => C - Math.max(-1, Math.min(1, y)) * K;

const QUADRANTS: { id: ArchetypeId; x: number; y: number; lx: number; ly: number; anchor: "start" | "end" }[] = [
  { id: "gap-hunter", x: C - H, y: C - H, lx: C - H + 12, ly: C - H + 22, anchor: "start" },
  { id: "steady-hand", x: C, y: C - H, lx: C + H - 12, ly: C - H + 22, anchor: "end" },
  { id: "watchdog", x: C, y: C, lx: C + H - 12, ly: C + H - 14, anchor: "end" },
  { id: "architect", x: C - H, y: C, lx: C - H + 12, ly: C + H - 14, anchor: "start" },
];

/** Where the landing page's "you?" marker wanders, one stop per position. */
const TOUR: Position[] = [
  { x: -0.55, y: 0.5 },
  { x: 0.5, y: 0.6 },
  { x: 0.1, y: -0.08 },
  { x: 0.6, y: -0.5 },
  { x: -0.5, y: -0.55 },
];

/** A small, stable offset so stacked dots stay visible. */
const jitter = (i: number) => (((i * 7919) % 9) - 4) * 0.9;

const halo = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 5, strokeLinejoin: "round" } as const;

export default function CompassChart({
  you,
  youLabel = "YOU",
  other = null,
  dots = [],
  centroids = [],
  highlight = null,
  ghost = false,
  animate = false,
  title = "The AI Cover Compass map",
  className = "",
  fit = false,
}: {
  /** Fill the parent box (both dimensions) instead of sizing by width. */
  fit?: boolean;
  you?: Position | null;
  /** The orange marker's tag. On a shared page it's the sharer, not the visitor. */
  youLabel?: string;
  /** A second player to compare with, e.g. the colleague who sent a challenge. */
  other?: (Position & { label: string }) | null;
  dots?: Dot[];
  centroids?: { label: string; x: number; y: number }[];
  highlight?: ArchetypeId | null;
  ghost?: boolean;
  animate?: boolean;
  title?: string;
  className?: string;
}) {
  const [stop, setStop] = useState(0);
  const [still, setStill] = useState(true);

  useEffect(() => {
    if (!ghost) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStill(false);
    const id = window.setInterval(() => setStop((s) => (s + 1) % TOUR.length), 2400);
    return () => window.clearInterval(id);
  }, [ghost]);

  const ghostAt = TOUR[still ? 0 : stop];
  const lit = (id: ArchetypeId) => highlight === id;

  return (
    <svg
      viewBox="0 0 480 480"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
      className={`block w-full ${fit ? "h-full" : "h-auto"} ${animate ? "cmp-animate" : ""} ${className}`}
    >
      <title>{title}</title>
      {/* Frame and quadrants */}
      <rect x={C - H} y={C - H} width={H * 2} height={H * 2} fill="var(--surface)" />
      {QUADRANTS.map((q) => (
        <rect
          key={q.id}
          x={q.x}
          y={q.y}
          width={H}
          height={H}
          fill={lit(q.id) ? "var(--ink-3)" : "transparent"}
          className="transition-[fill] duration-700"
        />
      ))}

      {/* Drafting grid */}
      <g stroke="var(--line-dark)" strokeWidth={1}>
        {Array.from({ length: 9 }, (_, i) => {
          const v = C - H + (i + 1) * 40;
          return (
            <g key={i}>
              <line x1={v} y1={C - H} x2={v} y2={C + H} />
              <line x1={C - H} y1={v} x2={C + H} y2={v} />
            </g>
          );
        })}
      </g>
      <rect x={C - H} y={C - H} width={H * 2} height={H * 2} fill="none" stroke="var(--line-strong)" strokeWidth={1} />

      {/* The centre: the Arbiter */}
      <circle
        cx={C}
        cy={C}
        r={CENTRE_RADIUS * K}
        fill={lit("arbiter") ? "var(--ink-3)" : "var(--surface)"}
        stroke="var(--cream-muted)"
        strokeWidth={1}
        strokeDasharray="3 4"
        className="transition-[fill] duration-700"
      />

      {/* Axes */}
      <g stroke="var(--cream)" strokeWidth={1.5} className="cmp-axes">
        <line x1={C - H} y1={C} x2={C + H} y2={C} pathLength={1} />
        <line x1={C} y1={C - H} x2={C} y2={C + H} pathLength={1} />
      </g>

      {/* Crowd */}
      <g className="cmp-crowd">
        {dots.map((d, i) => (
          <rect
            key={i}
            x={px(d.x) + jitter(i) - 2.5}
            y={py(d.y) + jitter(i + 3) - 2.5}
            width={5}
            height={5}
            fill="var(--cream)"
            opacity={0.22}
            style={animate ? { animationDelay: `${400 + Math.min(i, 120) * 6}ms` } : undefined}
          />
        ))}
      </g>

      {/* Labels */}
      <g className="font-mono" fontSize={10.5} letterSpacing="0.12em">
        {QUADRANTS.map((q) => (
          <text
            key={q.id}
            x={q.lx}
            y={q.ly}
            textAnchor={q.anchor}
            fill={lit(q.id) ? "var(--cream)" : "var(--subtle)"}
            fontWeight={lit(q.id) ? 700 : 400}
            style={halo}
          >
            {ARCHETYPES[q.id].bare.toUpperCase()}
          </text>
        ))}
        <text
          x={C}
          y={C - CENTRE_RADIUS * K - 9}
          textAnchor="middle"
          fill={lit("arbiter") ? "var(--cream)" : "var(--subtle)"}
          fontWeight={lit("arbiter") ? 700 : 400}
          style={halo}
        >
          ARBITER
        </text>
        <g fill="var(--cream-muted)" fontSize={11}>
          <text x={C} y={C - H - 14} textAnchor="middle">
            {AXES.y.pos.toUpperCase()} &#8593;
          </text>
          <text x={C} y={C + H + 25} textAnchor="middle">
            &#8595; {AXES.y.neg.toUpperCase()}
          </text>
          <text x={C - H - 14} y={C} textAnchor="middle" transform={`rotate(-90 ${C - H - 14} ${C})`}>
            &#8592; {AXES.x.neg.toUpperCase()}
          </text>
          <text x={C + H + 14} y={C} textAnchor="middle" transform={`rotate(90 ${C + H + 14} ${C})`}>
            {AXES.x.pos.toUpperCase()} &#8594;
          </text>
        </g>
      </g>

      {/* Where each role sits on average */}
      {centroids.map((c) => (
        <g key={c.label} className="cmp-centroid">
          <rect x={px(c.x) - 4} y={py(c.y) - 4} width={8} height={8} fill="var(--cream)" />
          <text x={px(c.x) + 8} y={py(c.y) + 3.5} className="font-mono" fontSize={9.5} letterSpacing="0.08em" fill="var(--cream)" style={halo}>
            {c.label}
          </text>
        </g>
      ))}

      {/* The colleague, then you on top */}
      {other ? <Marker at={other} label={other.label} className="cmp-other" ink /> : null}
      {you ? <Marker at={you} label={youLabel} className="cmp-you" /> : null}
      {ghost && !you ? <Marker at={ghostAt} label="YOU?" className="cmp-ghost" /> : null}
    </svg>
  );
}

function Marker({ at, label, className, ink = false }: { at: Position; label: string; className: string; ink?: boolean }) {
  const w = label.length * 7.4 + 12;
  const fill = ink ? "var(--cream)" : "var(--signal)";
  return (
    <g className={`cmp-move ${className}`} style={{ transform: `translate(${px(at.x)}px, ${py(at.y)}px)` }}>
      <g className="cmp-land">
        {ink ? null : <rect className="cmp-ping" x={-7} y={-7} width={14} height={14} fill={fill} />}
        <rect x={-7} y={-7} width={14} height={14} fill={fill} stroke="var(--surface)" strokeWidth={2} />
        <g transform={`translate(${at.x > 0.45 ? -w - 12 : 12} -9)`}>
          <rect width={w} height={18} fill={ink ? "var(--surface)" : "var(--cream)"} stroke={ink ? "var(--cream)" : "none"} />
          <text x={6} y={12.5} className="font-mono" fontSize={10} letterSpacing="0.1em" fill={ink ? "var(--cream)" : "var(--ink)"}>
            {label}
          </text>
        </g>
      </g>
    </g>
  );
}
