# Integrations Research — v2 (analytics read-back, notifications, dashboards)

**Date:** 2026-05-08
**Status:** Research / scoping note. Does not authorise implementation.
**Companion to:** [`INTEGRATIONS-RESEARCH.md`](./INTEGRATIONS-RESEARCH.md) (v1 — outbound fan-out + Teams deep-dive). Anchors below cite v1 sections by their existing heading IDs.

---

## §0 Reading guide

| If you need…                                                                 | Read         |
| ----------------------------------------------------------------------------- | ------------ |
| Why Teams "Incoming Webhook" is gone, exact Workflows payload                 | v1 §0, §1  |
| Per-channel routing schema, encryption, Standard Webhooks signing             | v1 §3       |
| Outbound channels we*send to* (Teams / Generic / CRM)                       | v1 §1, §2  |
| Open product questions on outbound shape                                      | v1 §5       |
| **Reading metrics back into the CMS** (GA4, GSC, Clarity, etc.)         | this doc §2 |
| **Inbound webhooks** (Cal.com, Brevo callbacks, LinkedIn LGF)           | this doc §4 |
| **Admin dashboard UX** — global cards, per-doc tab, integrations admin | this doc §5 |
| **Phase J milestone scope**                                             | this doc §9 |

v1 is unchanged and authoritative for outbound. v2 *adds* read-back, inbound, and the dashboard surfaces; it does not replace any v1 row. Where v2 reuses a v1 concept (encryption model, dead-letter queue, per-row routing), it points back rather than restating.

---

## §1 Catalog matrix

33 rows after the §11 cuts (Slack webhook + OAuth, Discord, Twilio, Google Sheets, Calendly, Brevo digest removed). Every "planned" or "deferred" row has a subsection in §2/§3/§4 or an entry in §10.

| #  | kind                   | direction | auth                             | event triggers                               | admin-UI surface              | tier | status     | dashboard?            |
| -- | ---------------------- | --------- | -------------------------------- | -------------------------------------------- | ----------------------------- | ---- | ---------- | --------------------- |
| 1  | teamsWorkflow          | out       | Workflow URL token               | document.published, lead.submitted           | Integrations row              | 1    | live (env) | list-cell badge       |
| 5  | genericWebhook         | out       | Standard Webhooks HMAC           | all events                                   | Integrations row              | 1    | live (env) | list-cell badge       |
| 6  | brevoTransactional     | out       | API key                          | lead.submitted                               | siteSettings → Integrations  | L    | live       | none                  |
| 9  | zohoCrm                | out       | OAuth 2.0 self-client (refresh)  | lead.submitted                               | Integrations row + drawer     | 2    | planned    | drawer + L1 card      |
| 10 | hubspotCrm             | out       | OAuth 2.0 / private app token    | lead.submitted                               | Integrations row              | 2    | deferred   | drawer                |
| 11 | salesforceCrm          | out       | OAuth 2.0 (web server flow)      | lead.submitted                               | Integrations row              | 2    | deferred   | drawer                |
| 12 | pipedriveCrm           | out       | API token                        | lead.submitted                               | Integrations row              | 2    | deferred   | drawer                |
| 14 | ga4MeasurementProto    | out       | measurement ID + API secret      | lead.submitted, custom server events         | Integrations row              | 3    | planned    | none                  |
| 15 | ga4DataApi             | in        | service-account JSON             | manual + 15-min cache                        | L1 card + per-doc tab         | 3    | planned    | **custom view** |
| 16 | gscIndexingApi         | out       | service-account JSON             | document.published (slug change)             | hook silent + audit log       | 3    | planned    | log-only              |
| 17 | gscSearchAnalyticsApi  | in        | service-account JSON             | manual + daily cache                         | L1 card + per-doc tab         | 3    | planned    | **custom view** |
| 18 | gscUrlInspectionApi    | in        | service-account JSON             | on-demand (button)                           | per-doc SEO tab "Inspect"     | 3    | planned    | drawer                |
| 19 | indexNow               | out       | static key file                  | document.published                           | siteSettings (env)            | L    | live       | none                  |
| 20 | bingWebmasterApi       | out       | API key                          | document.published                           | Integrations row              | 3    | deferred   | none                  |
| 21 | msClarity              | in        | Clarity Bearer token             | manual + daily cache                         | L1 card + per-doc embed       | 3    | planned    | **embed**       |
| 22 | gtmServerSide          | both      | container ID + GCP run           | proxy events                                 | siteSettings + Integrations   | 3    | open Q     | see §10              |
| 23 | plausibleSelfHost      | in        | API token                        | manual + 15-min cache                        | L1 card                       | 3    | deferred   | drawer                |
| 24 | umamiSelfHost          | in        | API token                        | manual + 15-min cache                        | L1 card                       | 3    | deferred   | drawer                |
| 25 | fathomCloud            | in        | API token                        | manual + 15-min cache                        | L1 card                       | 3    | rejected   | n/a                   |
| 26 | cloudflareWebAnalytics | in        | account token                    | manual + 15-min cache                        | L1 card                       | 3    | planned    | card                  |
| 27 | vercelAnalytics        | in        | n/a (not on Vercel)              | n/a                                          | n/a                           | —   | rejected   | n/a                   |
| 28 | postHog                | both      | project API key                  | events out + funnels in                      | Integrations row              | 4    | deferred   | drawer                |
| 29 | hotjar                 | in        | embed only                       | n/a (third-party iframe)                     | siteSettings → public site   | 4    | rejected   | n/a                   |
| 30 | sentryIngest           | out       | DSN                              | runtime errors                               | env (no row)                  | L    | live       | none                  |
| 31 | betterStackUptime      | both      | API token                        | downtime alerts → Teams                     | external; status link in L1   | 3    | live       | L1 link tile          |
| 32 | logflareAxiom          | out       | source token                     | structured logs                              | env (no row)                  | 3    | deferred   | none                  |
| 34 | calComInbound          | in        | webhook signing secret           | booking.created → leads                     | Integrations row              | 4    | planned    | log + lead link       |
| 35 | linkedInLeadGen        | in        | OAuth + LinkedIn Marketing perms | lead form sync (poll)                        | Integrations row              | 4    | deferred   | drawer                |
| 36 | brevoBounceCallback    | in        | webhook signing secret           | bounce/complaint → leads.emailHealth        | hook silent + audit           | L    | planned    | per-lead badge        |
| 37 | turnstileSiteVerify    | in        | secret key                       | per submission                               | env (no row)                  | L    | live       | none                  |
| 38 | stripeInbound          | in        | webhook signing secret           | n/a                                          | n/a                           | —   | rejected   | n/a                   |
| 39 | r2Storage              | both      | access keys                      | media upload                                 | env (no row)                  | L    | live       | none                  |
| 40 | meilisearchIngest      | out       | master key                       | document.published                           | env (no row)                  | L    | live       | none                  |

