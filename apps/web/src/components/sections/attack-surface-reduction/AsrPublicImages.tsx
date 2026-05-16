export function AsrPublicImages(): React.ReactElement {
  const cards: Array<{ title: string; description: string }> = [
    {
      title: "Inherited Vulnerabilities",
      description: "Risk exist before application code is added",
    },
    {
      title: "Too Many Components",
      description: "Public images include packages most workloads never use.",
    },
    {
      title: "Oversized SBOM's",
      description: "More components to track, justify, and audit.",
    },
    {
      title: "Constant Patching",
      description: "The same base issues reappear release after release.",
    },
  ];

  return (
    <section
      data-section="AsrPublicImages"
      className="relative bg-white overflow-hidden"
    >
      {/* Heading */}
      <div className="relative mx-auto max-w-[1276px] px-6 pt-16 md:pt-[88px]">
        <h2
          className="text-center text-[#111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            marginBottom: "40px",
          }}
        >
          Public images are{" "}
          <span
            style={{
              background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            bloated
          </span>
        </h2>
      </div>

      {/* Desktop: 2 cards │ hex center │ 2 cards */}
      <div className="hidden md:block relative mx-auto max-w-[1276px] px-6 pb-16 md:pb-[88px]">
        <div className="relative" style={{ minHeight: "520px" }}>
          {/* Center danger-hex illustration */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/bloated-hex.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "520px",
              height: "520px",
              maxWidth: "none",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Quadrant positions: TL, TR, BL, BR */}
          {(
            [
              { style: { left: 0, top: "60px" } },
              { style: { right: 0, top: "60px" } },
              { style: { left: 0, bottom: "60px" } },
              { style: { right: 0, bottom: "60px" } },
            ] as const
          ).map((pos, idx) => {
            const card = cards[idx];
            if (!card) return null;
            return (
              <div key={card.title} className="absolute" style={pos.style}>
                <BloatedCard title={card.title} description={card.description} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: hex + stacked cards */}
      <div className="md:hidden mx-auto px-5 pb-12 flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/bloated-hex.svg"
          alt=""
          className="pointer-events-none select-none"
          style={{ width: "200px", height: "200px" }}
          loading="lazy"
          decoding="async"
        />
        {cards.map((card) => (
          <BloatedCard
            key={card.title}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </section>
  );
}

interface BloatedCardProps {
  title: string;
  description: string;
}

function BloatedCard({
  title,
  description,
}: BloatedCardProps): React.ReactElement {
  return (
    <div className="relative" style={{ width: "388px", maxWidth: "100%" }}>
      {/* Subtle cyan border halo */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #2CC1EB 0%, #2CC1EB 100%)",
          opacity: 0.4,
        }}
      />
      {/* White card body */}
      <div
        className="relative bg-white rounded-[16px] flex items-center gap-4 px-5 py-5"
        style={{
          margin: "8px",
          boxShadow:
            "0px 64px 64px 0px rgba(22,34,51,0.12), 0px 32px 32px 0px rgba(22,34,51,0.04), 0px 4px 24px 0px rgba(22,34,51,0.04), 0px 4px 4px 0px rgba(22,34,51,0.04)",
        }}
      >
        {/* Metallic icon box */}
        <div
          className="relative shrink-0 rounded-[12px] overflow-hidden"
          style={{ width: "64px", height: "64px" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-[12px]"
            style={{
              background:
                "linear-gradient(115.5deg, #576265 17.3%, #9EA1A1 74.5%, #848B8A 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 rounded-[12px] mix-blend-overlay"
            style={{
              background:
                "linear-gradient(-21deg, rgba(255,255,255,0) 53%, rgba(255,255,255,1) 96%)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-shield-icon.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{ left: "14px", top: "14px", width: "37px", height: "37px" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text group */}
        <div className="flex flex-col gap-1 min-w-0">
          <p
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.37px",
              lineHeight: 1.3,
            }}
          >
            {title}
          </p>
          <p
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "-0.37px",
              lineHeight: 1.3,
              maxWidth: "210px",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
