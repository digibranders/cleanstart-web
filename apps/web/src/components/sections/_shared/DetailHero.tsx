import type { CSSProperties, ReactNode } from "react";
import { HeroReveal } from "@/components/ui/Reveal";
import { HeroBreadcrumb, type HeroCrumb } from "./HeroBreadcrumb";

export const DETAIL_HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 80%, #471FC3 100%)";

export const DETAIL_HERO_MIN_HEIGHT = "auto";

// Consumes the --text-hero-utility token (32 → 48 px, clamp below lg / fixed at lg+).
// Line-height kept at 1.15 (slightly looser than the marketing-hero 1.05) because
// listing and article-detail titles can wrap to multiple lines.
export const DETAIL_HERO_TITLE_STYLE: CSSProperties = {
  fontSize: "var(--fs-h1)",
  lineHeight: 1.15,
  letterSpacing: "var(--text-hero-utility-ls)",
};

export type DetailHeroCrumb = HeroCrumb;

interface DetailHeroProps {
  breadcrumb: DetailHeroCrumb[];
  title: string;
  titleId?: string;
  titleMaxWidth?: string;
  showDivider?: boolean;
  meta?: ReactNode;
  /**
   * Heading tag for the visible title. Defaults to `"h1"` — the hero is the
   * page's primary heading on every detail page that renders ONE hero. Pass
   * `"p"` only when the page supplies its own single `<h1>` elsewhere (e.g.
   * event detail, which renders a viewport-independent sr-only `<h1>` because it
   * also has a separate mobile-card title). Styling is identical either way.
   */
  as?: "h1" | "p";
}

export function DetailHero({
  breadcrumb,
  title,
  titleId,
  titleMaxWidth = "860px",
  showDivider = true,
  meta,
  as: TitleTag = "h1",
}: DetailHeroProps): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: DETAIL_HERO_MIN_HEIGHT, background: DETAIL_HERO_GRADIENT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.webp"
        alt=""
        className="pointer-events-none select-none absolute top-20 right-0 hidden xl:block"
        style={{ width: "265px", height: "265px", mixBlendMode: "lighten", opacity: 0.4 }}
        loading="lazy"
        decoding="async"
      />

      {/* Left-side decorative orb, mirrored from the right one. Hidden below xl to match the right orb's breakpoint. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          width: "265px",
          height: "265px",
          left: "-60px",
          bottom: "-40px",
          mixBlendMode: "lighten",
          opacity: 0.4,
          transform: "scaleX(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <HeroBreadcrumb
          items={breadcrumb}
          navClassName="pt-[calc(72px+env(safe-area-inset-top)+clamp(16px,3vw,40px)+var(--cs-header-extra))]"
        />

        <div className="flex justify-center mt-10">
          <HeroReveal y={50} duration={1.0}>
            <TitleTag
              id={titleId}
              className="font-display font-semibold text-white text-center"
              style={{ ...DETAIL_HERO_TITLE_STYLE, maxWidth: titleMaxWidth }}
            >
              {title}
            </TitleTag>
          </HeroReveal>
        </div>

        {showDivider && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/blogs/hero-divider-line.svg"
            alt=""
            aria-hidden
            className="w-full mt-[40px]"
            style={{ height: "1px", display: "block" }}
            loading="lazy"
            decoding="async"
          />
        )}

        {!meta && <div className="pb-[20px]" aria-hidden />}
      </div>

      {/*
       * Meta bar — rebounded to match the body section's content track instead
       * of the hero's wide outer container. On lg+, the bar spans from the
       * TOC sidebar's left edge (container's left gutter + 0) through the
       * body column's right edge (260px TOC + 48px gap + 680px body = 988px).
       * On smaller viewports the bar collapses to the article column width
       * (max 680px, centered) — matching what the user sees below the hero.
       */}
      {meta && (
        <div className="relative mx-auto max-w-[1120px] px-6">
          <div className="mx-auto lg:mx-0 w-full max-w-[680px] lg:max-w-[988px] flex flex-wrap items-center gap-x-4 gap-y-3 justify-center lg:justify-between pt-[14px] pb-[22px]">
            {meta}
          </div>
        </div>
      )}
    </section>
  );
}

export function DetailHeroMetaSeparator(): React.ReactElement {
  // Compact 1×20 vertical divider matching the careers detail hero. Sits
  // between meta items at lg+ where the bar flows horizontally; hidden on
  // smaller viewports where items wrap onto their own lines.
  return (
    <span
      aria-hidden
      className="hidden lg:inline-block shrink-0"
      style={{
        width: "1px",
        height: "20px",
        background: "rgba(255,255,255,0.18)",
      }}
    />
  );
}
