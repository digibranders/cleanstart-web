/*
 * Figma node 583:2328 — 1922×1088 px (desktop)
 * Figma node 896:495  — 360×964px  (mobile, node 856:1087)
 *
 * ── DESKTOP (≥ sm) ───────────────────────────────────────────────────────────
 * Section: paddingTop 120px, paddingBottom 160px
 * Heading: 56px Manrope Bold, #111, tracking -0.04em, centered, w=807px, lh 1.1
 *   → marginBottom 98px
 * Cards: 2×2 CSS grid — 638px each column at 1276px max-width
 *   Left col gap: 32px · Right col gap: 16px
 * Glow: 165×165px at left=32px top=12px INSIDE the icon container
 * Icon container: 296×220px · inner div clips icon image
 * Dividers: vertical gradient at 50%, horizontal gradient at 50%
 * Union decorations: lg:block only
 *
 * ── MOBILE (< sm) ────────────────────────────────────────────────────────────
 * Heading: 28px Manrope Bold, #111, tracking -0.05em, centered, lh 1.2
 * 4 cards — single column, 16px gap, px-4 side padding
 *   Card: 328×206px, white rounded-[16px], subtle border
 *   Icon container: 108×87px, centered, top=20px from card top
 *   Glow: 79.75×79.75px at left=-1.45px top=0.24px within icon container
 *   Text block: top=112px from card top, centered, gap=12px
 *     Title: Manrope SemiBold 20px, tracking=-0.05em (-1px), #000, lh=1
 *     Desc:  Sora Regular 14px, tracking=-0.04em (-0.56px), #111, 80% opacity, lh=1.1
 *     Desc max-widths: 199px · 181px · 199px · 199px
 */

export function CisoRisks(): React.ReactElement {
  const risks = [
    {
      icon: "/images/ciso/risks-icon-bloated.png",
      title: "Bloated Public Images",
      description: "Unnecessary packages increase exposure.",
      iconOffset: { top: "-2.03%", left: "8.15%", width: "86.53%", height: "104.52%" },
      gap: "32px",
      textMaxWidth: "294px",
      descMaxWidth: "294px",
      descMaxWidthMobile: "199px",
    },
    {
      icon: "/images/ciso/risks-icon-inherited.png",
      title: "Inherited Vulnerabilities",
      description: "Most container risk originates upstream",
      iconOffset: { top: "-0.71%", left: "9.12%", width: "83.45%", height: "100.71%" },
      gap: "16px",
      textMaxWidth: "360px",
      descMaxWidth: "280px",
      descMaxWidthMobile: "181px",
    },
    {
      icon: "/images/ciso/risks-icon-attack.png",
      title: "Expanding Attack Surface",
      description: "Large dependency trees increase operational complexity.",
      iconOffset: { top: "-8.18%", left: "8.45%", width: "87.16%", height: "117.27%" },
      gap: "32px",
      textMaxWidth: "294px",
      descMaxWidth: "260px",
      descMaxWidthMobile: "199px",
    },
    {
      icon: "/images/ciso/risks-icon-backlogs.png",
      title: "Remediation Backlogs",
      description: "Security teams spend time triaging inherited risk.",
      iconOffset: { top: "1.36%", left: "15.93%", width: "72.54%", height: "96.83%" },
      gap: "16px",
      textMaxWidth: "360px",
      descMaxWidth: "280px",
      descMaxWidthMobile: "199px",
    },
  ];

  return (
    <section
      data-section="CisoRisks"
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: "clamp(60px, 9.4vw, 120px)", paddingBottom: "clamp(60px, 12.5vw, 160px)" }}
    >
      {/* ── Union decoration — top-right ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/risks-union-tr.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
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
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-621px", bottom: "-400px", width: "1181px", height: "1181px" }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Content container ── */}
      <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

        {/* Heading — shared across breakpoints, font size responsive
            Mobile: 28px Bold lh=1.2 (Figma 856:1086)
            Desktop: 56px Bold lh=1.1 (Figma 583:2328) */}
        <h2
          className="text-center text-[#111] mx-auto px-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-md)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "807px",
            marginBottom: "clamp(32px, 7.7vw, 98px)",
          }}
        >
          Most Container Risk Is Inherited
        </h2>

        {/* ════════════════════════════════════════════════════════════════════
            MOBILE — single column card stack (< sm = 640px)
            Figma 896:495 — 4 vertical cards, 16px gap, 16px side padding
            Each card: 328×206px, white bg, rounded-[16px]
            Icon: 108×87px centered at top=20px
            Glow: 79.75×79.75px at left=-1.45px top=0.24px (mobile size)
            Text: top=112px, gap=12px, centered
        ════════════════════════════════════════════════════════════════════ */}
        <div className="sm:hidden flex flex-col gap-4 px-4">
          {risks.map((risk) => (
            <div
              key={risk.title}
              className="relative bg-white"
              style={{
                minHeight: "206px",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0px 4px 24px 0px rgba(0,0,0,0.10)",
              }}
            >
              {/* Icon container — 108×87px, centered horizontally, 20px from card top */}
              <div
                className="absolute"
                style={{
                  top: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "108px",
                  height: "87px",
                }}
              >
                {/* Ellipse glow — mobile: 130px centered on icon container */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "130px", height: "130px" }}
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

                {/* Icon image — clipped to container, same % offsets as desktop */}
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

              {/* Text block — centered, top=112px from card top, gap=12px */}
              <div
                className="absolute"
                style={{ top: "112px", left: 0, right: 0 }}
              >
                <div className="flex flex-col items-center text-center" style={{ gap: "12px" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-card-title-md)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#000",
                      margin: 0,
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-body-sm)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.4,
                      color: "#111",
                      opacity: 0.8,
                      maxWidth: risk.descMaxWidthMobile,
                      margin: 0,
                    }}
                  >
                    {risk.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            DESKTOP — 2×2 grid (≥ sm = 640px)
            Figma 583:2328 — horizontal layout, icon left, text right
            With vertical + horizontal gradient dividers
        ════════════════════════════════════════════════════════════════════ */}
        <div className="hidden sm:block">
          <div className="relative grid sm:grid-cols-2">

            {/* Vertical divider */}
            <div
              aria-hidden
              className="absolute pointer-events-none"
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
                className="relative flex flex-row items-center px-8"
                style={{ paddingTop: "49px", paddingBottom: "49px", gap: risk.gap }}
              >
                {/* ── Icon container — 296×220px with glow and clipped icon image ── */}
                <div className="relative flex-shrink-0" style={{ width: "296px", height: "220px" }}>
                  {/* Ellipse glow — desktop: 165×165px at left=32px top=12px */}
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
                  className="flex flex-col"
                  style={{ gap: "16px", maxWidth: risk.textMaxWidth }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-card-title-lg)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#111",
                      maxWidth: "225px",
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-body-lg)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
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

      </div>
    </section>
  );
}
