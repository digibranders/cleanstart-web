import Link from "next/link";

/**
 * Inner content for the Attack Surface Reduction CTA, rendered inside the
 * Footer's fixed 1276×330 / radius-40 slot.
 */
export function AsrCTA(): React.ReactElement {
  return (
    <div
      data-section="AsrCTA"
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(125deg, #F2EAFE 0%, #E8EEFC 50%, #DDE4FC 100%)",
        padding: "clamp(36px,4.17vw,60px) clamp(24px,4.44vw,64px)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-120px",
          top: "-160px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(155, 113, 255, 0.32) 0%, rgba(155, 113, 255, 0) 70%)",
          filter: "blur(20px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          right: "-140px",
          top: "-180px",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(120, 96, 240, 0.28) 0%, rgba(120, 96, 240, 0) 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/cta-bird.png"
        alt=""
        width={304}
        height={154}
        className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-auto w-[280px] pointer-events-none select-none"
        loading="lazy"
        decoding="async"
      />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-6 h-full">
        <h2
          className="font-display text-[#111] text-center md:text-left"
          style={{
            fontSize: "clamp(26px, 2.5vw, 48px)",
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            maxWidth: "420px",
          }}
        >
          Reduce Attack Surface
          <br />
          at the Source
        </h2>

        {/* Mobile-only bird (between heading and button) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/cta-bird.png"
          alt=""
          width={304}
          height={154}
          className="md:hidden mx-auto h-auto w-[240px] pointer-events-none select-none"
          loading="lazy"
          decoding="async"
        />

        <div className="flex flex-col items-center md:items-end gap-5 md:max-w-[280px] md:text-right">
          <p
            className="text-[#111] text-center md:text-right"
            style={{
              fontSize: "clamp(15px, 1.1vw, 20px)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.4,
              opacity: 0.78,
            }}
          >
            Build with only what production needs.
          </p>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-white transition-transform duration-200 hover:-translate-y-px active:translate-y-0"
            style={{
              background:
                "linear-gradient(95deg, #471FC3 0%, #2CC1EB 100%)",
              padding: "12px 22px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              boxShadow:
                "0 8px 22px -8px rgba(71, 31, 195, 0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            Get in Touch
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M3.33 8h9.33M8.67 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
