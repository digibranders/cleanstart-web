import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { DemoHero } from "@/components/sections/book-a-demo/DemoHero";
import { BookDemoBody } from "@/components/sections/book-a-demo/BookDemoBody";
import { WhatsSetsUsApart } from "@/components/sections/book-a-demo/WhatsSetsUsApart";
import { BookDemoForm } from "@/components/sections/forms/BookDemoForm";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Book a Demo",
  description:
    "Get a personalized CleanStart demo. See how hardened, zero-CVE container images, signed SBOMs, and provenance attestations fit your stack.",
  path: "/book-a-demo",
});

export default function BookDemoPage() {
  return (
    <>
      <JsonLd
        id="book-demo-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Book a Demo" },
        ])}
      />
      <Header />
      <main className="bg-white">
        <DemoHero />

        <BookDemoBody>
          <FadeUp>
            <WhatsSetsUsApart />
          </FadeUp>

          <section
            className="relative"
            style={{
              paddingLeft: "clamp(24px, 4vw, 80px)",
              paddingRight: "clamp(24px, 4vw, 80px)",
              paddingBottom: "clamp(48px, 6vw, 80px)",
            }}
          >
            <BookDemoForm />
          </section>
        </BookDemoBody>
      </main>
      <Footer />
    </>
  );
}
