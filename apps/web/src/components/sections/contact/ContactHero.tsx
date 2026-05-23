import { Container } from "@/components/layout";

export function ContactHero() {
  return (
    <section
      className="bg-cs-hero relative overflow-hidden"
      style={{ minHeight: "clamp(360px, 30vw, 460px)" }}
    >
      {/* SVG tile grid — Figma's rounded-square pattern (71×71 tiles).
          Replaces the shared `bg-cs-grid` linear-gradient lines so this
          section gets the actual Figma pattern, not 1-px CSS hairlines. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/images/contact/hero-grid.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "72px 72px",
          // Mask: fade the grid out toward the bottom so it doesn't fight
          // the white fade-into-next-section.
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Purple radial blobs flanking the title — Figma decorative ellipses */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(420px / 1920 * 100%)",
          top: "100px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.40) 0%, rgba(122,89,255,0) 100%)",
          filter: "blur(70px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(1180px / 1920 * 100%)",
          top: "60px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(70,30,191,0.45) 0%, rgba(70,30,191,0) 100%)",
          filter: "blur(80px)",
        }}
      />

      {/* Left floating 3D cube — reused brand asset, optional decorative */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          top: "60px",
          left: "calc(50% - 760px)",
          width: "260px",
          height: "260px",
          transform: "rotate(-12deg)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/about/cta-3d-cube.svg"
          alt=""
          loading="eager"
          decoding="async"
          className="h-full w-full object-contain opacity-90"
        />
      </div>

      {/* Right floating 3D cube */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          top: "80px",
          left: "calc(50% + 500px)",
          width: "260px",
          height: "260px",
          transform: "rotate(10deg)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/about/cta-3d-cube.svg"
          alt=""
          loading="eager"
          decoding="async"
          className="h-full w-full object-contain opacity-90"
        />
      </div>

      <Container className="relative">
        <div className="flex flex-col items-center pt-[clamp(72px,8vw,128px)] pb-[clamp(40px,5vw,72px)] text-center">
          <h1
            className="font-display font-semibold text-white"
            style={{
              fontSize: "var(--text-hero-marketing)",
              lineHeight: "var(--text-hero-lh)",
              letterSpacing: "var(--text-hero-marketing-ls)",
            }}
          >
            Contact <span className="text-[#3960F9]">US</span>
          </h1>
          <p
            className="mt-5 max-w-[720px] text-white/80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-body-lg)",
              fontWeight: 400,
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
            }}
          >
            We would be happy to hear from you about any feedback or questions.
          </p>
        </div>
      </Container>

      {/* Bottom fade into white */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.20) 100%)",
        }}
      />
    </section>
  );
}
