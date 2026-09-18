import Link from "next/link";
import { forwardRef } from "react";

interface NewsletterConsentProps {
  /**
   * "dark" (default) targets the dark/glass gradient CTA cards (Blogs,
   * Webinars, Events). "light" targets white CTA cards (Blog Detail, Guides)
   * where the dark-on-dark copy is otherwise unreadable.
   */
  variant?: "dark" | "light";
}

/**
 * Required consent checkbox for the newsletter CTAs. Forwards a ref to the
 * input so the signup hook can gate submission on `.checked`.
 */
export const NewsletterConsent = forwardRef<HTMLInputElement, NewsletterConsentProps>(
  function NewsletterConsent({ variant = "dark" }, ref): React.ReactElement {
    const isLight = variant === "light";

    return (
      <label className="flex items-start cursor-pointer text-left" style={{ gap: "8px" }}>
        <span
          className="inline-flex shrink-0 items-center"
          style={{ height: "1.4em", fontSize: "var(--fs-caption)" }}
        >
          <span className="relative inline-flex" style={{ width: "18px", height: "18px" }}>
            <input
              ref={ref}
              type="checkbox"
              name="consent_newsletter"
              required
              aria-required
              className={
                isLight
                  ? "peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-[#FBFBFB] border-[1.5px] border-[#DDDDDD] checked:bg-[#3960F9] checked:border-[#3960F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3960F9]"
                  : "peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-white/15 border-[1.5px] border-white/50 checked:bg-white checked:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              }
            />
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="pointer-events-none absolute inset-0 m-auto hidden peer-checked:block"
              width="12"
              height="12"
            >
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke={isLight ? "white" : "#0F123E"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-sans), 'Sora', sans-serif",
            fontWeight: 400,
            fontSize: "var(--fs-caption)",
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            color: isLight ? "rgba(17,17,17,0.85)" : "rgba(255,255,255,0.85)",
          }}
        >
          I agree to receive the CleanStart newsletter and to the storage &amp;
          processing of my email per the{" "}
          <Link
            href="/privacy-policy"
            className="underline"
            style={{ color: isLight ? "#2F49E5" : "#EDCBFF" }}
          >
            Privacy Policy
          </Link>
          <span className={isLight ? "ml-0.5 text-[#D14343]" : "ml-0.5 text-[#FFB4B4]"}>*</span>
        </span>
      </label>
    );
  },
);
