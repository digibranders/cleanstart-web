"use client";

import { useRef, useState } from "react";
import type { ResourceDetail } from "@/lib/resources";
import { resourceLeadCaptureHeading } from "@/lib/resources-utils";
import { submitLead } from "@/lib/leads/submitLead";

interface ResourceDetailLeadCaptureProps {
  resource: ResourceDetail;
}

const RESOURCE_CONSENT_TEXT =
  "I agree to receive communications from CleanStart and to the storage & processing of my email per the Privacy Policy.";

export function ResourceDetailLeadCapture({
  resource,
}: ResourceDetailLeadCaptureProps): React.ReactElement {
  const heading = resourceLeadCaptureHeading(resource.type);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (inFlightRef.current) return;
    setTopError(null);
    if (!agreed) {
      setTopError("Please agree to be contacted to continue.");
      return;
    }
    inFlightRef.current = true;

    const result = await submitLead({
      formSlug: "resource-capture",
      fields: { email: email.trim() },
      consent: {
        snapshot: RESOURCE_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ["marketing"],
      },
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });

    inFlightRef.current = false;
    if (result.ok) {
      setSubmitted(true);
      setEmail("");
      setAgreed(false);
    } else {
      setTopError("Something went wrong. Please try again.");
    }
  }

  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)" }}
      aria-labelledby="rd-cta-title"
    >
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

          <div
            aria-hidden
            className="absolute pointer-events-none select-none hidden sm:block"
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

          <div
            className="absolute inset-0 flex items-center px-6 py-8"
            style={{ paddingLeft: "clamp(32px, 5.2vw, 100px)", paddingRight: "clamp(32px, 5.2vw, 100px)" }}
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-6 lg:gap-[clamp(32px,3.5vw,68px)] w-full min-w-0">
              <h2
                id="rd-cta-title"
                className="font-display text-white text-center lg:text-left w-full lg:w-auto lg:flex-shrink-0"
                style={{
                  fontSize: "var(--cta-card-title)",
                  fontWeight: "var(--cta-card-title-weight)",
                  lineHeight: "var(--cta-card-title-lh)",
                  letterSpacing: "var(--cta-card-title-ls)",
                  maxWidth: "min(400px, 100%)",
                }}
              >
                {heading}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-stretch lg:items-start w-full lg:flex-1 lg:min-w-0 gap-4 lg:gap-5"
              >
                <p
                  className="font-normal text-white text-center lg:text-left w-full"
                  style={{
                    fontSize: "var(--cta-card-desc)",
                    lineHeight: "var(--cta-card-desc-lh)",
                    letterSpacing: "var(--cta-card-desc-ls)",
                    opacity: 0.8,
                    maxWidth: "493px",
                  }}
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    aria-label="Email address"
                    autoComplete="email"
                    className="font-normal bg-white w-full sm:w-[300px] h-9 lg:h-10"
                    style={{
                      fontSize: "var(--fs-button)",
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                      borderRadius: "8px",
                      border: "1px solid #111",
                      paddingLeft: "16px",
                      paddingRight: "16px",
                      color: "#111",
                      outline: "none",
                    }}
                  />

                  <button
                    type="submit"
                    className="relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] shrink-0 w-full sm:w-auto"
                    style={{
                      height: "var(--cta-card-btn-h)",
                      paddingLeft: "var(--cta-card-btn-px)",
                      paddingRight: "var(--cta-card-btn-px)",
                      fontSize: "var(--cta-card-btn-fs)",
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

                {/* 44px min-height satisfies WCAG 2.5.8 target size. */}
                <label
                  htmlFor="rd-consent"
                  className="flex items-center gap-2 w-full text-xs font-normal leading-none tracking-[-0.04em] text-white cursor-pointer"
                  style={{ minHeight: "44px", opacity: 0.8 }}
                >
                  <input
                    id="rd-consent"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="shrink-0 w-[14px] h-[14px] lg:w-[20px] lg:h-[20px]"
                    style={{
                      borderRadius: "3px",
                      accentColor: "#3960f9",
                      cursor: "pointer",
                    }}
                  />
                  <span>I agree to receive other communications from CleanStart.*</span>
                </label>

                {submitted && (
                  <output
                    aria-live="polite"
                    className="block text-sm font-medium text-white"
                    style={{ opacity: 0.95 }}
                  >
                    Thanks — you&apos;re on the list. We&apos;ll be in touch.
                  </output>
                )}
                {topError && (
                  <p role="alert" className="text-sm font-medium text-white" style={{ opacity: 0.95 }}>
                    {topError}
                  </p>
                )}
              </form>
            </div>
          </div>
    </div>
  );
}
