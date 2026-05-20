# `apps/web` Production Readiness — Source of Truth

> **Scope:** This doc is the canonical reference for everything related to putting `apps/web` (the marketing site at `www.cleanstart.com`) into production and keeping it there.
>
> **Out of scope:** `apps/cms` production. That lives in `docs/cleanstart-cms-architecture.html`. When the two disagree about a shared concern (e.g. CSP for the preview iframe), this doc wins for `apps/web` and the arch doc wins for the CMS.
>
> **Status:** Initial cut, 2026-05-15. Sections marked _Pending_ get filled in as the workstream lands.

---

## 1. Executive summary

CleanStart is shipping a Next.js 16.2.5 / React 19 / Tailwind v4 marketing site at `www.cleanstart.com`. CMS deploys 2–3 days after web. The plan owner is `admin@digibranders.com`; release captain rotates weekly among the 3-dev team.

**In scope for v1 launch (P0):** branch & env strategy, DNS/TLS via Cloudflare, security headers + strict nonce-CSP, error boundaries, SEO (sitemap, canonical, JSON-LD, og:image), CMS draft-mode noindex, Sentry + Vercel Analytics + GA4 with Consent Mode v2, cookie banner, ISR + revalidate webhook, accessibility (WCAG 2.2 AA), Lighthouse CI, axe-core CI, security.txt, legal pages, rollback runbook.

**Out of scope for v1 (P1+):** llms.txt/ai.txt (post-launch), UptimeRobot wiring (post-launch), HSTS preload submission (+7 days), DMARC progression, status page (BetterStack v1.5).

**Pages built:** 7 of 31 (see `docs/WEB-PAGES.md`). Legal hub + privacy + terms ship before DNS flip.

---

## 2. Branch & environment strategy

**Model:** short-lived feature branches off `development` (GitHub Flow). `web` and `cms` long-lived branches are retired.

| Branch | Vercel env | Domain | Indexable | Lifetime | Purpose |
|---|---|---|---|---|---|
| `feat/*`, `fix/*`, `chore/*`, `hotfix/*` | Preview (auto, per push) | `*-cleanstart-web.vercel.app` | ❌ noindex | Hours–days; deleted on merge | Per-task work, per-PR preview |
| `development` | Preview (stable alias) | `staging.cleanstart.com` | ❌ noindex | Permanent | Integration / staging — what's about to ship |
| `main` | Production | `www.cleanstart.com` | ✅ index | Permanent | Live site |

**Branch naming:** `<type>/<scope>-<short-kebab-desc>` — e.g. `feat/web-pricing-page`, `fix/cms-lead-form`. `<scope>` is `web|cms|ui|types|infra|docs`. One concern per branch.

**Workflow per task:**

```
git checkout development && git pull
git checkout -b feat/web-pricing-page
# work, commit
git push -u origin feat/web-pricing-page
gh pr create --base development --fill
# Vercel posts preview URL on PR; CI gates run
# Reviewer approves → squash-merge → branch auto-deleted
```

**Production promotion:** `development` → `main` via weekly **release PR** (rotating release captain). Title: `release: <YYYY-MM-DD>`. Vercel "Promote to Production" reuses the staging artifact (no rebuild, <30s, instant rollback by re-promoting previous). Tag `main` post-merge: `web-vYYYY.MM.DD`.

**Hotfix lane:** off `main`, label `hotfix`, one reviewer + green CI → merge → auto-promote → back-merge to `development`. Reserved for production fires.

**Vercel project settings:**
- Production Branch: `main`
- Preview Deployments: enabled for all branches
- `vercel.json` → `git.deploymentEnabled: { "main": true, "development": true, "feat/*": true, "fix/*": true, "chore/*": true, "hotfix/*": true }`
- Stable preview alias `staging.cleanstart.com` → assigned to `development`
- Preview Comments enabled (auto-posts URL + Lighthouse delta)
- Deployment Protection: Vercel SSO on Preview deployments

**Hard rules:**
- Never push directly to `development` or `main`.
- Never reuse a feature branch after merge — delete and start fresh.
- One concern per PR (CMS and web in separate PRs).
- Squash-merge only to `development` and `main`.
- Required reviewers: 1 for feature PRs, 2 for release PRs to `main`.
- Required CI before merge to `development`: lint, typecheck, build, bundle-size, Lighthouse, axe, Playwright smoke. Plus manual QA sign-off comment for `main`.

