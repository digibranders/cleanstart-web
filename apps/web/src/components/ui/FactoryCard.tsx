import Image from "next/image";

export interface FactoryCardProps {
  title: string;
  description: string;
}

export function FactoryCard({ title, description }: FactoryCardProps) {
  return (
    <>
      {/* MOBILE + TABLET (< lg) — horizontal list-row per Figma 403:15244 (orb
          left, title + description middle, arrow right). Stacks vertically all
          the way through tablet; the absolute-positioned desktop variant only
          kicks in at lg+ where the 5-up grid + engine flames can fit. */}
      {/* MOBILE + TABLET (< lg) — Figma 403:15301 exact:
          Card 295×88, radius 18, 2.24 px lavender (#DAB6F3) border, dark→purple
          gradient (top-to-bottom: #151021 → #131E8F at 71.2% → #551ECE).
          Orb 97×72 on the left, title (Manrope Medium 20 / lh 1 / -1 px) +
          desc (Sora Regular 14 / lh 1.1 / -0.98 px / opacity 0.8) middle,
          chevron 28×28 on the right. */}
      <div
        className="relative lg:hidden"
        style={{
          width: "295px",
          height: "88px",
          borderRadius: "18px",
          border: "2.24px solid #DAB6F3",
          background: "#151021",
        }}
      >

        {/* Orb — 97×72 area, blends into the dark gradient via color-dodge.
            Positioned absolutely outside the overflow-hidden wrapper at left: -7px, top: 8px. */}
        <div
          className="absolute mix-blend-color-dodge pointer-events-none"
          style={{
            left: "-7px",
            top: "8px",
            width: "97px",
            height: "72px",
          }}
        >
          <Image
            src="/images/factory-orb.png"
            alt=""
            width={97}
            height={72}
            className="w-full h-full object-contain"
            sizes="97px"
            priority
          />
        </div>

        {/* Title + description — Figma 4 px gap. Centered vertically, offset left 85px, right 64px. */}
        <div
          className="absolute flex flex-col gap-1 justify-center text-white"
          style={{
            left: "85px",
            right: "64px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <h3
            className="font-display font-medium"
            style={{
              fontSize: "var(--fs-h4)",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </h3>
          <p
            className="font-normal"
            style={{
              fontSize: "var(--fs-body-sm)",
              lineHeight: 1.1,
              letterSpacing: "-0.98px",
              opacity: 0.8,
            }}
          >
            {description}
          </p>
        </div>

        {/* Arrow chevron — 28×28 circle outline. Absolute positioned at right: 24px, top: 30px. */}
        <button
          type="button"
          aria-label={`Learn more about ${title}`}
          className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-white/80 text-white transition hover:bg-white/10"
          style={{
            right: "24px",
            top: "30px",
          }}
        >
          <svg width="8" height="11" viewBox="0 0 9 12" fill="none" aria-hidden>
            <path
              d="M2 1L7 6L2 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* DESKTOP (lg+) — Figma 1440 spec (node 763:3610..3742):
          Fixed 374 px height, 24 px corner radius, 3 px lavender (#DAB6F3)
          border. Title and description sized to Figma values (32 / 16). */}
      <div
        className="cs-factory-card relative hidden w-full overflow-hidden rounded-[24px] lg:flex lg:flex-col lg:items-center lg:gap-3 lg:pt-4 lg:pb-4"
        style={{ height: "374px" }}
      >


        {/* Orb icon — Figma 1440 spec: 220 × 164 px (placed top-aligned). */}
        <div className="pointer-events-none relative flex w-full items-center justify-center">
          <Image
            src="/images/factory-orb.png"
            alt=""
            width={168}
            height={164}
            priority
            sizes="168px"
            className="object-contain"
            style={{ height: "164px", width: "auto" }}
          />
        </div>

        {/* Title + description — Figma 1440 exact:
            Title Manrope Regular 32px / lh 1.0 / tracking -1.6px (-0.05em)
            Desc  Sora    Regular 16px / lh 1.1 / tracking -0.64px (-0.04em) / opacity 0.8 */}
        <div className="relative flex w-full flex-col items-center gap-3 px-3 text-center">
          <h3
            className="font-display font-normal text-white"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: "var(--text-t-heading-lg-lh)",
              letterSpacing: "var(--text-t-heading-lg-ls)",
            }}
          >
            {renderTitle(title)}
          </h3>
          <p
            className="font-normal text-white"
            style={{
              fontSize: "var(--fs-body)",
              lineHeight: "var(--text-t-body-md-lh)",
              letterSpacing: "var(--text-t-body-md-ls)",
              opacity: 0.8,
            }}
          >
            {description}
          </p>
        </div>

        {/* Arrow circle — anchored at bottom via mt-auto */}
        <button
          type="button"
          aria-label={`Learn more about ${title}`}
          className="relative mt-auto flex h-7 w-7 items-center justify-center rounded-full border-[1.75px] border-white/95 text-white transition hover:bg-white/10"
        >
          <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden>
            <path
              d="M2 1L7 6L2 11"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
}

// "Clean Images" → renders "Clean" / "Images" on two lines (per Figma height=66 = 2 lines @ 33px)
// "Clean AI Models" → "Clean" / "AI Models" or "Clean AI" / "Models"? Figma shows the latter.
function renderTitle(title: string) {
  // Special case: 3-word titles where word 2 stays with word 1 (e.g. Clean AI Models, Clean Sight)
  const parts = title.split(" ");
  if (parts.length === 1) return <>{title}</>;
  if (parts.length === 2) {
    return (
      <>
        {parts[0]}
        <br />
        {parts[1]}
      </>
    );
  }
  // 3 words → "Word1 Word2" / "Word3"
  return (
    <>
      {parts.slice(0, 2).join(" ")}
      <br />
      {parts.slice(2).join(" ")}
    </>
  );
}
