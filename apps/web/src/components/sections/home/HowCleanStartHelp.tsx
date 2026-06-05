"use client";

import { useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

type TabId = "ciso" | "developers";

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
}

interface TabContent {
  heroTitle: string;
  heroDescription: string;
  ctaLabel: string;
  ctaHref: string;
  cards: [FeatureCard, FeatureCard, FeatureCard];
}

const TAB_CONTENT: Record<TabId, TabContent> = {
  ciso: {
    heroTitle: "Security Leadership That Scales",
    heroDescription:
      "Centralize visibility, strengthen compliance readiness, and improve software trust across environments.",
    ctaLabel: "Explore for CISOs",
    ctaHref: "/for-ciso",
    cards: [
      {
        title: "Continuous Compliance Readiness",
        description:
          "Automate evidence collection and simplify compliance across modern software environments.",
        icon: "/images/home/help-icon1.png",
      },
      {
        title: "Verifiable Software Governance",
        description:
          "Improve visibility across software provenance, dependencies, and runtime foundations.",
        icon: "/images/home/help-icon2.png",
      },
      {
        title: "Centralized Visibility & Control",
        description:
          "Unify software trust, compliance, and delivery insights across teams and environments.",
        icon: "/images/home/help-icon3.png",
      },
    ],
  },
  developers: {
    heroTitle: "Build Pipelines You Can Trust",
    heroDescription:
      "Signed, deterministic images with full provenance for modern CI/CD environments.",
    ctaLabel: "Explore for Developers",
    ctaHref: "/for-developers",
    cards: [
      {
        title: "Verifiable Software Foundations",
        description:
          "Minimal, source-built runtime images designed to reduce inherited vulnerabilities.",
        icon: "/images/home/help-icon2.png",
      },
      {
        title: "Built for Existing Workflows",
        description:
          "Integrate with CI/CD pipelines, registries, Kubernetes environments, and developer tooling.",
        icon: "/images/home/help-icon1.png",
      },
      {
        title: "Accelerate Secure Delivery",
        description:
          "Improve release confidence with reproducible builds and trusted runtime foundations.",
        icon: "/images/home/help-icon3.png",
      },
    ],
  },
};

