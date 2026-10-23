import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import { Container } from "@/components/layout";
import { ExpandableBox } from "@/components/sections/videos/ExpandableBox";
import { ScrollPane } from "@/components/sections/videos/ScrollPane";
import { CopyLinkButton } from "@/components/sections/videos/CopyLinkButton";
import { UpNext } from "@/components/sections/videos/UpNext";
import { VideoDescription } from "@/components/sections/videos/VideoDescription";
import { VideoPlayer } from "@/components/sections/videos/VideoPlayer";
import { VideoTopicPills } from "@/components/sections/videos/VideoTopicPills";
import { toIso8601Duration } from "@/lib/clean-libraries-video";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/podcast-utils";
import { SITE_URL, buildPageMetadata, clampMetaDescription } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, videoObjectSchema } from "@/lib/seo/jsonld";
import { getVideoBySlug, getVideos } from "@/lib/videos";
import { CLEANSTART_YOUTUBE_HANDLE_URL } from "@/lib/youtube-feed";
import {
  formatPublished,
  relatedVideos,
  videoCategoryLabel,
  videoPath,
  type Video,
} from "@/lib/videos-utils";
import { formatDurationLabel } from "@/lib/clean-libraries-video";

export const revalidate = 3600;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const videos = await getVideos();
  return videos.map((v) => ({ slug: v.slug }));
}

function socialImage(video: Video): { url: string; width: number; height: number; alt: string } | undefined {
  // Only the 1280x720 frame makes a clean social card; the 4:3 frame falls back
  // to the generated brand card.
  if (video.thumb === "hq") return undefined;
  return {
    url: youtubeThumbnail(video.id, "maxresdefault"),
    width: 1280,
    height: 720,
    alt: video.title,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) {
    return buildPageMetadata({
      title: "Video not found",
      description: "This video is not available.",
      path: `/videos/${slug}`,
      noindex: true,
    });
  }
  return buildPageMetadata({
    title: video.title,
    description: clampMetaDescription(video.summary),
    path: videoPath(video.slug),
    image: socialImage(video),
    type: "article",
    publishedTime: video.publishedAt,
  });
}

