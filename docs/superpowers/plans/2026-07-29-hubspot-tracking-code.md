# HubSpot Tracking Code + Lead Attribution Repair — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give HubSpot contact records person-level page-view history and correct source attribution, by installing the HubSpot tracking code on `apps/web` and threading the visitor's `hubspotutk` token through the existing server-side lead relay.

**Architecture:** The tracker is a **client-side** script that sets a first-party `hubspotutk` cookie and records page views against an anonymous token. Our lead pipeline is **browser → CMS (`/api/leads/submit`) → HubSpot Forms API**, so the token must be read in the browser, carried in the existing `context` object of the lead payload, and forwarded by the relay as `context.hutk`. Without that handoff HubSpot receives an unlinked submission and stitches nothing — **installing the script alone delivers no attribution.** The tracker is loaded lazily (not in `<head>`) because, unlike GA4, nothing requires it to be present in the HTML source, and the cookie only has to exist by the time a form is submitted.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Payload 3.81 · Zod · `@hubspot/api-client` (already a dependency) · Vitest.

---

## Pre-existing defect this plan also fixes (independent of the tracker)

**Every HubSpot contact created since launch has the wrong geolocation.** HubSpot derives a contact's IP-location properties from the source IP of the submission. Our relay posts from the CMS droplet, so HubSpot geo-locates every lead to the droplet's datacenter rather than the visitor. HubSpot's IP-location properties **cannot be manually overridden after the fact**, so this is not repairable retroactively — only forward-fixable.

The relay currently sends only `context: { pageUri }` ([`hubspot.ts:166`](../../../apps/cms/src/payload/lib/lead-handlers/hubspot.ts)). The fix is to pass `context.ipAddress`. The CMS already has a `client-ip.ts` helper and the browser posts **directly** to `cms.cleanstart.com`, so the real visitor IP is available at the endpoint — it simply is not threaded through.

**Task 1 fixes this and is worth shipping even if the rest of this plan is rejected.**

---

## CTO Decision Record (proposed — D3 needs sign-off before build)

| # | Decision | Rationale | Rejected alternative |
|---|----------|-----------|----------------------|
| D1 | Load the tracker **lazily**, after LCP — not in `<head>` | Mobile LCP p75 is 2722ms against a 2500ms budget (222ms headroom, CrUX 2026-07). The tracker has no source-presence requirement and the cookie is only needed at form-submit time, which is far later than page load | `<head>` placement as with GA4 — spends scarce LCP budget for zero benefit here |
| D2 | Classify as **Targeting** consent category | It profiles identifiable individuals for sales use, exactly like Leadfeeder. It cannot ride GA4's un-gated treatment | Performance category — misclassifies profiling as aggregate analytics |
| D3 | **OPEN — see "Decision required" below.** Gate purely on the Targeting toggle, or add region-awareness | Materially changes coverage | — |
| D4 | Thread `hutk` through the **existing `context` object** in the lead payload | `/api/leads/submit` already accepts `context` (it carries `resourceId` for gated downloads), so no schema redesign | A new top-level field — needless surface change |
| D5 | Derive the CSP allowlist **empirically** from report-only violations, not from a guessed domain list | HubSpot's beacon/asset domains vary by which Hub features are enabled; a guessed list silently breaks tracking or over-permits. We already run a `/api/csp-report` endpoint and a report-only mode | Hardcoding a domain list from a blog post |
| D6 | Suppress HubSpot's **own** cookie banner | We have our own CMP (`ConsentProvider`); two banners is a compliance and UX defect | Letting HubSpot render its banner |
| D7 | SPA route changes emit `setPath` + `trackPageView` via a dedicated client component | HubSpot's tracker does not observe App Router navigations, the same gap `Ga4RouteTracker` fills for GA4 | Relying on the tracker's own history detection — records the pre-navigation path |

---

## Decision required before build (D3): tracking coverage vs. reach

The Targeting category defaults to **denied** and only flips on an explicit opt-in. Gating the tracker on it means **it runs only for visitors who actively click "Allow All"** — likely a minority. Since the `hubspotutk` cookie must exist *before* the form submission to stitch anything, low opt-in directly translates to low attribution coverage.

| Option | Coverage | Effort | Compliance |
|---|---|---|---|
| **A. Targeting-gated everywhere** (consistent with Leadfeeder today) | Opt-in visitors only | Low | Safest everywhere |
| **B. Region-aware** — gated in EEA/UK/CH, on by default elsewhere | Near-complete for US/India traffic | Medium — needs a client-readable region signal | Defensible, mirrors the GA4 consent split |

