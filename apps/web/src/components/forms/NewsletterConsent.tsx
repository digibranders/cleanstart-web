import Link from "next/link";
import { forwardRef } from "react";

/**
 * Required consent checkbox for the newsletter CTAs. These sit on dark/glass
 * surfaces, so the copy is light-on-dark (unlike LeadConsent, which targets
 * white surfaces). Forwards a ref to the input so the signup hook can gate
 * submission on `.checked`.
 */
export const NewsletterConsent = forwardRef<HTMLInputElement>(
  function NewsletterConsent(_props, ref): React.ReactElement {
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
              className="peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-white/15 border-[1.5px] border-white/50 checked:bg-white checked:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                stroke="#0F123E"
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
            color: "rgba(255,255,255,0.85)",
          }}
        >
          I agree to receive the CleanStart newsletter and to the storage &amp;
          processing of my email per the{" "}
          <Link href="/privacy-policy" className="underline" style={{ color: "#EDCBFF" }}>
            Privacy Policy
          </Link>
          <span className="ml-0.5 text-[#FFB4B4]">*</span>
        </span>
      </label>
    );
  },
);
