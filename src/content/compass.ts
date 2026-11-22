import type { SourceKey } from "@/content/sources";

/**
 * The AI Cover Compass: a live poll for insurance professionals.
 *
 * Two questions place every player on the map:
 *   x: Do today's policies pay for AI losses? (six cases: Yes / Arguable / No)
 *   y: Should they? (six positions: Strongly disagree to Strongly agree)
 *
 * Content rules are the site's: no insurer names, no policy-type names, no figures.
 * Editing a scored item changes what its votes mean, so bump VERSION when you do;
 * votes are stored under the version they were cast on.
 */
export const COMPASS = {
  name: "The AI Cover Compass",
  short: "AI Cover Compass",
  path: "/compass",
  version: "v1",
  /** The first players who join get credited in the first report. */
  founding: 200,
} as const;

export type Verdict = "yes" | "arguable" | "no";
/** 0 strongly disagree, 1 disagree, 2 agree, 3 strongly agree. No neutral: take a side. */
export type Agree = 0 | 1 | 2 | 3;

export type CaseItem = {
  kind: "case";
  id: string;
  title: string;
  insured: string;
  facts: string;
  policy: string;
  /** The wording. A defined term is marked [[like this]] and explained in `terms`. */
  clause: string;
  terms?: Record<string, string>;
  /** Where the wording comes from. */
  wording: { note: string; source?: SourceKey };
  /** Where the facts come from. */
  basis: { label: string; source?: SourceKey };
  /** The crux, in one line, shown under the question. */
  crux: string;
  reading: { lean: Verdict; text: string };
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

const SPECIMEN = "Specimen wording, written by VizCo in the style of common market language. Not any insurer's policy.";

export const CASES: CaseItem[] = [
  {
    kind: "case",
    id: "chatbot-promise",
    title: "The chatbot's promise",
    insured: "An airline with a customer-service chatbot",
    facts:
      "The chatbot told a grieving customer they could claim a bereavement discount after booking. The airline's real terms said otherwise. A tribunal held the airline to its chatbot's answer.",
    policy: "Covers the airline's liability for mistakes made serving customers.",
    clause:
      "We will pay loss arising from any negligent act, error, omission or misstatement by you, or by anyone for whom you are legally responsible, in the course of your business.",
    wording: { note: SPECIMEN },
    basis: { label: "Based on Moffatt v. Air Canada, 2024", source: "moffatt" },
    crux: "Is a chatbot “anyone”? Or is it simply “you”?",
    reading: {
      lean: "yes",
      text: "Pays. The tribunal treated the chatbot as part of the airline's own website, so the misstatement was the airline's. The policy never needs the chatbot to be “anyone”.",
    },
  },
  {
    kind: "case",
    id: "wet-floor-sign",
    title: "The wet-floor sign",
    insured: "A supermarket chain",
    facts:
      "A shopper slips on a wet floor and breaks a wrist. The warning sign beside the spill was made with a generative AI image tool, and the shopper says it was hard to read.",
    policy: "Covers the supermarket's liability for injuries to the public.",
    clause: "This insurance does not apply to bodily injury arising out of [[generative artificial intelligence]].",
    terms: {
      "generative artificial intelligence":
        "“A machine-based learning system or model that is trained on data with the ability to create content or responses, including but not limited to text, images, audio, video or code.”",
    },
    wording: { note: "Exclusion modelled on the standard AI exclusion. The definition is the standard wording's own.", source: "moneyGeek" },
    basis: { label: "A question raised on an industry panel, November 2026" },
    crux: "The AI made the sign. Did the sign cause the fall?",
    reading: {
      lean: "yes",
      text: "Pays, in our view. The wet floor caused the fall; AI only drew the sign. But “arising out of” is read broadly, and an insurer could argue the sign is part of the claim. That is the reach problem in one case.",
    },
  },
  {
    kind: "case",
    id: "deepfake-call",
    title: "The deepfake call",
    insured: "A global engineering firm",
    facts:
      "A finance worker joins a video call with the chief financial officer and several colleagues, then sends the money they ask for in 15 transfers. Everyone else on the call was an AI-generated fake.",
    policy: "Covers money the firm loses to fraud.",
    clause:
      "We will pay for loss of money transferred in good faith by an employee relying on an instruction that appears to come from a director or employee but was sent by an [[impostor]].",
    terms: { impostor: "“A natural person who impersonates a director or employee of the insured.”" },
    wording: { note: SPECIMEN },
    basis: { label: "Based on a reported 2024 case in Hong Kong", source: "arup" },
    crux: "People ran the scam. But did a natural person impersonate anyone, or did software?",
    reading: {
      lean: "arguable",
      text: "Arguable, leaning pays. People ran the scam and the instruction was fraudulent, which is what this cover is for. The weak point is the definition: an insurer could say no natural person impersonated anyone; software did.",
    },
  },
  {
    kind: "case",
    id: "hiring-screen",
    title: "The hiring screen",
    insured: "A software company that sells AI hiring tools",
    facts:
      "Job applicants sue the company, saying its AI screened them out because of their age. They never applied to the company itself, only to its customers. A US court let the claim go ahead as a collective action.",
    policy: "Covers claims that the company's technology caused others a loss.",
    clause: "We will not pay for any claim alleging discrimination of any kind against any person.",
    wording: { note: SPECIMEN },
    basis: { label: "Based on Mobley v. Workday, 2025", source: "mobley" },
    crux: "Exclusions like this were written for the insured's own hiring. Does it reach a tool sold to others?",
    reading: {
      lean: "no",
      text: "Doesn't pay, most likely. “Against any person” is wide enough to catch a vendor whose tool is accused of bias. Limit the exclusion to the company's own staff and applicants, and the answer flips.",
    },
  },
  {
    kind: "case",
    id: "unchecked-report",
    title: "The unchecked report",
    insured: "A consulting firm",
    facts:
      "A consultant drafts a market study with an AI assistant and skips the fact-check. Three studies it cites don't exist. The client relies on the report, makes a costly decision and sues.",
    policy: "Covers claims from mistakes in the firm's professional work.",
    clause: "We will not pay for any claim arising out of any actual or alleged use of [[artificial intelligence]].",
    terms: { "artificial intelligence": "“Any machine-based system that generates outputs such as content, predictions or decisions.”" },
    wording: { note: SPECIMEN },
    basis: { label: "Illustrative scenario" },
    crux: "The AI invented the studies. A person chose not to check. Which one caused the loss?",
    reading: {
      lean: "no",
      text: "Doesn't pay, on this wording. “Any actual or alleged use” reaches the draft even though the real failure was a person skipping the check. This is how broad exclusions take away cover for ordinary negligence.",
    },
  },
  {
    kind: "case",
    id: "refund-agent",
    title: "The talked-round agent",
    insured: "An online retailer",
    facts:
      "Fraudsters chat with the retailer's AI refund agent and hide instructions in their messages. The agent issues hundreds of refunds to accounts the fraudsters control.",
    policy: "Covers money the retailer loses to fraud on its computer systems.",
    clause: "We will pay for loss of money resulting directly from the fraudulent entry of data into your computer system by a third party.",
    wording: { note: SPECIMEN },
    basis: { label: "Illustrative scenario" },
    crux: "The fraudsters typed into the system. But the agent chose to pay. Is that “directly”?",
    reading: {
      lean: "arguable",
      text: "Arguable. The fraudsters did enter data into the retailer's system, which reads like the cover. But the agent made each refund it was allowed to make, and an insurer could say the loss came from that decision, not directly from the fraud.",
    },
  },
];

export const STANCES: StanceItem[] = [
  { kind: "stance", id: "silence-pays", topic: "Silence", statement: "If a policy says nothing about AI, it should pay for AI losses.", pole: 1 },
  { kind: "stance", id: "free-to-exclude", topic: "Freedom to exclude", statement: "Insurers should be free to exclude any loss with a link to AI.", pole: -1 },
  { kind: "stance", id: "own-cover", topic: "Its own cover", statement: "AI risk should be sold as its own cover, not folded into existing policies.", pole: -1 },
  { kind: "stance", id: "cause-not-link", topic: "Cause, not connection", statement: "An AI exclusion should only apply when the AI actually caused the loss.", pole: 1 },
  { kind: "stance", id: "never-underwrote", topic: "Unplanned risk", statement: "Insurers shouldn't have to pay for AI risk they never underwrote.", pole: -1 },
  { kind: "stance", id: "just-a-tool", topic: "Just a tool", statement: "AI is a tool like any other. Policies should treat it that way.", pole: 1 },
];

export const BONUS: BonusItem = {
  kind: "bonus",
  id: "say-it-clearly",
  topic: "Clarity",
  statement: "Every policy should say clearly whether it covers AI.",
};

/** Play order: a heavy case, then a quick position, so the pace keeps moving. */
export const ITEMS: Item[] = [...CASES.flatMap((c, i) => [c, STANCES[i]]), BONUS];
export const SCORED_COUNT = CASES.length + STANCES.length;

export const VERDICTS: { id: Verdict; label: string; tag: string; key: string }[] = [
  { id: "yes", label: "Yes", tag: "It pays", key: "1" },
  { id: "arguable", label: "Arguable", tag: "Could go either way", key: "2" },
  { id: "no", label: "No", tag: "It doesn't pay", key: "3" },
];

export const AGREE: { id: Agree; label: string; short: string; key: string }[] = [
  { id: 0, label: "Strongly disagree", short: "Strongly disagree", key: "1" },
  { id: 1, label: "Disagree", short: "Disagree", key: "2" },
  { id: 2, label: "Agree", short: "Agree", key: "3" },
  { id: 3, label: "Strongly agree", short: "Strongly agree", key: "4" },
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
  "A survey of professional opinion. Not legal advice, and not a statement of how any policy responds: cover always depends on the full policy and the facts. Wordings are specimens unless a source says otherwise.";
