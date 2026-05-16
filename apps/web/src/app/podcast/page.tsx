import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { PodcastHero } from "@/components/sections/podcast/PodcastHero";
import { PodcastLatestEpisodes } from "@/components/sections/podcast/PodcastLatestEpisodes";
import { PodcastFeaturedContent } from "@/components/sections/podcast/PodcastFeaturedContent";
import { PodcastCTACards } from "@/components/sections/podcast/PodcastCTACards";
import {
  getFeaturedPodcastEpisodes,
  getPodcastEpisodes,
  getPodcastPage,
  isHydratedEpisode,
  type PodcastCtaCard,
} from "@/lib/podcast";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const dynamic = "force-dynamic";

const FALLBACK_TITLE = "Leadership Exchange";
const FALLBACK_DESCRIPTION =
  "Where industry leaders decode container security and define the future of the software supply chain.";

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
    title: "Get Updates",
    body: "Join our mailing list for curated insights and upcoming sessions.",
    ctaLabel: "Sign Up",
    ctaHref: "#",
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

  const [latestData, featured] = await Promise.all([
    getPodcastEpisodes({ limit }).catch(() => ({
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    })),
    getFeaturedPodcastEpisodes(2).catch(() => []),
  ]);

  const featuredHero =
    page && isHydratedEpisode(page.featuredHeroEpisode)
      ? page.featuredHeroEpisode
      : (latestData.docs[0] ?? null);

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
      <main>
        <PodcastHero page={page} featuredHero={featuredHero} />

        <FadeUp>
          <PodcastLatestEpisodes
            title={page?.latestEpisodesTitle ?? "Latest Episodes"}
            episodes={latestData.docs}
          />
        </FadeUp>

        <FadeUp>
          <PodcastFeaturedContent
            title={page?.featuredSectionTitle ?? "Featured Content"}
            highlight={page?.featuredSectionHighlight ?? "Content"}
            episodes={featured}
          />
        </FadeUp>

      </main>
      <Footer cta={<PodcastCTACards cards={ctaCards} />} />
    </>
  );
}
