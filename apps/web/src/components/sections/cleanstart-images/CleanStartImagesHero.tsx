import Link from "next/link";

export function CleanStartImagesHero(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesHero"
      className="relative overflow-hidden"
      style={{
        backgroundColor: "#0B0820",
        backgroundImage: [
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(180deg, rgb(11,8,32) 0%, rgb(15,12,52) 22%, rgb(20,25,110) 42%, rgb(46,28,170) 62%, rgb(71,30,192) 78%, rgba(71,30,192,0.7) 88%, rgba(71,30,192,0) 100%)",
        ].join(", "),
        backgroundSize: "80px 80px, 80px 80px, 100% 100%",
        backgroundRepeat: "repeat, repeat, no-repeat",
      }}
    >
      {/* Content wrapper — Figma frame 1920×1084, title at y=175 */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center text-center"
        style={{ paddingTop: "clamp(72px, 8vw, 128px)", paddingBottom: "clamp(16px, 2vw, 32px)" }}
      >
        <h1
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 4.45vw, 64px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            maxWidth: "820px",
          }}
        >
          Approach to CVE Free{" "}
          <span
            style={{
              fontSize: "inherit",
              background:
                "linear-gradient(99deg, #9A51FF 0%, #2CC1EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Container Images
          </span>
        </h1>

        {/* CTA — glass button between heading and hero diagram */}
        <Link
          href="#browse-images"
          className="cs-btn-glass mt-10"
          style={
            {
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "16px",
            } as React.CSSProperties
          }
        >
          <span>Browse Images</span>
          <svg
            className="cs-cta-arrow"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 9h11m0 0l-4-4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Diagram — Figma group 161:23277, 1244×466 at y=424 (relative to hero 1084) */}
        <div className="relative mt-[64px] w-full flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/hero-diagram.png"
            alt="CleanStart approach diagram: container images flow through CleanStart's hardened, FIPS-compliant pipeline to private registries and customer repositories."
            width={1322}
            height={466}
            className="w-full max-w-[1322px] h-auto select-none"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
