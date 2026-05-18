import Image from "next/image";

/**
 * Figma frame 161:21184 — 1920 × 965px "The CleanStart SBOM Advantage"
 *
 * White background. Centred heading at top. Left: 3D CleanStart logo with
 * layered glow ellipses and union grid. Right: scrollable benefit list with
 * mask-fade at top/bottom showing one category at a time.
 *
 * All desktop values vw-scaled from the 1920px canvas.
 * vw(n) = n / 1920 * 100
 *
 * Key Figma coords (1920 × 965 frame):
 *   Heading block    x=588  y=120  w=744  (centred)
 *   Union grid       x=calc(50%-364) y=259  w=630  h=634
 *   Ellipse1 (lg)    x=482  y=424  w=439  h=442   rotate 19.43deg
 *   Ellipse2 (lg)    x=254  y=313  w=439  h=442   rotate 19.43deg
 *   Ellipse3 (med)   x=468  y=374  w=391  h=373   rotate -5.75deg
 *   Ellipse4 (med)   x=352  y=384  w=374  h=380   rotate -5.75deg
 *   3D Logo          x=494  y=433  w=264  h=319
 *   Right panel      x=975  y=474  w=640  h=280
 *   Blob R           x=1380 y=-281 size=927
 *   Blob L           x=-339 y=-393 size=927
 */

const vw = (n: number): string => `${(n / 1920) * 100}vw`;

const TABS = [
  {
    id: "coverage",
    label: "Complete Coverage",
    bullets: [
      "99.2% field completeness with enriched metadata",
      "Transitive and shared dependency mapping across all ecosystems",
      "Scales to 5,000+ containers per hour",
    ],
  },
  {
    id: "provenance",
    label: "Provenance & Integrity",
    bullets: [
      "Commit-level tracking with build timestamps",
      "Cryptographic signing for every SBOM and image",
      "Immutable records prevent tampering or drift",
    ],
  },
  {
    id: "compliance",
    label: "Continuous Compliance",
    bullets: [
      "Native alignment with FIPS 140-3, SLSA Level 4, and RBI/DORA",
      "Automatic evidence collection for EO 14028 and EU CRA audits",
      "Always-current audit trails and no manual updates",
    ],
  },
  {
    id: "visibility",
    label: "Unified Visibility",
    bullets: [
      "Central dashboard for developers, security, and compliance teams",
      "Exports in SPDX, CycloneDX, and JSON formats",
      "Integration with CI/CD pipelines and vulnerability management tools",
    ],
  },
] as const;

