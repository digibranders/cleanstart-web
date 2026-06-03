import Link from "next/link";
import Image from "next/image";
import { HeroReveal } from "@/components/ui/Reveal";

export function CleanStartImagesHero(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesHero"
      className="relative overflow-hidden lg:min-h-[clamp(580px,52vw,741px)]"
      style={{
        background:
          "linear-gradient(179.99deg, rgb(21,16,33) 0%, rgb(21,16,33) 25.702%, rgb(16,18,62) 31.159%, rgb(19,30,143) 51.006%, rgb(71,30,192) 68.711%, rgb(71,31,195) 79.832%, rgba(70,30,191,0.85) 85.018%, rgba(66,30,188,0.4) 93.72%, rgba(66,30,188,0) 98.921%)",
      }}
    >
      {/* Decorative ellipse glow behind the 3D image */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "777px", top: "79px", width: "497px", height: "502px" }}
      >
        <div style={{ position: "absolute", inset: "-68.53% -69.22%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/hero-ellipse-glow.svg"
            alt=""
            aria-hidden
            className="block max-w-none size-full select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* Decorative vector grid behind the 3D image */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "690px", top: "0px", width: "730px", height: "708px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/hero-vector-grid.svg"
          alt=""
          aria-hidden
          className="block max-w-none size-full select-none pointer-events-none"
          loading="eager"
          decoding="async"
        />
      </div>

      <div
        className="absolute inset-0 z-10 flex flex-col justify-center pointer-events-none"
        aria-hidden
      />
      <div
        className="relative z-10 w-full h-full flex items-center"
        style={{ minHeight: "inherit" }}
      >
        <div
          className="mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col lg:flex-row items-center pt-[112px] lg:pt-[clamp(48px,5vw,80px)]"
          style={{
            paddingBottom: "clamp(48px, 5vw, 80px)",
            gap: "clamp(40px, 4vw, 60px)",
          }}
        >
          <div
            className="flex flex-col items-start"
            style={{ flexShrink: 0, maxWidth: "623px", gap: "32px" }}
          >
            <HeroReveal y={50} duration={1.0}>
              <h1
                className="text-white w-full"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-display)",
                  letterSpacing: "var(--fs-display-ls)",
                  lineHeight: "var(--fs-display-lh)",
                  fontWeight: 600,
                }}
              >
                Trusted Container{" "}
                <span className="cs-text-gradient-impact">Foundations</span>
              </h1>
            </HeroReveal>

            <div className="flex flex-col items-start w-full" style={{ gap: "32px" }}>
              <HeroReveal y={30} delay={0.2} duration={0.8}>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-lead)",
                    fontWeight: 400,
                    lineHeight: 1.45,
                    letterSpacing: "-0.02em",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  Minimal, hardened, verifiable container images built from trusted
                  sources and continuously rebuilt to reduce inherited risk.
                </p>
              </HeroReveal>

              <HeroReveal y={30} delay={0.35} duration={0.8}>
                <Link
                  href="https://images.cleanstart.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-btn-glass"
                  style={
                    {
                      "--cs-btn-fs": "var(--btn-fs-lg)",
                      "--cs-btn-h": "var(--btn-h-xl)",
                      "--cs-btn-px": "var(--btn-px-xl)",
                    } as React.CSSProperties
                  }
                >
                  Explore Images
                </Link>
              </HeroReveal>
            </div>
          </div>

          <div className="relative flex-1 hidden lg:flex items-center justify-center lg:justify-end">
            <Image
              src="/images/cleanstart-images/hero-3d-container.png"
              alt="3D isometric container image illustrating CleanStart's hardened, FIPS-compliant image pipeline with security shield and code modules."
              width={523}
              height={455}
              sizes="(max-width: 1024px) 80vw, 523px"
              className="w-full max-w-[523px] select-none object-contain"
              style={{ height: "auto" }}
              loading="eager"
              decoding="async"
              draggable={false}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
