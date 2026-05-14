"use client";

import { useRef, useState } from "react";

export function BlogsCTA(): React.ReactElement {
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
    <section
      className="relative w-full"
      style={{ marginBottom: "-165px", zIndex: 10 }}
      aria-labelledby="blogs-cta-title"
    >
      <div className="relative px-6">
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            maxWidth: "1276px",
            height: "330px",
            borderRadius: "40px",
            background: "linear-gradient(180deg, #471ec0 0%, #131e8f 100%)",
          }}
        >
          {/* Left cube — Figma 255:10293, rotation=-16.04°, opacity=0.8
               AABB: x=-14 y=209 w=176 h=178
               Pre-rotation CSS origin (center): left=7px top=230px */}
          <div
            aria-hidden
            className="pointer-events-none select-none absolute"
            style={{
              left: "-45px",
              top: "230px",
              width: "176px",
              height: "178px",
              // transform: "rotate(-16.04deg)",
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

          {/* Right cube — Figma 255:10294, rotation=72.69°, opacity=0.8
               AABB: x=1130 y=105 w=176 h=178
               Pre-rotation CSS origin (center): left=1153px top=126px */}
          <div
            aria-hidden
            className="pointer-events-none select-none absolute"
            style={{
              left: "1145px",
              top: "-40px",
              width: "176px",
              height: "178px",
              // transform: "rotate(72.69deg)",
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

          {/* Content row */}
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="flex items-center"
              style={{ gap: "115px", width: "1047px" }}
            >
              {/* Title */}
              <h2
                id="blogs-cta-title"
                className="font-sans font-bold text-white shrink-0"
                style={{
                  fontSize: "clamp(1.75rem,3.82vw,3.4375rem)",
                  lineHeight: "1.0",
                  letterSpacing: "-0.05em",
                  width: "401px",
                }}
              >
                Stay Ahead of Container Security Threats
              </h2>

              {/* Right column */}
              <div
                className="flex flex-col items-start shrink-0"
                style={{ width: "493px", gap: "24px" }}
              >
                <p
                  className="font-sans font-normal text-white"
                  style={{
                    fontSize: "21px",
                    lineHeight: "1.4",
                    letterSpacing: "-0.04em",
                    opacity: 0.8,
                  }}
                >
                  Get the latest research, insights, and updates straight to
                  your inbox
                </p>

                {submitted ? (
                  <p
                    className="font-sans font-medium text-white"
                    style={{ fontSize: "16px", opacity: 0.9 }}
                  >
                    Thanks! You&apos;re subscribed.
                  </p>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="relative flex items-center"
                    aria-label="Newsletter subscription"
                  >
                    {/* Email input */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: "427px",
                        height: "43px",
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
                        className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-white placeholder:text-white/60 font-sans text-[16px] leading-[1.5] outline-none"
                        style={{ fontWeight: 400 }}
                      />
                    </div>

                    {/* Subscribe button — matches navbar Book a Demo glass style */}
                    <button
                      type="submit"
                      className="cs-btn-glass cs-btn-glass--no-lift shrink-0"
                      style={{
                        ["--cs-btn-h" as string]: "43px",
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
      </div>
    </section>
  );
}
