import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { AdvisoriesBrowser } from "@/components/sections/advisories/AdvisoriesBrowser";
import { AdvisoriesTable } from "@/components/sections/advisories/AdvisoriesTable";
import { BlogsHero } from "@/components/sections/blogs/BlogsHero";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { getAdvisories } from "@/lib/advisory";
import { ADVISORY_FEED_PATH, ADVISORY_FEED_TITLE } from "@/lib/advisory-feed";
import { advisoryHeading, technologyOptions } from "@/lib/advisory-utils";
import { ADVISORIES_SECTION } from "@/lib/blog-utils";
import { SITE_URL, buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 21600; // 6h ISR fallback; on-demand publish revalidation keeps this fresh

const TITLE = "Security Advisories";
const DESCRIPTION =
  "CleanStart security advisories: critical vulnerabilities in open source runtimes and containers, which versions are affected, and how to patch.";

export function generateMetadata(): Metadata {
  const metadata = buildListingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    basePath: ADVISORIES_SECTION.basePath,
    eyebrow: "Advisory",
  });
  // RSS autodiscovery: feed readers and browsers find the feed from this page.
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: { "application/rss+xml": [{ url: `${SITE_URL}${ADVISORY_FEED_PATH}`, title: ADVISORY_FEED_TITLE }] },
    },
  };
}

/**
 * Static listing: the full set is fetched once and filtered in the browser
 * (`AdvisoriesBrowser`). The Suspense fallback is the unfiltered table, which
 * is what lands in the static HTML for crawlers and no-JS clients.
 */
export default async function AdvisoriesPage(): Promise<React.ReactElement> {
  const advisories = await getAdvisories().catch(() => []);
  const technologies = technologyOptions(advisories);
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
            advisories.map((a) => ({ name: advisoryHeading(a), path: `${basePath}/${a.slug}` })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <BlogsHero featuredPost={null} categories={[]} searchQuery="" section={ADVISORIES_SECTION} />
        </div>
        <Suspense
          fallback={
            <AdvisoriesTable
              rows={advisories}
              technologies={technologies}
              filters={{ technology: "", status: "", q: "" }}
            />
          }
        >
          <AdvisoriesBrowser allAdvisories={advisories} technologies={technologies} />
        </Suspense>
      </main>
      <Footer cta={<BlogsCTA />} />
    </>
  );
}
