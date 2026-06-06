import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
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

      {/* Positioned partly off-screen by design; the negative offset must not be clamped. */}
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
          src="/images/cleansight/blindspot-corner-hex.webp"
          alt=""
          width={415}
          height={413}
          sizes="591px"
          className="object-contain"
        />
      </div>

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
          src="/images/cleansight/blindspot-corner-hex.webp"
          alt=""
          width={415}
          height={413}
          sizes="591px"
          className="object-contain"
        />
      </div>

      {/* Padding, gap, and radar size are bound to viewport height so the dial stays
          fully visible on a typical laptop viewport without scroll-clipping. */}
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
        <Reveal header>
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
        </Reveal>

        {/* Sweep is locked to the dial radius via a closest-side mask so it always
            reaches the inner ring regardless of the clamped width. */}
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
