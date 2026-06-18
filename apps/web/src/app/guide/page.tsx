import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { GuidesBrowser } from "@/components/sections/guides/GuidesBrowser";
import { GuidesContent, selectGuides } from "@/components/sections/guides/GuidesContent";
import { GuidesCTA } from "@/components/sections/guides/GuidesCTA";
import { getGuides } from "@/lib/guides";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Guides";
const DESCRIPTION =
  "A curated collection of writings, research, and solutions on container security, DevOps, and compliance.";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/guide",
    eyebrow: "Guide",
  });
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
      <Header />
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
      <Footer cta={<GuidesCTA />} />
    </>
  );
}
