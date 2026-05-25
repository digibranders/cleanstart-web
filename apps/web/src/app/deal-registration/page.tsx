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
              fontSize: "clamp(40px, 4.45vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
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
