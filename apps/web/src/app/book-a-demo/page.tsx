import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { DemoHero } from "@/components/sections/book-a-demo/DemoHero";
import { BookDemoBody } from "@/components/sections/book-a-demo/BookDemoBody";
import { WhatsSetsUsApart } from "@/components/sections/book-a-demo/WhatsSetsUsApart";
import { BookDemoForm } from "@/components/sections/forms/BookDemoForm";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Book a Demo",
  description:
    "Book a CleanStart demo and see how hardened, verified container images cut vulnerabilities and speed up compliance across your software supply chain.",
  path: "/book-a-demo",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function BookDemoPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/book-a-demo", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Book a Demo" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="book-a-demo-jsonld" graph={graph} />
      <Header />
      <main id="main-content" className="bg-white">
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
