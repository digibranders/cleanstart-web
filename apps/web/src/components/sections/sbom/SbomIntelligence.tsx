/**
 * Figma frame 516:5364 (top half) — 1920 × 762 "SBOM Intelligence That Drives Action"
 *
 * White backdrop with subtle cyan halos. Four equally-spaced cards in a row:
 *   • outer  295 × 324 — cyan rgba(44,193,235) gradient halo, rounded-40
 *   • inner  white card, rounded-36 with grid texture + soft purple top glow
 *   • blue 3D ball icon (96×96), title (text-card-title-lg), body (text-body-md)
 *
 * Responsive: 4-up on lg, 2-up on sm, stacked on mobile. Uses py-section-md
 * vertical padding token and standard mx-auto max-w-[var(--container-default)] rail.
 */

const CARDS = [
  { id: "coverage",   title: "Complete Coverage",      body: "Continuously updated software inventories." },
  { id: "dependency", title: "Dependency Mapping",     body: "Track transitive and inherited dependencies." },
  { id: "compliance", title: "Compliance Readiness",   body: "Support audit and regulatory requirements." },
  { id: "visibility", title: "Supply Chain Visibility", body: "Improve visibility across software ecosystems." },
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 py-section-md">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-14">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {"SBOM Intelligence That Drives "}
            <span
              style={{
                background:
                  "linear-gradient(-11.94deg, #2CC1EB 0%, #9A51FF 63.96%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Action
            </span>
          </h2>
        </div>

        {/* 4-up card grid (site convention) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: "32px" }}>
          {CARDS.map((card) => (
            <IntelligenceCard key={card.id} title={card.title} body={card.body} />
          ))}
        </div>
      </div>
    </section>
  );
}

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
        background:
          "linear-gradient(180deg, rgba(44,193,235,0.30) 0%, rgba(44,193,235,0.08) 60%, rgba(44,193,235,0) 100%)",
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
        {/* Upper purple-pink glow (Figma) */}
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

        {/* Title + body */}
        <div className="relative text-left flex flex-col gap-3">
          <p className="text-card-title-lg text-[#111]" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </p>
          <p className="text-body-md text-[#555]" style={{ fontFamily: "var(--font-display)" }}>
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
