import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { DealRegistrationForm } from "@/components/sections/forms/DealRegistrationForm";
import { AboutEcosystems } from "@/components/sections/about/AboutEcosystems";
import { FadeUp } from "@/components/ui/FadeUp";
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
      <main style={{ background: "#f3f3f6" }}>
        {/* ── Hero — dark navy → violet gradient that softens into the
            page's light-lavender body. Crystal cubes flank the title and
            are fully visible inside the viewport (not bled off-screen). */}
        <section className="relative w-full overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #15102B 0%, #161C5F 18%, #1F23A0 40%, #2D2BB8 60%, #4B25CA 80%, #8B7AE0 95%, #f3f3f6 100%)",
            }}
          />

          {/* Left cube — fully visible inside the viewport, sitting in the
              top-left quadrant of the hero. */}
          <Image
            src="/images/book-a-demo/hero-cube-left.png"
            alt=""
            width={419}
            height={419}
            aria-hidden
            className="pointer-events-none select-none absolute hidden sm:block sm:left-[clamp(8px,3vw,48px)] sm:top-[clamp(120px,12vw,220px)] sm:w-[clamp(160px,18vw,280px)]"
            style={{
              height: "auto",
              opacity: 1,
            }}
            sizes="(min-width: 1440px) 280px, (min-width: 768px) 18vw, 120px"
            priority
          />

          {/* Right cube — mirror */}
          <Image
            src="/images/book-a-demo/hero-cube-right.png"
            alt=""
            width={419}
            height={419}
            aria-hidden
            className="pointer-events-none select-none absolute hidden sm:block sm:right-[clamp(8px,3vw,48px)] sm:top-[clamp(120px,12vw,220px)] sm:w-[clamp(160px,18vw,280px)]"
            style={{
              height: "auto",
              opacity: 1,
            }}
            sizes="(min-width: 1440px) 280px, (min-width: 768px) 18vw, 120px"
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
                // Generous line-height + the inline-block span's bottom
                // padding prevent `bg-clip-text` from clipping the
                // descender on the "g" in "Registration".
                lineHeight: 1.2,
                letterSpacing: "-0.04em",
              }}
            >
              Deal{" "}
              <span
                className="inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(99deg, rgba(154, 81, 255, 1) 0%, rgba(44, 193, 235, 1) 100%)",
                  paddingBottom: "0.12em",
                }}
              >
                Registration
              </span>
            </h1>
          </div>
        </section>

        {/* ── Light-lavender form body. The OUTER section sits flush
            below the hero so the dark hero's left/right sides remain
            visible at the form card's overlap zone. The INNER wrapper has
            a negative top margin that pulls only the form card up into
            the dark hero. */}
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

        {/* ── Ecosystems marquee — same logos used on /about's
            "Built for the Ecosystems You Trust" section. */}
        <FadeUp>
          <AboutEcosystems bottomPadding="compact" />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
