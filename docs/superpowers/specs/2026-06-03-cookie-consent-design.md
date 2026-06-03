# Cookie Consent / CMP — Design Spec

**Date:** 2026-06-03
**Status:** Approved → implementation
**Scope:** Full stack — `apps/web` banner + `/api/consent` + `apps/cms` `ConsentLog` collection
**Source of truth:** `docs/WEB-PRODUCTION.md` §11 (cookie consent), `docs/GDPR-COMPLIANCE.md` §9 + remediation item 1
**Branch:** `development` (shared files in scope; not `farheen`)

---

## 1. Problem

`docs/GDPR-COMPLIANCE.md` flags the web frontend as the single largest compliance gap:
no cookie-consent / CMP exists, no `cs_consent` cookie, no `/api/consent`, no `ConsentLog`.
`@vercel/analytics`, `@vercel/speed-insights`, and the Sentry web-vitals reporter currently
load **unconditionally** in `apps/web/src/app/layout.tsx`. There is no GA4 yet, but CSP already
allow-lists GA4 domains and §11 requires Consent Mode v2 to be in place before any cookie-setting
tracker ships.

This spec builds a GDPR/ePrivacy/UK-PECR/CPRA-compliant consent management layer.

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Audit scope | **Full stack** — client banner + `/api/consent` route + CMS `ConsentLog` collection |
| Geo-gating | **Global banner** — shown to every visitor (conservative; no IP-geo dependency) |
| GA4 Consent Mode | **Scaffold now** — head-injected `gtag('consent','default', …all denied)`, `update` on accept. No-op until GA4 lands |
| Preferences UI | **Inline expansion of the bottom sheet** (not a `Drawer`/`Dialog`) — stays off the intrusive-interstitial path |
| `CONSENT_VERSION` | **Code constant** (bump to force re-prompt); not wired to CMS `legal.privacyPolicyVersion` |

## 3. Architecture

```
apps/web (client)                 apps/web (server)         apps/cms
─────────────────                 ─────────────────         ────────
ConsentProvider (context)  ──►    /api/consent (POST)  ──►  ConsentLog collection
  ├ CookieBanner.tsx              · Zod-validate body        · create-only via CMS_API_KEY
  ├ PreferencesPanel (inline)     · HMAC(ip) + country       · read-only fields, admin-read
  └ useConsent() hook             · forward to CMS REST      · purge cron (J3 retention — deferred)
ConsentModeScript (head)
GatedAnalytics (replaces raw <Analytics/>)
```

- **Client source of truth:** `cs_consent` cookie (1y, `SameSite=Lax`, `Secure` in prod) + `localStorage` mirror, wrapped by `ConsentProvider`. Only the provider touches the cookie.
- **Trackers gate on context**, not scattered cookie reads. `GatedAnalytics` renders
  `<Analytics/>` / `<SpeedInsights/>` / `<WebVitals/>` only when `analytics === 'granted'`.
- **Consent Mode v2** head-injected `beforeInteractive`, all 4 signals `denied`; `consent('update')`
  fires from the provider on accept.

## 4. Consent model & versioning

```ts
type ConsentCategories = { essential: true; analytics: boolean };
type ConsentDecision = "accept_all" | "reject_all" | "custom";
type ConsentRecord = {
  v: number;            // CONSENT_VERSION — bump to force re-prompt
  id: string;           // anonymous id (crypto.randomUUID)
  decision: ConsentDecision;
  categories: ConsentCategories;
  ts: string;           // ISO timestamp
  gpc: boolean;         // was GPC signal present at decision time
};
```

- **Re-prompt** when: no record, `record.v < CONSENT_VERSION`, or `record.ts` older than 12 months.
- **GPC:** `navigator.globalPrivacyControl === true` on first visit → analytics auto-denied,
  banner still shown with Analytics pre-set off, recorded `gpc:true`.
- **Essential** is always `true`, non-togglable.

## 5. UI / UX

Per §11 hard rules — **non-modal bottom sheet, never a centered modal**:

- Slim bar pinned `bottom-0`, `position: fixed`, `z-[60]`, respects `env(safe-area-inset-bottom)`.
  Brand surface (`#151021` family), top border + shadow, `--fs-body-sm` copy, link to
  `/privacy-policy#cookies`.
- **Three actions, equal prominence:** `Reject all` and `Accept all` are siblings with identical
  sizing/weight (one-click parity — CNIL). `Manage preferences` is a tertiary text button.
