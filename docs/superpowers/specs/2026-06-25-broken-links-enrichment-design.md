# Broken Links enrichment — design

**Date:** 2026-06-25
**Status:** Approved, ready for implementation plan
**Scope:** `apps/cms` only — the `brokenLinks` collection, its scanner, its cron, and admin UI.

## Problem

The Broken Links admin table (System → Broken links) is populated by the nightly
`checkBrokenLinks` cron. Today it has three gaps for an editor trying to fix a link:

1. **No anchor text** — you see the URL but not the visible link text, so finding it on the page is guesswork.
2. **No usable page reference** — only `sourceCollection` + `sourceDocId` ("events / 12"); not the page title, not clickable.
3. **Redirects are reported as defects** — every 3xx is persisted as a `redirect` row, but a redirect is just a hop, not a broken link. The list is full of healthy `redirect` rows (NIST/CSRC etc.) that drown out the genuinely broken ones.

Already-correct behavior to preserve: rows are keyed by `url + sourceDocId`, so the
same link on two different pages is already two distinct rows. No change there.

## Goals

- Capture and show the **anchor text** of each broken link.
- Show **which page** the link is on — page title, clickable through to the source doc's admin edit page (and its live URL).
- **Follow redirects** and classify by the *final* landing page: a redirect to a healthy page disappears; a redirect that lands on a 4xx/5xx is shown as broken.
- Enrich the **detail (edit) page** so it reads "what's broken → where it lives → tracking", with the actionable values clickable.

Non-goals: no full redirect-hop chain UI (final URL is enough); no change to the
cron schedule; no touching collections other than `brokenLinks`.

## Data model — `BrokenLinks.ts`

Four new persisted fields, all `type: 'text'`, nullable, `admin.readOnly` (the
collection denies create/update; the cron writes with `overrideAccess`):

| Field | Meaning |
|---|---|
| `anchorText` | Visible link text for rich-text links; `null` for typed-field URLs (those carry their label in `location`). |
| `sourceDocTitle` | The source doc's `useAsTitle: 'title'` value, captured at scan time. |
| `finalUrl` | The destination after following redirects, stored **only when it differs** from `url`. Null for direct (non-redirected) links. |
| `location` | Where the link lives in the doc: `"Body"` for rich-text links, or the field label (`"Apply URL"`, `"Registration URL"`, …) for typed-field links. |

The `status` select **keeps** its `redirect` option (marked deprecated in a comment).
Postgres cannot cleanly `DROP` an enum value and `migrate:create` is interactive
here, so removing it would force a painful enum migration for no benefit. The scanner
will simply never emit `redirect` again; existing `redirect` rows are reclassified or
cleared on the first post-deploy rescan.

`defaultColumns` (list view): `url`, `anchorText`, `status`, `sourceDocTitle`,
`sourceCollection`, `lastChecked`.

### Admin components

- **`SourcePageCell`** (list) — renders `sourceDocTitle` as a link to
  `/admin/collections/<sourceCollection>/<sourceDocId>`. Admin-edit target works
  uniformly for all 9 scanned collections (including Pages). Modeled on the existing
  `RelationshipCell.tsx` pattern; registered via `generate:importmap`.
- **Detail-page Field components** — make the broken URL a clickable external link
  (new tab) and the source page a link to its admin edit page + live URL. Read-only
  presentation only; no write path.

Detail-page field grouping:
- **The link:** broken URL (clickable), `anchorText`, `status`, HTTP status (labelled, e.g. `404 · Not Found`), `finalUrl`.
- **Where it lives:** source page (clickable title → edit), `location`, `sourceCollection` / `sourceDocSlug` / `sourceDocId`.
- **Tracking (sidebar):** status chip, first seen / "broken since" (age derived from `firstSeenAt`), `lastChecked`, `note`.

Derived display (UI only, no columns): the HTTP-status label and the "broken since" age.

## Scanner — `lib/broken-links/extract.ts` + `scan.ts`

### Anchor text + location (`extract.ts`)

`extractLinksFromLexical` currently dedupes URLs into a bare `Set<string>`,
discarding anchor text. Change it to return `{ url, anchorText }[]`, collecting the
visible text from each link node's descendant text children (first occurrence wins
when the same URL appears twice in one body).

