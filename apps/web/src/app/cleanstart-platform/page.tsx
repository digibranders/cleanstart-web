import { Header } from "@/components/nav/Header";
import { FadeUp } from "@/components/ui/FadeUp";
import { Footer } from "@/components/sections/Footer";
import { PlatformHero } from "@/components/sections/cleanstart-platform/PlatformHero";
import { PlatformTrustSource } from "@/components/sections/cleanstart-platform/PlatformTrustSource";
import { PlatformTrustArchitecture } from "@/components/sections/cleanstart-platform/PlatformTrustArchitecture";
import { PlatformTrustedOutputs } from "@/components/sections/cleanstart-platform/PlatformTrustedOutputs";
import { PlatformCTA } from "@/components/sections/cleanstart-platform/PlatformCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Inside the CleanStart Platform",
  description:
    "AI-native software manufacturing for trusted runtime foundations. Explore how CleanStart builds trusted software through deterministic trust architecture.",
  path: "/cleanstart-platform",
  variant: "hero",
  eyebrow: "Platform",
  ogTitle: "Inside the CleanStart Platform",
  titleAccent: "Platform",
  // Page is not yet complete — keep it reachable by direct URL but out of the
  // index until it ships. noindex,follow (the default) so link equity still flows.
  noindex: true,
});

export const revalidate = 3600;

export default async function CleanStartPlatformPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/cleanstart-platform", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "CleanStart Platform" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="cleanstart-platform-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <PlatformHero />

        <FadeUp>
          <PlatformTrustSource />
        </FadeUp>

        <FadeUp>
          <PlatformTrustArchitecture />
        </FadeUp>

        <FadeUp>
          <PlatformTrustedOutputs />
        </FadeUp>
      </main>
      <Footer cta={<PlatformCTA />} />
    </>
  );
}
