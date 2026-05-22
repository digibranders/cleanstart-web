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
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center"
        style={{ paddingTop: "var(--spacing-section-md)", paddingBottom: "var(--spacing-section-md)" }}
      >
        <h2
          className="text-white text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-t-display-2)",
            fontWeight: 600,
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
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
            fontSize: "var(--text-t-body-lg)",
            fontWeight: 400,
            lineHeight: "var(--text-t-body-lg-lh)",
            letterSpacing: "var(--text-t-body-lg-ls)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Works seamlessly across all major platforms
        </p>

        {/* Logo marquee removed until clean exports arrive — the prior
            env-logos-row{1,2}.png strips had a Figma selection highlight
            baked into the artwork. Re-export the rows or add per-logo SVGs
            and the marquee scaffolding (helper component + cs-marquee CSS)
            can be re-introduced. */}
      </div>
    </section>
  );
}
