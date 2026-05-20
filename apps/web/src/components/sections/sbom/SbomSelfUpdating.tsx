import Image from "next/image";

/**
 * Figma frame 161:21145 — 1920 × 844px "Self-Updating, Self-Verifying SBOMs"
 *
 * All desktop values are vw-scaled from the 1920px Figma canvas.
 * vw(n) = n / 1920 * 100  →  `${n / 1920 * 100}vw`
 *
 * Circle assets from Figma (actual SVGs, not CSS):
 *   ellipse-large.svg      ø82 circle background
 *   ellipse-large-glow.svg ø82 inner glow ring
 *   ellipse-small.svg      ø76 circle background
 *   ellipse-small-glow.svg ø76 inner glow ring
 *
 * Figma coordinates (1920 × 844 frame):
 *   Heading       x=599  y=80   w=753  h2-w=593
 *   Screenshot    x=960  y=375  w=872  h=468  (centred)
 *   Open Std      x=503  y=391  w=256
 *   Cont. Val.    x=1163 y=391  w=256
 *   Auto SBOMs    x=431  y=713  w=256
 *   Verif. Prov.  x=1234 y=725  w=256
 *   Circle 1 ø82  x=696  y=562  num-inset top=68.96% left=37.86%
 *   Circle 2 ø82  x=1144 y=562  num-inset top=68.96% left=61.04%
 *   Circle 3 ø76  x=771  y=457  num-inset top=56.34% left=41.80%
 *   Circle 4 ø76  x=1079 y=458  num-inset top=56.46% left=57.84%
 */

const vw = (n: number): string => `${(n / 1920) * 100}vw`;

