import { Reveal } from "@/components/ui/Reveal";

const CARDS = [
  {
    title: "Alert Overload",
    desc: "Most findings originate from inherited dependencies.",
    icon: "/images/sca/problem-ball-alert.webp",
    iconAlt: "Alert icon",
  },
  {
    title: "Bloated Dependency Trees",
    desc: "Large images create excessive transitive vulnerabilities.",
    icon: "/images/sca/problem-ball-bloated.webp",
    iconAlt: "Dependency tree icon",
  },
  {
    title: "Remediation Fatigue",
    desc: "Teams spend time prioritizing low-value findings.",
    icon: "/images/sca/problem-ball-fatigue.webp",
    iconAlt: "Registration icon",
  },
  {
    title: "Delayed Releases",
    desc: "Security backlogs slow software delivery.",
    icon: "/images/sca/problem-ball-delayed.webp",
    iconAlt: "Clock icon",
  },
];

export function SCAProblems(): React.ReactElement {
  return (
    <section
      /* Shrink the inline 120px padding to 60px below lg to avoid 240px of
         stacked dead space between neighboring sections. */
      className="relative overflow-hidden bg-white max-lg:!pt-[60px] max-lg:!pb-[60px]"
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header>
          <h2
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            <span className="block">Traditional SCA Creates</span>
            <span className="block cs-text-gradient-impact">Too Much Noise</span>
          </h2>
        </Reveal>

        <div
          className="mt-[71px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "32px" }}
        >
          {CARDS.map(({ title, desc, icon, iconAlt }) => (
            <div
              key={title}
              /* Tighter mobile aspect ratio: text ends near y=242 for a
                 2-line body, so 245 leaves a small margin instead of the dead
                 space the prior 280 created. */
              className="relative w-full aspect-[295/245] sm:aspect-[295/354]"
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

                <div
                  className="absolute"
                  style={{
                    top: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "96px",
                    height: "96px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon}
                    alt={iconAlt}
                    width={96}
                    height={96}
                    className="block w-full h-full object-contain select-none pointer-events-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div
                  className="absolute flex flex-col text-center sm:text-left"
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
                      fontSize: "var(--fs-h3)",
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
                      fontSize: "var(--fs-body)",
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
