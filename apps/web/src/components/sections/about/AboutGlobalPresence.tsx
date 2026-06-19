"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/ui/Reveal";
import { OFFICES } from "./offices";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CYAN = "#FFFFFF";
const AMBER = "#f59e0b";

function markerColor(color: "amber" | "cyan"): string {
  return color === "amber" ? AMBER : CYAN;
}

// ─── Dynamic map (browser-only — mapbox-gl uses browser APIs at import time) ──

const GlobalPresenceMap = dynamic(
  () =>
    import("./GlobalPresenceMap").then((m) => ({ default: m.GlobalPresenceMap })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 520,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="animate-spin"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
            borderTopColor: "#2CC1EB",
            display: "block",
          }}
        />
      </div>
    ),
  },
);

// ─── Component ────────────────────────────────────────────────────────────────

export function AboutGlobalPresence() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#07102e" }}
    >
      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[48px] pb-16">

        {/* Heading */}
        <div className="mx-auto flex max-w-[840px] flex-col items-center gap-5 text-center text-white mb-6 lg:mb-8">
          <Reveal header delay={0.1} y={20}>
            <h2
              className="font-display"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Where We Operate
            </h2>
          </Reveal>
          <Reveal header delay={0.2} y={20}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: "-0.02em",
                opacity: 0.7,
                maxWidth: "780px",
              }}
            >
              From the Americas to Southeast Asia, CleanStart&apos;s team is
              building trusted software foundations globally.
            </p>
          </Reveal>
        </div>

        {/* ── Interactive Mapbox map ────────────────────────────────────── */}
        <Reveal delay={0.3}>
          <div className="mx-auto w-full" style={{ maxWidth: "1100px" }}>
            <GlobalPresenceMap offices={OFFICES} />
          </div>
        </Reveal>

        {/* ── Location ribbon (lg+) ────────────────────────────────────── */}
        <div
          className="mx-auto mt-5 hidden lg:flex"
          style={{
            maxWidth: "1100px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            background: "rgba(10, 8, 28, 0.88)",
            overflow: "hidden",
          }}
        >
          {OFFICES.map((o, i) => {
            const c = markerColor(o.color);
            return (
              <div
                key={o.id}
                className="flex flex-1 flex-col gap-2"
                style={{
                  padding: "20px 24px",
                  borderRight:
                    i < OFFICES.length - 1
                      ? "1px solid rgba(255,255,255,0.07)"
                      : "none",
                }}
              >
                {/* Role — heading with dot */}
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: c,
                      flexShrink: 0,
                      boxShadow: `0 0 6px 1px ${c}99`,
                      display: "inline-block",
                    }}
                  />
                  <p
                    className="font-display"
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.2,
                    }}
                  >
                    {o.role}
                  </p>
                </div>

                {/* City */}
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "var(--font-sans)",
                    paddingLeft: "16px",
                  }}
                >
                  {o.city}
                </p>

                {/* Address */}
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.45)",
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1.4,
                    paddingLeft: "16px",
                  }}
                >
                  {o.address}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Mobile location grid (< lg) ───────────────────────────────── */}
        <ul className="mt-10 grid list-none grid-cols-2 gap-3 p-0 lg:hidden">
          {OFFICES.map((o) => {
            const c = markerColor(o.color);
            return (
              <li
                key={o.id}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: c,
                    marginBottom: "8px",
                    boxShadow: `0 0 8px 2px ${c}66`,
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-eyebrow)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: c,
                    marginBottom: "2px",
                  }}
                >
                  {o.country}
                </p>
                <p
                  className="font-display"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "3px",
                    lineHeight: 1.2,
                  }}
                >
                  {o.city}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {o.role}
                </p>
              </li>
            );
          })}
        </ul>

      </div>
    </section>
  );
}
