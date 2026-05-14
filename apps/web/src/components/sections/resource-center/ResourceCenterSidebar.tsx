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
      className="shrink-0"
      style={{ width: "295px" }}
    >
      {/* White card background */}
      <div
        className="relative"
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px 16px",
          boxShadow:
            "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
        }}
      >
        {/* Heading */}
        <p
          className="font-sans font-bold mb-4"
          style={{
            fontSize: "24px",
            lineHeight: "1.2",
            color: "#111",
            letterSpacing: "-0.05em",
          }}
        >
          Categories
        </p>

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
                className="font-sans font-semibold whitespace-nowrap"
                style={{
                  fontSize: "20px",
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                  ...(
                    !activeType
                      ? {
                          backgroundImage:
                            "linear-gradient(92.3deg, #9a51ff 1.76%, #2cc1eb 98.78%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }
                      : { color: "#111" }
                  ),
                }}
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
                    className="font-sans font-semibold whitespace-nowrap"
                    style={{
                      fontSize: "20px",
                      lineHeight: 1,
                      letterSpacing: "-0.05em",
                      ...(
                        isActive
                          ? {
                              backgroundImage:
                                "linear-gradient(92.3deg, #9a51ff 1.76%, #2cc1eb 98.78%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }
                          : { color: "#111" }
                      ),
                    }}
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