---

## 3. Domain, DNS, TLS

**Provider:** Cloudflare (DNS-only / grey cloud — orange-cloud double-terminates TLS and breaks Vercel cert renewal).

**Records:**

| Name | Type | Value | Proxy | TTL |
|---|---|---|---|---|
| `cleanstart.com` (apex) | CNAME (Cloudflare flattening) | `cname.vercel-dns.com` | DNS only | 300 → 86400 |
| `www` | CNAME | `cname.vercel-dns.com` | DNS only | 300 → 86400 |
| `staging` | CNAME | `cname.vercel-dns.com` | DNS only | 300 → 86400 |
| `cleanstart.com` | CAA | `0 issue "letsencrypt.org"` | — | 86400 |
| `cleanstart.com` | CAA | `0 issuewild ";"` | — | 86400 |
| `cleanstart.com` | CAA | `0 iodef "mailto:security@cleanstart.com"` | — | 86400 |
| `cleanstart.com` | TXT (SPF) | `v=spf1 -all` | — | 86400 |
| `_dmarc` | TXT | `v=DMARC1; p=reject; rua=mailto:dmarc@cleanstart.com; adkim=s; aspf=s` | — | 86400 |
| `*._domainkey` | TXT | `v=DKIM1; p=` (empty placeholder) | — | 86400 |

**DNSSEC:** enabled at Cloudflare. Verify chain at registrar.

**TLS:** Vercel-managed Let's Encrypt. Min TLS 1.2 (Vercel default). Auto-renewal. Verify CA list with `vercel certs ls` before writing CAA — if Vercel ever moves off LE, update CAA accordingly.

