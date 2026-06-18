import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { NewsBrowser } from "@/components/sections/newsroom/NewsBrowser";
import { NewsContent, selectNews } from "@/components/sections/newsroom/NewsContent";
import { getNews, getFeaturedNews, getNewsCategories } from "@/lib/news";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Newsroom";
const DESCRIPTION =
  "Stay current with CleanStart's latest press releases, partnership announcements, product launches, and milestones in secure container image and software supply chain security.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/news", eyebrow: "Newsroom" }, page);
}

/**
 * Static listing. The full news set is fetched once (cacheable, no
 * `searchParams` on the server) and filtering/search/pagination run on the
 * client (`NewsBrowser`), so the route is served as static HTML instead of
 * rendered per request. The Suspense fallback is the server-rendered default
 * (unfiltered, page 1) view — that's what lands in the static HTML, so crawlers
 * and no-JS clients still get the full first page. See /blogs for the pattern.
 */
export default async function NewsPage(): Promise<React.ReactElement> {
  const [featuredNews, newsData, categories] = await Promise.all([
    getFeaturedNews().catch(() => null),
    getNews({ limit: 1000 }).catch(() => ({
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    })),
    getNewsCategories().catch(() => []),
  ]);

  const allNews = newsData.docs;
  const initial = selectNews(allNews, { category: "", search: "", page: 1 });

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
      <Suspense
        fallback={
          <NewsContent
            featuredPost={featuredNews}
            categories={categories}
            items={initial.items}
            activeCategory=""
            searchQuery=""
            currentPage={1}
            totalPages={initial.totalPages}
          />
        }
      >
        <NewsBrowser
          allNews={allNews}
          featuredNews={featuredNews}
          categories={categories}
        />
      </Suspense>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
