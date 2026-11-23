import type { SourceKey } from "@/content/sources";

/**
 * The AI Cover Compass: a live poll for insurance professionals.
 *
 * Two questions place every player on the map:
 *   x: Do today's policies pay for AI losses? (six cases: Yes / Arguable / No)
 *   y: Should they? (six statements: Strongly disagree to Strongly agree)
 *
 * It's a survey, so there are no right answers and no house view on any case.
 * Content rules are the site's: no insurer names, no policy-type names, no figures.
 * Editing a scored item changes what its votes mean, so bump VERSION when you do;
 * votes are stored under the version they were cast on.
 */
export const COMPASS = {
  name: "The AI Cover Compass",
  short: "AI Cover Compass",
  path: "/compass",
  version: "v2",
  /** The first players who leave their email get credited in the first report. */
  founding: 200,
} as const;

export type Verdict = "yes" | "arguable" | "no";
/** 0 strongly disagree, 1 disagree, 2 agree, 3 strongly agree. No neutral: take a side. */
export type Agree = 0 | 1 | 2 | 3;

/**
 * A case is a story you could tell in one breath, one line of wording, and the question
 * everyone argues about. Anything longer loses people on a phone.
 */
export type CaseItem = {
  kind: "case";
  id: string;
  title: string;
  story: string;
  /** One line of policy wording, plain enough to read at a glance. The phrase that matters is [[marked]]. */
  clause: string;
  /** The question the case turns on. */
  crux: string;
  /** Where the facts come from. */
  basis: { label: string; source?: SourceKey };
};

export type StanceItem = {
  kind: "stance";
  id: string;
  topic: string;
  statement: string;
  /** +1 when agreeing means "fold AI into standard cover", -1 when it means "carve AI out". */
  pole: 1 | -1;
};

export type BonusItem = {
  kind: "bonus";
  id: string;
  topic: string;
  statement: string;
};

export type Item = CaseItem | StanceItem | BonusItem;

export const CASES: CaseItem[] = [
  {
    kind: "case",
    id: "chatbot-promise",
    title: "The chatbot's promise",
    story: "An airline's chatbot promised a grieving customer a discount the airline didn't offer. A tribunal made the airline honour it.",
    clause: "We cover mistakes made by you, or by [[anyone you're responsible for]].",
    crux: "Is a chatbot “anyone”?",
    basis: { label: "Real case: Moffatt v. Air Canada, 2024", source: "moffatt" },
  },
  {
    kind: "case",
    id: "wet-floor-sign",
    title: "The wet-floor sign",
    story: "A shopper slips on a wet floor and breaks a wrist. The warning sign was made with an AI image tool.",
    clause: "We don't cover injury [[arising out of generative AI]].",
    crux: "AI made the sign. Did the sign cause the fall?",
    basis: { label: "Raised on an industry panel, November 2026. Wording based on the standard AI exclusion", source: "moneyGeek" },
  },
  {
    kind: "case",
    id: "deepfake-call",
    title: "The CFO who wasn't there",
    story: "A finance worker joins a video call with the CFO and sends the money they ask for. Everyone else on the call was a deepfake.",
    clause: "We cover money lost to [[a person impersonating]] your staff.",
    crux: "Is a deepfake “a person”?",
    basis: { label: "Real case: Hong Kong, 2024", source: "arup" },
  },
  {
    kind: "case",
    id: "hiring-screen",
    title: "The hiring bot",
    story: "Job seekers sue a software company, saying its AI screening tool rejected them for their age. They never applied to the company itself.",
    clause: "We don't cover [[any claim of discrimination]].",
    crux: "Written for the company's own hiring. Does it reach a tool it sells?",
    basis: { label: "Real case: Mobley v. Workday, 2025", source: "mobley" },
  },
  {
    kind: "case",
    id: "unchecked-report",
    title: "The made-up studies",
    story: "A consultant writes a client report with AI and skips the fact-check. It cites studies that don't exist. The client acts on it and sues.",
    clause: "We don't cover any claim [[arising from the use of AI]].",
    crux: "AI invented the studies. A person didn't check. Which one caused the loss?",
    basis: { label: "Illustrative" },
  },
  {
    kind: "case",
    id: "refund-agent",
    title: "The talked-round refund bot",
    story: "Fraudsters chat with a retailer's AI refund agent and talk it into paying out hundreds of refunds.",
    clause: "We cover money lost [[directly]] to fraud on your computer systems.",
    crux: "The bot chose to pay. Is that “directly” fraud?",
    basis: { label: "Illustrative" },
  },
];

