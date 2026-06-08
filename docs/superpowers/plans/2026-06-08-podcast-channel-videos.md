# Podcast Channel-Videos Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the podcast page's bottom CTA-cards section into one section that shows the latest 6 videos auto-pulled from the CleanStart YouTube channel (2×3 grid) above a compact row of 4 cards (the 3 existing + a new "Subscribe on YouTube").

**Architecture:** A new pure parser + server-side fetch helper (`lib/youtube-feed.ts`) reads the channel's public Atom/RSS feed (revalidated hourly). `PodcastCTACards.tsx` is renamed to `PodcastChannelVideos.tsx` and gains a heading + 2×3 video grid (reusing the existing `YouTubeEmbed` facade) above a compact 4-card row. `page.tsx` fetches the videos and adds the 4th card.

**Tech Stack:** Next.js 16 (App Router, server components + `fetch` revalidate), React 19, Tailwind v4, Vitest. No new dependencies — the Atom feed is parsed with targeted regex.

**Spec:** `docs/superpowers/specs/2026-06-08-podcast-channel-videos-design.md`

**Branch:** `development` (CMS + web both in scope; this plan only touches `apps/web`).

**Locked facts:**
- Channel handle: `@CleanStartOfficial`
- Channel ID: `UC13c-XRmRlkWpp6WMG9SDjw` (resolved from the channel page `externalId`)
- Feed URL: `https://www.youtube.com/feeds/videos.xml?channel_id=UC13c-XRmRlkWpp6WMG9SDjw`
- Refresh interval: hourly (`revalidate: 3600`)
- Subscribe URL: `https://www.youtube.com/@CleanStartOfficial`

---

## File Structure

- **Create** `apps/web/src/lib/youtube-feed.ts` — channel constants, `ChannelVideo` type, pure `parseYouTubeFeed`, async `getChannelVideos`.
- **Create** `apps/web/src/lib/youtube-feed.test.ts` — unit tests for `parseYouTubeFeed`.
- **Create** `apps/web/src/lib/__fixtures__/youtube-feed.xml` — a trimmed real-shape Atom fixture (3 entries).
- **Rename + rewrite** `apps/web/src/components/sections/podcast/PodcastCTACards.tsx` → `PodcastChannelVideos.tsx` — heading + video grid + compact 4-card row.
- **Modify** `apps/web/src/app/podcast/page.tsx` — fetch videos, add 4th card, render renamed section.
- **Add asset** `apps/web/public/images/podcast/cta-card-icon-subscribe.webp` — generated via ChatGPT in the user's Chrome browser.
- **Possibly modify** `apps/web/src/lib/security/csp.ts` — only if preview shows the embeds blocked.

---

## Task 1: YouTube feed parser (pure, TDD)

**Files:**
- Create: `apps/web/src/lib/__fixtures__/youtube-feed.xml`
- Create: `apps/web/src/lib/youtube-feed.ts`
- Test: `apps/web/src/lib/youtube-feed.test.ts`

- [ ] **Step 1: Create the test fixture**

Create `apps/web/src/lib/__fixtures__/youtube-feed.xml` (real YouTube Atom shape, 3 entries; note the escaped `&amp;` and `&#39;` in titles to exercise entity decoding):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>CleanStart</title>
 <entry>
  <id>yt:video:GqFPH4KKqpA</id>
  <yt:videoId>GqFPH4KKqpA</yt:videoId>
  <yt:channelId>UC13c-XRmRlkWpp6WMG9SDjw</yt:channelId>
  <title>CleanSight: A Complete software security posture management</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=GqFPH4KKqpA"/>
  <published>2026-05-27T13:36:30+00:00</published>
  <media:group>
   <media:thumbnail url="https://i4.ytimg.com/vi/GqFPH4KKqpA/hqdefault.jpg" width="480" height="360"/>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:ABCDEFGHIJK</id>
  <yt:videoId>ABCDEFGHIJK</yt:videoId>
  <title>Supply chain &amp; SBOM: what&#39;s changed</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=ABCDEFGHIJK"/>
  <published>2026-05-20T09:00:00+00:00</published>
 </entry>
 <entry>
  <id>yt:video:LMNOPQRSTUV</id>
  <yt:videoId>LMNOPQRSTUV</yt:videoId>
  <title>FIPS in containers</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=LMNOPQRSTUV"/>
  <published>2026-05-10T09:00:00+00:00</published>
 </entry>