- **Manage preferences** expands an **inline panel within the same sheet**: Essential (locked,
  "Always on") + Analytics (toggle); panel footer `Save preferences`.
- **Reopen:** a "Cookie preferences" link in `Footer.tsx` re-opens the panel (withdrawal as easy
  as consent — Art. 7(3)).
- Focus-trap while open, `role="dialog"` + `aria-label`, ESC = "no decision" (banner stays),
  full keyboard nav (WCAG 2.2 AA).
- Built from `packages/ui` primitives + design tokens; no ad-hoc type sizes (consume `--fs-*`).

## 6. Data flow / audit log

1. Decision → provider writes cookie + localStorage, updates Consent Mode, then
   `POST /api/consent` (fire-and-forget; failure never blocks UX).
2. `/api/consent` (apps/web, `no-store`): Zod-validate → `country = x-vercel-ip-country`,
   `ipHash = HMAC-SHA256(ip, CONSENT_LOG_HMAC_SECRET)`, `userAgentHash = HMAC-SHA256(ua, …)` →
   forward to CMS REST `POST /api/consent-log` with `CMS_API_KEY`.
3. **`ConsentLog`** (apps/cms) fields: `anonymousId`, `decision`, `categories` (json),
   `consentVersion`, `gpc`, `country`, `ipHash`, `userAgentHash`, `createdAt`. All read-only in
   admin; create-only via API key; **no raw IP/UA stored** (data minimisation). Migration +
   `generate:types` + co-located test.

## 7. SEO / compliance rationale

- No centered interstitial → avoids Google intrusive-interstitial ranking penalty.
- Consent Mode v2 default-denied → GA4 (future) Google-compliant, keeps modeled conversions.
- One-click Reject parity → CNIL/GDPR-safe.
- Banner is fixed overlay (not in document flow), hydrated after content → no CLS on main content,
  protects LCP.
- `#cookies` anchor added to `/privacy-policy` for banner deep-link.

## 8. Error handling & testing

- Typed errors at `/api/consent` (`ValidationError` on bad body; CMS-forward failures swallowed +
  Sentry-logged, never surfaced).
- Cookie/localStorage access wrapped (private-mode safe; degrades to session-only state).
- **Vitest:** consent-state reducer, versioning/expiry logic, `/api/consent` Zod + HMAC derivation.
- **Playwright e2e (`@phase-j-consent`):** zero analytics requests pre-consent; Reject one-click
  parity; reopen from footer; GPC auto-deny.
- **Schema test:** `ConsentLog` type snapshot.

## 9. Files

**apps/web**
- `src/components/consent/ConsentProvider.tsx` — context + cookie/localStorage + Consent Mode update
- `src/components/consent/CookieBanner.tsx` — bottom sheet + inline preferences panel
- `src/components/consent/ConsentModeScript.tsx` — head-injected gtag default-denied
- `src/components/consent/GatedAnalytics.tsx` — consent-gated Analytics/SpeedInsights/WebVitals
- `src/components/consent/index.ts`
- `src/lib/consent/types.ts` — `ConsentRecord` etc.
- `src/lib/consent/state.ts` — reducer, versioning, expiry, cookie codec (pure, unit-tested)
- `src/lib/consent/constants.ts` — `CONSENT_VERSION`, cookie name, max-age
- `src/app/api/consent/route.ts` — POST handler (Zod + HMAC + CMS forward)
- edits: `src/app/layout.tsx` (wrap provider, swap raw analytics for `GatedAnalytics`, add
  `ConsentModeScript` + `CookieBanner`), `src/components/sections/Footer.tsx` (reopen link),
  `src/app/privacy-policy/page.tsx` (`#cookies` anchor)

**apps/cms**
- `src/payload/collections/ConsentLog.ts`
- migration under `migrations/`
- regenerated `payload-types.ts`
- co-located `ConsentLog.test.ts`

**env (documented in `.env.example`, not committed):** `CONSENT_LOG_HMAC_SECRET`, `CMS_API_KEY`,
`CMS_BASE_URL` (web → cms REST base).

## 10. Out of scope (follow-ups)

- ConsentLog retention purge cron (J3).
- Wiring `CONSENT_VERSION` to CMS `legal.privacyPolicyVersion`.
- Adding consent + privacy link to the 3 bare forms (separate GDPR remediation item 2).
- Cookie Policy / Terms standalone routes (remediation item 4).
- Actual GA4 script injection (lands when GA4 is introduced; Consent Mode scaffold already ready).
