import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { CleanSightHeroDeck } from "./CleanSightHeroDeck";

export function CleanSightHero(): React.ReactElement {
  return (
    <section
      data-section="CleanSightHero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(179.996deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.16%, rgb(19,30,143) 51%, rgb(71,30,192) 68.71%, rgb(71,31,195) 100%)",
      }}
    >
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(96px, 9.5vw, 138px) + var(--cs-header-extra))",
          paddingBottom: "clamp(32px, 3.5vw, 56px)",
          zIndex: 2,
        }}
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <HeroReveal y={50} duration={1.0}>
              <h1
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-display)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  textWrap: "balance",
                }}
              >
                Continuous Software Visibility
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="mt-5 max-w-[540px] text-white"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  opacity: 0.8,
                  textWrap: "balance",
                }}
              >
                Discover software assets, dependencies, and inherited risk across
                modern environments.
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.35} duration={0.8}>
              <Link
                href="/book-a-demo"
                className="cs-btn-glass mt-8"
                style={
                  {
                    "--cs-btn-px": "22px",
                    "--cs-btn-fs": "15px",
                  } as React.CSSProperties
                }
              >
                <span>Book a Demo</span>
              </Link>
            </HeroReveal>
          </div>

          <HeroReveal y={40} delay={0.24} duration={1.0} className="w-full">
            <div
              className="relative mx-auto w-full"
              style={{ maxWidth: "620px" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute hidden select-none md:block"
                style={{
                  left: "-90px",
                  top: "-40px",
                  width: "320px",
                  height: "320px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(closest-side, rgba(192,59,255,0.45) 0%, rgba(192,59,255,0) 70%)",
                  filter: "blur(44px)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute hidden select-none md:block"
                style={{
                  right: "-90px",
                  bottom: "-60px",
                  width: "320px",
                  height: "320px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(closest-side, rgba(44,193,235,0.42) 0%, rgba(44,193,235,0) 70%)",
                  filter: "blur(44px)",
                }}
              />

              <div className="relative">
                <CleanSightHeroDeck />
              </div>
            </div>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
