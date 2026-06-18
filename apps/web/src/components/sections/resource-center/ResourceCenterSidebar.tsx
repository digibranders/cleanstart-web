import Link from "next/link";
import { RESOURCE_TYPES } from "@/lib/resources-utils";

interface ResourceCenterSidebarProps {
  activeType: string;
  searchQuery: string;
}

/**
 * One distinct, on-theme line icon per category. Keyed by the resource-type
 * value ("" = the "All" entry). Each icon strokes `currentColor`, so the
 * active/inactive colour is set once on the parent link and inherited.
 */
function CategoryIcon({ type }: { type: string }): React.ReactElement {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "pointer-events-none select-none shrink-0",
  };

  switch (type) {
    case "whitepaper":
      return (
        <svg {...common}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      );
    case "ebook":
      return (
        <svg {...common}>
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      );
    case "datasheet":
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M12 3v18" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
        </svg>
      );
    case "architecture-insights":
      return (
        <svg {...common}>
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
          <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      );
  }
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
        <h3
          className="font-display text-2xl font-semibold leading-[1.2] tracking-[-0.05em] mb-4"
          style={{ color: "#111" }}
        >
          Categories
        </h3>

        <div
          style={{
            height: "1px",
            background: "rgba(17,17,17,0.12)",
            marginBottom: "24px",
          }}
        />

        <ul className="flex flex-col" style={{ gap: "16px" }}>
          <li>
            <Link
              href={hrefFor("")}
              className="flex items-center gap-3 no-underline"
              aria-current={!activeType ? "page" : undefined}
              style={{ color: !activeType ? "#4a3bf1" : "#111" }}
            >
              <CategoryIcon type="" />
              <span className="font-display text-base font-semibold leading-none tracking-[-0.05em] whitespace-nowrap">
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
                  className="flex items-center gap-3 no-underline"
                  aria-current={isActive ? "page" : undefined}
                  style={{ color: isActive ? "#4a3bf1" : "#111" }}
                >
                  <CategoryIcon type={value} />
                  <span className="font-display text-base font-semibold leading-none tracking-[-0.05em] whitespace-nowrap">
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
