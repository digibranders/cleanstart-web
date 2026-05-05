# CONTENT-MODEL.md — CMS → apps/web mapping

How the Payload CMS surfaces content to the public site. **One row per
collection / global**, with the URL it surfaces at, the consumption pattern,
and the JSON-LD schema generated.

> Source of truth for collection schemas: arch doc
> [`#new-fields`](../cleanstart-cms-architecture.html#new-fields).
> Source of truth for URLs: [`apps/cms/src/payload/lib/route-prefixes.ts`](../../apps/cms/src/payload/lib/route-prefixes.ts) +
> [`WEB-ARCHITECTURE.md §3`](./WEB-ARCHITECTURE.md#3--route-map-locked-against-live-cleanstartcom).
> Source of truth for typed shapes: `packages/types` (re-export of
> `apps/cms/payload-types.ts`).

---

## 1 · Collections

### `pages`

| Field | Web behavior |
|---|---|
| Public URL | `/<path>` — `path` is the computed nested path on the doc; falls back to `/<slug>` |
| Cache tag | `pages:<slug>` (+ `globals:*` for chrome) |
| JSON-LD | `WebPage` (default), upgraded to `Organization`/`AboutPage`/etc per slug heuristic |
| Drafts | yes — preview JWT + draft mode |
| Scheduled publish | yes — CMS cron flips `_status` |
| `aboutGalleries` relation | only resolved on `/about-us` (arch doc rule) |
| Route exception | hard-coded `/` (slug `home`); never the literal `/home` |

**Block rendering:** every block in `layout[]` renders via the registry
in [`COMPONENT-MAP.md`](./COMPONENT-MAP.md). Unknown block types render
as `null` with a Sentry breadcrumb (not an error — gracefully ignore).

### `blogs`

| Field | Web behavior |
|---|---|
| Public URL | `/blogs/<slug>` |
| Cache tag | `blogs:<slug>` + `blogs:list` for indexes |
| JSON-LD | `Article` + `BreadcrumbList` |
| Drafts | yes |
| Scheduled publish | yes |
| `bodyStats` (computed: readingMinutes / wordCount / tableOfContents) | rendered as ToC sidebar; `time-to-read` chip |
| `categories[]` | facet on `/blogs` listing |
| `relatedAuthors[]` | byline + author cards at top |
| `seo` group | `metadata` API; `og` image fallback to author avatar then default |
| `_publishedAt`, `updatedAt` | `datePublished`, `dateModified` JSON-LD |
| Lexical body | rendered with custom node renderers (table, link). Custom-node implementations land in `apps/cms/src/payload/lib/lexical/` (directory created when the first custom node ships per arch doc `#table-handling` / `#link-handling`). |

### `news`

| Field | Web behavior |
|---|---|
| Public URL | `/news/<slug>` |
| Cache tag | `news:<slug>` + `news:list` |
| JSON-LD | `NewsArticle` (mandatory `dateline` and `printSection` if present) |
| `isAccessibleForFree` | always `true` per arch doc — JSON-LD + meta both reflect |
| Sitemap | additional listing in `sitemap-news.xml` for items in last **48h** |
| Drafts | yes |

### `guides`

| Field | Web behavior |
|---|---|
| Public URL | `/guide/<slug>` (singular per live) |
| Listing | `/knowledge-hub` (schema decision pending; treat guides as the data source) |
| Cache tag | `guides:<slug>` + `guides:list` |
| JSON-LD | `TechArticle` + `BreadcrumbList`; if `faqs[].length >= 1`, also `FAQPage` |
| `faqs[]` | rendered as `<details>` accordion at end of page |
| `keywords[]` | `<meta name="keywords">` + Meilisearch index |
| `articleSections[]` | sticky ToC sidebar |
| `citations[]` | rendered as numbered footnotes; superscript link in body |

### `resources`

| Field | Web behavior |
|---|---|
| Public URL | `/resources/<slug>` (plural collection name per live) |
| Listing | `/resource-center` |
| Cache tag | `resources:<slug>` + `resources:list` |
| JSON-LD | `CreativeWork` (or `WhitePaper`) + `BreadcrumbList` |
| `gateForm` (relation, optional) | when present: download button replaced with `LeadForm` (proxy to CMS); on submit, CMS issues a signed download URL |
| When `gateForm` is null | direct download button — CDN-served from R2 |
| Drafts | yes |

### `events`

| Field | Web behavior |
|---|---|
| Public URL | `/event/<slug>` (singular per live) |
| Listing | `/events` |
| Cache tag | `events:<slug>` + `events:list` |
| JSON-LD | `Event` (with `eventStatus`, `eventAttendanceMode`, `location`) |
| `registrationMode` discriminator | `'internal'` → render in-page LeadForm bound to `registrationForm`; `'external'` → CTA opens `registrationUrl` in new tab |
| `startsAt`, `endsAt` | `startDate`, `endDate` JSON-LD; rendered with user's locale |
| Past events | listing filters `endsAt > now` by default; "/events?past=1" includes archived |

### `webinars`

Same shape as `events` plus:

| Field | Web behavior |
|---|---|
| Public URL | `/webinar/<slug>` (singular per live; ⚠ flag — see [`WEB-ARCHITECTURE.md §3`](./WEB-ARCHITECTURE.md#3--route-map-locked-against-live-cleanstartcom)) |
| Listing | `/webinar` (singular per live) |
| JSON-LD | `Event` with `eventAttendanceMode: OnlineEventAttendanceMode` |
| Recording URL | post-event, swaps the registration CTA for a "Watch recording" button |

### `jobs`

| Field | Web behavior |
|---|---|
| Public URL | `/job/<slug>` (singular per live) |
| Listing | `/careers` |
| Cache tag | `jobs:<slug>` + `jobs:list` |
| JSON-LD | `JobPosting` (full set: `title`, `description`, `datePosted`, `validThrough`, `employmentType`, `hiringOrganization`, `jobLocation` from `jobLocations` relation, `baseSalary` if set) |
| `source` discriminator | `'cms'` → in-page apply form bound to `applyForm` relation; `'ats'` → CTA opens `atsUrl` in new tab |
| `jobLocations[]` | facet on `/careers` listing; rendered as pills on detail |
| Drafts | yes |
| Auto-expire | listing filters `validThrough >= now`; CMS cron drops expired from sitemap |

### `authors`

| Field | Web behavior |
|---|---|
| Public URL | `/author/<slug>` (singular per live) |
| Listing | none separate (could ship `/teams` cross-link) |
| Cache tag | `authors:<slug>` |
| JSON-LD | `Person` |
| Renders | author profile + their `blogs`/`news`/`guides`/`resources` (looked up via a `relatedAuthors` reverse query in `lib/cms.ts`) |
| `linkedUser` | absent at v1 (arch doc lock); add in additive migration if multi-author self-edit needed |

### `categories`, `newsCategories`

| Field | Web behavior |
|---|---|
| Public URL | listing only — `/blogs?category=<slug>`, `/news?category=<slug>` (querystring; not separate route) |
| Cache tag | `categories:<slug>` (used as a tag for the queries that filter by it) |
| JSON-LD | `BreadcrumbList` segment when present in URL |

### `jobLocations`

Reference data for `jobs.jobLocations[]`. Not directly rendered as a page;
used to power the `/careers` location facet and `JobPosting.jobLocation`
JSON-LD.

### `aboutGalleries`

Read-only on `/about-us` only (arch doc rule). Renders in a `<Gallery>`
block when the page slug is `about-us`. Not exposed elsewhere.

### `redirects`

Server-side. `apps/web` honors them via Next middleware that calls a
typed `lib/cms.ts#resolveRedirect(path)` on every initial request and sets
the cache header for 24h. Migration redirects (Phase H) populate this
collection.

### `forms`

Not a public route — consumed by:
- `Pages` and `Pages.layout[]` `FormBlock` (renders the form fields per
  `forms.fields[]` with conditional logic + `formSchemaVersion`).
- `events.registrationForm`, `webinars.registrationForm`,
  `jobs.applyForm`, `resources.gateForm` (relation pickers).

The submit endpoint is **always** the CMS one; web proxies via
`/api/leads/submit` (see `WEB-ARCHITECTURE.md §7`).

### `leads`

Not consumed by `apps/web`. Reads only happen in admin (Payload UI +
admin-only CSV export endpoint). Web only **writes** leads via the proxy.

### `media`

R2-backed; surfaces as `<Image>` with `R2_PUBLIC_BASE` prefix. Sizes
chosen via Sharp transforms set by CMS upload hook.

### `users`

Not public.

---

## 2 · Globals

### `siteSettings`

Cache tag: `globals:siteSettings`.
Consumed by: layout (header logo + name), Footer, OG defaults.
Fields web cares about: `siteName`, `tagline`, `defaultOgImage`,
`socialLinks[]`, `supportEmail`.

### `mainNav`

Cache tag: `globals:mainNav`.
Consumed by: `<Header>`. Recursive `items[]` (`_navItem` block) — render
with `<NavMega>` if `items[].children?.length` else `<NavLink>`.

### `footerNav`

Cache tag: `globals:footerNav`.
Consumed by: `<Footer>`. Same recursive shape; rendered as columns.

### `legal`

Cache tag: `globals:legal`.
Consumed by: `/legal`, `/privacy-policy`, `/terms-and-condition`,
`/acceptable-use-policy` — each a top-level field on the global, rich-text
rendered via the Lexical → React renderer.

### `seoDefaults`

Cache tag: `globals:seoDefaults`.
Consumed by: `app/layout.tsx` `generateMetadata`. Provides title template,
default description, default OG image, twitter handle.

### `announcements`

Cache tag: `globals:announcements`.
Consumed by: `<AnnouncementsBar>` rendered atop `(marketing)` chrome.
A single active `_status='published'` row at a time wins; absent → bar
hidden. Editor-defined `dismissable` flag → renders close button that
sets a localStorage key with the announcement ID.

---

## 3 · Cache-tag derivation (cheat sheet)

`lib/revalidate.ts` derives revalidation tags from CMS webhook payloads:

```
event: afterChange | afterDelete
collection: pages | blogs | news | guides | resources | events |
            webinars | jobs | authors | categories | newsCategories |
            aboutGalleries | redirects | forms | media | leads | users
            | <global slug>

→ revalidateTag(`${collection}:${slug}`)
→ revalidateTag(`${collection}:list`)
→ if collection in {pages, blogs, news, ...} affect sitemap:
    revalidateTag('sitemap')
→ if collection === 'news': revalidateTag('sitemap-news')
→ if collection === 'mainNav' | 'footerNav' | 'announcements' |
    'siteSettings' | 'seoDefaults' | 'legal':
    revalidateTag(`globals:${slug}`)  // and revalidate root '/'
→ if event === afterChange and prevSlug !== slug:
    revalidateTag(`${collection}:${prevSlug}`)  // old URL too
```

---

## 4 · Draft-mode behavior

- `cookies().get('preview')` exists ⇒ `draftMode().enable()`.
- Server components call `lib/cms.ts#fetchDraft(collection, slug)`,
  which appends `?draft=true` and sends `Authorization: Bearer <token>`
  to `apps/cms`.
- Tags applied: `${collection}:${slug}:draft` (separate from published
  tags so we never bleed drafts into the public cache).
- A `<PreviewBanner />` mounts on every draft page with an "Exit preview"
  button that calls `/api/exit-preview`.

---

## 5 · Editorial state machine

```
draft → published → unpublished
   ↑        ↓
   ↑     scheduled (cron)
   ↑        ↓
   └────  versions (rollback target)
```

Web behavior per state:

- `draft`: visible only via preview JWT. Never indexed (robots `noindex`).
- `scheduled`: still draft to web until publish time.
- `published`: live, indexed.
- `unpublished`: serves 410 Gone (not 404 — search engines drop faster).
  An accompanying `redirects` row may rewrite to a sibling.

---

## 6 · GDPR / privacy cascade

Per arch doc [`#privacy-gdpr`](../cleanstart-cms-architecture.html#privacy-gdpr):

- Right-to-erasure cascade is owned by CMS — nothing in `apps/web` persists
  PII server-side.
- Web **must** strip PII from any analytics/error-tracking event:
  `email`, `phone`, `name`, `company` are scrubbed in the Sentry
  `beforeSend` and the GA4 `event` middleware in `lib/analytics.ts`.
- Cookie consent gates GA + Intercom. Until consent, only the strictly-
  necessary cookie set ships (`preview` cookie counts as functional, not
  analytic).
- DSAR audit log on the CMS side records `user_agent`, `accept_language`,
  and proxy chain length alongside IP+timestamp. IP alone is insufficient
  for forensic differentiation in a contested DSAR. Tracked as
  [BACKLOG-WEB W-D-16](./BACKLOG-WEB.md#cross-cutting-tickets).

---

## 7 · Open content questions

1. **Knowledge Hub schema** — arch doc `#decisions` open. Working
   assumption: `/knowledge-hub` lists `guides`. Confirm before W4-00.
2. **Podcast schema** — v1 = `pages` block-built. Episodes as separate
   collection if scale demands.
3. **Teams page data** — `pages` block-built using `authors` cards, or a
   dedicated `teams` collection? Default to `pages` until demand emerges.
4. **Authors listing route** — none separate today; `/teams` covers the
   need. Confirm with product.
5. **Migrated event microsites** (`/cleanstart-hitachi-*`,
   `/new-year-event-*`) — do they migrate to `pages` or `events`?
   Recommendation: `pages` (they're marketing pages tied to a date, not
   structured event listings).
