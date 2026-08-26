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
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "CleanStart Partners | Collaborate on Secure Software Supply Chains",
  absoluteTitle: true,
  description:
    "CleanStart partners with technology providers, system integrators, and cloud platforms worldwide to deliver hardened, compliance ready container images.",
  path: "/partners",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function PartnersPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/partners", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Partners" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="partners-jsonld" graph={graph} />
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
