import Link from "next/link";

/**
 * Inner content for the Resource Center CTA, rendered inside the Footer's
 * fixed 1276×330 / radius-40 slot.
 */
export function ResourceCenterCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0"
      style={{ background: "white" }}
      aria-labelledby="rc-cta-title"
    >
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

      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{ left: "1159px", top: "244px", width: "511px", height: "511px" }}
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
        style={{ left: "-139px", top: "-168px", width: "320px", height: "320px" }}
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

      <div
        className="absolute inset-0 flex items-center px-6 py-8 lg:px-[100px] lg:py-[60px]"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-[68px] w-full">
          <h2
            id="rc-cta-title"
            className="font-display font-bold text-center lg:text-left w-full lg:max-w-[486px]"
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.625rem)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: "#111",
            }}
          >
            Stop Managing Vulnerabilities. Start Eliminating Them.
          </h2>

          <div
            className="flex flex-col items-center lg:items-start w-full lg:max-w-[564px] gap-4 lg:gap-6"
          >
            <p
              className="text-body-md lg:text-body-lg font-normal leading-[1.4] tracking-[-0.04em] text-center lg:text-left w-full lg:max-w-[493px]"
              style={{ color: "#111", opacity: 0.8 }}
            >
              Why waste time patching what shouldn&apos;t exist? CleanStart flips
              security from reactive to preventative, giving you cleaner images,
              faster pipelines, and peace of mind.
            </p>

            <Link
              href="/book-a-demo"
              className="cs-btn-blue relative overflow-hidden gap-2"
              style={{ padding: "0 20px" }}
            >
              <span
                aria-hidden
                className="absolute pointer-events-none select-none"
                style={{
                  width: "30.07px",
                  height: "30.07px",
                  left: "calc(50% - 30.07px/2 - 2.3px)",
                  top: "41.1px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                  filter: "blur(10.0245px)",
                }}
              />
              Get in Touch
              <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden>
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
  );
}
