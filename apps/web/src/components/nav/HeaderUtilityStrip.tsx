import Link from "next/link";

/**
 * Desktop-only utility strip rendered above the main nav bar (lg+). Same
 * translucent header background — no separate colour/band, just a hairline
 * divider for hierarchy. A single prominent cross-sell link to CleanStart
 * Academy, painted in the Academy brand cyan (#59c5ed). Mirrored in MobileNav
 * for sub-lg viewports.
 */
export function HeaderUtilityStrip() {
  return (
    <Link
      href="https://academy.cleanstart.com"
      target="_blank"
      rel="noreferrer"
      className="font-semibold tracking-[-0.01em] text-[#59c5ed] transition-colors hover:text-[#7dd3fc] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59c5ed]"
      style={{
        fontSize: "var(--fs-body-sm)",
        textShadow: "0 0 14px rgba(89,197,237,0.35)",
      }}
    >
      CleanStart Academy
    </Link>
  );
}
