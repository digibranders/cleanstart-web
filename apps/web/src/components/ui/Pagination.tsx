import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function computePages(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: PageItem[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) items.push("ellipsis-left");
  for (let p = left; p <= right; p += 1) items.push(p);
  if (right < totalPages - 1) items.push("ellipsis-right");

  items.push(totalPages);
  return items;
}

const BUTTON_BASE: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
  // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
  fontSize: "14px",
  lineHeight: 1,
  background: "#FFFFFF",
  color: "#111111",
};

const BUTTON_ACTIVE: React.CSSProperties = {
  ...BUTTON_BASE,
  borderColor: "#4A3BF1",
  color: "#4A3BF1",
  fontWeight: 600,
};

const BUTTON_DISABLED: React.CSSProperties = {
  ...BUTTON_BASE,
  color: "rgba(17,17,17,0.32)",
  background: "#F3F4F6",
  cursor: "not-allowed",
};

function ChevronLeft(): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight(): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  className,
}: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1) return null;

  const items = computePages(currentPage, totalPages);
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center ${className ?? ""}`.trim()}
      style={{ gap: "8px", marginTop: "64px" }}
    >
      {prevDisabled ? (
        <span
          aria-disabled
          aria-label="Previous page"
          className="flex items-center justify-center select-none"
          style={BUTTON_DISABLED}
        >
          <ChevronLeft />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage - 1)}
          aria-label="Previous page"
          rel="prev"
          className="flex items-center justify-center transition-colors hover:border-[#4A3BF1] hover:text-[#4A3BF1]"
          style={BUTTON_BASE}
        >
          <ChevronLeft />
        </Link>
      )}

      {items.map((item) => {
        if (item === "ellipsis-left" || item === "ellipsis-right") {
          return (
            <span
              key={item}
              aria-hidden
              className="flex items-center justify-center select-none"
              style={{
                width: "36px",
                height: "36px",
                color: "rgba(17,17,17,0.54)",
                // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
                fontSize: "14px",
              }}
            >
              …
            </span>
          );
        }

        const active = item === currentPage;
        return (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={active ? "page" : undefined}
            aria-label={`Go to page ${item}`}
            className="flex items-center justify-center transition-colors hover:border-[#4A3BF1] hover:text-[#4A3BF1]"
            style={active ? BUTTON_ACTIVE : BUTTON_BASE}
          >
            {item}
          </Link>
        );
      })}

      {nextDisabled ? (
        <span
          aria-disabled
          aria-label="Next page"
          className="flex items-center justify-center select-none"
          style={BUTTON_DISABLED}
        >
          <ChevronRight />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage + 1)}
          aria-label="Next page"
          rel="next"
          className="flex items-center justify-center transition-colors hover:border-[#4A3BF1] hover:text-[#4A3BF1]"
          style={BUTTON_BASE}
        >
          <ChevronRight />
        </Link>
      )}
    </nav>
  );
}
