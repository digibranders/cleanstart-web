"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Section: "How CleanStart Will Help"
 * Figma title 108:8004 (1259×126) + 4 cards in 2×2 grid (each 622×308)
 *
 * Title       — Manrope Bold  62px, line 100%, ls -5%, color #111
 * Description — Sora Regular 30px, line 140%, ls -4%, color #111
 *
 * 2x2 grid (gap 32, each card 622×308):
 *  - Top-left:  CISO card (108:8009)         — DARK gradient + tabs + title + desc + CTA
 *  - Top-right: Zero-Day Protection (108:8010) — TRANSPARENT bg, gear orb + title + desc
 *  - Bottom-L:  Uncontrolled Builds (108:8040) — TRANSPARENT bg, gear orb + title + desc
 *  - Bottom-R:  Streamlined Development (108:8049) — TRANSPARENT bg, gear orb + title + desc
 *
 * CISO card (622×308, corner-radius 40, gradient #151021 → #131E8F (62.5%) → #471EC0):
 *  - Tab pill (269×42 at x=52,y=32): subtle lavender frosted glass with white SOFT_LIGHT stroke
 *    + "For CISOs" active pill (109×34, royal-blue gradient #2B97D1→#395FF9, white text Sora Medium 18px)
 *    + "For Developers" inactive (text-only, Sora Medium 18px white)
 *  - Title "Security leadership that scales" Bold 40px white at (52,110), ls -5% line 100%
 *  - Description Regular 20px white at (52,172), line 140% ls -5%
 *  - "Explore for Developers →" CTA at bottom-right (right=37, bottom=32)
 *
 * White-card content (NO card bg — sits on section grid):
 *  - Gear orb image 161×160 (factory orb image hash 3f3612054e423c192f62bc6ecdcadab0d6bd68a6)
 *    behind a #DF9BFF (light purple) ellipse 165×165 with slight offset
 *  - Title (Bold 32px, color #111, line 100%, ls -5%)
 *  - Description (Regular 22px, color #333, line 140%, ls -5%)
 */

type TabId = "ciso" | "developers";

interface FeatureCard {
  title: string;
  description: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: "Zero-Day Protection",
    description: "Without deterministic builds, artifacts can change across environments.",
  },
  {
    title: "Uncontrolled Builds",
    description: "Without deterministic builds, artifacts can change across environments.",
  },
  {
    title: "Streamlined Development",
    description: "Without deterministic builds, artifacts can change across environments.",
  },
];

export function HowCleanStartHelp() {
  const [activeTab, setActiveTab] = useState<TabId>("ciso");

  // Content shown in CISO card based on active tab
  const ctaLabel =
    activeTab === "ciso" ? "Explore for Developers" : "Explore for CISOs";

  return (
    <section
      className="relative w-full pb-0 pt-32"
      aria-labelledby="how-cleanstart-title"
      style={{ backgroundColor: "#F6F6F6" }}
    >
      {/* Blueprint grid pattern (Figma) — anchored to the LEFT edge of the section
          and fading out horizontally to the right. Subtle gray-on-#F6F6F6 lines. */}
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

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6">
        {/* Title row — title flush-left, separator centered, description right-aligned.
            Same 1fr auto 1fr grid pattern used by SecurityNotPatching for visual
            parity. */}
        <div className="mb-12 flex flex-col items-start gap-6 md:mb-[60px] md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <h2
            id="how-cleanstart-title"
            className="justify-self-start font-display text-display-md font-bold tracking-[-0.05em] text-[#111111]"
            style={{ maxWidth: "444px", lineHeight: 1 }}
          >
            How CleanStart Will Help
          </h2>
          {/* Vertical 1×90 fading-gray separator (Figma Rectangle 1000001788) */}
          <div
            aria-hidden
            className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(204,204,204,0) 0%, rgba(204,204,204,1) 47.2%, rgba(204,204,204,0) 100%)",
            }}
          />
          <p
            className="font-normal text-[#111111] md:justify-self-end md:text-right"
            style={{
              // Figma 1440 (node 763:2462): Sora Regular 30 px / lh 1.4 / -1.2 px / w-604 / opacity 0.8
              fontSize: "clamp(1rem, 2.1vw, 1.875rem)",
              lineHeight: 1.4,
              letterSpacing: "-0.04em",
              maxWidth: "604px",
              opacity: 0.8,
            }}
          >
            Help Tailored solutions for every role in your organization — from
            security leaders to engineering teams.
          </p>
        </div>

        {/* Cards container — stays inside the container's px-6 padding so the
            L-shape doesn't run flush to the viewport edge at the 1440-default
            container width. The L-shape SVG uses preserveAspectRatio="none" so
            it stretches to whatever inner width the section provides
            (1392 px at 1440 viewport, less below).
            pb-[30px] adds the 30px extension below the card grid that connects
            this section to the next. */}
        <div className="relative pb-[30px] mb-[-30px]">
          {/* White L-shape SVG (Figma Vector 1194233942, 1276×678).
              viewBox: 1276 wide × 678 tall (308 row1 + 32 gap + 308 row2 + 30px extension).
              Cutout: top-left 654×340 — CISO card (308px) + gap (32px) so the gap zone
              shows as section background (#F6F6F6), not white.
              All corners: 40px radius (r=40 → koff=22.09px). */}
          {/* preserveAspectRatio="none" is intentional here: the L-shape has
              CONCAVE corners that meet at coordinates calibrated to the
              container's two card rows. Switching to `xMidYMid meet` would
              shrink the SVG and leave whitespace where the L should reach
              card edges, and a two-rounded-divs alternative cannot render
              the concave junction without an SVG mask. The minor corner-
              radius skew at off-1276 widths is the lesser-evil trade. */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-full w-full hidden md:block"
            viewBox="0 0 1276 678"
            // eslint-disable-next-line no-restricted-syntax -- see comment above
            preserveAspectRatio="none"
            style={{ zIndex: 0 }}
          >
            <path
              d="M694 0L1236 0C1258.09 0 1276 22.09 1276 40L1276 638C1276 660.09 1258.09 678 1236 678L40 678C17.91 678 0 660.09 0 638L0 380C0 357.91 17.91 340 40 340L614 340C636.09 340 654 317.91 654 300L654 40C654 17.91 671.91 0 694 0Z"
              fill="white"
            />
          </svg>

          {/* 4-card grid */}
          <div className="relative grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2" style={{ zIndex: 1 }}>
            <CisoCard
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              ctaLabel={ctaLabel}
            />
            {FEATURE_CARDS.map((card) => (
              <FeatureCardItem key={card.title} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   CISO Card — dark gradient with tabs, title, description, and CTA link.
   ========================================================================== */
function CisoCard({
  activeTab,
  setActiveTab,
  ctaLabel,
}: {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  ctaLabel: string;
}) {
  return (
    <article
      className="relative flex min-h-[clamp(260px,24vw,308px)] w-full flex-col overflow-hidden"
      style={{
        borderRadius: "40px",
        background:
          "linear-gradient(135deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)",
        padding: "clamp(20px, 3vw, 32px) clamp(24px, 4vw, 52px)",
      }}
    >
      {/* Tab pill at top-left */}
      <div
        role="tablist"
        aria-label="Audience"
        data-cta-utility
        className="flex h-[42px] w-fit items-center gap-1 rounded-[999px] p-1"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(218,182,243,0.25) 0%, rgba(52,34,102,0) 70%), rgba(187,175,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "inset 1px 1px 0 0 rgba(218,182,243,0.45), inset -1px -1px 0 0 rgba(218,182,243,0.20)",
        }}
      >
        <TabPill
          id="ciso"
          label="For CISOs"
          active={activeTab === "ciso"}
          onClick={() => setActiveTab("ciso")}
        />
        <TabPill
          id="developers"
          label="For Developers"
          active={activeTab === "developers"}
          onClick={() => setActiveTab("developers")}
        />
      </div>

      {/* Title — Figma 1440 node 763:4101: Manrope Bold 40 px / lh 1.0 / -2 px */}
      <h3
        className="mt-[28px] font-display font-bold text-white"
        style={{
          fontSize: "clamp(2rem, 3.2vw, 2.5rem)",
          lineHeight: 1,
          letterSpacing: "-2px",
          maxWidth: "504px",
        }}
      >
        {activeTab === "ciso"
          ? "Security leadership that scales"
          : "Build pipelines you can trust"}
      </h3>

      {/* Description — Figma 1440 node 763:4102: Sora Regular 20 px / lh 1.4 / -1 px */}
      <p
        className="mt-[22px] font-normal text-white"
        style={{
          fontSize: "20px",
          lineHeight: 1.4,
          letterSpacing: "-1px",
          maxWidth: "504px",
        }}
      >
        Without deterministic builds, artifacts can change across environments.
      </p>

      {/* "Explore for Developers" CTA at bottom-right */}
      <a
        href={activeTab === "ciso" ? "#explore-developers" : "#explore-cisos"}
        className="cs-link-cta mt-auto self-end"
      >
        <span>{ctaLabel}</span>
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

/* Tab pill — active = solid blue gradient pill, inactive = text-only */
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
      className="relative h-[34px] cursor-pointer rounded-[999px] px-3 text-lg font-medium text-white transition-all duration-200"
      style={{
        opacity: active ? 1 : 0.7,
        background: active
          ? "linear-gradient(180deg, #2B97D1 0%, #395FF9 100%)"
          : "transparent",
        boxShadow: active
          ? "0 4px 12px -4px rgba(57,96,249,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}

/* ============================================================================
   Feature Card — gear orb + title + description, NO background.
   The card sits on the section grid pattern (transparent base).
   ========================================================================== */
function FeatureCardItem({ card }: { card: FeatureCard }) {
  return (
    <article
      className="relative flex min-h-[clamp(260px,24vw,308px)] w-full flex-col items-center text-center gap-3 sm:flex-row sm:text-left sm:items-center sm:gap-6"
      style={{ paddingLeft: "clamp(16px, 5vw, 70px)", paddingRight: "clamp(16px, 5vw, 70px)", paddingTop: "clamp(16px, 3vw, 32px)", paddingBottom: "clamp(16px, 3vw, 32px)" }}
    >
      {/* Gear orb — Figma-exact: solid lavender ellipse #DF9BFF (165×165 at (-3, 1))
          BLURRED to be a soft glow, with gear image (161×160 at (20, 11)) on top.
          Outer container 224×180. */}
      <div className="relative h-[180px] w-[224px] shrink-0">
        {/* Lavender soft glow (Figma Ellipse 46679 — solid #DF9BFF) */}
        <div
          aria-hidden
          className="absolute"
          style={{
            left: "-3px",
            top: "1px",
            width: "165px",
            height: "165px",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(223, 155, 255, 0.65) 0%, rgba(223, 155, 255, 0.30) 55%, rgba(223, 155, 255, 0) 80%)",
            filter: "blur(16px)",
            zIndex: 1,
          }}
        />
        {/* Gear image — wrap Image in absolute div so positioning doesn't interfere
            with Next.js Image's own width/height attributes. */}
        <div
          className="absolute"
          style={{
            left: "20px",
            top: "11px",
            width: "161px",
            height: "160px",
            zIndex: 20,
          }}
        >
          <Image
            src="/images/gear-orb.png"
            alt=""
            width={161}
            height={160}
            sizes="161px"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Title + description — Figma 1440 nodes 763:4089/4119/4128 + 763:4090/4120/4129
          Title: Manrope Bold 32 px / lh 1.0 / -1.6 px / color #111
          Desc:  Sora Regular 20 px / lh 1.4 / -1 px / color #333 / w 263 */}
      <div className="flex flex-1 flex-col gap-6" style={{ minWidth: 0 }}>
        <h3
          className="font-display font-bold text-[#111111]"
          style={{
            fontSize: "32px",
            lineHeight: 1,
            letterSpacing: "-1.6px",
            maxWidth: "234px",
          }}
        >
          {card.title}
        </h3>
        <p
          className="font-normal text-[#333333]"
          style={{
            fontSize: "20px",
            lineHeight: 1.4,
            letterSpacing: "-1px",
            maxWidth: "263px",
          }}
        >
          {card.description}
        </p>
      </div>
    </article>
  );
}
