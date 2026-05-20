"use client";

import { useRef, useState } from "react";

/**
 * Newsletter CTA for the Events page — "Never miss an event".
 * Rendered inside the Footer's fixed 1276×330 / radius-40 slot.
 * Mirrors BlogsCTA structure and styling for visual consistency.
 */
export function EventsCTA(): React.ReactElement {
  const emailRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const email = emailRef.current?.value.trim();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      if (emailRef.current) emailRef.current.value = "";
    }, 3000);
  }

  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(180deg, #471ec0 0%, #131e8f 100%)" }}
    >
      {/* Left cube */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-45px",
          top: "230px",
          width: "176px",
          height: "178px",
          opacity: 0.8,
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

      {/* Right cube */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "1145px",
          top: "-40px",
          width: "176px",
          height: "178px",
          opacity: 0.8,
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

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center"
          style={{ gap: "115px", width: "1047px" }}
        >
          <div
            className="font-display font-bold text-white shrink-0"
            style={{
              fontSize: "clamp(1.75rem,3.82vw,3.4375rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
              width: "401px",
            }}
          >
            Never Miss an Upcoming Event
          </div>

          <div
            className="flex flex-col items-start shrink-0"
            style={{ width: "493px", gap: "24px" }}
          >
            <p
              className="text-[1.3125rem] font-normal leading-[1.4] tracking-[-0.04em] text-white"
              style={{ opacity: 0.8 }}
            >
              Be the first to get notified about upcoming events.
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
                className="relative flex items-center"
                aria-label="Events newsletter subscription"
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: "427px",
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
                    ["--cs-btn-fs" as string]: "18px",
                    borderRadius: "0 12px 12px 0",
                    borderLeft: "none",
                  }}
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
