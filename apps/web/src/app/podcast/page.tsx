import type { Metadata } from "next";
// Aliased to avoid the name collision with the route-segment `export const dynamic`.
import nextDynamic from "next/dynamic";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { PodcastHero } from "@/components/sections/podcast/PodcastHero";
import { PodcastLatestEpisodes } from "@/components/sections/podcast/PodcastLatestEpisodes";
import { PodcastFeaturedContent } from "@/components/sections/podcast/PodcastFeaturedContent";
// PodcastChannelVideos sits below all the listing content; code-split out of
// the initial podcast client bundle.
const PodcastChannelVideos = nextDynamic(() =>
  import("@/components/sections/podcast/PodcastChannelVideos").then((m) => ({
    default: m.PodcastChannelVideos,
  })),
);
import {
  getFeaturedPodcastEpisodes,
  getHeroEpisode,
  getPodcastEpisodes,
  PODCAST_TITLE,
  type PodcastCtaCard,
} from "@/lib/podcast";
import {
  CLEANSTART_YOUTUBE_HANDLE_URL,
  getChannelVideos,
} from "@/lib/youtube-feed";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, podcastSeriesSchema } from "@/lib/seo/jsonld";

// Static + ISR. All fetches are cacheable: the CMS reads via fetchCMS
// (revalidate 60) and the YouTube RSS feed via `getChannelVideos`
// (revalidate 3600, regex-parsed, returns [] on error). No searchParams /
// cookies, so nothing forces dynamic rendering — the page is served from the
// edge like the rest of the site, refreshing the video list hourly.

// The /podcast layout — title, section headings, and CTA cards — is owned here
// in code. The CMS supplies only the episodes (videos + content) via the
// `podcastEpisodes` collection.
const PODCAST_DESCRIPTION =
  "Listen to CleanStart's podcast where industry leaders decode container security, software supply chain risk, and the future of trusted software delivery.";

const LATEST_EPISODES_LIMIT = 6;

const DEFAULT_CTA_CARDS: PodcastCtaCard[] = [
  {
    title: "Explore Resources",
    body: "Read the latest developments shaping CleanStart and the industry.",
    ctaLabel: "Resource Center",
    ctaHref: "/resource-center",
  },
  {
    title: "See What's New",
    body: "Pre-built, optimized base images with near-zero CVEs and automatic versioned updates.",
    ctaLabel: "Read Blogs",
    ctaHref: "/blogs",
  },
  {
    title: "Book a Demo",
    body: "See CleanStart in action with a personalized walkthrough from our team.",
    ctaLabel: "Book a Demo",
    ctaHref: "/book-a-demo",
  },
  {
    title: "Subscribe on YouTube",
    body: "Get every new episode the moment it drops on our channel.",
    ctaLabel: "Subscribe",
    ctaHref: CLEANSTART_YOUTUBE_HANDLE_URL,
  },
];

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PODCAST_TITLE,
    description: PODCAST_DESCRIPTION,
    path: "/podcast",
  });
}

export default async function PodcastPage(): Promise<React.ReactElement> {
  const [latestData, featured, heroEpisode, channelVideos] = await Promise.all([
    // Fetch one extra so dropping the hero episode below still leaves up to
    // LATEST_EPISODES_LIMIT cards in the Latest Episodes grid.
    getPodcastEpisodes({ limit: LATEST_EPISODES_LIMIT + 1 }).catch(() => ({
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    })),
    getFeaturedPodcastEpisodes(2).catch(() => []),
    getHeroEpisode().catch(() => null),
    getChannelVideos(6).catch(() => []),
  ]);

  // The hero video is the episode flagged `heroEpisode` in the CMS (the
  // Introduction); fall back to the newest episode when none is flagged.
  const featuredHero = heroEpisode ?? latestData.docs[0] ?? null;

  // The hero episode already plays in the hero above, so exclude it from the
  // Latest Episodes grid to avoid a duplicate.
  const latestEpisodes = (
    featuredHero
      ? latestData.docs.filter((ep) => ep.id !== featuredHero.id)
      : latestData.docs
  ).slice(0, LATEST_EPISODES_LIMIT);

  const ctaCards = DEFAULT_CTA_CARDS;

  return (
    <>
      <JsonLd
        id="podcast-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: PODCAST_TITLE },
        ])}
      />
      <JsonLd
        id="podcast-series"
        data={podcastSeriesSchema({
          name: PODCAST_TITLE,
          description: PODCAST_DESCRIPTION,
          path: "/podcast",
        })}
      />
      <Header />
      <main id="main-content">
        <PodcastHero featuredHero={featuredHero} />

        <FadeUp>
          <PodcastLatestEpisodes
            title="Latest Episodes"
            episodes={latestEpisodes}
          />
        </FadeUp>

        <FadeUp>
          <PodcastFeaturedContent
            title="Featured Content"
            highlight="Content"
            episodes={featured}
          />
        </FadeUp>

        <FadeUp>
          <PodcastChannelVideos
            videoHeading="From the CleanStart channel"
            videos={channelVideos}
            cards={ctaCards}
          />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
