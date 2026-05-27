import Image from "next/image";

import { RadarScanner } from "./RadarScanner";

export function CleanSightBlindSpots(): React.ReactElement {
  return (
    <section
      data-section="CleanSightBlindSpots"
      className="relative overflow-hidden"
      style={{
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

      {/* Content stack — heading + radar share a flex column so spacing scales fluidly across viewports.
          Padding / gap / radar size are all bound to viewport HEIGHT as well so the whole section
          stays inside a typical laptop viewport (~813px effective) without scroll-clipping the dial. */}
      <div
        className="relative flex flex-col items-center mx-auto"
        style={{
          paddingTop: "clamp(40px, 6vh, 88px)",
          paddingBottom: "clamp(40px, 6vh, 88px)",
          paddingLeft: "16px",
          paddingRight: "16px",
          gap: "clamp(28px, 4vh, 64px)",
          maxWidth: "1200px",
        }}
      >
        <h2
          className="text-white text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "686px",
          }}
        >
          Visibility Without Context Creates{" "}
          <span className="cs-text-gradient-impact">Blind Spots</span>
        </h2>

        {/* Radar visualization — width is the lesser of 70vw, 60vh, and the 580px cap, with a 300px floor.
            Sweep is locked to dial radius via closest-side mask, so it always reaches the inner blue ring. */}
        <div
          className="relative"
          style={{
            width: "clamp(300px, min(70vw, 60vh), 580px)",
            aspectRatio: "580 / 565",
          }}
        >
          <RadarScanner />
        </div>
      </div>
    </section>
  );
}