Option B cannot reuse the GA4 mechanism. GA4 avoided geo plumbing because Google Consent Mode resolves `region` **server-side**; HubSpot has no equivalent, so region must be determined by us. The viable route is `proxy.ts` reading Vercel's `x-vercel-ip-country` header and setting a coarse, non-PII, JS-readable cookie (e.g. `cs-region=eu|row`) that the gating component reads. This does not fragment the ISR cache, because the HTML is unchanged — only a response header varies.

**Recommendation: ship Option A first, instrument coverage, and only build Option B if measured attach-rate proves too low to be useful.** Option B is additive on top of A.

---

## Risks & mitigations

- **LCP regression** → lazy load (D1); re-check mobile LCP p75 in CrUX 4 weeks post-deploy. Abort criterion: p75 worsens by >100ms with no other explanation.
- **CSP blocks beacons silently** → D5's report-only derivation happens *before* enforcement; Task 6 verifies live beacons.
- **Duplicate cookie banners** → D6.
- **Consent bypass** → the tracker must not load at all pre-consent under Option A. Verify no `hubspotutk` cookie exists before opt-in (Task 9 acceptance).
- **Double-counted page views** → the tracker's initial page view plus a manual `trackPageView` on first mount would double-count the landing page. The route component must skip its first run, exactly as `Ga4RouteTracker` does.
- **Stale banner/privacy copy** → the cookie policy and privacy §6 must list HubSpot cookies. Already flagged as drifting for GA4; this compounds it. **Copy is owner-approved, not agent-written.**

**Rollback:** Fully additive and independently revertible. Unset `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` → no tracker renders anywhere; the `hutk` plumbing then passes `undefined` and the relay behaves exactly as today. Task 1 (ipAddress) is independent and should *not* be rolled back with the rest.

---

## Environment variables (new)

`apps/web/.env.example` — annotated, no real values committed:

```bash
# HubSpot tracking code (client-side). Portal id only — NOT a secret, but the
# tracker is gated on consent and host, so it never loads on preview deploys.
# Unset (local dev, previews) => no tracker renders. Same portal as the
# server-side relay's HUBSPOT_PORTAL_ID in apps/cms.
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=
```

No new CMS variables: the relay reuses existing HubSpot credentials.

---

## Tasks

### Phase 0 — Ship independently of the tracker

- [ ] **Task 1 — Fix HubSpot contact geolocation.** In `apps/cms/src/payload/lib/lead-handlers/hubspot.ts`, add `ipAddress` to the `context` object, sourced from the existing `client-ip.ts` helper via the submit-lead endpoint. Thread the resolved IP onto `LeadSubmission` (`lead-handlers/types.ts`). Unit test: given a submission carrying an IP, the relay body contains `context.ipAddress`; given none, the key is **omitted** (not `null` — HubSpot rejects unexpected nulls).
- [ ] **Task 2 — Add `pageName` to the relay context.** Cheap, improves the HubSpot submission timeline. Source it from the lead payload's existing page metadata; omit when absent.
- [ ] **Task 3 (optional, decoupled) — Evaluate `HUBSPOT_FORWARD_ATTRIBUTION`.** UTM/click-ID forwarding is already built and gated off at [`hubspot.ts:159`](../../../apps/cms/src/payload/lib/lead-handlers/hubspot.ts) because unknown property names 400 the entire submission. If source attribution is the real business need, provisioning the HubSpot contact properties and flipping this flag delivers most of the value with **no** new script, consent question, or perf cost. **Provisioning HubSpot schema requires explicit owner approval — do not create properties unilaterally.**

### Phase 1 — Tracker

