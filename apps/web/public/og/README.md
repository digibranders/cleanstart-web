# OpenGraph images

OG / Twitter cards are generated dynamically at `/api/og` (see
`apps/web/src/app/api/og/route.tsx`). `buildPageMetadata` builds the per-page
`/api/og?…` URL; CMS `seo.ogImage` still overrides it per record. There is no
static fallback PNG.