export function HowCleanStartHelp() {
  const [activeTab, setActiveTab] = useState<TabId>("developers");
  const content = TAB_CONTENT[activeTab];

  return (
    <section
      className="relative w-full pb-12 pt-12 sm:pb-16 lg:pb-0 lg:pt-14"
      aria-labelledby="how-cleanstart-title"
      style={{ backgroundColor: "#F6F6F6" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(80,80,140,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(80,80,140,0.10) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 35%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, black 0%, black 35%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="mb-8 flex flex-col items-start gap-6 md:mb-10 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <Reveal header className="justify-self-start" style={{ maxWidth: "520px" }}>
            <h2
              id="how-cleanstart-title"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Tailored for Modern Software Teams
            </h2>
          </Reveal>
          <div
            aria-hidden
            className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(204,204,204,0) 0%, rgba(204,204,204,1) 47.2%, rgba(204,204,204,0) 100%)",
            }}
          />
          <Reveal
            header
            delay={0.15}
            y={20}
            className="md:justify-self-end"
            style={{ maxWidth: "604px" }}
          >
            <p
              className="text-[#111111] md:text-right"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                opacity: 0.8,
              }}
            >
              Designed to support every stage of modern software delivery.
            </p>
          </Reveal>
        </div>

        {/* Stays inside the container padding so the L-shape SVG (which uses
            preserveAspectRatio="none" and stretches to the inner width) does
            not run flush to the viewport edge. pb-[30px]/-mb-[30px] extends the
            white surface below the grid to bridge into the next section. */}
        <div className="relative pb-[30px] mb-[-30px]">
          {/* preserveAspectRatio="none" is intentional: the L-shape has concave
              corners calibrated to the two card rows. `xMidYMid meet` would
              shrink the SVG and leave whitespace at the card edges, and two
              rounded divs cannot render the concave junction without a mask.
              The minor corner-radius skew at off-1276 widths is the trade-off. */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-full w-full hidden md:block"
            viewBox="0 0 1276 582"
            // eslint-disable-next-line no-restricted-syntax -- see comment above
            preserveAspectRatio="none"
            style={{ zIndex: 0 }}
          >
            <path
              d="M694 0L1236 0C1258.09 0 1276 22.09 1276 40L1276 542C1276 564.09 1258.09 582 1236 582L40 582C17.91 582 0 564.09 0 542L0 332C0 309.91 17.91 292 40 292L614 292C636.09 292 654 269.91 654 252L654 40C654 17.91 671.91 0 694 0Z"
              fill="white"
            />
          </svg>

          <div
            className="relative grid grid-cols-1 md:grid-cols-2"
            style={{
              zIndex: 1,
              gap: "clamp(16px, 2.2vw, 32px)",
            }}
          >
            <CisoCard
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              content={content}
            />
            {content.cards.map((card, idx) => (
              <FeatureCardItem
                key={`${activeTab}:${card.title}`}
                card={card}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CisoCard({
  activeTab,
  setActiveTab,
  content,
}: {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  content: TabContent;
}) {
  return (
    <article
      className="relative flex min-h-[clamp(220px,18vw,260px)] w-full flex-col overflow-hidden"
      style={{
        borderRadius: "40px",
        background:
          "linear-gradient(135deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)",
        padding: "clamp(20px, 3vw, 32px) clamp(24px, 4vw, 52px)",
      }}
    >
      {/* Responsive height/padding keep both tab labels on a single row even
          on the narrowest md-grid card (~328 px); max-w-full prevents the bar
          from outgrowing the card width. */}
      <div
        role="tablist"
        aria-label="Audience"
        data-cta-utility
        className="flex w-fit max-w-full items-center gap-1 rounded-[999px] p-1"
        style={{
          height: "clamp(34px, 3.6vw, 42px)",
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(218,182,243,0.25) 0%, rgba(52,34,102,0) 70%), rgba(187,175,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "inset 1px 1px 0 0 rgba(218,182,243,0.45), inset -1px -1px 0 0 rgba(218,182,243,0.20)",
        }}
      >
        <TabPill
          id="developers"
          label="For Developers"
          active={activeTab === "developers"}
          onClick={() => setActiveTab("developers")}
        />
        <TabPill
          id="ciso"
          label="For CISOs"
          active={activeTab === "ciso"}
          onClick={() => setActiveTab("ciso")}
        />
      </div>

      <h3
        key={`${activeTab}-title`}
        className="mt-[28px] font-display text-white"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
          maxWidth: "504px",
          animation: "cs-tab-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        {content.heroTitle}
      </h3>

      <p
        key={`${activeTab}-desc`}
        className="mt-[22px] text-white"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
          maxWidth: "504px",
          animation: "cs-tab-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
          animationDelay: "70ms",
        }}
      >
        {content.heroDescription}
      </p>

      <a
        key={`${activeTab}-cta`}
        href={content.ctaHref}
        className="cs-link-cta mt-auto self-end"
        style={{
          animation: "cs-tab-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
          animationDelay: "140ms",
        }}
      >
        <span>{content.ctaLabel}</span>
        <svg
          className="cs-cta-arrow"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 10h12m0 0l-4-4m4 4l-4 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </article>
  );
}

function TabPill({
  id,
  label,
  active,
  onClick,
}: {
  id: TabId;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`ciso-tab-${id}`}
      aria-selected={active}
      data-cta-utility
      onClick={onClick}
      // whitespace-nowrap keeps each label on one line; the clamps scale
      // height/font/padding so both pills stay on a single row from the
      // smallest md card (~328 px) up to desktop.
      className="relative cursor-pointer whitespace-nowrap rounded-[999px] font-medium text-white"
      style={{
        height: "clamp(26px, 3vw, 34px)",
        padding: "0 clamp(8px, 1.2vw, 12px)",
        fontSize: "var(--fs-body-sm)",
        opacity: active ? 1 : 0.7,
        background: active
          ? "linear-gradient(180deg, #2B97D1 0%, #395FF9 100%)"
          : "transparent",
        boxShadow: active
          ? "0 4px 12px -4px rgba(57,96,249,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
          : "none",
        transition:
          "background 360ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 360ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease-out",
      }}
    >
      {label}
    </button>
  );
}

/* Transparent background: the L-shape SVG behind the grid supplies the unified
   white surface across all 3 feature cards, so each card sits on one continuous
   shape rather than reading as 3 separate white rectangles. */
function FeatureCardItem({
  card,
  index,
}: {
  card: FeatureCard;
  index: number;
}) {
  return (
    <article
      // containerType: inline-size makes the interior cqi units resolve against
      // the card width, so the icon shrinks 1:1 and never devours the text
      // column on narrow cards. Layout switches from vertical (icon top, text
      // below) to horizontal (icon left, text right) at lg rather than sm,
      // because the md 2-col grid leaves each card only ~328–488 px wide — too
      // tight for the icon-left composition.
      className="relative flex min-h-[clamp(220px,18vw,260px)] w-full flex-col items-center text-center gap-[clamp(16px,2vw,24px)] rounded-[24px] bg-white md:bg-transparent md:rounded-none lg:flex-row lg:text-left lg:items-center lg:gap-[clamp(16px,2vw,24px)]"
      style={{
        paddingLeft: "clamp(16px, 4cqi, 50px)",
        paddingRight: "clamp(16px, 4cqi, 50px)",
        paddingTop: "clamp(16px, 3vw, 32px)",
        paddingBottom: "clamp(16px, 3vw, 32px)",
        containerType: "inline-size",
        animation: "cs-tab-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Wrapper width scales with the card via cqi; inner glow and gear
          positions are percentages of the wrapper so they scale 1:1 as it
          shrinks. The wrapper sets its own containerType so the glow blur
          radius scales with the icon, not the card. */}
      <div
        className="relative shrink-0"
        style={{
          width: "clamp(128px, 40cqi, 288px)",
          aspectRatio: "224 / 180",
          containerType: "inline-size",
        }}
      >
        <div
          aria-hidden
          className="absolute"
          style={{
            left: "-1.34%",
            top: "0.56%",
            width: "73.66%",
            height: "91.67%",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(223, 155, 255, 0.65) 0%, rgba(223, 155, 255, 0.30) 55%, rgba(223, 155, 255, 0) 80%)",
            filter: "blur(7.14cqi)",
            zIndex: 1,
          }}
        />
        <div
          className="absolute"
          style={{
            left: "8.93%",
            top: "6.11%",
            width: "71.88%",
            height: "88.89%",
            zIndex: 20,
          }}
        >
          <Image
            src={card.icon}
            alt=""
            width={161}
            height={160}
            sizes="(min-width: 1280px) 161px, (min-width: 768px) 18vw, 30vw"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* min-w-0 is required so flex-1 (horizontal at lg+) can shrink the text
          column below its intrinsic width; without it long words overflow the
          card. */}
      <div className="flex min-w-0 flex-1 flex-col gap-[clamp(12px,1.5vw,24px)]">
        <h3
          className="font-display text-[#111111]"
          style={{
            fontSize: "var(--fs-h3)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            // overflowWrap is a safety net for compound words at the smallest
            // breakpoint; the flex layout already caps the column width.
            overflowWrap: "break-word",
          }}
        >
          {card.title}
        </h3>
        <p
          className="text-[#333333]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            overflowWrap: "break-word",
          }}
        >
          {card.description}
        </p>
      </div>
    </article>
  );
}
