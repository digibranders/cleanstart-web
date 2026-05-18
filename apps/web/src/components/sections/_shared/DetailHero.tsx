import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export const DETAIL_HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 80%, #471FC3 100%)";

export const DETAIL_HERO_MIN_HEIGHT = "auto";

export const DETAIL_HERO_TITLE_STYLE: CSSProperties = {
  fontSize: "clamp(2rem, 4vw, 3.5rem)",
  lineHeight: 1.15,
  letterSpacing: "-0.03em",
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

      <div className="relative mx-auto max-w-[1276px] px-6">
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

        {meta && (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 pt-[22px] pb-[40px] sm:justify-between">
            {meta}
          </div>
        )}

        {!meta && <div className="pb-[40px]" aria-hidden />}
      </div>
    </section>
  );
}

function Breadcrumb({ items }: { items: DetailHeroCrumb[] }): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-0 pt-[58px]">
      <Link
        href="/"
        className="flex items-center justify-center w-8 h-8 rounded-full"
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
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center">
            <BreadcrumbChevron />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center h-8 px-2 rounded-full text-xs leading-[1.4]"
                style={{ color: "#98ACC3" }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="flex items-center h-8 px-2 max-w-[280px] truncate text-xs leading-[1.4]"
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/blogs/hero-meta-separator.svg"
      alt=""
      aria-hidden
      width={1}
      height={46}
      className="mx-4 shrink-0 hidden lg:block"
      loading="lazy"
      decoding="async"
    />
  );
}
