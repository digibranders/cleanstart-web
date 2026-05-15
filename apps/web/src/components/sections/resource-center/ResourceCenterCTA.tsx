import Link from "next/link";

export function ResourceCenterCTA(): React.ReactElement {
  return (
    <section
      className="relative w-full"
      style={{ marginBottom: "-165px", zIndex: 10 }}
      aria-labelledby="rc-cta-title"
    >
      <div className="relative px-6">
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            maxWidth: "1276px",
            height: "375px",
            borderRadius: "40px",
            background: "white",
          }}
        >
          {/* Decorative pattern — Union */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{ left: "547px", top: "-220px", width: "1101px", height: "1101px" }}
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

          {/* Glow ellipse top-right */}
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

          {/* Glow ellipse top-left */}
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

          {/* 3D cube — right side */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none hidden xl:block"
            style={{
              left: "994px",
              top: "229px",
              width: "259px",
              height: "260px",
              transform: "rotate(-15deg)",
              opacity: 0.9,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/cta-cube.png"
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Content row */}
          <div
            className="absolute inset-0 flex items-center"
            style={{ padding: "80px 100px" }}
          >
            <div className="flex items-center" style={{ gap: "68px" }}>
              {/* Left: headline */}
              <h2
                id="rc-cta-title"
                className="font-sans font-bold shrink-0"
                style={{
                  fontSize: "clamp(1.75rem, 2.86vw, 3.4375rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                  color: "#111",
                  width: "486px",
                }}
              >
                Stop Managing Vulnerabilities. Start Eliminating Them.
              </h2>

              {/* Right: body + button */}
              <div
                className="flex flex-col items-start"
                style={{ width: "564px", gap: "40px" }}
              >
                <p
                  className="text-[1.3125rem] font-normal leading-[1.4] tracking-[-0.04em]"
                  style={{ color: "#111", opacity: 0.8, width: "493px" }}
                >
                  Why waste time patching what shouldn&apos;t exist? CleanStart
                  flips security from reactive to preventative, giving you cleaner
                  images, faster pipelines, and peace of mind.
                </p>

                <Link
                  href="/book-a-demo"
                  className="cs-btn-blue relative overflow-hidden gap-2"
                  style={{ height: "44px", padding: "0 20px", fontSize: "1.125rem" }}
                >
                  {/* Bottom-center glow — matches Figma Ellipse3938 layer-blur */}
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
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
