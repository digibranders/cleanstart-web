import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ResourceCenterHero } from "@/components/sections/resource-center/ResourceCenterHero";
import { ResourceCenterSidebar } from "@/components/sections/resource-center/ResourceCenterSidebar";
import { ResourceGrid } from "@/components/sections/resource-center/ResourceGrid";
import { ResourceCenterCTA } from "@/components/sections/resource-center/ResourceCenterCTA";
import { getResources } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Resource Center | CleanStart",
  description:
    "A curated collection of whitepapers, reports, datasheets, and case studies on container security.",
};

interface ResourceCenterPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    q?: string;
  }>;
}

export default async function ResourceCenterPage({
  searchParams,
}: ResourceCenterPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeType = params.type ?? "";
  const searchQuery = params.q ?? "";

  const resourcesData = await getResources({
    page,
    ...(activeType ? { type: activeType } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }).catch(() => ({
    docs: [],
    hasNextPage: false,
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  }));

  return (
    <>
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        {/* Hero — dark gradient, search, popular tags */}
        <div className="relative overflow-hidden">
          <Suspense>
            <ResourceCenterHero initialQuery={searchQuery} />
          </Suspense>
        </div>

        {/* Body — sidebar + grid */}
        <FadeUp>
          <section
            className="relative"
            style={{
              background: "#f6f6f6",
              borderRadius: "32px 32px 0 0",
              marginTop: "-32px",
              zIndex: 1,
              paddingTop: "52px",
              paddingBottom: "80px",
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
              <div className="flex items-start" style={{ gap: "32px" }}>
                {/* Left sidebar */}
                <ResourceCenterSidebar
                  activeType={activeType}
                  searchQuery={searchQuery}
                />

                {/* Right: 3-col grid */}
                <ResourceGrid
                  resources={resourcesData.docs}
                  hasMore={resourcesData.hasNextPage}
                  currentPage={page}
                  activeType={activeType}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </section>
        </FadeUp>

        {/* CTA — overlaps footer */}
        <FadeUp className="relative z-10" style={{ marginTop: "80px" }}>
          <ResourceCenterCTA />
        </FadeUp>
      </main>
      <Footer topPadding={225} />
    </>
  );
}
