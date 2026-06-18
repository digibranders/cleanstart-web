import type React from "react";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

/*
 * "Continuous Control" — four feature cards.
 * Breakpoints: 1-col mobile → 2×2 tablet (sm) → 4-col desktop (lg).
 */

interface CardDef {
  icon: string;
  title: string;
  desc: string;
}

const CARDS: CardDef[] = [
  {
    icon: "/images/ciso/enterprise-icon-cloud.svg",
    title: "Exposure Visibility",
    desc: "Continuously identify inherited software risk.",
  },
  {
    icon: "/images/ciso/enterprise-icon-devsecops.svg",
    title: "Provenance Verification",
    desc: "Validate software origin, integrity, and ownership.",
  },
  {
    icon: "/images/ciso/enterprise-icon-compliance.svg",
    title: "Policy Governance",
    desc: "Enforce software security and compliance policies.",
  },
  {
    icon: "/images/ciso/enterprise-icon-security-ops.svg",
    title: "Verified Remediation",
    desc: "Reduce inherited risk with verified alternatives.",
  },
];

function EnterpriseCard({ icon, title, desc }: CardDef): React.ReactElement {
  return (
    <div className="relative w-full h-full" style={{ borderRadius: "40px", padding: "4px" }}>
      {/* Outer cyan glow border */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "40px", background: "#2cc1eb", opacity: 0.3 }}
      />

      {/* Inner white card — flex col so text is always at the bottom */}
      <div
        className="relative overflow-hidden bg-white flex flex-col h-full"
        style={{
          borderRadius: "36px",
          padding: "clamp(20px, 2vw, 28px)",
          minHeight: "clamp(240px, 18vw, 300px)",
        }}
      >
        {/* Purple blur decoration */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "153px",
            background: "#df9bff",
            filter: "blur(66.5px)",
            opacity: 0.3,
          }}
        />

        {/* Horizontal grid lines */}
        {([68, 184] as const).map((y) => (
          <div
            key={y}
            aria-hidden
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${y}px`,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 50.77%, transparent 100%)",
              opacity: 0.3,
            }}
          />
        ))}

        {/* Vertical accent lines */}
        {([48.47, 120.03, 162.38, 233.94] as const).map((x) => (
          <div
            key={x}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: `${x}px`,
              top: 0,
              width: "0.73px",
              height: "264px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,1) 50.77%, transparent 100%)",
              opacity: 0.8,
            }}
          />
        ))}

        {/* Blue gradient ball */}
        <div
          className="relative flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{
            width: "clamp(72px, 6vw, 96px)",
            height: "clamp(72px, 6vw, 96px)",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 6.171px 14.537px 0px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            aria-hidden
            style={{ width: "56%", height: "56%", objectFit: "contain" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text — mt-auto pushes it to the card bottom */}
        <div
          className="relative mt-auto flex flex-col"
          style={{ paddingTop: "16px", gap: "10px" }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 1.8vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              color: "#111",
              margin: 0,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "#555",
              margin: 0,
            }}
          >
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CisoEnterprise(): React.ReactElement {
  return (
    <section
      data-section="CisoEnterprise"
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: "80px", paddingBottom: "64px" }}
    >
      {/* Corner Union — top-right. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: "-185px",
          top: "-193px",
          width: "488px",
          height: "496px",
          transform: "rotate(141.39deg) scaleY(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Corner Union — top-left. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "-218px",
          top: "-139px",
          width: "488px",
          height: "496px",
          transform: "rotate(141.39deg) scaleY(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Ellipse glow — top-right. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ right: "-127px", top: "-74px", width: "315px", height: "315px" }}
      >
        <div className="absolute" style={{ inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ciso/enterprise-ellipse.svg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "fill" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Ellipse glow — top-left. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-103px", top: "-20px", width: "315px", height: "315px" }}
      >
        <div className="absolute" style={{ inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ciso/enterprise-ellipse.svg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "fill" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="relative mx-auto px-6 sm:px-10" style={{ maxWidth: "1276px" }}>
        {/* Heading */}
        <Reveal header>
          <h2
            className="text-center mx-auto"
            style={{
              maxWidth: "654px",
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#111",
              marginBottom: "clamp(40px, 5vw, 74px)",
            }}
          >
            Continuous Control Across the{" "}
            <span
              style={{
                background:
                  "linear-gradient(100.87deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Software Lifecycle
            </span>
          </h2>
        </Reveal>

        {/* Responsive grid: 1-col → 2×2 tablet → 4-col desktop */}
        <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {CARDS.map((card) => (
            <RevealItem key={card.title}>
              <EnterpriseCard {...card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
