"use client";

import { useNewsletterSignup } from "@/lib/leads/useNewsletterSignup";

/**
 * Guides newsletter CTA, rendered inside the Footer's fixed 1276×330 /
 * radius-40 slot. Independent of the Blogs CTA — own file, own assets.
 */
export function GuidesCTA(): React.ReactElement {
  const { emailRef, submitted, error, handleSubmit } = useNewsletterSignup();

  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(180deg, #471ec0 0%, #131e8f 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute block"
        style={{
          left: "-20px",
          top: "-20px",
          width: "176px",
          height: "178px",
          opacity: 0.75,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/guides/cta-cube-left2.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          left: "1070px",
          top: "-20px",
          width: "176px",
          height: "178px",
          opacity: 0.75,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/guides/cta-cube-right2.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className="flex flex-col lg:flex-row items-center lg:items-start gap-y-4 lg:gap-y-0 lg:gap-x-[clamp(40px,9vw,115px)] w-full"
          style={{ maxWidth: "1047px" }}
        >
          <div
            className="font-display font-bold text-white w-full lg:w-auto lg:max-w-[401px] text-center lg:text-left"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Stay Ahead of Container Security Threats
          </div>

          <div
            className="flex flex-col items-center lg:items-start w-full max-w-[493px]"
            style={{ gap: "24px" }}
          >
            <p
              className="font-normal text-white text-center lg:text-left"
              style={{
                fontSize: "var(--cta-card-desc)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                opacity: 0.8,
              }}
            >
              Get the latest research, insights, and updates straight to your
              inbox
            </p>

            {submitted ? (
              <p
                className="text-base font-medium text-white"
                style={{ opacity: 0.9 }}
              >
                Thanks! You&apos;re subscribed.
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center w-full"
                aria-label="Newsletter subscription"
              >
                <div
                  className="relative overflow-hidden flex-1 min-w-0"
                  style={{
                    height: "44px",
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(237,203,255,0.6)",
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
                    className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-white placeholder:text-white/60 text-base leading-[1.5] outline-none"
                    style={{ fontWeight: 400 }}
                  />
                </div>

                <button
                  type="submit"
                  className="cs-btn-glass cs-btn-glass--no-lift shrink-0"
                  style={{
                    ["--cs-btn-px" as string]: "16px",
                    ["--cs-btn-fs" as string]: "16px",
                    borderRadius: "0 12px 12px 0",
                    borderLeft: "none",
                  }}
                >
                  Subscribe
                </button>
              </form>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-white" style={{ opacity: 0.9 }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
