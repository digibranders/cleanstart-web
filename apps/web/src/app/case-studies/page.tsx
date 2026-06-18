import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { CaseStudiesBrowser } from "@/components/sections/case-studies/CaseStudiesBrowser";
import {
  CaseStudiesContent,
  selectCaseStudies,
} from "@/components/sections/case-studies/CaseStudiesContent";
import { CaseStudiesHero } from "@/components/sections/case-studies/CaseStudiesHero";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { FadeUp } from "@/components/ui/FadeUp";
import { getCaseStudies } from "@/lib/case-studies";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "Case Studies";
const DESCRIPTION =
  "Real challenges and the measurable impact CleanStart delivered. Download customer case studies across healthcare, telecom, finance, and more.";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/case-studies",
    eyebrow: "Resources",
  });
}

/**
 * Static listing. Fetches the full card set once (cacheable, no `searchParams`
 * on the server) and renders statically; pagination runs on the client
 * (`CaseStudiesBrowser`). The Suspense fallback is the server-rendered default
 * (page 1) view, so the static HTML carries the first page for crawlers. See
 * /blogs for the pattern.
 */
export default async function CaseStudiesPage(): Promise<React.ReactElement> {
  let loadFailed = false;
  const data = await getCaseStudies({ limit: 1000 }).catch(() => {
    loadFailed = true;
    return { docs: [], hasNextPage: false, page: 1, totalDocs: 0, totalPages: 1 };
  });

  const allCaseStudies = data.docs;
  const initial = selectCaseStudies(allCaseStudies, { page: 1 });

  return (
    <>
      <JsonLd
        id="case-studies-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Case Studies" },
        ])}
      />
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <CaseStudiesHero />
        </div>
        <Suspense
          fallback={
            <CaseStudiesContent
              caseStudies={initial.caseStudies}
              currentPage={1}
              totalPages={initial.totalPages}
              loadFailed={loadFailed}
            />
          }
        >
          <CaseStudiesBrowser allCaseStudies={allCaseStudies} loadFailed={loadFailed} />
        </Suspense>
        <FadeUp>
          <Testimonials />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
