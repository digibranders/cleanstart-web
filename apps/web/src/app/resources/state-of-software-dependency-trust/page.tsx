import { JsonLdGraph } from "@/components/JsonLdGraph";
import { DependencyTrustLanding } from "@/components/sections/resource/dependency-trust/DependencyTrustLanding";
import type { ReportGateConfig } from "@/components/sections/resource/dependency-trust/ReportGate";
import { buildPageMetadata, SITE_URL } from "@/lib/seo/canonical";
import { getPageGraph } from "@/lib/seo/compose-page";
import { articleSchema, breadcrumbSchema, breadcrumbTrail } from "@/lib/seo/jsonld";

const PATH = "/resources/state-of-software-dependency-trust";
const REPORT_TITLE = "State of Software Dependency Trust 2026";
const COVER_PATH = "/images/resources/dependency-trust/report-cover.webp";
const DESCRIPTION =
  "Research on open source dependency risk: transitive sprawl, aging components, upstream attacks, AI-selected packages and verified software foundations.";

/**
 * The report's record and the form that gates its download, as they exist in
 * the production CMS. Only these two ids and the slug cross over: the page copy,
 * design and metadata are all in code. The download link itself is still minted
 * server-side from the record when the form is submitted.
 */
const GATE: ReportGateConfig = {
  resourceId: "37",
  resourceTitle: REPORT_TITLE,
  resourceSlug: "state-of-software-dependency-trust",
  gateFormId: 11,
};

/**
 * Live but noindex: the page is reachable and its form works, but it is kept out
 * of search and out of the sitemap until the title and description are signed
 * off and the report's CMS record is published. To launch for search, drop
 * `noindex` here.
 */
export const metadata = buildPageMetadata({
  title: `${REPORT_TITLE} Report`,
  description: DESCRIPTION,
  path: PATH,
  eyebrow: "Resources",
  type: "article",
  noindex: true,
});

export const revalidate = 21600;

export default async function DependencyTrustReportPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph(PATH, [
    breadcrumbSchema(breadcrumbTrail("resource", { title: REPORT_TITLE })),
    articleSchema({
      title: REPORT_TITLE,
      description: DESCRIPTION,
      path: PATH,
      imageUrl: `${SITE_URL}${COVER_PATH}`,
      type: "Report",
    }),
  ]);

  return (
    <>
      <JsonLdGraph id="dependency-trust-report-jsonld" graph={graph} />
      <DependencyTrustLanding gate={GATE} />
    </>
  );
}