export default async function VideoPage({
  params,
}: {
  params: Promise<Params>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const [video, all] = await Promise.all([getVideoBySlug(slug), getVideos()]);
  if (!video) notFound();

  const url = `${SITE_URL}${videoPath(video.slug)}`;
  const related = relatedVideos(video, all, all.length);
  const facts = [
    formatPublished(video.publishedAt),
    ...(video.durationSeconds !== undefined ? [formatDurationLabel(video.durationSeconds)] : []),
    videoCategoryLabel(video),
  ].join("  ·  ");

  return (
    <>
      <JsonLd
        id="video-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Videos", path: "/videos" },
          { name: video.title },
        ])}
      />
      <JsonLd
        id="video-object"
        data={videoObjectSchema({
          name: video.title,
          description: video.summary,
          contentUrl: youtubeWatchUrl(video.id),
          embedUrl: `https://www.youtube.com/embed/${video.id}`,
          uploadDate: video.publishedAt,
          thumbnailUrl: youtubeThumbnail(video.id, video.thumb === "hq" ? "hqdefault" : "maxresdefault"),
          ...(video.durationSeconds !== undefined
            ? { duration: toIso8601Duration(video.durationSeconds) }
            : {}),
        })}
      />
      <Header />
      <main id="main-content" className="relative overflow-x-clip bg-white text-[#12101C]">
        {/* The site header is built for dark backgrounds, so a dark strip sits behind it
            and ends just below it. (The announcement bar is above <main>, so it is
            not part of this height.) The panes start under the header, so nothing
            scrolls through the strip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--cs-header-h)+var(--cs-header-extra)+6px)]"
          style={{
            background:
              "linear-gradient(180deg, #151021 0%, #10123e 70%, rgba(16,18,62,0.85) 100%)",
          }}
        />
        <Container className="relative pb-[var(--spacing-section-cta)] pt-[calc(var(--cs-header-h)+var(--cs-header-extra)+12px)] lg:pt-[calc(var(--cs-header-h)+var(--cs-header-extra))]">
          {/*
            Phone: one column on one grid, so the sticky player stays pinned for
            the whole page (the left wrapper is `display: contents` there).
            Desktop: two panes as tall as the window, each scrolling on its own.
            The announcement bar's height comes off the pane height so the
            bottom edge sits on the fold before the page has been scrolled.
          */}
          <div className="grid grid-cols-1 gap-x-7 gap-y-6 lg:h-[calc(100dvh-var(--cs-header-h)-var(--cs-header-extra)-var(--cs-announce-h,0px))] lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_420px]">
            <ScrollPane
              as="section"
              aria-label="Video and details"
              // Lenis would otherwise take the wheel and scroll the whole page.
              data-lenis-prevent
              // A scrollable region must be focusable or keyboard users cannot scroll it.
              tabIndex={0}
              className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:pb-10 lg:pl-1 lg:pr-3 lg:pt-6"
            >
              <nav aria-label="Breadcrumb" className="hidden font-sans text-[14px] text-[#5B5870] lg:block">
                <Link href="/videos" className="inline-flex items-center gap-2 hover:text-[#12101C]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                  </svg>
                  All videos
                </Link>
              </nav>
              <div className="sticky top-[var(--cs-header-h)] z-20 -mx-6 bg-black [--watch-radius:0px] sm:-mx-10 lg:static lg:mx-0 lg:bg-transparent lg:[--watch-radius:16px]">
              <VideoPlayer
                video={video}
                sizes="(min-width: 1280px) 920px, (min-width: 1024px) 66vw, 100vw"
                priority
                startWhenOpenedFromClick
                radius="var(--watch-radius)"
                className="lg:shadow-[0_24px_60px_rgba(40,24,120,0.22)] lg:ring-1 lg:ring-black/5"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <h1
                className="font-display font-semibold text-[#12101C]"
                style={{ fontSize: "var(--fs-h3)", lineHeight: 1.2, letterSpacing: "-0.02em", textWrap: "balance" }}
              >
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1B1F4F] ring-1 ring-white/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/security/cs-logomark.svg"
                      alt=""
                      aria-hidden
                      width={22}
                      height={22}
                      decoding="async"
                    />
                  </span>
                  <div className="leading-tight">
                    <p className="font-sans text-[15px] font-semibold text-[#12101C]">CleanStart</p>
                    <p className="font-sans text-[13px] text-[#5B5870]">Official channel</p>
                  </div>
                  <a
                    href={CLEANSTART_YOUTUBE_HANDLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex h-11 items-center rounded-full bg-[#151021] px-5 font-sans text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#2A2147] active:translate-y-px motion-reduce:transition-none"
                  >
                    Subscribe
                  </a>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <CopyLinkButton url={url} tone="light" />
                  <a
                    href={youtubeWatchUrl(video.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center rounded-full border border-[rgba(18,16,28,0.18)] bg-white px-[18px] font-sans text-[14px] font-medium text-[#12101C] transition-colors duration-200 hover:border-[#5B2EE0] hover:text-[#5B2EE0] active:translate-y-px motion-reduce:transition-none"
                  >
                    Watch on YouTube
                  </a>
                </div>
              </div>

              <div className="rounded-[16px] bg-[#F4F2FC] p-4 sm:p-5">
                <p className="mb-3 font-sans text-[14px] font-semibold text-[#12101C]">{facts}</p>
                <ExpandableBox collapsedHeight={116}>
                  <VideoDescription description={video.description} />
                </ExpandableBox>
              </div>

              <VideoTopicPills topics={video.topics} />
            </div>

            </ScrollPane>

            <ScrollPane
              as="aside"
              aria-label="Up next videos"
              data-lenis-prevent
              // A scrollable region must be focusable or keyboard users cannot scroll it.
              tabIndex={0}
              className="lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:pb-10 lg:pl-1 lg:pr-2 lg:pt-6"
            >
              <UpNext videos={related} headingId="up-next-title" />
            </ScrollPane>
          </div>
        </Container>
      </main>
      <Footer cta={<ReadyToSecureCTA />} />
    </>
  );
}
