"use client";

import { useNewsletterSignup } from "@/lib/leads/useNewsletterSignup";

/**
 * Blog/News detail CTA — white newsletter capture card with cubes and grids
 * in the corners, plus a blue→teal "Subscribe" gradient button.
 */
export function BlogDetailCTA(): React.ReactElement {
  const { emailRef, submitted, error, handleSubmit } = useNewsletterSignup();

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#fff" }}>
      {/* Grid (right). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{ left: "547px", top: "-220px", width: "1101px", height: "1101px" }}
        loading="lazy"
        decoding="async"
      />
      {/* Grid (left). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{ left: "-496px", top: "-239px", width: "1101px", height: "1101px" }}
        loading="lazy"
        decoding="async"
      />

      {/* Ellipse — top-left. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-158px",
          top: "-148px",
          width: "316px",
          height: "316px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* Ellipse — bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1151px",
          top: "165px",
          width: "316px",
          height: "316px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* Cube — top-left. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-cube.png"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block object-contain"
        style={{ left: "-63px", top: "-63px", width: "206px", height: "207px" , opacity: 0.75,}}
        loading="lazy"
        decoding="async"
      />

      {/* Cube — top-right. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-cube.png"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block object-contain"
        style={{ left: "1130px", top: "-63px", width: "259px", height: "260px" , opacity: 0.75,}}
        loading="lazy"
        decoding="async"
      />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className="flex flex-col lg:flex-row items-center lg:items-start gap-y-4 lg:gap-y-0 lg:gap-x-[clamp(40px,9vw,115px)] w-full"
          style={{ maxWidth: "1047px" }}
        >
          <div
            className="font-display font-bold w-full lg:w-auto lg:max-w-[401px] text-center lg:text-left"
            style={{
              color: "#111111",
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
              className="font-normal text-center lg:text-left"
              style={{
                fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
                color: "#111111",
                opacity: 0.8,
              }}
            >
              Get the latest research, insights, and updates straight to your
              inbox
            </p>

            {submitted ? (
              <p className="text-base font-medium" style={{ color: "#111111", opacity: 0.9 }}>
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
                    background: "rgba(0,0,0,0.05)",
                    border: "1px solid rgba(156,149,160,0.6)",
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
                    className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-[#111] placeholder:text-[#7E7E7E] text-base leading-[1.5] outline-none"
                    style={{ fontWeight: 400 }}
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 inline-flex cursor-pointer items-center justify-center font-medium text-white"
                  style={{
                    height: "44px",
                    padding: "0 18px",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored submit-button label, fixed 18px to match the inline gradient pill chrome. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "var(--fs-button)",
                    letterSpacing: "-0.01em",
                    background:
                      "linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)",
                    borderRadius: "0 12px 12px 0",
                    boxShadow:
                      "0 0 0 1px #3960F9, 0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 0 rgba(255,255,255,0.16)",
                  }}
                >
                  Subscribe
                </button>
              </form>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium" style={{ color: "#B42318" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
