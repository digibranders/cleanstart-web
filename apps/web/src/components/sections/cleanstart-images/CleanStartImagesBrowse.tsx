"use client";

import { useState } from "react";

type Tab = "portal" | "repository";

export function CleanStartImagesBrowse(): React.ReactElement {
  const [tab, setTab] = useState<Tab>("portal");

  return (
    <section
      data-section="CleanStartImagesBrowse"
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "clamp(720px, 60vw, 880px)" }}
    >
      {/* Decorative grid (faint) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(120,80,200,0.06) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(120,80,200,0.06) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px, 80px 80px",
        }}
      />

      {/* Decorative flares — Figma nodes 161:23572, 161:23573 (purple 4-point stars) */}
      <div
        aria-hidden
        className="absolute pointer-events-none hidden lg:block"
        style={{
          right: "-40px",
          top: "208px",
          width: "328px",
          height: "328px",
          background:
            "radial-gradient(circle at center, rgba(155,80,230,0.35) 0%, rgba(155,80,230,0) 60%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none hidden lg:block"
        style={{
          left: "-40px",
          top: "940px",
          width: "328px",
          height: "328px",
          background:
            "radial-gradient(circle at center, rgba(155,80,230,0.35) 0%, rgba(155,80,230,0) 60%)",
          mixBlendMode: "screen",
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center"
        style={{ paddingTop: "80px" }}
      >
        {/* Tab bar — matches home Resources & Insights tab dimensions
            (h-10 buttons + p-1.5 container, text-base SemiBold). Active tab
            uses the page's purple gradient instead of the Resources blue
            gradient to fit this section's palette. */}
        <div
          role="tablist"
          aria-label="Distribution channel"
          className="flex items-center gap-1"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "100px",
            padding: "4px",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          {(["portal", "repository"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="text-[clamp(0.9375rem,1.04vw,1.25rem)] font-semibold leading-[1.2] tracking-[-0.04em]"
              style={{
                padding: "8px 24px",
                borderRadius: "100px",
                cursor: "pointer",
                border: "none",
                transition: "background 0.15s, color 0.15s",
                background:
                  tab === id
                    ? "linear-gradient(180deg, #151021 0%, #131E8F 100%)"
                    : "transparent",
                color: tab === id ? "#fff" : "#555",
              }}
            >
              {id === "portal" ? "CleanStart Portal" : "CleanStart Repository"}
            </button>
          ))}
        </div>

        {/* Tagline — H2-description spec: clamp(18-24) / 400 / Sora */}
        <p
          className="text-center mt-8 max-w-[843px]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(18px, 1.7vw, 24px)",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            color: "#1A1A2E",
          }}
        >
          It offers clean, vulnerability-free container and virtual machine
          images. Customers may choose accessing directly from CleanStart or
          replicate images to their own private repositories
        </p>

        {/* Dashboard mockup — Figma 161:23567, 1274×732 */}
        <div className="relative mt-14 mb-16 sm:mb-20 lg:mb-24 w-full flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/browse-dashboard.png"
            alt="CleanStart Portal browse images dashboard preview, showing 20 of 398 hardened container images filtered by OS, category, and architecture."
            width={1274}
            height={732}
            className="w-full max-w-[1274px] h-auto select-none"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 30px 80px -20px rgba(91,61,245,0.35), 0 10px 30px -10px rgba(0,0,0,0.4)",
            }}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
