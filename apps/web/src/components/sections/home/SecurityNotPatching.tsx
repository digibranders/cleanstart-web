import Image from "next/image";

/**
 * Section: "Security isn't just patching"
 * Figma group 108:7892 (1276×819 at y=2329)
 *
 * Layout:
 *  - Title (444×124, Manrope Bold 62px) with "patching" in cyan→purple gradient
 *  - Vertical 1×90 gradient separator between title and description
 *  - Description (576×84, Regular 26px line 150% color #111 @ 80% opacity)
 *  - Two cards (622×600 outer · cyan border, 622×~441 inner white)
 *  - Kubr mascot at the gap between cards (tail BEHIND left card via z-index)
 *
 * Each card:
 *  - Outer rect — corner-radius 40, fill #2CC1EB (becomes 10px cyan border)
 *  - Header (top ~140px): linear gradient #151021 → #131E8F (62.5%) → #471EC0
 *    + Public Images: cube SVG + "Public Images" text
 *    + CleanStart: cleanstart wordmark logo SVG
 *    + Soft cyan glow at bottom (Figma 光斑 flare effect)
 *  - White inner content (corner-radius 32) with:
 *    + Decorative purple/cyan radial blobs at low opacity (Figma Ellipse 46681/46682)
 *    + 5-row bullet list:
 *       Public Images → snowflake icon (gray)        + Sora SemiBold 22px label
 *       CleanStart    → sparkle icon (cyan→purple)   + Sora Bold 22px label
 */

const PUBLIC_IMAGES = [
  "Patch after image creation",
  "Public base images",
  "Large attack surface",
  "Scanner-driven security",
  "Non-deterministic builds",
];

const CLEANSTART_FEATURES = [
  "Built from verified source",
  "Controlled packages",
  "Minimal components",
  "Secure by design",
  "Reproducible builds",
];

export function SecurityNotPatching() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#F6F6F6] py-section-md"
      aria-labelledby="security-title"
    >
      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Background decorations — positioned in the 1276-wide Figma section
             coordinate space. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 h-[819px]"
        >
          {/* Bottom-left grid — Figma 108:7628 (1101×1101 square-grid vector
              at section-rel (-707, 401), opacity 0.10 baked into the SVG,
              purple #640DFB radial gradient). The bbox extends mostly LEFT
              and BELOW the section bounds — only the upper-right quadrant
              peeks in, which is what produces the "faint vertical lines on
              the left edge of the section" reading in Figma. We render the
              real SVG at the exact Figma bbox so the visible portion matches
              one-for-one. */}
          <Image
            src="/images/security/bg-grid-bottom-left.svg"
            alt=""
            width={1101}
            height={1101}
            sizes="1101px"
            className="pointer-events-none absolute"
            style={{
              left: "-707px",
              top: "401px",
              width: "1101px",
              height: "1101px",
            }}
          />
          {/* Top-right hex cube — Figma 108:7629 (white + cyan→purple linear
              gradient, opacity 0.12 baked in the SVG group). Rendered at the
              fresh export's natural 374×332 size at section-rel (1086, 0); the
              right portion extends past the section edge (clipped by section
              overflow-hidden). */}
          <Image
            src="/images/security/bg-cube-top-right.svg"
            alt=""
            width={374}
            height={332}
            sizes="374px"
            className="pointer-events-none absolute"
            style={{
              left: "1086px",
              top: "0px",
              width: "374px",
              height: "332px",
            }}
          />
        </div>

        {/* Title row — heading flush-left, separator dead-center, description flush-right */}
        <div className="flex flex-col items-start gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <h2
            id="security-title"
            className="justify-self-start font-display font-bold text-[#111111]"
            style={{
              maxWidth: "444px",
              fontSize: "var(--text-t-display-2)",
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
            }}
          >
            Security isn&rsquo;t just{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(95deg, #9A50FF 0%, #2CC1EB 100%)",
              }}
            >
              patching
            </span>
          </h2>
          {/* 1×90 vertical fading-gray separator (Figma Rectangle 1000001787 #D9D9D9) */}
          <div
            aria-hidden
            className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(217,217,217,1) 47.2%, rgba(217,217,217,0) 100%)",
            }}
          />
          <p
            className="font-normal text-[#111111] md:justify-self-end md:text-right"
            style={{
              fontSize: "var(--text-t-subhead)",
              lineHeight: "var(--text-t-subhead-lh)",
              letterSpacing: "var(--text-t-subhead-ls)",
              maxWidth: "541px",
              opacity: 0.8,
            }}
          >
            Recognized for innovation in secure software supply chain and
            hardened container images.
          </p>
        </div>

        {/* Cards row + VS badge centerpiece.
            Flex with a small gap keeps the two cards visually coupled with
            the VS badge bridging them; `justify-center` keeps the pair centered
            in the section's content area with symmetric breathing room. */}
        <div className="relative mt-16 flex flex-col items-center gap-6 md:mt-[80px] md:flex-row md:justify-center md:gap-10">
          <SecurityCard kind="public" features={PUBLIC_IMAGES} />
          <SecurityCard kind="cleanstart" features={CLEANSTART_FEATURES} />

          {/* VS badge — centered between the two cards, above both */}
          <VsBadge />
        </div>
      </div>
    </section>
  );
}

