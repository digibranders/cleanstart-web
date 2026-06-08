import { HeroReveal } from "@/components/ui/Reveal";

export function AboutHero() {
  return (
    <section
      className="relative bg-cs-hero overflow-visible lg:overflow-hidden lg:min-h-[clamp(440px,40vw,569px)]"
    >
      {/* Grid mesh — shared hero-mesh.svg, the same asset and treatment as the
          ASR hero (replaces the old `bg-cs-grid` CSS gridlines). Mobile uses a
          full-width copy; md+ uses an oversized copy that overflows each side,
          clipped by the hero wrapper's lg:overflow-hidden and the body's
          overflow-x: clip. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute left-0 top-0 w-full h-[400px] md:hidden"
        src="/images/attack-surface-reduction/hero-mesh.svg"
        alt=""
        loading="eager"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block max-w-none"
        src="/images/attack-surface-reduction/hero-mesh.svg"
        alt=""
        style={{ left: "-240px", top: 0, width: "1920px", height: "569px" }}
        loading="eager"
        decoding="async"
      />

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
          top: "80px",
          left: "calc(50% + 327.5px)",
          transform: "translateX(-50%)",
          width: "743px",
          height: "811px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/about/hero-3d-object.webp"
          alt=""
          width={743}
          height={811}
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="pt-[calc(clamp(112px,8vw,128px)+var(--cs-header-extra))] pb-[clamp(40px,5vw,80px)]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-10 lg:max-w-[540px]">
            <div className="flex flex-col gap-5">
              <HeroReveal y={50} duration={1.0}>
                <h1
                  className="font-display font-semibold text-white"
                  style={{
                    fontSize: "var(--fs-display)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Building the Foundation for{" "}
                  <span className="cs-text-gradient-impact">Trusted Software</span>
                </h1>
              </HeroReveal>

              <HeroReveal y={30} delay={0.15} duration={0.8}>
                <p
                  className="font-sans font-normal text-white/85"
                  style={{
                    fontSize: "var(--fs-lead)",
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Redefining how modern software is built, verified, and
                  delivered.
                </p>
              </HeroReveal>
            </div>

            <HeroReveal y={30} delay={0.3} duration={0.8}>
              <a
                href="/cleanstart-platform"
                className="cs-btn-glass"
                style={{
                  ["--cs-btn-px" as string]: "18px",
                  ["--cs-btn-fs" as string]: "20px",
                  color: "#111111",
                  letterSpacing: "-0.05em",
                  fontWeight: 500,
                }}
              >
                Explore CleanStart
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
                  src="/images/about/hero-3d-figma.webp"
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
