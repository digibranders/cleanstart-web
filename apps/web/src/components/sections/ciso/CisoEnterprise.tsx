import type React from "react";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

/*
 * "Built for Enterprise Environments" — four feature cards in a row on xl,
 * stacked on mobile, with corner Union + ellipse decorations.
 */

interface CardDef {
  icon: string;
  title: string;
  desc: string;
  titleSize: number;
}

const CARDS: CardDef[] = [
  {
    icon: "/images/ciso/enterprise-icon-cloud.svg",
    title: "Exposure Visibility",
    desc: "Continuously identify inherited software risk across dependencies, artifacts, and environments.",
    titleSize: 32,
  },
  {
    icon: "/images/ciso/enterprise-icon-devsecops.svg",
    title: "Provenance Verification",
    desc: "Validate software origin, integrity, and ownership across the delivery lifecycle.",
    titleSize: 32,
  },
  {
    icon: "/images/ciso/enterprise-icon-compliance.svg",
    title: "Policy Governance",
    desc: "Continuously enforce software security and compliance standards across environments.",
    titleSize: 32,
  },
  {
    icon: "/images/ciso/enterprise-icon-security-ops.svg",
    title: "Verified Remediation",
    desc: "Reduce operational exposure with verified software artifacts and remediation guidance.",
    titleSize: 32,
  },
];

function EnterpriseCard({ icon, title, desc, titleSize }: CardDef): React.ReactElement {
  return (
    <div className="relative flex-shrink-0" style={{ width: "295px", height: "372px" }}>
      {/* Outer cyan glow — creates the border halo effect. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "40px", background: "#2cc1eb", opacity: 0.3 }}
      />

      {/* Inner white card — 4px inset on each side. */}
      <div
        className="absolute overflow-hidden bg-white"
        style={{ inset: "4px", borderRadius: "36px" }}
      >
        {/* Purple blur at top */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "263px",
            height: "153px",
            background: "#df9bff",
            filter: "blur(66.5px)",
            opacity: 0.3,
          }}
        />

        {/* Horizontal grid lines. */}
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

        {/* Vertical accent lines. */}
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

        {/* Blue gradient ball — left-aligned with the text block below. */}
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: "24px",
            top: "33px",
            width: "96px",
            height: "96px",
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
            style={{ width: "54px", height: "54px", objectFit: "contain" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text block. */}
        <div
          className="absolute flex flex-col"
          style={{ top: "152px", left: "24px", width: "251px", gap: "12px" }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: `${titleSize}px`,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
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
              letterSpacing: "-0.05em",
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
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
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

      {/* Heading — padded container so text has safe margins. */}
      <div className="relative mx-auto px-6 sm:px-10" style={{ maxWidth: "1276px" }}>
        <Reveal header>
          <h2
            className="text-center mx-auto"
            style={{
              maxWidth: "654px",
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#111",
              marginBottom: "74px",
            }}
          >
            Continuous Governance Across the{" "}
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
      </div>

      {/* Card container — no horizontal padding so the 4 cards + gaps fill the
          1276px width exactly. */}
      <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

        {/* DESKTOP — 4 cards in a centred flex row. */}
        <RevealStagger
          className="hidden xl:flex items-start justify-center"
          style={{ gap: "32px" }}
        >
          {CARDS.map((card) => (
            <RevealItem key={card.title}>
              <EnterpriseCard {...card} />
            </RevealItem>
          ))}
        </RevealStagger>

        {/* MOBILE — single-column stack. */}
        <div className="xl:hidden flex flex-col gap-4 px-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="relative flex-shrink-0"
              style={{ height: "238px" }}
            >
              {/* Outer cyan glow border */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ borderRadius: "40px", background: "#2cc1eb", opacity: 0.3 }}
              />
              {/* Inner white card — 6px inset. */}
              <div
                className="absolute overflow-hidden bg-white"
                style={{ inset: "6px", borderRadius: "34px" }}
              >
                {/* Purple blur at top */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "180px",
                    height: "100px",
                    background: "#df9bff",
                    filter: "blur(50px)",
                    opacity: 0.3,
                  }}
                />

                {/* Blue gradient ball — centered near the top. */}
                <div
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    left: "50%",
                    top: "20px",
                    transform: "translateX(-50%)",
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                    boxShadow:
                      "0px 4.5px 10.6px 0px rgba(28,60,142,0.33), inset 0px -0.17px 0.21px 0px rgba(0,44,179,0.5), inset 0px 0.085px 0.425px 0px rgba(255,255,255,0.81)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.icon}
                    alt=""
                    aria-hidden
                    style={{ width: "40px", height: "40px", objectFit: "contain" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Text block — centered. */}
                <div
                  className="absolute flex flex-col items-center text-center"
                  style={{
                    top: "108px",
                    left: "16px",
                    right: "16px",
                    gap: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: `${card.titleSize > 30 ? 20 : 18}px`,
                      fontWeight: 700,
                      letterSpacing: "-0.05em",
                      lineHeight: 1.1,
                      color: "#111",
                      margin: 0,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: 400,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.4,
                      color: "#555",
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
