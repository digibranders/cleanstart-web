import Image from "next/image";
import Link from "next/link";

export function ASRCTA(): React.ReactElement {
  return (
    <section
      data-section="ASRCTA"
      className="relative overflow-hidden bg-white py-section-md"
    >
      {/* Light purple glow in bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-80px",
          bottom: "-40px",
          width: "480px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(154,81,255,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-6">
        <div className="flex flex-col xl:flex-row items-center justify-between" style={{ gap: "48px" }}>
          {/* Left: heading + bird */}
          <div className="flex items-end" style={{ gap: "24px" }}>
            <h2
              style={{
                fontFamily: "var(--font-figtree)",
                fontSize: "clamp(28px, 2.86vw, 55px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.05,
                color: "#111111",
                maxWidth: "420px",
              }}
            >
              Reduce Attack Surface at the{" "}
              <span
                style={{
                  background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Source
              </span>
            </h2>
            <div className="hidden xl:block" style={{ flexShrink: 0 }}>
              <Image
                src="/images/attack-surface-reduction/cta-bird.png"
                alt=""
                aria-hidden
                width={152}
                height={103}
                sizes="152px"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: description + CTAs */}
          <div className="flex flex-col" style={{ gap: "24px", maxWidth: "480px" }}>
            <p
              style={{
                fontFamily: "var(--font-figtree)",
                fontSize: "clamp(14px, 1.09vw, 21px)",
                fontWeight: 400,
                letterSpacing: "-0.04em",
                lineHeight: 1.5,
                color: "#555555",
              }}
            >
              Build with only what production needs.
            </p>
            <div className="flex flex-wrap" style={{ gap: "16px" }}>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 28px",
                  borderRadius: "9999px",
                  background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
                  fontFamily: "var(--font-figtree)",
                  fontSize: "clamp(13px, 0.94vw, 18px)",
                  fontWeight: 500,
                  color: "white",
                  letterSpacing: "-0.02em",
                  textDecoration: "none",
                }}
              >
                Attack Surface Reduction →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
