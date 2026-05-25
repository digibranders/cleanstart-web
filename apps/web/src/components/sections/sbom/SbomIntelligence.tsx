/**
 * Figma frame 516:5364 — 1920 × 762 "SBOM Intelligence That Drives Action"
 *
 * Desktop: White backdrop, 4-up card grid with blue 3D ball icons.
 * Mobile (Figma 817:1281): Stacked cards with cyan-framed white cards,
 * blue ball with unique icon per card. Cards at y=2434–3450px on mobile canvas.
 */

import Image from "next/image";

const CARDS = [
  {
    id: "coverage",
    title: "Complete Coverage",
    body: "Continuously updated software inventories.",
    mobileIcon: "/images/sbom/mobile-adv-1.png",
  },
  {
    id: "dependency",
    title: "Dependency Mapping",
    body: "Track transitive and inherited dependencies.",
    mobileIcon: "/images/sbom/mobile-adv-2.png",
  },
  {
    id: "compliance",
    title: "Compliance Readiness",
    body: "Support audit and regulatory requirements.",
    mobileIcon: "/images/sbom/mobile-adv-3.png",
  },
  {
    id: "visibility",
    title: "Supply Chain Visibility",
    body: "Improve visibility across software ecosystems.",
    mobileIcon: "/images/sbom/mobile-adv-4.png",
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
              fontSize: "clamp(28px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
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
            <IntelligenceCard key={card.id} title={card.title} body={card.body} />
          ))}
        </div>
      </div>

      {/* ── MOBILE stacked cards (< sm) ── Figma pixel-perfect 360px design ── */}
      <div
        className="sm:hidden flex flex-col items-center pb-10"
        style={{ gap: "16px", paddingLeft: "10px", paddingRight: "10px" }}
      >
        {CARDS.map((card) => (
          <MobileIntelligenceCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  );
}

/* ── Desktop card ─────────────────────────────────────────────────── */
function IntelligenceCard({
  title,
  body,
}: {
  title: string;
  body: string;
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
            src="/images/sbom/icon-cubes.svg"
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
              fontSize: "clamp(20px, 2vw, 28px)",
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
              fontSize: "clamp(15px, 1.4vw, 20px)",
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
}: {
  title: string;
  body: string;
  mobileIcon: string;
}): React.ReactElement {
  return (
    <div
      className="relative"
      style={{ width: "340px", height: "238px" }}
    >
      {/* Outer cyan frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sbom/mobile-intel-card-frame.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />
      {/* Inner white card */}
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
        {/* Purple glow at top */}
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

        {/* Blue ball with unique icon */}
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "10px",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 4.5px 10.6px 0px rgba(28,60,142,0.33), inset 0px -0.17px 0.212px 0px rgba(0,44,179,0.5), inset 0px 0.085px 0.424px 0px rgba(255,255,255,0.81)",
          }}
        >
          <Image
            src={mobileIcon}
            alt=""
            aria-hidden
            width={40}
            height={40}
            className="object-contain relative z-10"
            loading="lazy"
          />
        </div>

        {/* Title + body */}
        <div
          className="absolute flex flex-col items-center text-center"
          style={{ left: "50%", transform: "translateX(-50%)", top: "108px", gap: "12px" }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#000",
              width: "135px",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "#111",
              opacity: 0.8,
              width: "187px",
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
