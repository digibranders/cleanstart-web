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
  VIDEOS_HEADING,
  VIDEOS_TITLE,
  VideosHero,
} from "@/components/sections/videos/VideosHero";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { VIDEOS_PAGE_PUBLIC } from "@/lib/videos-launch";
import { JsonLd, absoluteUrl, breadcrumbSchema, webPageSchema } from "@/lib/seo/jsonld";
import { getVideos, videoTopicOrder } from "@/lib/videos";
import { topicCounts, videoHref, type Video } from "@/lib/videos-utils";

// Static + ISR. The CMS read (or the YouTube feed, in catalog mode) behind
// `getVideos` is cached, and a CMS publish purges this path, so a change shows
// up without a deploy.
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: VIDEOS_TITLE,
    description: VIDEOS_DESCRIPTION,
    path: "/videos",
    eyebrow: "Videos",
    // noindex AND nofollow while the page is dark (see lib/videos-launch.ts).
    noindex: !VIDEOS_PAGE_PUBLIC,
    nofollow: !VIDEOS_PAGE_PUBLIC,
  });
}

// Every video has its own page (/videos/[slug]) that carries the VideoObject, so this
// list only points at them: the shape Google reads as a video carousel.
const videoListSchema = (videos: readonly Video[]): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: VIDEOS_HEADING,
  itemListElement: videos.map((v, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: absoluteUrl(videoHref(v)),
    name: v.title,
  })),
});

/**
 * Filters live in the URL and are applied in memory by `VideosBrowser`, so the
 * route stays static. The Suspense fallback is the unfiltered first view, which
 * is what the static HTML carries; every card title links to its own page
 * (`/videos/[slug]`), so crawlers reach every video from the HTML.
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
      <JsonLd
        id="videos-page"
        data={webPageSchema({
          type: "CollectionPage",
          path: "/videos",
          name: VIDEOS_HEADING,
          description: VIDEOS_DESCRIPTION,
        })}
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
