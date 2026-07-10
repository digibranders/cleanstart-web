import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { LibrariesHeroScene } from "./LibrariesHeroScene";

/**
 * Clean Libraries hero — left headline + CTA, with the "dependencies flowing
 * into the clean container" scene on the right, built entirely in SVG/CSS
 * (no raster). The scene carries its own glows; the parent applies the slow
 * `cs-libhero-float` drift. All motion is disabled under prefers-reduced-motion
 * (see globals.css and LibrariesHeroScene).
 */
export function LibrariesHero(): React.ReactElement {
  return (
    <section
      data-section="LibrariesHero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(179.996deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.16%, rgb(19,30,143) 51%, rgb(71,30,192) 68.71%, rgb(71,31,195) 100%)",
      }}
    >
      {/* Purple wash behind the illustration. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-120px",
          top: "40px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.45) 0%, rgba(154,81,255,0) 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ zIndex: 2 }}
      >
        <div
          className="flex flex-col md:flex-row items-center md:items-center gap-10 md:gap-8 lg:gap-12"
          style={{
            paddingTop:
              "calc(clamp(96px, 9.5vw, 138px) + var(--cs-header-extra))",
            paddingBottom: "clamp(72px, 8vw, 112px)",
          }}
        >
          {/* Left: heading + description + CTA */}
          <div className="w-full md:flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 lg:gap-8 max-w-[560px]">
            <HeroReveal y={50} duration={1.0}>
              <h1
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  textWrap: "balance",
                  margin: 0,
                }}
              >
                Build Trusted Software with Verified Libraries
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="text-white max-w-[560px]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  opacity: 0.8,
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                Open source libraries you can trust.
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.35} duration={0.8}>
              <Link
                href="/book-a-demo"
                className="cs-btn-glass"
                style={
                  {
                    "--cs-btn-px": "18px",
                    "--cs-btn-fs": "16px",
                  } as React.CSSProperties
                }
              >
                <span>Request a Demo</span>
              </Link>
            </HeroReveal>
          </div>

          {/* Right: dependencies-flowing-into-clean-container scene (pure SVG/CSS).
              Hidden below md — the cube field needs the horizontal room. */}
          <div className="relative w-full md:flex-1 hidden md:flex justify-center md:justify-end">
            <div className="cs-libhero-float relative w-full max-w-[620px]">
              <LibrariesHeroScene />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
