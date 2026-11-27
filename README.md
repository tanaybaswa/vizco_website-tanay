# VizCo website

Marketing site for **VizCo, The AI & Emerging Risk Specialty Broker** (vizco.co).

Built with Next.js 15 (App Router), React 19, Tailwind CSS v4 and lucide-react icons. Every page is a static server component. The one exception is the AI Cover Compass, which has three small API routes and a Redis database (see below).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npx tsc --noEmit   # type check
npm run build      # production build
```

## Where things live

| Path | What it is |
|---|---|
| `src/app/page.tsx` | Home page |
| `src/app/the-problem/` | Sourced guide to silent AI and AI exclusions (every claim cited) |
| `src/app/startups/`, `src/app/enterprise/` | Audience pages |
| `src/app/insights/` | Insights index and one folder per post. Post list and dates live in `src/content/insights.ts` |
| `src/content/sources.ts`, `src/components/Cite.tsx` | Every cited source, and the inline source link used beside each claim in posts |
| `src/app/emerging-risk/` | Physical AI: humanoid robots, robots at work, autonomous systems |
| `src/app/compass/`, `src/components/compass/` | The AI Cover Compass: a live poll game for insurance professionals. Content in `src/content/compass.ts`; scoring, storage and share images in `src/lib/compass/`; API in `src/app/api/compass/`. Plan and launch steps: `docs/ai-cover-compass.md` |
| `src/app/about/`, `src/app/contact/` | Team and contact |
| `src/app/sitemap.ts`, `src/app/robots.ts` | Sitemap and robots.txt (AI crawlers allowed) |
| `src/components/ui.tsx` | Shared building blocks: `Container`, `Section`, `SectionHeader`, `Block`, `Label`, `Card`, `Faq`, `Button`, `Em` |
| `src/content/process.ts`, `src/components/Process.tsx` | The five-step process (Assess, Mitigate, Place, Monitor, Report). `Process` is the panel version on startups and enterprise; the home page draws the same steps as a policy year (`home/PolicyYear`) |
| `src/components/RiskChanges.tsx` | "AI risk can change overnight" panel: why we keep monitoring after the policy is bound (enterprise) |
| `src/components/home/` | Home-only sections, in page order: `Thesis` (hero), `Affiliations` (the "Expertise from" logo band), `ClaimStory` + `ClaimPapers` (why it matters: one claim, step by step, with the papers pinned beside it), `WhyNow` (the one dark band: sourced figures), `RiskMap` (what we cover: twelve risks as spokes, four depths as rings, with a panel per risk), `PolicyYear` (how we work), `Audiences` (enterprises and startups), then the FAQ, the close and `Backers` (investors and SOC 2, at the foot). Each section has its own form; keep it that way rather than repeating one panel style |
| `src/components/PageHero.tsx`, `FinalCta.tsx`, `CoverageGap.tsx` | Hero, closing call to action, black feature panel |
| `src/components/DoesItPay.tsx` | The problem as one claim ("Does your insurance pay?" Yes / Maybe / No), used on the-problem |
| `src/components/pages/Visuals.tsx` | Illustrations (AI inventory, vendor stack, certificate) |
| `src/content/site.ts` | Navigation, footer links, booking/checker URLs, disclaimer, and `PROMO`: the announcement strip, which promotes the AI Cover Compass while it's new (and shows the free check on the Compass itself) |
| `src/content/team.ts` | Team and advisors |
| `src/content/exposures.ts`, `src/components/ExposureGroups.tsx` | "How AI goes wrong": 12 failure modes in four groups, shown as tabs of black cards on enterprise, and as the risk map (`home/RiskMap`) on home. Each risk also carries its technical name, why it matters, a cited case where one exists, and what we check at each depth (`DEPTH`) |
| `src/lib/seo.ts`, `src/components/JsonLd.tsx` | Per-page metadata helper and structured data |
| `public/llms.txt` | Plain-text summary for AI answer engines |
| `public/investors/` | Investor logos (black on transparent) |
| `src/content/affiliations.ts`, `public/affiliations/` | The logo band under the home hero ("Expertise from"): where the team and advisors studied and worked, and our investors. See `docs/affiliations.md` before adding one |
| `docs/` | How the hero portrait (`hero-portrait.md`), the favicon (`favicon.md`) and the affiliation logos (`affiliations.md`) were made and how to rebuild them, and the AI Cover Compass plan, including how its art was made (`ai-cover-compass.md`) |
| `design/` | Source art and build scripts for those images, and the Compass sketches with their prompts (`design/compass/`). Not served; `public/` and `src/app/` hold the generated files |

## Design system

- **Look:** editorial, black on white, from the logo ("Viz" plus "Co" reversed out of a black block). Left-aligned headings, a rule above each section, numbered section labels, square buttons.
- **Colour tokens are inverted. Read this before styling.** In `globals.css`, `ink` is **white** (backgrounds) and `cream` is **black** (text and blocks). So `bg-cream text-ink` is a black block with white text.
- **Accent:** one signal colour, `--signal` (currently orange `#ff5a1f`), used only for small marks: label squares, link underlines, the "Yes" box in the claim example, one reading card. Never for body text. Changing the colour is a one-line edit in `globals.css`.
- **Emphasis:** `<Em>` / `.block-mark` gives the black "Co"-style highlight.
- **Fonts:** Noto Sans 700 for headings (`font-display`), Geist for body, Geist Mono for labels.
- `.eyebrow` is plain (unlayered) CSS and overrides Tailwind size utilities. Use explicit utilities when you need a different size.
- **Size things in rem, not px.** The root font size grows from 100% at 1440px wide to 110% at 1800px and wider (`html` in `globals.css`), so the whole page scales up on big screens the way browser zoom would. Anything in px won't grow with it. Keep px only for hairlines, borders and shadows.
- Check every change at 1280px, 1024px and 375px, and at 1800px for the scaled-up size. No page should scroll sideways on a phone.

