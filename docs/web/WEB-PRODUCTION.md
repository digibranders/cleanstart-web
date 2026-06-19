# `apps/web` Production Readiness — Source of Truth

> **Scope:** This doc is the canonical reference for everything related to putting `apps/web` (the marketing site at `www.cleanstart.com`) into production and keeping it there.
>
> **Out of scope:** `apps/cms` production. That lives in `docs/architecture/cleanstart-cms-architecture.html`. When the two disagree about a shared concern (e.g. CSP for the preview iframe), this doc wins for `apps/web` and the arch doc wins for the CMS.
>
> **Status:** Initial cut, 2026-05-15. Sections marked _Pending_ get filled in as the workstream lands.

---

## 1. Executive summary

CleanStart is shipping a Next.js 16.2.5 / React 19 / Tailwind v4 marketing site at `www.cleanstart.com`. CMS deploys 2–3 days after web. The plan owner is `admin@digibranders.com`; release captain rotates weekly among the 3-dev team.

**In scope for v1 launch (P0):** branch & env strategy, DNS/TLS via Cloudflare, security headers + CSP (report-only → enforce, see §4), error boundaries, SEO (sitemap, canonical, JSON-LD, og:image), CMS draft-mode noindex, Sentry + Vercel Analytics + GA4 with Consent Mode v2, cookie banner, ISR + revalidate webhook, accessibility (WCAG 2.2 AA), Lighthouse CI, axe-core CI, security.txt, legal pages, rollback runbook.

**Out of scope for v1 (P1+):** llms.txt/ai.txt (post-launch), UptimeRobot wiring (post-launch), HSTS preload submission (+7 days), DMARC progression, status page (BetterStack v1.5).

**Pages built:** 7 of 31 (see `docs/web/WEB-PAGES.md`). Legal hub + privacy + terms ship before DNS flip.

---

## 2. Branch & environment strategy

**Model:** day-to-day work commits directly to `development`; promote `development` → `main` via PR. (Authoritative branching policy: `CLAUDE.md` → "Branching policy" — three long-lived branches `main` / `development` / `farheen`, no routine feature branches.)

| Branch | Vercel env | Domain | Indexable | Lifetime | Purpose |
|---|---|---|---|---|---|
| `feat/*`, `fix/*` (occasional, tolerated) | Preview (auto, per push) | `*.vercel.app` | ❌ noindex | Hours–days; deleted on merge | Per-task work / per-PR preview |
| `development` | Preview (auto, per push) | `cleanstart-git-development-…vercel.app` | ❌ noindex | Permanent | Integration branch — day-to-day dev for both apps |
| `main` | **Production** | **`www.cleanstart.com`** (live as of 2026-06-19) | ✅ index | Permanent | The deployed Next.js marketing site |

> **Go-live status (2026-06-19):** DNS has been cut over. The new Next.js site now serves **`www.cleanstart.com`** (apex `cleanstart.com` 308-redirects → `www`). `NEXT_PUBLIC_SITE_URL=https://www.cleanstart.com` is baked in the production build. Indexing is active — `VERCEL_ENV=production` + host not in `NOINDEX_HOSTS` in `indexing.ts` → all five layers (`robots.txt`, meta robots, `X-Robots-Tag`, sitemap, canonicals) serve the production-indexed state.
>
> `staging.cleanstart.com` remains assigned to the Vercel Production target as an alias (for QA access) but is held at **noindex** by `isNoindexHost` in `indexing.ts` — it will never compete with `www` in search.
>
> **To open staging for an SEO/security audit:** set Vercel env `ALLOW_INDEXING=1` (overrides all five layers), then **redeploy**. Remove to re-block.
>
> **Canonical host:** `www.cleanstart.com` — wired in `proxy.ts` (`PRODUCTION_HOST`) and `canonical.ts` (`SITE_URL`). No code change needed for future deploys; normal artifact-reuse "Promote to Production" is safe now that the correct host is baked into the bundle.

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

