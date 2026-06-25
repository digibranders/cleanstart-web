# CMS on-demand cache-purge button — design

**Date:** 2026-06-25
**Status:** Approved (pending spec review)
**Scope:** `apps/cms` (admin UI + endpoint) and a small extension to `apps/web` (`/api/revalidate`).

---

## 1. Problem & context

apps/web pages are served from Next.js ISR on Vercel. When an editor edits and republishes a
doc, the CMS publish hook pings `apps/web` `/api/revalidate` to purge that page's ISR cache.
There is **no manual control**: if the automatic ping is ever missed, mis-scoped, or an editor
just wants to force a refresh (e.g. after a Media swap, an external data change, or to confirm a
fix), the only recourse is waiting out the 1-hour ISR TTL.

WordPress cache plugins solve this with a per-post "Clear cache" and a global "Purge all". This
feature brings the same affordance to the CMS admin, reusing the revalidation plumbing that
already exists (`revalidateWeb` helper + the `/api/revalidate` Bearer endpoint).

**Hard requirement:** it must work for **every** content type that has a live web page — never a
silent no-op — and that completeness must be *provable and drift-proof*, not assumed.

---

## 2. Goals / non-goals

**Goals**
- Per-document "Purge this page" button in the edit sidebar (editor+).
- Global "Purge entire site" button (admin-only).
- Custom path/tag purge (admin-only).
- Correct for all 12 web-facing collections; emits only real page URLs.
- A filesystem-backed test that fails CI if the purge map drifts from actual `apps/web` routes.

**Non-goals (YAGNI)**
- Scheduled / automatic purges (the publish hook already covers publish-time).
- CDN-edge purge beyond Vercel ISR (www serves Vercel directly — no Cloudflare HTML cache).
- A tag taxonomy UI beyond a free-text field.
- Cross-embed auto-purge (audit found no landing page embeds another collection's content;
  global purge covers any future case).

---

## 3. The source of truth: `web-pages.ts`

New module `apps/cms/src/payload/lib/web-pages.ts`. This is a **purpose-built, verified** map for
the purge feature — deliberately separate from `ROUTE_PREFIX` (which carries stale/aspirational
entries its other consumers tolerate, e.g. `categories`, `pages`, the dead `/webinar` detail).

```ts
export interface WebPage { detailPrefix?: string; listingPath?: string }

export const PURGEABLE_COLLECTIONS: Record<string, WebPage> = {
  blogs:          { detailPrefix: '/blogs',         listingPath: '/blogs' },
  news:           { detailPrefix: '/news',          listingPath: '/news' },
  guides:         { detailPrefix: '/guide',         listingPath: '/guide' },
  resources:      { detailPrefix: '/resources',     listingPath: '/resource-center' },
  events:         { detailPrefix: '/event',         listingPath: '/events' },
  jobs:           { detailPrefix: '/job',           listingPath: '/careers' },
  knowledgeBase:  { detailPrefix: '/knowledge-hub', listingPath: '/knowledge-hub' },
  legalDocuments: { detailPrefix: '/legal',         listingPath: '/legal' },
  authors:        { detailPrefix: '/author' },                 // detail only — no listing route
  'case-studies': { listingPath: '/case-studies' },            // listing only — no detail route
  webinars:       { listingPath: '/webinars' },                // listing only — /webinar/[slug] absent
  podcastEpisodes:{ listingPath: '/podcast' },                 // listing only — episodes on /podcast
}

export const isPurgeableCollection = (c: string): boolean =>
  Object.prototype.hasOwnProperty.call(PURGEABLE_COLLECTIONS, c)

/** Real page URLs for a doc — never a dead path. */
export const purgePathsForDoc = (
  collection: string,
  doc: { slug?: string | null },
): string[] => {
  const entry = PURGEABLE_COLLECTIONS[collection]
  if (!entry) return []
  const paths: string[] = []
  if (entry.listingPath) paths.push(entry.listingPath)
  if (entry.detailPrefix && typeof doc.slug === 'string' && doc.slug.length > 0) {
    paths.push(`${entry.detailPrefix}/${doc.slug}`)
  }
  return Array.from(new Set(paths))
}
```

Values were verified against the actual `apps/web/src/app` route tree (not `ROUTE_PREFIX`).
Excluded as non-web-facing: `categories`, `newsCategories`, `knowledgeCategories`, `pages`
(no catch-all route — marketing pages are hand-built React).

---

## 4. Components & data flow

