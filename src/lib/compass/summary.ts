import { AGREE, VERDICTS, type Agree, type Verdict } from "@/content/compass";
import { countsFor, splitLabel, splitScore, withVote, type Tally } from "@/lib/compass/score";

/** Splits are shown from this many answers, and called "early" below EARLY. */
export const SHOW_FROM = 5;
export const EARLY = 30;

const VERDICT_IDS = VERDICTS.map((v) => v.id);
const AGREE_IDS = AGREE.map((a) => a.id);

export type View = {
  /** Share of answers per option, in option order; null while the sample is too small to show. */
  shares: (number | null)[];
  n: number;
  headline: string;
  detail: string;
};

const pct = (c: number, n: number) => Math.round((c / n) * 100);

/** What a case's split says, once the player has called it. Their own call is always counted. */
export function caseView(tally: Tally | undefined, answer: Verdict | undefined, live: boolean): View | null {
  if (answer === undefined) return null;
  const counts = countsFor(withVote(tally, answer), VERDICT_IDS);
  const n = counts.reduce((a, b) => a + b, 0);
  if (!live) return { shares: VERDICT_IDS.map(() => null), n, headline: "Noted.", detail: "The full results go out by email, then here." };
  if (n < SHOW_FROM) return { shares: VERDICT_IDS.map(() => null), n, headline: "You're one of the first to call this.", detail: `The split shows from ${SHOW_FROM} calls.` };
  const mine = pct(counts[VERDICT_IDS.indexOf(answer)], n);
  const score = splitScore(counts);
  const headline = mine >= 50 ? `You're with the ${mine}%.` : mine <= 20 ? `Bold call. Only ${mine}% agree.` : `${mine}% called it your way.`;
  return {
    shares: counts.map((c) => pct(c, n)),
    n,
    headline,
    detail: `${n} calls${n < EARLY ? " (early read)" : ""} · ${splitLabel(score).toLowerCase()}, split ${Math.round(score * 100)}/100`,
  };
}

/** What a statement's split says, once the player has taken a side. */
export function stanceView(tally: Tally | undefined, answer: Agree | undefined, live: boolean): View | null {
  if (answer === undefined) return null;
  const counts = countsFor(withVote(tally, answer), AGREE_IDS);
  const n = counts.reduce((a, b) => a + b, 0);
  if (!live) return { shares: AGREE_IDS.map(() => null), n, headline: "Noted.", detail: "Your dot is moving on the map." };
  if (n < SHOW_FROM) return { shares: AGREE_IDS.map(() => null), n, headline: "You're one of the first to take a side.", detail: `The split shows from ${SHOW_FROM} answers.` };
  const agree = pct(counts[2] + counts[3], n);
  return { shares: counts.map((c) => pct(c, n)), n, headline: `${agree}% agree so far.`, detail: `${n} answers${n < EARLY ? " (early read)" : ""}` };
}