**Production promotion:** `development` → `main` via weekly **release PR** (rotating release captain). Title: `release: <YYYY-MM-DD>`. Vercel "Promote to Production" reuses the artifact (no rebuild, <30s, instant rollback by re-promoting previous). Tag `main` post-merge: `web-vYYYY.MM.DD`.

**Hotfix lane:** off `main`, label `hotfix`, one reviewer + green CI → merge → auto-promote → back-merge to `development`. Reserved for production fires.

**Vercel project settings:**
- Production Branch: `main`
- Preview Deployments: enabled for all branches
- `vercel.json` → `git.deploymentEnabled: { "main": true, "development": true, "feat/*": true, "fix/*": true, "chore/*": true, "hotfix/*": true }`
- Production domain `www.cleanstart.com` → assigned to the **Production** target (`main`). `staging.cleanstart.com` is kept as a Vercel alias (QA access) but held at noindex by `indexing.ts`.
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
| `_index._agents` | HTTPS | `1 www.cleanstart.com. alpn="h2,h3" port="443" mandatory="alpn,port"` | — | 3600 |
| `_index._agents` | SVCB | `1 www.cleanstart.com. alpn="h2,h3" port="443" mandatory="alpn,port"` | — | 3600 |

**DNSSEC:** must be enabled at Cloudflare **and** completed at the registrar (GoDaddy) by adding the DS record Cloudflare generates. ⚠ As verified 2026-06-10, the DS record is **missing at the parent** (`dig DS cleanstart.com +short` is empty, resolvers return `AD: false`) — Cloudflare-side signing without the registrar DS step does nothing. See the DNS-AID subsection below for the completion runbook; DNS-AID requires a signed discovery zone.

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

### DNS-AID (DNS for AI Discovery) — agent discovery records

Agents discover an organization's machine-readable entry points via SVCB/HTTPS records under the `_agents` namespace ([draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/), record format per [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460)). We publish the **organizational index** record only — `_index._agents` is the well-known entry point that points agents at the site, where the HTTP-layer discovery takes over (homepage `Link: rel="api-catalog"` header → `/.well-known/api-catalog`, §4/§17).

**Do NOT publish `_a2a._agents` or `_mcp._agents`** — those advertise live A2A/MCP protocol endpoints, which we don't run. Advertising a protocol endpoint that doesn't exist sends agents to a dead socket. Add them only if/when an actual A2A or MCP server ships.

**Status: PUBLISHED 2026-06-10.** Both records are live in the Cloudflare zone (TTL 1 h, DNS-only) and resolve via DoH (`Status:0`, Answer present for type 65 and type 64). DNSSEC is still incomplete — `AD:false`, `dig DS cleanstart.com` empty — so the GoDaddy DS step below remains outstanding.

**Records (zone-file form):**

```
_index._agents.cleanstart.com. 3600 IN HTTPS 1 www.cleanstart.com. alpn="h2,h3" port="443" mandatory="alpn,port"
_index._agents.cleanstart.com. 3600 IN SVCB  1 www.cleanstart.com. alpn="h2,h3" port="443" mandatory="alpn,port"
```

