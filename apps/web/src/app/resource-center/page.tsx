import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ResourceCenterHero } from "@/components/sections/resource-center/ResourceCenterHero";
import { ResourceCenterSidebar } from "@/components/sections/resource-center/ResourceCenterSidebar";
import { ResourceGrid } from "@/components/sections/resource-center/ResourceGrid";
import { ResourceCenterCTA } from "@/components/sections/resource-center/ResourceCenterCTA";
import { getResources } from "@/lib/resources";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Resource Center";
const DESCRIPTION =
  "A curated collection of whitepapers, ebooks, datasheets, architecture insights, and reports on container security.";

interface ResourceCenterPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ResourceCenterPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/resource-center",
    eyebrow: "Resources",
    noindex: page >= 6,
  });
}

export default async function ResourceCenterPage({
  searchParams,
}: ResourceCenterPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeType = params.type ?? "";
  const searchQuery = params.q ?? "";

  let loadFailed = false;
  const resourcesData = await getResources({
    page,
    ...(activeType ? { type: activeType } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }).catch(() => {
    loadFailed = true;
    return {
      docs: [],
      hasNextPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    };
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
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <Suspense>
            <ResourceCenterHero initialQuery={searchQuery} />
          </Suspense>
        </div>

        <FadeUp>
          <section
            className="relative"
            style={{
              background: "#f6f6f6",
              borderRadius: "32px 32px 0 0",
              marginTop: "-32px",
              zIndex: 1,
              paddingTop: "52px",
              paddingBottom: "var(--spacing-section-cta)",
            }}
            aria-label="Resources listing"
          >
            <div
              className="mx-auto"
              style={{
                maxWidth: "1276px",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              {/* Section heading for the document outline — the hero <h1> is
                  followed by the sidebar "Categories" <h3> and card <h3>s, so
                  this fills the h2 level. Visually hidden. */}
              <h2 className="sr-only">Resources</h2>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-6 lg:gap-8">
                <ResourceCenterSidebar
                  activeType={activeType}
                  searchQuery={searchQuery}
                />

                <ResourceGrid
                  resources={resourcesData.docs}
                  currentPage={page}
                  totalPages={resourcesData.totalPages}
                  activeType={activeType}
                  searchQuery={searchQuery}
                  loadFailed={loadFailed}
                />
              </div>
            </div>
          </section>
        </FadeUp>

      </main>
      <Footer cta={<ResourceCenterCTA />} />
    </>
  );
}