**Legend** — `tier`: 1 chat fan-out · 2 CRM · 3 analytics/SEO · 4 comms/extras · L launch-tier (already wired). `direction`: out (CMS → service), in (service → CMS), both. `status`: live · planned (Phase J target) · deferred (post-J) · rejected (not building) · open Q (see §10).

---

## §2 Analytics & SEO read-back (the gap v1 doesn't cover)

v1 is exclusively *outbound*. Editors today have no way to see how a published page is performing without leaving `/admin`. §2 closes that gap.

### 2.1 GA4 Data API (row #15)

- Auth: service-account JSON, GA4 property granted Viewer role.
- Library: `@google-analytics/data` (`BetaAnalyticsDataClient.runReport`).
- Cached per `(propertyId, url)` for 15 min in a `analyticsCache` table (`provider, key, fetchedAt, payload jsonb`); on cache miss, refresh in a job, return last-known payload with a `stale` badge.
- Surfaces:
  - **L1 dashboard card** — sessions / users / engagement-rate / conversions site-wide last 7 / 28 days.
  - **L2 per-document tab** — same metrics filtered by `pagePath = seo.canonicalUrl || resolvedSlug`; small Recharts sparkline.
- Cost: free tier easily covers a CMS; quota is 25k tokens/day per property — cache absorbs this.

### 2.2 GSC Search Analytics API (row #17)

- Auth: same service-account JSON as #15/#16/#18 (one row, three GSC permissions).
- Endpoint: `searchanalytics.query` — dimensions `[query, page]`, last 28 days.
- Surfaces: L1 card "Top queries last 28 days", L2 per-doc "Top 10 queries for this URL" with impressions / clicks / CTR / avg position.
- Cache: daily refresh job; per-URL on first view of a document.

### 2.3 GSC URL Inspection API (row #18)

- Same auth as #17.
- Per-document button "Inspect in GSC" → drawer showing indexing status, last crawl date, mobile usability, rich-results validity, AMP status (n/a for us).
- Quota: 2k QPD per property — gated behind a click, not auto-refreshed.

### 2.4 Microsoft Clarity (row #21)

- Auth: Clarity project Bearer token (created in Clarity → Settings → API). One token per project.
- Endpoint: Data Export API — daily aggregates of dead-clicks, rage-clicks, excessive-scroll, JS-errors, scroll-depth, by URL.
- Surfaces:
  - **L1 card** — "Worst pages by dead-clicks (7d)" table.
  - **L2 per-doc embed** — Clarity Heatmap and Recordings via signed share URL in an iframe inside a drawer. Clarity supports iframe embeds with `?webMasterId=…&projectId=…`; we proxy through `/api/dashboards/clarity/embed?docId=…` so the token never reaches the client.
- Quota: 10 API calls per day per project — daily cache only.

### 2.5 GTM server-side container (row #22)

