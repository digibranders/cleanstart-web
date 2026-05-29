import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { NewsroomHero } from "@/components/sections/newsroom/NewsroomHero";
import { NewsroomGrid } from "@/components/sections/newsroom/NewsroomGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import { getNews } from "@/lib/news";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Newsroom";
const DESCRIPTION =
  "Press releases, announcements, and media coverage of CleanStart's hardened container images and supply-chain security work.";

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
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
    noindex: page >= 6,
  });
}

export default async function NewsPage({
  searchParams,
}: NewsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeCategory = params.category ?? "";
  const searchQuery = params.q ?? "";

  let loadFailed = false;
  const newsData = await getNews({
    page,
    ...(activeCategory ? { category: activeCategory } : {}),
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
  });

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
          <NewsroomHero />
        </div>

        <FadeUp>
          <NewsroomGrid
            items={newsData.docs}
            currentPage={newsData.page}
            totalPages={newsData.totalPages}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            loadFailed={loadFailed}
          />
        </FadeUp>

      </main>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
