import Image from "next/image";

/**
 * Figma frame 516:5324 — 1920 × 926 "Generate. Verify. Validate."
 *
 * Dark navy → purple section. Centred heading + subhead at the top, an 872 × 468
 * 3D isometric-platforms render in the middle (PNG), and four numbered tiles
 * with caption labels around it:
 *   ┌───────┐    ┌───────┐
 *   │ Generate│  │ Verify  │   ← top labels (y=394), big circles ø82 (top)
 *   └───────┘    └───────┘
 *        ╲ ╱  Σ  ╲ ╱
 *        ╳         ╳            ← 3D platforms artwork (centred image)
 *        ╱ ╲     ╱ ╲
 *   ┌───────┐    ┌───────┐
 *   │  Track  │  │Validate │   ← bottom labels (y=716/728), small circles ø76
 *   └───────┘    └───────┘
 *
 * Desktop uses absolute positioning from Figma coords, fluid-scaled with
 * `clamp(min, vw, max)` per the v3 consistency layer. Mobile collapses to a
 * stacked layout: heading → subhead → image → 2×2 captioned tiles.
 *
 * Figma coords (1920 × 926 frame):
 *   Heading       x=599  y=80   w=753  (h2-w=593)
 *   Platforms     x=525  y=378  w=872  h=468  (centred)
 *   Generate lbl  x=503  y=394  w=256  body width 266
 *   Verify   lbl  x=1153 y=394  w=256  body width 218
 *   Track    lbl  x=431  y=716  w=256
 *   Validate lbl  x=1234 y=728  w=256
 *   Circle 1 ø82  x=768  y=459  (top-left big)
 *   Circle 2 ø82  x=1076 y=457  (top-right big)
 *   Circle 3 ø76  x=698  y=567  (bottom-left small)
 *   Circle 4 ø76  x=1148 y=569  (bottom-right small)
 */

// Fluid scaler — projects a 1920-canvas px value to vw on viewports < 1920px.
const vw = (n: number): string => `${(n / 1920) * 100}vw`;

