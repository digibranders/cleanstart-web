const CARDS = [
  {
    title: "Alert Overload",
    desc: "Most findings originate from inherited dependencies.",
    icon: "/images/sca/icon-card-alert.svg",
    iconAlt: "Alert icon",
  },
  {
    title: "Bloated Dependency Trees",
    desc: "Large images create excessive transitive vulnerabilities.",
    icon: "/images/sca/icon-card-snowflake.svg",
    iconAlt: "Dependency tree icon",
  },
  {
    title: "Remediation Fatigue",
    desc: "Teams spend time prioritizing low-value findings.",
    icon: "/images/sca/icon-card-register.svg",
    iconAlt: "Registration icon",
  },
  {
    title: "Delayed Releases",
    desc: "Security backlogs slow software delivery.",
    icon: "/images/sca/icon-card-acute.svg",
    iconAlt: "Clock icon",
  },
];

export function SCAProblems(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Section heading */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111",
          }}
        >
          Traditional SCA Creates Too Much Noise
        </h2>

        {/* Cards — 4 in a row on desktop, 2 on tablet, 1 on mobile */}
        <div
          className="mt-[71px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "32px" }}
        >
          {CARDS.map(({ title, desc, icon, iconAlt }) => (
            <div
              key={title}
              className="relative"
              style={{ width: "100%", aspectRatio: "295/354" }}
            >
              {/* Outer cyan border layer at 30% opacity */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: "40px",
                  background: "linear-gradient(90deg, #2cc1eb 0%, #2cc1eb 100%)",
                  opacity: 0.3,
                }}
              />

              {/* Inner white card */}
              <div
                className="absolute overflow-hidden bg-white"
                style={{
                  inset: "4px",
                  borderRadius: "36px",
                }}
              >
                {/* Purple glow blob at top */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none select-none"
                  style={{
                    top: "28px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "263px",
                    height: "153px",
                    borderRadius: "50%",
                    background: "#df9bff",
                    opacity: 0.3,
                    filter: "blur(66.5px)",
                  }}
                />

                {/* Vertical gradient lines */}
                {[48.47, 120.03, 162.38, 233.94].map((x) => (
                  <div
                    key={x}
                    aria-hidden
                    className="absolute pointer-events-none select-none"
                    style={{
                      top: 0,
                      left: `${x}px`,
                      width: "0.73px",
                      height: "264px",
                      background:
                        "linear-gradient(to bottom, rgba(255,255,255,0), white 50.77%, rgba(255,255,255,0))",
                      opacity: 0.8,
                    }}
                  />
                ))}

                {/* Horizontal gradient lines */}
                {[67.54, 183.54].map((y) => (
                  <div
                    key={y}
                    aria-hidden
                    className="absolute pointer-events-none select-none"
                    style={{
                      top: `${y}px`,
                      left: "-68px",
                      width: "419.134px",
                      height: "1px",
                      background:
                        "linear-gradient(to right, rgba(255,255,255,0), white 50.77%, rgba(255,255,255,0))",
                      opacity: 0.3,
                    }}
                  />
                ))}

                {/* Blue gradient ball — centered, 24px from top */}
                <div
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    top: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "96px",
                    height: "96px",
                    background:
                      "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                    boxShadow: "0px 6.171px 14.537px 0px rgba(28,60,142,0.33)",
                    borderRadius: "160px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon}
                    alt={iconAlt}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Text content — at y=162 from card top */}
                <div
                  className="absolute flex flex-col"
                  style={{
                    top: "162px",
                    left: "24px",
                    right: "24px",
                    gap: "12px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 2vw, 28px)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#111",
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "clamp(15px, 1.4vw, 20px)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.4,
                      color: "#555",
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
