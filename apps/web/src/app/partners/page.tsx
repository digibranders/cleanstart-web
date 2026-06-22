import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { PartnersHero } from "@/components/sections/partners/PartnersHero";
import { PartnersWhy } from "@/components/sections/partners/PartnersWhy";
import { PartnersNetwork } from "@/components/sections/partners/PartnersNetwork";
import { PartnersTypes } from "@/components/sections/partners/PartnersTypes";
import { PartnersTestimonials } from "@/components/sections/partners/PartnersTestimonials";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph } from "@/lib/seo/compose-page";
import { getRegistryOverride } from "@/lib/page-registry";

export const metadata = buildPageMetadata({
  title: "CleanStart Partners | Collaborate on Secure Software Supply Chains",
  absoluteTitle: true,
  description:
    "Explore CleanStart's global partner network of technology providers, system integrators, and cloud platforms delivering hardened, compliance ready container images worldwide.",
  path: "/partners",
});

export const revalidate = 3600;

export default async function PartnersPage(): Promise<React.ReactElement> {
  const schemaOverride = await getRegistryOverride("/partners");
  return (
    <>
      <JsonLdGraph
        id="partners-jsonld"
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Partners" },
            ]),
          ],
          override: schemaOverride,
        })}
      />
      <Header />
      <main id="main-content">
        <PartnersHero />
        <FadeUp>
          <PartnersWhy />
        </FadeUp>
        <FadeUp>
          <PartnersNetwork />
        </FadeUp>
        <FadeUp>
          <PartnersTestimonials />
        </FadeUp>
        <FadeUp>
          <PartnersTypes />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