**HSTS:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Submit to [hstspreload.org](https://hstspreload.org) only after **7 days of stable production** with no cert issues.

**TTL ramp:** 300s pre-launch (fast rollback) → 3600s (+7d) → 86400s (+30d).

**MTA-STS / BIMI:** N/A until email program launches.

**Cloudflare dashboard checklist:**
- DNSSEC: enabled
- "Block AI Scrapers and Crawlers" toggle: **DISABLED** (default-on since Jul 2024 — would silently break the allow-AI policy in §8)
- Always Use HTTPS: enabled (only impacts non-proxied requests; harmless)
- HTTP/3 (QUIC): enabled (default since 2022)

**Vercel Firewall rules:**
- Block requests where `User-Agent` matches `/Bytespider/i` → action: `deny` (HTTP 403)

---

## 4. Security headers & CSP

**Target:** securityheaders.com **A+**, Mozilla Observatory **A+**.

All headers emitted from `apps/web/src/proxy.ts`. Next 16 renamed `middleware.ts` → `proxy.ts` (the export is `proxy()` instead of `middleware()`); the runtime, behaviour, and `config.matcher` syntax are otherwise unchanged. We follow the new convention to silence the build-time deprecation warning and stay forward-compatible.

### Header matrix

| Header | Value | Notes |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Submit preload after 7 stable days |
| `X-Content-Type-Options` | `nosniff` | |
| `X-Frame-Options` | `DENY` | OWASP belt-and-braces alongside `frame-ancestors`. Override to `SAMEORIGIN` only on Live Preview routes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | |
| `Cross-Origin-Opener-Policy` | `same-origin` | |
| `Cross-Origin-Resource-Policy` | `same-site` | Skip COEP — would break YouTube/HubSpot embeds |
| `X-XSS-Protection` | _(not set)_ | OWASP 2024+ classifies as harmful |
| `Permissions-Policy` | (full opt-out — see below) | Includes Privacy Sandbox |
| `Content-Security-Policy[-Report-Only]` | (strict nonce — see below) | Report-Only for week 1, then enforce |
| `Reporting-Endpoints` | `csp-endpoint="/api/csp-report"` | Pairs with CSP `report-to` |
| `X-Robots-Tag` (non-prod or draft) | `noindex, nofollow` | Defence-in-depth backstop |
| `X-Robots-Tag` (prod) | `max-image-preview:large, max-snippet:-1` | Google Discover eligibility |

**Permissions-Policy** (full string):
```
camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(),
accelerometer=(), gyroscope=(), interest-cohort=(),
browsing-topics=(), attribution-reporting=(), shared-storage=(),
join-ad-interest-group=(), run-ad-auction=(),
private-state-token-issuance=(), private-state-token-redemption=()
```

### CSP

**Strict, nonce-based, `'strict-dynamic'`** (allowlist CSPs are bypassable per OWASP/web.dev 2024+):

```
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic' https: 'unsafe-inline';
style-src 'self' 'nonce-{NONCE}';
img-src 'self' data: blob: https://cdn.cleanstart.com https://cms.cleanstart.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://cms.cleanstart.com https://*.ingest.sentry.io
            https://vitals.vercel-insights.com https://va.vercel-scripts.com
            https://www.google-analytics.com https://*.analytics.google.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
require-trusted-types-for 'script';
trusted-types nextjs default;
report-uri /api/csp-report;
report-to csp-endpoint;
```

`'unsafe-inline'` after the nonce is a no-op when modern browsers see `'strict-dynamic'`; it's there as a fallback for old browsers. `https:` likewise is only honoured by browsers that don't understand `'strict-dynamic'`.

**Trade-off accepted:** strict nonce CSP forces dynamic rendering on every page → **no PPR / `cacheComponents`** (locked decision in §20 #7). Revisit when we move to hash-based CSP + `experimental.sri`.

### Burn-in plan

- **Week 1 (post-launch):** `Content-Security-Policy-Report-Only`. Monitor Sentry CSP-violation feed.
- **Week 2:** flip to enforcing once 24h clean.
- **+7 days enforce:** submit HSTS preload.

### Live Preview iframe carve-out

CMS embeds `apps/web` pages in Live Preview iframes. For routes hit while `draftMode().isEnabled`, override CSP to:
```
frame-ancestors https://cms.cleanstart.com https://cms.cleanstart.com;
```
And set `X-Frame-Options: SAMEORIGIN` (overridden from default `DENY`). All other headers unchanged. See §6.

---

## 5. Indexing & SEO

**Canonical host:** `https://www.cleanstart.com`. All canonical URLs, sitemap entries, and og:url use `www`.

### Redirects (308 in `proxy.ts`)

- Apex `cleanstart.com/*` → `https://www.cleanstart.com/*`
- Trailing slash → no slash: `/about-us/` → `/about-us` (except root `/` and explicit file routes)
- Lowercase enforcement on path segments
- `next.config.ts` keeps `/blog → /blogs` (308 from earlier work)

### robots.ts

- Production: `Allow: /` for `*` + explicit `Disallow: /` only for `Bytespider`. List allowed AI bots as documentation comments (no rules needed since `*` already allows them).
- Non-production: `Disallow: /` for `*` (defence-in-depth backstop is the `X-Robots-Tag` set by `proxy.ts` in §4).
- `sitemap: https://www.cleanstart.com/sitemap.xml`, `host: https://www.cleanstart.com` on production only.

### sitemap.ts

- **Single `sitemap.xml`** (no index — we're 3+ orders of magnitude below the 50k cap).
- Generated from CMS published-only content (`where: { _status: { equals: 'published' } }`) + static routes.
- **Drop `<priority>` and `<changefreq>`** — Google ignores both per Search Central.
- **`<lastmod>` matters again** since 2023. Wire to CMS document `updatedAt`. **Never auto-touch on every build** — Google deprioritises unreliable sitemaps.

### Per-page metadata (Next.js Metadata API)

Every page (or `generateMetadata`) sets:
- `title` (template-injected from layout)
- `description`
- `alternates: { canonical: <https://www.cleanstart.com/...> }`
- `openGraph: { url, title, description, type, siteName: 'CleanStart', images: [{ url, width: 1200, height: 630, alt }] }`
- `twitter: { card: 'summary_large_image', title, description, images, alt }`
- `robots`: production = index/follow + `googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 }`; non-prod or draft = `noindex, nofollow`.

`og:image` fallback: `apps/web/public/og/default.png` (1200×630, <300 KB, branded).
`og:image:alt` is **mandatory** — bake into the canonical helper so it can't be forgotten.

### Pagination

Pages 6+ in any paginated listing → `noindex, follow` (per arch doc §`#seo-group`).

### No hreflang

Monolingual English. Per Google's guidance, do not emit `<link rel="alternate" hreflang>` until a second language ships. `<html lang="en">` only.

### Page Experience (beyond CWV)

- HTTPS ✓ (enforced)
- Mobile-friendly ✓ (Tailwind responsive)
- No intrusive interstitials — **cookie banner must NOT be a centered modal on mobile** (see §11).
- Safe Browsing ✓ (Vercel hosting)

---

## 6. CMS Preview / Draft Mode noindex

Payload Live Preview opens `apps/web` URLs with the Next.js draft-mode bypass cookie. These render unpublished content and **must never be indexed**, even on production domain.

**Three-layer defence:**

1. **`proxy.ts`:** when `draftMode().isEnabled` or the `__prerender_bypass` cookie is present, set `X-Robots-Tag: noindex, nofollow, noarchive` on the response.
2. **Per-page `generateMetadata`:** when `(await draftMode()).isEnabled === true`, return `robots: { index: false, follow: false }`.
3. **Sitemap:** only includes published content. CMS query passes `where: { _status: { equals: 'published' } }`.

**Editor UX:**
- Fixed top-right pill: 🔒 "Draft preview" with "Exit preview" link → `GET /api/preview/exit` → calls `draftMode().disable()` and redirects to the published page.
- `/api/preview/enter` accepts an HMAC-signed token from the CMS and enables draft mode.

**CSP carve-out:** see §4 "Live Preview iframe carve-out".

**Verification:** load a CMS preview link on production → `curl -b "__prerender_bypass=…" $URL` → assert `X-Robots-Tag: noindex` AND HTML has `<meta name="robots" content="noindex,nofollow">`. Exit preview → confirm headers/meta revert.

---

## 7. JSON-LD / structured data

**Convention:** server component `<JsonLd>` rendering `<script type="application/ld+json">`. Field source is the CMS — see `docs/cms-jsonld-system.html` for canonical field mappings.

**Schema map:**

| Page type | Schemas emitted |
|---|---|
| Root layout (every page) | `Organization` (logo, sameAs LinkedIn/GitHub/X) |
| `/` (homepage) | + nothing extra (no `WebSite`/`SearchAction` — see below) |
| `/blogs` (listing) | `BreadcrumbList` |
| `/blog/[slug]` | `BreadcrumbList`, `BlogPosting` |
| `/resource-center` (listing) | `BreadcrumbList` |
| `/resource/[slug]` | `BreadcrumbList`, `Article` |
| `/about-us`, static pages | `BreadcrumbList` |
| `/products/*` (when built) | `BreadcrumbList`, `Product` or `SoftwareApplication` |

**Do NOT emit:**
- `WebSite` + `SearchAction` — Google killed sitelinks searchbox 2024-11-21. Dead code.
- `FAQPage` / `HowTo` — Google heavily restricted both Aug 2023; most sites no longer get rich results. Default off; emit only if Search Console verifies eligibility for our domain.

---

## 8. AI / LLM crawler policy

**Decision:** allow all AI crawlers **except `Bytespider`**. `llms.txt` and `ai.txt` are insurance — no major LLM provider has confirmed ingestion (Perplexity is the only public consumer).

**Allowed (no robots rule needed; documented as comments in `robots.ts`):**
`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `CCBot`, `cohere-ai`, `Applebot-Extended`, `Meta-ExternalAgent`, `Amazonbot`, `Diffbot`.

**Blocked:**
- `Bytespider` (ByteDance) — symbolic `Disallow: /` in `robots.ts` + Vercel Firewall rule on User-Agent (it ignores robots.txt).

**Files:**
- `apps/web/public/llms.txt` — Markdown-format site index per [llmstxt.org](https://llmstxt.org).
- `apps/web/public/ai.txt` — Spawning spec mirror.

**Cloudflare:** "Block AI Scrapers and Crawlers" toggle must be **DISABLED** in dashboard.

---

## 9. Performance budgets & Core Web Vitals

### Field metric targets (CrUX, p75 — unchanged through 2026)

- LCP < 2.5s
- INP < 200ms (replaced FID Mar 2024)
- CLS < 0.1
- TTFB < 800ms
- FCP < 1.8s

### Lighthouse CI gates (median of 3 runs, 4G throttle)

| Category | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 0.85 | ≥ 0.95 |
| Accessibility | ≥ 0.95 | ≥ 0.95 |
| Best Practices | ≥ 0.95 | ≥ 0.95 |
| SEO | = 1.00 | = 1.00 |

Mobile = Moto G Power emulation. 0.90 mobile is unrealistic with hero + GA4 + custom fonts; trend-monitor toward 0.90 over time.

### Bundle budgets

- Initial JS < 200 KB gz
- Per-route JS < 350 KB gz
- Third-party JS < 100 KB gz
- Image: ≤ 600 KB mobile / ≤ 1 MB desktop per page

### Implementation rules

- `@next/bundle-analyzer` wraps `next.config.ts`; CI posts size delta on PR (fail >+10 KB initial JS without `size-ok` label).
- **`framer-motion` is now `motion`** (renamed package). Use `LazyMotion` + `m.*` (~30 KB savings vs `motion.*`). Lazy-load below-the-fold motion via `dynamic(..., { ssr: false })`.
- Replace pure-CSS-suitable animations with Tailwind `tw-animate-css` (already a dep).
- `next/image` v16: explicit `formats: ['image/avif', 'image/webp']` in config. `qualities` defaults to `[75]` only. `minimumCacheTTL` is now 4h.
- Decorative SVGs: plain `<img>` per existing CLAUDE.md rule.
- Move `shadcn` to `devDependencies`.
- **No PPR** — incompatible with nonce-CSP (§4 trade-off).
- Fonts: `next/font` Google Fonts with `display: 'swap'`. `preload: true` for primary (Figtree), `preload: false` for secondary (Inter). `adjustFontFallback: true`.

---

## 10. Observability

### Sentry

- `@sentry/nextjs` via the modern `instrumentation.ts` + `instrumentation-client.ts` pattern (NOT the legacy `sentry.{client,server,edge}.config.ts` files).
- `withSentryConfig` wraps `next.config.ts` (source maps upload via `SENTRY_AUTH_TOKEN` in CI).
- `sendDefaultPii: false`. Denylist: `email`, `phone`, `Authorization`, `Cookie`, `Set-Cookie`.
- `tracesSampleRate: 0.1`. `replaysSessionSampleRate: 0.0`, `replaysOnErrorSampleRate: 1.0`.
- DSN scoped per env (Vercel env vars).
- CSP `report-uri /api/csp-report` → forwards to Sentry security endpoint.

### Web Vitals

- `apps/web/src/components/observability/WebVitals.tsx` — `useReportWebVitals` from `next/web-vitals` → Sentry `setMeasurement`. Track LCP, INP, CLS, TTFB, FCP.
- Vercel Speed Insights also collects these (free tier sufficient).

### Analytics

- **Vercel Analytics + Speed Insights** (`@vercel/analytics`, `@vercel/speed-insights`). Cookie-less, no consent needed.
- **GA4** via `next/script strategy="afterInteractive"`. Only injected when `cs_consent.analytics === 'granted'`. Consent Mode v2 — see §11.

### Alerts

Single channel: email `admin@digibranders.com`. Sentry rules:
- Error rate > 1% over 5 min
- Any new (first-seen) issue
- LCP p75 > 2.5s for 1 hour
- CSP violation spike > 10/min

### Health endpoint

`apps/web/src/app/api/health/route.ts` returns `{ status: 'ok', commit: process.env.VERCEL_GIT_COMMIT_SHA, env: process.env.VERCEL_ENV }`. Used by UptimeRobot (§16) and the rollback runbook (§15).

---

## 11. Cookie consent (W14)

GA4 sets `_ga` / `_gid` cookies → GDPR / ePrivacy / UK PECR / CPRA require explicit consent + opt-out parity before firing.

### UX rules

- **Non-modal bottom sheet** (NOT a centered `Dialog`) — centered modals on mobile risk Google "intrusive interstitial" → ranking demotion.
- **"Reject all" must have one-click parity with "Accept all"** — same prominence, same number of clicks. Hiding "Reject" behind "Manage preferences" is a CNIL violation (multiple €1M+ fines).
- Third option: "Manage preferences" for granular control.
- Re-prompt at **12 months** or on policy change.
- Geo-default via `x-vercel-ip-country` header: show banner only in EEA, UK, Switzerland, California (CPRA). Outside those → consent inferred granted. (Conservative alt: global banner.)
- Honour browser `Sec-GPC: 1` header → auto-deny analytics.

### Categories

- **Essential** (always on): no GA4, no Vercel behaviour tracking. Includes consent cookie itself.
- **Analytics** (opt-in): GA4 + Vercel Speed Insights performance data.

### Consent Mode v2 — all 4 signals required

```js
// In <head>, before any GA4 script:
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
});

// On accept:
gtag('consent', 'update', {
  analytics_storage: 'granted',
  ad_storage: 'denied',           // we don't run ads
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});
```

### Storage & audit

- First-party cookie `cs_consent` (1y) + `localStorage` mirror.
- POST consent decisions to `/api/consent` for server-side audit log (CMS `ConsentLog` collection — additive J3 work).

### Files

- `apps/web/src/components/consent/CookieBanner.tsx`
- `apps/web/src/components/consent/ConsentModeScript.tsx` (head-injected)
- `apps/web/src/lib/consent/log.ts`
- `apps/web/src/app/api/consent/route.ts`
- `apps/web/src/app/(legal)/privacy-policy#cookies` — banner copy links here

---

## 12. Caching & ISR

- Every CMS-backed `fetch` uses `{ next: { tags: [...], revalidate: 3600 } }` per arch doc §`#isr-handshake`.
- `apps/web/src/app/api/revalidate/route.ts` — HMAC-verified (reuse `WEBHOOK_GENERIC_SIGNING_SECRET`). **Next 16 breaking change:** `revalidateTag(tag, 'max')` — single-arg form is a TS error.
- `Cache-Control` matrix:

| Resource | Header |
|---|---|
| CMS-driven HTML | `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` |
| `_next/static/*` | `public, max-age=31536000, immutable` (Vercel default) |
| `public/*` static | `public, max-age=3600, must-revalidate` |
| `public/og/*` | `public, max-age=86400` |
| `/sitemap.xml`, `/robots.txt` | `public, max-age=3600` |
| `/api/health` | `no-store` |
| `/api/csp-report`, `/api/consent` | `no-store` |

---

## 13. Accessibility

**Standard:** WCAG 2.2 Level AA. EAA enforcement live since 28 Jun 2025.

**WCAG 2.2 new SCs that apply:**
- 2.4.11 Focus Not Obscured — sticky header risk; add `scroll-margin-top` on focusable elements.
- 2.5.8 Target Size (Minimum) — interactive ≥ 24×24 CSS px (inline link exception).
- 3.2.6 Consistent Help — chat/contact link in same relative order across pages.
- 3.3.7 Redundant Entry — relevant when lead forms ship.
- 3.3.8 / 3.3.9 Accessible Authentication — N/A (no auth).

**Tooling:**
- Re-enable Biome a11y rules in `apps/web/biome.json` (`noSvgWithoutTitle`, `useSemanticElements`, `useAnchorContent`).
- `@axe-core/playwright` in CI: WCAG tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`. Gate: 0 serious + 0 critical.
- Lighthouse a11y category is a subset and **insufficient** as the only gate.

**Manual checklist:**
- Keyboard-only nav full sweep
- Focus-visible on all interactives
- Alt-text audit on content images
- Colour contrast: ≥ 4.5:1 body, ≥ 3:1 large text + UI components
- Hero, footer, all CTAs verified

---

## 14. CI/CD pipeline

`.github/workflows/web.yml` runs on PR to `development` or `main` when any of the following changed (path filter):
- `apps/web/**`
- `packages/ui/**`
- `packages/types/**`
- `pnpm-lock.yaml`
- `.github/workflows/web.yml`

Job: `web` (Node 24, pnpm 10.30.3, Turbo cache):

1. `pnpm --filter @cleanstart/web lint` — Biome
2. `pnpm --filter @cleanstart/web typecheck` — `tsc --noEmit`
3. `pnpm --filter @cleanstart/web build` — `NEXT_PUBLIC_CMS_URL` pinned to staging CMS for build-time fetches
4. **bundle-size** — fail if delta > +10 KB initial JS without `size-ok` label
5. **Lighthouse CI** against the Vercel preview URL — gates per §9
6. **Playwright smoke** — homepage, `/blogs`, `/resource-center`, one blog detail, one resource detail, `/privacy-policy`
7. **axe-core (`@axe-core/playwright`)** on the same routes — 0 serious + 0 critical

Required check on `development` and `main`. Plus QA sign-off comment for `main`.

Existing CMS jobs in `.github/workflows/ci.yml` remain unchanged.

---

## 15. Rollback runbook

### Instant revert (≤ 2 min)

1. Vercel dashboard → Deployments → pick previous green deploy
2. "Promote to Production"
3. Production now serves the previous artifact (no rebuild — artifact swap)
4. Verify: `curl https://www.cleanstart.com/api/health` returns the previous commit SHA

CLI alternative: `vercel promote <deployment-url> --yes`.

### Cache flush

```
curl -X POST https://www.cleanstart.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-signature: <HMAC of body using REVALIDATE_SECRET>" \
  -d '{"tags":["*"]}'
```

### DNS rollback

- TTL kept at 300s pre-launch and for first 7 days. Rollback by updating Cloudflare records (propagation < 5 min).
- After 7 stable days, raise TTL to 3600s (+30 days → 86400s).
- If TLS cert breaks, last-resort: temporarily flip Cloudflare proxy to **orange cloud** (CF Universal SSL) and remove the `cleanstart.com` domain from Vercel — buys time to debug. Document this only as break-glass; default state is grey cloud.

### Hotfix lane

```
git checkout main && git pull
git checkout -b hotfix/web-<short-desc>
# fix, commit, push
gh pr create --base main --label hotfix --fill
# 1 reviewer + green CI → merge → auto-promote
git checkout development && git pull && git merge main && git push  # back-merge
```

### Database / CMS rollback

Out of scope for this doc — see arch HTML §`#deploy-rollback`.

---

## 16. Secret management

**All web secrets in Vercel Environment Variables, scoped per env (Development / Preview / Production):**

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_CMS_URL` | All | Preview = staging CMS, Prod = prod CMS |
| `CMS_API_KEY` | All | Authenticated CMS reads (drafts) |
| `SENTRY_DSN` | All | Public — but per-env DSN |
| `SENTRY_AUTH_TOKEN` | CI only | Source map upload |
| `REVALIDATE_SECRET` | All | HMAC for `/api/revalidate` |
| `PREVIEW_SECRET` | All | HMAC for `/api/preview/enter` |
| `NEXT_PUBLIC_GA4_ID` | Production only | `G-XXXXXXXXXX` |
| `CONSENT_LOG_HMAC_SECRET` | All | HMAC for `/api/consent` audit |

**Rotation:** `CMS_API_KEY`, `REVALIDATE_SECRET`, `PREVIEW_SECRET`, `CONSENT_LOG_HMAC_SECRET`, `SENTRY_AUTH_TOKEN` rotate every **90 days**. Recorded in the operator's secrets store of choice (1Password / Bitwarden / Keychain).

**Scanning:** `gitleaks` pre-commit + CI scan on all branches.

---

## 17. Legal & compliance pages

| Route | Content source | Indexable | Owner |
|---|---|---|---|
| `/legal` | Hub — links to all legal docs | ✅ | Legal team |
| `/privacy-policy` | Final copy provided by user | ✅ | Legal team |
| `/terms-and-conditions` | Final copy provided by user | ✅ | Legal team |
| `/404` (not-found.tsx) | Designed 404 page | n/a | Web team |

Cookie banner copy links to `/privacy-policy#cookies` (§11).

`security.txt` at `/.well-known/security.txt` (§4 / RFC 9116 — covered in §18 verification).

---

## 18. Pre-launch verification checklist

Run on `staging.cleanstart.com` before flipping production DNS to `www.cleanstart.com`. ALL must pass.

1. `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build` — clean
2. `curl -I https://staging.cleanstart.com` — assert HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, X-Robots-Tag: noindex
3. `curl https://staging.cleanstart.com/robots.txt` — `Disallow: /`
4. `curl https://staging.cleanstart.com/sitemap.xml` — valid XML; no `<priority>` or `<changefreq>`
5. Lighthouse CI passes on `/`, `/blogs`, `/blog/<slug>`, `/resource-center`, `/about-us`, `/privacy-policy` (§9 gates)
6. Playwright smoke green
7. axe-core (WCAG 2.2 AA): 0 serious + 0 critical
8. Trigger CMS publish → `/api/revalidate` invalidates the right tag → page refreshes < 5s
9. Force a thrown error → Sentry receives it, PII scrubbed
10. `error.tsx`, `not-found.tsx`, `global-error.tsx` render correctly (visit `/__does-not-exist`, throw in a server component)
11. CSP Report-Only: 24h clean in Sentry → flip to enforcing → re-verify (1)–(8)
12. Manual keyboard-only nav through homepage — all CTAs reachable, focus-visible
13. **Draft-mode noindex:** load CMS Live Preview link → assert `X-Robots-Tag: noindex` AND `<meta name="robots" content="noindex,nofollow">` AND draft pill visible AND "Exit preview" works
14. **HTTP/3:** `curl --http3 -I https://www.cleanstart.com` returns 200
15. **Redirects:** `curl -I https://cleanstart.com/about-us/` → 308 chain → `https://www.cleanstart.com/about-us`
16. **Bytespider blocked:** `curl -A "Bytespider" https://www.cleanstart.com/` → 403
17. **Banner gates GA4:** load homepage with fresh cookies → DevTools shows zero `google-analytics.com` requests until "Accept all"; after accept, `_ga` set + GA4 collect fires
18. **Consent Mode v2 default:** all 4 signals `denied` on first paint
19. **security.txt:** `curl https://www.cleanstart.com/.well-known/security.txt` returns 200 with `Contact:` and `Expires:` fields
20. **Mozilla Observatory + securityheaders.com:** scan returns A+ from both
21. **Sitemap accuracy:** `<lastmod>` matches the most recent CMS publish for at least one blog and one resource entry
22. **CAA / DNSSEC:** `dig CAA cleanstart.com +short` returns the three records; `dig +dnssec www.cleanstart.com` returns RRSIG

Only after all 22 pass: switch Vercel Production Domain to `www.cleanstart.com` (apex auto-redirects via §5).

---

## 19. Post-launch watch list (week 1)

| Day | Action |
|---|---|
| T+0 (launch) | Sentry feed open; Vercel deployment pinned |
| T+24h | If CSP Report-Only is clean → flip to enforcing |
| T+72h | Lighthouse field data check (CrUX preview if eligible) |
| T+7d | If no cert/header incidents → submit HSTS preload at hstspreload.org |
| T+7d | Raise DNS TTL: 300 → 3600 |
| T+14d | First weekly release PR `development` → `main` (cadence established) |
| T+30d | DNS TTL → 86400. Review Sentry sample rate. |
| T+90d | First secret rotation cycle |

Watch metrics:
- Sentry error count (target: < 0.1% of sessions)
- LCP p75 (target: < 2.5s)
- INP p75 (target: < 200ms)
- CLS p75 (target: < 0.1)
- 4xx/5xx rate (Vercel dashboard)
- Bot traffic share (Vercel Firewall logs)

---

## 20. Decisions of record (locked)

Append future decisions here. Never silently change a row — supersede with a dated entry below.

| # | Date | Decision | Choice | Implication |
|---|---|---|---|---|
| 1 | 2026-05-15 | Canonical host | `www.cleanstart.com` | Apex 308 → www |
| 2 | 2026-05-15 | AI crawler policy | Allow all except `Bytespider` | See §8 |
| 3 | 2026-05-15 | DNS provider | Cloudflare (DNS-only / grey cloud) | See §3 |
| 4 | 2026-05-15 | Analytics stack | Vercel Analytics + Speed Insights + GA4 | Triggers cookie banner (§11) |
| 5 | 2026-05-15 | Web alert channel | Email only — `admin@digibranders.com` | Single recipient at launch |
| 6 | 2026-05-15 | Legal copy | User-provided final copy | Indexable from day 1 |
| 7 | 2026-05-15 | Rendering strategy | No PPR / `cacheComponents` | Strict nonce-CSP forces dynamic rendering |
| 8 | 2026-05-15 | Cloudflare proxy mode | DNS-only (grey cloud) | Orange-cloud breaks Vercel cert renewal |
| 9 | 2026-05-15 | Lighthouse gate | 0.85 mobile / 0.95 desktop | Industry-realistic; trend toward 0.90 mobile |
| 10 | 2026-05-15 | Sitemaps | Single `sitemap.xml`; no priority/changefreq; accurate `lastmod` | Google ignores priority/changefreq |
| 11 | 2026-05-15 | `WebSite` `SearchAction` JSON-LD | Do not emit | Sitelinks searchbox killed 2024-11-21 |
| 12 | 2026-05-15 | Branching model | Short-lived feature branches off `development` (GitHub Flow) | `web`/`cms` long-lived branches retired |
