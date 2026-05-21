/**
 * The CleanStart Approach — Figma Group 2085665007 (366:5492).
 *
 * 2×2 grid of cells with a 3D illustration on the left and title + description
 * on the right. Hairline cross-dividers (horizontal + vertical) split the grid
 * into four cells. Each cell has a soft purple radial glow behind the icon.
 *
 * Source-of-truth specs:
 *  - Cell title:   Figtree Bold 32px, -5% tracking, color #111111
 *  - Cell desc:    Figtree Regular 22px, line-height 140%, color #333333
 *  - Icon image:   296×220 with a 165×165 #DF9BFF blur(43px) opacity-0.35 halo
 *  - Cell gap:     left column = 32px, right column = 16px (per Figma cells)
 */
export function AsrApproach(): React.ReactElement {
  const items: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      icon: "/images/attack-surface-reduction/approach-minimal.png",
      title: "Minimal Foundations",
      description: "Only required runtime components",
    },
    {
      icon: "/images/attack-surface-reduction/approach-bloat.png",
      title: "Bloat Removed",
      description: "No shells or unused tooling.",
    },
    {
      icon: "/images/attack-surface-reduction/approach-deterministic.png",
      title: "Deterministic Builds",
      description: "Reproducible and verifiable.",
    },
    {
      icon: "/images/attack-surface-reduction/approach-secure.png",
      title: "Secure Defaults",
      description: "Hardened by default.",
    },
  ];

  return (
    <section
      data-section="AsrApproach"
      className="relative overflow-hidden"
    >
      {/* Heading — centered, "Approach" gradient */}
      <div className="relative mx-auto max-w-[1276px] px-6 pt-section-md text-center">
        <h2
          className="text-[#111111] inline-block"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            marginBottom: "56px",
          }}
        >
          The CleanStart{" "}
          <span
            style={{
              background: "linear-gradient(99deg, #9A51FF 0%, #2CC1EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Approach
          </span>
        </h2>
      </div>

      {/* Desktop 2×2 grid with cross dividers */}
      <div className="hidden md:block relative mx-auto max-w-[1276px] px-6 pb-section-md">
        <div className="relative">
          {/* Horizontal hairline */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: "24px",
              right: "24px",
              top: "50%",
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)",
            }}
          />
          {/* Vertical hairline */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "0",
              bottom: "0",
              width: "1px",
              background:
                "linear-gradient(180deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)",
            }}
          />

          <div className="grid grid-cols-2">
            {items.map((item, idx) => (
              <ApproachCell
                key={item.title}
                item={item}
                padLeft={idx % 2 === 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile stacked — per Figma 366:6432 (centred icon over title + body
          inside a white rounded card; vertical 1-col stack). */}
      <div className="md:hidden relative mx-auto px-5 pb-12 flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="relative flex flex-col items-center text-center gap-3 rounded-[24px] bg-white px-6 py-8"
            style={{
              boxShadow:
                "0px 2px 4px rgba(22,34,51,0.04), 0px 8px 16px rgba(22,34,51,0.05)",
            }}
          >
            <div className="relative" style={{ width: "120px", height: "120px" }}>
              <div
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  background: "#DF9BFF",
                  filter: "blur(28px)",
                  opacity: 0.35,
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                aria-hidden
                className="relative pointer-events-none select-none object-contain"
                style={{ width: "120px", height: "120px" }}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p
              className="text-card-title-md text-[#111111]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.1,
              }}
            >
              {item.title}
            </p>
            <p
              className="text-body-md text-[#333333]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                letterSpacing: "-0.05em",
                lineHeight: 1.4,
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface ApproachCellProps {
  item: { icon: string; title: string; description: string };
  padLeft: boolean;
}

function ApproachCell({ item, padLeft }: ApproachCellProps): React.ReactElement {
  return (
    <div
      className="relative flex items-center gap-[clamp(12px,1.5vw,24px)] py-[clamp(32px,4vw,48px)]"
      style={{
        paddingLeft: padLeft ? "clamp(24px,4vw,56px)" : "0",
        paddingRight: padLeft ? "0" : "clamp(24px,4vw,56px)",
      }}
    >
      <div className="relative shrink-0" style={{ width: "clamp(140px, 16vw, 220px)", aspectRatio: "1 / 1" }}>
        {/* Soft purple radial halo behind icon — Figma Ellipse 46681
            165×165 #DF9BFF blur(43px) opacity 0.35 */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "165px",
            height: "165px",
            borderRadius: "50%",
            background: "#DF9BFF",
            filter: "blur(43px)",
            opacity: 0.35,
          }}
        />
        {/* 3D icon — Figma 296×220 cropped, here scaled to fit a 220px box */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.icon}
          alt=""
          aria-hidden
          className="relative pointer-events-none select-none object-contain"
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="flex flex-col gap-[clamp(10px,1.2vw,18px)] flex-1 min-w-0">
        <p
          className="text-card-title-lg text-[#111111]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.0,
            maxWidth: "260px",
          }}
        >
          {item.title}
        </p>
        <p
          className="text-body-lg text-[#333333]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 1.4,
            maxWidth: "290px",
          }}
        >
          {item.description}
        </p>
      </div>
    </div>
  );
}
