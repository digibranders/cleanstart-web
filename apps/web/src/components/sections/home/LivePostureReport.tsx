import type { CSSProperties } from "react";

// Live, code-built replacement for the old flat `hero-dashboard-panel.png`.
//
// Server component (no "use client") — every motion is pure CSS (see the
// `.cs-lpr-*` rules in globals.css), so zero client JS ships, the panel paints
// at first render, and `prefers-reduced-motion` collapses each animation to its
// final resting state. CVE counts tick up via an `@property <integer>` CSS
// counter, so even the number roll needs no JS / requestAnimationFrame.
//
// A purple→blue gradient border ring around a near-black `#010114` panel,
// indigo-glow rows for the vulnerable images and a teal gradient treatment for
// the CleanStart-verified ones. The animation classes and the responsive
// `clamp` type/spacing scale (container-query `cqi` units) are intentionally
// preserved. The whole panel is a decorative illustration, exposed to assistive
// tech as a single labelled image (mirroring the PNG's old `alt`).

type Tone = "red" | "amber" | "green";

interface Row {
  name: string;
  base: string;
  cves: number;
  tone: Tone;
  verified?: boolean;
  reduction?: number;
}

const GROUPS: readonly (readonly [Row, Row])[] = [
  [
    { name: "Postgres: 16.1", base: "debian : bookworm-slim", cves: 195, tone: "red" },
    {
      name: "Postgres: 16.5",
      base: "CleanStart verified",
      cves: 4,
      tone: "green",
      verified: true,
      reduction: 98,
    },
  ],
  [
    { name: "nginx : 1.25.3", base: "debian : bookworm-slim", cves: 104, tone: "red" },
    {
      name: "nginx : 1.26.2",
      base: "CleanStart verified",
      cves: 0,
      tone: "green",
      verified: true,
      reduction: 100,
    },
  ],
  [
    { name: "alertmanager: v0.28.1", base: "busybox: 1-uclibc", cves: 46, tone: "amber" },
    {
      name: "alertmanager: 0.28.1",
      base: "CleanStart verified",
      cves: 0,
      tone: "green",
      verified: true,
      reduction: 100,
    },
  ],
];

// CVE-count pill — fill + gradient stroke + text colour. The double-background
// `padding-box / border-box` trick paints the gradient
// only on the 1px border while keeping the solid fill inside.
const PILL: Record<Tone, { fill: string; stroke: string; fg: string }> = {
  red: {
    fill: "#270625",
    stroke: "linear-gradient(135deg, #7D0E43 0%, #080004 100%)",
    fg: "#EC6083",
  },
  amber: {
    fill: "#38282F",
    stroke: "linear-gradient(135deg, #B37A23 0%, #080004 100%)",
    fg: "#FABE25",
  },
  green: {
    fill: "#006257",
    stroke: "linear-gradient(135deg, #15B09E 0%, #080004 100%)",
    fg: "#31FFBD",
  },
};

// Row surface: vulnerable rows get the near-black fill + indigo gradient stroke
// + soft indigo glow; verified rows get the teal gradient fill + teal stroke.
const ROW_VULNERABLE: CSSProperties = {
  background:
    "linear-gradient(#03041B, #03041B) padding-box, linear-gradient(134deg, #403EA3 1%, #2D2B71 93%, #18173D 100%) border-box",
  border: "1px solid transparent",
  boxShadow: "0 1px 20px 0 rgba(85, 83, 198, 0.25)",
};
const ROW_VERIFIED: CSSProperties = {
  background:
    "linear-gradient(133deg, #0D3B35 0%, #14534E 50%, #001119 100%) padding-box, linear-gradient(134deg, #007F94 0%, #5D8A91 75%, #000A0C 100%) border-box",
  border: "1px solid transparent",
};

function CveCount({ value, delay }: { value: number; delay: number }) {
  return (
    <span
      className="cs-lpr-num"
      style={{ "--cs-target": value, "--cs-num-delay": `${delay}s` } as CSSProperties}
    />
  );
}