interface SecurityCardProps {
  kind: "public" | "cleanstart";
  features: string[];
}

function SecurityCard({ kind, features }: SecurityCardProps) {
  const isPublic = kind === "public";

  return (
    <div
      className="relative flex h-full w-full flex-col lg:max-w-[500px]"
      style={{
        // Figma 1440: outer card 622×600, cyan border 10 px, radius 40
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
        {/* Header section — dark gradient + decorative watermark + logo + cyan glow.
             Figma stacks 4 layers in each card header (108:7955-7958 / 108:7897-7900):
               1. white base rect
               2. linear gradient #151021 → #131E8F (62.5%) → #471EC0, vertical, on 602×571
               3. "image 121" texture at blendMode SATURATION
               4. "Gradient" 1028×1028 image — IDENTICAL source on both cards, but
                  LEFT card has the saturation FILTER set to -1 (full grayscale)
                  while RIGHT card has it at 0 (full color)
             That single difference is what makes the LEFT header read as
             near-black while the RIGHT reads as vivid purple. We approximate
             the visible outcome with two distinct CSS gradients tuned to the
             eyeball colors of the rendered Figma textures. */}
        <div
          className="relative flex h-[clamp(76px,7vw,100px)] w-full items-center justify-center gap-3 overflow-hidden"
          style={{
            background: isPublic
              ? // LEFT (Public Images) — desaturated texture overlay → reads black
              "linear-gradient(135deg, #151021 0%, #1A1733 60%, #221A3D 100%)"
              : // RIGHT (CleanStart) — full-color texture overlay → reads vivid purple
              "linear-gradient(135deg, #1B0E33 0%, #2B1456 40%, #471EC0 100%)",
          }}
        >
          {/* Decorative right-side watermark (Figma 34% white SOFT_LIGHT)
              Public Images → cube watermark · CleanStart → chevron watermark */}
          {isPublic ? (
            // Public Images cube watermark — Figma 108:7960 (group of 4 vectors:
            // grey #868686 outline + 3 white SOFT_LIGHT@34% inner faces).
            // Section-rel (497, 191), 162×186.4 → extends 37px past card right edge
            // and 13px above card top (both clipped by header overflow-hidden).
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
            // CleanStart chevron watermark — Figma 108:7902 (single Vector, white
            // fill, opacity 0.34, blendMode SOFT_LIGHT). Section-rel (1138, 202),
            // 258×236 → extends 120px past card right edge and 2px above card top.
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

          {/* Cyan light flare at the bottom (Figma 光斑 flare 631×177)
              The cyan glow that appears just below the heading text */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px]"
            style={{
              background:
                "radial-gradient(60% 140% at 50% 100%, rgba(44,193,235,0.65) 0%, rgba(44,193,235,0.25) 35%, rgba(44,193,235,0) 70%)",
              filter: "blur(6px)",
            }}
          />

          {/* Header content (z-10 above decorative layers).
              Per live Figma: Public Images icon+text frame (108:7991) sits at
              section-rel x=198 / y=258, and CleanStart logo (108:7934) sits at
              section-rel x=852 / y=258 — both 198px from their card outer left,
              i.e. 188px from the inner header's left after the 10px cyan border. */}
          <div className="relative z-10 flex w-full items-center justify-center gap-3">
            {isPublic ? (
              <>
                <Image
                  src="/images/security/cube-icon.svg"
                  alt=""
                  width={41}
                  height={48}
                  sizes="41px"
                  className="h-[47px] w-[41px]"
                />
                <span
                  className="font-display font-bold text-white"
                  style={{
                    fontSize: "var(--text-t-heading-lg)",
                    lineHeight: "var(--text-t-heading-lg-lh)",
                    letterSpacing: "var(--text-t-heading-lg-ls)",
                  }}
                >
                  Public Images
                </span>
              </>
            ) : (
              <Image
                src="/images/security/cleanstart-logo.svg"
                alt="CleanStart"
                width={227}
                height={47}
                sizes="227px"
                className="h-[47px] w-auto"
                priority={false}
              />
            )}
          </div>
        </div>

        {/* White content area — Figma inner body rect 108:7965/108:7903 is 441px tall.
            `flex-1` lets this area absorb the grid-row's stretched height so both
            cards' visible bottoms stay aligned regardless of which card's text
            wraps to two lines at any given viewport. */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white py-[clamp(24px,2.5vw,36px)]" style={{ minHeight: "clamp(260px, 22vw, 340px)" }}>
          {/* Decorative blobs (Figma Ellipse 46681 #DF9BFF + 46682 #2CC1EB) */}
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
              opacity: 0.10,
              filter: "blur(60px)",
            }}
          />

          {/* Bullet list — Figma bullets are 31px-tall rows with 71px top-to-top
              spacing → 40px gap between rows (same for both cards). */}
          <ul className="relative z-10 mx-auto flex h-full max-w-[400px] flex-col justify-center gap-[clamp(20px,2.5vw,36px)]">
            {features.map((label) => (
              <li key={label} className="flex items-center gap-6">
                {isPublic ? (
                  <Image
                    src="/images/security/snowflake.svg"
                    alt=""
                    width={24}
                    height={24}
                    sizes="24px"
                    className="h-6 w-6 shrink-0"
                  />
                ) : (
                  <Image
                    src="/images/security/sparkle.svg"
                    alt=""
                    width={31}
                    height={27}
                    sizes="31px"
                    className="h-[27px] w-[31px] shrink-0"
                  />
                )}
                <span
                  className="font-display text-[#333333]"
                  style={{
                    fontSize: "var(--text-t-heading-sm)",
                    fontWeight: 600,
                    lineHeight: "var(--text-t-heading-sm-lh)",
                    letterSpacing: "var(--text-t-heading-sm-ls)",
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

/** VS badge — glossy 3D "VS" letterform (252 × 252 source asset) centered
 *  in the gap between the Public Images and CleanStart comparison cards.
 *  Replaces the previous Kubr mascot per the Figma 1440 home design.
 *  Hidden below `md` since the cards stack vertically and the gap
 *  disappears. Centered horizontally via left:50% + translateX(-50%);
 *  vertically centered between card rows via top:50% + translateY(-50%).
 *  z-30 keeps it above both cards. */
function VsBadge() {
  // Smaller on mobile where the badge sits in the narrow gap between the
  // vertically stacked cards; full size on tablet/desktop where it bridges
  // the two side-by-side cards.
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
        src="/images/security/vs-badge.png"
        alt=""
        width={252}
        height={252}
        sizes="200px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