</feed>
```

- [ ] **Step 2: Write the failing tests**

Create `apps/web/src/lib/youtube-feed.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseYouTubeFeed } from "./youtube-feed";

const fixture = readFileSync(
  join(__dirname, "__fixtures__/youtube-feed.xml"),
  "utf8",
);

describe("parseYouTubeFeed", () => {
  it("extracts videoId, title and publishedAt per entry, capped to limit", () => {
    const videos = parseYouTubeFeed(fixture, 2);
    expect(videos).toHaveLength(2);
    expect(videos[0]).toEqual({
      videoId: "GqFPH4KKqpA",
      title: "CleanSight: A Complete software security posture management",
      publishedAt: "2026-05-27T13:36:30+00:00",
      thumbnailUrl: "https://i.ytimg.com/vi/GqFPH4KKqpA/hqdefault.jpg",
    });
  });

  it("decodes XML entities in titles", () => {
    const videos = parseYouTubeFeed(fixture, 10);
    expect(videos[1].title).toBe("Supply chain & SBOM: what's changed");
  });

  it("derives the thumbnail from the videoId (ignores feed media:thumbnail host)", () => {
    const videos = parseYouTubeFeed(fixture, 1);
    expect(videos[0].thumbnailUrl).toContain("https://i.ytimg.com/vi/GqFPH4KKqpA/");
  });

  it("returns [] for empty or malformed input", () => {
    expect(parseYouTubeFeed("", 6)).toEqual([]);
    expect(parseYouTubeFeed("<feed></feed>", 6)).toEqual([]);
    expect(parseYouTubeFeed("not xml at all", 6)).toEqual([]);
  });

  it("skips entries missing a videoId", () => {
    const broken = "<feed><entry><title>no id</title></entry></feed>";
    expect(parseYouTubeFeed(broken, 6)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the tests, verify they fail**

Run: `pnpm --filter @cleanstart/web exec vitest run src/lib/youtube-feed.test.ts`
Expected: FAIL — `parseYouTubeFeed` is not exported / module not found.

- [ ] **Step 4: Implement `youtube-feed.ts`**

Create `apps/web/src/lib/youtube-feed.ts`:

```ts
import { youtubeThumbnail } from "./podcast-utils";

// Channel ID resolved once from the @CleanStartOfficial channel page
// (`externalId`). Public + stable, so it lives as a const rather than an env var.
export const CLEANSTART_YOUTUBE_CHANNEL_ID = "UC13c-XRmRlkWpp6WMG9SDjw";
export const CLEANSTART_YOUTUBE_HANDLE_URL =
  "https://www.youtube.com/@CleanStartOfficial";

const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CLEANSTART_YOUTUBE_CHANNEL_ID}`;
const FEED_REVALIDATE_SECONDS = 3600;

export type ChannelVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
};

const ENTRY_RE = /<entry>([\s\S]*?)<\/entry>/g;
const VIDEO_ID_RE = /<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/;
const TITLE_RE = /<title>([\s\S]*?)<\/title>/;
const PUBLISHED_RE = /<published>([\s\S]*?)<\/published>/;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .trim();
}

export function parseYouTubeFeed(xml: string, limit: number): ChannelVideo[] {
  if (typeof xml !== "string" || xml.length === 0) return [];
  const videos: ChannelVideo[] = [];
  for (const match of xml.matchAll(ENTRY_RE)) {
    if (videos.length >= limit) break;
    const block = match[1];
    const videoId = VIDEO_ID_RE.exec(block)?.[1];
    if (!videoId) continue;
    const title = decodeEntities(TITLE_RE.exec(block)?.[1] ?? "");
    const publishedAt = PUBLISHED_RE.exec(block)?.[1]?.trim() ?? "";
    videos.push({
      videoId,
      title,
      publishedAt,
      thumbnailUrl: youtubeThumbnail(videoId, "hqdefault"),
    });
  }
  return videos;
}

export async function getChannelVideos(limit = 6): Promise<ChannelVideo[]> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    return parseYouTubeFeed(await res.text(), limit);
  } catch {
    return [];
  }
}
```

- [ ] **Step 5: Run the tests, verify they pass**

Run: `pnpm --filter @cleanstart/web exec vitest run src/lib/youtube-feed.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/youtube-feed.ts apps/web/src/lib/youtube-feed.test.ts apps/web/src/lib/__fixtures__/youtube-feed.xml
git commit -m "feat(web): YouTube channel RSS feed parser + fetch helper"
```

---

## Task 2: Generate the "Subscribe" card icon (interactive — Chrome + ChatGPT)

**Files:**
- Add: `apps/web/public/images/podcast/cta-card-icon-subscribe.webp`

> This task is interactive and driven by the implementer using the user's Chrome browser (ChatGPT logged in). It produces an asset, no code. If the browser is unavailable, fall back to a clean inline red YouTube-glyph SVG in Task 3 instead and skip this task.

- [ ] **Step 1: Confirm a connected browser**

Use the Claude-in-Chrome MCP `list_connected_browsers`. If none, ask the user to open their Chrome with the GStack/Claude extension, or fall back to the inline SVG (see note above).

- [ ] **Step 2: Open ChatGPT and upload the style reference**

Navigate to `https://chatgpt.com/`. Upload `apps/web/public/images/podcast/cta-card-icon-explore.webp` as the style reference.

- [ ] **Step 3: Prompt for the icon**

Prompt (paraphrase as needed): "Using the attached icon as the exact style reference (same 3D glossy purple/blue gradient illustration look, same lighting, same soft shadow, transparent background), create a matching icon representing a YouTube subscribe / play button. Square, centered, transparent background, no text. High resolution PNG."

- [ ] **Step 4: Download and normalize the asset**

Download the generated image to a temp path. Detect format and convert to webp at ~200×200:

```bash
file --mime-type -b /tmp/subscribe-icon-download
# convert to webp (cwebp or sips); example with sips + cwebp if available:
cwebp -q 90 /tmp/subscribe-icon-download -o apps/web/public/images/podcast/cta-card-icon-subscribe.webp
```

If `cwebp` is unavailable, save the PNG as `cta-card-icon-subscribe.png` and reference that extension in Task 3 instead.

- [ ] **Step 5: Verify the file exists**

Run: `file --mime-type apps/web/public/images/podcast/cta-card-icon-subscribe.webp`
Expected: `image/webp` (or `image/png` for the fallback).

- [ ] **Step 6: Commit**

```bash
git add apps/web/public/images/podcast/cta-card-icon-subscribe.webp
git commit -m "feat(web): add Subscribe card icon for podcast section"
```

---

## Task 3: Rename + rewrite the section component

**Files:**
- Rename: `apps/web/src/components/sections/podcast/PodcastCTACards.tsx` → `apps/web/src/components/sections/podcast/PodcastChannelVideos.tsx`

This component renders inside the existing decorative section background (kept verbatim from the
current file: the grid SVG, the two blur blobs, the radial gradient). It adds a heading + 2×3 video
grid above a compact 4-card row.

- [ ] **Step 1: Rename the file via git**

```bash
git mv apps/web/src/components/sections/podcast/PodcastCTACards.tsx apps/web/src/components/sections/podcast/PodcastChannelVideos.tsx
```

- [ ] **Step 2: Update imports and props at the top of the file**

Replace the import block and `Props` type. New top of file:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { PodcastCtaCard } from "@/lib/podcast";
import type { ChannelVideo } from "@/lib/youtube-feed";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { YouTubeEmbed } from "./_components/YouTubeEmbed";

type Props = {
  videoHeading: string;
  videos: ChannelVideo[];
  cards: PodcastCtaCard[];
};

const CARD_ICONS = [
  "/images/podcast/cta-card-icon-explore.webp",
  "/images/podcast/cta-card-icon-news.webp",
  "/images/podcast/cta-card-icon-updates.webp",
  "/images/podcast/cta-card-icon-subscribe.webp",
] as const;
```

(Keep the existing `RING_BG`, `BUTTON_BG`, `BUTTON_SHADOW`, `GLOW_GRADIENT`,
`VERTICAL_LINE_FADE`, `HORIZONTAL_LINE_FADE` consts and the `ArrowRight` component as-is.)

- [ ] **Step 3: Add the `ChannelVideoCard` sub-component**

Add below `ArrowRight`:

```tsx
function ChannelVideoCard({ video }: { video: ChannelVideo }): React.ReactElement {
  return (
    <article className="flex flex-col w-full">
      <div
        className="relative overflow-hidden bg-white"
        style={{
          borderRadius: "16px",
          boxShadow:
            "0 4px 8px -4px rgba(22,34,51,0.08), 0 16px 24px rgba(22,34,51,0.08)",
        }}
      >
        <YouTubeEmbed
          videoId={video.videoId}
          title={video.title}
          thumbnailUrl={video.thumbnailUrl}
          rounded="16px"
        />
      </div>
      <h3
        className="font-display font-medium text-[#111111]"
        style={{
          fontSize: "var(--fs-h4)",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          marginTop: "16px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {video.title}
      </h3>
    </article>
  );
}
```

- [ ] **Step 4: Replace the large `ResourceCard` with a compact `CompactResourceCard`**

Replace the entire existing `ResourceCard` function with this compact variant (smaller icon,
padding, min-height; same ring/glow/white-card visual language):

```tsx
function CompactResourceCard({
  card,
  iconSrc,
}: {
  card: PodcastCtaCard;
  iconSrc: string;
}): React.ReactElement {
  return (
    <div className="relative flex w-full h-full">
      <div
        className="relative flex w-full"
        style={{
          borderRadius: "clamp(20px, 2vw, 28px)",
          background: RING_BG,
          padding: "clamp(5px, 0.5vw, 6px)",
        }}
      >
        <div
          className="relative flex w-full flex-col overflow-hidden bg-white"
          style={{
            borderRadius: "clamp(16px, 1.6vw, 22px)",
            boxShadow:
              "0 3px 4px rgba(22,34,51,0.04), 0 12px 24px rgba(22,34,51,0.06)",
            padding: "clamp(18px, 1.8vw, 24px)",
            gap: "clamp(10px, 1vw, 14px)",
            minHeight: "clamp(220px, 18vw, 260px)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "4%",
              top: "6%",
              width: "92%",
              height: "30%",
              background: "#df9bff",
              opacity: 0.35,
              filter: "blur(48px)",
              borderRadius: "50%",
            }}
          />
          <div
            className="relative"
            style={{ width: "56px", height: "56px" }}
          >
            <Image
              src={iconSrc}
              alt=""
              width={120}
              height={120}
              aria-hidden
              className="select-none pointer-events-none object-contain"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="relative flex flex-col" style={{ gap: "6px" }}>
            <h3
              className="text-[#111111]"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: "var(--fs-h4)",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
              }}
            >
              {card.title}
            </h3>
            <p
              className="text-[#555555]"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 400,
                fontSize: "var(--fs-body-sm)",
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
              }}
            >
              {card.body}
            </p>
          </div>
          <div className="relative mt-auto pt-2">
            <Link
              href={card.ctaHref}
              className="inline-flex items-center text-white transition-transform duration-200 hover:-translate-y-px active:translate-y-0"
              style={{
                height: "clamp(36px, 2.6vw, 40px)",
                paddingLeft: "12px",
                paddingRight: "12px",
                gap: "6px",
                background: BUTTON_BG,
                borderRadius: "8px",
                boxShadow: BUTTON_SHADOW,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "var(--fs-body-sm)",
                letterSpacing: "-0.01em",
                width: "fit-content",
              }}
            >
              <span>{card.ctaLabel}</span>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite the exported component**

Replace `export function PodcastCTACards(...)` with:

```tsx
export function PodcastChannelVideos({
  videoHeading,
  videos,
  cards,
}: Props): React.ReactElement | null {
  const visibleCards = cards.slice(0, 4);
  if (visibleCards.length === 0 && videos.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-white"
      aria-label="From the CleanStart channel"
    >
      {/* KEEP all existing decorative layers from the old PodcastCTACards section
          here verbatim: the top-right radial gradient div, the two md:block blur
          blobs, and the full grid <svg>. */}

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-[clamp(60px,7vw,100px)]">
        {videos.length > 0 && (
          <>
            <Reveal header>
              <h2
                className="text-left text-[#111111] font-bold"
                style={{
                  fontSize: "var(--fs-h2)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                }}
              >
                {videoHeading}
              </h2>
            </Reveal>
            <RevealStagger className="mt-[44px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[32px] gap-y-[40px]">
              {videos.map((video) => (
                <RevealItem key={video.videoId}>
                  <ChannelVideoCard video={video} />
                </RevealItem>
              ))}
            </RevealStagger>
          </>
        )}

        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch"
          style={{
            gap: "clamp(16px, 1.8vw, 24px)",
            marginTop: videos.length > 0 ? "clamp(48px, 5vw, 72px)" : "0",
          }}
        >
          {visibleCards.map((card, i) => (
            <RevealItem key={card.title}>
              <CompactResourceCard
                card={card}
                iconSrc={CARD_ICONS[i] ?? CARD_ICONS[0]}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
```

> If Task 2 fell back to a PNG, change the 4th `CARD_ICONS` entry extension accordingly. If Task 2
> was skipped entirely (no browser), replace the 4th entry with an inline red YouTube-glyph SVG
> rendered in place of the `<Image>` when `iconSrc` is the subscribe slot — but prefer the asset.

- [ ] **Step 6: Typecheck the component in isolation**

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit`
Expected: PASS (note: `page.tsx` still imports the old name until Task 4 — if tsc errors only on `page.tsx`'s import, that's expected and fixed next; the component file itself must be clean).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/sections/podcast/PodcastChannelVideos.tsx
git commit -m "feat(web): restructure podcast section into channel-videos grid + compact cards"
```

---

## Task 4: Wire up the page

**Files:**
- Modify: `apps/web/src/app/podcast/page.tsx`

- [ ] **Step 1: Update imports**

Change the static import line:

```tsx
import { PodcastFeaturedContent } from "@/components/sections/podcast/PodcastFeaturedContent";
```

…leave that as-is, and replace the dynamic import block:

```tsx
const PodcastChannelVideos = nextDynamic(() =>
  import("@/components/sections/podcast/PodcastChannelVideos").then((m) => ({
    default: m.PodcastChannelVideos,
  })),
);
```

Add to the `@/lib/podcast` import nothing new, and add a new import:

```tsx
import { getChannelVideos } from "@/lib/youtube-feed";
import { CLEANSTART_YOUTUBE_HANDLE_URL } from "@/lib/youtube-feed";
```

(Combine into one import line: `import { CLEANSTART_YOUTUBE_HANDLE_URL, getChannelVideos } from "@/lib/youtube-feed";`)

- [ ] **Step 2: Add the 4th default card**

Append to `DEFAULT_CTA_CARDS`:

```tsx
  {
    title: "Subscribe on YouTube",
    body: "Get every new episode the moment it drops on our channel.",
    ctaLabel: "Subscribe",
    ctaHref: CLEANSTART_YOUTUBE_HANDLE_URL,
  },
```

- [ ] **Step 3: Fetch the channel videos**

Add `getChannelVideos(6)` to the existing `Promise.all` (it already catches per-item):

```tsx
  const [latestData, featured, channelVideos] = await Promise.all([
    getPodcastEpisodes({ limit: limit + 1 }).catch(() => ({
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    })),
    getFeaturedPodcastEpisodes(2).catch(() => []),
    getChannelVideos(6).catch(() => []),
  ]);
```

- [ ] **Step 4: Render the renamed section with new props**

Replace the `<PodcastCTACards cards={ctaCards} />` usage:

```tsx
        <FadeUp>
          <PodcastChannelVideos
            videoHeading="From the CleanStart channel"
            videos={channelVideos}
            cards={ctaCards}
          />
        </FadeUp>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit`
Expected: PASS (no remaining references to `PodcastCTACards`).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/podcast/page.tsx
git commit -m "feat(web): wire channel videos + Subscribe card into podcast page"
```

---

## Task 5: Verification & CSP check

**Files:**
- Possibly modify: `apps/web/src/lib/security/csp.ts`

- [ ] **Step 1: Run the full web gate**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web exec tsc --noEmit
pnpm --filter @cleanstart/web build
```
Expected: all pass. Fix any failures before continuing.

- [ ] **Step 2: Start preview locked to desktop and load the podcast page**

Use `preview_start`, `preview_resize` to 1440×900, navigate to `/podcast`. (CMS must be reachable for the page's CMS fetches; the video grid itself needs only outbound internet for the RSS feed.)

- [ ] **Step 3: Check for CSP / console errors on the embeds**

Use `preview_console_logs` and `preview_network`. If YouTube `i.ytimg.com` thumbnails or the
`youtube-nocookie.com` iframe are blocked by CSP, edit `apps/web/src/lib/security/csp.ts`:
- add `"https://i.ytimg.com"` to the `imgSrc` array;
- add a `frame-src` directive: `["frame-src", "https://www.youtube-nocookie.com"]` to `directives`.
Then re-run the build and reload. (Pre-existing gap — see spec.)

- [ ] **Step 4: Visual proof**

Scroll the section into view (shift `document.body` per CLAUDE.md), force any opacity:0 reveal
wrappers visible, and `preview_screenshot`. Confirm: heading "From the CleanStart channel", a 2×3
video grid, and a 4-card compact row including the Subscribe card with its icon. Click one video
thumbnail and confirm it swaps to a playing iframe.

- [ ] **Step 5: Commit any CSP fix**

```bash
git add apps/web/src/lib/security/csp.ts
git commit -m "fix(web): allow YouTube embed hosts in CSP for podcast videos"
```
(Skip if no CSP change was needed.)

- [ ] **Step 6: Report results**

Report `lint ✓ · typecheck ✓ · build ✓ · unit ✓` and attach the section screenshot.

---

## Self-review notes

- **Spec coverage:** data layer (Task 1), Subscribe icon (Task 2), section restructure incl.
  heading + 2×3 grid + compact 4-card row + graceful degradation (Task 3), page wiring + 4th card
  + hourly fetch (Task 4), CSP verify + lint/typecheck/build + visual (Task 5). All spec sections
  mapped.
- **Type consistency:** `ChannelVideo` ({videoId, title, publishedAt, thumbnailUrl}) defined in
  Task 1 and consumed unchanged in Tasks 3–4. `parseYouTubeFeed`/`getChannelVideos` names stable.
  `PodcastChannelVideos` props ({videoHeading, videos, cards}) match between Task 3 and Task 4.
- **No placeholders:** all code shown in full; the only conditional is the Task-2 icon fallback,
  which is fully specified.
```
