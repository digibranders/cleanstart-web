/**
 * Figma frame 516:5364 — 1920 × 762 "SBOM Intelligence That Drives Action"
 *
 * Desktop: White backdrop, 4-up card grid with blue 3D ball icons.
 * Mobile (Figma 817:1281): Stacked cards with cyan-framed white cards,
 * blue ball with unique icon per card. Cards at y=2434–3450px on mobile canvas.
 */

const CARDS = [
  {
    id: "coverage",
    title: "Complete Coverage",
    body: "Continuously updated software inventories.",
    icon: "/images/sbom/mobile-adv-1.svg",
    mobileIcon: "/images/sbom/mobile-adv-1.svg",
    // Figma mobile text widths (node 817:1349–1351)
    mobileTitleW: 135,
    mobileBodyW: 155,
  },
  {
    id: "dependency",
    title: "Dependency Mapping",
    body: "Track transitive and inherited dependencies.",
    icon: "/images/sbom/mobile-adv-2.svg",
    mobileIcon: "/images/sbom/mobile-adv-2.svg",
    mobileTitleW: 135,
    mobileBodyW: 187,
  },
  {
    id: "compliance",
    title: "Compliance Readiness",
    body: "Support audit and regulatory requirements.",
    icon: "/images/sbom/mobile-adv-3.svg",
    mobileIcon: "/images/sbom/mobile-adv-3.svg",
    mobileTitleW: 175,
    mobileBodyW: 155,
  },
  {
    id: "visibility",
    title: "Supply Chain Visibility",
    body: "Improve visibility across software ecosystems.",
    icon: "/images/sbom/mobile-adv-4.svg",
    mobileIcon: "/images/sbom/mobile-adv-4.svg",
    mobileTitleW: 135,
    mobileBodyW: 201,
  },
] as const;

export function SbomIntelligence(): React.ReactElement {
  return (
    <section
      data-section="SbomIntelligence"
      className="relative overflow-hidden bg-white"
    >
      {/* Decorative cyan halos — Figma "Union" shapes top-right + bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-220px",
          top: "-160px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "-220px",
          bottom: "-140px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)",
        }}
      />

      {/* ── Heading (shared) ── */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md">
        <div className="text-center mb-10 md:mb-14">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {"SBOM Intelligence That Drives "}
            <span className="cs-text-gradient-impact">Action</span>
          </h2>
        </div>
      </div>

      {/* ── DESKTOP 4-up card grid (sm+) ── */}
      <div className="relative hidden sm:block mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-section-md">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "32px" }}>
          {CARDS.map((card) => (
            <IntelligenceCard key={card.id} title={card.title} body={card.body} icon={card.icon} />
          ))}
        </div>
      </div>

      {/* ── MOBILE stacked cards (< sm) ── Figma pixel-perfect 360px design ── */}
      <div
        className="sm:hidden flex flex-col items-center pb-10"
        style={{ gap: "16px", paddingLeft: "10px", paddingRight: "10px" }}
      >
        {CARDS.map((card) => (
          <MobileIntelligenceCard
            key={card.id}
            title={card.title}
            body={card.body}
            mobileIcon={card.mobileIcon}
            titleW={card.mobileTitleW}
            bodyW={card.mobileBodyW}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Desktop card ─────────────────────────────────────────────────── */
function IntelligenceCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: string;
}): React.ReactElement {
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: "295/324",
        padding: "4px",
        borderRadius: "40px",
        background: "rgba(44,193,235,0.30)",
      }}
    >
      <div
        className="relative overflow-hidden bg-white h-full"
        style={{
          borderRadius: "36px",
          paddingTop: "clamp(60px, 5vw, 88px)",
          paddingBottom: "clamp(20px, 1.67vw, 32px)",
          paddingLeft: "clamp(20px, 1.67vw, 32px)",
          paddingRight: "clamp(20px, 1.67vw, 32px)",
        }}
      >
        {/* Upper purple-pink glow */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{
            left: "50%",
            top: "28px",
            transform: "translateX(-50%)",
            width: "85%",
            height: "153px",
            opacity: 0.3,
            background: "#df9bff",
            filter: "blur(66px)",
            borderRadius: "50%",
          }}
        />
        {/* Faint vertical grid lines */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 56px, rgba(0,0,0,0.04) 56px, rgba(0,0,0,0.04) 57px)",
            opacity: 0.4,
          }}
        />
        {/* Blue 3D ball icon */}
        <div
          className="relative mx-auto flex items-center justify-center"
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0 6.17px 14.54px rgba(28,60,142,0.33), inset 0 -0.23px 0.29px rgba(0,44,179,0.5), inset 0 0.12px 0.58px rgba(255,255,255,0.81)",
            marginTop: "-48px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            aria-hidden
            style={{ width: "54px", height: "54px", display: "block" }}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="relative text-left flex flex-col gap-3">
          <p
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </p>
          <p
            className="text-[#555]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile card (Figma pixel-perfect) ─────────────────────────────── */
function MobileIntelligenceCard({
  title,
  body,
  mobileIcon,
  titleW,
  bodyW,
}: {
  title: string;
  body: string;
  mobileIcon: string;
  titleW: number;
  bodyW: number;
}): React.ReactElement {
  // Figma: icon-area container h=87px top=10px, ball 70px centered vertically.
  // Ball center = 10 + 87/2 = 53.5px → ball top = 53.5 - 35 = 18.5px ≈ 18px.
  const BALL_TOP = 18;
  // Text starts at 108px from inner card top (Figma absolute coord delta).
  const TEXT_TOP = 108;

  return (
    <div
      className="relative"
      style={{ width: "340px", height: "238px" }}
    >
      {/* Outer cyan frame SVG (340×238, opacity 0.3 per Figma) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sbom/mobile-intel-card-frame.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />

      {/* Inner white card — left:6px top:6px w:328px h:226px (Figma delta) */}
      <div
        className="absolute bg-white overflow-hidden"
        style={{
          left: "6px",
          top: "6px",
          width: "328px",
          height: "226px",
          borderRadius: "16px",
        }}
      >
        {/* Purple glow behind ball — w:209 h:90 blur:66.5 top:13px centered */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "13px",
            width: "209px",
            height: "90px",
            background: "#DF9BFF",
            opacity: 0.5,
            filter: "blur(66.5px)",
            borderRadius: "50%",
          }}
        />

        {/* Blue ball — 70px, centered, top:18px (centered in 87px container at top:10px) */}
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: `${BALL_TOP}px`,
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 4.5px 10.6px 0px rgba(28,60,142,0.33), inset 0px -0.17px 0.212px 0px rgba(0,44,179,0.5), inset 0px 0.085px 0.424px 0px rgba(255,255,255,0.81)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileIcon}
            alt=""
            aria-hidden
            width={40}
            height={40}
            className="object-contain relative z-10"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Title + body — top:108px matches Figma (ball bottom 88px → 20px gap) */}
        <div
          className="absolute flex flex-col items-center text-center"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: `${TEXT_TOP}px`,
            gap: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h4)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#000",
              width: `${titleW}px`,
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body-sm)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "#111",
              opacity: 0.8,
              width: `${bodyW}px`,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
