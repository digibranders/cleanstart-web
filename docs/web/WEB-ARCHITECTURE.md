# WEB-ARCHITECTURE.md — apps/web

Source of truth for the public marketing site at `cleanstart.com`. Translates the
behavioral contracts in [`docs/cleanstart-cms-architecture.html`](../cleanstart-cms-architecture.html)
into web-client architecture decisions. Where this file disagrees with the arch
doc, the arch doc wins.

## 1 · Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2** App Router | Same major as `apps/cms`. Server Components by default. |
| Language | **TypeScript strict** | No `any`; explicit return types on exported fns. |
| Styling | **Tailwind CSS v4** | CSS-first `@theme` directive. No `tailwind.config.ts`. Tokens come from [`tokens.css`](./tokens.css). |
| Components | **shadcn/ui** | Radix primitives + Tailwind. Pinned to v4-compatible registry. |
| Icons | **lucide-react** | Plus `community-logos/*.svg` for integration marks. |
| Data | **Payload REST** consumed via typed `fetch`. Types re-exported from `packages/types`. | No Payload SDK on web. |
| Validation | **Zod** at any web→CMS boundary (lead submit, preview JWT shape). | Same pattern as CMS. |
| Search | **Meilisearch** via `@meilisearch/instant-meilisearch` + `react-instantsearch`. | Public search-only key from CMS. |
| Analytics | **GA4 + GTM** with consent-mode v2. | See [`FRONTEND-INTEGRATIONS.md`](./FRONTEND-INTEGRATIONS.md). |
| Error tracking | **Sentry browser SDK**. | PII scrubbing per arch doc `#privacy-gdpr`. |
| Hosting | **Vercel Pro** for `apps/web` (per arch doc §hosting). CMS stays on Coolify+droplet. | Public domain `cleanstart.com`. Admin remains `admin.cleanstart.com`. See §15 for the split rationale. |
| CDN / WAF | **Cloudflare** in front of both. R2 media via `cdn.cleanstart.com`. | Same WAF policy as admin. |
| Build | **Turborepo** workspace task. `pnpm --filter @cleanstart/web build`. | |

## 2 · Folder layout

```
apps/web/
├── app/
│   ├── (marketing)/                    route group — site-chrome layout
│   │   ├── layout.tsx                  Header + Footer + Announcements
│   │   ├── page.tsx                    /  (Homepage)
│   │   ├── attack-surface-reduction/page.tsx
│   │   ├── fips/page.tsx
│   │   ├── … (each marketing page)
│   │   ├── blogs/(list+slug)
│   │   ├── news/(list+slug)
│   │   ├── resource-center/(list+slug)
│   │   ├── events/(list+slug)
│   │   ├── webinars/(list+slug)
│   │   └── careers/(list+slug)
│   ├── (legal)/                        no announcements bar in chrome
│   │   ├── legal/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   └── terms-and-condition/page.tsx
│   ├── api/
│   │   ├── preview/route.ts            JWT verify → set draftMode cookie
│   │   ├── exit-preview/route.ts       clear draftMode + redirect
│   │   ├── revalidate/route.ts         CMS afterChange webhook receiver
│   │   ├── leads/submit/route.ts       proxy to CMS /api/leads/submit
│   │   └── 404-monitor/route.ts        client-side 404 logger → CMS
│   ├── sitemap.ts                      paginated sitemap index
│   ├── sitemap-news.xml/route.ts       NewsArticle-only sitemap (48h window)
│   ├── robots.ts
│   ├── opengraph-image.tsx             default OG image
│   ├── icon.tsx
│   ├── globals.css                     imports tokens.css
│   ├── error.tsx                       app-level error boundary
│   ├── not-found.tsx                   /404 (also wired via webhook)
│   └── loading.tsx
├── components/
│   ├── blocks/                         one file per Payload block (see COMPONENT-MAP.md)
│   ├── chrome/                         Header, Footer, AnnouncementsBar, NavMega
│   ├── primitives/                     shadcn-derived: Button, Input, Card, Glass, Pill, …
│   ├── seo/                            JsonLd builders, Metadata helpers
│   ├── forms/                          LeadForm, TurnstileWidget, fields/
│   └── integrations/                   CalendlyEmbed, IntercomLoader, GAConsent, …
├── lib/
│   ├── cms.ts                          typed fetch helpers; tag-keyed cache
│   ├── preview.ts                      JWT verify; draft mode helpers
│   ├── revalidate.ts                   tag derivation per collection+slug
│   ├── canonical.ts                    mirrors apps/cms/.../canonical.ts
│   ├── route-prefixes.ts               imports from packages/types or local copy
│   ├── lexical/                        Lexical → React renderer (custom nodes)
│   ├── analytics.ts                    GTM dataLayer + consent helpers
│   └── env.ts                          Zod-typed env loader
├── content/                            (optional) MDX for legal fallbacks
├── public/                             static assets (favicons, robots assets)
├── styles/
│   └── tokens.css                      symlink-or-import of docs/web/tokens.css
├── next.config.ts
├── tsconfig.json                       extends packages/config/tsconfig.next.json
├── biome.json                          extends root
├── package.json
└── CLAUDE.md                           apps/web sub-CLAUDE (see W-A0 ticket)
```

