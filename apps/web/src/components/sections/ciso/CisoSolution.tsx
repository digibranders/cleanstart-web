/*
 * Figma node 583:2360 — 1922×789 px
 *
 * Background: linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)
 * paddingTop: 120px · paddingBottom: 120px
 * Heading: 62px Manrope Bold, white, tracking -0.05em, lh 1
 * Subtitle: 30px Figtree/Manrope Regular, opacity 0.8, tracking -0.04em, lh 1.4, maxW 835px
 * Heading → track bar gap: 125px
 * Track bar: h=12px · rgba(255,255,255,0.1) · rounded-[32px] · full 1276px
 * Vertical bars: 4× · h=142px · w=4px · rgba(255,255,255,0.1) · rounded-[20px]
 *   top=3px below track · centered on each column
 * Column flares (Figma technique):
 *   Container 267×289px · flex center · mix-blend-plus-lighter
 *   Inner: rotate(90deg), 289×267px
 *   Content: backgroundImage=solution-flare-gradient.svg + maskImage=flare-mask+flare-overlay
 * Track spotlights (Figma technique):
 *   Container 369×48px · flex center · mix-blend-plus-lighter
 *   Inner: rotate(180deg), 369×48px
 *   Content: backgroundImage=solution-track-gradient.svg + maskImage=track-mask+track-overlay
 * Cards: 4×295px + 3×32px = 1276px · h=164px · border-radius=13.5px · border=1.688px #dab6f3
 *   gradient: #151021→#131e8f(71.2%)→#551ece · padding=24px
 *   cards 120px below track bar
 * Corner vectors: 979×979 · calc-centered from 1922px Figma frame
 */

import React from "react";

const COL_CENTERS = [
  "11.56%", // 147.5 / 1276
  "37.19%", // 474.5 / 1276
  "62.81%", // 801.5 / 1276
  "88.44%", // 1128.5 / 1276
] as const;

const FEATURES = [
  {
    title: "Minimal Runtime\nImages",
    desc: "Reduce unnecessary packages and components.",
  },
  {
    title: "Verifiable\nComponents",
    desc: "Build from trusted sources with reproducible pipelines.",
  },
  {
    title: "Continuously\nUpdated",
    desc: "Rapidly address newly disclosed vulnerabilities.",
  },
  {
    title: "Hardened\nFoundations",
    desc: "Reduce inherited exposure across environments.",
  },
] as const;

// Mask CSS shared properties — intersect composite clips the gradient to the
// intersection of both alpha masks, preventing visible hard rectangular edges.
const maskBase: React.CSSProperties = {
  maskMode: "alpha",
  maskComposite: "intersect" as const,
  maskRepeat: "no-repeat",
  maskSize: "100% 100%, 100% 100%",
  maskPosition: "0px 0px, 0px 0px",
};

