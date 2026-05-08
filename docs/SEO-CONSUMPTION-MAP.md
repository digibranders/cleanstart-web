# SEO consumption map

Which `seo.*` fields drive which output today, and which are
*aspirational* — stored but never read until `apps/web` (the public
renderer) ships. Refer to this when adding new SEO fields or wiring
the public site so nothing is dropped on the floor.

## Status legend

- ✅ **Live** — emitted in production output today.
- 🟡 **Stored, unused** — saved correctly; no consumer until apps/web.
- ⚪ **Editor-only** — internal scoring / authoring aid, not meant for output.

## Field-by-field

| Field | Status | Consumer(s) |
|---|---|---|
| `seo.title` | ✅ Live | JSON-LD `headline` / `name`; SERP preview UI |
| `seo.description` | ✅ Live | JSON-LD `description`; SERP preview UI |
| `seo.indexable` | ✅ Live | Sitemap inclusion; `composeRobotsMeta()` index/follow pair (see lib/seo/robots-meta.ts) |
| `seo.ogImage` | 🟡 Stored | **No HTML `<meta property="og:image">` emitter today.** JSON-LD `image` reads `heroImage` directly. When apps/web lands, wire `seo.ogImage → og:image → twitter:image` fallback. |
| `seo.ogImageAlt` | 🟡 Stored | Same as above; ride along in the OG emitter. |
| `seo.useAdvancedOg` | ⚪ Editor-only | Toggle that conditions ogTitle / ogDescription. |
| `seo.ogTitle` | 🟡 Stored | When apps/web lands: `og:title = ogTitle ?? seo.title ?? doc.title`. |
| `seo.ogDescription` | 🟡 Stored | `og:description = ogDescription ?? seo.description ?? doc.abstract`. |
| `seo.useAdvancedTwitter` | ⚪ Editor-only | Toggle. |
| `seo.twitterCard` | 🟡 Stored | `<meta name="twitter:card" content="...">`. Default `summary_large_image`. |
| `seo.twitterTitle` | 🟡 Stored | `twitter:title = twitterTitle ?? ogTitle ?? seo.title`. |
| `seo.twitterDescription` | 🟡 Stored | `twitter:description = twitterDescription ?? ogDescription ?? seo.description`. |
| `seo.twitterImage` | 🟡 Stored | `twitter:image = twitterImage ?? ogImage`. |
| `seo.useCustomCanonical` | ✅ Live (gate) | Read by `docCanonicalUrl()` to decide whether to use the override. |
| `seo.canonicalOverride` | ✅ Live | When the gate is on AND value is a valid HTTPS URL, replaces self-canonical in JSON-LD `url`/`@id`/`mainEntityOfPage`. When apps/web lands, also drives `<link rel="canonical">`. |
| `seo.robotsAdvanced.*` | 🟡 Stored | All directives (noarchive / nosnippet / noimageindex / notranslate / maxSnippet / maxImagePreview / maxVideoPreview / unavailableAfter) compose into a single `<meta name="robots" content="...">` via `composeRobotsMeta()`. |
| `seo.keywordTarget` | ⚪ Editor-only | Drives the body-density readout in the sidebar. **Never** emitted as a meta tag (Google deprecated `<meta name="keywords">` for ranking in 2009). |
| `seo.speakablePath` | ✅ Live | JSON-LD Article / NewsArticle `speakable` via `lib/jsonld/article.ts`. **Limited utility** — Google's Speakable feature is US-English news-only pilot. |
| `seo.additionalSchema` | ✅ Live | Admin-only JSON-LD escape hatch; emitted last in the dispatcher graph. |

## When `apps/web` lands

Wire (in priority order):

1. **`<link rel="canonical">`** — call `docCanonicalUrl()` on the doc. Same helper the JSON-LD emitter uses; single source of truth.
2. **`<meta name="robots">`** — call `composeRobotsMeta({ indexable, advanced: doc.seo?.robotsAdvanced })`.
3. **`<meta property="og:*">`** — apply the fallback chain above.
4. **`<meta name="twitter:*">`** — apply the fallback chain above.
5. **OG `article:*` namespace** for blogs / news / guides:
   - `article:author` (one tag per author byline)
   - `article:published_time` (`publishedAt`)
   - `article:modified_time` (`updatedAt`)
   - `article:section` (primary category name)
   - `article:tag` (one tag per topic / category)

   These come from existing collection fields, not the SEO group. JSON-LD already covers `author`/`datePublished`/`dateModified`; the OG `article:*` namespace is what Facebook reads for rich news cards.

## Adding a new SEO field

Checklist:

1. Add the field to `apps/cms/src/payload/fields/seo.ts` (in the right group).
2. Decide if it's editor-only, stored-for-later, or live. If live, wire the consumer immediately.
3. Update this doc with the new row.
4. Update `composeRobotsMeta()` if it's a robots directive.
5. Re-run `pnpm --filter @cleanstart/cms generate:types`; commit the regen.
