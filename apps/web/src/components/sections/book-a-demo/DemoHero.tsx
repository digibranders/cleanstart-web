import Image from "next/image";
import { HeroReveal } from "@/components/ui/Reveal";

/**
 * Dark gradient hero band for the Book a Demo page. Matches Figma node
 * 867:646 — a 1920×369 frame at x:-240, y:0 with the exact Figma
 * gradient and "Get a Demo" title (Manrope SemiBold 72px) at x:782, y:176
 * within the 1440 viewport. The "Demo" word carries the Figma ts1
 * gradient. Two iridescent cube images (Figma image 583137/583138)
 * flank the title.
 */
export function DemoHero(): React.ReactElement {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background gradient — bleeds beyond the 1440 viewport (Figma x:-240, w:1920). */}
      <div
        aria-hidden
        className="absolute inset-0 left-1/2 -translate-x-1/2"
        style={{
          width: "min(1920px, calc(100% + 480px))",
          background:
            "linear-gradient(180deg, rgba(21, 16, 33, 1) 0%, rgba(16, 18, 62, 1) 31%, rgba(19, 30, 143, 1) 51%, rgba(71, 30, 192, 1) 69%, rgba(71, 31, 195, 1) 80%, rgba(70, 30, 191, 0.85) 85%, rgba(66, 30, 188, 0.4) 94%, rgba(66, 30, 188, 0) 100%)",
        }}
      />

      {/* Left cube — Figma image 583137 at x:50, y:148 in the 1920-wide bg
          (≈ 910px left of center on desktop). On mobile we pull it back to
          the visible left edge so it frames the title from the corner like
          the Figma mobile comp. `mix-blend-mode: screen` lets the gradient
          colour the cube's dark regions so it reads as embedded *in* the hero
          atmosphere rather than sitting on top. */}
      <Image
        src="/images/book-a-demo/hero-cube-left.png"
        alt=""
        width={419}
        height={419}
        aria-hidden
        className="pointer-events-none select-none absolute left-[-60px] top-[40px] w-[160px] md:left-[calc(50%-910px)] md:top-[148px] md:w-[clamp(220px,22vw,419px)]"
        style={{
          height: "auto",
          mixBlendMode: "screen",
          opacity: 0.85,
          maskImage:
            "linear-gradient(180deg, black 0%, black 55%, rgba(0,0,0,0.6) 78%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, black 55%, rgba(0,0,0,0.6) 78%, rgba(0,0,0,0) 100%)",
        }}
        sizes="(min-width: 1440px) 419px, (min-width: 768px) 22vw, 160px"
        priority
      />

      {/* Right cube — mirror of the left one so the title sits centered
          between two purple-gem accents. Shown on both mobile and desktop;
          on desktop it lives ~880px right of centre to mirror the left cube. */}
      <Image
        src="/images/book-a-demo/hero-cube-right.png"
        alt=""
        width={419}
        height={419}
        aria-hidden
        className="pointer-events-none select-none absolute right-[-60px] top-[40px] w-[160px] md:right-[calc(50%-910px)] md:top-[148px] md:w-[clamp(220px,22vw,419px)] md:left-auto"
        style={{
          height: "auto",
          mixBlendMode: "screen",
          opacity: 0.85,
          maskImage:
            "linear-gradient(180deg, black 0%, black 55%, rgba(0,0,0,0.6) 78%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, black 55%, rgba(0,0,0,0.6) 78%, rgba(0,0,0,0) 100%)",
        }}
        sizes="(min-width: 1440px) 419px, (min-width: 768px) 22vw, 160px"
      />

      {/* Content — title centered around Figma y:176 within a ~369px tall band */}
      <div
        className="relative mx-auto flex items-end justify-center text-center"
        style={{
          maxWidth: "var(--container-default)",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "clamp(80px, 10vw, 176px)",
          paddingBottom: "clamp(60px, 8vw, 200px)",
        }}
      >
        <HeroReveal y={50} duration={1.0}>
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 600,
              fontSize: "var(--fs-display)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            Get a{" "}
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(99deg, rgba(154, 81, 255, 1) 0%, rgba(44, 193, 235, 1) 100%)",
              }}
            >
              Demo
            </span>
          </h1>
        </HeroReveal>
      </div>
    </section>
  );
}
