import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

const CARD_BG =
  "linear-gradient(180deg, #131E8F 0%, #2A1EA5 50%, #401EBA 100%)";

export function FipsCTA(): React.ReactElement {
  return (
    <div
      data-section="FipsCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: CARD_BG }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/cta-cube.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: 0,
          bottom: 0,
          width: "19.98%",
          height: "auto",
          opacity: 0.75,
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="hidden md:flex absolute items-start"
        style={{
          left: "9.56%",
          width: "82.05%",
          top: 0,
          bottom: 0,
          paddingTop: "clamp(28px, 4vw, 48px)",
          paddingBottom: "clamp(28px, 4vw, 48px)",
          gap: "clamp(32px, 10.98%, 115px)",
        }}
      >
        <Reveal header className="flex-shrink-0" style={{ width: "38.30%" }}>
          <p
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Ready to Secure Your Container Infrastructure?
          </p>
        </Reveal>

        <Reveal
          header
          delay={0.15}
          y={20}
          className="flex flex-col flex-shrink-0"
          style={{ gap: "24px", width: "47.09%" }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.80)",
            }}
          >
            Start with zero-CVE hardened images. Deploy faster with confidence
            knowing your containers are secured from the ground up.
          </p>

          <Link
            href="/book-a-demo"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "18px",
              } as React.CSSProperties
            }
          >
            Get a Demo
          </Link>
        </Reveal>
      </div>

      <div className="md:hidden relative h-full p-6 flex flex-col gap-5 justify-center items-center text-center">
        <p
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "280px",
          }}
        >
          Ready to Secure Your Container Infrastructure?
        </p>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.80)",
          }}
        >
          Start with zero-CVE hardened images. Deploy faster with confidence
          knowing your containers are secured from the ground up.
        </p>
        <Link
          href="/book-a-demo"
          className="cs-btn-glass self-center"
          style={
            {
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "16px",
            } as React.CSSProperties
          }
        >
          Get a Demo
        </Link>
      </div>
    </div>
  );
}
