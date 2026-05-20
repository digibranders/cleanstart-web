/*
 * Figma node 583:2328 — 1922×1088 px
 *
 * Section: paddingTop 120px, paddingBottom 160px
 * Heading: 62px Figtree Bold, #111, tracking -3.1px, centered, w=807px, leading-none
 *   → marginBottom 98px (derived: card_top(391) - heading_bottom(244) - card_paddingTop(49) = 98)
 * Cards: 4 absolute-positioned in Figma, mirrored as 2×2 CSS grid
 *   Row gap 97px (708-611) → cell paddingTop/Bottom 49px each
 *   Column widths: each 638px at maxWidth 1276px (no horizontal padding on grid)
 *   Left col gap: 32px · Right col gap: 16px
 * Glow: 165×165px at left=32px top=12px INSIDE the icon container (Figma-native coords)
 * Icon container: outer has no overflow-hidden; inner div clips the icon image
 * Dividers: vertical CSS gradient at 50%, horizontal CSS gradient at 50%
 * Union decorations: xl:block only
 */

export function CisoRisks(): React.ReactElement {
  const risks = [
    {
      icon: "/images/ciso/risks-icon-bloated.png",
      title: "Bloated Public Images",
      description: "Unnecessary packages increase exposure.",
      iconOffset: { top: "-2.03%", left: "8.15%", width: "86.53%", height: "104.52%" },
      iconSize: { width: "296px", height: "220px" },
      gap: "32px",
      textMaxWidth: "294px",
      descMaxWidth: "294px",
    },
    {
      icon: "/images/ciso/risks-icon-inherited.png",
      title: "Inherited Vulnerabilities",
      description: "Most container risk originates upstream",
      iconOffset: { top: "-0.71%", left: "9.12%", width: "83.45%", height: "100.71%" },
      iconSize: { width: "296px", height: "220px" },
      gap: "16px",
      textMaxWidth: "360px",
      descMaxWidth: "280px",
    },
    {
      icon: "/images/ciso/risks-icon-attack.png",
      title: "Expanding Attack Surface",
      description: "Large dependency trees increase operational complexity.",
      iconOffset: { top: "-8.18%", left: "8.45%", width: "87.16%", height: "117.27%" },
      iconSize: { width: "296px", height: "220px" },
      gap: "32px",
      textMaxWidth: "294px",
      descMaxWidth: "260px",
    },
    {
      icon: "/images/ciso/risks-icon-backlogs.png",
      title: "Remediation Backlogs",
      description: "Security teams spend time triaging inherited risk.",
      iconOffset: { top: "1.36%", left: "15.93%", width: "72.54%", height: "96.83%" },
      iconSize: { width: "295px", height: "221px" },
      gap: "16px",
      textMaxWidth: "360px",
      descMaxWidth: "280px",
    },
  ];

  return (
    <section
      data-section="CisoRisks"
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: "120px", paddingBottom: "160px" }}
    >
      {/* ── Union decoration — top-right ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/risks-union-tr.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{ right: "-200px", top: "-600px", width: "1101px", height: "1101px" }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Union decoration — bottom-left ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/risks-union-bl.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{ left: "-621px", bottom: "-400px", width: "1181px", height: "1181px" }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Content container — no horizontal padding so grid fills 1276px ── */}
      <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

        {/* Heading — px-6 for mobile breathing room */}
        <h2
          className="text-center text-[#111] mx-auto px-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            maxWidth: "807px",
            marginBottom: "98px",
          }}
        >
          Most Container Risk Is
          <br />
          Inherited
        </h2>

        {/* 2×2 grid — full 1276px, no horizontal padding */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2">

          {/* Vertical divider */}
          <div
            aria-hidden
            className="absolute hidden sm:block pointer-events-none"
            style={{
              left: "50%",
              top: 0,
              bottom: 0,
              width: "1px",
              background:
                "linear-gradient(180deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)",
            }}
          />
          {/* Horizontal divider */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: "50%",
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)",
            }}
          />

          {risks.map((risk) => (
            <div
              key={risk.title}
              className="relative flex items-center px-6 sm:px-8"
              style={{ paddingTop: "49px", paddingBottom: "49px", gap: risk.gap }}
            >
              {/* ── Icon container ──
                  Outer div: NO overflow-hidden (lets the glow bleed out naturally)
                  Inner div: overflow-hidden clips only the icon image
                  Glow: absolute at Figma-native coords (left:32, top:12) within icon container */}
              <div
                className="relative flex-shrink-0"
                style={{ width: risk.iconSize.width, height: risk.iconSize.height }}
              >
                {/* Ellipse glow — at Figma coordinates: left=32px top=12px of icon container */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{ left: "32px", top: "12px", width: "165px", height: "165px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/ciso/risks-ellipse.svg"
                    alt=""
                    className="absolute block"
                    style={{ inset: "-26.06%" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Icon image — clipped to container bounds */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={risk.icon}
                    alt=""
                    className="absolute pointer-events-none"
                    style={{
                      top: risk.iconOffset.top,
                      left: risk.iconOffset.left,
                      width: risk.iconOffset.width,
                      height: risk.iconOffset.height,
                      maxWidth: "none",
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Text block */}
              <div
                className="flex flex-col flex-1"
                style={{ gap: "23px", maxWidth: risk.textMaxWidth }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(18px, 1.67vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                    color: "#111",
                    maxWidth: "225px",
                  }}
                >
                  {risk.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 1.15vw, 22px)",
                    fontWeight: 400,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.4,
                    color: "#333",
                    maxWidth: risk.descMaxWidth,
                  }}
                >
                  {risk.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
