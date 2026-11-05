import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { resolveResourceGate } from "@/lib/resource-gate";
import type { ResourceDetail } from "@/lib/resources";

import { AboutCleanStart } from "./AboutCleanStart";
import { AboutResearch } from "./AboutResearch";
import { DependencyTrustHero } from "./DependencyTrustHero";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { FindingsGlance } from "./FindingsGlance";
import { LeadershipQuote } from "./LeadershipQuote";
import { ReportCta } from "./ReportCta";
import { ReportGateProvider } from "./ReportGate";
import { ResearchFindings } from "./ResearchFindings";

/**
 * The State of Software Dependency Trust 2026 landing page. It lives at the
 * resource's own URL, so the Resource Center card, the sitemap entry, the SEO
 * fields, the download count and the thank-you email all stay with the CMS
 * record. Only the page body is bespoke.
 */
export function DependencyTrustLanding({
  resource,
}: {
  resource: ResourceDetail;
}): React.ReactElement {
  const { gated, gateFormId } = resolveResourceGate(resource);

  const page = (
    <>
      <Header />
      <main id="main-content">
        <DependencyTrustHero resource={resource} />
        <ExecutiveSummary />
        <FindingsGlance />
        <ResearchFindings />
        <LeadershipQuote />
        <AboutResearch />
        <AboutCleanStart />
      </main>
      <Footer cta={<ReportCta resource={resource} />} />
    </>
  );

  if (!gated || gateFormId === null) return page;
  return (
    <ReportGateProvider
      resourceId={resource.id}
      resourceTitle={resource.title}
      resourceSlug={resource.slug}
      gateFormId={gateFormId}
    >
      {page}
    </ReportGateProvider>
  );
}
