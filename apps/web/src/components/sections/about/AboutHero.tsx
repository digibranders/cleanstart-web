import Image from "next/image";

export function AboutHero() {
  return (
    <section
      className="relative overflow-hidden bg-cs-hero bg-cs-grid"
      style={{ minHeight: "639px" }}
    >
      {/* Purple radial blobs — matching Figma ellipse overlays */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(843px / 1920 * 100%)",
          top: "170px",
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

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Left text column — positioned vertically starting ~178px from section top.
            Section has pt matching the header height so content clears the fixed nav. */}
        <div className="relative grid grid-cols-1 items-center lg:grid-cols-2 pt-[110px] pb-[80px]">
          {/* Text content */}
          <div className="flex flex-col items-start gap-14 lg:max-w-[436px]">
            <h1
              className="font-sans font-semibold text-white"
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                lineHeight: "1.0",
                letterSpacing: "-0.05em",
              }}
            >
              Security Begins at The Source
            </h1>

            <a
              href="#contact"
              className="cs-btn-glass"
              style={{
                ["--cs-btn-h" as string]: "40px",
                ["--cs-btn-px" as string]: "18px",
                ["--cs-btn-fs" as string]: "20px",
                fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
                color: "#111111",
                letterSpacing: "-0.05em",
                fontWeight: 500,
              }}
            >
              Contact Us
            </a>
          </div>

          {/* 3D Hexagon object — Figma node 248:1803 */}
          <div
            className="pointer-events-none absolute hidden lg:block"
            style={{
              right: "-60px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "clamp(360px, 45vw, 640px)",
              height: "auto",
            }}
          >
            <Image
              src="/images/about/hero-3d-object.png"
              alt=""
              width={743}
              height={811}
              className="w-full h-auto object-contain"
              priority
            />
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
