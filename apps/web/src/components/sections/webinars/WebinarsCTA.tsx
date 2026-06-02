"use client";

import { useNewsletterSignup } from "@/lib/leads/useNewsletterSignup";

/**
 * Newsletter CTA for the Webinars page, rendered inside the Footer's CTA slot.
 */
export function WebinarsCTA(): React.ReactElement {
  const { emailRef, submitted, error, handleSubmit } = useNewsletterSignup();

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #471ec0 0%, #131e8f 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          left: "-45px",
          top: "230px",
          width: "176px",
          height: "178px",
          opacity: 0.75,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/cta-cube-left2.png"
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
          left: "1145px",
          top: "-40px",
          width: "176px",
          height: "178px",
          opacity: 0.75,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/cta-cube-right2.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className="flex flex-col lg:flex-row items-center lg:items-start gap-y-8 lg:gap-x-[clamp(40px,9vw,115px)] w-full"
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
            Get notified about our upcoming webinar.
          </div>

          <div
            className="flex flex-col items-center lg:items-start w-full lg:max-w-[493px]"
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
              Subscribe to get invites to our next live session and on-demand
              releases delivered to your inbox.
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
                aria-label="Webinars newsletter subscription"
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
