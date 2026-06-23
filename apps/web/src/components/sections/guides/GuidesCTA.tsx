"use client";

import { NewsletterConsent } from "@/components/forms/NewsletterConsent";
import { useNewsletterSignup } from "@/lib/leads/useNewsletterSignup";

/**
 * Guides newsletter CTA, rendered inside the Footer's fixed 1276×330 /
 * radius-40 slot. White-card treatment mirroring the CleanSight CTA
 * (purple grid + pink corner glows on white), with the decorative cubes
 * dropped to the extreme bottom of the card.
 */
export function GuidesCTA(): React.ReactElement {
  const { emailRef, consentRef, submitted, submitting, error, handleSubmit } = useNewsletterSignup();

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Decorative radial-faded purple grid. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
          opacity: 0.5,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Ellipse glow — top-left. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          left: "-158px",
          top: "-134px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 2,
        }}
      />

      {/* Ellipse glow — bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          right: "-145px",
          bottom: "-141px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 1,
        }}
      />

      {/* Decorative cubes — pinned to the extreme bottom of the card. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute block"
        style={{
          left: "-20px",
          bottom: "-40px",
          width: "176px",
          height: "178px",
          opacity: 0.75,
          zIndex: 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/guides/cta-cube-left2.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          left: "1070px",
          bottom: "-40px",
          width: "176px",
          height: "178px",
          opacity: 0.75,
          zIndex: 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/guides/cta-cube-right2.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <div
          className="flex flex-col lg:flex-row items-center lg:items-start gap-y-4 lg:gap-y-0 lg:gap-x-[clamp(40px,9vw,115px)] w-full"
          style={{ maxWidth: "1047px" }}
        >
          <div
            className="font-display w-full lg:w-auto lg:max-w-[401px] text-center lg:text-left"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111111",
            }}
          >
            Stay Ahead of Container Security Threats
          </div>

          <div
            className="flex flex-col items-center lg:items-start w-full max-w-[493px]"
            style={{ gap: "24px" }}
          >
            <p
              className="font-normal text-center lg:text-left"
              style={{
                fontSize: "var(--cta-card-desc)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                color: "rgba(17,17,17,0.8)",
              }}
            >
              Get the latest research, insights, and updates straight to your
              inbox
            </p>

            {submitted ? (
              <p
                className="text-base font-medium"
                style={{ color: "rgba(17,17,17,0.8)" }}
              >
                Thanks! You&apos;re subscribed.
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 w-full"
                aria-label="Newsletter subscription"
              >
                <div className="relative flex items-center w-full">
                  <div
                    className="relative overflow-hidden flex-1 min-w-0"
                    style={{
                      height: "44px",
                      background: "#ffffff",
                      border: "1px solid rgba(17,17,17,0.15)",
                      borderRight: "none",
                      borderRadius: "12px 0 0 12px",
                    }}
                  >
                    <input
                      ref={emailRef}
                      type="email"
                      name="email"
                      required
                      placeholder="Enter your email"
                      className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-base leading-[1.5] outline-none"
                      style={{
                        fontWeight: 400,
                        color: "#111111",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting || undefined}
                    className="cs-btn-blue shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      ["--cs-btn-h" as string]: "44px",
                      ["--cs-btn-px" as string]: "16px",
                      ["--cs-btn-fs" as string]: "16px",
                      borderRadius: "0 12px 12px 0",
                    }}
                  >
                    {submitting ? "Subscribing…" : "Subscribe"}
                  </button>
                </div>
                <NewsletterConsent ref={consentRef} />
              </form>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium" style={{ color: "#b91c1c" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
