# Podcast — "From the CleanStart channel" section (auto-pulled YouTube videos + compact cards)

**Date:** 2026-06-08
**Scope:** `apps/web` (podcast page). Branch: `development`.
**Status:** Design — awaiting user review.

## Problem

The podcast page's bottom section is currently `PodcastCTACards` — three large cards (Explore
Resources / See What's New / Get Updates). We want to **restructure this one section** into:

1. A grid of the **latest 6 videos**, auto-pulled from the CleanStart YouTube channel and
   auto-updating as new videos are uploaded.
2. The existing CTA cards, moved **below** the videos and shrunk into a **compact row of 4**
   (adding a new "Subscribe on YouTube" card so the row balances).

The existing CMS-driven `PodcastLatestEpisodes` section (curated, hand-seeded) stays as-is higher
up the page. This new block is the live "from the channel" feed and is intentionally distinct.

## Decisions (locked)

- **Placement:** restructure the existing CTA section into one section = 6-video grid on top,
  compact 4-card row below. Keep `PodcastLatestEpisodes` (CMS) untouched.
- **Data source:** YouTube **RSS/Atom feed** (`feeds/videos.xml?channel_id=…`) — no API key, no
  quota, no Google Cloud setup. Fetched server-side, revalidated hourly.
- **4th card:** "Subscribe on YouTube" → `https://www.youtube.com/@CleanStartOfficial`.
- **Video-grid heading:** "From the CleanStart channel" (default; overridable later).
- **Subscribe-card icon:** generated via ChatGPT image-gen in the user's Chrome browser, using an
  existing `.webp` card icon as the style reference, saved to `public/images/podcast/`.

## Architecture

### 1. Data layer — `apps/web/src/lib/youtube-feed.ts` (new)

```
CLEANSTART_YOUTUBE_CHANNEL_ID  // resolved once from @CleanStartOfficial → "UC…", typed const
CLEANSTART_YOUTUBE_HANDLE_URL = "https://www.youtube.com/@CleanStartOfficial"

export type ChannelVideo = {
  videoId: string;
  title: string;
  publishedAt: string;       // ISO
  thumbnailUrl: string;      // i.ytimg.com/vi/<id>/hqdefault.jpg (derived, feed-independent)
};

export function parseYouTubeFeed(xml: string, limit: number): ChannelVideo[];  // pure
export async function getChannelVideos(limit = 6): Promise<ChannelVideo[]>;    // fetch + parse
```

- `getChannelVideos` does `fetch(feedUrl, { next: { revalidate: 3600 } })`. The hourly revalidate
  gives "auto-updating" while keeping the page responsive (page is `force-dynamic`, but the feed
  response is cached for an hour). Network/parse errors → returns `[]` (never throws).
- `parseYouTubeFeed` is pure and unit-tested against a fixture XML. Extracts per `<entry>`:
  `yt:videoId`, `title`, `published`. Thumbnail is derived from the videoId
  (`youtubeThumbnail`) rather than trusting the feed's `media:thumbnail`, for consistency with the
  existing embed's fallback behavior. Capped to `limit`.
- **Channel ID resolution** is a one-time implementation step: fetch the channel page for
  `@CleanStartOfficial`, extract the `UC…` id, bake it into the const (with a comment noting how it
  was derived). The id is public and stable — no env var needed.

### 2. Section component — rename `PodcastCTACards.tsx` → `PodcastChannelVideos.tsx`

Props:
```
{ videoHeading: string; videos: ChannelVideo[]; cards: PodcastCtaCard[] }
```

Layout (inside the existing decorative section background — grid SVG, glow blobs, radial gradient
all retained):

- **Heading** — H2 `var(--fs-h2)`, "From the CleanStart channel". Rendered only when
  `videos.length > 0`.
- **Video grid** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (2×3 desktop), `gap` matching
  `PodcastLatestEpisodes`. Each cell: a 16:9 `YouTubeEmbed` (reused as-is — thumbnail facade,
  click-to-play, single-active via the existing `cleanstart:youtube-play` event) with the video
  title clamped to 2 lines below. Rendered only when `videos.length > 0`.
- **Compact card row** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. New internal
  `CompactResourceCard`: same visual language as the current `ResourceCard` (ring border, white
  card, glow) but shrunk — icon ≈ 56px, reduced padding, lower `min-height`, body clamped — so 4
  fit cleanly in a row. Always rendered (this is the section's CTA fallback when the feed is empty).

Graceful degradation: empty `videos` → heading + grid omitted, the 4 compact cards still render.

### 3. Card data — `apps/web/src/app/podcast/page.tsx`

- Add a 4th entry to `DEFAULT_CTA_CARDS`:
  `{ title: "Subscribe on YouTube", body: "…", ctaLabel: "Subscribe", ctaHref: CLEANSTART_YOUTUBE_HANDLE_URL }`.
- Add `getChannelVideos(6)` to the existing `Promise.all` (with `.catch(() => [])`); pass `videos`
  and `videoHeading` into `<PodcastChannelVideos>`. The CMS `ctaCards` override path is preserved;
  the `.slice(0, 3)` cap in the component becomes `.slice(0, 4)`.
- The dynamic import (`nextDynamic`) and `FadeUp` wrapper are kept; only the imported symbol name
  changes (`PodcastCTACards` → `PodcastChannelVideos`).

### 4. Subscribe-card icon asset

Generated during implementation: drive the user's Chrome browser (ChatGPT logged in), upload
`cta-card-icon-explore.webp` (or `-updates.webp`) as the style reference, prompt for a matching 3D
glossy-illustration YouTube/play-button icon on a transparent background, download it, run
`file --mime-type` to confirm format, save as `public/images/podcast/cta-card-icon-subscribe.webp`,
add it to the component's `CARD_ICONS` array, and verify it exists before referencing.

### Untouched
`PodcastHero`, `PodcastLatestEpisodes`, `PodcastFeaturedContent`, the `podcastEpisodes` collection,
and the CMS.

## CSP note (pre-existing, verify in this change)

`apps/web/src/lib/security/csp.ts` has **no `frame-src` for `youtube-nocookie.com`** and **no
`https://i.ytimg.com` in `img-src`** — both already required by the existing `YouTubeEmbed` used in
`PodcastLatestEpisodes`. This is pre-existing, not introduced here. Since this change adds more
embeds, verify the embeds render under CSP in preview; if blocked, add `frame-src
https://www.youtube-nocookie.com` and `https://i.ytimg.com` to `img-src` as a small hardening fix
in the same change.

## Testing & verification

- **Unit:** `youtube-feed.test.ts` — `parseYouTubeFeed` against a fixture Atom XML (correct count,
  field extraction, malformed/empty input → `[]`, `limit` cap).
- **Gates:** `pnpm --filter @cleanstart/web lint · typecheck · build`.
- **Visual:** desktop (1440×900) preview screenshot of the restructured section showing the 2×3
  video grid + 4 compact cards (incl. the generated Subscribe icon); confirm a video plays on click
  and no console/CSP errors.

## Out of scope (YAGNI)

- No YouTube Data API, no CMS sync job, no view-count/duration metadata.
- No new env vars (channel id is a public const).
- No changes to `PodcastLatestEpisodes` or any CMS collection.
