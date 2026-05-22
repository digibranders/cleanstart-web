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
        className="absolute pointer-events-none hidden xl:block"
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
        className="absolute pointer-events-none hidden xl:block"
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
        {/* Tab bar — Figma 161:23557, 478×64, pill shape */}
        <div
          role="tablist"
          aria-label="Distribution channel"
          className="relative flex items-center"
          style={{
            width: "478px",
            maxWidth: "100%",
            height: "64px",
            borderRadius: "9999px",
            background: "#0B0820",
            padding: "8px",
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "portal"}
            onClick={() => setTab("portal")}
            className="flex-1 h-full rounded-full transition-all"
            style={{
              background:
                tab === "portal"
                  ? "linear-gradient(135deg,#5B3DF5 0%,#2E1CB6 100%)"
                  : "transparent",
              color: "#ffffff",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(14px, 1.1vw, 17px)",
              letterSpacing: "-0.01em",
            }}
          >
            CleanStart Portal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "repository"}
            onClick={() => setTab("repository")}
            className="flex-1 h-full rounded-full transition-all"
            style={{
              background:
                tab === "repository"
                  ? "linear-gradient(135deg,#5B3DF5 0%,#2E1CB6 100%)"
                  : "transparent",
              color: "#ffffff",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(14px, 1.1vw, 17px)",
              letterSpacing: "-0.01em",
            }}
          >
            CleanStart Repository
          </button>
        </div>

        {/* Tagline — Figma 161:23574 */}
        <p
          className="text-center mt-8 max-w-[843px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(16px, 1.04vw, 20px)",
            fontWeight: 400,
            lineHeight: 1.6,
            letterSpacing: "-0.01em",
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