- [ ] **Task 4 — `lib/analytics/hubspot.ts`.** Export `hubspotPortalId()` returning the trimmed `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` or `null` when unset/malformed (validate numeric-only, mirroring the GA4 id validator). Reuse `isNoindexHost` so the tracker never runs on `*.vercel.app` — *a host we don't index is a host we don't track*. Co-located Vitest covering unset, malformed, valid, and noindex-host cases.
- [ ] **Task 5 — `components/analytics/HubSpotScript.tsx`.** Client component. Renders `null` unless a portal id resolves **and** consent permits (D3 Option A: `targetingGranted`). Loads `//js.hs-scripts.com/{portalId}.js` via `next/script` with `strategy="lazyOnload"` (D1), `id="hs-script-loader"`, `async defer`. Mount from `GatedAnalytics` alongside `LeadfeederScript`. Must **not** render on the server — no portal id in the HTML source is expected and correct here.
- [ ] **Task 6 — CSP.** Set `CSP_MODE=report-only` on a preview deploy with the tracker enabled, exercise a form, then read `/api/csp-report` to derive the exact required `connect-src`/`img-src`/`script-src` entries. Add only those to `lib/security/csp.ts` with a comment naming the feature that needs each. Update `csp.test.ts`. **Do not guess the domain list (D5).**
- [ ] **Task 7 — `components/analytics/HubSpotRouteTracker.tsx`.** On App Router navigation push `['setPath', path]` then `['trackPageView']` to `window._hsq`. Skip the first effect run (the tracker's own initial page view already covers the landing page). Mirror `Ga4RouteTracker`'s structure, including the `useSearchParams` → `<Suspense>` requirement. Guard on `_hsq` existing so it is inert when the tracker is gated off.
- [ ] **Task 8 — Suppress HubSpot's cookie banner (D6)** so it never renders alongside `CookieBanner`. Verify in-browser that no HubSpot-rendered banner appears.

### Phase 2 — hutk handoff (the part that creates the attribution)

- [ ] **Task 9 — Read the token in the browser.** Add a small `readHubspotUtk()` helper that reads the `hubspotutk` cookie, returning `undefined` when absent. Include it as `context.hutk` in the payload built by `lib/leads/submitLead.ts`. Must degrade silently: no cookie (consent denied, tracker off) → key omitted, submission proceeds unchanged.
- [ ] **Task 10 — Accept it CMS-side.** Extend the `/api/leads/submit` Zod schema's existing `context` object with an optional `hutk` string, bounded in length and format-validated. Reject nothing on absence.
- [ ] **Task 11 — Forward it.** Add `hutk` to the relay's `context` in `hubspot.ts`, omitted when absent. Unit test both paths.

### Phase 3 — Verification

- [ ] **Task 12 — Pre-consent proof.** In a clean browser profile on a preview deploy: no `hubspotutk` cookie, no `js.hs-scripts.com` request, no `_hsq` global before opt-in. This is the compliance acceptance gate.
- [ ] **Task 13 — End-to-end attribution proof.** Opt in, browse ≥2 pages, submit a real form on the preview deploy, then confirm in HubSpot that the resulting contact shows **both** pre-submission page views and a non-datacenter geolocation. Attribution is not "done" until seen on the contact record — relay 200s prove nothing about stitching.
- [ ] **Task 14 — Performance check.** Capture mobile LCP p75 from CrUX before merge; re-check at +4 weeks (28-day rolling window). Record both in this file.
- [ ] **Task 15 — Copy + docs.** Update the cookie policy and privacy §6 to list HubSpot cookies (**owner-written**). Update `CLAUDE.md`'s integrations table and `WEB-PRODUCTION.md`.

---

## Acceptance criteria

1. No HubSpot network request, cookie, or global exists before consent is granted (Task 12).
2. A form submitted by a consented visitor produces a HubSpot contact with prior page views attached (Task 13).
3. Contact geolocation reflects the visitor, not the CMS droplet (Task 1 + 13).
4. Mobile LCP p75 has not regressed by >100ms attributable to this change (Task 14).
5. `lint ✓ typecheck ✓ build ✓ test ✓` on both `apps/web` and `apps/cms`.
6. CSP is enforced (not report-only) with an allowlist derived from observed violations, and no CSP errors appear in console on a consented session.

---

## Sources

- [HubSpot tracking code JavaScript API](https://developers.hubspot.com/docs/reference/api/analytics-and-events/tracking-code) — `_hsq` queue, `setPath`/`trackPageView` for SPAs, `doNotTrack`, `addPrivacyConsentListener`, `hubspotutk`
- [HubSpot consent banner API](https://developers.hubspot.com/docs/api-reference/latest/account/settings/consent-banner/consent-banner-api)
- [Forms API `context.hutk` and server-side submission](https://community.hubspot.com/t5/APIs-Integrations/Issues-capturing-the-hubspotutk-cookie-in-form-submission-with/td-p/1128001)
- [Server-side submissions attribute IP geolocation to the sending server](https://community.hubspot.com/t5/Lead-Capture-Tools/How-to-get-Geolocaton-data-in-HubSpot/m-p/1253839)
- [Preventing HubSpot tracking prior to consent (CMP integration)](https://support.usercentrics.com/hc/en-us/articles/17295982048156-How-to-prevent-HubSpot-tracking-prior-consent)
