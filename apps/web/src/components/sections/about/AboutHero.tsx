export function AboutHero() {
  return (
    <section
      className="relative bg-cs-hero bg-cs-grid"
      style={{ minHeight: "569px" }}
    >
      {/* Purple radial blobs — matching Figma ellipse overlays */}
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

      {/* 3D cube — Figma node 248:1803: top 47px, center at 50%+327.5px, 743×811px.
          Overflows the section bottom intentionally; clipped by overflow-hidden. */}
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

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Text at top: 178px from section top, matching Figma node 248:2066 */}
        <div className="pt-[178px] pb-[80px]">
          <div className="flex flex-col items-start gap-14 lg:max-w-[436px]">
            <h1
              className="font-sans font-semibold text-white"
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                lineHeight: "1.0",
                letterSpacing: "-0.05em",
              }}
            >
              Security Begins at <br /> The Source
            </h1>

            <a
              href="#contact"
              className="cs-btn-glass"
              style={{
                ["--cs-btn-h" as string]: "40px",
                ["--cs-btn-px" as string]: "18px",
                ["--cs-btn-fs" as string]: "20px",
                color: "#111111",
                letterSpacing: "-0.05em",
                fontWeight: 500,
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>

      {/* Bottom fade into next white section */}
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