function CheckMark() {
  return (
    <svg
      className="cs-lpr-check"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      style={{ width: "1em", height: "1em" }}
    >
      <path
        d="M3 7.4 L5.8 10.2 L11 4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportRow({ row, index }: { row: Row; index: number }) {
  const pill = PILL[row.tone];
  const rowDelay = 0.3 + index * 0.13;
  const numDelay = rowDelay + 0.18;

  return (
    <div
      className="cs-lpr-row relative flex items-center justify-between rounded-[10px]"
      style={
        {
          "--cs-i": index,
          padding: "clamp(5px, 1.5cqi, 8px) clamp(10px, 3cqi, 16px)",
          ...(row.verified ? ROW_VERIFIED : ROW_VULNERABLE),
        } as CSSProperties
      }
    >
      {row.verified && (
        <span
          aria-hidden
          className="cs-lpr-bar pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
          style={{ width: "3px", height: "62%", background: "#31FFBD" }}
        />
      )}

      <div className="min-w-0">
        <div
          className="flex items-center gap-[0.4em] font-display font-bold"
          style={{
            fontSize: "clamp(12px, 2.9cqi, 14px)",
            letterSpacing: "-0.01em",
            color: row.verified ? "#31FFBD" : "#FFFFFF",
          }}
        >
          <span className="truncate">{row.name}</span>
          {row.verified && (
            <span className="cs-lpr-checkwrap shrink-0" style={{ color: "#31FFBD" }}>
              <CheckMark />
            </span>
          )}
        </div>
        <div
          className="mt-[0.1em] truncate font-display font-medium"
          style={{
            fontSize: "clamp(9px, 2.3cqi, 11px)",
            color: row.verified ? "#1BFFB2" : "#9399C0",
          }}
        >
          {row.base}
        </div>
      </div>

      <div
        className="ml-3 flex shrink-0 items-center gap-[0.7em]"
        style={{ fontSize: "clamp(11px, 2.9cqi, 14px)" }}
      >
        <span
          className="cs-lpr-pill inline-flex items-center rounded-full font-display font-bold"
          style={
            {
              "--cs-i": index,
              padding: "0.34em 0.8em",
              background: `linear-gradient(${pill.fill}, ${pill.fill}) padding-box, ${pill.stroke} border-box`,
              border: "1px solid transparent",
              color: pill.fg,
              fontVariantNumeric: "tabular-nums",
            } as CSSProperties
          }
        >
          <CveCount value={row.cves} delay={numDelay} />
          &nbsp;CVEs
        </span>
        {row.verified ? (
          <span
            className="cs-lpr-reduce inline-flex items-center gap-[0.15em] font-display font-bold tabular-nums"
            style={{ "--cs-i": index, color: "#FFFFFF" } as CSSProperties}
          >
            <CveCount value={row.reduction ?? 0} delay={numDelay + 0.1} />%
            <span style={{ color: "#31FFBD" }}>↓</span>
          </span>
        ) : (
          <span
            aria-hidden
            className="cs-lpr-arrow"
            style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: "1.05em" }}
          >
            →
          </span>
        )}
      </div>
    </div>
  );
}

