import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { PartnersHero } from "@/components/sections/partners/PartnersHero";
import { PartnersWhy } from "@/components/sections/partners/PartnersWhy";
import { PartnersNetwork } from "@/components/sections/partners/PartnersNetwork";
import { PartnersTypes } from "@/components/sections/partners/PartnersTypes";
import { TeamsInsiders } from "@/components/sections/teams/TeamsInsiders";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Partners",
  description:
    "Join the Clean Software Movement. CleanStart partners ship verified, compliant, zero-vulnerability software to customers worldwide.",
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
          <TeamsInsiders />
        </FadeUp>
        <FadeUp>
          <PartnersTypes />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
