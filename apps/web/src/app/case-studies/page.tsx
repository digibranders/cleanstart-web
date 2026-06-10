import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { CaseStudiesHero } from "@/components/sections/case-studies/CaseStudiesHero";
import { CaseStudiesGrid } from "@/components/sections/case-studies/CaseStudiesGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import { getCaseStudies } from "@/lib/case-studies";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Case Studies";
const DESCRIPTION =
  "Real challenges and the measurable impact CleanStart delivered. Download customer case studies across healthcare, telecom, finance, and more.";

interface CaseStudiesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  searchParams,
}: CaseStudiesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  // Per WEB-PRODUCTION.md §5: paginated pages 6+ → noindex, follow.
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/case-studies",
    eyebrow: "Resources",
    noindex: page >= 6,
  });
}

export default async function CaseStudiesPage({
  searchParams,
}: CaseStudiesPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));

  let loadFailed = false;
  const data = await getCaseStudies({ page }).catch(() => {
    loadFailed = true;
    return { docs: [], hasNextPage: false, page: 1, totalDocs: 0, totalPages: 1 };
  });

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

        <FadeUp>
          <CaseStudiesGrid
            caseStudies={data.docs}
            currentPage={page}
            totalPages={data.totalPages}
            loadFailed={loadFailed}
          />
        </FadeUp>

        <FadeUp>
          <Testimonials />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
