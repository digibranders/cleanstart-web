/*
 * Figma node 583:2360 — 1922×789 px (desktop)
 * Figma node 856:1120 — 360×964 px (mobile)
 *
 * Background: linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)
 *
 * ── DESKTOP (≥ sm) ───────────────────────────────────────────────────────────
 * paddingTop: 120px · paddingBottom: 120px
 * Heading: 62px Manrope Bold, white, tracking -0.05em, lh 1
 * Subtitle: 30px Sora Regular, opacity 0.8, tracking -0.04em, lh 1.4, maxW 835px
 * Heading → track bar gap: 125px
 * Track bar: h=12px · rgba(255,255,255,0.1) · rounded-[32px] · full 1276px
 * Vertical bars: 4× · h=142px · w=4px · rgba(255,255,255,0.1) · rounded-[20px]
 * Column flares: 267×289px · mix-blend-plus-lighter · solution-flare-gradient.svg
 * Track spotlights: 369×48px · mix-blend-plus-lighter · solution-track-gradient.svg
 * Cards: 4×295px + 3×32px = 1276px · h=164px · border-radius=13.5px · border=1.688px #dab6f3
 *   gradient: #151021→#131e8f(71.2%)→#551ece · padding=24px
 * Corner vectors: 979×979 · calc-centered from 1922px Figma frame
 *
 * ── MOBILE (< sm) ────────────────────────────────────────────────────────────
 * paddingTop: 32px
 * Heading: 28px Manrope SemiBold, white, tracking -0.05em, lh 1.2, maxW 259px, centered
 * Subtitle: 16px Sora Regular, opacity 0.8, tracking -0.07em, lh 1.4, maxW 282px, centered
 * Layout: left column (connector + teal glow nodes) + right column (cards)
 * Vertical connector: 4×456px · rgba(255,255,255,0.1) · left=60px · rounded-[32px]
 * Teal glow nodes: 98×87px · mix-blend-plus-lighter at each row (left=40px)
 * Cards: 226×114px · right=41px from section right · left=93px
 *   border: 2.241px solid #dab6f3 · border-radius: 17.928px
 *   gradient: #151021→#131e8f(71.2%)→#551ece
 *   shadow: multi-layer rgba(0,0,0,...)
 * Card text: title=18px Manrope Medium tracking=-0.05em lh=1
 *            desc=14px Sora Regular tracking=-0.07em lh=1.5 opacity=0.8
 *   padding: left=24px top=24px gap=6px
 * Row gap: 16px between cards
 * Corner vector: 534×534px at left=-87px top=-349px
 */

"use client";

import React from "react";
import { Reveal } from "@/components/ui/Reveal";

const COL_CENTERS = [
  "11.56%", // 147.5 / 1276
  "37.19%", // 474.5 / 1276
  "62.81%", // 801.5 / 1276
  "88.44%", // 1128.5 / 1276
] as const;

const FEATURES = [
  {
    titleDesktop: "Minimal Runtime\nImages",
    titleMobile: "Minimal Runtime Images",
    desc: "Reduce unnecessary packages and components.",
    descWidth: "185px",
  },
  {
    titleDesktop: "Verifiable\nComponents",
    titleMobile: "Verifiable Components",
    desc: "Build from trusted sources with reproducible pipelines.",
    descWidth: "173px",
  },
  {
    titleDesktop: "Continuously\nUpdated",
    titleMobile: "Continuously Updated",
    desc: "Rapidly address newly disclosed vulnerabilities.",
    descWidth: "185px",
  },
  {
    titleDesktop: "Hardened\nFoundations",
    titleMobile: "Hardened Foundations",
    desc: "Reduce inherited exposure across environments.",
    descWidth: "170px",
  },
] as const;

