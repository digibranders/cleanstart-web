import Image from "next/image";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { DealRegistrationForm } from "@/components/sections/forms/DealRegistrationForm";
import { AboutEcosystems } from "@/components/sections/about/AboutEcosystems";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Deal Registration",
  description:
    "Register your CleanStart deal to protect your pipeline, access partner pricing, and collaborate on enterprise supply chain security opportunities.",
  path: "/deal-registration",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function DealRegistrationPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/deal-registration", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Deal Registration" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="deal-registration-jsonld" graph={graph} />
      <Header />
      <main id="main-content" style={{ background: "#f3f3f6" }}>
        <section className="relative w-full overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #15102B 0%, #161C5F 18%, #1F23A0 40%, #2D2BB8 60%, #4B25CA 80%, #8B7AE0 95%, #f3f3f6 100%)",
            }}
          />

          <Image
            src="/images/book-a-demo/hero-cube-left.webp"
            alt=""
            width={332}
            height={313}
            aria-hidden
            className="pointer-events-none select-none absolute hidden xl:block"
            style={{
              width: "332px",
              height: "313px",
              left: "-95px",
              top: "208px",
              mixBlendMode: "hard-light",
              opacity: 0.4,
            }}
            sizes="332px"
            priority
          />

          <Image
            src="/images/book-a-demo/hero-cube-right.webp"
            alt=""
            width={294}
            height={298}
            aria-hidden
            className="pointer-events-none select-none absolute hidden xl:block"
            style={{
              width: "294px",
              height: "298px",
              left: "calc(1647 / 1920 * 100%)",
              top: "-1px",
              mixBlendMode: "color-dodge",
              transform: "rotate(-46.54deg)",
              opacity: 0.4,
            }}
            sizes="294px"
          />

          <div
            className="relative mx-auto flex items-end justify-center text-center pb-[600px] sm:pb-[clamp(180px,26vw,330px)]"
            style={{
              maxWidth: "var(--container-default)",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingTop: "clamp(94px, 11vw, 160px)",
            }}
          >
            <h1
              className="text-white"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 600,
                fontSize: "var(--fs-display)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
              }}
            >
              Deal Registration
            </h1>
          </div>
        </section>

        {/* The outer section sits flush below the hero so the dark hero's
            left/right edges stay visible at the form card's overlap zone; the
            inner wrapper's negative top margin pulls only the form card up
            into the dark hero. */}
        <section
          className="relative"
          style={{
            background: "#f3f3f6",
            paddingLeft: "clamp(24px, 4vw, 80px)",
            paddingRight: "clamp(24px, 4vw, 80px)",
            paddingBottom: "clamp(48px, 6vw, 80px)",
            // `display: flow-root` establishes a new block formatting
            // context so the inner div's negative margin-top doesn't
            // collapse into this section's top edge and pull the
            // lavender bg up over the dark hero gradient.
            display: "flow-root",
          }}
        >
          <div
            className="relative z-10 -mt-[580px] sm:mt-[calc(-1*clamp(60px,16vw,250px))]"
          >
            <DealRegistrationForm />
          </div>
        </section>

        <FadeUp>
          <AboutEcosystems bottomPadding="compact" cornerAccent />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
