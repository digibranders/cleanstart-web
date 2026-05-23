import type React from "react";

const CARDS: { icon: string; title: string; desc: string }[] = [
  {
    icon: "/images/attack-surface-reduction/icon-monitor.png",
    title: "Minimal Foundations",
    desc: "Only required runtime components.",
  },
  {
    icon: "/images/attack-surface-reduction/icon-ring.png",
    title: "Bloat Removed",
    desc: "No shells or unused tooling.",
  },
  {
    icon: "/images/attack-surface-reduction/icon-toggle.png",
    title: "Deterministic Builds",
    desc: "Reproducible and verifiable.",
  },
  {
    icon: "/images/attack-surface-reduction/icon-gear.png",
    title: "Secure Defaults",
    desc: "Hardened by default.",
  },
];

export function ASRApproach(): React.ReactElement {
  return (
    <section
      data-section="ASRApproach"
      className="relative bg-white overflow-hidden"
    >
      {/* Heading */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 md:pt-[88px]">
        <h2
          className="text-[#111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "562px",
            marginBottom: "48px",
          }}
        >
          The CleanStart{" "}
          <span className="cs-text-gradient-impact">Approach</span>
        </h2>
      </div>

      {/* Desktop: 2×2 grid with cross-dividers */}
      <div className="hidden md:block relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-16 md:pb-[88px]">
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
          {CARDS.map((card, idx) => (
            <ApproachCell key={card.title} card={card} padLeft={idx % 2 === 1} />
          ))}
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden relative mx-auto px-5 pb-12">
        {CARDS.map((card, idx) => (
          <div
            key={card.title}
            className="flex items-start gap-5 py-8"
            style={
              idx < CARDS.length - 1
                ? { borderBottom: "1px solid rgba(217,217,217,0.7)" }
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.icon}
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
                  fontSize: "clamp(20px, 2vw, 28px)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                }}
              >
                {card.title}
              </p>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(15px, 1.4vw, 20px)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                }}
              >
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface ApproachCellProps {
  card: { icon: string; title: string; desc: string };
  padLeft: boolean;
}

function ApproachCell({ card, padLeft }: ApproachCellProps): React.ReactElement {
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
        src={card.icon}
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
            fontSize: "clamp(22px, 2.4vw, 32px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "225px",
          }}
        >
          {card.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(15px, 1.4vw, 20px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            maxWidth: "290px",
          }}
        >
          {card.desc}
        </p>
      </div>
    </div>
  );
}
