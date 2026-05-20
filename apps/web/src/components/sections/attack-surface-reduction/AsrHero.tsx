import Link from "next/link";

export function AsrHero(): React.ReactElement {
  return (
    <section
      data-section="AsrHero"
      className="relative overflow-hidden bg-cs-hero bg-cs-grid"
      style={{ minHeight: "720px" }}
    >
      {/* Yellow/blue cross flare behind cards */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        src="/images/attack-surface-reduction/hero-flare-yellow.png"
        alt=""
        style={{
          right: "calc(50% - 940px)",
          top: "120px",
          width: "440px",
          height: "440px",
          mixBlendMode: "screen",
          opacity: 0.9,
        }}
        loading="eager"
        decoding="async"
      />

      {/* Soft purple blob behind cards (matches Figma blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          right: "calc(50% - 880px)",
          top: "80px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(122,89,255,0.55) 0%, rgba(122,89,255,0) 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Bottom fade — Figma node 366-5158 fades the hero's last ~200px from
          peak purple into pure white where AsrPublicImages (bg-white) begins.
          Same pattern as FipsHero. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "200px",
          background:
            "linear-gradient(180deg, rgba(246,246,246,0) 0%, rgba(246,246,246,0.45) 55%, rgba(246,246,246,0.92) 88%, #F6F6F6 100%)",
        }}
      />

      <div
        className="relative z-10 mx-auto max-w-[1276px] px-6"
        style={{ paddingTop: "168px", paddingBottom: "96px" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          {/* Left: Headline + paragraph + CTA */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left md:max-w-[600px]">
            <h1
              className="text-white"
              style={{
                fontSize: "clamp(40px, 4.16vw, 80px)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                letterSpacing: "-0.05em",
                lineHeight: 1.0,
                marginBottom: "24px",
              }}
            >
              Bigger Images,{" "}
              <span
                style={{
                  background:
                    "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Bigger Risk
              </span>
            </h1>

            <p
              style={{
                fontSize: "clamp(16px, 1.35vw, 22px)",
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.85)",
                maxWidth: "545px",
                marginBottom: "32px",
              }}
            >
              CleanStart Images reduce attack surface by eliminating unnecessary
              components before they enter production.
            </p>

            <Link
              href="/cleanstart-images"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-h": "var(--btn-h-xl)",
                  "--cs-btn-px": "24px",
                  "--cs-btn-fs": "16px",
                } as React.CSSProperties
              }
            >
              Explore Cleanstart Images
              <svg
                className="cs-cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Right: Two product cards (desktop) */}
          <div
            aria-hidden
            className="relative hidden md:block shrink-0"
            style={{ width: "560px", height: "500px" }}
          >
            {/* BLOATED card (back) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/attack-surface-reduction/hero-card-bloated.png"
              alt=""
              className="absolute pointer-events-none select-none"
              style={{
                left: 0,
                top: 0,
                width: "344px",
                height: "auto",
                filter: "drop-shadow(-30px 20px 40px rgba(0,0,0,0.35))",
              }}
              loading="eager"
              decoding="async"
            />

            {/* CLEAN card (front, overlapping right) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/attack-surface-reduction/hero-card-clean.png"
              alt=""
              className="absolute pointer-events-none select-none"
              style={{
                right: 0,
                top: "90px",
                width: "324px",
                height: "auto",
                filter: "drop-shadow(-30px 20px 40px rgba(0,0,0,0.45))",
              }}
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Mobile cards (stacked PNG) */}
          <div className="md:hidden flex justify-center w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/attack-surface-reduction/hero-mobile-cards.png"
              alt=""
              width={312}
              height={222}
              style={{ width: "312px", height: "222px" }}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
