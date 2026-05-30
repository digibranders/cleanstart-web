import type React from "react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * "Measure the Difference" section.
 *
 * White background. Decorative element positions are in 1920px artboard
 * coordinates; proportional calc() converts them to the 1440px target viewport.
 */
export function CleanStartImagesMeasure(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesMeasure"
      className="relative overflow-hidden bg-white"
      style={{
        // Top padding spaces the heading from the section above; bottom padding
        // reserves clear room for the overlapping CTA card below so the
        // description doesn't get clipped at any viewport.
        paddingTop: "clamp(56px, 6vw, 96px)",
        paddingBottom: "var(--spacing-section-cta)",
      }}
    >
      {/* Union hexagon — top-left corner */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "-109px",
          top: "-94px",
          width: "305.606px",
          height: "318.251px",
          mixBlendMode: "overlay",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-union-hex.svg"
          alt=""
          width={211}
          height={246}
          style={{
            display: "block",
            width: "211px",
            height: "246px",
            flexShrink: 0,
            transform: "rotate(-150deg) scaleY(-1)",
            opacity: 0.3,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Union hexagon — top-right corner */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "calc(1214 / 1920 * 100%)",
          top: "-84px",
          width: "305.606px",
          height: "318.251px",
          mixBlendMode: "overlay",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-union-hex.svg"
          alt=""
          width={211}
          height={246}
          style={{
            display: "block",
            width: "211px",
            height: "246px",
            flexShrink: 0,
            transform: "rotate(-150deg) scaleY(-1)",
            opacity: 0.3,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Pink / purple ellipse glow — top-right */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "calc(1238 / 1920 * 100%)",
          top: "-40px",
          width: "258px",
          height: "258px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-94.19%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/measure-pink-glow.svg"
            alt=""
            width={744}
            height={744}
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Blue ellipse glow — left mid */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-90px",
          top: "153px",
          width: "315px",
          height: "315px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-64.44%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/env-ellipse-glow.svg"
            alt=""
            width={721}
            height={721}
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Left grid vector */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "-163px",
          top: "-143px",
          width: "565px",
          height: "548px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/measure-grid-left.svg"
          alt=""
          width={1101}
          height={1101}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Blue ellipse glow — bottom-left (clips below the section fold) */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-72px",
          top: "587px",
          width: "315px",
          height: "315px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-64.44%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/env-ellipse-glow.svg"
            alt=""
            width={721}
            height={721}
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="relative flex flex-col items-center text-center">
        <Reveal header>
          <h2
            className="font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "clamp(500px, 58vw, 835px)",
            }}
          >
            Measure the Difference
          </h2>
        </Reveal>
        <Reveal header delay={0.15} y={20}>
          <p
            className="font-sans mt-6 mx-auto"
            style={{
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
              color: "rgba(17, 17, 17, 0.8)",
              maxWidth: "clamp(400px, 58vw, 835px)",
            }}
          >
            Estimate how smaller, hardened images can reduce inherited
            vulnerabilities and operational overhead.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
