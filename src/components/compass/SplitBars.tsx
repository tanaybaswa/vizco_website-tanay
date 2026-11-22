/** How a vote split: one bar per option, the player's own option marked. Grey while the sample is small. */
export default function SplitBars({
  rows,
  mine,
  early,
}: {
  rows: { key: string; label: string; count: number }[];
  mine?: string;
  early: boolean;
}) {
  const n = rows.reduce((t, r) => t + r.count, 0) || 1;
  const top = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="mt-5 space-y-3">
      {rows.map((r, i) => {
        const pct = Math.round((r.count / n) * 100);
        const isMine = r.key === mine;
        const lead = r.count === top && top > 0;
        return (
          <li key={r.key} className="grid grid-cols-[5.75rem_minmax(0,1fr)_3rem] items-center gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_3.5rem] sm:gap-4">
            <span className={`flex items-center gap-2 text-[0.9375rem] sm:text-base ${lead ? "font-semibold text-cream" : "text-cream-muted"}`}>
              {r.label}
            </span>
            <span className="relative block h-7 bg-ink-2 sm:h-8">
              <span
                className={`cmp-bar absolute inset-y-0 left-0 ${early ? "bg-subtle" : lead ? "bg-cream" : "bg-cream-muted"}`}
                style={{ width: `${Math.max(pct, r.count ? 1.5 : 0)}%`, animationDelay: `${120 + i * 90}ms` }}
              />
              {isMine ? (
                <span className="absolute inset-y-0 right-2 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-cream">
                  <span aria-hidden className="h-2 w-2 bg-signal" />
                  You
                </span>
              ) : null}
            </span>
            <span className="text-right font-mono text-[0.9375rem] tabular-nums text-cream">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}
