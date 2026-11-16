import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";

import { type ReportGateConfig, ReportGateProvider } from "../dependency-trust/ReportGate";
import { ReportCta } from "../dependency-trust/ReportCta";
import { About } from "./About";
import { Findings } from "./Findings";
import { Hero } from "./Hero";
import { Note } from "./Note";
import { Summary } from "./Summary";
import { Voice } from "./Voice";

/**
 * The State of Software Dependency Trust 2026 landing page. The copy is the
 * document's, the download gate is the report's own form, and the findings are
 * drawn from their own numbers (see `field.ts`). It keeps the site's language
 * (violet and indigo bands, glass tiles, Manrope and Sora).
 */
export function ReportLanding({ gate }: { gate: ReportGateConfig }): React.ReactElement {
  return (
    <ReportGateProvider {...gate}>
      <Header />
      <main id="main-content">
        <Hero />
        <Summary />
        <Findings />
        <Voice />
        <Note />
        <About />
      </main>
      <Footer cta={<ReportCta />} />
    </ReportGateProvider>
  );
}
