import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import { Container } from "@/components/layout";
import { CopyLinkButton } from "@/components/sections/videos/CopyLinkButton";
import { UpNext } from "@/components/sections/videos/UpNext";
import { VideoDescription } from "@/components/sections/videos/VideoDescription";
import { VideoMeta } from "@/components/sections/videos/VideoMeta";
import { VideoPlayer } from "@/components/sections/videos/VideoPlayer";
import { VideoTopicPills } from "@/components/sections/videos/VideoTopicPills";
import { toIso8601Duration } from "@/lib/clean-libraries-video";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/podcast-utils";
import { SITE_URL, buildPageMetadata, clampMetaDescription } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, videoObjectSchema } from "@/lib/seo/jsonld";
import { getVideoBySlug, getVideos } from "@/lib/videos";
import { relatedVideos, videoPath, type Video } from "@/lib/videos-utils";

export const revalidate = 3600;

const HERO_GRADIENT =
  "linear-gradient(180deg, rgba(21, 16, 33, 1) 0%, rgba(16, 18, 62, 1) 40%, rgba(19, 30, 143, 1) 78%, rgba(71, 30, 192, 1) 100%)";

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
      <main id="main-content">
        <section
          aria-label="Video"
          className="relative"
          style={{ background: HERO_GRADIENT }}
        >
          <Container className="pb-[clamp(48px,6vw,88px)] pt-[calc(clamp(48px,5vw,80px)+var(--cs-header-extra)+var(--cs-header-h))]">
            <nav aria-label="Breadcrumb" className="mb-7 font-sans text-[14px] text-white/75">
              <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/videos" className="hover:text-white">
                    Videos
                  </Link>
                </li>
              </ol>
            </nav>
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
              <VideoPlayer
                video={video}
                sizes="(min-width: 1024px) 760px, 100vw"
                priority
                className="shadow-[0_40px_90px_rgba(5,4,30,0.55)] ring-1 ring-white/15"
              />
              <div className="flex flex-col gap-5">
                <VideoMeta video={video} tone="dark" />
                <h1
                  className="font-display font-semibold text-white"
                  style={{
                    fontSize: "var(--fs-h2)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.025em",
                    textWrap: "balance",
                  }}
                >
                  {video.title}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <CopyLinkButton url={url} />
                  <a
                    href={youtubeWatchUrl(video.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center rounded-full border border-white/30 px-[18px] font-sans text-[14px] font-medium text-white transition-colors duration-200 hover:bg-white/10 motion-reduce:transition-none"
                  >
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="pb-[var(--spacing-section-cta)] pt-[var(--spacing-section-md)]">
          <Container className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
            <div className="flex min-w-0 flex-col gap-8">
              <VideoDescription description={video.description} />
              <VideoTopicPills topics={video.topics} />
            </div>
            <aside>
              <UpNext videos={relatedVideos(video, all, 5)} headingId="up-next-title" />
            </aside>
          </Container>
        </section>
      </main>
      <Footer cta={<ReadyToSecureCTA />} />
    </>
  );
}
