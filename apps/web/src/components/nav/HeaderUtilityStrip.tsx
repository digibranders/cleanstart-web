import Link from "next/link";
import { GraduationCap } from "lucide-react";

/**
 * Desktop-only utility strip rendered above the main nav bar (lg+). Same
 * translucent header background — no separate colour/band, just a hairline
 * divider for hierarchy. Holds the CleanStart Academy cross-sell link (painted
 * in the Academy brand cyan #59c5ed) plus a secondary Contact Us CTA. Mirrored
 * in MobileNav for sub-lg viewports.
 */
export function HeaderUtilityStrip() {
  return (
    <>
      <Link
        href="https://academy.cleanstart.com"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-semibold tracking-[-0.01em] text-[#59c5ed] transition-colors hover:text-[#7dd3fc] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59c5ed]"
        style={{
          fontSize: "var(--fs-body-sm)",
          textShadow: "0 0 14px rgba(89,197,237,0.35)",
        }}
      >
        <GraduationCap className="size-4 shrink-0" aria-hidden />
        CleanStart Academy
      </Link>
      <Link
        href="/contact-us"
        className="inline-flex items-center rounded-md border border-white/25 bg-white/[0.05] px-3 font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
        style={{ height: "28px", fontSize: "var(--fs-caption)" }}
      >
        Contact Us
      </Link>
    </>
  );
}