export const STANCES: StanceItem[] = [
  { kind: "stance", id: "silence-pays", topic: "Silence", statement: "If a policy is silent on AI, it should pay.", pole: 1 },
  { kind: "stance", id: "free-to-exclude", topic: "Freedom to exclude", statement: "Insurers should be free to exclude anything AI touches.", pole: -1 },
  { kind: "stance", id: "own-cover", topic: "Its own cover", statement: "AI needs its own insurance, separate from everything else.", pole: -1 },
  { kind: "stance", id: "cause-not-link", topic: "Cause, not connection", statement: "An AI exclusion should only bite when AI caused the loss.", pole: 1 },
  { kind: "stance", id: "never-planned", topic: "Unplanned risk", statement: "If insurers never planned for AI, they shouldn't have to pay for it.", pole: -1 },
  { kind: "stance", id: "just-a-tool", topic: "Just a tool", statement: "AI is just a tool. Insure it like any other.", pole: 1 },
];

export const BONUS: BonusItem = {
  kind: "bonus",
  id: "say-it-clearly",
  topic: "Clarity",
  statement: "Every policy should say clearly whether it covers AI.",
};

/** Play order: a case, then a quick statement, so the pace keeps moving. */
export const ITEMS: Item[] = [...CASES.flatMap((c, i) => [c, STANCES[i]]), BONUS];
export const SCORED_COUNT = CASES.length + STANCES.length;

/** Colour tones (see the tone tokens in globals.css): green for yes and agree, red for no and disagree. */
export type Tone = "agree-2" | "agree-1" | "maybe" | "disagree-1" | "disagree-2";

export const VERDICTS: { id: Verdict; label: string; tag: string; key: string; tone: Tone }[] = [
  { id: "yes", label: "Yes", tag: "It pays", key: "1", tone: "agree-2" },
  { id: "arguable", label: "Arguable", tag: "Could go either way", key: "2", tone: "maybe" },
  { id: "no", label: "No", tag: "It doesn't pay", key: "3", tone: "disagree-2" },
];

export const AGREE: { id: Agree; label: string; key: string; tone: Tone }[] = [
  { id: 0, label: "Strongly disagree", key: "1", tone: "disagree-2" },
  { id: 1, label: "Disagree", key: "2", tone: "disagree-1" },
  { id: 2, label: "Agree", key: "3", tone: "agree-1" },
  { id: 3, label: "Strongly agree", key: "4", tone: "agree-2" },
];

export const ROLES = [
  { id: "underwriter", label: "Underwriter", plural: "Underwriters", one: "underwriter", abbr: "UW" },
  { id: "broker", label: "Broker", plural: "Brokers", one: "broker", abbr: "BRK" },
  { id: "claims", label: "Claims", plural: "Claims professionals", one: "claims professional", abbr: "CLM" },
  { id: "counsel", label: "Coverage lawyer", plural: "Coverage lawyers", one: "coverage lawyer", abbr: "LAW" },
  { id: "risk", label: "Risk manager", plural: "Risk managers", one: "risk manager", abbr: "RM" },
  { id: "actuary", label: "Actuary", plural: "Actuaries", one: "actuary", abbr: "ACT" },
  { id: "insurance", label: "Other insurance", plural: "Others in insurance", one: "player elsewhere in insurance", abbr: "INS" },
  { id: "outside", label: "Not in insurance", plural: "Players outside insurance", one: "player outside insurance", abbr: "OUT" },
] as const;
export type RoleId = (typeof ROLES)[number]["id"];