// Mask CSS shared properties
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
      }}
    >

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE — vertical timeline rebuilt in JSX to match the Figma comp
          (heading + subtitle + cyan glow rail + 4 glassmorphic feature
          cards). Replaces the previous flattened PNG so the layout is
          fully selectable, responsive, and accessible to screen readers.
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="sm:hidden relative"
        style={{ paddingTop: "32px", paddingBottom: "64px" }}
      >
        {/* Heading */}
        <h2
          className="text-center text-white mx-auto px-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            marginBottom: "16px",
            maxWidth: "320px",
          }}
        >
          Reduce Risk Before Deployment
        </h2>

        {/* Subtitle */}
        <p
          className="text-center mx-auto px-6"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.8)",
            maxWidth: "320px",
            marginBottom: "40px",
          }}
        >
          Minimal, hardened container images reduce inherited vulnerabilities
          before they reach production environments.
        </p>

        {/* Timeline + Cards container */}
        <div
          className="relative mx-auto"
          style={{ maxWidth: "420px", paddingLeft: "16px", paddingRight: "16px" }}
        >
          {/* Vertical cyan glow rail — centered at x = 60px from the
              parent's padding box, which lines up with the dot centre inside
              each <li> (li starts at parent content edge = 16, dot.left = 36,
              dot.width/2 = 8 → centre = 60). */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "59px",
              top: "32px",
              bottom: "32px",
              width: "2px",
              background:
                "linear-gradient(180deg, rgba(122,189,255,0) 0%, rgba(122,189,255,0.7) 12%, rgba(122,189,255,0.7) 88%, rgba(122,189,255,0) 100%)",
              borderRadius: "32px",
              boxShadow: "0 0 12px rgba(122,189,255,0.45)",
            }}
          />

          <ul className="flex flex-col" style={{ gap: "20px", listStyle: "none", padding: 0, margin: 0 }}>
            {FEATURES.map((f) => (
              <li
                key={f.titleMobile}
                style={{ position: "relative", paddingLeft: "72px" }}
              >
                {/* Outer halo */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    width: "56px",
                    height: "56px",
                    transform: "translateY(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(122,189,255,0.5) 0%, rgba(122,189,255,0) 65%)",
                    pointerEvents: "none",
                    mixBlendMode: "plus-lighter",
                  }}
                />
                {/* Horizontal cross-glow ray */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    width: "72px",
                    height: "2px",
                    transform: "translateY(-50%)",
                    background:
                      "linear-gradient(90deg, rgba(122,189,255,0) 0%, rgba(180,225,255,0.9) 50%, rgba(122,189,255,0) 100%)",
                    pointerEvents: "none",
                    mixBlendMode: "plus-lighter",
                    filter: "blur(0.4px)",
                  }}
                />
                {/* Inner bright node */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "36px",
                    top: "50%",
                    width: "16px",
                    height: "16px",
                    transform: "translateY(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, #ffffff 0%, #7ad6ff 40%, rgba(36,140,255,0) 75%)",
                    boxShadow:
                      "0 0 12px rgba(122,189,255,0.95), 0 0 24px rgba(80,160,255,0.6)",
                    mixBlendMode: "plus-lighter",
                  }}
                />

                {/* Card */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: "16px",
                    border: "1px solid rgba(122,189,255,0.35)",
                    background:
                      "linear-gradient(180deg, rgba(46,82,200,0.45) 0%, rgba(58,42,160,0.45) 60%, rgba(85,30,206,0.45) 100%)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    padding: "18px 20px",
                    boxShadow:
                      "0 12px 28px rgba(8,12,40,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h4)",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.15,
                      color: "#fff",
                      margin: 0,
                      marginBottom: "6px",
                    }}
                  >
                    {f.titleMobile}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,0.85)",
                      margin: 0,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP — horizontal track + 4 cards (≥ sm = 640px)
          Figma node 583:2360 — 1922×789px
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden sm:block"
        style={{ paddingTop: "120px", paddingBottom: "120px" }}
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

        {/* ── 1276px content container with shared side gutter so cards
              don't overflow the viewport below 1276px. ── */}
        <div className="relative mx-auto px-6 sm:px-10" style={{ maxWidth: "1276px" }}>

          {/* Heading group */}
          <div className="text-center" style={{ marginBottom: "125px" }}>
            <Reveal header>
              <h2
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h2)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  marginBottom: "24px",
                }}
              >
                Reduce Risk Before Deployment
              </h2>
            </Reveal>
            <Reveal header delay={0.15} y={20}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.45,
                  color: "rgba(255,255,255,0.8)",
                  maxWidth: "835px",
                  margin: "0 auto",
                }}
              >
                Minimal, hardened container images reduce inherited vulnerabilities
                before they reach production environments.
              </p>
            </Reveal>
          </div>

          {/* ── Track section ── */}
          <div className="relative" style={{ overflow: "visible" }}>

            {/* Track rail */}
            <div
              aria-hidden
              className="hidden lg:block"
              style={{
                height: "12px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "32px",
              }}
            />

            {/* ── Per-column decorations (lg only) ── */}
            {COL_CENTERS.map((centerPct) => (
              <React.Fragment key={centerPct}>

                {/* Column teal flare */}
                <div
                  aria-hidden
                  className="hidden lg:flex absolute pointer-events-none"
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

                {/* Track spotlight */}
                <div
                  aria-hidden
                  className="hidden lg:flex absolute pointer-events-none"
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

                {/* Vertical indicator bar */}
                <div
                  aria-hidden
                  className="hidden lg:block absolute pointer-events-none"
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

            {/* ── Feature cards ── */}
            <div
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-[32px]"
              style={{ marginTop: "120px" }}
            >
              {FEATURES.map((f) => (
                <div
                  key={f.titleDesktop}
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
                  {/* Card inner glow A */}
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
                  {/* Card inner glow B */}
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
                      fontSize: "var(--fs-h3)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      marginBottom: "12px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {f.titleDesktop}
                  </h3>
                  <p
                    className="relative"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.4,
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
      </div>

    </section>
  );
}
