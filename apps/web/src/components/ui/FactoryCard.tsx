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
      <div className="cs-factory-card relative flex w-full overflow-hidden rounded-[24px] lg:hidden" style={{ minHeight: "84px" }}>
        {/* Cyan + purple gradient bg (simplified for the row layout) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(95deg, #5D04D7 0%, #1B0B6E 45%, #04C7F2 100%)",
            opacity: 0.9,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(218,182,243,0.35)" }}
        />

        <div className="relative flex w-full items-center gap-3 px-3 py-3">
          {/* Orb icon — small */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <Image
              src="/images/factory-orb.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 object-contain drop-shadow-[0_4px_8px_rgba(20,15,60,0.45)]"
              sizes="56px"
            />
          </div>

          {/* Title + description */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3 className="font-display text-base font-semibold leading-tight tracking-[-0.03em] text-white">
              {title}
            </h3>
            <p className="text-sm leading-snug tracking-[-0.03em] text-white/85">
              {description}
            </p>
          </div>

          {/* Arrow chevron */}
          <button
            type="button"
            aria-label={`Learn more about ${title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 text-white"
          >
            <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden>
              <path d="M2 1L7 6L2 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* DESKTOP (lg+) — Figma 1440 spec (node 763:3610..3742):
          Fixed 374 px height, 24 px corner radius, 3 px lavender (#DAB6F3)
          border. Title and description sized to Figma values (32 / 16). */}
      <div
        className="cs-factory-card relative hidden w-full overflow-hidden rounded-[24px] lg:flex lg:flex-col lg:items-center lg:gap-3 lg:pt-4 lg:pb-4"
        style={{ height: "374px" }}
      >
        {/* Layer 1 — purple ellipse (upper-left accent) */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: "-141px",
            top: "-168px",
            width: "344px",
            maxWidth: "calc(100% + 200px)",
            height: "406px",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, #5D04D7 0%, rgba(93,4,215,0.85) 35%, rgba(93,4,215,0) 70%)",
            filter: "blur(14px)",
          }}
        />

        {/* Layer 2 — cyan ellipse (large, dominant) */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: "-136px",
            top: "-22px",
            width: "552px",
            maxWidth: "calc(100% + 200px)",
            height: "652px",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, #04C7F2 0%, rgba(4,199,242,0.78) 50%, rgba(4,199,242,0) 100%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Layer 3 — bottom-edge dark glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(225deg, rgba(85,30,206,0) 0%, rgba(19,30,143,0.45) 60%, rgba(21,16,33,0.85) 100%)",
          }}
        />

        {/* Layer 4 — lavender top-right highlight */}
        <div
          className="pointer-events-none absolute"
          style={{
            right: "-30px",
            top: "-30px",
            width: "200px",
            height: "200px",
            background:
              "radial-gradient(closest-side, rgba(218,182,243,0.55) 0%, rgba(218,182,243,0) 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Inner stroke (1.5px lavender) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[24px]"
          style={{ boxShadow: "inset 0 0 0 1.5px rgba(218,182,243,0.35)" }}
        />

        {/* Orb icon — Figma 1440 spec: 220 × 164 px (placed top-aligned). */}
        <div className="pointer-events-none relative flex w-full items-center justify-center">
          <Image
            src="/images/factory-orb.png"
            alt=""
            width={168}
            height={164}
            priority
            sizes="168px"
            className="object-contain drop-shadow-[0_10px_20px_rgba(20,15,60,0.55)]"
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
              fontSize: "32px",
              lineHeight: 1,
              letterSpacing: "-1.6px",
            }}
          >
            {renderTitle(title)}
          </h3>
          <p
            className="font-normal text-white"
            style={{
              fontSize: "16px",
              lineHeight: 1.1,
              letterSpacing: "-0.64px",
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
