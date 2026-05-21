import Link from "next/link";
import { RESOURCE_TYPES } from "@/lib/resources";

interface ResourceCenterSidebarProps {
  activeType: string;
  searchQuery: string;
}

export function ResourceCenterSidebar({
  activeType,
  searchQuery,
}: ResourceCenterSidebarProps): React.ReactElement {
  function hrefFor(type: string): string {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (searchQuery) params.set("q", searchQuery);
    return `/resource-center${params.size ? `?${params.toString()}` : ""}`;
  }

  return (
    <nav
      aria-label="Resource type filter"
      className="shrink-0 w-full lg:sticky lg:w-[295px] lg:self-start"
      style={{ top: "96px" }}
    >
      {/* MOBILE (< lg) — horizontal scrolling tab strip per Figma 444:401.
          No icons, no card chrome; underline marks the active tab. */}
      <div className="lg:hidden -mx-6 px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex items-center gap-6 border-b border-[rgba(17,17,17,0.10)] min-w-max">
          <li className="shrink-0">
            <Link
              href={hrefFor("")}
              aria-current={!activeType ? "page" : undefined}
              className="block py-3 font-display text-base font-medium tracking-[-0.02em] relative"
              style={{ color: !activeType ? "#4a3bf1" : "rgba(17,17,17,0.7)" }}
            >
              All
              {!activeType && (
                <span aria-hidden className="absolute inset-x-0 -bottom-px h-[2px] bg-[#4a3bf1]" />
              )}
            </Link>
          </li>
          {RESOURCE_TYPES.map(({ value, label }) => {
            const isActive = activeType === value;
            return (
              <li key={value} className="shrink-0">
                <Link
                  href={hrefFor(value)}
                  aria-current={isActive ? "page" : undefined}
                  className="block py-3 font-display text-base font-medium tracking-[-0.02em] relative whitespace-nowrap"
                  style={{ color: isActive ? "#4a3bf1" : "rgba(17,17,17,0.7)" }}
                >
                  {label}
                  {isActive && (
                    <span aria-hidden className="absolute inset-x-0 -bottom-px h-[2px] bg-[#4a3bf1]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* DESKTOP (lg+) — existing white card sidebar */}
      <div
        className="relative hidden lg:block"
        style={{
          maxHeight: "calc(100vh - 112px)",
          overflowY: "auto",
          background: "white",
          borderRadius: "16px",
          padding: "24px 16px",
          boxShadow:
            "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
        }}
      >
        {/* Heading */}
        <h3
          className="font-display text-2xl font-bold leading-[1.2] tracking-[-0.05em] mb-4"
          style={{ color: "#111" }}
        >
          Categories
        </h3>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(17,17,17,0.12)",
            marginBottom: "24px",
          }}
        />

        {/* Filter items */}
        <ul className="flex flex-col" style={{ gap: "20px" }}>
          {/* All */}
          <li>
            <Link
              href={hrefFor("")}
              className="flex items-center gap-4 no-underline"
              aria-current={!activeType ? "page" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  !activeType
                    ? "/images/resource-center/sidebar-icon-active.svg"
                    : "/images/resource-center/sidebar-icon.svg"
                }
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="pointer-events-none select-none shrink-0"
                loading="lazy"
                decoding="async"
              />
              <span
                className="font-display text-xl font-semibold leading-none tracking-[-0.05em] whitespace-nowrap"
                style={{ color: !activeType ? "#4a3bf1" : "#111" }}
              >
                All
              </span>
            </Link>
          </li>

          {RESOURCE_TYPES.map(({ value, label }) => {
            const isActive = activeType === value;
            return (
              <li key={value}>
                <Link
                  href={hrefFor(value)}
                  className="flex items-center gap-4 no-underline"
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      isActive
                        ? "/images/resource-center/sidebar-icon-active.svg"
                        : "/images/resource-center/sidebar-icon.svg"
                    }
                    alt=""
                    aria-hidden
                    width={40}
                    height={40}
                    className="pointer-events-none select-none shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    className="font-display text-xl font-semibold leading-none tracking-[-0.05em] whitespace-nowrap"
                    style={{ color: isActive ? "#4a3bf1" : "#111" }}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
