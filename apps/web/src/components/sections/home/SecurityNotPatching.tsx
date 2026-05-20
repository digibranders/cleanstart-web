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
      className="relative w-full overflow-hidden bg-[#F6F6F6] py-32"
      aria-labelledby="security-title"
    >
      <div className="relative mx-auto w-full max-w-[1276px] px-6">
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

        {/* Title row — title left, vertical separator, description right */}
        <div className="flex flex-col items-start gap-6 md:flex-row md:gap-12">
          <h2
            id="security-title"
            className="font-display text-display-md font-bold leading-none tracking-[-0.05em] text-[#111111]"
            style={{ maxWidth: "444px" }}
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
            className="hidden h-[90px] w-px shrink-0 md:mt-3 md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(217,217,217,1) 47.2%, rgba(217,217,217,0) 100%)",
            }}
          />
          <p
            className="text-[clamp(1rem,2vw,1.875rem)] font-normal leading-[1.4] tracking-[-0.04em] text-[#111111] md:mt-3"
            style={{ maxWidth: "576px" }}
          >
            Recognized for innovation in secure software supply chain and
            hardened container images.
          </p>
        </div>

        {/* Cards grid + kubr mascot */}
        <div className="relative mt-16 grid grid-cols-1 gap-8 md:mt-[100px] md:grid-cols-2">
          <SecurityCard kind="public" features={PUBLIC_IMAGES} />
          <SecurityCard kind="cleanstart" features={CLEANSTART_FEATURES} />

          {/* Kubr — tail BEHIND left card, body IN FRONT */}
          <KubrMascot />
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
      className="relative"
      style={{
        borderRadius: 40,
        background: "#2CC1EB", // outer cyan border (visible 10px around inner)
        padding: 10,
        zIndex: 10, // above kubr tail layer (z=1) so tail goes behind the card
      }}
    >
      <div
        className="relative overflow-hidden"
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
          className="relative flex h-[130px] w-full items-center justify-center gap-3 overflow-hidden"
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
              className="pointer-events-none absolute"
              style={{
                right: "-37px",
                top: "-13px",
                width: "162px",
                height: "186.4px",
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
                opacity: 0.34,
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
          <div className="relative z-10 flex w-full items-center gap-3 pl-[188px]">
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
                <span className="font-display text-[2rem] font-bold leading-none tracking-[-0.05em] text-white">
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

        {/* White content area — Figma inner body rect 108:7965/108:7903 is 441px tall. */}
        <div className="relative h-[441px] overflow-hidden bg-white">
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
          <ul className="relative z-10 mx-auto flex h-full max-w-[320px] flex-col justify-center gap-[40px]">
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
                  className="text-[1.375rem] tracking-[-0.01em] text-[#333333]"
                  style={{ fontWeight: isPublic ? 600 : 700 }}
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

/** Kubr mascot — Figma node 108:7953 (290×299 at section-relative 525, 520).
 *  Live plugin coords: bird straddles the gap between cards — its left edge
 *  (x=525) sits 97px inside the LEFT card (left card right edge = x=622),
 *  so ~33.4% of the bird's width overlaps the left card. Per Figma's
 *  z-order, Kubr is drawn after both card outers but before the left
 *  card's white content — i.e. tail behind left card, body in front of
 *  the right card. We mirror that with a two-layer z-split + 33→36%
 *  mask blend: leftmost 33% at z=1 (behind cards), the rest at z=30
 *  (above cards). Bottom is -15px so the bird's feet hang ~15px below
 *  the cards' bottom edge (matches Figma section-bottom flush). */
function KubrMascot() {
  const KUBR_W = 290;
  const KUBR_H = 299;
  // Section-relative left edge: 525 / 1276 ≈ 41.14%
  const KUBR_LEFT = "41.14%";
  const KUBR_BOTTOM = "-15px";

  return (
    <>
      {/* Tail layer — z=1, behind cards. Only the leftmost ~33% of the bird
          renders here so the LEFT card's white body + border occludes the
          wing/tail tucked behind it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: KUBR_LEFT,
          bottom: KUBR_BOTTOM,
          width: KUBR_W,
          height: KUBR_H,
          zIndex: 1,
          WebkitMaskImage:
            "linear-gradient(90deg, #000 0%, #000 33%, transparent 36%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, #000 0%, #000 33%, transparent 36%, transparent 100%)",
        }}
      >
        <Image
          src="/images/kubr-bird.png"
          alt=""
          width={KUBR_W}
          height={KUBR_H}
          sizes="290px"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Body + head layer — z=30, above cards. The leftmost ~33% is masked
          OUT (drawn by the tail layer behind the cards instead). */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: KUBR_LEFT,
          bottom: KUBR_BOTTOM,
          width: KUBR_W,
          height: KUBR_H,
          zIndex: 30,
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, transparent 33%, #000 36%, #000 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, transparent 33%, #000 36%, #000 100%)",
        }}
      >
        <Image
          src="/images/kubr-bird.png"
          alt="Kubr mascot"
          width={KUBR_W}
          height={KUBR_H}
          sizes="290px"
          className="h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(60,40,180,0.30)]"
        />
      </div>
    </>
  );
}
