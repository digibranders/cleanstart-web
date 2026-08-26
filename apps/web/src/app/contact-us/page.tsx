import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactHero } from "@/components/sections/contact/ContactHero";
import { ContactForm } from "@/components/sections/contact/ContactForm";
import { ContactOffices } from "@/components/sections/contact/ContactOffices";
import { FrequentlyAskedQuestions } from "@/components/sections/home/FrequentlyAskedQuestions";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Contact CleanStart | Talk to a Secure Software Expert",
  absoluteTitle: true,
  description:
    "Contact CleanStart about verified container images, FIPS compliance, SBOM generation, and software supply chain security for your organization.",
  path: "/contact-us",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function ContactUsPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/contact-us", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact Us" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="contact-us-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <ContactHero />

        <FadeUp>
          <ContactForm />
        </FadeUp>

        <FadeUp>
          <ContactOffices />
        </FadeUp>

        <FadeUp>
          {/* Balanced top/bottom: ContactOffices (Section md) already pads
              above, so drop the FAQ's own top padding + footer-overlap margin
              and match the bottom to the same section rhythm. */}
          <FrequentlyAskedQuestions className="pb-section-md" />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
