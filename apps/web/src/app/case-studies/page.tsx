import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { CaseStudiesBrowser } from "@/components/sections/case-studies/CaseStudiesBrowser";
import {
  CaseStudiesContent,
  selectCaseStudies,
} from "@/components/sections/case-studies/CaseStudiesContent";
import { CaseStudiesCTA } from "@/components/sections/case-studies/CaseStudiesCTA";
import { CaseStudiesFAQ } from "@/components/sections/case-studies/CaseStudiesFAQ";
import { CaseStudiesHero } from "@/components/sections/case-studies/CaseStudiesHero";
import { CaseStudiesLibrary } from "@/components/sections/case-studies/CaseStudiesLibrary";
import { CaseStudiesPattern } from "@/components/sections/case-studies/CaseStudiesPattern";
import { CaseStudiesImpactStrip } from "@/components/sections/case-studies/CaseStudiesImpactStrip";
import { CaseStudiesResources } from "@/components/sections/case-studies/CaseStudiesResources";
import { CASE_STUDY_RESOURCE_SLUGS } from "@/components/sections/case-studies/case-studies-resources";
import { CASE_STUDY_FAQS } from "@/components/sections/case-studies/case-studies-faqs";
import { FeaturedCaseStudy } from "@/components/sections/case-studies/FeaturedCaseStudy";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { FadeUp } from "@/components/ui/FadeUp";
import { getCaseStudies } from "@/lib/case-studies";
import { mediaUrl } from "@/lib/case-studies-utils";
import { getImpactStats } from "@/lib/impact-stats";
import { getResourcesBySlugs } from "@/lib/resources";
import { buildListingMetadata } from "@/lib/seo/canonical";
import {
  JsonLd,
  breadcrumbSchema,
  caseStudyListSchema,
  faqPageSchema,
} from "@/lib/seo/jsonld";

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

const TITLE = "Case Studies";
const DESCRIPTION =
  "Real challenges and the measurable impact CleanStart delivered. Read and download customer case studies across healthcare, telecom, finance, and technology.";

export function generateMetadata(): Metadata {
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/case-studies", eyebrow: "Resources" });
}

/**
 * Static listing. Fetches the full card set once (cacheable, no `searchParams`
 * on the server) and renders statically; pagination runs on the client
 * (`CaseStudiesBrowser`). The Suspense fallback is the server-rendered default
 * (page 1) view, so the static HTML carries the first page for crawlers. See
 * /blogs for the pattern.
 *
 * Page shape: promise and who already trusts it (one dark hero, marquee
 * docked at its base) → how much it moved → one story in depth → the whole
 * library → the customers in their own words → the pattern across engagements
 * → what to read next → objections → ask.
 */
export default async function CaseStudiesPage(): Promise<React.ReactElement> {
  let loadFailed = false;

  // Three independent CMS reads: one round-trip of latency on a cold render,
  // not three. Each falls back on its own so a single failure never empties
  // the page.
  const [data, impactStats, railResources] = await Promise.all([
    getCaseStudies({ limit: 1000 }).catch(() => {
      loadFailed = true;
      return { docs: [], hasNextPage: false, page: 1, totalDocs: 0, totalPages: 1 };
    }),
    getImpactStats(),
    getResourcesBySlugs(CASE_STUDY_RESOURCE_SLUGS).catch(() => []),
  ]);

  const allCaseStudies = data.docs;
  const initial = selectCaseStudies(allCaseStudies, { page: 1 });
  // The study an editor ticked `featured` on wins; with none ticked the head of
  // the list is the newest, since the API sorts `-publishedAt`. Either way it
  // stays in the grid below: the spotlight is emphasis, not exclusion, and a
  // library that silently omits its own headline entry reads as a bug.
  const featured = allCaseStudies.find((s) => s.featured) ?? allCaseStudies[0];

  return (
    <>
      <JsonLd
        id="case-studies-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Case Studies" },
        ])}
      />
      {allCaseStudies.length > 0 && (
        <JsonLd
          id="case-studies-list"
          data={caseStudyListSchema(
            allCaseStudies.map((s) => ({
              title: s.title,
              summary: s.summary,
              company: s.company,
              publishedAt: s.publishedAt,
              slug: s.slug,
              imageUrl: mediaUrl(s.coverImage?.url),
            })),
          )}
        />
      )}
      <JsonLd
        id="case-studies-faq"
        data={faqPageSchema(
          CASE_STUDY_FAQS.map(({ question, answer }) => ({ question, answer })),
        )}
      />
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <CaseStudiesHero />
        </div>

        <FadeUp>
          <CaseStudiesImpactStrip stats={impactStats} />
        </FadeUp>

        {featured && (
          <FadeUp>
            <FeaturedCaseStudy caseStudy={featured} />
          </FadeUp>
        )}

        <FadeUp>
          <CaseStudiesLibrary>
            {/* Only the cards sit inside the boundary: the streamed HTML
                carries both the fallback and the resolved tree, so a heading
                or anchor id in here would appear twice in the page source. */}
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
          </CaseStudiesLibrary>
        </FadeUp>

        <FadeUp>
          <Testimonials />
        </FadeUp>

        <FadeUp>
          <CaseStudiesPattern />
        </FadeUp>

        <FadeUp>
          <CaseStudiesResources resources={railResources} />
        </FadeUp>

        <FadeUp>
          <CaseStudiesFAQ />
        </FadeUp>
      </main>
      <Footer cta={<CaseStudiesCTA />} />
    </>
  );
}
