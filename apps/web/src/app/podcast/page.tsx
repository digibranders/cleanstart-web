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
  getPodcastEpisodes,
  getPodcastPage,
  isHydratedEpisode,
  type PodcastCtaCard,
} from "@/lib/podcast";
import {
  CLEANSTART_YOUTUBE_HANDLE_URL,
  getChannelVideos,
} from "@/lib/youtube-feed";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

// Static + ISR. All fetches are cacheable: the CMS reads via fetchCMS
// (revalidate 60) and the YouTube RSS feed via `getChannelVideos`
// (revalidate 3600, regex-parsed, returns [] on error). No searchParams /
// cookies, so nothing forces dynamic rendering — the page is served from the
// edge like the rest of the site, refreshing the video list hourly.

const FALLBACK_TITLE = "Leadership Exchange";
const FALLBACK_DESCRIPTION =
  "Listen to CleanStart's podcast where industry leaders decode container security, software supply chain risk, and the future of trusted software delivery.";

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

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPodcastPage();
  return buildPageMetadata({
    title: page?.heroTitle ?? FALLBACK_TITLE,
    description: page?.heroSubtitle ?? FALLBACK_DESCRIPTION,
    path: "/podcast",
  });
}

export default async function PodcastPage(): Promise<React.ReactElement> {
  const page = await getPodcastPage();
  const limit = page?.latestEpisodesLimit ?? 6;

  const [latestData, featured, channelVideos] = await Promise.all([
    // Fetch one extra so dropping the featured hero below still leaves up to
    // `limit` cards in the Latest Episodes grid.
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

  const featuredHero =
    page && isHydratedEpisode(page.featuredHeroEpisode)
      ? page.featuredHeroEpisode
      : (latestData.docs[0] ?? null);

  // The featured hero (e.g. the channel Introduction) already plays in the hero
  // above, so exclude it from the Latest Episodes grid to avoid a duplicate.
  const latestEpisodes = (
    featuredHero
      ? latestData.docs.filter((ep) => ep.id !== featuredHero.id)
      : latestData.docs
  ).slice(0, limit);

  const ctaCards =
    page?.ctaCards && page.ctaCards.length > 0
      ? page.ctaCards
      : DEFAULT_CTA_CARDS;

  return (
    <>
      <JsonLd
        id="podcast-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: page?.heroTitle ?? FALLBACK_TITLE },
        ])}
      />
      <Header />
      <main id="main-content">
        <PodcastHero page={page} featuredHero={featuredHero} />

        <FadeUp>
          <PodcastLatestEpisodes
            title={page?.latestEpisodesTitle ?? "Latest Episodes"}
            episodes={latestEpisodes}
          />
        </FadeUp>

        <FadeUp>
          <PodcastFeaturedContent
            title={page?.featuredSectionTitle ?? "Featured Content"}
            highlight={page?.featuredSectionHighlight ?? "Content"}
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
