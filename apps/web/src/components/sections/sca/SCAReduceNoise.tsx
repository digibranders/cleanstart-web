import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  {
    icon: "/images/sca/icon-runtime-images.svg",
    title: "Minimal Runtime Images",
    desc: "Unused packages increase exposure.",
  },
  {
    icon: "/images/sca/icon-zero-cves.svg",
    title: "Near-Zero Inherited CVEs",
    desc: "Start from cleaner software foundations.",
  },
  {
    icon: "/images/sca/icon-dep-graphs.svg",
    title: "Smaller Dependency Graphs",
    desc: "Simplify SCA analysis and remediation.",
  },
  {
    icon: "/images/sca/icon-continuous-rebuilds.svg",
    title: "Continuous Rebuilds",
    desc: "Rapidly address newly disclosed vulnerabilities.",
  },
];

const METRICS = [
  { label: "Total Findings", value: "3 Resolved", color: "#d5b7fa" },
  { label: "Vulnerability Density", value: "0.02 / MB", color: "#bcbdf6" },
  {
    label: "Reachability Score",
    value: "100% Secure",
    color: "#79d786",
    highlight: true,
  },
];

const BARS = [
  { h: 120, c: "#2c2d2f" },
  { h: 97, c: "#bfc0fa" },
  { h: 72, c: "#2c2d2f" },
  { h: 78, c: "#d5b7fa" },
  { h: 120, c: "#2c2d2f" },
];

export function SCAReduceNoise(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: "780px",
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.5%, #471ec0 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          top: "-16px",
          right: "130px",
          width: "328px",
          height: "328px",
          background:
            "radial-gradient(ellipse at center, rgba(45,184,249,0.6) 0%, rgba(11,138,227,0.4) 30%, rgba(1,60,125,0.15) 65%, transparent 100%)",
          filter: "blur(4px)",
        }}
      />

      {/* Shrink the inline 120px padding to 60px below lg to remove dead
          space between this section and SCATransform below. */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col lg:flex-row items-start justify-between max-lg:!pt-[60px] max-lg:!pb-[60px]"
        style={{ paddingTop: "120px", paddingBottom: "120px", gap: "40px" }}
      >
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ maxWidth: "596px", width: "100%", gap: "24px" }}
        >
          <div className="flex flex-col" style={{ gap: "32px" }}>
            <Reveal header>
              <h2
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h2)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                }}
              >
                Reduce Noise{" "}
                <span className="cs-text-gradient-impact">at the Source</span>
              </h2>
            </Reveal>

            <Reveal header delay={0.15} y={20}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Minimal, hardened images reduce inherited vulnerabilities before
                SCA scanning begins.
              </p>
            </Reveal>
          </div>

          {/* Mockup body is natively 512×541 with absolute positioning and
              can't fluid-resize; render at native size and CSS-transform scale
              to fit. The outer wrapper reserves scaled layout space via
              aspect-ratio. */}
          <div
            className="lg:hidden mx-auto"
            style={{
              width: "min(512px, calc(100vw - 48px))",
              aspectRatio: "512 / 541",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "512px",
                height: "541px",
                transform: "scale(min(1, calc((100vw - 48px) / 512px)))",
                transformOrigin: "top left",
              }}
            >
              <Mockup />
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: "24px" }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start" style={{ gap: "16px" }}>
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-[8px]"
                  style={{
                    width: "48px",
                    height: "51px",
                    background: "rgba(217,217,217,0.2)",
                    padding: "10px 8px 9px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon}
                    alt=""
                    aria-hidden
                    width={32}
                    height={32}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h3)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#fff",
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
                      color: "#cdcdcd",
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop only; mobile renders a scaled clone inside the left column
            above the feature rows. */}
        <div
          className="flex-shrink-0 hidden lg:block"
          style={{ position: "relative", width: "512px", height: "541px" }}
        >
          <Mockup />
        </div>
      </div>
    </section>
  );
}

/** Sca-analyzer mockup body, natively 512×541. Rendered at native size on
 * desktop and inside a CSS-transform scaling wrapper on mobile. All internals
 * use absolute positioning pinned to those native dimensions. */
function Mockup(): React.ReactElement {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          border: "1.5px solid #076eff",
          background:
            "linear-gradient(90deg, rgba(44,193,235,0.4) 0%, rgba(44,193,235,0.4) 100%)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-113px",
            left: "-122px",
            width: "315px",
            height: "267px",
            borderRadius: "50%",
            background:
              "linear-gradient(183.65deg, #7A29E3 -32.17%, #EF38E8 147.02%)",
            filter: "blur(105px)",
            transform: "rotate(34.99deg)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: "19px",
          left: "25px",
          width: "462px",
          height: "493px",
          borderRadius: "18.762px",
          border: "1.564px solid #dab6f3",
          background:
            "linear-gradient(180deg, #151021 0%, #131e8f 71.2%, #551ece 100%)",
          boxShadow:
            "-160px 80px 50px rgba(0,0,0,0), -102px 51px 46px rgba(0,0,0,0.03), -58px 29px 38px rgba(0,0,0,0.12), -26px 13px 29px rgba(0,0,0,0.2), -6px 3px 16px rgba(0,0,0,0.23)",
          overflow: "hidden",
        }}
      >
        <div
          className="absolute flex items-center"
          style={{ top: "23px", left: "30px", gap: "10px" }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: c,
                flexShrink: 0,
              }}
            />
          ))}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-body)",
              fontWeight: 600,
              letterSpacing: "var(--text-t-body-lg-ls)",
              lineHeight: "var(--text-t-body-lg-lh)",
              color: "#fff",
              marginLeft: "8px",
            }}
          >
            Sca-analyzer --- Scan-minimal
          </span>
        </div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "74px",
            left: "30px",
            right: "30px",
            height: "1px",
            background: "rgba(70,70,70,0.5)",
          }}
        />

        <div
          className="absolute flex flex-col"
          style={{ top: "103px", left: "30px", right: "30px", gap: "16px" }}
        >
          {METRICS.map(({ label, value, color, highlight }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-[8px]"
              style={{
                height: "48px",
                padding: "0 16px",
                background: "rgba(0,0,0,0.1)",
                border: highlight ? "1px solid #2dd4ff" : "0.5px solid #464646",
                boxShadow: highlight
                  ? "0 0 0 1px rgba(45,212,255,0.35), 0 0 12px rgba(45,212,255,0.25)"
                  : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                  fontSize: "var(--fs-body)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                  fontSize: "var(--fs-body)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  color,
                  opacity: 0.9,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "30px",
            right: "30px",
            height: "150px",
            borderRadius: "7px",
            background: "rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "flex-end",
            padding: "0 16px",
            gap: "16px",
            overflow: "hidden",
          }}
        >
          {BARS.map(({ h, c }, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: "49px",
                height: `${h}px`,
                background: c,
                borderRadius: "8px 8px 0 0",
                flexShrink: 0,
              }}
            >
              {/* plus-lighter blend brightens the chart's black floor under
                  each bar without darkening the bar itself. */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "-18px",
                  width: "60px",
                  height: "28px",
                  transform: "translateX(-50%)",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse at center, rgba(122,189,255,0.85) 0%, rgba(45,212,255,0.45) 35%, rgba(45,212,255,0) 70%)",
                  filter: "blur(6px)",
                  mixBlendMode: "plus-lighter",
                  pointerEvents: "none",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
