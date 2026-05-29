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

      {/* Left 3D cube — matches the ContactHero treatment: 419×419 frame
          with the 294×298 cube tilted via rotate(-46.54deg), `mix-blend-mode:
          color-dodge` so it tints into the gradient, opacity 0.4. Desktop-only
          decoration (`hidden lg:block`) so mobile gets a clean text-only hero. */}
      {/* biome-ignore lint/a11y/useAltText: decorative element */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-40px",
          top: "150px",
          width: "419px",
          height: "419px",
          mixBlendMode: "color-dodge",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: "rotate(-46.54deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/contact/hero-cube.png"
            alt=""
            width={294}
            height={298}
            loading="eager"
            decoding="async"
            style={{
              width: "294px",
              height: "298px",
              opacity: 0.4,
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* Right 3D cube — mirror of the left one. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-40px",
          top: "40px",
          width: "419px",
          height: "419px",
          mixBlendMode: "color-dodge",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: "rotate(46.54deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/contact/hero-cube.png"
            alt=""
            width={294}
            height={298}
            loading="eager"
            decoding="async"
            style={{
              width: "294px",
              height: "298px",
              opacity: 0.4,
              objectFit: "contain",
            }}
          />
        </div>
      </div>

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