`extractAllLinks` returns `{ url, anchorText, location }[]`:
- Rich-text links → `location: 'Body'`, `anchorText` = visible text.
- Typed-field URLs (`applyUrl`, `atsUrl`, `registrationUrl`, `recordingUrl`, `slidesUrl`, `newsLink`, `seo.canonicalOverride`) → `location` = a human label for that field, `anchorText: null`.

SSRF filtering (`isSafePublicHttpUrl`) is unchanged — every emitted URL still passes the guard.

### Redirect-following + final classification (`scan.ts`)

`checkUrl` replaces "any 3xx → `redirect`" with a manual redirect-following loop:

```
current = url; hops = 0; MAX_HOPS = 5
loop:
  if !isSafePublicHttpUrl(current).ok        -> return { network, httpStatus: 0 }
  res = HEAD current (manual redirect); GET fallback on 405/501
  2xx                                         -> return { ok,     httpStatus, finalUrl: current }
  3xx:
     loc = res.headers.location
     if !loc                                  -> return { broken, httpStatus, finalUrl: current }  // dangling
     current = new URL(loc, current); hops++
     if hops > MAX_HOPS                        -> return { broken, httpStatus, finalUrl: current }  // loop
     continue
  4xx / 5xx                                    -> return { broken, httpStatus, finalUrl: current }
  (fetch throws / timeout)                     -> return { network, httpStatus: 0 }
```

- Each hop is re-validated through the SSRF guard — the codebase guards every
  outbound fetch, and blind `redirect: 'follow'` would let an editor-planted link
  302 to an internal address. Manual following preserves that posture.
- `finalUrl` is recorded; the persist layer stores it only when it differs from `url`.
- Emitted `LinkStatus` narrows to `'ok' | 'broken' | 'network'`. `redirect` is gone
  from the scanner. (The collection select keeps the deprecated option — see above.)

`BrokenLinkRecord` and the internal `Pair` gain `anchorText`, `sourceDocTitle`,
`finalUrl`, `location`. The scanner captures `doc.title` for `sourceDocTitle`. The
one-HEAD-per-unique-URL dedup is unchanged (it governs only the fetch; the check
result now includes `finalUrl`, fanned back out to every pair referencing that URL).

## Cron — `jobs/check-broken-links.ts`

Persist the four new fields on both `create` and `update`. `finalUrl` is written as
`record.finalUrl !== record.url ? record.finalUrl : null`. No other handler change;
the delete-on-resolve and pagination logic stand. Because the scanner no longer emits
`redirect`, the existing `if (record.status === 'ok') continue` skip still correctly
drops healthy (including redirect-to-healthy) links so they never persist.

## Migration / types / importmap

- One **additive, hand-written** migration adding nullable `anchor_text`,
  `source_doc_title`, `final_url`, `location` text columns to `broken_links`,
  modeled on an existing `add_*` migration. (Four nullable text columns are safe to
  mirror by hand; `migrate:create` needs a TTY.)
- `pnpm --filter @cleanstart/cms generate:types` — commit the regenerated types.
- `pnpm --filter @cleanstart/cms generate:importmap` — register the new admin
  components; commit `importMap.js`.

## Tests

- `extract.test.ts` — anchor text captured; typed-field links get the right `location`; first-occurrence anchor wins.
- `scan.test.ts` — redirect to 2xx → `ok` + `finalUrl`; redirect chain to 404 → `broken` with final `httpStatus`; dangling/looping redirect → `broken`; SSRF-blocked hop → `network`; `anchorText`/`sourceDocTitle`/`location` threaded onto records.
- `check-broken-links.test.ts` — new fields persisted on create + update; `finalUrl` null when equal to `url`; no `redirect` rows produced.
- `BrokenLinks.test.ts` + `__snapshots__/BrokenLinks.snap.json` — updated for the new fields.

## Rollout

After deploy to `main` (CI runs the migration), re-run the one-shot scan
(`scripts/run-broken-links-scan.ts`, as used before) to backfill anchor text / title
/ location / finalUrl on existing rows and purge the now-resolved `redirect` rows.
The nightly cron self-heals thereafter. The post-deploy scan is the only ops step.

## Mandatory checks before reporting done

`pnpm --filter @cleanstart/cms lint` · `typecheck` · `build` · `test`.
