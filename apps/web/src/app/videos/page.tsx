import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import { CrawlableLinkIndex } from "@/components/ui/CrawlableLinkIndex";
import {
  VideosBrowser,
  VideosBrowserFallback,
  VIDEOS_PAGE_SIZE,
  type TopicOption,
} from "@/components/sections/videos/VideosBrowser";
import {
  VIDEOS_DESCRIPTION,
  VIDEOS_TITLE,
  VideosHero,
} from "@/components/sections/videos/VideosHero";
import { VideosTopics } from "@/components/sections/videos/VideosTopics";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";
import { getVideos, videoTopicOrder } from "@/lib/videos";
import { topicCounts, topicIndex, videoPath } from "@/lib/videos-utils";

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
  const defaultList = videos.filter((v) => v.id !== heroId);
  const beyondFirstPage = defaultList.slice(VIDEOS_PAGE_SIZE);
  const topics: TopicOption[] = topicCounts(videos, videoTopicOrder());

  return (
    <>
      <JsonLd
        id="videos-breadcrumbs"
        data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Videos" }])}
      />
      {videos.length > 0 && (
        <JsonLd
          id="videos-list"
          data={itemListSchema(
            VIDEOS_TITLE,
            "/videos",
            videos.map((v) => ({ name: v.title, path: videoPath(v.slug) })),
          )}
        />
      )}
      <Header />
      <main id="main-content">
        <VideosHero featured={featured} />
        <Suspense fallback={<VideosBrowserFallback videos={videos} topics={topics} heroId={heroId} />}>
          <VideosBrowser videos={videos} topics={topics} heroId={heroId} />
        </Suspense>
        <CrawlableLinkIndex
          label="More CleanStart videos"
          items={beyondFirstPage.map((v) => ({ href: videoPath(v.slug), title: v.title }))}
        />
        <div className="pb-[var(--spacing-section-cta)]">
          <VideosTopics topics={topicIndex(videos)} />
        </div>
      </main>
      <Footer cta={<ReadyToSecureCTA />} />
    </>
  );
}
