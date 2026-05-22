import Image from "next/image";
import { Container } from "@/components/layout";

/**
 * Community / Hero (Figma 732:3192, Frame 0-960).
 *
 * Layout: dark navy gradient + grid + decorative purple ellipses on the
 * top half; team photo bleed-to-edge fills the bottom half (-20→1940,
 * y=464, h=496). Title + body + Join-Community CTA sit in the top half.
 */
export function CommunityHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: "960px",
        backgroundColor: "#0B0B27",
        backgroundImage: [
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(180deg, #0B0B27 0%, #131E8F 60%, #471EC0 100%)",
        ].join(", "),
        backgroundSize: "80px 80px, 80px 80px, 100% 100%",
        backgroundRepeat: "repeat, repeat, no-repeat",
      }}
    >
      {/* Decorative purple ellipse — bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-180px",
          top: "180px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.45) 0%, rgba(122,89,255,0) 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Decorative purple ellipse — top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-220px",
          top: "-160px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(60,30,180,0.55) 0%, rgba(60,30,180,0) 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Copy block (top half) */}
      <Container className="relative z-10 pt-[clamp(120px,12vw,172px)]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-8">
          <h1
            className="font-display font-semibold text-white"
            style={{
              fontSize: "var(--text-hero-marketing)",
              letterSpacing: "var(--text-hero-marketing-ls)",
              lineHeight: "var(--text-hero-lh)",
            }}
          >
            Let&rsquo;s work together towards secure development
          </h1>

          <div className="flex flex-col items-start gap-8 lg:pt-2">
            <p
              className="font-sans font-normal text-white/80"
              style={{
                fontSize: "var(--text-body-xl)",
                lineHeight: 1.4,
                letterSpacing: "-0.025em",
              }}
            >
              Connect with developers and security leaders sharing real-world
              strategies to reduce risk, secure images, and ship faster with
              confidence.
            </p>
            <a
              href="https://github.com/cleanstart"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-btn-glass"
              style={{
                ["--cs-btn-px" as string]: "18px",
                ["--cs-btn-fs" as string]: "18px",
                color: "#111111",
              }}
            >
              <span>Join Community</span>
            </a>
          </div>
        </div>
      </Container>

      {/* Team photo — bleeds edge-to-edge, sits in bottom half of hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 select-none"
        style={{ bottom: 0, height: "clamp(320px, 52vw, 496px)" }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src="/images/community/hero-team.png"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
        </div>
      </div>
    </section>
  );
}
