import Image from "next/image";
import Link from "next/link";

export function ASRHero(): React.ReactElement {
  return (
    <section
      data-section="ASRHero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 60.7%, #471ec0 74.7%, #421ebc 100%)",
        minHeight: "clamp(560px, 51vw, 824px)",
      }}
    >
      {/* Bottom purple glow */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute bottom-0 left-0 right-0"
        style={{
          height: "200px",
          background:
            "linear-gradient(180deg, rgba(71,30,192,0) 0%, rgba(120,60,255,0.45) 100%)",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-4 sm:px-6">
        {/* Heading + subtext — left column */}
        <div
          className="flex flex-col xl:flex-row items-start xl:items-center"
          style={{ paddingTop: "clamp(120px, 13vw, 229px)", paddingBottom: "clamp(56px, 7vw, 100px)", gap: "40px" }}
        >
          {/* Left: copy */}
          <div className="flex-1" style={{ maxWidth: "545px" }}>
            <h1
              style={{
                fontFamily: "var(--font-figtree)",
                fontSize: "clamp(40px, 4.17vw, 80px)",
                fontWeight: 600,
                letterSpacing: "-0.05em",
                lineHeight: 1.05,
                color: "white",
              }}
            >
              Bigger Images,{" "}
              <span
                style={{
                  background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Bigger Risk
              </span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-figtree)",
                fontSize: "clamp(16px, 1.56vw, 30px)",
                fontWeight: 400,
                letterSpacing: "-0.04em",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.85)",
                marginTop: "24px",
              }}
            >
              Reduce inherited risk with minimal, hardened container images built
              for production.
            </p>
            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "40px",
                padding: "14px 28px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.08)",
                fontFamily: "var(--font-figtree)",
                fontSize: "clamp(14px, 0.94vw, 18px)",
                fontWeight: 500,
                color: "white",
                letterSpacing: "-0.02em",
                textDecoration: "none",
                backdropFilter: "blur(8px)",
              }}
            >
              Explore CleanStart Images →
            </Link>
          </div>

          {/* Right: comparison cards */}
          <div className="hidden xl:block relative" style={{ width: "622px", height: "437px", flexShrink: 0 }}>
            <Image
              src="/images/attack-surface-reduction/hero-cards.png"
              alt="BLOATED vs CLEAN image comparison: 1.2 GB / 247 packages / 89 HIGH CVEs vs 87 MB / 12 packages / 0 HIGH CVEs"
              width={325}
              height={437}
              sizes="325px"
              className="absolute"
              style={{ right: 0, top: 0 }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
