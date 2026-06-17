import Image from "next/image";
import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";

/**
 * Clean Libraries hero — left headline + CTA, 3D dependency-cube image on the right.
 * Shares the product-hero gradient backdrop with CleanSight / CleanStart Images.
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
      {/* Purple wash behind the cube. */}
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
                Your Codebase Now Has Dependencies You Never{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(96.29deg, #9a51ff 42.8%, #2cc1eb 98.78%)",
                  }}
                >
                  Chose
                </span>
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="text-white max-w-[520px]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  opacity: 0.8,
                  margin: 0,
                }}
              >
                Continuously discover, validate, and govern software
                dependencies across your development lifecycle, including
                libraries introduced by AI coding assistants.
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
                <svg
                  className="cs-cta-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </HeroReveal>
          </div>

          {/* Right: 3D dependency cube. */}
          <div className="relative w-full md:flex-1 flex justify-center md:justify-end">
            <Image
              src="/images/clean-libraries/hero-cube.png"
              alt="Wireframe cube of interconnected dependency nodes labelled AI-Introduced, Transitive, and Vulnerable"
              width={1024}
              height={733}
              sizes="(min-width: 1024px) 580px, (min-width: 768px) 50vw, 90vw"
              className="relative block h-auto w-full max-w-[580px] select-none"
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