export function SbomSelfUpdating(): React.ReactElement {
  return (
    <section
      data-section="SbomSelfUpdating"
      className="relative overflow-hidden w-full"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)",
        minHeight: `clamp(480px, ${vw(844)}, ${vw(844)})`,
      }}
    >
      {/* ── Decorative blobs ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(1228),
          top: vw(252),
          width: vw(1181),
          height: vw(1181),
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(71,30,192,0.55) 0%, rgba(71,30,192,0) 70%)",
          filter: `blur(${vw(60)})`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(-659),
          top: vw(-513),
          width: vw(1181),
          height: vw(1181),
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(71,30,192,0.45) 0%, rgba(71,30,192,0) 70%)",
          filter: `blur(${vw(60)})`,
        }}
      />

      {/* ── Corner decoration ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/self-update-corner-icon.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{ left: vw(305), top: vw(537), width: vw(41), height: vw(42) }}
        loading="lazy"
        decoding="async"
      />

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (lg+)
          ══════════════════════════════════════════════════════════════════ */}

      {/* Heading block — x=599 y=80 w=753 */}
      <div
        className="hidden lg:flex absolute flex-col items-center text-center"
        style={{ left: vw(599), top: vw(80), width: vw(753), gap: vw(24) }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: vw(62),
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.1,
            color: "#fff",
            width: vw(593),
          }}
        >
          {"Self-Updating, Self-Verifying "}
          <span
            style={{
              background: "linear-gradient(99.88deg, #9A51FF 1.76%, #2CC1EB 98.78%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SBOMs
          </span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: vw(26),
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.88)",
            width: "100%",
          }}
        >
          Automated SBOM creation with cryptographic signing and continuous
          validation in CI/CD ensures accuracy and compliance at every build.
        </p>
      </div>

      {/* Screenshot — centred, no rounded corners, no shadow */}
      <div
        className="hidden lg:block absolute"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          top: vw(375),
          width: vw(872),
          height: vw(468),
        }}
      >
        <Image
          src="/images/sbom/sbom-screenshot.png"
          alt="CleanStart SBOM dashboard"
          width={872}
          height={468}
          sizes="(min-width: 1280px) 872px, 100vw"
          className="w-full h-full object-contain"
          style={{ display: "block" }}
          loading="lazy"
        />
      </div>

      {/* ── Numbered circles (Figma SVG assets) ── */}

      {/* Circle 1 ø82 — x=696 y=562 */}
      <FigmaCircle size={82} x={696} y={562} glowSize={63.778} glowOffset={9} num={1} numGradient="linear-gradient(128.67deg, #9A51FF 35.82%, #2CC1EB 78.3%)" />
      {/* Circle 2 ø82 — x=1144 y=562 */}
      <FigmaCircle size={82} x={1144} y={562} glowSize={63.778} glowOffset={9} num={2} numGradient="linear-gradient(137.60deg, #9A51FF 35.82%, #2CC1EB 78.3%)" />
      {/* Circle 3 ø76 — x=771 y=457 */}
      <FigmaCircle size={76} x={771} y={457} glowSize={59.111} glowOffset={8.34} num={3} numGradient="linear-gradient(121.70deg, #9A51FF 35.82%, #2CC1EB 78.3%)" small />
      {/* Circle 4 ø76 — x=1079 y=458 */}
      <FigmaCircle size={76} x={1079} y={458} glowSize={59.111} glowOffset={8.34} num={4} numGradient="linear-gradient(121.70deg, #9A51FF 35.82%, #2CC1EB 78.3%)" small />

      {/* ── Feature labels ── */}
      <FeatureLabel x={503}  y={391} title="Open Standards"       body="Supports SPDX and CycloneDX formats for compatibility with vulnerability and license management tools." />
      <FeatureLabel x={1163} y={391} title="Continuous Validation" body="Automated rebuilds and checks keep SBOMs current, accurate, and always audit-ready for every deployment." bodyWidth={218} />
      <FeatureLabel x={431}  y={713} title="Automated SBOMs"      body="Every build automatically creates a complete SBOM with all direct and transitive dependencies." />
      <FeatureLabel x={1234} y={725} title="Verified Provenance"  body="Each SBOM includes commit IDs and timestamps to verify the authenticity of every component." />

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (< lg)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col items-center text-center gap-6 sm:gap-8 px-4 sm:px-6 py-12 sm:py-16">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 8vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          {"Self-Updating, Self-Verifying "}
          <span
            style={{
              background: "linear-gradient(99.88deg, #9A51FF 1.76%, #2CC1EB 98.78%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SBOMs
          </span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(14px, 4vw, 20px)",
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.85)",
            maxWidth: "600px",
          }}
        >
          Automated SBOM creation with cryptographic signing and continuous
          validation in CI/CD ensures accuracy and compliance at every build.
        </p>
        <Image
          src="/images/sbom/sbom-screenshot.png"
          alt="CleanStart SBOM dashboard"
          width={872}
          height={468}
          sizes="(min-width: 768px) 672px, 100vw"
          className="w-full max-w-2xl h-auto object-contain"
          loading="lazy"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl text-left">
          {MOBILE_FEATURES.map((f) => (
            <div key={f.num} className="flex flex-col items-center gap-3">
              <MobileCircle num={f.num} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff" }}>
                {f.title}
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 400, lineHeight: 1.4, color: "rgba(255,255,255,0.75)" }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── data ─────────────────────────────────────────────────────────────── */

const MOBILE_FEATURES = [
  { num: 1, title: "Automated SBOMs",       body: "Every build automatically creates a complete SBOM with all direct and transitive dependencies." },
  { num: 2, title: "Verified Provenance",   body: "Each SBOM includes commit IDs and timestamps to verify the authenticity of every component." },
  { num: 3, title: "Open Standards",        body: "Supports SPDX and CycloneDX formats for compatibility with vulnerability and license management tools." },
  { num: 4, title: "Continuous Validation", body: "Automated rebuilds and checks keep SBOMs current, accurate, and always audit-ready." },
];

/* ── sub-components ──────────────────────────────────────────────────── */

type FigmaCircleProps = {
  size: number;
  x: number;
  y: number;
  glowSize: number;
  glowOffset: number;
  num: number;
  numGradient: string;
  small?: boolean;
};

function FigmaCircle({ size, x, y, glowSize, glowOffset, num, numGradient, small = false }: FigmaCircleProps): React.ReactElement {
  const bgAsset = small ? "/images/sbom/ellipse-small.svg" : "/images/sbom/ellipse-large.svg";
  const glowAsset = small ? "/images/sbom/ellipse-small-glow.svg" : "/images/sbom/ellipse-large-glow.svg";

  return (
    <div
      className="hidden lg:flex absolute items-center justify-center"
      style={{ left: vw(x), top: vw(y), width: vw(size), height: vw(size), zIndex: 10 }}
    >
      {/* Circle background SVG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgAsset}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
        loading="lazy"
        decoding="async"
      />
      {/* Inner glow ring SVG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={glowAsset}
        alt=""
        aria-hidden
        className="absolute"
        style={{
          left: vw(glowOffset),
          top: vw(glowOffset),
          width: vw(glowSize),
          height: vw(glowSize),
          pointerEvents: "none",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* Number — centred via parent flexbox, layered above the SVGs */}
      <span
        className="relative"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: vw(44),
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          background: numGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          zIndex: 1,
        }}
      >
        {num}
      </span>
    </div>
  );
}

type FeatureLabelProps = { x: number; y: number; title: string; body: string; bodyWidth?: number };

function FeatureLabel({ x, y, title, body, bodyWidth }: FeatureLabelProps): React.ReactElement {
  return (
    <div
      className="hidden lg:flex absolute flex-col items-center text-center"
      style={{ left: vw(x), top: vw(y), width: vw(256), gap: vw(8), color: "#fff" }}
    >
      <p style={{ fontFamily: "var(--font-display)", fontSize: vw(20), fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.02em", width: "100%" }}>
        {title}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: vw(16), fontWeight: 400, lineHeight: 1.3, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.80)", width: bodyWidth ? vw(bodyWidth) : "100%" }}>
        {body}
      </p>
    </div>
  );
}

function MobileCircle({ num }: { num: number }): React.ReactElement {
  return (
    <div
      style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(154,81,255,0.25) 0%, rgba(44,193,235,0.25) 100%)",
        border: "1px solid rgba(154,81,255,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700,
          background: "linear-gradient(128.67deg, #9A51FF 35.82%, #2CC1EB 78.3%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}
      >
        {num}
      </span>
    </div>
  );
}
