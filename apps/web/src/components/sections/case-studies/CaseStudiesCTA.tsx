import type React from "react";
import Link from "next/link";

/**
 * Inner content for the /case-studies footer CTA, rendered inside the Footer's
 * fixed 1276x330 / radius-40 slot.
 *
 * The ask matches where the reader is: they have just read three customers'
 * numbers, so the next step is seeing the same comparison on their own images,
 * not a newsletter.
 */
export function CaseStudiesCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #471ec0 0%, #131e8f 100%)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/cta-cube-left2.webp"
        alt=""
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute select-none"
        style={{ left: "-46px", top: "-42px", width: "176px", height: "178px", opacity: 0.6 }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/cta-cube-right2.webp"
        alt=""
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute hidden select-none sm:block"
        style={{ right: "-46px", bottom: "-44px", width: "176px", height: "178px", opacity: 0.6 }}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className="flex w-full flex-col items-center gap-y-5 text-center lg:flex-row lg:items-center lg:gap-x-[clamp(40px,7vw,96px)] lg:gap-y-0 lg:text-left"
          style={{ maxWidth: "1047px" }}
        >
          <p
            className="w-full font-display text-white lg:w-auto lg:max-w-[420px]"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: "var(--cta-card-title-weight)",
              letterSpacing: "var(--cta-card-title-ls)",
              lineHeight: "var(--cta-card-title-lh)",
              textWrap: "balance",
            }}
          >
            See what this looks like on your images
          </p>

          <div className="flex w-full max-w-[493px] flex-col items-center gap-6 lg:items-start">
            <p
              className="font-sans text-white/80"
              style={{
                fontSize: "var(--cta-card-desc)",
                fontWeight: 400,
                letterSpacing: "var(--cta-card-desc-ls)",
                lineHeight: "var(--cta-card-desc-lh)",
              }}
            >
              Bring a workload you already run. We will show you the same
              before-and-after these teams measured, against your own images.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/book-a-demo"
                className="cs-btn-glass"
                style={
                  {
                    "--cs-btn-fs": "16px",
                    "--cs-btn-h": "44px",
                    "--cs-btn-px": "22px",
                  } as React.CSSProperties
                }
              >
                Book a demo
              </Link>
              <Link
                href="/contact-us"
                className="font-sans font-medium text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={{ fontSize: "16px" }}
              >
                Talk to our team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
