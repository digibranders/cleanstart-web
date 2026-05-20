/**
 * Inner content for the Teams page CTA, rendered inside the Footer's
 * 1276×330 slot (overflow-hidden, border-radius 40px).
 *
 * Design: white card with a 3-D cube image on the left and
 * "Join the Team" copy + Careers button on the right.
 * Cube overflows the card top — clipped by the Footer's overflow-hidden wrapper.
 */
import Image from "next/image";

export function TeamsCTA() {
  return (
    <div
      className="absolute inset-0 bg-white"
      style={{ borderRadius: "40px" }}
    >
      {/* Decorative gradient blob — top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-80px",
          top: "-120px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Decorative gradient blob — bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-60px",
          bottom: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* 3-D cube image — absolute left, overflows card top intentionally */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{ left: "50px", top: 0, width: "406px", height: "443px" }}
      >
        <Image
          src="/images/teams/cta-cube.png"
          alt=""
          fill
          className="object-contain object-bottom"
          sizes="406px"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text content */}
      <div
        className="absolute flex flex-col gap-4"
        style={{
          left: "clamp(24px, 45%, 547px)",
          top: "50%",
          transform: "translateY(-50%)",
          width: "min(607px, calc(100% - clamp(24px, 45%, 547px) - 24px))",
        }}
      >
        <h2
          className="font-display font-bold text-[#111]"
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 3.4375rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
          }}
        >
          Join the Team
        </h2>

        <div className="flex flex-col gap-10">
          <p
            className="font-sans text-[#111]/80"
            style={{
              fontSize: "clamp(0.875rem, 1.4vw, 1.3125rem)",
              lineHeight: "1.4",
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
            }}
          >
            Visit our career page to explore open opportunities
          </p>

          <a
            href="/careers"
            className="cs-btn-blue inline-flex items-center gap-2"
            style={{
              width: "136px",
              height: "44px",
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
            }}
          >
            Careers
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
