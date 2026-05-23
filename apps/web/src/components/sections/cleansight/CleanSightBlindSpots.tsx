import Image from "next/image";

export function CleanSightBlindSpots(): React.ReactElement {
  return (
    <section
      data-section="CleanSightBlindSpots"
      className="relative overflow-hidden"
      style={{
        minHeight: "908px",
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)",
      }}
    >
      {/* Union right — decorative geometric shape, right side */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/blindspot-union-right.svg"
        alt=""
        style={{
          left: "calc(1145 / 1920 * 100%)",
          top: "195px",
          width: "min(1181px, 61.5vw)",
          height: "min(1181px, 61.5vw)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Union left — decorative geometric shape, top-left (intentionally off-screen) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/blindspot-union-left.svg"
        alt=""
        style={{
          left: "calc(-588 / 1920 * 100%)",
          top: "-448px",
          width: "min(1181px, 61.5vw)",
          height: "min(1181px, 61.5vw)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Corner hex — bottom-left, rotated, opacity 20% */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-231px",
          top: "572px",
          width: "580px",
          height: "580px",
          transform: "rotate(-46.54deg)",
          opacity: 0.2,
        }}
      >
        <Image
          src="/images/cleansight/blindspot-corner-hex.png"
          alt=""
          width={415}
          height={413}
          sizes="591px"
          className="object-contain"
        />
      </div>

      {/* Corner hex — top-right, rotated, opacity 20% */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "1624px",
          top: "-221px",
          width: "591px",
          height: "591px",
          transform: "rotate(-46.54deg)",
          opacity: 0.2,
        }}
      >
        <Image
          src="/images/cleansight/blindspot-corner-hex.png"
          alt=""
          width={415}
          height={413}
          sizes="591px"
          className="object-contain"
        />
      </div>

      {/* Heading — top:80px per Figma, centered over 686px width */}
      <div
        className="relative text-center mx-auto"
        style={{ paddingTop: "var(--spacing-section-md)", maxWidth: "686px", paddingLeft: "16px", paddingRight: "16px" }}
      >
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
          Visibility Without Context Creates Blind{" "}
          <span className="cs-text-gradient-impact">Spots</span>
        </h2>
      </div>

      {/* Radar visualization — centered, top:274px from section top per Figma */}
      <div
        className="absolute left-1/2"
        style={{
          top: "274px",
          transform: "translateX(-50%)",
          width: "clamp(280px, 45vw, 580px)",
          height: "clamp(280px, 45vw, 565px)",
        }}
      >
        <Image
          src="/images/cleansight/blindspot-radar.png"
          alt="Container visibility radar showing blind spots"
          fill
          className="object-contain relative z-10"
          sizes="(max-width: 768px) 280px, 580px"
        />
      </div>
    </section>
  );
}
