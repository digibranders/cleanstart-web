import Link from "next/link";
import { GraduationCap } from "lucide-react";

/**
 * Brand lockup for the Academy cross-sell link, matching academy.cleanstart.com:
 * "CleanStart" painted with the Academy gradient (cyan → blue → violet), the
 * word "Academy" in white. Gradient string copied verbatim from the live site's
 * `.gradient-text` rule.
 */
const ACADEMY_GRADIENT =
  "linear-gradient(135deg, #59C5ED 0%, #4168DB 50%, #5D04D8 100%)";

/**
 * Desktop-only utility strip rendered above the main nav bar (lg+). Same
 * translucent header background — no separate colour/band, just a hairline
 * divider for hierarchy. Holds the CleanStart Academy cross-sell link plus a
 * secondary Contact Us CTA. Mirrored in MobileNav for sub-lg viewports.
 */
export function HeaderUtilityStrip() {
  return (
    <>
      <Link
        href="https://academy.cleanstart.com"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-semibold tracking-[-0.01em] text-white transition-opacity hover:opacity-80 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59c5ed]"
        style={{ fontSize: "var(--fs-body-sm)" }}
      >
        <GraduationCap className="size-4 shrink-0 text-[#59C5ED]" aria-hidden />
        <span
          style={{
            backgroundImage: ACADEMY_GRADIENT,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CleanStart
        </span>
        <span>Academy</span>
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
