"use client";

import { usePathname } from "next/navigation";
import { LEGAL_SIDEBAR_ITEMS } from "./LegalSidebar";

/**
 * "Last updated" line for the legal hero. Reads the active route and pulls the
 * date from the shared legal-doc registry, so it stays in sync with the sidebar
 * while the hero remains a single persistent instance in the layout.
 */
export function LegalLastUpdated(): React.ReactElement | null {
  const pathname = usePathname();
  const item = LEGAL_SIDEBAR_ITEMS.find((entry) => entry.href === pathname);
  if (!item) return null;
  return (
    <p
      className="mt-4 text-center text-white/70"
      style={{ fontSize: "var(--fs-caption)" }}
    >
      Last updated: {item.updatedAt}
    </p>
  );
}