## Content rules (agreed, keep to them)

- No prices, premiums or dollar figures anywhere, including examples.
- Never mention carriers: no insurer names, and not the word "carrier". "Insurers" is fine.
- No policy-type names (cyber, Tech E&O, D&O, general liability). "AI liability" is fine.
- No MGA mentions and no competitor comparisons. Don't cite competitor brokers' research.
- The call to action is always **"Talk to us"**, never "Talk to a broker".
- No performance guarantees.
- Logos only for real ties (a degree, a job, an investment), as wordmarks, never university seals. See `docs/affiliations.md`.
- Keep copy short and visual. Home hero copy makes statements, not questions.
- Educational content must be researched and relevant to the buyer, with every figure or claim linked to a real source beside it. Never invent data.

Quick check before committing:

```bash
grep -rn -i -E 'carrier|lloyd|\$[0-9]|price|premium|talk to a broker|\bMGA\b|guarantee|cyber|E&O|D&O|general liability' src public/llms.txt
```

The only expected hits are in `the-problem` (the 2017 UK cyber-risk precedent and its source title).

## SEO and AI search (GEO)

- Each page sets its metadata with `pageMeta({ title, description, path })` from `src/lib/seo.ts`. That gives the title, description, canonical address and share preview.
- Structured data: Organization and WebSite on every page (in `layout.tsx`); FAQPage on home, startups and enterprise; Service on startups, enterprise and emerging risk; Article with citations on the-problem.
- **When you add a page:** add it to `src/app/sitemap.ts`, give it `pageMeta`, and add a line to `public/llms.txt`.
- **When you add an insight:** add it to `src/content/insights.ts` (it then appears on /insights, in related posts and in the sitemap automatically), create `src/app/insights/<slug>/page.tsx` using `<Article>` and `<Cite s="...">`, add any new source to `src/content/sources.ts`, and add a line to `public/llms.txt`. Every claim needs a source beside it.
- **When you edit the Compass:** changing a scored case or position changes what its votes mean, so bump `COMPASS.version` in `src/content/compass.ts`. Votes are stored per version.
- **When you edit the-problem:** update `UPDATED` and `UPDATED_LABEL` at the top of the page. The visible "Updated" date and the article's `dateModified` both come from them.

## The AI Cover Compass: storage

Votes are kept in Redis through Upstash's REST API. In Vercel, add "Upstash for Redis" from the Marketplace (free) to this project; it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Also set `COMPASS_SALT` (any random string) and `COMPASS_ADMIN_KEY` (for `GET /api/compass/export`). Without the database, local play uses an in-memory store, and production hides live numbers rather than show partial ones. To test locally with live numbers on a production build: `COMPASS_MEMORY_STORE=1 npm start`.

## Still to do

- Pick the final accent colour (orange, electric blue or acid lime were compared).
- A one-line credential for each advisor.
- Licence and registration details for the footer.
- A privacy policy for the website itself. The current one covers the VizCo Chat OAuth app only.
- The company LinkedIn URL, to add as `sameAs` in the Organization schema.
- Decide the spelling: "VizCo" vs "Vizco".
- After launch, submit `https://vizco.co/sitemap.xml` in Google Search Console.

## Branches

- `main`: the current live site.
- `redesign/broker-site`: this redesign. It is not merged into `main` yet.
