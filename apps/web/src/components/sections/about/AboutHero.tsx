import { HeroReveal } from "@/components/ui/Reveal";

export function AboutHero() {
  return (
    <section
      className="relative bg-cs-hero bg-cs-grid overflow-visible lg:overflow-hidden lg:min-h-[clamp(440px,40vw,569px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(843px / 1920 * 100%)",
          top: "200px",
          width: "408px",
          height: "408px",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(122,89,255,0.45) 0%, rgba(122,89,255,0) 100%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(1176px / 1920 * 100%)",
          top: "50px",
          width: "408px",
          height: "408px",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(70,30,191,0.5) 0%, rgba(70,30,191,0) 100%)",
          filter: "blur(80px)",
        }}
      />

      {/* 3D cube overflows the section bottom intentionally; clipped by overflow-hidden. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          top: "0px",
          left: "calc(50% + 327.5px)",
          transform: "translateX(-50%)",
          width: "743px",
          height: "811px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/about/hero-3d-object.png"
          alt=""
          width={743}
          height={811}
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="pt-[clamp(112px,8vw,128px)] pb-[clamp(40px,5vw,80px)]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-14 lg:max-w-[436px]">
            <HeroReveal y={50} duration={1.0}>
              <h1
                className="font-display font-semibold text-white"
                style={{
                  fontSize: "var(--fs-display)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                }}
              >
                Security Begins at{" "}
                <span className="cs-text-gradient-impact">The Source</span>
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <a
                href="/contact-us"
                className="cs-btn-glass"
                style={{
                  ["--cs-btn-px" as string]: "18px",
                  ["--cs-btn-fs" as string]: "20px",
                  color: "#111111",
                  letterSpacing: "-0.05em",
                  fontWeight: 500,
                }}
              >
                Contact Us
              </a>
            </HeroReveal>

            {/* Mobile-only cube. Outer wrapper uses mix-blend-mode: color-dodge
                so the cube glows into the dark hero gradient instead of sitting
                flat like a sprite. Inner div clips the slightly-oversized image
                so the cube reads as cropped naturally. mb-[-130px] + z-10 keeps
                the breakout behavior into the white WhoWeAre section below. */}
            <div
              aria-hidden
              className="hidden relative z-10 lg:mb-0 pointer-events-none select-none"
              style={{
                width: "clamp(300px, 95vw, 380px)",
                aspectRatio: "347 / 378",
                mixBlendMode: "color-dodge",
              }}
            >
              <div className="absolute inset-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/about/hero-3d-figma.png"
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="absolute max-w-none"
                  style={{
                    left: "-14.75%",
                    top: "-8.5%",
                    width: "131.09%",
                    height: "120.19%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)",
        }}
      />
    </section>
  );
}