export function CisoSolution(): React.ReactElement {
  return (
    <section
      data-section="CisoSolution"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
        paddingTop: "120px",
        paddingBottom: "120px",
      }}
    >
      {/* ── Corner vector — top-left: Figma x=-423, frame-center=961 → calc(50% - 1384px) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/solution-vector.svg"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{ left: "calc(50% - 1384px)", top: "-303px", width: "979px", height: "979px" }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Corner vector — top-right: Figma x=1444 → calc(50% + 483px) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/solution-vector.svg"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{ left: "calc(50% + 483px)", top: "-372px", width: "979px", height: "979px" }}
        loading="lazy"
        decoding="async"
      />

      {/* ── 1276px content container — no horizontal padding (track fills edge-to-edge) ── */}
      <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

        {/* Heading group — px-6 for mobile */}
        <div className="text-center px-6" style={{ marginBottom: "125px" }}>
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-display-2)",
              fontWeight: 700,
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              marginBottom: "24px",
            }}
          >
            Reduce Risk Before Deployment
          </h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-subhead)",
              fontWeight: 400,
              letterSpacing: "var(--text-t-subhead-ls)",
              lineHeight: "var(--text-t-subhead-lh)",
              color: "rgba(255,255,255,0.8)",
              maxWidth: "835px",
              margin: "0 auto",
            }}
          >
            Minimal, hardened container images reduce inherited vulnerabilities
            before they reach production environments.
          </p>
        </div>

        {/* ── Track section — overflow visible so flares bleed above ── */}
        <div className="relative" style={{ overflow: "visible" }}>

          {/* Track rail */}
          <div
            aria-hidden
            className="hidden xl:block"
            style={{
              height: "12px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "32px",
            }}
          />

          {/* ── Per-column decorations (xl only) ── */}
          {COL_CENTERS.map((centerPct) => (
            <React.Fragment key={centerPct}>

              {/* ── Column teal flare — exact Figma technique ──
                  Outer: 267×289px flex-center, mix-blend-plus-lighter
                  Inner: rotate(90deg) 289×267px
                  Content: gradient SVG bg + two CSS masks */}
              <div
                aria-hidden
                className="hidden xl:flex absolute pointer-events-none"
                style={{
                  left: `calc(${centerPct} - 133.5px)`,
                  top: "-75px",
                  width: "267px",
                  height: "289px",
                  alignItems: "center",
                  justifyContent: "center",
                  mixBlendMode: "plus-lighter",
                }}
              >
                <div style={{ flexShrink: 0, transform: "rotate(90deg)" }}>
                  <div style={{ height: "267px", position: "relative", width: "289px" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "url('/images/ciso/solution-flare-gradient.svg')",
                        backgroundSize: "100% 100%",
                        maskImage:
                          "url('/images/ciso/solution-flare-mask.svg'), url('/images/ciso/solution-flare-overlay.png')",
                        ...maskBase,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Track spotlight — exact Figma technique ──
                  Outer: 369×48px flex-center, mix-blend-plus-lighter
                  Inner: rotate(180deg) 369×48px
                  Content: gradient SVG bg + two CSS masks */}
              <div
                aria-hidden
                className="hidden xl:flex absolute pointer-events-none"
                style={{
                  left: `calc(${centerPct} - 184.5px)`,
                  top: "-18px",
                  width: "369px",
                  height: "48px",
                  alignItems: "center",
                  justifyContent: "center",
                  mixBlendMode: "plus-lighter",
                }}
              >
                <div style={{ flexShrink: 0, transform: "rotate(180deg)" }}>
                  <div style={{ height: "48px", position: "relative", width: "369px" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "url('/images/ciso/solution-track-gradient.svg')",
                        backgroundSize: "100% 100%",
                        maskImage:
                          "url('/images/ciso/solution-track-mask.svg'), url('/images/ciso/solution-track-overlay.png')",
                        ...maskBase,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Vertical indicator bar — 4×142px · top=3px below rail */}
              <div
                aria-hidden
                className="hidden xl:block absolute pointer-events-none"
                style={{
                  left: `calc(${centerPct} - 2px)`,
                  top: "3px",
                  width: "4px",
                  height: "142px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                }}
              />

            </React.Fragment>
          ))}

          {/* ── Feature cards ──
              xl: grid-cols-4 + gap-[32px] on 1276px = exactly 295px each column
              Mobile: 1 col → sm: 2 col */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 xl:gap-[32px] px-6 xl:px-0"
            style={{ marginTop: "120px" }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="relative overflow-hidden flex flex-col"
                style={{
                  minHeight: "164px",
                  borderRadius: "13.5px",
                  border: "1.688px solid #dab6f3",
                  background:
                    "linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)",
                  boxShadow:
                    "-4.502px 2.251px 11.255px 0px rgba(0,0,0,0.23)," +
                    "-18.571px 9.004px 20.822px 0px rgba(0,0,0,0.20)," +
                    "-41.645px 20.822px 27.576px 0px rgba(0,0,0,0.12)",
                  padding: "24px",
                }}
              >
                {/* Card inner glow — ellipse A (large purple blur, centered-left) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/ciso/solution-ellipse-a.svg"
                  alt=""
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: "-25%",
                    top: "-20%",
                    width: "130%",
                    height: "150%",
                    objectFit: "fill",
                  }}
                  loading="lazy"
                  decoding="async"
                />
                {/* Card inner glow — ellipse B (wider diffuse glow) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/ciso/solution-ellipse-b.svg"
                  alt=""
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: "-30%",
                    top: "-30%",
                    width: "150%",
                    height: "180%",
                    objectFit: "fill",
                    opacity: 0.6,
                  }}
                  loading="lazy"
                  decoding="async"
                />

                <h3
                  className="relative text-white"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-t-heading-lg)",
                    fontWeight: 500,
                    letterSpacing: "var(--text-t-heading-lg-ls)",
                    lineHeight: "var(--text-t-heading-lg-lh)",
                    marginBottom: "12px",
                    whiteSpace: "pre-line",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  className="relative"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-t-body-lg)",
                    fontWeight: 400,
                    letterSpacing: "var(--text-t-body-lg-ls)",
                    lineHeight: "var(--text-t-body-lg-lh)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