export function LivePostureReport() {
  let rowIndex = -1;

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Ambient bloom behind the panel — breathes slowly. */}
      <div
        aria-hidden
        className="cs-lpr-bloom pointer-events-none absolute select-none"
        style={{
          left: "4%",
          top: "10%",
          width: "94%",
          height: "88%",
          // The radial gradient is already soft-edged, so no filter:blur is
          // needed for the glow. Dropping it keeps the forever-looping
          // scale/opacity bloom on the compositor instead of re-rasterizing a
          // 10px blur every frame (cheaper paint, no CWV/INP cost).
          background:
            "radial-gradient(closest-side, rgba(100, 13, 251, 0.5) 0%, rgba(100, 13, 251, 0) 100%)",
        }}
      />

      {/* Gradient border ring — purple → blue. The ~3px ring is painted as the
          wrapper's background; the inner `.cs-lpr` panel sits on top, leaving
          the gradient exposed only at the edge. */}
      <div
        className="relative rounded-[20px]"
        style={{
          padding: "clamp(2.5px, 0.8vw, 4px)",
          background: "linear-gradient(116deg, #6A007B 0%, #1A19AF 78%)",
          boxShadow:
            "0 30px 80px -30px rgba(8, 6, 24, 0.8), inset 0 0 0 0.5px rgba(182, 130, 211, 0.5)",
        }}
      >
        {/* The panel */}
        <div
          role="img"
          aria-label="CleanSight posture report: CleanStart-verified images sharply cut CVE counts — postgres 195 to 4, nginx 104 to 0, alertmanager 46 to 0 — all signed with SBOM, Cosign and SPDX 3.0 at SLSA Level 3."
          className="cs-lpr relative overflow-hidden rounded-[16px]"
          style={{
            containerType: "inline-size",
            padding: "clamp(14px, 4cqi, 22px)",
            background: "#010114",
          }}
        >
          {/* Slow diagonal sheen across the glass */}
          <span aria-hidden className="cs-lpr-sheen pointer-events-none absolute inset-0" />

          {/* Scan beam — sweeps top→bottom once on load */}
          <span aria-hidden className="cs-lpr-beam pointer-events-none absolute inset-x-0" />

          {/* Corner rim glows. Rendered inside the panel and clipped by its
              rounded `overflow-hidden`, so they fade out softly and follow the
              corner curve — no hard external edge. `screen` lets them brighten
              the dark surface without a visible box. The radial falloff
              completes well before the straight edges, so only the corner
              glows. */}
          <span
            aria-hidden
            className="pointer-events-none absolute select-none"
            style={{
              top: 0,
              right: 0,
              width: "55%",
              height: "45%",
              mixBlendMode: "screen",
              background:
                "radial-gradient(80% 80% at 100% 0%, rgba(49, 255, 178, 0.22) 0%, rgba(49, 255, 178, 0) 60%)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute select-none"
            style={{
              bottom: 0,
              right: 0,
              width: "55%",
              height: "45%",
              mixBlendMode: "screen",
              background:
                "radial-gradient(80% 80% at 100% 100%, rgba(21, 173, 250, 0.18) 0%, rgba(21, 173, 250, 0) 60%)",
            }}
          />

          {/* Header */}
          <div className="cs-lpr-head relative flex items-center justify-between gap-3">
            <div
              className="font-display font-bold text-white"
              style={{ fontSize: "clamp(13px, 3.4cqi, 17px)", letterSpacing: "-0.01em" }}
            >
              CleanSight
              <sup style={{ fontSize: "0.5em", verticalAlign: "super", fontWeight: 700 }}>™</sup>
              <span style={{ color: "rgba(255, 255, 255, 0.55)" }}> - </span>
              Posture Report
            </div>
            <div
              className="hidden shrink-0 items-center gap-[0.55em] rounded-[20px] font-sans font-semibold text-white sm:inline-flex"
              style={{
                padding: "0.3em 0.85em",
                fontSize: "clamp(9.5px, 2.4cqi, 12px)",
                background:
                  "linear-gradient(90deg, #020740 0%, #050723 100%) padding-box, linear-gradient(162deg, #0166CC 0%, #000000 100%) border-box",
                border: "1px solid transparent",
              }}
            >
              AWS
              <span aria-hidden style={{ color: "#D9D9D9", opacity: 0.7 }}>
                ·
              </span>
              EKS
              <span aria-hidden style={{ color: "#D9D9D9", opacity: 0.7 }}>
                ·
              </span>
              10 images
            </div>
          </div>

          {/* Rows */}
          <div
            className="relative mt-[clamp(10px,2.6cqi,14px)] flex flex-col"
            style={{ gap: "clamp(5px, 1.2cqi, 7px)" }}
          >
            {GROUPS.map((group, gi) => (
              <div
                key={group[0].name}
                className="flex flex-col"
                style={{
                  gap: "clamp(4px, 1cqi, 5px)",
                  marginTop: gi === 0 ? 0 : "clamp(3px,0.8cqi,5px)",
                }}
              >
                {group.map((row) => {
                  rowIndex += 1;
                  return <ReportRow key={row.name} row={row} index={rowIndex} />;
                })}
              </div>
            ))}
          </div>

          {/* Footer — right-aligned so the bottom-left stays clear for the
              floating stat pill. */}
          <div
            className="cs-lpr-foot relative mt-[clamp(11px,2.8cqi,15px)] flex items-center justify-end border-t pt-[clamp(9px,2.2cqi,13px)]"
            style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <div
              className="flex items-center gap-[0.5em] font-sans font-semibold text-white"
              style={{ fontSize: "clamp(10.5px, 2.7cqi, 13px)" }}
            >
              <span
                aria-hidden
                className="cs-lpr-dot inline-block rounded-full"
                style={{ width: "0.55em", height: "0.55em", background: "#69A3FF" }}
              />
              SBOM
              <span aria-hidden style={{ color: "#D9D9D9", opacity: 0.7 }}>
                ·
              </span>
              Cosign
              <span aria-hidden style={{ color: "#D9D9D9", opacity: 0.7 }}>
                ·
              </span>
              SPDX 3.0
            </div>
          </div>
        </div>
      </div>

      {/* Floating SLSA badge — overlaps the top-right edge: white surface,
          green status dot, black label. */}
      <div
        className="cs-lpr-float cs-lpr-float-slsa absolute z-10 flex items-center gap-[0.5em] rounded-[6px] font-sans font-semibold"
        style={
          {
            "--cs-float-delay": "0.7s",
            "--cs-bob-dur": "5.6s",
            "--cs-bob-delay": "1.6s",
            top: "clamp(-14px, -2cqi, -10px)",
            right: "clamp(10px, 6%, 40px)",
            padding: "0.45em 0.85em",
            fontSize: "clamp(11px, 1.1vw, 13px)",
            color: "#000000",
            background: "#FFFFFF",
            boxShadow: "0 14px 34px -14px rgba(8, 6, 24, 0.85)",
          } as CSSProperties
        }
      >
        <span
          aria-hidden
          className="cs-lpr-dot inline-block rounded-full"
          style={{
            width: "0.6em",
            height: "0.6em",
            background: "#04F0A2",
            boxShadow: "0 0 0 0 rgba(4, 240, 162, 0.6)",
          }}
        />
        SLSA Level 3 Verified
      </div>

      {/* Floating stat pill — breaks the bottom-left edge, fills the gutter:
          teal gradient surface matching the verified rows. */}
      <div
        className="cs-lpr-float cs-lpr-float-stat absolute z-10 flex items-center gap-[0.7em] rounded-[10px]"
        style={
          {
            "--cs-float-delay": "0.95s",
            "--cs-bob-dur": "6.8s",
            "--cs-bob-delay": "2.1s",
            bottom: "clamp(-16px, -2cqi, -10px)",
            left: "clamp(-16px, -4%, -8px)",
            padding: "0.7em 1em",
            background:
              "linear-gradient(133deg, #0D3B35 0%, #14534E 50%, #001119 100%) padding-box, linear-gradient(134deg, #007F94 0%, #5D8A91 75%, #000A0C 100%) border-box",
            border: "1px solid transparent",
            boxShadow: "0 20px 44px -18px rgba(6, 22, 16, 0.9)",
          } as CSSProperties
        }
      >
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full font-bold"
          style={{
            width: "2.1em",
            height: "2.1em",
            fontSize: "clamp(13px, 1.2vw, 16px)",
            color: "#03041B",
            background: "#31FFBD",
          }}
        >
          ↓
        </span>
        <span className="flex flex-col leading-tight">
          <span
            className="font-display font-bold text-white"
            style={{ fontSize: "clamp(15px, 1.5vw, 19px)", letterSpacing: "-0.02em" }}
          >
            CVEs
          </span>
          <span
            className="font-display font-medium"
            style={{ fontSize: "clamp(9.5px, 0.85vw, 11px)", color: "#31FFBD" }}
          >
            eliminated on verified images
          </span>
        </span>
      </div>
    </div>
  );
}
