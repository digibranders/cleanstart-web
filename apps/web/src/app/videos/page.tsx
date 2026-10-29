import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import {
  VideosBrowser,
  VideosBrowserFallback,
  type TopicOption,
} from "@/components/sections/videos/VideosBrowser";
import {
  VIDEOS_DESCRIPTION,
  VIDEOS_TITLE,
  VideosHero,
} from "@/components/sections/videos/VideosHero";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { toIso8601Duration } from "@/lib/clean-libraries-video";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/podcast-utils";
import { JsonLd, breadcrumbSchema, videoObjectSchema } from "@/lib/seo/jsonld";
import { getVideos, videoTopicOrder } from "@/lib/videos";
import { topicCounts, type Video } from "@/lib/videos-utils";

// Static + ISR. The CMS read (or the YouTube feed, in catalog mode) behind
// `getVideos` is cached, and a CMS publish purges this path, so a change shows
// up without a deploy.
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildListingMetadata({
    title: VIDEOS_TITLE,
    description: VIDEOS_DESCRIPTION,
    basePath: "/videos",
    eyebrow: "Videos",
  });
}

// Videos play inline on this page, so the list itself is what search engines
// index: one VideoObject per embed, in a single ItemList.
const videoListSchema = (videos: readonly Video[]): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: VIDEOS_TITLE,
  itemListElement: videos.map((v, i) => {
    const { "@context": _context, ...video } = videoObjectSchema({
      name: v.title,
      description: v.summary,
      contentUrl: youtubeWatchUrl(v.id),
      embedUrl: `https://www.youtube.com/embed/${v.id}`,
      uploadDate: v.publishedAt,
      thumbnailUrl: youtubeThumbnail(v.id, v.thumb === "hq" ? "hqdefault" : "maxresdefault"),
      ...(v.durationSeconds !== undefined ? { duration: toIso8601Duration(v.durationSeconds) } : {}),
    });
    return { "@type": "ListItem", position: i + 1, item: video };
  }),
});

/**
 * Filters live in the URL and are applied in memory by `VideosBrowser`, so the
 * route stays static. The Suspense fallback is the unfiltered first view, which
 * is what the static HTML carries; `CrawlableLinkIndex` adds the cards beyond
 * the first page as plain links. Same shape as /webinars and /blogs.
 */
export default async function VideosPage(): Promise<React.ReactElement> {
  const videos = await getVideos();
  // An editor's "featured" pick leads; otherwise the newest video does.
  const featured = videos.find((v) => v.featured) ?? videos[0] ?? null;
  const heroId = featured?.id ?? null;
  const topics: TopicOption[] = topicCounts(videos, videoTopicOrder());

  return (
    <>
      <JsonLd
        id="videos-breadcrumbs"
        data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Videos" }])}
      />
      {videos.length > 0 && <JsonLd id="videos-list" data={videoListSchema(videos)} />}
      <Header />
      <main id="main-content">
        <VideosHero featured={featured} />
        <Suspense fallback={<VideosBrowserFallback videos={videos} topics={topics} heroId={heroId} />}>
          <VideosBrowser videos={videos} topics={topics} heroId={heroId} />
        </Suspense>
      </main>
      <Footer cta={<ReadyToSecureCTA />} />
    </>
  );
}
