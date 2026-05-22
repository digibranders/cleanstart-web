export function CleanStartImagesHero(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesHero"
      className="relative overflow-hidden"
      style={{
        minHeight: "clamp(720px, 75vw, 1084px)",
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
        style={{ paddingTop: "clamp(72px, 8vw, 128px)", paddingBottom: "clamp(48px, 6vw, 80px)" }}
      >
        <h1
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-hero-product)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: "var(--text-hero-lh)",
            maxWidth: "820px",
          }}
        >
          Approach to CVE Free Container Images
        </h1>

        {/* Diagram — Figma group 161:23277, 1244×466 at y=424 (relative to hero 1084) */}
        <div className="relative mt-[88px] w-full flex justify-center">
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
