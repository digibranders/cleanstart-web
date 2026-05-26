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

interface TabContent {
  heroTitle: string;
  heroDescription: string;
  ctaLabel: string;
  ctaHref: string;
  cards: [FeatureCard, FeatureCard, FeatureCard];
}

const TAB_CONTENT: Record<TabId, TabContent> = {
  ciso: {
    heroTitle: "Security leadership that scales",
    heroDescription:
      "Centralize visibility, cut audit cycles, and prove compliance — without slowing engineering down.",
    ctaLabel: "Explore for CISOs",
    ctaHref: "/for-ciso",
    cards: [
      {
        title: "Reduce Security Costs by 70%",
        description:
          "Automated security, real-time scanning, and built-in compliance enable lean, cost-efficient DevSecOps teams.",
      },
      {
        title: "Always-On Threat Protection",
        description:
          "Continuous vulnerability monitoring and rapid CVE response keep production hardened around the clock.",
      },
      {
        title: "Centralized Visibility & Governance",
        description:
          "A unified dashboard for complete oversight and control over security posture and compliance.",
      },
    ],
  },
  developers: {
    heroTitle: "Build pipelines you can trust",
    heroDescription:
      "Signed, deterministic images that drop into your CI/CD with zero friction and full provenance.",
    ctaLabel: "Explore for Developers",
    ctaHref: "/for-developers",
    cards: [
      {
        title: "Signed & Verified Images",
        description:
          "Cryptographically signed images with automated security updates and full SBOM provenance.",
      },
      {
        title: "Seamless CI/CD Integration",
        description:
          "Drop-in support for CI/CD pipelines, private registries, and SSO across your existing workflow.",
      },
      {
        title: "Streamlined Development",
        description:
          "Ship faster with automated compliance, custom-built images, and minimal-CVE base layers.",
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

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Title row — title flush-left, separator centered, description right-aligned.
            Same 1fr auto 1fr grid pattern used by SecurityNotPatching for visual
            parity. */}
        <div className="mb-8 flex flex-col items-start gap-6 md:mb-10 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <h2
            id="how-cleanstart-title"
            className="justify-self-start font-display text-[#111111]"
            style={{
              maxWidth: "444px",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
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
            className="text-[#111111] md:justify-self-end md:text-right"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
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

          {/* 4-card grid. Gap clamped 16 → 32 px scales with viewport so the
              2-col layout doesn't waste horizontal space at md (~768 px)
              while still hitting Figma's 32 px at xl. */}
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

/* ============================================================================
   CISO Card — dark gradient with tabs, title, description, and CTA link.
   ========================================================================== */
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
      {/* Tab pill at top-left. Height + padding are responsive so the two
          labels ("For CISOs" / "For Developers") always sit on a single
          row even on the narrowest md-grid card (~328 px). `max-w-full`
          guarantees the pill bar can't outgrow the card width. */}
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
          fontSize: "clamp(22px, 2.4vw, 32px)",
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
          fontSize: "clamp(15px, 1.4vw, 20px)",
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
      // `whitespace-nowrap` keeps each label on one line; clamp scales
      // height/font/padding from the smallest md card (~328 px) up to the
      // Figma desktop spec so the two pills always sit on a single row
      // inside the parent tab bar.
      className="relative cursor-pointer whitespace-nowrap rounded-[999px] font-medium text-white"
      style={{
        height: "clamp(26px, 3vw, 34px)",
        padding: "0 clamp(8px, 1.2vw, 12px)",
        fontSize: "clamp(13px, 1.4vw, 18px)",
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

/* ============================================================================
   Feature Card — gear orb + title + description.
   TRANSPARENT bg: the L-shape SVG behind the grid supplies the unified white
   surface across all 3 feature cards, so each card sits on the same continuous
   shape rather than reading as 3 separate white rectangles.
   ========================================================================== */
function FeatureCardItem({
  card,
  index,
}: {
  card: FeatureCard;
  index: number;
}) {
  return (
    <article
      // Two responsive levers working together:
      //
      // 1. `containerType: inline-size` makes every interior `cqi/cqw`
      //    below resolve against the CARD width (not the viewport). The
      //    icon shrinks 1:1 with the card so a fixed 224 px gear never
      //    devours the text column on narrower cards.
      //
      // 2. Layout switches from VERTICAL (icon top centered, text below
      //    full-width) to HORIZONTAL (icon-left, text-right) at `lg`
      //    instead of `sm`. The md range (768–1023 px) sits in the 2-col
      //    grid where each card is only ~328–488 px wide — far too tight
      //    for the icon-left composition. Below lg we get the full card
      //    width for text, so descriptions wrap to 2–3 lines instead of
      //    the previous 7–8.
      //
      // The L-shape SVG behind these cards uses `preserveAspectRatio="none"`
      // and a 50 %-of-container cutout, so it auto-aligns with whatever
      // height the grid stretches all 4 cards to.
      className="relative flex min-h-[clamp(220px,18vw,260px)] w-full flex-col items-center text-center gap-[clamp(16px,2vw,24px)] rounded-[24px] bg-white md:bg-transparent md:rounded-none lg:flex-row lg:text-left lg:items-center lg:gap-[clamp(16px,2vw,24px)]"
      style={{
        // Smaller padding cap (50 vs 70) reclaims breathing room for the
        // icon + text on tight md cards while still feeling spacious at xl.
        paddingLeft: "clamp(16px, 4cqi, 50px)",
        paddingRight: "clamp(16px, 4cqi, 50px)",
        paddingTop: "clamp(16px, 3vw, 32px)",
        paddingBottom: "clamp(16px, 3vw, 32px)",
        containerType: "inline-size",
        animation: "cs-tab-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Gear orb — Figma reference: 224 × 180 wrapper, lavender glow
          165 × 165 at (-3, 1), gear image 161 × 160 at (20, 11).
            Wrapper width now scales with the CARD via `cqi`:
              clamp(96px, 30cqi, 224px)
              · md card (328 px) → 30cqi ≈ 98 px (clamps to 96 floor)
              · lg card (456 px) → 30cqi ≈ 137 px
              · xl card (632 px) → 30cqi ≈ 190 px
              · 2xl+ card (≥747px) → 224 px (Figma max, capped)
            All inner positions and sizes are expressed as percentages of
            the wrapper so glow + gear scale 1:1 as the wrapper shrinks.
            Wrapper also exposes its own `containerType` so the glow
            blur radius scales with the icon itself (not the card). */}
      <div
        className="relative shrink-0"
        style={{
          width: "clamp(96px, 30cqi, 224px)",
          aspectRatio: "224 / 180",
          containerType: "inline-size",
        }}
      >
        {/* Lavender soft glow. Percentages keep the (-3, 1) offset, 165 px
            circle, and 16 px blur scaling with the wrapper. Blur uses cqi
            (= % of icon wrapper width) so the softness scales linearly. */}
        <div
          aria-hidden
          className="absolute"
          style={{
            left: "-1.34%",       // -3 / 224
            top: "0.56%",          //  1 / 180 (% of height for top)
            width: "73.66%",       // 165 / 224
            height: "91.67%",      // 165 / 180
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(223, 155, 255, 0.65) 0%, rgba(223, 155, 255, 0.30) 55%, rgba(223, 155, 255, 0) 80%)",
            filter: "blur(7.14cqi)", // 16 / 224 ≈ 7.14 % of icon width
            zIndex: 1,
          }}
        />
        {/* Gear image. Absolute wrapper with %-positioning; Next.js Image
            fills it via `h-full w-full object-contain` so the gear sharpens
            and scales without us touching the underlying width/height. */}
        <div
          className="absolute"
          style={{
            left: "8.93%",         //  20 / 224
            top: "6.11%",          //  11 / 180
            width: "71.88%",       // 161 / 224
            height: "88.89%",      // 160 / 180
            zIndex: 20,
          }}
        >
          <Image
            src="/images/gear-orb.png"
            alt=""
            width={161}
            height={160}
            sizes="(min-width: 1280px) 161px, (min-width: 768px) 18vw, 30vw"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* `min-w-0` is critical — without it, `flex-1` (when horizontal at
          lg+) can't actually shrink the text column below its content's
          intrinsic width, and long words ("Streamlined", "Protection")
          would overflow the card. Gap is responsive so md vertical mode
          gets a tighter rhythm than the lg horizontal layout. */}
      <div className="flex min-w-0 flex-1 flex-col gap-[clamp(12px,1.5vw,24px)]">
        <h3
          className="font-display text-[#111111]"
          style={{
            // 22 px floor matches the Figma title baseline. The horizontal-
            // layout text-column squeeze is gone (vertical at md gives full
            // card width), so we can keep the larger floor without risk.
            fontSize: "clamp(22px, 2.4vw, 32px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            // Removed the rigid 234 px maxWidth — flex layout already caps
            // the column at the available text area. `overflowWrap` is a
            // safety net for compound words at the smallest breakpoint.
            overflowWrap: "break-word",
          }}
        >
          {card.title}
        </h3>
        <p
          className="text-[#333333]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(15px, 1.4vw, 20px)",
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