export function SbomSelfUpdating(): React.ReactElement {
  return (
    <section
      data-section="SbomSelfUpdating"
      className="relative overflow-hidden w-full"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)",
        minHeight: `clamp(560px, ${vw(926)}, ${vw(926)})`,
      }}
    >
      {/* Decorative purple blobs */}
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

      {/* Corner glyph */}
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

      {/* ═════════════ DESKTOP (lg+) ═════════════ */}

      {/* Heading block */}
      <div
        className="hidden lg:flex absolute flex-col items-center text-center"
        style={{ left: vw(599), top: vw(80), width: vw(753), gap: vw(24) }}
      >
        <h2
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.1,
            width: vw(593),
          }}
        >
          Generate. Verify. Validate.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(15px, 1.35vw, 26px)",
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.88)",
            width: "100%",
          }}
        >
          Automated SBOM generation with cryptographic signing and continuous
          validation across build and runtime environments.
        </p>
      </div>

      {/* 3D platforms artwork (centred) */}
      <div
        className="hidden lg:block absolute"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          top: vw(378),
          width: vw(872),
          height: vw(468),
        }}
      >
        <Image
          src="/images/sbom/platforms-3d.png"
          alt="Generate, Verify, Track, Validate — four-step SBOM lifecycle"
          width={872}
          height={468}
          sizes="(min-width: 1280px) 872px, 100vw"
          className="w-full h-full object-contain"
          style={{ display: "block" }}
          loading="lazy"
        />
      </div>

      {/* Numbered circles */}
      <FigmaCircle size={82} x={768}  y={459} glowSize={63.778} glowOffset={9}    num={1} numGradient="linear-gradient(128.05deg, #9A51FF 35.82%, #2CC1EB 78.3%)" />
      <FigmaCircle size={82} x={1076} y={457} glowSize={63.778} glowOffset={9}    num={2} numGradient="linear-gradient(136.97deg, #9A51FF 35.82%, #2CC1EB 78.3%)" />
      <FigmaCircle size={76} x={698}  y={567} glowSize={59.111} glowOffset={8.34} num={3} numGradient="linear-gradient(121.14deg, #9A51FF 35.82%, #2CC1EB 78.3%)" small />
      <FigmaCircle size={76} x={1148} y={569} glowSize={59.111} glowOffset={8.34} num={4} numGradient="linear-gradient(121.14deg, #9A51FF 35.82%, #2CC1EB 78.3%)" small />

      {/* Captions */}
      <FeatureLabel x={503}  y={394} title="Generate" body="Continuously create software inventories across environments." bodyWidth={266} />
      <FeatureLabel x={1153} y={394} title="Verify"   body="Cryptographically validate software provenance." bodyWidth={218} />
      <FeatureLabel x={431}  y={716} title="Track"    body="Monitor dependencies and component changes over time." />
      <FeatureLabel x={1234} y={728} title="Validate" body="Continuously assess inventory accuracy and integrity." />

      {/* ═════════════ MOBILE (< lg) ═════════════ */}
      <div className="lg:hidden mx-auto max-w-[1276px] px-6 py-section-md flex flex-col items-center text-center gap-8">
        <h2
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 8vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.1,
          }}
        >
          Generate. Verify. Validate.
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
          Automated SBOM generation with cryptographic signing and continuous
          validation across build and runtime environments.
        </p>
        <Image
          src="/images/sbom/platforms-3d.png"
          alt="Generate, Verify, Track, Validate — four-step SBOM lifecycle"
          width={872}
          height={468}
          sizes="(min-width: 768px) 672px, 100vw"
          className="w-full max-w-2xl h-auto object-contain"
          loading="lazy"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl text-left">
          {MOBILE_FEATURES.map((f) => (
            <div key={f.num} className="flex flex-col items-start gap-3">
              <MobileCircle num={f.num} />
              <p className="text-card-title-md text-white" style={{ fontFamily: "var(--font-display)" }}>
                {f.title}
              </p>
              <p className="text-body-md" style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.75)" }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── data ─────────────────────────────────────────────────────────── */

const MOBILE_FEATURES = [
  { num: 1, title: "Generate", body: "Continuously create software inventories across environments." },
  { num: 2, title: "Verify",   body: "Cryptographically validate software provenance." },
  { num: 3, title: "Track",    body: "Monitor dependencies and component changes over time." },
  { num: 4, title: "Validate", body: "Continuously assess inventory accuracy and integrity." },
];

/* ── sub-components ───────────────────────────────────────────────── */

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgAsset}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={glowAsset}
        alt=""
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: vw(glowOffset),
          top: vw(glowOffset),
          width: vw(glowSize),
          height: vw(glowSize),
        }}
        loading="lazy"
        decoding="async"
      />
      <span
        className="relative"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(22px, 2.29vw, 44px)",
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

type FeatureLabelProps = {
  x: number;
  y: number;
  title: string;
  body: string;
  bodyWidth?: number;
};

function FeatureLabel({ x, y, title, body, bodyWidth }: FeatureLabelProps): React.ReactElement {
  return (
    <div
      className="hidden lg:flex absolute flex-col items-center text-center text-white"
      style={{ left: vw(x), top: vw(y), width: vw(256), gap: vw(8) }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(14px, 1.04vw, 20px)",
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
          width: "100%",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(12px, 0.83vw, 16px)",
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.80)",
          width: bodyWidth ? vw(bodyWidth) : "100%",
        }}
      >
        {body}
      </p>
    </div>
  );
}

function MobileCircle({ num }: { num: number }): React.ReactElement {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(154,81,255,0.25) 0%, rgba(44,193,235,0.25) 100%)",
        border: "1px solid rgba(154,81,255,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 700,
          background: "linear-gradient(128.05deg, #9A51FF 35.82%, #2CC1EB 78.3%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {num}
      </span>
    </div>
  );
}
