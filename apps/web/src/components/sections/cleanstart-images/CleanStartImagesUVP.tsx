const BULLETS = [
  "60-80% lighter than original images",
  "Reduced memory footprint",
  "Lower CPU consumption",
  "Faster container pull time",
];

function CheckIcon(): React.ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 12.5L9.5 17L19 7.5"
        stroke="#2E1B8C"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CleanStartImagesUVP(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesUVP"
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "clamp(540px, 50vw, 720px)" }}
    >
      {/* Decorative grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(120,80,200,0.06) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(120,80,200,0.06) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px, 80px 80px",
        }}
      />
      {/* Pink/purple decorative flares — Figma ellipses 161:23666, 161:23667 */}
      <div
        aria-hidden
        className="absolute pointer-events-none hidden lg:block"
        style={{
          right: "-80px",
          top: "-64px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, rgba(192,170,255,0.55) 0%, rgba(192,170,255,0) 65%)",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none hidden lg:block"
        style={{
          left: "-80px",
          top: "668px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, rgba(255,180,235,0.55) 0%, rgba(255,180,235,0) 65%)",
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ paddingTop: "var(--spacing-section-md)", paddingBottom: "var(--spacing-section-md)" }}
      >
        <h2
          className="text-center mx-auto"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#1A1A2E",
            maxWidth: "744px",
          }}
        >
          Unique Value{" "}
          <span className="cs-text-gradient-impact">Proposition</span>
        </h2>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-[513px_1fr] gap-12 lg:gap-24 items-center">
          {/* 3D bar charts — Figma 161:23676, 513×473 */}
          <div className="relative w-full flex justify-center lg:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-images/uvp-bars.png"
              alt="Compressed size comparison: Node 387.87 MB vs 45.7 MB, Redis 157 MB vs 64.5 MB, Python 120 MB vs 32 MB — CleanStart containers are roughly 60–80% smaller than Docker base containers."
              width={513}
              height={473}
              className="w-full max-w-[513px] h-auto select-none"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>

          {/* Performance Enhancement */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px, 2.4vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#1A1A2E",
              }}
            >
              Performance Enhancement
            </h3>
            <ul className="mt-8 flex flex-col gap-5">
              {BULLETS.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(15px, 1.4vw, 20px)",
                    fontWeight: 400,
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                    color: "#1A1A2E",
                  }}
                >
                  <span className="shrink-0 mt-[2px]">
                    <CheckIcon />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
