export function CleanStartImagesEnvironment(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesEnvironment"
      className="relative overflow-hidden"
      style={{
        minHeight: "clamp(380px, 34vw, 500px)",
        background:
          "linear-gradient(180deg, #0B0820 0%, #131448 40%, #1F1D7F 75%, #2A2BA8 100%)",
      }}
    >
      {/* Decorative grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px, 80px 80px",
        }}
      />

      <div
        className="relative mx-auto max-w-[1361px] px-6 flex flex-col items-center"
        style={{ paddingTop: "var(--spacing-section-md)", paddingBottom: "var(--spacing-section-md)" }}
      >
        <h2
          className="text-white text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 3.33vw, 64px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: "672px",
          }}
        >
          Built for your{" "}
          <span
            style={{
              background:
                "linear-gradient(90deg,#7B5CFA 0%,#5B8DFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            environment
          </span>
        </h2>
        <p
          className="mt-5 text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(14px, 0.94vw, 18px)",
            fontWeight: 400,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Works seamlessly across all major platforms
        </p>

        {/* Logo rows — Figma 161:23837 and 161:23846 */}
        <div className="mt-14 w-full flex flex-col items-center gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/env-logos-row1.png"
            alt="Supported platforms: Azure, Nexus, Quay, Red Hat, Harbor, Azure"
            width={1361}
            height={55}
            className="w-full max-w-[1361px] h-auto select-none opacity-90"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/env-logos-row2.png"
            alt="Supported platforms: Google Cloud, AWS, GitHub, JFrog, Docker, Google Cloud"
            width={1319}
            height={55}
            className="w-full max-w-[1319px] h-auto select-none opacity-90"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
