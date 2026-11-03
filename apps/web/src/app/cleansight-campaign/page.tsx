import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { BookDemoBody } from "@/components/sections/book-a-demo/BookDemoBody";
import { DemoHero } from "@/components/sections/book-a-demo/DemoHero";
import { ScanBody } from "@/components/sections/cleansight-scan/ScanBody";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { getPageGraph } from "@/lib/seo/compose-page";
import { breadcrumbSchema } from "@/lib/seo/jsonld";

// Campaign landing page restored from the old Webflow /cleansight-demo-request page.
// noindex until the team signs it off: it overlaps /cleansight and should not
// compete with it in search.
export const metadata = buildPageMetadata({
  title: "Free Container Security Scan | CleanSight",
  absoluteTitle: true,
  description:
    "Find hidden container risk across your hybrid environment. Request a free CleanSight scan to see inherited vulnerabilities, where they run, and how to fix them.",
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
        <DemoHero title="Discover Hidden Container Risk Across Your Hybrid Environment" />
        <BookDemoBody>
          <ScanBody />
        </BookDemoBody>
      </main>
      <Footer />
    </>
  );
}
