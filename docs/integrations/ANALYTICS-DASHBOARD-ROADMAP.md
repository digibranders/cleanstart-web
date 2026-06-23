# CMS Analytics Dashboard — Phased Roadmap

**Status:** living document · created 2026-06-23
**Owners:** Platform / SEO
**Related:** implementation plan for Phase 1–2 → [`docs/superpowers/plans/2026-06-23-cms-analytics-dashboard.md`](../superpowers/plans/2026-06-23-cms-analytics-dashboard.md) · provider research → [`INTEGRATIONS-RESEARCH-V2.md`](./INTEGRATIONS-RESEARCH-V2.md)

---

## Why this exists / the differentiator

GA4 and GSC already do "what happened on my site" better than we ever will. **Our dashboard's edge is that it lives inside the CMS**, so it can *join analytics to content* — authors, categories, publish/update dates, internal links, word count, lead conversions — which GA4 and GSC structurally cannot do. The roadmap therefore prioritizes features that are **unique to having content + analytics in one place**, not re-skins of charts you can already see in Google.

### Guiding principles

1. **Free first-party data first** (GA4, GSC), **paid market data last and optional** (DataForSEO).
2. **Lead with what Google can't do** — content joins, conversion attribution, refresh queues — over re-displaying standard metrics.
3. **Architecture reuse, not rebuild** — every phase rides the existing Phase-J2 plumbing: the `integrations` collection (pluggable `kind`s), `analyticsCache`, read-through dashboard endpoints, and custom admin views. A new data source = a new `kind`, never a re-architecture.
4. **Cost control by construction** — all data is cron-cached or read-through-cached; never a paid API call on the request path. Metered providers (DataForSEO) are opt-in, scoped to a defined keyword/competitor set, and refreshed daily.
5. **Privacy** — the web GA4 tag is already consent-gated; the CMS dashboard only reads aggregated cached payloads (no PII).

### Status legend
✅ shipped · 🟡 planned (v1, has implementation plan) · ⬜ roadmap (designed, not planned) · ◻ optional
**Cost:** Free = GA4/GSC/CrUX/first-party · $ = metered/paid · **Effort:** S (≤1d) · M (2–4d) · L (1wk+)

---

## Phase 1 — Foundation: filterable GA4 dashboard 🟡

**Goal:** a dedicated `/admin/analytics` page powered by GA4, with date-range / country / collection filters. Works today (GA4 is live in prod).

| Feature | What it does | Source | Cost | Effort |
|---|---|---|---|---|
| Dedicated Analytics page + nav | New `/admin/analytics` route, custom admin view | — | Free | M |
| Filters (window · country · collection) | Read-through endpoint re-fetches a filtered GA4 report, cached 20 min | GA4 | Free | M |
| KPI cards | Sessions · Users · Engagement · Key events | GA4 | Free | S |
| Trend chart | Daily sessions, hand-rolled SVG (no chart dependency) | GA4 | Free | S |
| Top pages | Top pages by sessions + views | GA4 | Free | S |
| Top countries | Horizontal-bar breakdown | GA4 | Free | S |

**Deps:** none (built + verified locally). **Detail:** see the implementation plan (Phases 1–2 there).

---

## Phase 2 — Search performance: Google Search Console 🟡

**Goal:** add the acquisition half of the funnel. Built but inert until an owner grants the service account GSC access.

| Feature | What it does | Source | Cost | Effort |
|---|---|---|---|---|
| GSC KPI row | Clicks · Impressions · CTR · Avg position | GSC | Free | S |
| Top search queries | What people search to find the site | GSC | Free | S |
| Per-page search columns | Merge GSC clicks/position into the Top-pages table | GSC | Free | S |
| Per-document search (editor) | The existing L2 "Analytics" tab on each doc — queries + URL inspection | GSC | Free | ✅ exists |
| "Connect Search Console" empty state | Gated UI until access lands | — | Free | S |

**Deps:** owner adds `cleanstart-cms-analytics@cleanstart-cms.iam.gserviceaccount.com` as a Full user in Search Console. **Detail:** implementation plan Phase 3.

---

## Phase 3 — Content intelligence ⬜ (the CMS-unique differentiator — highest leverage)

**Goal:** join analytics to content metadata. None of this is possible in GA4/GSC alone.

