import Link from "next/link";
import type { BreadcrumbCrumb } from "@cleanstart/schema/builders";

/** Same shape as the JSON-LD crumb so one trail array drives both. */
export type HeroCrumb = BreadcrumbCrumb;

interface HeroBreadcrumbProps {
  items: HeroCrumb[];
  /**
   * Extra classes for the `<nav>`. Each hero positions the bar below its own
   * fixed header here (the pt is hero-specific), so the component owns only the
   * crumb logic + styling, not the page-level offset.
   */
  navClassName?: string;
}

/**
 * The single breadcrumb used by every dark detail hero (blog, guide, news,
 * event, career, resource). One implementation = no per-page drift.
 *
 * Trail shape is always `Home › <Listing> › <Title>`: every crumb is a real,
 * navigable page, so the visible trail matches the page's `BreadcrumbList`
 * JSON-LD exactly (Google requires structured-data breadcrumbs to mirror the
 * visible ones). There is no synthetic "category" crumb — nav groupings that
 * have no landing page are not breadcrumbs.
 *
 * Mobile (<sm): parent-only. The current-page (last) crumb is hidden so the bar
 * reads `Home › <Parent>` — the one useful up-level link — instead of
 * `Home › <Title>`, which duplicates the H1 directly below it. The full chain
 * stays in the DOM (and in JSON-LD) for screen readers and crawlers.
 */
export function HeroBreadcrumb({ items, navClassName = "" }: HeroBreadcrumbProps): React.ReactElement {
  const lastIdx = items.length - 1;
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible ${navClassName}`}
    >
      <ol className="flex flex-nowrap items-center sm:flex-wrap sm:gap-y-1">
        <li className="flex items-center">
          <Link
            href="/"
            aria-label="Home"
            className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
          >
            <HomeIcon />
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === lastIdx;
          // Hide the current page only when there is a parent to fall back to, so
          // a single-crumb trail never collapses to a lone Home icon on mobile.
          const hideOnMobile = isLast && items.length > 1;
          return (
            <li
              key={`${item.name}-${idx}`}
              className={`items-center min-w-0 ${hideOnMobile ? "hidden sm:flex" : "flex"}`}
            >
              <Chevron />
              {item.path && !isLast ? (
                <Link
                  href={item.path}
                  className="flex items-center h-11 px-2 rounded-full text-xs leading-[1.4] whitespace-nowrap"
                  style={{ color: "#98ACC3" }}
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  className="flex items-center h-11 px-2 min-w-0 max-w-[220px] sm:max-w-[300px] truncate text-xs leading-[1.4]"
                  style={{ color: "#BFCCDA" }}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function HomeIcon(): React.ReactElement {
  return (
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
  );
}

function Chevron(): React.ReactElement {
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