export function SbomAdvantage(): React.ReactElement {
  return (
    <section
      data-section="SbomAdvantage"
      className="relative overflow-hidden bg-white w-full"
      style={{ minHeight: "calc(250px + 42vw)" }}
    >
      {/* ── Decorative blobs (Union1) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-blob.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{ left: vw(1380), top: vw(-281), width: vw(927), height: vw(927) }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-blob.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{ left: vw(-339), top: vw(-393), width: vw(927), height: vw(927) }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Centred heading — x=588 y=120 w=744 ── */}
      <div
        className="hidden lg:flex absolute flex-col items-center text-center"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          top: vw(120),
          width: vw(744),
          gap: vw(24),
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: vw(62),
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            color: "#111",
          }}
        >
          {"The CleanStart SBOM "}
          <span
            style={{
              background:
                "linear-gradient(102.33deg, #9A51FF 45.14%, #2CC1EB 98.78%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Advantage
          </span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: vw(26),
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 1.5,
            color: "#111",
            width: "100%",
          }}
        >
          From data completeness to compliance automation, CleanStart turns
          SBOMs into actionable intelligence.
        </p>
      </div>

      {/* ── Left: Union grid shape ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-union.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: `calc(50% - ${vw(364.43)})`,
          top: vw(258.77),
          width: vw(629.66),
          height: vw(634.01),
          transform: "rotate(-0.14deg) skewX(-0.47deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Glow Ellipse 2 (large, outer spread) — x=254 y=313 ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-ellipse-2.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(254.32),
          top: vw(312.53),
          width: vw(439.45),
          height: vw(442.22),
          transform: "rotate(19.43deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Glow Ellipse 4 (medium, blue spread) — x=352 y=384 ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-ellipse-4.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(351.63),
          top: vw(383.99),
          width: vw(373.68),
          height: vw(380.11),
          transform: "rotate(-5.75deg) skewX(-0.57deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Glow Ellipse 3 (medium, purple-pink) — x=468 y=374 ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-ellipse-3.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(468.11),
          top: vw(373.8),
          width: vw(390.93),
          height: vw(372.80),
          transform: "rotate(-5.75deg) skewX(-0.57deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Glow Ellipse 1 (large, inner warm) — x=482 y=424 ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/adv-ellipse-1.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(482.26),
          top: vw(424.41),
          width: vw(439.45),
          height: vw(442.22),
          transform: "rotate(19.43deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── 3D CleanStart Logo — x=494 y=433 w=264 h=319 ── */}
      <div
        className="hidden lg:block absolute"
        style={{
          left: vw(494),
          top: vw(433),
          width: vw(264),
          height: vw(319),
        }}
      >
        <Image
          src="/images/sbom/adv-logo.png"
          alt="CleanStart 3D logo"
          width={264}
          height={319}
          className="w-full h-full object-contain relative z-10"
          loading="lazy"
        />
      </div>

      {/* ── Right: static benefit list — x=975 y=474 w=640 ── */}
      <div
        className="hidden lg:flex absolute flex-col"
        style={{
          left: vw(975),
          top: vw(474),
          width: vw(640),
          gap: vw(24),
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: vw(32),
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.05em",
            color: "#111",
          }}
        >
          {TABS[0].label}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: vw(16) }}>
          {TABS[0].bullets.map((bullet) => (
            <div
              key={bullet}
              style={{ display: "flex", gap: vw(12), alignItems: "flex-start" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/adv-check.svg"
                alt=""
                aria-hidden
                style={{
                  width: vw(32),
                  height: vw(32),
                  flexShrink: 0,
                  marginTop: "0.1em",
                }}
                loading="lazy"
                decoding="async"
              />
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: vw(30),
                  fontWeight: 400,
                  lineHeight: 1.35,
                  letterSpacing: "-0.05em",
                  color: "#111",
                  opacity: 0.8,
                }}
              >
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (< lg) — stacked
          ══════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col items-center gap-8 sm:gap-10 px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 8vw, 48px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              color: "#111",
              marginBottom: "16px",
            }}
          >
            {"The CleanStart SBOM "}
            <span
              style={{
                background:
                  "linear-gradient(102.33deg, #9A51FF 45.14%, #2CC1EB 98.78%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Advantage
            </span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 4vw, 20px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "#111",
            }}
          >
            From data completeness to compliance automation, CleanStart turns
            SBOMs into actionable intelligence.
          </p>
        </div>

        <Image
          src="/images/sbom/adv-logo.png"
          alt="CleanStart 3D logo"
          width={200}
          height={241}
          className="w-40 h-auto object-contain"
          loading="lazy"
        />

        <div className="w-full max-w-2xl flex flex-col gap-10">
          {TABS.map((tab) => (
            <div key={tab.id} className="flex flex-col gap-4">
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(18px, 5vw, 24px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: "#111",
                }}
              >
                {tab.label}
              </p>
              <div className="flex flex-col gap-3">
                {tab.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3 items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/sbom/adv-check.svg"
                      alt=""
                      aria-hidden
                      style={{ width: "20px", height: "20px", flexShrink: 0, marginTop: "2px" }}
                      loading="lazy"
                      decoding="async"
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(13px, 3.5vw, 16px)",
                        fontWeight: 400,
                        lineHeight: 1.4,
                        color: "rgba(17,17,17,0.8)",
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
