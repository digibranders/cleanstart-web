import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import { RelatedVideos } from "@/components/sections/videos/RelatedVideos";
import { VideoMeta } from "@/components/sections/videos/VideoMeta";
import { VideoPlayer } from "@/components/sections/videos/VideoPlayer";
import { HERO_GRADIENT } from "@/components/sections/videos/VideosHero";
import { toIso8601Duration } from "@/lib/clean-libraries-video";
import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/podcast-utils";
import { buildPageMetadata, clampMetaDescription } from "@/lib/seo/canonical";
import { buildPageGraph } from "@/lib/seo/compose-page";
import { breadcrumbSchema, videoObjectSchema, webPageSchema } from "@/lib/seo/jsonld";
import { getVideoBySlug, getVideos } from "@/lib/videos";
import { VIDEOS_PAGE_PUBLIC } from "@/lib/videos-launch";
import { descriptionParagraphs, upNext, videoHref, videoFiltersQuery, DEFAULT_VIDEO_FILTERS } from "@/lib/videos-utils";

interface VideoPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR), so a video
// published after the last deploy gets its page without one.
export const dynamicParams = true;
export const revalidate = 3600;

const RELATED_COUNT = 6;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    return (await getVideos()).map((v) => ({ slug: v.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) {
    return buildPageMetadata({
      title: "Video",
      description: "CleanStart video.",
      path: `/videos/${slug}`,
      noindex: true,
    });
  }
  const thumb = video.thumb === "hq" ? "hqdefault" : "maxresdefault";
  return buildPageMetadata({
    title: video.title,
    description: clampMetaDescription(video.summary || `Watch ${video.title} from CleanStart.`),
    path: videoHref(video),
    eyebrow: "Video",
    image: {
      url: youtubeThumbnail(video.id, thumb),
      width: thumb === "hqdefault" ? 480 : 1280,
      height: thumb === "hqdefault" ? 360 : 720,
      alt: video.title,
    },
    noindex: !VIDEOS_PAGE_PUBLIC,
    nofollow: !VIDEOS_PAGE_PUBLIC,
  });
}

export default async function VideoPage({ params }: VideoPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const [video, videos] = await Promise.all([getVideoBySlug(slug), getVideos()]);
  if (!video) notFound();

  const related = upNext(videos, video, RELATED_COUNT);
  const paragraphs = descriptionParagraphs(video);
  const thumb = video.thumb === "hq" ? "hqdefault" : "maxresdefault";

  return (
    <>
      <JsonLdGraph
        id={`video-jsonld-${video.slug}`}
        graph={buildPageGraph({
          nodes: [
            webPageSchema({
              type: "WebPage",
              path: videoHref(video),
              name: video.title,
              description: video.summary,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Videos", path: "/videos" },
              { name: video.title },
            ]),
            videoObjectSchema({
              name: video.title,
              description: video.summary || video.title,
              contentUrl: youtubeWatchUrl(video.id),
              embedUrl: `https://www.youtube.com/embed/${video.id}`,
              uploadDate: video.publishedAt,
              thumbnailUrl: youtubeThumbnail(video.id, thumb),
              ...(video.durationSeconds !== undefined
                ? { duration: toIso8601Duration(video.durationSeconds) }
                : {}),
            }),
          ],
        })}
      />
      <Header />
      <main id="main-content">
        <section className="relative isolate overflow-hidden" aria-labelledby="video-title">
          <div aria-hidden className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
          <div className="relative mx-auto flex w-full max-w-[var(--container-default)] flex-col gap-6 px-6 pb-[clamp(56px,7vw,96px)] pt-[calc(var(--cs-header-h)+clamp(24px,3.5vw,64px)+var(--cs-header-extra))] sm:px-10">
            <nav aria-label="Breadcrumb">
              <ol
                className="flex flex-wrap items-center gap-x-2 font-sans text-white/75"
                style={{ fontSize: "var(--fs-caption)" }}
              >
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
            <div className="flex max-w-[960px] flex-col gap-3">
              <VideoMeta video={video} tone="dark" />
              <h1
                id="video-title"
                className="font-display font-semibold text-white"
                style={{ fontSize: "var(--fs-h2)", lineHeight: 1.15, letterSpacing: "-0.02em" }}
              >
                {video.title}
              </h1>
            </div>
            <VideoPlayer
              video={video}
              sizes="(min-width: 1024px) 960px, 100vw"
              priority
              radius="20px"
              className="max-w-[960px] shadow-[0_40px_90px_rgba(5,4,30,0.55)] ring-1 ring-white/15"
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-[var(--container-default)] px-6 pb-[var(--spacing-section-cta)] pt-12 sm:px-10">
          <div className="max-w-[720px]">
            <h2
              className="font-display font-semibold text-[#12101C]"
              style={{ fontSize: "var(--fs-h3)", letterSpacing: "-0.015em" }}
            >
              About this video
            </h2>
            {video.summary ? (
              <p
                className="mt-4 font-sans text-[#12101C]"
                style={{ fontSize: "var(--fs-lead)", lineHeight: 1.5 }}
              >
                {video.summary}
              </p>
            ) : null}
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 whitespace-pre-line font-sans text-[#3D3A4F]"
                style={{ fontSize: "var(--fs-body)", lineHeight: 1.6 }}
              >
                {paragraph}
              </p>
            ))}
            {video.topics.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Topics">
                {video.topics.map((topic) => (
                  <li key={topic.slug}>
                    <Link
                      href={`/videos${videoFiltersQuery({ ...DEFAULT_VIDEO_FILTERS, topic: topic.slug })}`}
                      className="inline-flex h-8 items-center rounded-full border border-[rgba(18,16,28,0.14)] px-3 font-sans text-[13px] font-medium text-[#3D3A4F] transition-colors duration-200 hover:border-[#5B2EE0] hover:text-[#5B2EE0] motion-reduce:transition-none"
                    >
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <RelatedVideos videos={related} />
          <p className="mt-12">
            <Link
              href="/videos"
              className="font-sans text-[15px] font-medium text-[#5B2EE0] underline underline-offset-4 hover:text-[#3A1BA8]"
            >
              All videos
            </Link>
          </p>
        </div>
      </main>
      <Footer cta={<ReadyToSecureCTA />} />
    </>
  );
}
