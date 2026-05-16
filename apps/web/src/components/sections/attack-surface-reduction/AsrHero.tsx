import Link from "next/link";

export function AsrHero(): React.ReactElement {
  return (
    <section
      data-section="AsrHero"
      className="relative overflow-hidden bg-cs-hero bg-cs-grid"
      style={{ minHeight: "624px" }}
    >
      {/* DESKTOP master hero render (cards + flares baked in), right-aligned.
          The horizontal mask hides the left portion where Figma rendered its
          own headline + paragraph + button so my JSX owns that area. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        src="/images/attack-surface-reduction/hero-master.png"
        alt=""
        width={1920}
        height={824}
        style={{
          right: 0,
          top: 0,
          width: "1920px",
          height: "824px",
          maxWidth: "none",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, transparent 30%, black 49%, black 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, transparent 30%, black 49%, black 100%)",
        }}
        loading="eager"
        decoding="async"
      />

      <div
        className="relative mx-auto max-w-[1276px] px-6"
        style={{ paddingTop: "120px", paddingBottom: "72px" }}
      >
        <div className="flex flex-col items-center text-center md:items-start md:text-left md:max-w-[622px] md:py-[46px]">
          <h1
            className="text-white"
            style={{
              fontSize: "clamp(40px, 4.16vw, 80px)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
              marginBottom: "20px",
            }}
          >
            Bigger Images,
            <br />
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
              fontSize: "clamp(15px, 1.35vw, 26px)",
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.85)",
              maxWidth: "545px",
              marginBottom: "28px",
            }}
          >
            CleanStart Images reduce attack surface by eliminating unnecessary
            components before they enter production.
          </p>

          {/* MOBILE cards — sits between paragraph and CTA on small screens.
              Hidden on desktop because the master image already contains them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="pointer-events-none select-none md:hidden"
            src="/images/attack-surface-reduction/hero-mobile-cards.png"
            alt=""
            width={312}
            height={222}
            style={{
              width: "312px",
              height: "222px",
              marginBottom: "28px",
            }}
            loading="eager"
            decoding="async"
          />

          <Link
            href="/cleanstart-images"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "22px",
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
      </div>
    </section>
  );
}
