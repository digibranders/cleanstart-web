import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { NewsBrowser } from "@/components/sections/newsroom/NewsBrowser";
import {
  NewsContent,
  selectNews,
  NEWS_PAGE_SIZE,
} from "@/components/sections/newsroom/NewsContent";
import { NewsroomHero } from "@/components/sections/newsroom/NewsroomHero";
import { CrawlableLinkIndex } from "@/components/ui/CrawlableLinkIndex";
import { logListingFetchFailure } from "@/lib/log-listing-fetch-failure";
import { getNews, getFeaturedNews, getNewsCategories } from "@/lib/news";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Newsroom";
const DESCRIPTION =
  "Stay current with CleanStart's latest press releases, partnership announcements, product launches, and milestones in secure container image and software supply chain security.";

export function generateMetadata(): Metadata {
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/news", eyebrow: "Newsroom" });
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
    getFeaturedNews().catch((err: unknown) => {
      logListingFetchFailure("/news", "getFeaturedNews", err);
      return null;
    }),
    getNews({ limit: 1000 }).catch((err: unknown) => {
      logListingFetchFailure("/news", "getNews", err);
      return {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        page: 1,
        totalDocs: 0,
        totalPages: 1,
      };
    }),
    getNewsCategories().catch((err: unknown) => {
      logListingFetchFailure("/news", "getNewsCategories", err);
      return [];
    }),
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
      {allNews.length > 0 && (
        <JsonLd
          id="news-list"
          data={itemListSchema(
            "CleanStart Newsroom",
            "/news",
            allNews.map((n) => ({ name: n.title, path: `/news/${n.slug}` })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <NewsroomHero featuredPost={featuredNews} searchQuery="" />
        </div>
        <Suspense
          fallback={
            <NewsContent
              categories={categories}
              items={initial.items}
              activeCategory=""
              searchQuery=""
              currentPage={1}
              totalPages={initial.totalPages}
            />
          }
        >
          <NewsBrowser allNews={allNews} categories={categories} />
        </Suspense>
        <CrawlableLinkIndex
          label="All newsroom articles"
          items={allNews
            .slice(NEWS_PAGE_SIZE)
            .map((n) => ({ href: `/news/${n.slug}`, title: n.title }))}
        />
      </main>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
