import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsBrowser } from "@/components/sections/blogs/BlogsBrowser";
import {
  BlogsContent,
  selectBlogs,
  BLOGS_PAGE_SIZE,
} from "@/components/sections/blogs/BlogsContent";
import { BlogsHero } from "@/components/sections/blogs/BlogsHero";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { CrawlableLinkIndex } from "@/components/ui/CrawlableLinkIndex";
import { getAdvisories, pickFeaturedAdvisory } from "@/lib/advisory";
import { ADVISORIES_SECTION } from "@/lib/blog-utils";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 21600; // 6h ISR fallback; on-demand publish revalidation keeps this fresh

const TITLE = "Security Advisories";
const DESCRIPTION =
  "CleanStart security advisories: critical vulnerabilities in open source runtimes and containers, which versions are affected, and how to patch.";

export function generateMetadata(): Metadata {
  return buildListingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    basePath: ADVISORIES_SECTION.basePath,
    eyebrow: "Advisory",
  });
}

/** Same static-listing model as /blogs: one cached fetch, client-side search and paging. */
export default async function AdvisoriesPage(): Promise<React.ReactElement> {
  const advisories = await getAdvisories().catch(() => []);
  const initial = selectBlogs(advisories, { category: "", search: "", page: 1 });
  const { basePath } = ADVISORIES_SECTION;

  return (
    <>
      <JsonLd
        id="advisories-breadcrumbs"
        data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Advisories" }])}
      />
      {advisories.length > 0 && (
        <JsonLd
          id="advisories-list"
          data={itemListSchema(
            "CleanStart Security Advisories",
            basePath,
            advisories.map((a) => ({ name: a.title, path: `${basePath}/${a.slug}` })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <BlogsHero
            // A lone advisory would show twice (here and in the grid), so the
            // spotlight waits for a second one.
            featuredPost={advisories.length > 1 ? pickFeaturedAdvisory(advisories) : null}
            categories={[]}
            searchQuery=""
            section={ADVISORIES_SECTION}
          />
        </div>
        <Suspense
          fallback={
            <BlogsContent
              posts={initial.posts}
              activeCategory=""
              searchQuery=""
              currentPage={1}
              totalPages={initial.totalPages}
              section={ADVISORIES_SECTION}
            />
          }
        >
          <BlogsBrowser allPosts={advisories} section={ADVISORIES_SECTION} />
        </Suspense>
        <CrawlableLinkIndex
          label="All advisories"
          items={advisories
            .slice(BLOGS_PAGE_SIZE)
            .map((a) => ({ href: `${basePath}/${a.slug}`, title: a.title }))}
        />
      </main>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