- Trade-off vs current GTM-web in `siteSettings.analytics`:
  - **Pros**: tag survives ad-blockers, first-party cookie domain, lower client payload.
  - **Cons**: requires a Cloud Run / GAE container ($), redirects measurement traffic through an owned subdomain (`tag.cleanstart.com`), DNS + TLS work.
- Recommendation: defer until GA4 client-side coverage gap is measured (compare GA4 Data API sessions vs Cloudflare Web Analytics pageviews — discrepancy = ad-block rate). See §10 Q3.

### 2.6 Privacy-first alternatives

| Tool                     | Cookieless | Self-host | API for read-back | Recommend if…                                                                                                  |
| ------------------------ | ---------- | --------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Cloudflare Web Analytics | yes        | n/a       | yes (account API) | already on CF; want a free no-cookie pageview gut-check (row #26 — planned alongside GA4 to size ad-block gap) |
| Plausible (self-hosted)  | yes        | yes       | yes               | drop GA4 entirely (deferred — row #23)                                                                         |
| Umami (self-hosted)      | yes        | yes       | yes               | smaller footprint than Plausible (deferred — row #24)                                                          |
| Fathom (cloud)           | yes        | no        | yes               | rejected — adds vendor with no advantage over CF WA                                                            |
| Vercel Analytics         | yes        | no        | n/a               | rejected — `apps/cms` doesn't run on Vercel (it's on the droplet); Vercel Web Analytics covers `apps/web` separately |

### 2.7 Product analytics (rows #28, #29)

- **PostHog** — funnels, session-replay, feature flags. Deferred until lead-funnel attribution (form impression → field focus → submit) becomes a stated requirement.
- **Hotjar** — rejected; Microsoft Clarity (#21) is free and overlaps the same use cases.

---

## §3 Notification fan-out (extends v1 §1, §2)

v1 covers Teams in detail. §3 standardises the row-shape across Teams + Generic Webhook so they reuse the same Integrations admin surface. (Slack / Discord / Twilio / Brevo digest are cut — see §11.)

### 3.1 Teams Workflows (row #1)

- v1 §1 is authoritative. Verify the Workflows path is the only path remaining — Office 365 Connector retired 2026-05-18 (now past). Existing env-driven `lib/webhooks/teams.ts` already speaks Adaptive Card; migrating to the Integrations row is a transport swap, not a payload change.

### 3.2 Generic Standard Webhooks (row #5)

- Already coded in `lib/webhooks/{dispatch,sign}.ts`. Document for editors:
  - Signing header is `webhook-signature` (Standard Webhooks RFC).
  - Replay protection: `webhook-id` is unique per delivery; receiver must dedup over a 5-minute window.
  - Receiver examples: Zapier ("Webhooks by Zapier" — Catch Hook with secret), n8n (Webhook node + HMAC verify), Make (Custom webhook + signature module), Pipedream (HTTP source).
- Doubles as the escape hatch for any "we'd like to ping X" channel (Slack/Discord/etc.) by routing through Zapier/n8n — that's why Slack and Discord rows were dropped.

### 3.3 Per-row admin affordances (promoted from v1 §3)

Every row in §1 with `direction: out` exposes:

- **Test** — synthesise a fixture event matching `routing.events[0]`, fire to the configured destination, show HTTP status + response body in a toast.
- **Health badge** — `green` (0 dead-letters in 24h) · `yellow` (1–2) · `red` (≥3). Reads `webhooks_dead_letter` count grouped by `integrationId`.
- **Pause** — `enabled = false` toggle that disables dispatch without deleting the row.
- **Audit trail** — last 50 deliveries from `webhooks_dead_letter` + `webhooks_audit` with redacted bodies (config secrets and PII masked).

These four are uniform — same React component, parameterised by `kind`.

---

## §4 Inbound integrations (new in v2)

v1 only covers CMS-as-sender. §4 covers CMS-as-receiver: third parties POST to `cms.cleanstart.com/api/integrations/[provider]`, we verify, normalise, and write through the existing `LeadHandler` chain or a domain-specific handler.

### 4.1 Generic inbound shape

- Route: `apps/cms/src/payload/endpoints/integrations-inbound.ts` mounting `POST /api/integrations/[provider]`.
- Verification: per-provider handler in `lib/integrations/inbound/[provider].ts` exporting `verify(req): { valid: boolean, eventId: string, payload: T }`.
- Idempotency: `integrationsInboundLog(provider, eventId, receivedAt, status)` with unique `(provider, eventId)`. Replay within 5 min returns the original status.
- Errors: 4xx for signature mismatch (no retry), 5xx for downstream failure (provider retries naturally).

### 4.2 Cal.com (row #34)

- Signed webhook (`X-Cal-Signature-256`).
- `BOOKING_CREATED` → `submitLead()` with `source: 'calcom'`, prefilled email/name from the invitee record.
- Dashboard: log-only — leads land in the existing Leads list. Add a `source` chip in the leads list cell.
- Calendly was cut (§11) — sales picked Cal.com. If that flips, swap the verifier; the lead-shape stays.

### 4.3 LinkedIn Lead Gen Forms (row #35) — deferred

- Document the auth model (LinkedIn Marketing Developer Platform, requires app review + Marketing API access). Webhook delivery exists but partner approval is a multi-week ask; defer until ad spend justifies it.

### 4.4 Brevo bounce/complaint callbacks (row #36)

- Brevo can POST `hard_bounce` / `complaint` / `unsubscribed` events to a webhook URL.
- Handler updates `leads.emailHealth` (`'good' | 'soft_bounce' | 'hard_bounce' | 'complaint' | 'unsubscribed'`) and surfaces a coloured chip in the Leads list.
- Prevents resending Brevo transactional to a poisoned address; CRM sync still fires.

### 4.5 Stripe (row #38)

- Rejected. No ecommerce in arch doc. Re-evaluate only if billing comes in scope.

### 4.6 Cloudflare Turnstile siteverify telemetry (row #37)

- Already live as part of lead submission. Surface failure rate in L1 dashboard (Webhook health card) so editors notice if a form starts rejecting humans (false positives → broken funnel).

---

## §5 Admin dashboard UX

Three layered surfaces. Wireframes are ASCII so design has a starting point without a Figma round-trip; map 1:1 to L1 / L2 / L3 named in the headings.

### 5.1 L1 — Global dashboard cards

Lives in the existing `admin/components/Dashboard.tsx`. Each card is a Payload-admin server component that calls `/api/dashboards/[provider]` (15-min cached). On cache miss the card renders its last-known payload with a `· stale ·` chip and a refresh icon.

```
+------------------------------------- /admin (Dashboard) -------------------------------------+
|                                                                                              |
|  +--- Lead funnel (28d) ---+  +--- GA4 sessions (28d) ---+  +--- GSC clicks (28d) -------+   |
|  |  Submitted     1,284    |  |  Sessions     42,108     |  |  Clicks      6,210         |   |
|  |  Synced→CRM    1,201    |  |  Users        29,447     |  |  Impressions 184,902      |   |
|  |  Dup           53       |  |  Conv. rate   1.9%       |  |  CTR         3.4%         |   |
|  |  Failed        30 (red) |  |  · stale 4m ·  ↻         |  |  Avg pos     14.2         |   |
|  +--- Open report ------> +  +--- Open in GA4 ------>   +  +--- Open in GSC ------>   +     |
|                                                                                              |
|  +--- Clarity (7d) -------+  +--- CF Web Analytics (7d) +  +--- Webhook health (24h) --+    |
|  |  Worst page  /pricing  |  |  Pageviews   58,213      |  |  Teams       ● green       |   |
|  |  Dead clicks  423      |  |  Visits      31,008      |  |  Brevo       ● green       |   |
|  |  Rage clicks  82       |  |  Top country US 41%      |  |  Generic     ● yellow (2)  |   |
|  |  Recordings   View →   |  |                          |  |  Zoho CRM    ● red (5)     |   |
|  +--- Open in Clarity --> +  +--- Open in CF -------->  +  +--- Open admin --------->  +    |
|                                                                                              |
|  +--- Status (BetterStack) -------+  +--- Recent publishes (7d) -----------------------+    |
|  |  cms.cleanstart.com  ● up    |  |  Pages   12   Blogs    8   News   3            |    |
|  |  www.cleanstart.com    ● up    |  |  Latest: "How we …"  · Marc · 2h ago           |    |
|  +-------------------------------+  +-------------------------------------------------+    |
+----------------------------------------------------------------------------------------------+
```

### 5.2 L2 — Per-document analytics tab

Custom Payload field component mounted on the document edit view of `Pages`, `Blogs`, `News`, `Guides`, `Resources`, `KnowledgeBase`, `Webinars`, `Events`. Pulls metrics for `seo.canonicalUrl ?? resolvedSlug`.

```
+--- Edit · Blog · "How we shipped Cleanstart 2.0" -------------------------------------------+
| [ Content ] [ SEO ] [ Analytics ] [ Versions ]                                               |
|                                                                                              |
|  ── GA4 (last 28 days) ─────────────────────────────────────────────────                     |
|  Sessions  3,108     Users  2,210    Avg engagement  1m 42s    Conversions  47               |
|  ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇▆▅▃▂▁▂▃▅▆▇  ← 28-day sparkline                                            |
|                                                                                              |
|  ── GSC top queries (last 28 days) ─────────────────────────────────────                     |
|  query                            impressions  clicks   CTR    avg pos                      |
|  cleanstart 2.0                       8,402      612    7.3%    4.1                         |
|  payload cms migration                3,108      201    6.5%    8.7                         |
|  …                                                                                           |
|  [ Inspect URL in GSC ]   ← GSC URL Inspection API on click                                  |
|                                                                                              |
|  ── Microsoft Clarity ──────────────────────────────────────────────────                     |
|  Dead clicks 12   Rage clicks 3   Scroll depth (median) 68%                                  |
|  [ Open heatmap ]   [ View 4 recordings ]   ← signed iframe in drawer                        |
+----------------------------------------------------------------------------------------------+
```

### 5.3 L3 — Integrations admin (new collection)

Replaces the env-var sprawl in §1 launch-tier rows. List view + per-row drawer.

```
+--- /admin/collections/integrations ---------------------------------------------------------+
| + New integration   [ kind ▾ ] [ enabled ▾ ] [ health ▾ ]                Search ____________ |
|                                                                                              |
|  label                          kind          health   events            updated             |
|  Sales channel · #sales-eng     teamsWorkflow ● green  doc.pub, lead     2026-05-07  ⋮       |
|  Brevo bounce callback          brevoBounceCb ● green  inbound           2026-05-04  ⋮       |
|  Zoho CRM (EU DC)               zohoCrm       ● red 5  lead.submitted    2026-05-08  ⋮       |
|  Generic webhook · n8n flow     genericWebhook ● yellow 2  all           2026-05-06  ⋮       |
|  GA4 Data API · cleanstart.com  ga4DataApi    ● green  read-back         2026-05-08  ⋮       |
|                                                                                              |
+----------------------------------------------------------------------------------------------+

           ↓ click row → drawer

+--- Drawer · "Zoho CRM (EU DC)" ─────────────────────────────────────────+
|  Kind         zohoCrm  (locked after creation)                          |
|  Label        Zoho CRM (EU DC)                          [ Pause ]       |
|  Config       Data centre  zoho.eu                                      |
|               Refresh token  •••••••••                  [ Reauth ]      |
|               Field mapping  Lead.Email ← submission.email   …          |
|  Routing      Events  [ lead.submitted ]                                |
|               Forms   [ contact ] [ demo-request ] [ deal-registration ]|
|               Min lead score  (none)                                    |
|  Health       ● red — 5 dead-letters in last 24h                        |
|               [ View dead-letter queue ]                                |
|  Audit        2026-05-08 14:02  lead#1842  201 OK                       |
|               2026-05-08 14:04  lead#1843  401 — token expired          |
|               …                                                         |
|  Actions      [ Test ]  [ Save ]  [ Delete ]                            |
+-------------------------------------------------------------------------+
```

Three surfaces map cleanly to three concerns: **L1** "what's happening", **L2** "how is *this* doc doing", **L3** "what is wired and is it healthy". No `/dashboard` route outside the Payload admin — cited arch-doc decision.

---

## §6 Auth & secrets model

### 6.1 Migration path: env-vars → Integrations rows

Phase J ships the `integrations` collection. Existing env-var-driven integrations (Brevo transactional, Teams Workflow, Generic webhook, IndexNow, Sentry, R2, Meilisearch) are *not* mass-migrated — they stay env-driven for ops simplicity. The migration is opt-in per row: when an editor adds, e.g., a second Teams channel, the new row takes precedence and the env-driven row is shown as "Legacy (env)" in the list with a one-click "Migrate to row" action.

### 6.2 Per-row config encryption

Decision: **app-layer `node:crypto` AES-256-GCM**, key derived from `PAYLOAD_SECRET` via HKDF, IV per row.

- Pros: portable across Postgres providers (no `pgcrypto` extension dependency on the deploy droplet); rotation = update `PAYLOAD_SECRET` + re-encrypt; isolated test seam.
- Cons: encrypted column is opaque to SQL — accept it; we never query inside `config`.

Library: stdlib only. Helper at `lib/integrations/secrets.ts` exports `encrypt(plain): string` / `decrypt(cipher): string`. Stored as base64 with version prefix `v1:` to allow future algorithm migration.

### 6.3 OAuth callback route shape

Single route `apps/cms/src/payload/endpoints/oauth-callback.ts` mounting `GET /api/oauth/callback/[provider]`. Per-provider handler verifies `state` (CSRF + integrationId nonce stored in a short-lived cookie), exchanges `code` for tokens, persists to the row's `config`, redirects back to `/admin/collections/integrations/[id]`.

### 6.4 Service-account JSON storage

Service-account JSON (GA4, GSC, Sheets) is stored in the row's encrypted `config` blob, not in R2. Editor uploads the JSON file via a custom field component that base64-encodes client-side, posts it to the encrypted column, and never round-trips the plaintext through the Payload list view (file input is write-only; UI shows `••••• valid since 2026-05-08`).

---

## §7 Caching, quotas, cost

| Provider                 | Quota                             | Cache tier             | Refresh             | Cost note                              |
| ------------------------ | --------------------------------- | ---------------------- | ------------------- | -------------------------------------- |
| GA4 Data API             | 25k tokens/day per property       | analyticsCache 15 min  | on-demand + cron    | free                                   |
| GSC Search Analytics     | 1.2k QPM, 30k QPD per site        | analyticsCache 24h     | nightly cron        | free                                   |
| GSC URL Inspection       | 2k QPD per site                   | none — gated by click | manual              | free                                   |
| GSC Indexing API         | 200 publishes/day per project     | none                   | on document.publish | free                                   |
| MS Clarity Data Export   | 10 calls/day per project          | analyticsCache 24h     | nightly cron        | free                                   |
| Cloudflare Web Analytics | account-wide soft limits          | 15 min                 | on-demand           | free                                   |
| Brevo                    | plan-dependent (free 300/day)     | n/a                    | per-event           | within current plan for transactional  |
| Zoho CRM                 | 5k API calls/day (Enterprise)     | none                   | per-event           | within plan                            |
| Teams Workflow webhook   | 30 req / 30s per workflow         | n/a                    | per-event           | free                                   |

`analyticsCache` is a single Postgres table keyed by `(provider, scope, key)`. Cron jobs `dashboardRefreshDaily` (GSC, Clarity) and `dashboardRefreshFrequent` (GA4, CF WA) populate it; on-demand reads fall back to last-known on miss.

---

## §8 Privacy / GDPR

- Reuse v1 §`#privacy-gdpr` for outbound rules. v2 read-back additions:
  - GA4 Data API and GSC return aggregates only — no PII surface in the dashboard.
  - Clarity recordings can capture form input. Configure Clarity to mask all input fields by default (Clarity Settings → Masking → "Mask all"); document this in the `msClarity` row's drawer.
  - Cal.com inbound payloads carry PII; route through `LeadHandler` (mandatory per CLAUDE.md) so DSAR cascade picks them up.
  - `analyticsCache` rows are aggregate-only — DSAR cascade ignores them.
- Consent mode: existing `siteSettings.analytics.consentMode` continues to gate the *public-site* tag. Server-side reads (GA4 Data API, GSC, Clarity) are not consent-gated — they read what the user already consented to via the public site.

---

## §9 Phase J scope proposal

Three milestones. Each cites v1 anchors so scope deltas vs v1 are explicit.

### J1 — Integrations collection + outbound parity (1.5 weeks)

- **Scope**: ship `collections/integrations.ts`, encryption helper (§6.2), Test/Health/Pause/Audit row affordances (v1 §3.4), migrate Teams (v1 §1) + Generic Standard Webhooks (v1 §3.3 reuse) onto rows. Slack / Discord are intentionally out — Generic Webhook + Zapier/n8n covers those use cases.
- **Out**: CRM rows, analytics, inbound webhooks.
- **Depends on**: nothing — `webhooks_dead_letter` already exists (Phase G).
- **Verifies J2/J3**: row schema + drawer pattern is validated before harder integrations layer in.

### J2 — Analytics read-back + dashboard cards (2 weeks)

- **Scope**: `analyticsCache` table + cron jobs, GA4 Data API (#15) + GSC Search Analytics (#17) + GSC URL Inspection (#18) + MS Clarity (#21) + Cloudflare Web Analytics (#26). L1 cards (§5.1) and L2 per-doc tab (§5.2). Adds nothing to v1 §`#tier-3` outbound (GA4 Measurement Protocol + IndexNow are unchanged).
- **Out**: GTM server-side (#22 — see §10 Q3), Plausible/Umami (#23/#24).
- **Depends on**: J1 (Integrations row + secrets helper).

### J3 — CRM rows, starting with Zoho (1.5 weeks)

- **Scope**: `zohoCrm` row (#9) per v1 §`#tier-2` — DC-scoped, OAuth refresh, field-mapping UI in drawer, `deleteByEmail` cascade for DSAR. (Google Sheets fallback was cut — Zoho's own retry + the `webhooks_dead_letter` queue are the audit trail.)
- **Out**: HubSpot/Salesforce/Pipedrive (#10/#11/#12) — build on demand.
- **Depends on**: J1 (drawer pattern), §6.3 OAuth callback route.

### J4+ (deferred)

Cal.com inbound (#34), Brevo bounce (#36), additional CRMs. Trigger: editor demand, not calendar.

---

## §10 Open questions

- **Q1 — env-var rows in the list view.** Show legacy env-driven integrations (Brevo, Sentry, R2, Meilisearch, IndexNow) as read-only rows in the L3 list with `source: env`, or hide entirely and only show DB-backed rows? **Recommendation**: show as read-only — single pane of glass beats hidden state. Editors learn the surface once.
- **Q2 — Clarity recording embeds & SOC2.** Clarity iframe pulls a third-party script into the admin origin. Acceptable inside the authenticated Payload admin (tight CSP, admin-only audience), or proxy-render screenshots only? **Recommendation**: iframe, with an `integrations.clarity.embedAllowed = false` kill switch and a CSP allowance scoped to `/admin/integrations/clarity/*`.
- **Q3 — GTM server-side container.** Build now, or wait? **Recommendation**: wait. Run J2 first; size the gap between GA4 Data API sessions and CF Web Analytics pageviews; revisit if gap > 25%.
- **Q4 — Lead score field.** v1 §5 left this open. Drop `routing.minLeadScore` from J1 and re-introduce when scoring lands, or ship a no-op field now? **Recommendation**: drop from J1; add together with the first scoring rule. Avoids a dangling field that always reads "0".
- **Q5 — Per-doc analytics tab on which collections?** Listed eight in §5.2; do `Webinars`/`Events` warrant it pre-launch? **Recommendation**: enable on all eight; cost is one component mounted via a shared `withAnalyticsTab(collection)` wrapper, not per-collection code.
- **Q6 — analyticsCache shared across environments?** Staging querying prod GA4 property would pollute the cache. **Recommendation**: scope cache key by `(env, provider, …)` and never read prod credentials in staging — staging configures its own (or empty) Integrations rows.
- **Q7 — Default channel routing day-1** (carried from v1 §5 Q1). **Recommendation**: J1 ships the env-driven Teams row as a "Legacy" row in the list; no auto-seed. First DB row is editor-created.

---

## §11 Pruned shortlist (what actually ships) + droplet load analysis

The §1 catalog lists 34 rows for completeness — most are *catalog entries*, not commitments. §11.1 ranks the keep list by editor value across J1/J2/J3. §11.2 answers the harder question: **what burns droplet CPU/RAM/disk?** Running everything on one droplet means every cron, every cached payload, and every custom admin component runs on the same box as Postgres + Payload + Meilisearch — free APIs are not free at runtime.

### 11.1 Keep list — ranked by editor value

**Must-have (J1)** — closes existing gaps:

- **#1 teamsWorkflow** (live → migrate to row)
- **#5 genericWebhook** (live → migrate to row; Zapier/n8n/Make escape hatch — also the path for ad-hoc Slack/Discord pings without owning a row per channel)
- **#9 zohoCrm** (planned — Zoho is in active use today; no CRM auto-sync today is the biggest miss)

**High-value (J2)** — turns the admin into a real workspace:

- **#15 ga4DataApi** + **#17 gscSearchAnalyticsApi** + **#18 gscUrlInspectionApi** — the three that justify L1 dashboard cards and the per-doc Analytics tab.
- **#21 msClarity** — free, low-friction, gives qualitative "why does this page underperform" answers GA4/GSC can't.
- **#26 cloudflareWebAnalytics** — cookieless second opinion; cheap to wire (single API token) and the most useful gut-check against GA4 ad-block loss.

**Useful (J3 / on demand)**:

- **#14 ga4MeasurementProto** — server-side `generate_lead` events bypass ad-blockers. Pairs with #15 (read-back) but adds ~zero load (one fire-and-forget POST per lead).
- **#16 gscIndexingApi** — already drafted in v1, low cost, ships on `document.published`.
- **#34 calComInbound** — booking → lead with `source: 'calcom'`.
- **#36 brevoBounceCallback** — small, prevents poisoning the transactional sender reputation.
- **#37 turnstileSiteVerify** — already live; surface the failure-rate metric in the L1 webhook-health card.

**Already live, env-driven, leave alone**: #6 brevoTransactional, #19 indexNow, #30 sentryIngest, #31 betterStackUptime, #37 turnstileSiteVerify, #39 r2Storage, #40 meilisearchIngest. Show them in the L3 list as `source: env` (per §10 Q1) but don't migrate.

### 11.2 Droplet load — what each integration actually costs

The production droplet runs Payload (Next.js) + Postgres + Meilisearch + cron. Sizing assumption: 2 vCPU / 4 GB droplet (single-node). Anything that adds steady CPU% or a meaningful Postgres row count needs to be called out.

| #     | row                     | CPU steady       | RAM   | Postgres rows / day            | Disk  | Network egress | Notes                                                                                                                            |
| ----- | ----------------------- | ---------------- | ----- | ------------------------------ | ----- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1     | teamsWorkflow           | negligible       | —    | per-event audit only           | —    | tiny           | One outbound POST per publish/lead.**Free.**                                                                               |
| 5     | genericWebhook          | negligible       | —    | per-event audit only           | —    | tiny           | HMAC sign on emit; no extra cost.                                                                                                |
| 9     | zohoCrm                 | low              | —    | per-lead audit only            | —    | small          | Sync per `lead.submitted` (~tens/day at launch). OAuth refresh hits Zoho once / hour.                                          |
| 14    | ga4MeasurementProto     | negligible       | —    | none                           | —    | tiny           | Fire-and-forget POST per lead.                                                                                                   |
| 15    | ga4DataApi (read-back)  | **medium** | small | analyticsCache rows ≈ 100/day | small | small          | Cron every 15 min site-wide + on-demand per-doc.**Mitigation**: cache aggressively, never call from a request hot path.    |
| 16    | gscIndexingApi          | negligible       | —    | per-publish audit only         | —    | tiny           | Quota gate is 200/day — natural ceiling.                                                                                        |
| 17    | gscSearchAnalyticsApi   | low              | small | analyticsCache rows ≈ 50/day  | small | small          | Daily cron; per-doc cache.**Cheap.**                                                                                       |
| 18    | gscUrlInspectionApi     | negligible       | —    | none (no cache)                | —    | tiny           | On-click only.                                                                                                                   |
| 19    | indexNow                | negligible       | —    | per-publish audit only         | —    | tiny           | Already live.                                                                                                                    |
| 21    | msClarity               | low              | small | analyticsCache rows ≈ 30/day  | small | small          | Daily cron only (Clarity quota is 10 calls/day per project — natural cap).                                                      |
| 26    | cloudflareWebAnalytics  | low              | small | analyticsCache rows ≈ 100/day | small | small          | 15-min cache, single account-wide call.                                                                                          |
| 34    | calComInbound           | negligible       | —    | per-event idempotency log      | —    | tiny           | Inbound POST is cheap; verify HMAC then enqueue.                                                                                 |
| 36    | brevoBounceCallback     | negligible       | —    | per-event update on `leads`  | —    | tiny           | One UPDATE per bounce.                                                                                                           |
| 37    | turnstileSiteVerify     | negligible       | —    | none                           | —    | tiny           | Already live.                                                                                                                    |

**The four loads to watch** — none are deal-breakers, all need conscious mitigation:

1. **Custom dashboard SSR cost (L1 cards).** Every `/admin` page-load currently re-renders the custom Dashboard. Six new server-rendered cards × N concurrent editors = real CPU. **Mitigation**: each card reads from `analyticsCache` only — never makes a live API call from the request path. Cache miss → render the last-known payload + `· stale ·` badge; refresh happens in the background cron, not the request.
2. **Cron-job concurrency on a 2-vCPU droplet.** GA4 (every 15 min), CF WA (every 15 min), GSC (daily), Clarity (daily), plus the existing four jobs (`leadQueueDrain`, `searchLogPurge`, `leadsPiiPurge`, `brokenLinksScan`). **Mitigation**: stagger schedules (GA4 at `*/15`, CF WA at `7,22,37,52`); cap concurrency via Payload's job runner; never run two analytics jobs in the same minute.
3. **`analyticsCache` table growth.** ~280 rows/day is fine, but unbounded growth over a year is ~100k rows. Single table, JSONB payloads → keep an eye on bloat. **Mitigation**: TTL job that deletes rows older than 90 days; index on `(provider, scope, key, fetchedAt DESC)`; partial unique on the latest row per key.
4. **`webhooks_dead_letter` growth under a sustained outage.** Existing Phase G table — not v2's fault — but every new outbound integration multiplies its growth rate during incidents. **Mitigation**: keep the Phase G TTL job; the L1 webhook-health card already surfaces sustained red so editors notice before it gets bad.

**Things that would have hurt and we cut**: self-hosting Umami / Plausible (Postgres or ClickHouse on the droplet — direct CPU + RAM + disk hit), GTM server-side container (separate runtime), PostHog self-hosted (Postgres + ClickHouse + Kafka — would need its own droplet), Logflare/Axiom shipper (per-log-line CPU overhead). Slack / Discord / Twilio / Sheets / Calendly were also cut — Generic Webhook + Zapier covers ad-hoc channel pings, and the booking + SMS rows had no current editor demand.

**Net droplet impact of the keep list**: small. The expensive things are kept *off* the droplet (GA4 / GSC / Clarity / CF WA all run in their respective clouds; we only fetch aggregates on cron). Estimated steady-state addition: ~3–5% CPU, ~50–100 MB RAM (Postgres cache + cron workers), ~1 GB/year disk for `analyticsCache` after pruning.

---

## Sources

- v1 [`INTEGRATIONS-RESEARCH.md`](./INTEGRATIONS-RESEARCH.md) — outbound shape, Teams deep-dive, encryption + DLQ reuse, open questions carried forward.
- Arch doc `cleanstart-cms-architecture.html` §`#new-fields`, §`#forms`, §`#privacy-gdpr`, §`#logging-alerting`, §`#decisions`, §`#marketing-tags`.
- Code: `apps/cms/src/payload/lib/webhooks/{dispatch,teams,sign}.ts`, `lib/lead-handlers/registry.ts`, `globals/siteSettings.ts`, `admin/components/Dashboard.tsx`, `.env.example`.
- BACKLOG.md "Future — Integrations dashboard" (existing Phase J sketch + schema stub).
