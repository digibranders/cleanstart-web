import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export const DETAIL_HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 80%, #471FC3 100%)";

export const DETAIL_HERO_MIN_HEIGHT = "auto";

// Consumes the --text-hero-utility token (32 → 48 px, clamp below lg / fixed at lg+).
// Line-height kept at 1.15 (slightly looser than the marketing-hero 1.05) because
// listing and article-detail titles can wrap to multiple lines.
export const DETAIL_HERO_TITLE_STYLE: CSSProperties = {
  fontSize: "var(--text-hero-utility)",
  lineHeight: 1.15,
  letterSpacing: "var(--text-hero-utility-ls)",
};

export interface DetailHeroCrumb {
  label: string;
  href?: string;
}

interface DetailHeroProps {
  breadcrumb: DetailHeroCrumb[];
  title: string;
  titleId?: string;
  titleMaxWidth?: string;
  showDivider?: boolean;
  meta?: ReactNode;
}

export function DetailHero({
  breadcrumb,
  title,
  titleId,
  titleMaxWidth = "860px",
  showDivider = true,
  meta,
}: DetailHeroProps): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: DETAIL_HERO_MIN_HEIGHT, background: DETAIL_HERO_GRADIENT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute top-20 right-0 hidden xl:block"
        style={{ width: "265px", height: "265px", mixBlendMode: "lighten", opacity: 0.4 }}
        loading="lazy"
        decoding="async"
      />

      {/* Decorative cube — left side, mirrored from right orb. Hidden below xl to match the right orb's breakpoint. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
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
        <Breadcrumb items={breadcrumb} />

        <div className="flex justify-center mt-10">
          <h1
            id={titleId}
            className="font-display font-semibold text-white text-center"
            style={{ ...DETAIL_HERO_TITLE_STYLE, maxWidth: titleMaxWidth }}
          >
            {title}
          </h1>
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

function Breadcrumb({ items }: { items: DetailHeroCrumb[] }): React.ReactElement {
  // On mobile (<sm) we collapse to `Home > [Last]`: intermediate crumbs are
  // hidden to avoid the orphan-chevron wrap and to free vertical space. The
  // full chain is in the DOM for screen readers and shows from sm+.
  const lastIdx = items.length - 1;
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-nowrap items-center gap-0 overflow-x-auto pt-[calc(72px+env(safe-area-inset-top)+clamp(16px,3vw,40px))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:gap-y-1"
    >
      <Link
        href="/"
        className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full shrink-0"
        aria-label="Home"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
            stroke="rgba(152,172,195,0.8)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V12h6v9"
            stroke="rgba(152,172,195,0.8)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === lastIdx;
        // Hide every non-last crumb on mobile via `hidden sm:flex`. Last stays
        // visible. Screen readers still see the full chain.
        return (
          <span
            key={`${item.label}-${idx}`}
            className={isLast ? "flex items-center min-w-0" : "hidden sm:flex items-center"}
          >
            <BreadcrumbChevron />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center h-11 px-2 rounded-full text-xs leading-[1.4]"
                style={{ color: "#98ACC3" }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="flex items-center h-9 sm:h-11 px-2 min-w-0 max-w-[220px] sm:max-w-[280px] truncate text-xs leading-[1.4]"
                style={{ color: "#BFCCDA" }}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function BreadcrumbChevron(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M9 18l6-6-6-6"
        stroke="rgba(152,172,195,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
