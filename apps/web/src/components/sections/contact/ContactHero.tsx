import { Container } from "@/components/layout";
import { HeroReveal } from "@/components/ui/Reveal";

/**
 * Hero — Figma node 857:14714.
 *
 * Background: vertical multi-stop gradient (dark navy → blue → violet → fading
 * to transparent at the bottom so it bleeds into the next section).
 * Decorations: two 3D-cube renders flanking the title, rotated and rendered
 * with mix-blend-mode: color-dodge per Figma. No grid pattern — design uses
 * a flat painted background.
 *
 * Spec dimensions are taken from a 1920-wide artboard; cube positions/sizes
 * are scaled via calc(... / 1920 * 100%) so they hold relative to the viewport.
 */
export function ContactHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgb(21, 16, 33) 25.702%, rgb(16, 18, 62) 31.159%, rgb(19, 30, 143) 51.006%, rgb(71, 30, 192) 68.711%, rgb(71, 31, 195) 79.832%, rgba(70, 30, 191, 0.85) 85.018%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 100.66%)",
      }}
    >
      {/* Left 3D cube — flanking the title at roughly the same vertical level
          as the right cube. Mix-blend-mode color-dodge. */}
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

      {/* Right 3D cube — mirrors the left, flanking the title. */}
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

      <Container className="relative">
        {/* Title block — Figma 857:14946, w=730, top=186, gap=24 between
            title and subtitle, centered. */}
        <div className="mx-auto flex flex-col items-center gap-5 pt-[clamp(112px,9vw,128px)] pb-[200px] text-center">
          <HeroReveal y={50} duration={1.0}>
            <h1
              className="text-white whitespace-nowrap"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "var(--fs-display)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                fontWeight: 600,
              }}
            >
              Contact{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(110.276deg, rgb(154, 81, 255) 1.7578%, rgb(44, 193, 235) 98.781%)",
                }}
              >
                US
              </span>
            </h1>
          </HeroReveal>
          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              className="text-white/80"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-body)",
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: "-0.04em",
                maxWidth: "730px",
              }}
            >
              We would be happy to hear from you about any feedback or questions.
            </p>
          </HeroReveal>
        </div>
      </Container>
    </section>
  );
}