## 3 · Route map (locked against live cleanstart.com)

URL parity is enforced verbatim from the **live site sitemap**
(`https://cleanstart.com/sitemap.xml`, fetched 2026-05-05). Arch doc
`#migration` rule #1 is hard: *"every URL ships 1:1 with no
pluralisation/normalisation drift"*. The CMS
[`ROUTE_PREFIX`](../../apps/cms/src/payload/lib/route-prefixes.ts) map
already matches live exactly.

### Listings (top-level)

| Page | URL | CMS source |
|---|---|---|
| Homepage | `/` | `pages` slug=`home` |
| Blogs | `/blogs` | `blogs` collection |
| Newsroom | `/news` | `news` collection |
| Events | `/events` | `events` collection |
| Webinars | **`/webinar`** ⚠ | `webinars` collection |
| Careers | `/careers` | `jobs` collection |
| Resource Center | `/resource-center` | `resources` collection |
| Knowledge Hub | `/knowledge-hub` | `guides` (proposed; arch doc decision open) |
| Search | `/search` | client-side Meilisearch |

### Detail pages (singular collection prefix per live)

| Pattern | Example | CMS source |
|---|---|---|
| `/blogs/[slug]` | `/blogs/busybox-container-security-risk` | `blogs` |
| `/news/[slug]` | `/news/cleanstart-wins-three-gold-awards-...` | `news` |
| `/event/[slug]` *(singular)* | `/event/kubecon-cloudnativecon-north-america-2025` | `events` |
| `/webinar/[slug]` *(singular, presumed)* | (no live samples in sitemap; webinars currently surface only on the listing) | `webinars` |
| `/job/[slug]` *(singular)* | `/job/sales-engineer` | `jobs` |
| `/resources/[slug]` *(plural collection)* | `/resources/breaking-the-migration-barrier` | `resources` |
| `/guide/[slug]` *(singular)* | `/guide/dockerfile` | `guides` |
| `/author/[slug]` *(singular)* | `/author/biswajit-de` | `authors` |

### Marketing pages (verbatim from live)

`/about-us`, `/attack-surface-reduction`, `/book-a-demo`,
`/cleansight`, `/cleanstart-images`, `/community`, `/contact-us`,
`/fips`, `/for-ciso`, `/for-developers`, `/leadership`, `/legal`,
`/partners`, `/podcast`, `/pricing`, `/privacy-policy`,
`/software-bill-materials`, `/software-composition-analysis`,
`/teams`, `/vulnerability-remediation`.

### Other live URLs that must continue resolving

