import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { PartnersHero } from "@/components/sections/partners/PartnersHero";
import { PartnersWhy } from "@/components/sections/partners/PartnersWhy";
import { PartnersNetwork } from "@/components/sections/partners/PartnersNetwork";
import { PartnersTypes } from "@/components/sections/partners/PartnersTypes";
import { PartnersTestimonials } from "@/components/sections/partners/PartnersTestimonials";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "CleanStart Partners | Collaborate on Secure Software Supply Chains",
  absoluteTitle: true,
  description:
    "Explore CleanStart's global partner network of technology providers, system integrators, and cloud platforms delivering hardened, compliance ready container images worldwide.",
  path: "/partners",
});

export default function PartnersPage() {
  return (
    <>
      <JsonLd
        id="partners-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Partners" },
        ])}
      />
      <Header />
      <main>
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
