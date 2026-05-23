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
  { value: "3 Resolved", color: "#d5b7fa" },
  { value: "0.02 / MB", color: "#bcbdf6" },
  { value: "100% Secure", color: "#79d786" },
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
      {/* Cyan glow flare — top-right */}
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

      {/* Content: two columns */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col lg:flex-row items-start justify-between"
        style={{ paddingTop: "120px", paddingBottom: "120px", gap: "40px" }}
      >
        {/* Left — heading + subtitle + 4 feature rows */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ maxWidth: "596px", width: "100%", gap: "24px" }}
        >
          {/* Heading + subtitle block (gap-[32px] between them) */}
          <div className="flex flex-col" style={{ gap: "32px" }}>
            <h2
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 56px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Reduce Noise{" "}
              <span className="cs-text-gradient-impact">at the Source</span>
            </h2>

            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(18px, 1.7vw, 24px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Minimal, hardened images reduce inherited vulnerabilities before
              SCA scanning begins.
            </p>
          </div>

          {/* Feature rows — gap 24px between rows */}
          <div className="flex flex-col" style={{ gap: "24px" }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start" style={{ gap: "16px" }}>
                {/* Icon container */}
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

                {/* Text */}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 2vw, 28px)",
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
                      fontSize: "clamp(15px, 1.4vw, 20px)",
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

        {/* Right — cyan glassmorphic bg + dark mockup card stacked */}
        <div
          className="flex-shrink-0 hidden lg:block"
          style={{ position: "relative", width: "512px", height: "541px" }}
        >
          {/* Cyan glassmorphic background (604:2925) */}
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
            {/* Ellipse 46704 — Figma 817:9438 exact spec.
                315×267 ellipse, rotated 34.99°, top-left −113/−122, blur 105px,
                linear-gradient(183.65deg, #7A29E3 −32.17%, #EF38E8 147.02%) */}
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

          {/* Dark gradient mockup card (604:2961) — 25px right, 19px down */}
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
            {/* Window chrome dots + title — at y=23 from card top */}
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
                  fontSize: "var(--text-t-body-lg)",
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

            {/* Divider — at y=74 from card top */}
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

            {/* Metric rows — first at y=103 from card top, gap 16px, h=48px each */}
            <div
              className="absolute flex flex-col"
              style={{ top: "103px", left: "30px", right: "30px", gap: "16px" }}
            >
              {METRICS.map(({ value, color }) => (
                <div
                  key={value}
                  className="flex items-center justify-end rounded-[8px]"
                  style={{
                    height: "48px",
                    padding: "0 16px",
                    background: "rgba(0,0,0,0.1)",
                    border: "0.5px solid #464646",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                      fontSize: "16px",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      color,
                      opacity: 0.8,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Bar chart area — bottom 30px from card bottom */}
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
              }}
            >
              {BARS.map(({ h, c }, i) => (
                <div
                  key={i}
                  style={{
                    width: "49px",
                    height: `${h}px`,
                    background: c,
                    borderRadius: "8px 8px 0 0",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
