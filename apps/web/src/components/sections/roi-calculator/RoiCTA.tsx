import type React from "react";
import Link from "next/link";

/*
 * Page-end CTA — paints inside the Footer's card slot (geometry owned by
 * Footer.tsx). Mirrors the CisoCTA recipe: white card, soft brand glows, a
 * mobile absolute layout and a desktop flex layout.
 */
export function RoiCTA(): React.ReactElement {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#ffffff" }}>
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{ left: "-139px", top: "-168px", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(155, 181, 255, 0.4)", filter: "blur(90px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{ right: "-120px", bottom: "-150px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(214, 178, 255, 0.32)", filter: "blur(110px)" }}
      />

      {/* Mobile */}
      <div className="sm:hidden absolute inset-0">
        <p className="absolute text-center" style={{ top: "32px", left: "50%", transform: "translateX(-50%)", width: "270px", fontFamily: "var(--font-display)", fontSize: "var(--cta-card-title)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#111" }}>
          See it on your own runtime
        </p>
        <p className="absolute text-center" style={{ top: "150px", left: "50%", transform: "translateX(-50%)", width: "270px", fontFamily: "var(--font-sans)", fontSize: "var(--cta-card-desc)", fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.02em", color: "rgba(17,17,17,0.8)" }}>
          The numbers above are modelled. Let&rsquo;s measure the real reduction against your images.
        </p>
        <div className="absolute" style={{ top: "262px", left: "50%", transform: "translateX(-50%)" }}>
          <Link href="/book-a-demo" className="cs-btn-blue" style={{ ["--cs-btn-px" as string]: "24px", ["--cs-btn-fs" as string]: "16px", ["--cs-btn-h" as string]: "44px", whiteSpace: "nowrap" }}>
            Book a demo
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex absolute inset-0 flex-row items-start overflow-hidden" style={{ padding: "clamp(28px, 4vw, 48px) clamp(32px, 6.35vw, 122px)", gap: "clamp(24px, 2.2vw, 32px)" }}>
        <p className="relative flex-shrink-0" style={{ fontFamily: "var(--font-display)", fontSize: "var(--cta-card-title)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: "min(360px, 100%)", textWrap: "balance", color: "#111" }}>
          See it on your own runtime
        </p>
        <div className="relative flex flex-col" style={{ maxWidth: "min(540px, 100%)", gap: "clamp(16px, 1.25vw, 24px)" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--cta-card-desc)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.4, color: "rgba(17,17,17,0.8)", textWrap: "balance" }}>
            The numbers above are modelled from your inputs. Let&rsquo;s measure the real vulnerability, patch, and footprint reduction against your actual images.
          </p>
          <Link href="/book-a-demo" className="cs-btn-blue self-start" style={{ ["--cs-btn-px" as string]: "18px", ["--cs-btn-fs" as string]: "18px" }}>
            <span>Book a demo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