| Feature | What it does | Source | Cost | Effort | Value |
|---|---|---|---|---|---|
| **Content decay + refresh queue** | Pages with declining traffic/clicks over 90d, ranked by loss; "high-traffic + not updated in 6mo" → one-click "open in editor" | GA4+GSC+CMS | Free | M | ★★★ |
| **Author & category leaderboards** | Sessions/clicks/conversions rolled up by author or category (Payload relationships) | GA4+GSC+CMS | Free | M | ★★★ |
| **Conversion attribution to content** | Which articles drive leads/demo requests; lead value per article | GA4+CMS | Free | M | ★★★ |
| **Orphan / zero-traffic audit** | Published docs with ~0 sessions and ~0 impressions → prune-or-promote | GA4+GSC+CMS | Free | S | ★★ |
| **Indexation coverage rollup** | % of each collection's published docs actually indexed; flag the not-indexed | GSC inspect+CMS | Free | M | ★★ |
| **New-content velocity** | Performance of last-30/90-day posts vs the back catalog | GA4+CMS | Free | S | ★ |

**Deps:** conversion attribution needs GA4 **key events** wired (separate small task — currently shown as "needs setup"). Everything else uses data already in Postgres.

---

## Phase 4 — SEO opportunity engine ⬜

**Goal:** turn GSC's raw data into an actionable to-do list (GSC has the data, no workflow).

| Feature | What it does | Source | Cost | Effort | Value |
|---|---|---|---|---|---|
| **Striking-distance queries** | Queries at position 5–15 with high impressions → quick wins, sorted by upside | GSC | Free | M | ★★★ |
| **Low-CTR-for-position** | Pages under the expected CTR curve for their rank → rewrite title/meta | GSC | Free | M | ★★ |
| **Keyword cannibalization** | Two CMS docs competing for the same query → merge/differentiate | GSC+CMS | Free | M | ★★ |
| **Content-gap finder (first-party)** | Queries with impressions but no dedicated page → "write this" | GSC+CMS | Free | M | ★★ |

**Deps:** Phase 2 (GSC). Content-gap becomes far stronger with DataForSEO volume data (Phase 7).

---

## Phase 5 — Advanced visualizations & richer standard metrics ⬜

**Goal:** depth and polish; mostly surfacing data GA4/GSC have, in-context.

| Feature | What it does | Source | Cost | Effort |
|---|---|---|---|---|
| Period-over-period deltas | WoW / MoM "+8% vs prev" on every KPI | GA4/GSC | Free | S |
| Channel / source / device splits | Organic vs direct vs referral vs social; mobile/desktop | GA4 | Free | S |
| Realtime active users | "Live now" widget | GA4 Realtime API | Free | S |
| **Core Web Vitals (field data)** | LCP / INP / CLS per page where editors edit | Google **CrUX API** | Free | M |
| Position-distribution histogram | How many queries in pos 1–3 / 4–10 / 11–20 / 20+ | GSC | Free | S |
| CTR-vs-position scatter | Spot underperformers below the curve | GSC | Free | S |
| Traffic treemap by collection | Where attention concentrates | GA4+CMS | Free | M |
| Per-row sparklines | Mini 30-day trend per page in tables | GA4 | Free | S |
| Funnel: impressions → clicks → sessions → key events | Stitched across GSC + GA4 + CMS | all three | Free | M |

**Deps:** CrUX is a separate free Google API (new helper, daily cron). Realtime uses the GA4 Realtime endpoint (live, cache 60s).

---

## Phase 6 — Proactive alerts & AI assistance ⬜

**Goal:** push insight to the team and reduce manual analysis. Reuses integrations you already have.

> **Cost:** the proactive core (weekly digest, anomaly alerts, goal tracking) is **free** — it reuses the already-wired Teams + Brevo channels. Only the two **AI** features cost LLM tokens (pay-per-use via Claude, no subscription, cents per short prompt). This phase is *not* a paid phase — unlike Phase 7 (DataForSEO).

| Feature | What it does | Source | Cost | Effort |
|---|---|---|---|---|
| **Weekly digest** | "Top movers · decaying pages · indexation issues" to a channel/inbox | reuse **Teams Workflow + Brevo** | Free | M |
| Anomaly alerts | Traffic spike/drop notifications | GA4 + Teams | Free | M |
| Goal tracking | Set a monthly clicks/sessions target, show progress | GA4/GSC | Free | S |
| AI title/meta suggestions | Feed a low-CTR page's query + current title to an LLM for rewrites | GSC + Claude | $ (LLM) | M |
| AI content briefs | Turn the content-gap list into draft briefs | GSC/DataForSEO + Claude | $ (LLM) | M |

