
import Image from "next/image";

/**
 * Section: "Ready to Secure Your Container Infrastructure?" CTA
 * Figma Group 2085665042 (108:8594) — card 1276×335 with kubr bird peeking from top.
 *
 * - Card: linear gradient #131E8F → #471EC0, corner radius 40
 * - Title: Manrope Bold 55px, white, left-aligned
 * - Description: Sora Regular 21px, white, right column
 * - Button: white-ish glassy bg, "Get a Demo" + arrow icon
 * - Bird image (cta-kubr.png): 304×206, sits ABOVE the card peeking out from the top
 */

export function ReadyToSecureCTA() {
  return (
    <section
      className="relative w-full pt-32 mb-[-90px]"
      aria-labelledby="cta-title"
    >
      {/* Section background — transparent at the top so the lavender blob
          bleeding from the Resources section above remains visible (no hard
          boundary line), solid #F6F6F6 through the middle, then fades to
          transparent at the bottom so the Footer's dark gradient bleeds in
          smoothly. The card visually overlaps the Footer by 90px (mb-[-90px]). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(246,246,246,0) 0%, #F6F6F6 28%, #F6F6F6 60%, rgba(246,246,246,0) 100%)",
        }}
      />

      <div className="relative px-6">
        {/* Wrapper for card + bird — z-20 keeps the card on top of the footer's purple */}
        <div className="relative z-20 mx-auto w-full max-w-[1276px]">
          {/* Bird — Figma: 304×206, peeking 154px above the card top (52px overlap into card) */}
          <div
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={{
              left: "63px",
              bottom: "calc(100% - 52px)",
              width: "304px",
              height: "206px",
            }}
          >
            <Image
              src="/images/cta-kubr.png"
              alt=""
              width={304}
              height={206}
              className="h-full w-full object-contain"
              priority={false}
            />
          </div>

          {/* Card — Figma 108:8595 exact: 1276×335, gradient 180deg
              (top #131E8F → bottom #471EC0), border-radius 40, asymmetric
              padding 80/145/80/122 (top/right/bottom/left). Content is
              top-aligned per Figma — title left column (401×165) and right
              column (description 493×87 + 18px gap + button) both anchor
              to the top of the content area. */}
          <div
            className="relative grid grid-cols-1 items-start gap-y-8 overflow-hidden p-8 md:gap-y-0 md:p-12 lg:items-start lg:[grid-template-columns:401px_493px] lg:[column-gap:115px] lg:[padding:80px_145px_80px_122px]"
            style={{
              borderRadius: "40px",
              background:
                "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)",
              height: "335px",
            }}
          >
            {/* Decorative purple radial blob in the background */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: "-10%",
                top: "-30%",
                width: "640px",
                height: "640px",
                background:
                  "radial-gradient(closest-side, rgba(127,82,255,0.55) 0%, rgba(127,82,255,0) 70%)",
              }}
            />

            {/* Title — Figma 108:8596 style_A0S8KL: Manrope Bold 55px,
                line-height 100%, letter-spacing -5%, color white, 401×165. */}
            <h2
              id="cta-title"
              className="relative z-10 font-display text-display-sm font-bold leading-none tracking-[-0.05em] text-white"
              style={{ maxWidth: "401px" }}
            >
              Ready to Secure Your Container Infrastructure?
            </h2>

            {/* Right column — description + button. Figma 108:8597 description
                style_LAOX54: Sora Regular 21px, line-height 140%, ls -4%,
                white opacity 0.8, 493×87. Gap to button = 18px per Figma. */}
            <div className="relative z-10 flex flex-col items-start gap-[18px]">
              <p
                className="text-[1.3125rem] font-normal leading-[1.4] tracking-[-0.04em] text-white/80"
                style={{ maxWidth: "493px" }}
              >
                Start with zero-CVE hardened images. Deploy faster with
                confidence knowing your containers are secured from the ground
                up.
              </p>

              <a
                href="#get-a-demo"
                className="cs-btn-glass"
                style={{
                  ["--cs-btn-h" as string]: "43px",
                  ["--cs-btn-px" as string]: "18px",
                  ["--cs-btn-fs" as string]: "18px",
                }}
              >
                <span>Get a Demo</span>
                <svg
                  className="cs-cta-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 9h11m0 0l-4-4m4 4l-4 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