export const REGIONS = [
  { id: "na", label: "North America" },
  { id: "uk", label: "UK" },
  { id: "eu", label: "Europe" },
  { id: "apac", label: "Asia-Pacific" },
  { id: "other", label: "Elsewhere" },
] as const;
export type RegionId = (typeof REGIONS)[number]["id"];

export const AXES = {
  x: { title: "Today's wording", question: "Do today's policies pay for AI losses?", neg: "Doesn't pay", pos: "Pays" },
  y: { title: "Where cover should go", question: "Should they?", neg: "Carve AI out", pos: "Fold AI in" },
} as const;

export type ArchetypeId = "gap-hunter" | "steady-hand" | "watchdog" | "architect" | "arbiter";

export type Archetype = {
  id: ArchetypeId;
  name: string;
  /** The name without "The", for "You're a ..." */
  bare: string;
  where: string;
  line: string;
  /** The line in the first person, for the share post. */
  me: string;
  says: string;
  traits: string[];
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  "gap-hunter": {
    id: "gap-hunter",
    name: "The Gap Hunter",
    bare: "Gap Hunter",
    where: "Doesn't pay · Fold AI in",
    line: "You see AI losses falling through today's wording, and you want standard cover to close the gap.",
    me: "I think AI losses are falling through today's wording, and standard cover should close the gap.",
    says: "Show me where it says AI.",
    traits: ["Reads exclusions as written", "Wants policies to name AI and cover it", "Expects buyers to be caught out"],
  },
  "steady-hand": {
    id: "steady-hand",
    name: "The Steady Hand",
    bare: "Steady Hand",
    where: "Pays · Fold AI in",
    line: "To you, AI is one more way things go wrong. Today's policies respond, and that's how it should stay.",
    me: "To me, AI is one more way things go wrong. Today's policies respond, and that's how it should stay.",
    says: "We said the same about the internet.",
    traits: ["Reads cover by the loss, not the technology", "Sees no need for special AI rules", "Calm about the hype"],
  },
  watchdog: {
    id: "watchdog",
    name: "The Watchdog",
    bare: "Watchdog",
    where: "Pays · Carve AI out",
    line: "You think today's policies are quietly paying for AI risk nobody planned for, and it needs fixing before a big loss fixes it for everyone.",
    me: "I think today's policies are quietly paying for AI risk nobody planned for, and it needs fixing before a big loss fixes it for everyone.",
    says: "Silent cover is still cover.",
    traits: ["Sees silent AI on every policy", "Wants AI written out or planned for", "Has seen this film before"],
  },
  architect: {
    id: "architect",
    name: "The Architect",
    bare: "Architect",
    where: "Doesn't pay · Carve AI out",
    line: "You read today's wording as leaving AI out, and you think that's right: AI is a new risk that deserves cover built for it.",
    me: "I read today's wording as leaving AI out, and I think that's right: AI is a new risk that deserves cover built for it.",
    says: "New risk, new policy.",
    traits: ["Reads AI exclusions as doing their job", "Wants AI cover built from scratch", "Thinks bundling hides the risk"],
  },
  arbiter: {
    id: "arbiter",
    name: "The Arbiter",
    bare: "Arbiter",
    where: "The centre",
    line: "You weigh every word and won't call it early. For you, AI cover turns on the facts and the wording, case by case.",
    me: "I weigh every word and won't call it early. AI cover turns on the facts and the wording, case by case.",
    says: "It depends. Send me the full policy.",
    traits: ["Sees both sides of most calls", "Holds positions loosely", "The person everyone asks"],
  },
};

export const ARCHETYPE_ORDER: ArchetypeId[] = ["gap-hunter", "steady-hand", "watchdog", "architect", "arbiter"];

export const COMPASS_DISCLAIMER =
  "A survey of professional opinion. Not legal advice, and not a statement of how any policy responds: cover always depends on the full policy and the facts. Policy wordings are simplified specimens written in the style of common market language, not any insurer's policy.";