**Deps:** digest/alerts reuse the existing Teams + Brevo channels (mostly assembly). AI features use Claude (token cost only).

---

## Phase 7 — Competitive intelligence: DataForSEO ◻ (optional, paid, last)

**Goal:** the one thing first-party tools structurally can't give — **market & competitor data**. GA4/GSC only know your own property; DataForSEO knows the whole SERP.

| Feature | What it does | Source | Cost | Effort |
|---|---|---|---|---|
| Keyword search volume | Absolute monthly volume (GSC only shows impressions for queries you already rank for) | DataForSEO | $ | M |
| Competitor rank tracking | Where competitors rank for target keywords; the gap to you | DataForSEO | $ | M |
| Keyword gap | Keywords competitors rank for that you don't, weighted by real volume | DataForSEO | $ | M |
| SERP feature analysis | Which queries trigger AI Overviews / featured snippets / PAA, and who owns them | DataForSEO | $ | M |
| Backlink intelligence | Your + competitors' link profiles (richer than GSC's links) | DataForSEO | $ | L |
| Flexible historical rank tracking | Granular per-keyword position history for a chosen set | DataForSEO | $ | M |

**Why optional / last:** DataForSEO is **pay-per-request** (cents per call). Adopt only when the competitive view is worth the spend.

**Cost-control pattern (mandatory if adopted):**
- New `dataForSeo` `kind` in `Integrations.ts` (`ACTIVE_KIND_OPTIONS`); login/password resolved via `credentials.ts` like the other env-keyed providers.
- Per-row config defines the **bounded scope**: the tracked keyword list + competitor domains. No unbounded crawls.
- Refresher writes to `analyticsCache` on a **daily** cron — never a per-request paid call.
- A "Competitive / Opportunities" dashboard section reads only the cached payloads.
- (A `seo-dataforseo` agent already exists in tooling, so the team is familiar with the API.)

**Deps:** a DataForSEO account + budget decision. Clean additive `kind` — does not touch Phases 1–6.

---

## Cross-cutting architecture (applies to every phase)

- **Pluggable kinds:** new data source → new entry in `Integrations.ts` `ACTIVE_KIND_OPTIONS` + a credentials resolver + a refresher kind file. Same shape as GA4/GSC/Clarity/Cloudflare today.
- **One cache:** all providers write to `analyticsCache` (`scope:'global'` + descriptive `key`); the daily prune cron already covers new rows. No per-feature schema unless a feature needs a new persisted entity.
- **Read-through endpoints** under `/api/dashboards/*` (admin/editor auth) serve cached payloads and refresh on miss/stale.
- **Custom admin views** under `admin/components/Analytics/` render with `@cleanstart/ui` primitives + hand-rolled SVG (no heavy chart dependency bundled into `/admin`).
- **Server bundling caveat (learned 2026-06-23):** any gRPC/proto-based SDK (Google clients, etc.) must be in `next.config.ts` `serverExternalPackages`, or it breaks when Next bundles it — see the GA4 fix.

## Prerequisites summary

| Prereq | Unblocks | Status |
|---|---|---|
| GA4 service account + property access + `GOOGLE_APPLICATION_CREDENTIALS_JSON` (GH secret) | Phases 1, 3, 5 | ✅ done |
| GSC owner adds the SA as a Full user | Phase 2, 4, indexation rollup | ⬜ pending team |
| GA4 **key events** configured | conversion attribution (Phase 3), funnel (Phase 5) | ⬜ small task |
| CrUX API (free, no account) | Core Web Vitals (Phase 5) | ⬜ |
| Teams + Brevo (already wired) | digests/alerts (Phase 6) | ✅ available |
| DataForSEO account + budget | Phase 7 | ◻ optional |

## Recommended sequencing

**v1:** Phases 1–2 (free, foundation). → **v2 (the real value):** Phase 3 (content intelligence) + the top of Phase 4 (striking-distance) + Phase 6's weekly digest. → **v3:** the rest of Phases 4–5. → **Optional, any time after:** Phase 7 (DataForSEO) when competitive intel justifies the spend.
