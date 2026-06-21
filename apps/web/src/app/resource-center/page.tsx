import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ResourceCenterBrowser } from "@/components/sections/resource-center/ResourceCenterBrowser";
import {
  ResourceCenterContent,
  selectResources,
} from "@/components/sections/resource-center/ResourceCenterContent";
import { ResourceCenterCTA } from "@/components/sections/resource-center/ResourceCenterCTA";
import { getResources } from "@/lib/resources";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Resource Center";
const DESCRIPTION =
  "A curated collection of whitepapers, ebooks, datasheets, architecture insights, and reports on container security.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/resource-center", eyebrow: "Resources" }, page);
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
      <Footer cta={<ResourceCenterCTA />} />
    </>
  );
}
