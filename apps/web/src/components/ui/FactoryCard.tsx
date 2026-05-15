import Image from "next/image";

export interface FactoryCardProps {
  title: string;
  description: string;
}

export function FactoryCard({ title, description }: FactoryCardProps) {
  return (
    <div className="cs-factory-card relative h-[374px] w-full overflow-hidden rounded-[24px]">
      {/* Layer 1 — purple ellipse (upper-left accent, like Figma Ellipse 46683 #5D04D7) */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "-141px",
          top: "-168px",
          width: "344px",
          height: "406px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, #5D04D7 0%, rgba(93,4,215,0.85) 35%, rgba(93,4,215,0) 70%)",
          filter: "blur(14px)",
        }}
      />

      {/* Layer 2 — cyan ellipse (large, dominant, like Figma Ellipse 46684 #04C7F2) */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "-136px",
          top: "-22px",
          width: "552px",
          height: "652px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, #04C7F2 0%, rgba(4,199,242,0.78) 50%, rgba(4,199,242,0) 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Layer 3 — bottom-edge dark glow to anchor card (linear gradient 151021 → 131E8F → 551ECE base) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(225deg, rgba(85,30,206,0) 0%, rgba(19,30,143,0.45) 60%, rgba(21,16,33,0.85) 100%)",
        }}
      />

      {/* Layer 4 — lavender top-right highlight (DAB6F3 radial, mimicking the COLOR_DODGE flare) */}
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

      {/* Inner stroke (Figma 3px lavender radial stroke, INSIDE alignment) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{
          boxShadow: "inset 0 0 0 1.5px rgba(218,182,243,0.35)",
        }}
      />

      {/* Orb icon — Figma "Point" rect at x=6.6, y=19, 220×164 */}
      <div className="pointer-events-none absolute left-[6px] top-[19px] flex h-[164px] w-[220px] items-center justify-center">
        <Image
          src="/images/factory-orb.png"
          alt=""
          width={168}
          height={164}
          priority
          className="h-[164px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(20,15,60,0.55)]"
        />
      </div>

      {/* Text frame — y=184, w=169, gap=12 between title and description */}
      <div className="absolute left-1/2 top-[184px] flex w-[169px] -translate-x-1/2 flex-col items-center gap-3 text-center">
        <h3 className="font-display text-[2.0625rem] font-medium leading-none tracking-[-0.05em] text-white">
          {renderTitle(title)}
        </h3>
        <p className="text-lg font-normal leading-[1.1] tracking-[-0.04em] text-white">
          {description}
        </p>
      </div>

      {/* Arrow circle — y=322, 28×28, white 1.75px stroke */}
      <button
        type="button"
        aria-label={`Learn more about ${title}`}
        className="absolute left-1/2 top-[322px] flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-[1.75px] border-white/95 text-white transition hover:bg-white/10"
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
