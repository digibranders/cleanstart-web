import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsHero } from "@/components/sections/blogs/BlogsHero";
import { LatestBlogs } from "@/components/sections/blogs/LatestBlogs";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { FadeUp } from "@/components/ui/FadeUp";
import {
  getFeaturedBlog,
  getBlogs,
  getBlogCategories,
} from "@/lib/blog";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Blogs";
const DESCRIPTION =
  "Explore CleanStart's blog expert insights on container security, software supply chain threats, CVE management, SBOM, and building trust in cloud-native environments.";

interface BlogsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: BlogsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  // Per WEB-PRODUCTION.md §5: paginated pages 6+ → noindex, follow.
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/blogs",
    eyebrow: "Blog",
    noindex: page >= 6,
  });
}

export default async function BlogsPage({
  searchParams,
}: BlogsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeCategory = params.category ?? "";
  const searchQuery = params.q ?? "";

  const [featuredPost, blogsData, categories] = await Promise.all([
    getFeaturedBlog().catch(() => null),
    getBlogs({
      page,
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }).catch(
      () => ({ docs: [], hasNextPage: false, page: 1, totalDocs: 0, totalPages: 1 }),
    ),
    getBlogCategories().catch(() => []),
  ]);

  return (
    <>
      <JsonLd
        id="blogs-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blogs" },
        ])}
      />
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <BlogsHero
            featuredPost={featuredPost}
            categories={categories}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        </div>

        <FadeUp>
          <LatestBlogs
            posts={blogsData.docs}
            currentPage={page}
            totalPages={blogsData.totalPages}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        </FadeUp>

      </main>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
