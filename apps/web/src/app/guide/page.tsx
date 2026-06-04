import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { GuidesHero } from "@/components/sections/guides/GuidesHero";
import { GuidesList } from "@/components/sections/guides/GuidesList";
import { GuidesCTA } from "@/components/sections/guides/GuidesCTA";
import { FadeUp } from "@/components/ui/FadeUp";
import { getGuides } from "@/lib/guides";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Guides";
const DESCRIPTION =
  "A curated collection of writings, research, and solutions on container security, DevOps, and compliance.";

interface GuidesPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: GuidesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  // Per WEB-PRODUCTION.md §5: paginated pages 6+ → noindex, follow.
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/guide",
    eyebrow: "Guide",
    noindex: page >= 6,
  });
}

export default async function GuidesPage({
  searchParams,
}: GuidesPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const searchQuery = params.q ?? "";

  const guidesData = await getGuides({
    page,
    ...(searchQuery ? { search: searchQuery } : {}),
  }).catch(() => ({
    docs: [],
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  }));

  return (
    <>
      <JsonLd
        id="guides-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides" },
        ])}
      />
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <GuidesHero searchQuery={searchQuery} />
        </div>

        <FadeUp>
          <GuidesList
            guides={guidesData.docs}
            currentPage={page}
            totalPages={guidesData.totalPages}
            searchQuery={searchQuery}
          />
        </FadeUp>
      </main>
      <Footer cta={<GuidesCTA />} />
    </>
  );
}
