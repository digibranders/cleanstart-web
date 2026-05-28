import type React from "react";

/**
 * "Measure the Difference" section — Figma node 792:2940
 *
 * White background section. All decorative element positions are in the
 * 1920 px Figma artboard coordinate space; proportional calc() converts
 * them to the 1440 px target viewport.
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
      {/* Right-side grid vector removed per design — only the left grid stays. */}

      {/* ── Union hexagon — top-left corner ─────────────────────────────────── */}
      {/* Figma: left=-109px top=-94px size=305.606×318.251px mix-blend:overlay */}
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

      {/* ── Union hexagon — top-right corner ────────────────────────────────── */}
      {/* Figma: left=1214px top=-84px in 1920px frame → proportional left */}
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

      {/* ── Pink / purple ellipse glow — top-right ──────────────────────────── */}
      {/* Figma: left=1238px top=-40px size=258px, inner inset=-94.19% */}
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

      {/* ── Blue ellipse glow — left mid ────────────────────────────────────── */}
      {/* Figma: left=-90px top=153px size=315px, inner inset=-64.44% */}
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

      {/* ── Left grid vector ─────────────────────────────────────────────────── */}
      {/* Figma: left=-163px top=-143px size=565×548px */}
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

      {/* ── Blue ellipse glow — bottom-left ─────────────────────────────────── */}
      {/* Figma: left=-72px top=587px size=315px (clips below section fold) */}
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

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {/* Figma text block: left=302px top=100px w=835px → centered at maxWidth 835px */}
      <div className="relative flex flex-col items-center text-center">
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
      </div>
    </section>
  );
}
