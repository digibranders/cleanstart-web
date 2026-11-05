import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { BookDemoBody } from "@/components/sections/book-a-demo/BookDemoBody";
import { DemoHero } from "@/components/sections/book-a-demo/DemoHero";
import { ScanBody } from "@/components/sections/cleansight-scan/ScanBody";
import { ScanFaq } from "@/components/sections/cleansight-scan/ScanFaq";
import { ScanHowItWorks } from "@/components/sections/cleansight-scan/ScanHowItWorks";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { getPageGraph } from "@/lib/seo/compose-page";
import { breadcrumbSchema } from "@/lib/seo/jsonld";

// Campaign landing page restored from the old Webflow /cleansight-demo-request page.
// noindex until the team signs it off: it overlaps /cleansight and should not
// compete with it in search.
export const metadata = buildPageMetadata({
  title: "Are You Exposed to PHP2Shell, Brotli2Shell or LiteLLM? | CleanSight",
  absoluteTitle: true,
  description:
    "PHP2Shell, Brotli2Shell and the LiteLLM compromise hid several layers deep in the components your applications are built on. Request a free CleanSight scan to see where they run and how to fix them.",
  path: "/cleansight-campaign",
  noindex: true,
});

export const revalidate = 21600;

export default async function CleanSightScanRequestPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/cleansight-campaign", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "CleanSight", path: "/cleansight" },
      { name: "Free Container Security Scan" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="cleansight-scan-jsonld" graph={graph} />
      <Header />
      <main id="main-content" className="bg-white">
        <DemoHero
          title="See Your Container Exposure in One Scan"
          subtitle="PHP2Shell, Brotli2Shell and the LiteLLM compromise all hid several layers deep, inside the components your applications are built on. CleanSight shows you where they’re running and how to fix them."
        />
        <BookDemoBody>
          <ScanBody />
          <ScanHowItWorks />
          <FadeUp>
            <ScanFaq />
          </FadeUp>
        </BookDemoBody>
      </main>
      <Footer />
    </>
  );
}