```
[Edit sidebar]  PurgePageButton ──POST /api/cache-purge {scope:'page',collection,id}──┐
[/admin/cache]  GlobalPurge     ──POST /api/cache-purge {scope:'all'}─────────────────┤
[/admin/cache]  CustomPurge     ──POST /api/cache-purge {scope:'custom',paths,tags}───┤
                                                                                       ▼
                              cache-purge endpoint (apps/cms, cookie-authed, role-gated)
                                 · resolves real paths via web-pages.ts
                                 · records to audit-log
                                 · calls revalidateWeb(...)  ──Bearer──▶ apps/web /api/revalidate
                                                                            · revalidatePath(p)        (paths)
                                                                            · revalidatePath(p,'layout')(layoutPaths)
                                                                            · revalidateTag(t,'default')(tags)
```

The browser never holds `WEB_REVALIDATE_SECRET`; the secret stays server-side in the CMS, exactly
like the Integrations `TestButton`.

---

## 5. Endpoint: `POST /api/cache-purge`

Config-level endpoint (single path segment → not shadowed by Payload's REST router; the
3-segment 404 gotcha does not apply). Registered in `payload.config.ts` `endpoints`.

**Request (Zod-validated discriminated union on `scope`):**

| scope | body | access | resolves to |
|---|---|---|---|
| `page` | `{ collection: string, id: string\|number }` | editor+ (`isAdminOrEditor(req.user)`) | `revalidateWeb({ paths: purgePathsForDoc(collection, doc) })` |
| `all` | `{}` | admin (`hasRole(req.user,'admin')`) | `revalidateWeb({ layoutPaths: ['/'] })` |
| `custom` | `{ paths?: string[], tags?: string[] }` | admin | `revalidateWeb({ paths, tags })` |

**Handler rules**
- Reject unauthenticated (`!req.user`) → 401.
- `page`: `400` if `collection` not in `PURGEABLE_COLLECTIONS`; load the doc
  (`findByID`, `overrideAccess:true`); if `purgePathsForDoc` returns `[]` → `200 { ok:true,
  purged:{paths:[]}, note:'no_public_page' }` (honest, not a fake success).
- `custom`: every path must start with `/`; tags are non-empty strings; at least one of
  `paths`/`tags` present (else `400`). No path/tag is dropped silently — invalid input → `400`.
- Always record an `audit-log` row (actor `userId`, scope, resolved paths/tags, web result,
  timestamp), following the existing audit-log write pattern.
- Relay the apps/web result so the UI shows true success/failure (see §6).

**Response:** `{ ok: boolean, scope, purged: { paths?, tags?, layoutPaths? }, disabled?: boolean, webStatus?: number, note?: string }`.

---

## 6. Plumbing extension

`revalidateWeb` currently returns `Promise<void>` and only logs. Change it to return a fail-soft
result (still never throws) so the endpoint can relay true status to the toast:

```ts
export interface RevalidateRequest { tags?: readonly string[]; paths?: readonly string[]; layoutPaths?: readonly string[] }
export interface RevalidateResult { ok: boolean; disabled: boolean; status?: number; error?: string }
export const revalidateWeb = async (payload, request): Promise<RevalidateResult> => { ... }
```

- New `layoutPaths` field → apps/web does `revalidatePath(p, 'layout')` (true subtree purge).
  Global purge sends `layoutPaths: ['/']` — the canonical "revalidate everything" form
  (`revalidatePath('/')` alone only purges the homepage).
- `disabled:true` when `WEB_REVALIDATE_*` unset (dev) → endpoint returns `200` with
  `disabled:true` and the button toasts "revalidation disabled in this environment".
- The existing publish-hook caller ignores the return value — unaffected.

**apps/web `/api/revalidate`** (Bearer mode): parse `layoutPaths` (array, each `startsWith('/')`)
and `for (const p of layoutPaths) revalidatePath(p, 'layout')`. Existing `paths`/`tags` behavior
unchanged.

---

## 7. UI

**`PurgePageButton.tsx`** (client) — cloned from `TestButton`:
- `useDocumentInfo()` → `id`, `collectionSlug`; `useConfig()` → `serverURL`.
- Disabled until the doc is saved (`id` present). POSTs `scope:'page'`. Loading state +
  `showToast` success/error reporting the purged paths.
- Mounted via a shared `ui` field `purgePageUiField` (`admin.position:'sidebar'`,
  `components.Field` → `PurgePageButton`) imported into each of the **12** purgeable collections.

**`/admin/cache` view** (`CacheView.tsx`) + admin-only nav link (`afterNavLinks`, hidden for
non-admins via `useAuth`; the view also guards server-side):
- **Global purge** — button → `ConfirmDialog` (`@cleanstart/ui`) with a cost warning
  ("re-renders the whole site; billed ISR writes"), then `scope:'all'`.
- **Custom purge** — paths textarea (one per line) + tags input → `scope:'custom'`.
- **Recent purges** — last ~10 `audit-log` cache-purge rows (actor · scope · paths · time).

All new client components are added to `importMap.js` via `pnpm --filter @cleanstart/cms generate:importmap` (committed).

---

## 8. Access-control matrix

