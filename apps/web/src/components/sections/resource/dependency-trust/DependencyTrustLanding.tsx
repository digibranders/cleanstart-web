import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";

import { AboutCleanStart } from "./AboutCleanStart";
import { AboutResearch } from "./AboutResearch";
import { DependencyTrustHero } from "./DependencyTrustHero";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { FindingsGlance } from "./FindingsGlance";
import { LeadershipQuote } from "./LeadershipQuote";
import { ReportCta } from "./ReportCta";
import { type ReportGateConfig, ReportGateProvider } from "./ReportGate";
import { ResearchFindings } from "./ResearchFindings";

/**
 * The State of Software Dependency Trust 2026 landing page. It is a static page
 * in the web app: the copy lives in `content.ts`, and the only outside facts it
 * needs are the ids of the report and the form that gates its download.
 */
export function DependencyTrustLanding({ gate }: { gate: ReportGateConfig }): React.ReactElement {
  return (
    <ReportGateProvider {...gate}>
      <Header />
      <main id="main-content">
        <DependencyTrustHero />
        <ExecutiveSummary />
        <FindingsGlance />
        <ResearchFindings />
        <LeadershipQuote />
        <AboutResearch />
        <AboutCleanStart />
      </main>
      <Footer cta={<ReportCta />} />
    </ReportGateProvider>
  );
}
