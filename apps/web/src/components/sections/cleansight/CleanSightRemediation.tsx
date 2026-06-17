import Image from "next/image";

import { Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { RemediationFlow } from "./remediation-flow/RemediationFlow";

export function CleanSightRemediation(): React.ReactElement {
  return (
    <section
      data-section="CleanSightRemediation"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)",
      }}
    >
      {/* Decorative union ring — top-left, partially off-screen by design. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/blindspot-union-left.svg"
        alt=""
        style={{
          left: "calc(-880 / 1440 * 100%)",
          top: "-448px",
          width: "min(1181px, 82vw)",
          height: "min(1181px, 82vw)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Decorative union ring — right side. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/blindspot-union-right.svg"
        alt=""
        style={{
          left: "calc(130 / 1440 * 100%)",
          top: "20px",
          width: "min(1181px, 82vw)",
          height: "min(1181px, 82vw)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Corner hex glow — top-left. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "calc(-184 / 1440 * 100%)",
          top: "-129px",
          width: "410px",
          height: "410px",
          transform: "rotate(-46.54deg)",
          opacity: 0.2,
        }}
      >
        <Image
          src="/images/cleansight/blindspot-corner-hex.webp"
          alt=""
          width={415}
          height={413}
          sizes="410px"
          className="object-contain"
        />
      </div>

      {/* Corner hex glow — top-right. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "calc(1249 / 1440 * 100%)",
          top: "-146px",
          width: "410px",
          height: "410px",
          transform: "scaleY(-1) rotate(-133.46deg)",
          opacity: 0.2,
        }}
      >
        <Image
          src="/images/cleansight/blindspot-corner-hex.webp"
          alt=""
          width={415}
          height={413}
          sizes="410px"
          className="object-contain"
        />
      </div>

      <Container className="relative flex flex-col items-center text-center py-section-md">
        <Reveal header>
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "720px",
            }}
          >
            Visibility Without Verified Remediation Falls{" "}
            <span className="cs-text-gradient-impact">Short</span>
          </h2>
        </Reveal>

        <Reveal header delay={0.1} y={20} className="mt-6" style={{ maxWidth: "808px" }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "rgba(255, 255, 255, 0.9)",
            }}
          >
            Correlate inherited software risk across environments and accelerate
            remediation with verified alternatives.
          </p>
        </Reveal>

        {/* Flow diagram: Vulnerability → Affected Component → Images →
            Environments → Remediation Recommendation. Built in SVG + HTML
            (no raster) — see ./remediation-flow. */}
        <Reveal delay={0.15} className="mt-10 lg:mt-[60px] w-full">
          <RemediationFlow />
        </Reveal>
      </Container>
    </section>
  );
}
