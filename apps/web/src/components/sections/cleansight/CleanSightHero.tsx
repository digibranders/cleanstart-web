import Image from "next/image";
import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";

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
          paddingBottom: "0px",
          zIndex: 2,
        }}
      >
        <div className="flex flex-col items-center text-center gap-6">
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
              Continuous Visibility for Modern Software Supply Chains
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="text-white max-w-[760px]"
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
              Software Supply Chain Posture Management that continuously
              identifies inherited software risk, prioritizes exposure, and
              accelerates remediation with verified software alternatives.
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.35} duration={0.8}>
            <Link
              href="/contact-us"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-px": "20px",
                  "--cs-btn-fs": "15px",
                } as React.CSSProperties
              }
            >
              <span>Contact Us</span>
            </Link>
          </HeroReveal>
        </div>

        <div
          className="relative mx-auto"
          style={{
            marginTop: "56px",
            maxWidth: "min(960px, 100%)",
            paddingBottom: "0px",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none select-none absolute hidden md:block"
            style={{
              left: "-180px",
              top: "-12px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(192, 59, 255, 0.45) 0%, rgba(192, 59, 255, 0) 70%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none select-none absolute hidden md:block"
            style={{
              right: "-180px",
              bottom: "-40px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(44, 193, 235, 0.40) 0%, rgba(44, 193, 235, 0) 70%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />

          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "11px",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
              zIndex: 2,
            }}
          >
            <Image
              src="/images/cleansight/hero-dashboard-v2.webp"
              alt="CleanSight dashboard showing container visibility metrics, vulnerability breakdown, and ecosystem package distribution"
              width={1018}
              height={581}
              sizes="(min-width: 1024px) 960px, 100vw"
              className="block w-full h-auto select-none"
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
