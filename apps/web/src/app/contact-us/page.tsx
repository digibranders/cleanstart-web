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
  title: "Contact Us",
  description:
    "Talk to CleanStart about hardened container images, compliance, and integrations. Reach our Singapore, India, and North America offices.",
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
          <FrequentlyAskedQuestions />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
