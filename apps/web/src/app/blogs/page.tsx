import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsBrowser } from "@/components/sections/blogs/BlogsBrowser";
import { BlogsContent, selectBlogs } from "@/components/sections/blogs/BlogsContent";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { getFeaturedBlog, getBlogs, getBlogCategories } from "@/lib/blog";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Blogs";
const DESCRIPTION =
  "Explore CleanStart's blog expert insights on container security, software supply chain threats, CVE management, SBOM, and building trust in cloud-native environments.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/blogs", eyebrow: "Blog" }, page);
}

/**
 * Static listing. The full card set is fetched once (cacheable, no
 * `searchParams` on the server) and filtering/search/pagination run on the
 * client (`BlogsBrowser`), so the route is served from the edge as static HTML
 * instead of rendered per request. The Suspense fallback is the server-rendered
 * default (unfiltered, page 1) view — that's what lands in the static HTML, so
 * crawlers and no-JS clients still get the full first page of posts.
 */
export default async function BlogsPage(): Promise<React.ReactElement> {
  const [featuredPost, blogsData, categories] = await Promise.all([
    getFeaturedBlog().catch(() => null),
    getBlogs({ limit: 1000 }).catch(() => ({
      docs: [],
      hasNextPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    })),
    getBlogCategories().catch(() => []),
  ]);

  const allPosts = blogsData.docs;
  const initial = selectBlogs(allPosts, { category: "", search: "", page: 1 });

  return (
    <>
      <JsonLd
        id="blogs-breadcrumbs"
        data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blogs" }])}
      />
      {allPosts.length > 0 && (
        <JsonLd
          id="blogs-list"
          data={itemListSchema(
            "CleanStart Blog",
            "/blogs",
            allPosts.map((p) => ({ name: p.title, path: `/blogs/${p.slug}` })),
          )}
        />
      )}
      <Header />
      <Suspense
        fallback={
          <BlogsContent
            featuredPost={featuredPost}
            categories={categories}
            posts={initial.posts}
            activeCategory=""
            searchQuery=""
            currentPage={1}
            totalPages={initial.totalPages}
          />
        }
      >
        <BlogsBrowser
          allPosts={allPosts}
          featuredPost={featuredPost}
          categories={categories}
        />
      </Suspense>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
