import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FormPageBackground } from "@/components/sections/forms/FormPageBackground";
import { DealRegistrationForm } from "@/components/sections/forms/DealRegistrationForm";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Deal Registration",
  description:
    "Register a deal with CleanStart. Submit partner and prospect details to protect your opportunity.",
  path: "/deal-registration",
});

export default function DealRegistrationPage() {
  return (
    <>
      <JsonLd
        id="deal-registration-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Deal Registration" },
        ])}
      />
      <Header />
      <main>
        <FormPageBackground>
          <h1
            className="font-display font-semibold text-white text-center mx-auto"
            style={{
              fontSize: "var(--text-hero-utility)",
              lineHeight: 1.15,
              letterSpacing: "var(--text-hero-utility-ls)",
              maxWidth: "860px",
            }}
          >
            Deal Registration
          </h1>
          <div className="mt-12">
            <DealRegistrationForm />
          </div>
        </FormPageBackground>
      </main>
      <Footer />
    </>
  );
}