ServiceMode (priority 1) with an explicit target — the owner name has no address records, so the target must name a resolvable host. Both RR types are published because scanners variously query SVCB (the draft's type) or HTTPS (the type for HTTPS endpoints). The draft's `well-known` SvcParam (would point at `/.well-known/api-catalog`) is not yet IANA-registered; until it is, custom params would need private-use `keyNNNNN` form — we omit it and let the HTTP `Link` header carry that pointer instead.

**Publish via Cloudflare API** (token needs `Zone.DNS:Edit` on the cleanstart.com zone; from the operator secrets store — never committed):

```bash
export CF_API_TOKEN=<token>
ZONE_ID=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=cleanstart.com" | jq -r '.result[0].id')

for TYPE in HTTPS SVCB; do
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    --data "{
      \"type\": \"$TYPE\",
      \"name\": \"_index._agents\",
      \"ttl\": 3600,
      \"data\": {
        \"priority\": 1,
        \"target\": \"www.cleanstart.com\",
        \"value\": \"alpn=\\\"h2,h3\\\" port=\\\"443\\\" mandatory=\\\"alpn,port\\\"\"
      }
    }" | jq '{success, errors}'
done
```

(Dashboard alternative: DNS → Records → Add record → type `HTTPS` / `SVCB`, name `_index._agents`, priority `1`, target `www.cleanstart.com`, value `alpn="h2,h3" port="443" mandatory="alpn,port"`.)

**DNSSEC completion runbook** (required — DNS-AID specifies signed discovery zones; as of 2026-06-10 the chain is broken at the parent):

1. Cloudflare dashboard → cleanstart.com → DNS → Settings → DNSSEC → Enable (if not already) → copy the **DS record** values (Key Tag, Algorithm 13/ECDSAP256SHA256, Digest Type 2, Digest).
2. GoDaddy → Domain Settings for cleanstart.com → DNSSEC → **Add DS record** with those four values. (GoDaddy is the registrar; Cloudflare is DNS-host only, so the DS does not propagate automatically.)
3. Wait up to 24 h for the `.com` zone to publish the DS, then verify:
   ```bash
   dig DS cleanstart.com +short          # must return the DS record
   dig +dnssec A www.cleanstart.com      # must include RRSIG, ad flag set
   ```

**Verify what scanners see** (DNS-over-HTTPS via Cloudflare, same resolver path the isitagentready.com scanner uses):

```bash
curl -s -H "accept: application/dns-json" \
  "https://cloudflare-dns.com/dns-query?name=_index._agents.cleanstart.com&type=HTTPS"
# expect: "Status":0 with an Answer array, and "AD":true once DNSSEC chain is complete
```

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
| `Content-Security-Policy[-Report-Only]` | (pragmatic inline-permitting — see §4 CSP) | Report-Only until burn-in clean, then enforce |
| `Reporting-Endpoints` | `csp-endpoint="/api/csp-report"` | Pairs with CSP `report-to` |
| `X-Robots-Tag` (non-prod or draft) | `noindex, nofollow` | Defence-in-depth backstop |
| `X-Robots-Tag` (prod) | `max-image-preview:large, max-snippet:-1` | Google Discover eligibility |
| `Link` (HTML pages) | `</.well-known/api-catalog>; rel="api-catalog"; …, </sitemap.xml>; rel="sitemap"; …, </api/search>; rel="service-desc"; …` | Agent discovery (RFC 8288 / 9727). Appended to the framework's preload `Link` values; non-`/api` paths only. Source: `src/lib/security/agent-discovery.ts` |

**Permissions-Policy** (full string):
```
camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(),
accelerometer=(), gyroscope=(), interest-cohort=(),
browsing-topics=(), attribution-reporting=(), shared-storage=(),
join-ad-interest-group=(), run-ad-auction=(),
private-state-token-issuance=(), private-state-token-redemption=()
```

### CSP

**Pragmatic, statically-prerender-compatible** (revised 2026-06-10). The earlier design was a strict per-request **nonce + `'strict-dynamic'`** CSP. It was abandoned because it was **architecturally incompatible with this site** and could never be enforced as written:

1. **Nonces require dynamic rendering.** Next.js only auto-applies a nonce to its bootstrap scripts when the middleware sets the CSP on the *request* header AND the page is dynamically rendered (the nonce is read via `headers()`). The marketing site is **statically prerendered** at build time — a per-request nonce in the response can never match build-time HTML. Forcing every route dynamic to enable nonces is the wrong trade for a marketing site.
2. **Inline `style=` attributes can never carry a nonce.** The Figma-exact-values convention puts inline `style={{}}` everywhere; CSP nonces only clear `<style>`/`<script>` *elements*, not `style=` *attributes*. So `style-src` **must** allow `'unsafe-inline'` regardless.
3. The old machinery generated a nonce in `proxy.ts` that **nothing read** (CSP was only on the response, never the request; no layout consumed `x-nonce`). Flipping `CSP_ENFORCE=1` would have white-screened the site (blocked Next's scripts under `strict-dynamic`, and every inline style under `style-src`).

The current policy (`lib/security/csp.ts`, exercised by `csp.test.ts`):

```
default-src 'self';
script-src 'self' 'unsafe-inline' https:;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://cdn.cleanstart.com https://cms.cleanstart.com
        https://storage.googleapis.com https://cdn.jsdelivr.net;
font-src 'self' https://fonts.gstatic.com data:;
media-src 'self' data: blob: https://storage.googleapis.com;
connect-src 'self' https://cms.cleanstart.com https://*.ingest.sentry.io
            https://vitals.vercel-insights.com https://va.vercel-scripts.com
            https://www.google-analytics.com https://*.analytics.google.com;
frame-ancestors 'none';            (preview surfaces override to self + cms.cleanstart.com)
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
require-trusted-types-for 'script'; (production only)
trusted-types nextjs default;       (production only)
report-uri /api/csp-report;
report-to csp-endpoint;
```

**Strength posture:** `'unsafe-inline'` on `script-src`/`style-src` is the realistic ceiling for a statically-prerendered site with pervasive inline styles — it allows inline JS, so a successful unescaped-HTML injection could execute. The XSS defence-in-depth therefore comes from the **structural directives** — `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, and **Trusted Types** (`require-trusted-types-for 'script'`, prod only) — plus disciplined output escaping (the one unescaped sink, `JsonLd`, manually escapes `<`). `https:` on `script-src` keeps GA4 / Vercel third-party scripts working without enumerating hosts.

#### Why `'unsafe-inline'` cannot be removed (analyzed — this is the floor)

A common instinct is to "tighten" `style-src`/`script-src` to a nonce/hash policy. **It is not safely possible on this architecture, and the analysis below is the reason — do not attempt it without first switching to full dynamic rendering.** Three independent sources of inline content each require `'unsafe-inline'`:

1. **Inline `style=` *attributes* (the Figma-exact-values convention).** `style={{}}` is everywhere (exact gradients/radii/shadows that aren't Tailwind-expressible). CSP **nonces and hashes only apply to `<style>`/`<script>` *elements*, never to `style=` *attributes*** — the only source expression that clears a `style=` attribute is `'unsafe-inline'` (or `style-src-attr 'unsafe-inline'`). No amount of refactoring the *elements* changes this.
2. **Inline `<style>` *elements*.** `next/font/google` (Manrope/Sora/JetBrains Mono in `layout.tsx`) injects an `@font-face` + CSS-variable `<style>` block on **every** page, and Next inlines error/critical CSS (verified in the build output). These need `'unsafe-inline'`, a nonce, or a per-build hash.
3. **Inline `<script>`.** Next's bootstrap + RSC streaming (`self.__next_f.push(...)`) emit inline scripts on every page, and `JsonLd` renders `<script type="application/ld+json">` site-wide.

Why the two tightening paths both fail here:

- **Nonces** would cover the `<style>`/`<script>` *elements* (2 and 3) — but Next only applies a nonce when the middleware sets it on the *request* CSP header AND the page is **dynamically rendered** (`headers()` opts out of static). That re-introduces the exact dynamic-rendering cost we removed (§15 / §20 #7). And nonces still never cover the `style=` *attributes* (1).
- **Hashes** are static, but `next/font` and the Next bootstrap emit content whose hashes **change every build**; maintaining a build-time hash-injection pipeline for a static export is fragile and unsupported — and hashes also never cover `style=` attributes (1).
- A **`style-src-attr` / `style-src-elem` split** buys nothing: `style-src-elem` still needs `'unsafe-inline'` for `next/font`, so the `'unsafe-inline'` cannot be scoped down to attributes only.

**Conclusion:** `'self' 'unsafe-inline'` is the floor for a statically-prerendered Next site that uses `next/font` and the Figma inline-style convention. The *only* route to a strict nonce/hash CSP is to accept **fully dynamic rendering** (losing the static-prerender perf model). Revisit this section only if that tradeoff is ever deliberately taken; until then, the structural directives above are where the real protection lives.

**Side effect — PPR unblocked:** the "no PPR / `cacheComponents`" decision (§15 / §20 #7) was justified *solely* by nonce-CSP forcing dynamic rendering. With nonces gone, that specific blocker no longer applies; enabling PPR is now a separate, independent call (not yet taken).

### Burn-in plan (report-only → enforce)

`CSP_MODE` defaults to **report-only**; set `CSP_ENFORCE=1` to flip. Do NOT flip until the burn-in is clean:

- **Report-only (current):** ships `Content-Security-Policy-Report-Only`. Monitor `/api/csp-report` → Sentry for violations against real traffic across all page archetypes.
- **⚠ Trusted-Types gate before enforce:** `require-trusted-types-for 'script'` is enforced in production. React's `dangerouslySetInnerHTML` (used by `JsonLd` on **every** page and `ConsentModeScript`) writes raw HTML to a Trusted-Types sink — under enforcement this can throw unless a Trusted Types policy is registered for those sinks. The report-only feed will surface these as `trusted-types` violations. **Resolve them (register a TT policy for the JSON-LD/consent sinks, or drop `require-trusted-types-for`) before flipping `CSP_ENFORCE=1`** — otherwise enforcement breaks the JSON-LD site-wide.
- **Flip to enforcing** once the report-only feed is 24h clean (zero script/style/trusted-types violations).
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

### robots.txt (route handler)

Served by `apps/web/src/app/robots.txt/route.ts` from the pure builder in `src/lib/seo/robots.ts` (a plain-text route handler, not Next's `robots.ts` metadata route, because `MetadataRoute.Robots` cannot emit the `Content-Signal` directive).

- Production: `Allow: /` for `*` + explicit `Disallow: /` only for `Bytespider`. List allowed AI bots as documentation comments (no rules needed since `*` already allows them).
- **Content Signals** ([contentsignals.org](https://contentsignals.org/)): `Content-Signal: search=yes, ai-input=yes, ai-train=yes` inside the `*` group — the machine-readable form of the §8 allow-all decision. Non-production declares `search=no, ai-input=no, ai-train=no`.
- Non-production: `Disallow: /` for `*` (defence-in-depth backstop is the `X-Robots-Tag` set by `proxy.ts` in §4).
- `Sitemap: https://www.cleanstart.com/sitemap.xml`, `Host: https://www.cleanstart.com` on production only.

### sitemap.ts

- **Single `sitemap.xml`** (no index — we're 3+ orders of magnitude below the 50k cap).
- Generated from CMS published-only content + static routes. When indexing is disallowed the sitemap returns `[]` — this prevents scrapers from learning URLs before go-live.
- **Drop `<priority>` and `<changefreq>`** — Google ignores both per Search Central.
- **`<lastmod>` matters again** since 2023. Wire to CMS document `updatedAt`. **Never auto-touch on every build** — Google deprioritises unreliable sitemaps.

**Per-collection CMS filters** (each mirrors that collection's lifecycle fields — do not apply `BLOG_FILTER` to collections that lack `publishedAt`):

| Constant | Filter | Collections |
|---|---|---|
| `BLOG_FILTER` | `_status=published & publishedAt[exists]=true` | `blogs`, `resources`, `events`, `guides`, `knowledgeBase`, `legalDocuments` |
| `AUTHORS_FILTER` | `_status=published` | `authors` — has versions/drafts but **no `publishedAt` field**; applying `BLOG_FILTER` causes Payload to return HTTP 400 (unqueryable path), which `fetchDocs` swallows as `[]` silently emptying the collection |
| `NEWS_FILTER` | `_status=published & publicationDate[exists]=true` | `news` — uses `publicationDate` not `publishedAt` |
| `JOBS_FILTER` | `_status=published & hiringStatus=open` | `jobs` |

**Static routes list** (`STATIC_ROUTES` in `sitemap.ts`) — every built non-dynamic route. Keep in sync with `docs/web/WEB-PAGES.md`. Intentional exclusions are commented in the file:
- `/pricing` — not built yet.
- `/legal` — a 308 redirect, not a page; individual `/legal/<slug>` docs come from the CMS.
- `/software-composition-analysis` — intentionally de-listed (page kept, excluded from sitemap and nav per product decision).

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

**Convention:** server component `<JsonLd>` rendering `<script type="application/ld+json">`. Field source is the CMS — see `docs/architecture/cms-jsonld-system.html` for canonical field mappings.

**Schema map** (current as of 2026-06-10, maintained in `apps/web/src/lib/seo/jsonld.tsx`):

| Page / route | Schemas emitted |
|---|---|
| Root layout (every page) | `Organization` (logo, sameAs LinkedIn/GitHub/X) |
| `/` (homepage) | + nothing extra (no `WebSite`/`SearchAction` — see below) |
| **Content listings** | |
| `/blogs` | `BreadcrumbList` |
| `/guide` | `BreadcrumbList` |
| `/resource-center` | `BreadcrumbList` |
| `/news` | `BreadcrumbList` |
| `/events` | `BreadcrumbList` |
| `/careers` | `BreadcrumbList` |
| `/podcast` | `BreadcrumbList` |
| `/webinars` | `BreadcrumbList` |
| `/knowledge-hub` | `BreadcrumbList` |
| **Content detail pages** | |
| `/blogs/[slug]` | `BreadcrumbList`, `BlogPosting` — authors include `url` → `/author/[slug]` (E-E-A-T) |
| `/guide/[slug]` | `BreadcrumbList`, `Article`, optional `FAQPage` (emitted when guide has structured FAQs) |
| `/resources/[slug]` | `BreadcrumbList`, `Article` |
| `/news/[slug]` | `BreadcrumbList`, `NewsArticle` — authors include `url` → `/author/[slug]` |
| `/event/[slug]` | `BreadcrumbList`, `Event` |
| `/job/[slug]` | `BreadcrumbList`, optional `JobPosting` (emitted when job is published and open) |
| `/knowledge-hub/[slug]` | `BreadcrumbList`, `Article`, optional `VideoObject` (emitted when `videoUrl` is set) |
| `/author/[slug]` | `BreadcrumbList`, `ProfilePage` (with `mainEntity: Person`, sameAs social links) |
| **Product pages** | |
| `/cleansight` | `BreadcrumbList`, `SoftwareApplication` |
| `/cleanstart-images` | `BreadcrumbList`, `SoftwareApplication` |
| `/fips`, `/software-bill-materials`, `/vulnerability-remediation`, `/attack-surface-reduction`, `/for-ciso`, `/for-developers`, `/cleanstart-platform`, `/software-composition-analysis` | `BreadcrumbList` — `SoftwareApplication` not yet wired (these pages pre-date the schema helpers) |
| **Legal & utility pages** | |
| `/legal/[slug]` | `BreadcrumbList` |
| `/privacy-policy` | `BreadcrumbList` |
| `/about-us`, `/teams`, `/community`, `/partners`, `/contact-us`, `/book-a-demo`, `/deal-registration`, `/case-studies` | `BreadcrumbList` |

**New schema helpers added (2026-06-10):**
- `videoObjectSchema()` — `VideoObject` for Knowledge Hub lesson videos
- `profilePageSchema()` — `ProfilePage` with `mainEntity: Person` for author bio pages; disambiguates author identity for Google E-E-A-T

**Do NOT emit:**
- `WebSite` + `SearchAction` — Google killed sitelinks searchbox 2024-11-21. Dead code.
- `FAQPage` / `HowTo` on non-guide pages — Google heavily restricted both Aug 2023; most sites no longer get rich results. Default off; emit only when structured `faqs` data is present (guides) and only if Search Console verifies eligibility for our domain.

---

## 8. AI / LLM crawler policy

**Decision:** allow all AI crawlers **except `Bytespider`**. `llms.txt` and `ai.txt` are insurance — no major LLM provider has confirmed ingestion (Perplexity is the only public consumer).

**Allowed (no robots rule needed; documented as comments in `robots.ts`):**
`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `CCBot`, `cohere-ai`, `Applebot-Extended`, `Meta-ExternalAgent`, `Amazonbot`, `Diffbot`.

**Blocked:**
- `Bytespider` (ByteDance) — symbolic `Disallow: /` in `robots.ts` + Vercel Firewall rule on User-Agent (it ignores robots.txt).

**Files:** (P1 — deferred to post-launch)
- `apps/web/public/llms.txt` — Markdown-format site index per [llmstxt.org](https://llmstxt.org). **Not yet created** — add post-launch once content is stable.
- `apps/web/public/ai.txt` — Spawning spec mirror. **Not yet created** — add post-launch.

**Cloudflare:** "Block AI Scrapers and Crawlers" toggle must be **DISABLED** in dashboard.

### Markdown for agents (content negotiation)

Requests with an explicit `Accept: text/markdown` on any HTML page receive a markdown rendering of that page (`Content-Type: text/markdown; charset=utf-8` + `x-markdown-tokens` estimate header). HTML stays the default — browsers never send `text/markdown`, and `text/*`/wildcard Accept values deliberately do NOT trigger it. Implemented in-app (Cloudflare's hosted "Markdown for Agents" requires orange-cloud proxying, which §3 forbids):

- `apps/web/src/lib/agent-markdown.ts` — Accept parsing (q-value aware), HTML→markdown conversion (`node-html-markdown`, scoped to `<main>`, scripts/styles/SVG stripped), token estimate (~4 chars/token).
- `apps/web/src/app/api/markdown/route.ts` — converter; self-fetches the page's HTML same-origin (path is validated root-relative — not a proxy) and converts. Inner fetch carries `x-agent-markdown-internal` so the proxy never re-rewrites it (no loops).
- `proxy.ts` — rewrites matching GET page requests to the converter, passing the original path via the `x-agent-markdown-path` request-header override (query params do not survive a middleware rewrite into the handler's `nextUrl`). Appends `Vary: Accept` on page responses — note Next.js overwrites `Vary` on prerendered **HTML** responses so only the markdown variant actually carries it; harmless on Vercel because the middleware rewrite re-keys the cache by path before any cache lookup, but an external shared cache in front would need its own Accept-aware keying. `/api/*` and preview paths excluded.

**Known limitations:** pages whose content streams behind a Suspense/loading boundary (e.g. `/knowledge-hub`) convert only the fallback shell; and the responsive double-render pattern (mobile + desktop branches both in the DOM) duplicates headings in the markdown output, same as it does in the SEO outline.

### Agent-readiness scanner — items deliberately NOT implemented

The isitagentready.com scanner flags eleven capabilities. Five are implemented (`Link` discovery headers §4, DNS-AID records §3, markdown negotiation above, Content Signals §5, API catalog §4). The remaining six are **intentionally skipped** — each would advertise infrastructure that does not exist, sending agents to dead endpoints. Do not add them to chase the score; revisit only when the underlying capability ships.

| Scanner item | Decision | Why |
|---|---|---|
| OAuth/OIDC discovery (`/.well-known/openid-configuration`, `/.well-known/oauth-authorization-server`) | Skip | The marketing site has no protected APIs and is not an identity provider. Publishing issuer metadata without an authorization server is false advertising. |
| OAuth Protected Resource Metadata (`/.well-known/oauth-protected-resource`, RFC 9728) | Skip | Same — `/api/search` and `/api/health` are public; there is no token-protected resource to describe. |
| `auth.md` agent registration | Skip | Depends on the two OAuth items above; there is no agent registration flow. |
| MCP Server Card (`/.well-known/mcp/server-card.json`) | Skip | No MCP server runs on this origin. The card's `transport.endpoint` would point at nothing. If an MCP server ever ships, also add `_mcp._agents` DNS records (§3). |
| Agent Skills index (`/.well-known/agent-skills/index.json`) | Skip for now | No published skills. A legitimate future skill could document the search API / markdown negotiation; until one is written, an empty index is noise. |
| WebMCP (`navigator.modelContext.provideContext()`) | Skip for now | Experimental Chrome-only API (origin trial, spec in flux). The site is read-only content; search is already exposed via `service-desc` in the API catalog. Revisit when the API stabilizes. |

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
- **No PPR (currently)** — the original blocker (nonce-CSP forcing dynamic rendering) was **removed 2026-06-10** when the CSP dropped nonces (§4). PPR is now technically unblocked but remains off pending a separate decision.
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

**Implemented:**
- **Skip-to-content link** (WCAG 2.4.1 / 2.1 A) — a hidden-until-focused `<a href="#main-content">` is the first focusable element in `src/app/layout.tsx` (`sr-only focus:not-sr-only`); every route's `<main>` landmark carries `id="main-content"` (all 40 routes), so keyboard users tab once and jump past the nav to the content.

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

`api-catalog` at `/.well-known/api-catalog` (RFC 9727 §3 / RFC 9264 link-set, `application/linkset+json`) lists the site's machine-readable entry points (search API, health probe, sitemap) for automated agents. It is the `rel="api-catalog"` target of the homepage `Link` header (§6 header matrix). Body is a static file; its Content-Type is set in `next.config.ts` `headers()`. Source of truth: `apps/web/src/lib/security/agent-discovery.ts`.

---

## 18. Production verification checklist

> **Status (2026-06-19):** DNS cutover complete — site is live at `www.cleanstart.com`. Run these checks against production on every release PR.

1. `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build` — clean
2. `curl -I https://www.cleanstart.com` — assert HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, **no** X-Robots-Tag noindex
3. `curl https://www.cleanstart.com/robots.txt` — `Allow: /`, sitemap URL listed
4. `curl https://www.cleanstart.com/sitemap.xml` — valid XML; no `<priority>` or `<changefreq>`
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
19a. **Agent discovery:** `curl -I https://www.cleanstart.com/` shows a `Link:` header with `rel="api-catalog"`, `rel="sitemap"`, and `rel="service-desc"`; `curl https://www.cleanstart.com/.well-known/api-catalog` returns 200 valid link-set JSON with `Content-Type: application/linkset+json`
19b. **DNS-AID:** DoH query for `_index._agents.cleanstart.com` type `HTTPS` (and `SVCB`) returns `Status: 0` with an Answer, `AD: true` (§3 DNS-AID subsection has the exact curl)
19c. **Markdown for agents:** `curl -H "Accept: text/markdown" https://www.cleanstart.com/` returns `Content-Type: text/markdown` + `x-markdown-tokens`; without the header, `text/html` (§8)
20. **Mozilla Observatory + securityheaders.com:** scan returns A+ from both
21. **Sitemap accuracy:** `<lastmod>` matches the most recent CMS publish for at least one blog and one resource entry
22. **CAA / DNSSEC:** `dig CAA cleanstart.com +short` returns the three records; `dig DS cleanstart.com +short` returns the DS (registrar step — see §3 DNSSEC runbook; missing as of 2026-06-10); `dig +dnssec www.cleanstart.com` returns RRSIG with `ad` flag

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
| 7 | 2026-05-15 | Rendering strategy | No PPR / `cacheComponents` | ~~Strict nonce-CSP forces dynamic rendering~~ — **superseded 2026-06-10**: CSP dropped nonces (§4), so this rationale no longer holds; PPR now off by separate choice, not forced |
| 8 | 2026-05-15 | Cloudflare proxy mode | DNS-only (grey cloud) | Orange-cloud breaks Vercel cert renewal |
| 9 | 2026-05-15 | Lighthouse gate | 0.85 mobile / 0.95 desktop | Industry-realistic; trend toward 0.90 mobile |
| 10 | 2026-05-15 | Sitemaps | Single `sitemap.xml`; no priority/changefreq; accurate `lastmod` | Google ignores priority/changefreq |
| 11 | 2026-05-15 | `WebSite` `SearchAction` JSON-LD | Do not emit | Sitelinks searchbox killed 2024-11-21 |
| 12 | 2026-05-15 | Branching model | Short-lived feature branches off `development` (GitHub Flow) | `web`/`cms` long-lived branches retired |
