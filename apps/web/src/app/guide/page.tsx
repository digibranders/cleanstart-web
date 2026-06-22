import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { GuidesBrowser } from "@/components/sections/guides/GuidesBrowser";
import { GuidesContent, selectGuides } from "@/components/sections/guides/GuidesContent";
import { GuidesHero } from "@/components/sections/guides/GuidesHero";
import { GuidesCTA } from "@/components/sections/guides/GuidesCTA";
import { getGuides } from "@/lib/guides";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Guides";
const DESCRIPTION =
  "A curated collection of writings, research, and solutions on container security, DevOps, and compliance.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/guide", eyebrow: "Guide" }, page);
}

/**
 * Static listing. Fetches the full card set once (cacheable) and renders
 * statically; search/pagination run on the client (`GuidesBrowser`). The
 * Suspense fallback is the server-rendered default (page 1) view, so the static
 * HTML carries the first page for crawlers. See /blogs for the pattern.
 */
export default async function GuidesPage(): Promise<React.ReactElement> {
  const guidesData = await getGuides({ limit: 1000 }).catch(() => ({
    docs: [],
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  }));
  const allGuides = guidesData.docs;
  const initial = selectGuides(allGuides, { search: "", page: 1 });

  return (
    <>
      <JsonLd
        id="guides-breadcrumbs"
        data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Guides" }])}
      />
      {allGuides.length > 0 && (
        <JsonLd
          id="guides-list"
          data={itemListSchema(
            "CleanStart Guides",
            "/guide",
            allGuides.map((g) => ({ name: g.title, path: `/guide/${g.slug}` })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <GuidesHero searchQuery="" />
        </div>
        <Suspense
          fallback={
            <GuidesContent
              guides={initial.guides}
              searchQuery=""
              currentPage={1}
              totalPages={initial.totalPages}
            />
          }
        >
          <GuidesBrowser allGuides={allGuides} />
        </Suspense>
      </main>
      <Footer cta={<GuidesCTA />} />
    </>
  );
}
