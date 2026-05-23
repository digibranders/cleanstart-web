import Image from "next/image";

/**
 * Section: "From Visibility to Actionable Risk Reduction"
 * Figma node 583:2481
 *
 * Visual style and layout mirror SecurityNotPatching (Home page) and
 * CleanSightComparison (CleanSight page):
 *  - Cards: outer radius 40, cyan #2CC1EB border via padding 10, inner radius 32
 *  - Header: clamp(76px, 7vw, 100px) tall, linear dark→purple gradient (variant
 *    per card), cyan flare at bottom, soft-light watermark behind title
 *  - White body: flex-1, items vertically centered, two soft radial blobs
 *  - VS badge centered between the two cards on md+
 *
 * Content preserved from the original CISO comparison:
 *  - Titles "Traditional Security Operations" / "CleanStart + CleanSight"
 *  - 4-item lists with comp-icon-gear.svg / comp-icon-check.svg
 *  - comp-vs-badge.png centerpiece
 */

const TRADITIONAL = [
  "Excessive vulnerability findings",
  "Large dependency trees",
  "Continuous remediation backlogs",
  "Limited remediation prioritization",
];

const CLEANSIGHT = [
  "Cleaner software foundations",
  "Contextualized risk insights",
  "Focused remediation priorities",
  "Reduced operational overhead",
];

export function CisoComparison(): React.ReactElement {
  return (
    <section
      data-section="CisoComparison"
      className="relative w-full overflow-hidden bg-white py-section-md"
      aria-labelledby="ciso-comparison-title"
    >
      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading — centred */}
        <div className="text-center">
          <h2
            id="ciso-comparison-title"
            className="mx-auto font-display text-[#111111]"
            style={{
              maxWidth: "min(737px, 100%)",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            From Visibility to Actionable{" "}
            <span className="cs-text-gradient-impact">Risk Reduction</span>
          </h2>
        </div>

        {/* Vertical fading-gray separator (decorative, md+) */}
        <div
          aria-hidden
          className="mx-auto mt-6 hidden h-[90px] w-px md:block"
          style={{
            background:
              "linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(217,217,217,1) 47.2%, rgba(217,217,217,0) 100%)",
          }}
        />

        {/* Cards row + VS badge centerpiece. Mirrors SecurityNotPatching /
            CleanSightComparison's responsive-flex layout exactly. */}
        <div className="relative mt-12 flex flex-col items-center gap-6 md:mt-[60px] md:flex-row md:justify-center md:gap-10">
          <ComparisonCard kind="traditional" features={TRADITIONAL} />
          <ComparisonCard kind="cleansight" features={CLEANSIGHT} />

          {/* VS badge — centered between the two cards, above both */}
          <VsBadge />
        </div>
      </div>
    </section>
  );
}

interface ComparisonCardProps {
  kind: "traditional" | "cleansight";
  features: string[];
}

function ComparisonCard({ kind, features }: ComparisonCardProps) {
  const isTraditional = kind === "traditional";

  return (
    <div
      className="relative flex h-full w-full flex-col lg:max-w-[500px]"
      style={{
        // SecurityNotPatching match: outer radius 40, cyan border via padding 10
        borderRadius: 40,
        background: "#2CC1EB",
        padding: 10,
        zIndex: 10,
      }}
    >
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ borderRadius: 32 }}
      >
        {/* Header — clamp height, dark→purple gradient with cyan flare at bottom.
            Traditional reads near-black; CleanStart + CleanSight reads vivid purple. */}
        <div
          className="relative flex h-[clamp(76px,7vw,100px)] w-full items-center justify-center overflow-hidden"
          style={{
            background: isTraditional
              ? "linear-gradient(135deg, #151021 0%, #1A1733 60%, #221A3D 100%)"
              : "linear-gradient(135deg, #1B0E33 0%, #2B1456 40%, #471EC0 100%)",
          }}
        >
          {/* Decorative right-side watermark (Figma 34% white SOFT_LIGHT) —
              cube on the Traditional card, chevron on the CleanStart card.
              Same assets and treatment used by SecurityNotPatching. */}
          {isTraditional ? (
            <Image
              aria-hidden
              src="/images/security/header-cube.svg"
              alt=""
              width={162}
              height={186}
              sizes="162px"
              className="pointer-events-none absolute mix-blend-soft-light"
              style={{
                right: "-37px",
                top: "-13px",
                width: "162px",
                height: "186.4px",
                opacity: 0.7,
              }}
            />
          ) : (
            <Image
              aria-hidden
              src="/images/security/header-chevron.svg"
              alt=""
              width={258}
              height={236}
              sizes="258px"
              className="pointer-events-none absolute mix-blend-soft-light"
              style={{
                right: "-120px",
                top: "-2px",
                width: "258px",
                height: "236px",
                opacity: 0.7,
              }}
            />
          )}

          {/* Cyan light flare at the bottom (same as SecurityNotPatching) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px]"
            style={{
              background:
                "radial-gradient(60% 140% at 50% 100%, rgba(44,193,235,0.65) 0%, rgba(44,193,235,0.25) 35%, rgba(44,193,235,0) 70%)",
              filter: "blur(6px)",
            }}
          />

          {/* Title */}
          <h3
            className="relative z-10 text-center font-display text-white"
            style={{
              fontSize: "clamp(22px, 2.4vw, 32px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              padding: "0 16px",
            }}
          >
            {isTraditional
              ? "Traditional Security Operations"
              : "CleanStart + CleanSight"}
          </h3>
        </div>

        {/* White content area — flex-1 with min-height (mirrors SecurityNotPatching) */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden bg-white py-[clamp(24px,2.5vw,36px)]"
          style={{ minHeight: "clamp(260px, 22vw, 340px)" }}
        >
          {/* Decorative blobs — purple bottom-right + cyan top-left */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              right: -40,
              bottom: -50,
              width: 262,
              height: 262,
              borderRadius: "50%",
              background: "#DF9BFF",
              opacity: 0.18,
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: -100,
              top: 30,
              width: 364,
              height: 364,
              borderRadius: "50%",
              background: "#2CC1EB",
              opacity: 0.1,
              filter: "blur(60px)",
            }}
          />

          {/* Bullet list — vertically centered, max-w-[400px] (same as SecurityNotPatching) */}
          <ul className="relative z-10 mx-auto flex h-full max-w-[400px] flex-col justify-center gap-[clamp(20px,2.5vw,36px)]">
            {features.map((label) => (
              <li key={label} className="flex items-center gap-6">
                <Image
                  src={
                    isTraditional
                      ? "/images/ciso/comp-icon-gear.svg"
                      : "/images/ciso/comp-icon-check.svg"
                  }
                  alt=""
                  width={24}
                  height={24}
                  sizes="24px"
                  className="h-6 w-6 shrink-0"
                />
                <span
                  className="text-[#333333]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(15px, 1.4vw, 20px)",
                    fontWeight: isTraditional ? 500 : 600,
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** VS badge — glossy 3D "VS" letterform, centered absolutely in the gap
 *  between the two cards (matches SecurityNotPatching / CleanSightComparison). */
function VsBadge() {
  const SIZE = "clamp(72px, 11vw, 160px)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: SIZE,
        aspectRatio: "1 / 1",
        zIndex: 30,
      }}
    >
      <Image
        src="/images/ciso/comp-vs-badge.png"
        alt=""
        width={252}
        height={252}
        sizes="200px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
