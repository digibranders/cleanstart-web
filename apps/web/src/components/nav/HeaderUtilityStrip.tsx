import Link from "next/link";

/**
 * Desktop-only utility strip rendered above the main nav bar (lg+).
 * Same translucent header background — no separate colour/band, just a
 * hairline divider for hierarchy. Login is a compact ghost button; Academy
 * is a placeholder pending its destination, Images points at the live
 * registry. Mirror these entries in MobileNav for sub-lg viewports.
 */

const STRIP_LINK =
  "font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC]";

export function HeaderUtilityStrip() {
  return (
    <>
      <Link
        href="https://academy.cleanstart.com"
        target="_blank"
        rel="noreferrer"
        className={STRIP_LINK}
        style={{ fontSize: "var(--fs-caption)" }}
      >
        Academy
      </Link>
      <Link
        href="https://images.cleanstart.com"
        target="_blank"
        rel="noreferrer"
        className={STRIP_LINK}
        style={{ fontSize: "var(--fs-caption)" }}
      >
        Images
      </Link>
      <Link
        href="#"
        className="inline-flex items-center rounded-md border border-white/25 bg-white/[0.05] px-3 font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
        style={{ height: "28px", fontSize: "var(--fs-caption)" }}
      >
        Login
      </Link>
    </>
  );
}
