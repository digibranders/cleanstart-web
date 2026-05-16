export function AsrApproach(): React.ReactElement {
  const items: Array<{ icon: string; title: string; description: string }> = [
    {
      icon: "/images/attack-surface-reduction/approach-icon-1.png",
      title: "Minimal Foundations",
      description: "Only required components are included in every image",
    },
    {
      icon: "/images/attack-surface-reduction/approach-icon-2.png",
      title: "Unnecessary Components",
      description:
        "Shells, package managers, and unused tools are excluded.",
    },
    {
      icon: "/images/attack-surface-reduction/approach-icon-3.png",
      title: "Deterministic Builds",
      description: "Images are built consistently from trusted source.",
    },
    {
      icon: "/images/attack-surface-reduction/approach-icon-4.png",
      title: "Secure Defaults Applied",
      description:
        "Hardened configurations are enforced at the image layer.",
    },
  ];

  return (
    <section
      data-section="AsrApproach"
      className="relative bg-white overflow-hidden"
    >
      {/* Heading */}
      <div className="relative mx-auto max-w-[1276px] px-6 pt-16 md:pt-[88px]">
        <h2
          className="text-[#111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            maxWidth: "562px",
            marginBottom: "48px",
          }}
        >
          The CleanStart{" "}
          <span
            style={{
              background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Approach
          </span>
        </h2>
      </div>

      {/* Desktop: 2×2 grid with cross-dividers */}
      <div className="hidden md:block relative mx-auto max-w-[1276px] px-6 pb-16 md:pb-[88px]">
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
            <ApproachCell key={item.title} item={item} padLeft={idx % 2 === 1} />
          ))}
        </div>
      </div>

      {/* Mobile: stacked with hairlines */}
      <div className="md:hidden relative mx-auto px-5 pb-12">
        {items.map((item, idx) => (
          <div
            key={item.title}
            className="flex items-start gap-5 py-8"
            style={
              idx < items.length - 1
                ? { borderBottom: "1px solid rgba(217,217,217,0.7)" }
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.icon}
              alt=""
              aria-hidden
              className="pointer-events-none select-none shrink-0"
              style={{ width: "72px", height: "72px", objectFit: "contain" }}
              loading="lazy"
              decoding="async"
            />
            <div className="flex flex-col gap-3">
              <p
                className="text-[#111]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.1,
                }}
              >
                {item.title}
              </p>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "17px",
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.4,
                }}
              >
                {item.description}
              </p>
            </div>
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

function ApproachCell({
  item,
  padLeft,
}: ApproachCellProps): React.ReactElement {
  return (
    <div
      className="relative flex items-center gap-8 py-10"
      style={{
        paddingLeft: padLeft ? "48px" : "0",
        paddingRight: padLeft ? "0" : "48px",
      }}
    >
      {/* Soft radial glow behind icon */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: padLeft ? "48px" : "0",
          top: "50%",
          transform: "translateY(-50%)",
          width: "165px",
          height: "165px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154, 81, 255, 0.22) 0%, rgba(154, 81, 255, 0) 100%)",
          filter: "blur(8px)",
        }}
      />

      {/* 3D icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.icon}
        alt=""
        aria-hidden
        className="relative pointer-events-none select-none shrink-0"
        style={{ width: "165px", height: "165px", objectFit: "contain" }}
        loading="lazy"
        decoding="async"
      />

      {/* Copy */}
      <div className="flex flex-col gap-[23px]">
        <p
          className="text-[#111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.0,
            maxWidth: "225px",
          }}
        >
          {item.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
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