`/acceptable-use-policy`, `/deal-registration`, `/survey`, plus a
long tail of dated promotional pages (`/cleanstart-hitachi-*`,
`/cleanstart-raksha-*`, `/new-year-event-*`). These migrate as
`pages` rows. The "duplicate" entries `/about-copy`, `/pricing-copy`
appear to be Webflow staging dupes — flag for product to drop or
redirect to canonical before launch.

### New URL not present on live

`/terms-and-condition` — new in product roadmap. Arch doc
`#migration` rule #1 only applies to migrating URLs; truly new
pages are free.

### ⚠ Single discrepancy with product roadmap

The new-site roadmap from product lists **`/webinars`** (plural).
Live site uses **`/webinar`** (singular). Resolution path:

1. **Default to live (singular `/webinar`)** — preserves SEO and
   migration parity per arch doc rule.
2. If product insists on plural, add a **301 from `/webinar` →
   `/webinars`** in the `redirects` collection and document a 90-day
   grace before any cleanup. **Cost is non-trivial:** the canonical
   URL change resets accumulated SEO equity for that segment.

Tracked in [`BACKLOG-WEB.md`](./BACKLOG-WEB.md) §W6 cleanup tickets.

## 4 · Rendering strategy

Default: **Server Components + on-demand revalidation**, not time-based ISR.

| Route family | Strategy | Cache tags |
|---|---|---|
| `/` (Home) | Static + on-demand revalidate | `pages:home`, `globals:siteSettings`, `globals:mainNav`, `globals:footerNav`, `globals:announcements` |
| `/[marketing-page]` (page-builder) | Static + on-demand revalidate | `pages:${slug}` + dependent block tags |
| `/blogs`, `/news`, `/resource-center`, `/events`, `/webinars`, `/careers` (lists) | Static + on-demand revalidate (paginated by querystring) | `${collection}:list` |
| `/blogs/[slug]`, `/news/[slug]`, … (details) | Static + on-demand revalidate | `${collection}:${slug}` |
| `/api/*`, `/api/preview`, `/api/revalidate`, `/api/leads/submit` | Dynamic (no cache) | — |
| `/sitemap.xml`, `/sitemap-news.xml`, `/robots.txt` | Cron-driven regeneration via Payload (CMS) → revalidate tag on web | `sitemap`, `sitemap-news` |
| `/404`, `/error` | Static | — |

**Why on-demand and not time-based ISR:** the CMS already emits an
`afterChange` webhook on every publish (arch doc `#preview-workflow` upper
half). Time-based revalidation just adds latency between publish and live.

