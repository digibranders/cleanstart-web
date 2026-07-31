import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ResourceCenterBrowser } from "@/components/sections/resource-center/ResourceCenterBrowser";
import {
  ResourceCenterContent,
  selectResources,
  RESOURCES_PAGE_SIZE,
} from "@/components/sections/resource-center/ResourceCenterContent";
import { ResourceCenterHero } from "@/components/sections/resource-center/ResourceCenterHero";
import { CrawlableLinkIndex } from "@/components/ui/CrawlableLinkIndex";
import { getResources } from "@/lib/resources";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

const TITLE = "Resource Center";
const DESCRIPTION =
  "A curated collection of whitepapers, ebooks, datasheets, architecture insights, and reports on container security.";

export function generateMetadata(): Metadata {
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/resource-center", eyebrow: "Resources" });
}

/**
 * Static listing. The full card set is fetched once (cacheable, no
 * `searchParams` on the server) and type-filtering/search/pagination run on the
 * client (`ResourceCenterBrowser`), so the route is served as static HTML
 * instead of rendered per request. The Suspense fallback is the server-rendered
 * default (unfiltered, page 1) view — that's what lands in the static HTML, so
 * crawlers and no-JS clients still get the full first page of resources. See
 * /blogs for the pattern.
 */
export default async function ResourceCenterPage(): Promise<React.ReactElement> {
  let loadFailed = false;
  const resourcesData = await getResources({ limit: 1000 }).catch(() => {
    loadFailed = true;
    return {
      docs: [],
      hasNextPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    };
  });

  const allResources = resourcesData.docs;
  const initial = selectResources(allResources, {
    type: "",
    search: "",
    page: 1,
  });

  return (
    <>
      <JsonLd
        id="resource-center-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Resource Center" },
        ])}
      />
      {allResources.length > 0 && (
        <JsonLd
          id="resource-center-list"
          data={itemListSchema(
            "CleanStart Resource Center",
            "/resource-center",
            allResources.map((r) => ({ name: r.title, path: `/resources/${r.slug}` })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <ResourceCenterHero initialQuery="" />
        </div>
        <Suspense
          fallback={
            <ResourceCenterContent
              resources={initial.resources}
              activeType=""
              searchQuery=""
              currentPage={1}
              totalPages={initial.totalPages}
              loadFailed={loadFailed}
            />
          }
        >
          <ResourceCenterBrowser allResources={allResources} />
        </Suspense>
        <CrawlableLinkIndex
          label="All resources"
          items={allResources
            .slice(RESOURCES_PAGE_SIZE)
            .map((r) => ({ href: `/resources/${r.slug}`, title: r.title }))}
        />
      </main>
      <Footer />
    </>
  );
}