| Action | Anonymous | Editor | Admin |
|---|---|---|---|
| Per-doc purge | ✗ 401 | ✓ | ✓ |
| Global purge | ✗ 401 | ✗ 403 | ✓ |
| Custom purge | ✗ 401 | ✗ 403 | ✓ |
| See `/admin/cache` nav + view | ✗ | ✗ | ✓ |

Enforced server-side in the endpoint (source of truth); UI hiding is convenience only.

---

## 9. Error handling & edge cases

- **Dev / no secret** → `disabled:true`, clear toast, no error.
- **apps/web non-2xx / timeout** → `revalidateWeb` returns `ok:false`; endpoint relays; toast error.
- **Doc with no public page** (e.g. a draft author with no slug) → `purged.paths:[]`, honest note.
- **Slug just changed** → per-doc purges current detail + listing only; the old URL can be cleared
  via custom purge (documented in the page's helper text). The publish hook still handles the
  automatic old-URL purge on save.
- **Listing-only collections** (case-studies/webinars/podcast) → purge the listing; no dead detail path.
- **Double-click / spam** → button disabled while a request is in flight.
- **`revalidateWeb` never throws** → a purge failure never blocks the admin.

---

## 10. Testing

Unit (Vitest, co-located):
- `web-pages.test.ts` — `purgePathsForDoc` for every collection (detail+listing, listing-only,
  detail-only, unknown→`[]`); `isPurgeableCollection` includes the 12 and excludes
  `categories`/`pages`/etc.
- **`web-pages.routes.test.ts` (drift guard)** — globs `apps/web/src/app/**/page.tsx`, derives the
  set of real route URL-patterns (strip `(groups)`, keep `[slug]`), and asserts for every
  `PURGEABLE_COLLECTIONS` entry that `listingPath` and `detailPrefix + '/[slug]'` exist in that set.
  Fails CI if a route is renamed/removed or an entry is wrong. Route-group aware (handles `/legal`
  under `(legal)/legal`).
- **completeness test** — imports each of the 12 collection configs and asserts a `purgeCache` ui
  field is present; asserts the set of collections carrying the field equals
  `keys(PURGEABLE_COLLECTIONS)` (no missing, no extra).
- endpoint handler test — extract a pure `resolvePurge({ user, body, loadDoc })` helper; assert
  path resolution per scope and access gating (editor on `all`/`custom` → 403; anon → 401;
  unknown collection → 400; custom invalid path → 400).
- apps/web `route.test.ts` — `layoutPaths` triggers `revalidatePath(p,'layout')` (mock `next/cache`).

---

## 11. Staging verification matrix (proves "100%")

After deploy to staging, for **each** of the 12 collections: edit + per-doc purge, then
`curl -sI https://<host><url>` and confirm `age` resets to ~0 (`x-vercel-cache: HIT` with low age,
or `MISS` then `HIT`), and the content reflects the edit immediately (not after the TTL):

| Collection | Purge target verified |
|---|---|
| blogs/news/guides/resources/events/jobs/knowledgeBase/legalDocuments | detail + listing |
| authors | `/author/<slug>` detail |
| case-studies / webinars / podcastEpisodes | listing |

Plus: global purge resets a sample across page types; custom purge of `/news` resets that listing.

---

## 12. Rollout / deploy notes

- Requires deploying **both** apps. Until apps/web ships the `layoutPaths` change, global purge
  no-ops gracefully (returns ok, nothing purged); per-doc and custom **path** purge work against
  the already-deployed endpoint.
- Commit the regenerated `importMap.js`.
- No DB migration (audit-log already exists; no new collection, no new fields).
- `WEB_REVALIDATE_URL`/`WEB_REVALIDATE_SECRET` already set on the droplet (verified).

---

## 13. File inventory

**New**
- `apps/cms/src/payload/lib/web-pages.ts` (+ `.test.ts`, `.routes.test.ts`)
- `apps/cms/src/payload/endpoints/cache-purge.ts` (+ `.test.ts`)
- `apps/cms/src/payload/admin/components/cache/PurgePageButton.tsx`
- `apps/cms/src/payload/admin/components/cache/CacheView.tsx`
- `apps/cms/src/payload/admin/components/cache/CacheNavLink.tsx`
- `apps/cms/src/payload/fields/purge-page-ui.ts` (shared `purgePageUiField`)

**Modified**
- `apps/cms/src/payload/lib/web-revalidate.ts` (+`.test.ts`) — `layoutPaths`, return result.
- `apps/web/src/app/api/revalidate/route.ts` (+`.test.ts`) — `layoutPaths` branch.
- `apps/cms/src/payload.config.ts` — register endpoint + `/admin/cache` view + nav link.
- 12 collection files — import + spread `purgePageUiField` into sidebar fields.
- `apps/cms/src/app/(payload)/admin/importMap.js` — regenerated.
- completeness test asserting the 12.
