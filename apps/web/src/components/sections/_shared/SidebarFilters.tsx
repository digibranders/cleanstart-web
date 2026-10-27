import Link from "next/link";

/**
 * Listing filter sidebar shared by /careers and /advisories: a sticky white
 * card of link-based filter groups at lg+, and horizontally scrolling pill
 * strips below lg. Filters are plain links, so the URL is the state.
 */

/**
 * Desktop filter card. Sticks below the 80px header with 16px breathing room.
 * When the filter list overflows the viewport (short screens, many options),
 * the card scrolls internally, with a slim scrollbar so the overflow is
 * discoverable and the cut-off items stay reachable.
 */
export function FilterSidebarCard({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className="relative hidden lg:block lg:sticky [scrollbar-width:thin] [scrollbar-color:rgba(17,17,17,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 hover:[&::-webkit-scrollbar-thumb]:bg-black/25"
      style={{
        top: "96px",
        maxHeight: "calc(100vh - 112px)",
        overflowY: "auto",
        background: "white",
        borderRadius: "16px",
        padding: "18px 16px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
      }}
    >
      {children}
    </div>
  );
}

export interface FilterGroupItem {
  key: string;
  label: string;
  href: string;
  active: boolean;
  icon?: React.ReactNode;
}

export function FilterGroup({
  heading,
  items,
}: {
  heading: string;
  items: FilterGroupItem[];
}): React.ReactElement {
  return (
    <>
      <p
        className="font-sans uppercase"
        style={{
          fontSize: "var(--fs-badge)",
          letterSpacing: "0.08em",
          color: "rgba(17,17,17,0.6)",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        {heading}
      </p>
      <ul className="flex flex-col" style={{ gap: "6px" }}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className="flex items-center gap-2 no-underline transition-colors"
              style={{
                height: "34px",
                padding: "0 12px",
                borderRadius: "10px",
                background: item.active ? "rgba(74,59,241,0.08)" : "#ffffff",
                border: `1px solid ${item.active ? "rgba(74,59,241,0.35)" : "rgba(17,17,17,0.08)"}`,
                color: item.active ? "#4a3bf1" : "#111",
                fontWeight: 500,
              }}
            >
              {item.icon ? (
                <span
                  aria-hidden
                  className="flex items-center justify-center shrink-0"
                  style={{ width: "16px", height: "16px" }}
                >
                  {item.icon}
                </span>
              ) : null}
              <span
                className="font-sans"
                style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.2 }}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export interface MobileTab {
  value: string;
  label: string;
  active: boolean;
}

export function MobileTabStrip({
  label,
  items,
  buildHref,
}: {
  label: string;
  items: MobileTab[];
  buildHref: (value: string) => string;
}): React.ReactElement {
  return (
    <div>
      <p
        className="font-sans uppercase px-1"
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          color: "rgba(17,17,17,0.6)",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <div className="-mx-6 px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex items-center gap-2 min-w-max">
          {items.map((item) => (
            <li key={item.value || "__all"} className="shrink-0">
              <Link
                href={buildHref(item.value)}
                aria-current={item.active ? "page" : undefined}
                className="block whitespace-nowrap font-sans"
                style={{
                  fontSize: "var(--fs-body-sm)",
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${item.active ? "#4a3bf1" : "rgba(17,17,17,0.12)"}`,
                  color: item.active ? "#4a3bf1" : "rgba(17,17,17,0.78)",
                  background: item.active ? "rgba(74,59,241,0.08)" : "white",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
