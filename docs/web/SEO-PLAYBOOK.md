# SEO-PLAYBOOK.md — apps/web

Concrete recipes for metadata, OpenGraph, Twitter cards, JSON-LD, sitemap,
robots, canonical handling, and indexing pings. The web app's SEO surface
is *generated* — these are the contracts every page must follow.

> Source of truth (behavior): arch doc
> [`#structured-data`](../cleanstart-cms-architecture.html#structured-data),
> [`#seo-group`](../cleanstart-cms-architecture.html#seo-group),
> [`#sitemap-robots`](../cleanstart-cms-architecture.html#sitemap-robots).
> Source of truth (URL parity): live cleanstart.com sitemap (verified
> 2026-05-05). See [`WEB-ARCHITECTURE.md §3`](./WEB-ARCHITECTURE.md#3--route-map-locked-against-live-cleanstartcom).

---

## 0 · Hard rules

These ship as CI gates in W6 and pre-commit checks in `lib/seo/`:

1. **Every public route ships a `<link rel="canonical">`.** No
   exceptions. Listings with filters canonicalise to themselves *with*
   the filter; never strip the querystring back to base — that creates
   duplicate-content signals when filtered pages get linked externally.
2. **Every JSON-LD field comes from typed CMS data, not from memory.**
   When a field has no extraction source (e.g. you'd have to hand-write
   `proficiencyLevel`), omit the property — never invent. Run the build,
   inspect the rendered `<script type="application/ld+json">`, then
   validate against schema.org *before* committing.
3. **Auto-generate `BreadcrumbList` from URL path.** Any URL with 2+
   segments emits a BreadcrumbList without editor input. The path-to-name
   resolver lives in `lib/seo/breadcrumbs.ts` and uses the CMS doc title
   when available, falling back to slug-titlecase.
4. **`Organization` ships once site-wide**, injected from
   `globals/siteSettings`. No per-page Organization blocks; assemblers
   reuse the singleton.
5. **Never block JS-rendered SEO behind consent.** Title, description,
   canonical, OG, Twitter, JSON-LD all render server-side. Consent
   gates analytics/loading scripts — never the metadata.

## 1 · Metadata API patterns

Every route uses Next 16's `generateMetadata` (server-side, statically
analysable). Defaults from `globals/seoDefaults`; overrides from each
doc's `seo` field group.

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: '<seoDefaults.titleDefault>', template: '%s | CleanStart' },
  description: '<seoDefaults.descriptionDefault>',
  openGraph: {
    type: 'website',
    siteName: 'CleanStart',
    locale: 'en_US',
    images: [{ url: '<seoDefaults.ogImage>', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '<seoDefaults.twitter>',
  },
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};
```

Per-page override pattern:

```ts
// app/(marketing)/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPublished('pages', slug);
  if (!page) return { title: 'Not found' };
  return buildMetadata({
    title: page.seo?.title ?? page.title,
    description: page.seo?.description ?? excerpt(page),
    canonical: canonical(`/${page.path ?? page.slug}`),
    ogImage: page.seo?.ogImage ?? page.heroImage ?? defaults.ogImage,
    keywords: page.seo?.keywords,
    noindex: page._status === 'draft',
  });
}
```

`buildMetadata()` lives in `lib/seo/metadata.ts`.

---

## 2 · Canonical URLs

- `metadataBase` is `https://cleanstart.com` (no `www`).
- Server actively redirects `www.` → apex (already handled in Cloudflare;
  add Next-side check in middleware as defence in depth).
- Per-page `alternates.canonical` is set when the SEO field provides one
  (e.g. blog cross-posts). Otherwise self-canonical.
- Pagination: `/blogs?page=2` → canonical = `/blogs?page=2` (NOT `/blogs`),
  with `<link rel="prev"/next">` chain (still recommended despite Google
  deprecating signal weight).
- Filter querystrings (`?category=`, `?past=1`) → canonical = same URL
  with the filter; no canonicalising back to base list (it would dilute).

`lib/canonical.ts` mirrors the CMS-side helper at
[`apps/cms/src/payload/lib/canonical.ts`](../../apps/cms/src/payload/lib/canonical.ts).

---

## 3 · OpenGraph + Twitter

| Concern | Rule |
|---|---|
| OG image size | 1200×630 PNG/JPG; ≤ 200 KB; AVIF not yet broadly supported by social crawlers |
| OG image fallback chain | per-page `seo.ogImage` → page hero → author avatar (blogs/news/guides) → site default |
| `og:type` | `website` for marketing pages; `article` for `blogs`, `news`, `guides`; `event.event` for `events`/`webinars`; nothing custom for `jobs` (Twitter card-only) |
| `twitter:card` | `summary_large_image` everywhere (we always have a 1200×630) |
| `twitter:site` | `@cleanstart_inc` (or whatever `seoDefaults.twitter` returns) |
| `twitter:creator` | per-author for blogs, when author has a Twitter handle |

Dynamic OG generation:

- `app/opengraph-image.tsx` — site-wide default (uses Vercel's OG image
  helper or a similar Edge runtime renderer).
- `app/(marketing)/[slug]/opengraph-image.tsx` — per-page renderer that
  composes hero text + brand mark + gradient bg.
- For `/blogs/[slug]`: render `og-image.tsx` with title overlay.
- All OG renderers cache for 1 hour; revalidate on `seo.ogImage` change.

---

## 4 · JSON-LD recipes (per collection)

`lib/seo/jsonld.ts` exports typed builders. Components inject via:

```tsx
<Script type="application/ld+json" id={`jsonld-${slug}`}
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### Layer 1 (always emitted — auto from typed fields)

#### Site-wide
- `Organization` on `/` (siteSettings → name, url, logo, sameAs[])
- `WebSite` on `/` with `SearchAction` pointing at `/search?q={search_term_string}`

#### Per-page
- `BreadcrumbList` (built from URL segments + page title)
- `WebPage` with `@id`, `name`, `description`, `inLanguage: 'en-US'`

### Layer 2 (per collection)

#### `blogs` → `Article`

```ts
{
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: blog.title,
  image: [blog.heroImage?.url, blog.seo?.ogImage].filter(Boolean),
  author: blog.relatedAuthors.map(a => ({ '@type': 'Person', name: a.name, url: canonical(`/author/${a.slug}`) })),
  publisher: { '@type': 'Organization', name: 'CleanStart', logo: { '@type': 'ImageObject', url: logoUrl } },
  datePublished: blog._publishedAt,
  dateModified: blog.updatedAt,
  mainEntityOfPage: canonical(`/blogs/${blog.slug}`),
  wordCount: blog.bodyStats?.wordCount,
  keywords: blog.seo?.keywords?.join(', '),
}
```

#### `news` → `NewsArticle`

Same as `Article` plus:
```ts
{
  '@type': 'NewsArticle',
  isAccessibleForFree: true,        // arch doc rule
  dateline: news.dateline,
  printSection: news.section,
}
```

#### `guides` → `TechArticle` (+ `FAQPage` if `faqs[].length >= 1`)

```ts
{
  '@type': 'TechArticle',
  headline: guide.title,
  proficiencyLevel: guide.proficiency,  // if field exists; else omit
  about: { '@type': 'Thing', name: guide.subject },
  // … same fields as Article
}
```

If `faqs[].length >= 1`, additionally emit `FAQPage`:

```ts
{
  '@type': 'FAQPage',
  mainEntity: guide.faqs.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: stripLexical(f.answer) },
  })),
}
```

#### `resources` → `CreativeWork` or `WhitePaper`

```ts
{
  '@type': resource.kind === 'whitepaper' ? 'WhitePaper' : 'CreativeWork',
  name: resource.title,
  about: { '@type': 'Thing', name: resource.topic },
  isAccessibleForFree: !resource.gateForm,
  encodingFormat: 'application/pdf',
  fileFormat: 'application/pdf',
  publisher: orgPublisher,
}
```

#### `events` → `Event`

```ts
{
  '@type': 'Event',
  name: event.title,
  startDate: event.startsAt,
  endDate: event.endsAt,
  eventStatus: 'EventScheduled',  // or 'EventCancelled' / 'EventRescheduled'
  eventAttendanceMode: event.attendanceMode,  // 'Offline' | 'Online' | 'Mixed'
  location: event.locationKind === 'virtual'
    ? { '@type': 'VirtualLocation', url: event.virtualUrl }
    : { '@type': 'Place', name: event.venueName, address: { '@type': 'PostalAddress', ...event.address } },
  image: [event.heroImage?.url],
  description: event.description,
  organizer: { '@type': 'Organization', name: 'CleanStart', url: env.NEXT_PUBLIC_SITE_URL },
  offers: event.registrationMode === 'internal'
    ? [{ '@type': 'Offer', url: canonical(`/event/${event.slug}`), price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', validFrom: event._publishedAt }]
    : [{ '@type': 'Offer', url: event.registrationUrl, price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }],
}
```

#### `webinars` → `Event` with `eventAttendanceMode: OnlineEventAttendanceMode`

Same as `events` plus `eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode'`.

#### `jobs` → `JobPosting`

```ts
{
  '@type': 'JobPosting',
  title: job.title,
  description: stripLexical(job.description),
  datePosted: job._publishedAt,
  validThrough: job.validThrough,
  employmentType: job.employmentType,  // 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN'
  hiringOrganization: { '@type': 'Organization', name: 'CleanStart', sameAs: env.NEXT_PUBLIC_SITE_URL, logo: logoUrl },
  jobLocation: job.jobLocations.map(loc => ({
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressLocality: loc.city, addressRegion: loc.region, addressCountry: loc.country },
  })),
  jobLocationType: job.remote ? 'TELECOMMUTE' : undefined,
  baseSalary: job.salary && {
    '@type': 'MonetaryAmount',
    currency: job.salary.currency,
    value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max, unitText: job.salary.unit },
  },
  directApply: job.source === 'cms',
}
```

#### `pages` (page-builder)

Default `WebPage`. Page-builder blocks may upgrade:
- A `Pricing` block on the page → emit `Product` + `Offer` per plan.
- A `Testimonial` block → emit `Review` (only when block is on a product
  page).
- A `Stats` block → no JSON-LD (no Schema.org match).
- A `FAQ` block → `FAQPage` mainEntity.

### Layer 3 (advanced; ship in W4 if blocks exist)

- `HowTo` — when a page is a step-by-step guide (e.g. `/guide/...`
  with sectioned steps). Detected via heuristic on `articleSections[]`
  containing "Step" prefixes.
- `SoftwareApplication` — on product pages (`/cleansight`,
  `/cleanstart-images`, `/software-bill-materials`).
- `VideoObject` — on any page with an `Embed` block whose URL is
  YouTube/Vimeo (use `VideoObject` builder; fetch metadata at build time
  via oEmbed or static editor input).
- `Review` — on `/pricing` if testimonials are explicitly product reviews
  (with `reviewRating`).

### Validation

- `pnpm test:jsonld` runs Vitest snapshot tests on each builder with a
  fixture document set.
- `npm run validate:jsonld` (one-off; not CI) walks built pages, extracts
  every `<script type="application/ld+json">`, and runs `schema-dts` /
  `@schema-org/zod` validation. **W6 acceptance gate.**
- Manual: every PR that touches a JSON-LD builder runs the affected
  pages through Google's Rich Results Test before merge.

---

## 5 · Sitemap

### Sitemap index

`app/sitemap.ts` returns a paginated index. One sitemap segment per
collection plus one for marketing pages:

```
/sitemap.xml         (index)
/sitemap-pages.xml   (all `pages` rows)
/sitemap-blogs.xml   (paginated, 5000/segment)
/sitemap-news.xml    (last 48h only — Google News spec)
/sitemap-guides.xml
/sitemap-resources.xml
/sitemap-events.xml
/sitemap-webinars.xml
/sitemap-jobs.xml
/sitemap-authors.xml
```

Each segment ≤ 5000 URLs; auto-paginated when exceeded.

### Per-URL fields

```xml
<url>
  <loc>https://cleanstart.com/blogs/<slug></loc>
  <lastmod>2026-04-30T12:00:00Z</lastmod>
  <changefreq>monthly</changefreq>      <!-- guidance only; Google ignores -->
  <priority>0.7</priority>              <!-- 1.0 home, 0.8 listings, 0.7 details, 0.5 legal -->
</url>
```

### sitemap-news.xml

Per Google News spec — only items with `publication.publication_date >
now - 48h`. Implemented as a Route Handler at
`app/sitemap-news.xml/route.ts` (not Next's built-in sitemap helper, since
the news namespace requires custom XML).

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://cleanstart.com/news/<slug></loc>
    <news:news>
      <news:publication>
        <news:name>CleanStart</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>2026-05-04T09:00:00Z</news:publication_date>
      <news:title>...</news:title>
    </news:news>
  </url>
</urlset>
```

Cached 5 minutes; revalidated by CMS webhook on news publish.

---

## 6 · robots.txt

```
User-agent: *
Allow: /

# Block API + preview routes
Disallow: /api/
Disallow: /preview
Disallow: /search?

# AI training opt-out (defence in depth — also via Cloudflare)
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: anthropic-ai
Disallow: /
User-agent: ClaudeBot
Disallow: /

Sitemap: https://cleanstart.com/sitemap.xml
Sitemap: https://cleanstart.com/sitemap-news.xml
```

Confirm AI-bot policy with marketing leadership before launch — some
companies allow training crawlers for brand visibility.

---

## 7 · IndexNow

Primary path = CMS afterChange. Fallback = web `/api/revalidate` after a
successful tag invalidation. Key file: `app/<INDEXNOW_KEY>.txt` route
handler returns `process.env.INDEXNOW_KEY` as `text/plain` (no extension
mismatch).

---

## 8 · Internal linking

- Every block-level `<a>` to another internal route uses
  `<Link>` from `next/link` (prefetched on hover for marketing routes).
- Cross-collection links (a blog citing a guide, an event citing
  a resource) use the `linkField` helper from
  [`apps/cms/src/payload/fields/link.ts`](../../apps/cms/src/payload/fields/link.ts) — resolved at render time.
- Footer + main nav: every public route appears at least once
  in a discoverable nav (per Google "every page reachable in ≤ 3 clicks
  from home" guideline).

---

## 9 · Hreflang

Single-locale (`en-US`) at launch. Reserve the structure:

```ts
alternates: {
  canonical: '...',
  languages: {
    'en-US': '...',
    'x-default': '...',
  },
}
```

When localisation lands, add per-locale variants. Until then,
`x-default` ≡ `en-US`.

---

## 10 · Page-speed signals

Beyond perf budget (WEB-ARCHITECTURE §13):

- **LCP element**: explicit on every Hero — first `<Image priority>` or the
  first heading inside the hero, never a decorative blur.
- **Hint preconnects**:
  ```html
  <link rel="preconnect" href="https://${R2_PUBLIC_HOST}" crossorigin />
  <link rel="preconnect" href="https://${MEILI_HOST}" crossorigin />
  <link rel="preconnect" href="https://www.googletagmanager.com" />
  ```
- **DNS prefetch** for low-priority embeds (Calendly, Intercom).
- **Critical CSS**: rely on Next 16 / Tailwind v4 built-in inlining; do
  not hand-extract.
- **Font preload**: only Figtree weights 400 + 700; others lazy.

---

## 11 · Verifications + tooling

| Tool | When |
|---|---|
| Lighthouse-CI on Home + Pricing + Blog detail | every PR (W1+) |
| Google Rich Results Test | every JSON-LD-affecting PR (manual until tooling matures) |
| Google Search Console (post-launch) | weekly review |
| Bing Webmaster Tools | post-launch |
| `pnpm validate:jsonld` | **W-D-15 + W6 gate** — runs on every PR (per [BACKLOG-WEB W-D-15](./BACKLOG-WEB.md#cross-cutting-tickets)). Lighthouse 100 SEO **does not** validate JSON-LD; this gate does. |
| `pnpm validate:sitemap` | W6 gate (XML + URL liveness) |
| Schema.org validator | W6 gate |
| Twitter Card Validator | manual on launch |
| LinkedIn Post Inspector | manual on launch |
