interface OutputCardProps {
  icon: string;
  title: string;
  description: string;
}

function OutputCard({ icon, title, description }: OutputCardProps) {
  return (
    <div className="relative flex flex-col gap-[21px] overflow-hidden rounded-[36px] bg-white p-6">
      {/* Top purple glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[153px] opacity-30"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, #df9bff 0%, transparent 70%)",
          filter: "blur(30px)",
          width: "calc(100% + 0px)",
        }}
      />

      {/* Decorative grid lines */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[48.5, 120, 162, 234].map((x) => (
          <div
            key={x}
            className="absolute h-[264px] w-px opacity-80"
            style={{
              left: `${x}px`,
              top: "0.74px",
              background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 50.77%, rgba(255,255,255,0) 100%)",
            }}
          />
        ))}
        {[68, 184].map((y) => (
          <div
            key={y}
            className="absolute h-px w-full opacity-30"
            style={{
              top: `${y}px`,
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, #fff 50.77%, rgba(255,255,255,0) 100%)",
            }}
          />
        ))}
      </div>

      {/* Blue ball icon */}
      <div
        className="relative z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0px_6.2px_14.5px_0px_rgba(28,60,142,0.33)]"
        style={{
          width: "96px",
          height: "96px",
          background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          className="h-[54px] w-[54px] object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-3">
        <p
          className="font-bold leading-none text-[#111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h3)",
            letterSpacing: "-0.06em",
          }}
        >
          {title}
        </p>
        <p
          className="text-[#555]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            letterSpacing: "-0.05em",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      </div>

      {/* Cyan border glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[36px] opacity-30"
        style={{
          background: "linear-gradient(90deg, #2cc1eb 0%, #2cc1eb 100%)",
          padding: "1px",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
    </div>
  );
}

export function PlatformTrustedOutputs() {
  return (
    <section
      aria-label="Trusted Outputs Across the Platform"
      className="relative w-full overflow-hidden bg-white"
    >
      {/* Corner decorations */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-platform/outputs-corner-union.svg"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute -right-[253px] bottom-[625px]"
        style={{ width: "488px", height: "497px", opacity: 0.15 }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-platform/outputs-corner-union.svg"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute -left-[253px] bottom-[625px]"
        style={{ width: "488px", height: "497px", opacity: 0.15, transform: "scaleX(-1)" }}
        loading="lazy"
        decoding="async"
      />

      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Title */}
        <h2
          className="mb-[clamp(48px,5.5vw,80px)] mt-[clamp(64px,6.9vw,100px)] text-center font-bold text-[#111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-display)",
            letterSpacing: "-0.05em",
            lineHeight: 1.1,
          }}
        >
          Trusted Outputs Across the{" "}
          <span
            className="bg-clip-text"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundImage: "linear-gradient(-12deg, #2cc1eb 0%, #9a51ff 64%)",
            }}
          >
            Platform
          </span>
        </h2>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 pb-[var(--spacing-section-cta)] sm:grid-cols-2 lg:grid-cols-4">
          <OutputCard
            icon="/images/cleanstart-platform/outputs-icon-1.svg"
            title="Hardened Container Images"
            description="Minimal runtime environments are designed to reduce inherited risk."
          />
          <OutputCard
            icon="/images/cleanstart-platform/outputs-icon-2.svg"
            title="Continuously Verifiable SBOMs"
            description="Trusted software inventories with provenance and dependency transparency."
          />
          <OutputCard
            icon="/images/cleanstart-platform/outputs-icon-3.svg"
            title="Contextualized Risk Insights"
            description="Actionable remediation and contextual prioritization through CleanSight."
          />
          <OutputCard
            icon="/images/cleanstart-platform/outputs-icon-4.svg"
            title="Reduced Complexity"
            description="Cleaner software foundations across modern infrastructure environments."
          />
        </div>
      </div>
    </section>
  );
}
