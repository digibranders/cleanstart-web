"use client";

import { usePathname } from "next/navigation";

export interface LegalDateItem {
  href: string;
  /** Pre-formatted effective date, e.g. "June 4, 2026". */
  effectiveDate: string;
}

/**
 * "Effective" date for the legal hero. Reads the active route and pulls the
 * pre-formatted date from the list the layout passes down, so the hero stays a
 * single persistent instance while the date swaps on client-side navigation.
 */
export function LegalLastUpdated({
  items,
}: {
  items: LegalDateItem[];
}): React.ReactElement | null {
  const pathname = usePathname();
  const item = items.find((entry) => entry.href === pathname);
  if (!item?.effectiveDate) return null;
  return (
    <p
      className="mt-4 text-center text-white/70"
      style={{ fontSize: "var(--fs-caption)" }}
    >
      Effective: {item.effectiveDate}
    </p>
  );
}
