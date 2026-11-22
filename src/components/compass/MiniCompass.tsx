import type { ArchetypeId } from "@/content/compass";

/** A small mark of the map with one quadrant (or the centre) filled. */
export default function MiniCompass({ id, className = "h-10 w-10" }: { id: ArchetypeId; className?: string }) {
  const cell = { "gap-hunter": [0, 0], "steady-hand": [1, 0], watchdog: [1, 1], architect: [0, 1] }[id as Exclude<ArchetypeId, "arbiter">];
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <rect x={0.5} y={0.5} width={39} height={39} fill="var(--surface)" stroke="var(--line-strong)" />
      {cell ? <rect x={cell[0] * 20} y={cell[1] * 20} width={20} height={20} fill="var(--cream)" /> : null}
      <line x1={20} y1={0} x2={20} y2={40} stroke="var(--cream)" strokeWidth={1.5} />
      <line x1={0} y1={20} x2={40} y2={20} stroke="var(--cream)" strokeWidth={1.5} />
      <circle cx={20} cy={20} r={6} fill={id === "arbiter" ? "var(--signal)" : "var(--surface)"} stroke="var(--cream)" strokeWidth={1.5} />
    </svg>
  );
}
