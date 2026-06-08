import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { NewsroomHero } from "@/components/sections/newsroom/NewsroomHero";
import { NewsroomGrid } from "@/components/sections/newsroom/NewsroomGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import {
  getNews,
  getFeaturedNews,
  getNewsCategories,
  parseRegionParam,
  parseYearParam,
} from "@/lib/news";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Newsroom";
const DESCRIPTION =
  "Stay current with CleanStart's latest press releases, partnership announcements, product launches, and milestones in secure container image and software supply chain security.";

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    region?: string;
    year?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: NewsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/news",
    eyebrow: "Newsroom",
    noindex: page >= 6,
  });
}

export default async function NewsPage({
  searchParams,
}: NewsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeCategory = params.category ?? "";
  const activeRegion = parseRegionParam(params.region);
  const activeYear = parseYearParam(params.year);
  const searchQuery = params.q ?? "";

  let loadFailed = false;
  const [featuredPost, newsData, categories] = await Promise.all([
    getFeaturedNews().catch(() => null),
    getNews({
      page,
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(activeRegion ? { region: activeRegion } : {}),
      ...(activeYear ? { year: activeYear } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }).catch(() => {
      loadFailed = true;
      return {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        page: 1,
        totalDocs: 0,
        totalPages: 1,
      };
    }),
    getNewsCategories().catch(() => []),
  ]);

  return (
    <>
      <JsonLd
        id="news-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Newsroom" },
        ])}
      />
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <NewsroomHero
            featuredPost={featuredPost}
            searchQuery={searchQuery}
          />
        </div>

        <FadeUp>
          <NewsroomGrid
            items={newsData.docs}
            currentPage={newsData.page}
            totalPages={newsData.totalPages}
            categories={categories}
            activeCategory={activeCategory}
            activeRegion={activeRegion}
            activeYear={activeYear}
            searchQuery={searchQuery}
            loadFailed={loadFailed}
          />
        </FadeUp>

      </main>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