**Draft-mode rule:** any route that supports preview must read
`draftMode().isEnabled` in the page server component and switch its CMS fetch
to `?draft=true` with the JWT-bearing cookie forwarded. Helpers in
[`lib/cms.ts`](#) handle this — never call `fetch` directly in pages.

## 5 · Preview workflow

Implements arch doc [`#preview-workflow`](../cleanstart-cms-architecture.html#preview-workflow).

**Flow:**
1. Editor clicks **Preview** in Payload admin → Payload signs a short-lived JWT
   (`exp` = chosen TTL: 1h / 1d / 7d / 30d) using `PAYLOAD_SECRET`.
2. Browser opens `https://cleanstart.com/api/preview?token=<jwt>&path=<collection>/<slug>`.
3. The route handler:
   - `verifyToken(token, env.PAYLOAD_SECRET)` — Zod-validates `{ collection, slug, exp }`.
   - On success: `cookies().set('preview', token, { httpOnly, secure, sameSite: 'lax', maxAge })`
     and `draftMode().enable()`, then `redirect(canonicalPath)`.
   - On failure: `redirect('/?preview-error=...')` — never throw 5xx.
4. Page server components forward the cookie via
   `lib/cms.ts#fetchDraft(collection, slug)`.
5. `/api/exit-preview` clears both the cookie and draft mode.

**Hard rules (CLAUDE.md re-stated):**
- Never expose `PAYLOAD_SECRET` to the browser (no `NEXT_PUBLIC_*`).
- JWT verification happens on every authed request — caching the result across
  routes would defeat exp.
- Server components never trust query params; always re-verify the cookie token.

## 6 · Revalidation

CMS emits `POST https://cleanstart.com/api/revalidate` after every publish/unpublish.

**Payload shape** (Zod-validated, signed with HMAC-SHA256 over the JSON body
using a separate `REVALIDATE_SECRET`):

```ts
{
  event: 'afterChange' | 'afterDelete',
  collection: 'pages' | 'blogs' | 'news' | … ,
  slug: string,
  prevSlug?: string,            // when slug rotates — both tags revalidate
  affects?: Array<{ tag: string }>  // optional fan-out (e.g. siteSettings → revalidate /)
}
```

**Handler** (`app/api/revalidate/route.ts`):
1. Verify HMAC signature constant-time → 401 on mismatch.
2. Zod-validate body → 400 on shape mismatch.
3. `revalidateTag(\`${collection}:${slug}\`)` (and `prevSlug` if present).
4. For `globals/*` events, revalidate every page that consumes them
   (lookup table in `lib/revalidate.ts`).
5. Respond `{ ok: true, tags: [...] }` for ops visibility — log to Sentry.

**Tag naming convention** (paired with `lib/cms.ts`):
- Collection items: `\`${collection}:${slug}\``
- Lists: `\`${collection}:list\``
- Globals: `\`globals:${slug}\``
- Sitemap: `sitemap`, `sitemap-news`

## 7 · Forms — proxy to CMS, never duplicate the LeadHandler

CLAUDE.md hard rule: **all** lead writes go through `apps/cms/api/leads/submit`.

`apps/web/app/api/leads/submit/route.ts` is a thin **proxy**, not a handler:

```ts
export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${env.CMS_URL}/api/leads/submit`, {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      'x-forwarded-for': clientIp(req),
      'cf-connecting-ip': req.headers.get('cf-connecting-ip') ?? '',
    },
    body,
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
```

The proxy exists because:
1. Browsers can't always reach `admin.cleanstart.com` directly under strict CSP.
2. We need to forward Cloudflare-derived IP headers consistently for the
   CMS rate limiter (`apps/cms/src/payload/lib/client-ip.ts`).
3. Turnstile is verified server-side in `apps/cms`; the proxy just passes
   through the token in the body.

The form **UI** lives in `components/forms/LeadForm.tsx` and uses a Server
Action that calls the proxy. Never call the CMS endpoint directly from a
client component (CSP forbids it; the proxy is the boundary).

## 8 · Search

Public Meilisearch frontend per arch doc [`#search-index`](../cleanstart-cms-architecture.html#search-index).

- Index per published collection (`blogs`, `news`, `guides`, `resources`, `events`, `webinars`, `jobs`, `pages`).
- The **search-only key** lives in `NEXT_PUBLIC_MEILI_SEARCH_KEY`; safe to ship
  to the browser. The admin key never leaves CMS env.
- UI: `<SearchBox />`, `<Hits />` from `react-instantsearch`. Results route is
  `/search?q=…`; debounced.
- 404-monitoring (arch doc [`#404-monitoring`](../cleanstart-cms-architecture.html#404-monitoring))
  uses search to suggest near-matches before submitting the broken-link signal.

## 9 · 404 + monitoring

`app/not-found.tsx` renders the brand-styled 404 page and fires
`navigator.sendBeacon('/api/404-monitor', { path, referrer, ts })`.

`/api/404-monitor` proxies to CMS `/api/404-monitor` (Phase G) which
de-duplicates by path+IP within a 1h window and writes to the
`404-monitoring` collection.

## 10 · Security headers

Set via `next.config.ts` `headers()`. These are not negotiable and ship in W6.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline'  /* Next inlines tiny bootstrap; nonce in W6 */
    https://www.googletagmanager.com
    https://*.intercom.io https://*.intercomcdn.com
    https://challenges.cloudflare.com
    https://assets.calendly.com;
  style-src 'self' 'unsafe-inline' https://assets.calendly.com;
  img-src 'self' data: blob:
    https://${R2_PUBLIC_HOST}
    https://www.google-analytics.com
    https://*.intercom-mail.com;
  connect-src 'self' https://${CMS_HOST} https://${MEILI_HOST}
    https://www.google-analytics.com
    https://*.intercom.io
    https://api.calendly.com;
  frame-src https://calendly.com https://*.calendly.com
    https://www.youtube-nocookie.com
    https://challenges.cloudflare.com;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

In W6 we tighten `script-src` with a per-request nonce and remove
`'unsafe-inline'`. Until then, document the decision in
[`SEO-PLAYBOOK.md`](./SEO-PLAYBOOK.md) §security so the auditor sees the
phasing intent.

## 11 · Sitemap & robots

- `app/sitemap.ts` — paginated index. One sitemap segment per collection +
  one for marketing pages. Each segment ≤ 5,000 URLs.
- `app/sitemap-news.xml/route.ts` — only items from the `news` collection
  with `publishedAt` within the last **48 hours** (Google News rule, also
  arch doc [`#sitemap-robots`](../cleanstart-cms-architecture.html#sitemap-robots)).
- `app/robots.ts`:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /preview
  Sitemap: https://cleanstart.com/sitemap.xml
  Sitemap: https://cleanstart.com/sitemap-news.xml
  ```
- `IndexNow` ping is fired from CMS afterChange (Phase G), not web — see
  [`FRONTEND-INTEGRATIONS.md`](./FRONTEND-INTEGRATIONS.md).

## 12 · Environment variables

Loaded via `lib/env.ts` (Zod schema; build fails on missing required keys).

| Var | Type | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL | yes | `https://cleanstart.com` |
| `NEXT_PUBLIC_CMS_URL` | URL | yes | `https://admin.cleanstart.com` |
| `CMS_URL` | URL | yes | server-side; usually same as above |
| `PAYLOAD_SECRET` | string | yes | preview JWT verify only — never `NEXT_PUBLIC_*` |
| `REVALIDATE_SECRET` | string | yes | HMAC for /api/revalidate |
| `MEILI_HOST` | URL | yes | `https://search.cleanstart.com` |
| `NEXT_PUBLIC_MEILI_SEARCH_KEY` | string | yes | search-only key, browser-safe |
| `NEXT_PUBLIC_GA_ID` | string | optional | GA4 measurement ID; analytics disabled when blank |
| `NEXT_PUBLIC_GTM_ID` | string | optional | GTM container ID |
| `TURNSTILE_SITE_KEY` | string | yes (prod) | `NEXT_PUBLIC_` prefix? — no, read server-side; pass into HTML |
| `INDEXNOW_KEY` | string | optional | only if web pings IndexNow directly |
| `SENTRY_DSN` | URL | optional | enables Sentry browser SDK |
| `R2_PUBLIC_HOST` | string | yes | hostname for media CSP allow-list |
| `CALENDLY_USER` | string | optional | embed default org |
| `INTERCOM_APP_ID` | string | optional | enables Intercom loader |

`apps/web/.env.example` (W-A) documents these. The repo-root `.env` (gitignored)
holds local-dev values. Coolify holds production values.

## 13 · Performance budget — a contract

Per arch doc [`#perf-budget`](../cleanstart-cms-architecture.html#perf-budget):

| Metric | Budget | Source |
|---|---|---|
| **TTFB** | ≤ 800 ms (p75 4G) | Server route + Cloudflare |
| **LCP** | ≤ 2.5 s (p75 4G) | CrUX |
| **CLS** | ≤ 0.1 | CrUX |
| **INP** | ≤ 200 ms | CrUX |
| **Initial JS** | ≤ 100 KB compressed per route | Bundler |
| **Total CSS** | ≤ 100 KB compressed per route | Bundler |
| **Total transferred** | ≤ 1.5 MB Home; ≤ 1 MB detail | Lighthouse-CI |
| **Third-party JS** | ≤ 80 KB compressed (incl. GA, GTM, chat) | Bundler manifest |
| **Image policy** | `<Image />` everywhere; AVIF/WebP via Next; explicit `sizes`; no source larger than 1920×1080 unless decorative (`role="presentation"`). | — |
| **Font policy** | `next/font` for Figtree (`latin` subset); preload only `400` + `700`; Rethink Sans only on opt-in routes. | — |

**This is a contract, not a guideline.** A PR that breaches any
threshold by more than ±5 fails the CI gate (W6). Adding a library or a
hero asset requires either (a) staying under budget, or (b) an explicit
trade-off ticket that documents what we're cutting to make room.

### TTFB strategy

- Cloudflare cache rule: cache marketing routes with `s-maxage=300,
  stale-while-revalidate=86400`. The user always gets stale-fast
  HTML; the edge revalidates in the background.
- Coolify deploys a single Next.js binary; no per-request CMS hop on
  cached routes. CMS fetches happen during ISR re-rendering only.
- Health check (`/api/health`) returns SHA + uptime in < 50 ms — used as
  the canary for TTFB regressions.

### Server Components are the default; client boundaries are measured

- Every component starts as `async` Server Component. Add
  `'use client'` only when the leaf needs hooks, browser APIs, event
  handlers, or refs.
- Push `'use client'` to **leaves**, not pages. A `<DialogTrigger>` is
  client; the surrounding `<Dialog>` need not be.
- Each new client boundary shows up as a separate JS chunk in the
  bundler manifest. CI publishes the chunk diff in PR comments —
  surprises get flagged.
- Marketing routes target **zero client components above the fold**
  (chrome + Hero + first feature row are all server-rendered).

### Suspense for slow data

- Wrap any data dependency that could exceed 500 ms in
  `<Suspense fallback={<Skeleton />}>`. The above-fold content streams
  while the slow region resolves.
- Common candidates: search-result chunks, recommendations, related
  posts, leaderboard widgets.
- Skeleton state must match the resolved component's outer dimensions
  to avoid layout shift (CLS budget).

## 14 · Observability

- Sentry browser SDK with Replay disabled by default; enabled only after
  consent gate.
- `tracesSampleRate: 0.05` in production.
- PII scrubbing per arch doc `#privacy-gdpr`: drop `email`, `phone`,
  `name` from all event extras before send.
- All `/api/*` route handlers wrap in `withSentry` and emit
  `request_id` (UUID v4) header — same convention as CMS.

## 15 · Deployment

### Hosting split: Vercel for web, Coolify for CMS

Per arch doc §hosting (line 661, 680), the public site `apps/web` ships
on **Vercel Pro**, while `apps/cms` stays on **Coolify on the existing
droplet**. The split is deliberate, not accidental:

| Concern | Vercel (apps/web) | Coolify+droplet (apps/cms) |
|---|---|---|
| Scaling lane | Auto-scales serverless functions + edge static | Single instance; CMS load is bounded (editorial team + cron) |
| Failure isolation | Public site outage doesn't take editing offline | Admin outage doesn't take public marketing offline |
| Cost shape | $20/mo per dev (Vercel Pro) + Vercel Analytics free | $12/mo droplet (DigitalOcean Bangalore) + Coolify free |
| Capabilities used | Edge ISR, image optimization, Speed Insights, `@vercel/og`, preview deployments with `X-Robots-Tag: noindex` | Persistent Postgres, R2 fallback queue with crontask drain, Sentry, BetterStack |
| Compliance | Vercel Pro permits commercial use (Hobby does not — arch doc explicit) | Self-hosted; full data control |
| What it does NOT do | Edge functions for write-paths (lead submit always proxies to CMS) | Public-facing rendering (web does that) |

If a single-platform world is ever justified (e.g., Vercel pricing
shifts, or Coolify gains true edge-distribution), revisit at that
decision point — but neither rationale exists today.

### Vercel build + deploy

- Vercel project tracks `main` branch.
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @cleanstart/web build`.
- Output: `apps/web/.next/`.
- Vercel runs `pnpm figma:extract --check` (W-B follow-up) as a non-blocking pre-build step to surface token drift in PR comments.
- Production env vars in Vercel dashboard. `PAYLOAD_SECRET`, `REVALIDATE_SECRET` rotate every 90 days; rotation runbook in `docs/web/RUNBOOK-rotation.md` (W-A0 sub-ticket).
- Preview deployments emit `X-Robots-Tag: noindex` automatically (arch doc §migration line 944) — no risk of preview URLs leaking to search.

### Cloudflare WAF (in front of both)

Same Cloudflare zone fronts both `cleanstart.com` (Vercel origin) and
`admin.cleanstart.com` (Coolify origin):

- Bot-fight on (managed challenge for any path matching `^/api/(leads|404-monitor)$`).
- Rate-limit `/api/leads/submit` at 10/min/IP at the edge (CMS also limits at 5/min/IP — defence in depth).
- Cache rule: bypass cache for `/api/*`; cache static for everything else
  (Next sets the right headers; Vercel emits its own `cache-control`
  headers for static assets).
- WAF rules block requests with `Content-Type: application/x-www-form-urlencoded` to `/api/leads/submit` (we accept JSON only).

### Health checks

- `GET /api/health` on `apps/web` — returns `{ ok: true, sha, ts }`.
  Hooked to BetterStack as web-canary monitor.
- `GET /api/health` on `apps/cms` — same shape; pre-existing CMS monitor.

## 16 · Testing

- **Unit:** Vitest, co-located. Snapshot for JSON-LD generators (SEO-PLAYBOOK.md).
- **E2E:** Playwright in `apps/web/tests/e2e/`. Phase tags match BACKLOG-WEB.md
  waves (`@w1-home`, `@w4-blogs`, etc.).
- **Visual regression:** Playwright with `expect(page).toHaveScreenshot()` on
  Home, snapshot per breakpoint (mobile-360, tablet-768, desktop-1280, hero-1920).
- **Accessibility:** `@axe-core/playwright` per page in CI; gate at zero
  serious/critical violations (W6).
- **Token freshness:** `pnpm figma:extract --check` (W-B follow-up) compares
  current Figma values to `tokens.json`; CI warns on drift.

## 17 · Open questions (tracked in BACKLOG-WEB.md)

1. Pluralisation lock: `/event` vs `/events`, `/webinar` vs `/webinars`,
   `/job` vs `/careers` — see §3 above.
2. Knowledge Hub schema (arch doc `#decisions` open) — blocks W4.
3. Slug confirmation: `/cleanstart-images` vs `/software-bill-materials`
   for the SBOM/CleanStart-image pages — user's roadmap appears swapped.
4. Podcast schema — treat as `pages` block-built v1 unless product upgrades it.
5. Dark-mode mandate — Figma file has no dark variants today; design
   system ships light-only and we add a `@media (prefers-color-scheme: dark)`
   override pass once the designer publishes a dark mode collection.

## References

- [`docs/cleanstart-cms-architecture.html`](../cleanstart-cms-architecture.html) — behavioral source of truth
- [`docs/BACKLOG.md`](../BACKLOG.md) — CMS phase backlog
- [`docs/INTEGRATIONS-RESEARCH.md`](../INTEGRATIONS-RESEARCH.md) — frontend integrations Tier 5
- [`apps/cms/src/payload/lib/route-prefixes.ts`](../../apps/cms/src/payload/lib/route-prefixes.ts) — collection→URL map
- [`tokens.json`](./tokens.json) · [`tokens.css`](./tokens.css) — generated design tokens
- [`figma-snapshots/`](./figma-snapshots/) — page-design references
