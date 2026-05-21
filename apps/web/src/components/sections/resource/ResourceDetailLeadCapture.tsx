"use client";

import { useState } from "react";
import type { ResourceDetail } from "@/lib/resources";
import { resourceLeadCaptureHeading } from "@/lib/resources-utils";

interface ResourceDetailLeadCaptureProps {
  resource: ResourceDetail;
}

export function ResourceDetailLeadCapture({
  resource,
}: ResourceDetailLeadCaptureProps): React.ReactElement {
  const heading = resourceLeadCaptureHeading(resource.type);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    // Lead submission wired through the CMS LeadHandler when backend is ready.
    // For now: placeholder — the UI is the deliverable at this phase.
  }

  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)" }}
      aria-labelledby="rd-cta-title"
    >
          {/* Union pattern */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: "547px",
              top: "-220px",
              width: "1101px",
              height: "1101px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/cta-pattern.svg"
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Glow ellipse — right */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: "1159px",
              top: "244px",
              width: "511px",
              height: "511px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/cta-glow-1.svg"
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Glow ellipse — left */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: "-139px",
              top: "-168px",
              width: "320px",
              height: "320px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/cta-glow-2.svg"
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Lead cube — bottom-left, rotated + flipped */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: "0.06px",
              top: "221.5px",
              width: "259px",
              height: "260px",
            }}
          >
            <div
              style={{
                transform: "rotate(-165deg) scaleY(-1)",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/resource-center/lead-cube.png"
                alt=""
                style={{ width: "211px", height: "213px", opacity: 0.9, objectFit: "cover" }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Content row */}
          <div
            className="absolute inset-0 flex items-center px-6 py-8 lg:px-[100px] lg:py-[60px]"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-[68px] w-full">
              {/* Headline */}
              <h2
                id="rd-cta-title"
                className="font-display font-bold shrink-0 text-white text-center lg:text-left w-full lg:w-[486px]"
                style={{
                  fontSize: "clamp(1.5rem, 2.86vw, 3.4375rem)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.05em",
                }}
              >
                {heading}
              </h2>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-stretch lg:items-start shrink-0 w-full lg:w-[549px] gap-4 lg:gap-10"
              >
                {/* Legal teaser */}
                <p
                  // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
                  className="text-sm lg:text-[1.3125rem] font-normal leading-[1.4] tracking-[-0.04em] text-white text-center lg:text-left w-full lg:w-[493px]"
                  style={{ opacity: 0.8 }}
                >
                  By checking this box, you agree that CleanStart may use your
                  information to contact you. You may opt out at any time.{" "}
                  <a
                    href="/privacy-policy"
                    className="underline text-white"
                    style={{ opacity: 1 }}
                  >
                    View Privacy Policy.
                  </a>
                </p>

                {/* Email row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    aria-label="Email address"
                    autoComplete="email"
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
                    className="text-base lg:text-[1.3125rem] font-normal leading-[1.4] tracking-[-0.04em] bg-white w-full sm:w-[352px] h-[41px]"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #111",
                      paddingLeft: "20px",
                      paddingRight: "16px",
                      color: "#111",
                      outline: "none",
                    }}
                  />

                  {/* Glass "Get in Touch" button */}
                  <button
                    type="submit"
                    className="relative overflow-hidden inline-flex items-center justify-center gap-2 text-base lg:text-lg font-medium tracking-[-0.01em] shrink-0 h-[43px] w-full sm:w-auto"
                    style={{
                      padding: "9px 18px",
                      borderRadius: "8px",
                      border: "1px solid #dab6f3",
                      background: "rgba(255,255,255,0.65)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#111",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute pointer-events-none select-none"
                      style={{
                        width: "100px",
                        height: "30px",
                        bottom: "-8px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.6)",
                        filter: "blur(10px)",
                      }}
                    />
                    Get in Touch
                    <svg
                      width="22"
                      height="20"
                      viewBox="0 0 22 20"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 10h14M12 4l6 6-6 6"
                        stroke="#111"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Consent checkbox — input visual is 20x20 inside a 44px-tall
                    label so the whole row meets WCAG 2.5.8 (target-size). */}
                <label
                  htmlFor="rd-consent"
                  className="flex items-center gap-2 w-full text-xs lg:text-sm font-normal leading-none tracking-[-0.04em] text-white lg:whitespace-nowrap cursor-pointer"
                  style={{ minHeight: "44px", opacity: 0.8 }}
                >
                  <input
                    id="rd-consent"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="shrink-0"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "3px",
                      accentColor: "#3960f9",
                      cursor: "pointer",
                    }}
                  />
                  <span>I agree to receive other communications from CleanStart.*</span>
                </label>
              </form>
            </div>
          </div>
    </div>
  );
}
