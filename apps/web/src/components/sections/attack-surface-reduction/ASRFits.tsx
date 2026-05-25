import Image from "next/image";

const INTEGRATIONS: { title: string; desc: string; icon: string; iconAlt: string }[] = [
  {
    title: "Drop-in Images",
    desc: "Works with existing workflows.",
    icon: "/images/attack-surface-reduction/icon-monitor.png",
    iconAlt: "Monitor icon",
  },
  {
    title: "Pipeline Compatible",
    desc: "Integrates into CI/CD environments.",
    icon: "/images/attack-surface-reduction/icon-ring.png",
    iconAlt: "Pipeline icon",
  },
  {
    title: "Deploy Anywhere",
    desc: "Cloud, on-prem, or regulated environments.",
    icon: "/images/attack-surface-reduction/icon-gear.png",
    iconAlt: "Deploy icon",
  },
];

export function ASRFits(): React.ReactElement {
  return (
    <section
      data-section="ASRFits"
      className="relative bg-white py-section-md overflow-hidden"
    >
      {/* Decorative gradient ellipses — Figma 46683 + 46691 */}
      {/* Pink ellipse top-right — #DF9BFF @ 0.8 opacity, 121.5px blur, 206×258 */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          right: "-40px",
          top: "120px",
          width: "206px",
          height: "258px",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      {/* Cyan ellipse bottom-left — #2CC1EB @ 0.2 opacity, 101.5px blur, 251×315 */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-71px",
          bottom: "120px",
          width: "251px",
          height: "315px",
          background: "#2CC1EB",
          opacity: 0.2,
          filter: "blur(101.5px)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading row: heading left, subtitle right */}
        <div
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between"
          style={{ marginBottom: "64px", gap: "32px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111111",
              maxWidth: "560px",
            }}
          >
            Fits into what you've{" "}
            <span className="cs-text-gradient-impact">already built</span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "#555555",
              maxWidth: "480px",
            }}
          >
            Stay informed with the latest research, threat intelligence reports, and expert
            analysis from our security team.
          </p>
        </div>

        {/* 3 integration cards — capped + centred per track so they shrink
            (don't stretch to fill the full container width). */}
        <div className="grid grid-cols-1 sm:grid-cols-3 justify-items-center" style={{ gap: "24px" }}>
          {INTEGRATIONS.map((item) => (
            /* Outer 404×368: cyan #2CC1EB @ 0.3 opacity, 40px radius — acts as the
               gradient border ring. 8px padding inset for the inner white card. */
            <div
              key={item.title}
              className="relative flex w-full"
              style={{
                background: "rgba(44, 193, 235, 0.3)",
                borderRadius: "40px",
                padding: "8px",
                aspectRatio: "1 / 1",
                maxWidth: "404px",
              }}
            >
              {/* Inner card: white, 32px radius, 8px inset from outer (via parent padding).
                  flex-1 + w-full so it fills the outer ring on all sides, giving a
                  uniform 8px cyan border at every viewport. container-type
                  scopes the icon's cqi clamp to the card width. */}
              <div
                className="relative flex flex-col overflow-hidden flex-1 w-full"
                style={{
                  background: "#FFFFFF",
                  borderRadius: "32px",
                  padding: "40px 32px",
                  gap: "20px",
                  zIndex: 1,
                  containerType: "inline-size",
                }}
              >
                {/* Decorative blue→purple blob inside the white card. */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: "0%",
                    right: "71.33%",
                    top: "170px",
                    height: "180px",
                    background: "linear-gradient(90deg, #06B6D4 0%, #6366F1 75%)",
                    opacity: 0.25,
                    filter: "blur(32px)",
                    borderRadius: "135px",
                    zIndex: 0,
                  }}
                />

                {/* Pink linear blur inside the white card — Figma 360×153,
                    #DF9BFF @ 0.5, blur 66.5px. Anchored top-left of card
                    (extends past the left edge for a soft pink halo). */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    width: "360px",
                    height: "153px",
                    left: "-120px",
                    top: "51px",
                    background: "#DF9BFF",
                    opacity: 0.5,
                    filter: "blur(66.5px)",
                    zIndex: 0,
                  }}
                />

                {/* Decorative gridlines — final Figma PNG export (388×264).
                    Anchored to the top of the card so it sits behind the icon
                    block. Width fills the card; height stays at natural ratio. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/attack-surface-reduction/Final/card-inner-grid.png"
                  alt=""
                  className="absolute top-0 left-0 w-full pointer-events-none select-none"
                  style={{ zIndex: 0, height: "auto" }}
                  loading="lazy"
                  decoding="async"
                />

                <div className="relative" style={{ zIndex: 1 }}>
                  <Image
                    src={item.icon}
                    alt={item.iconAlt}
                    width={280}
                    height={280}
                    sizes="280px"
                    className="block"
                    style={{ width: "clamp(200px, 65cqi, 280px)", height: "auto" }}
                  />
                </div>
                <h3
                  className="relative"
                  style={{
                    zIndex: 1,
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(22px, 2.4vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    color: "#111111",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="relative"
                  style={{
                    zIndex: 1,
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(15px, 1.4vw, 20px)",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.4,
                    color: "#555555",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
