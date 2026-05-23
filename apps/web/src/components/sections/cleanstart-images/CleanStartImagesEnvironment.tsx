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
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "672px",
          }}
        >
          Built for your{" "}
          <span className="cs-text-gradient-impact">environment</span>
        </h2>
        <p
          className="mt-5 text-center"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(18px, 1.7vw, 24px)",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
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
