import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactHero } from "@/components/sections/contact/ContactHero";
import { ContactForm } from "@/components/sections/contact/ContactForm";
import { ContactOffices } from "@/components/sections/contact/ContactOffices";
import { FrequentlyAskedQuestions } from "@/components/sections/home/FrequentlyAskedQuestions";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Contact CleanStart | Talk to a Secure Software Expert",
  absoluteTitle: true,
  description:
    "Contact CleanStart for enterprise consultations on verified container images, FIPS compliance, SBOM generation, and software supply chain security for your organization.",
  path: "/contact-us",
});

export default function ContactUsPage() {
  return (
    <>
      <JsonLd
        id="contact-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact Us" },
        ])}
      />
      <Header />
      <main>
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
