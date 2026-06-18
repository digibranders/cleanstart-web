import type { CSSProperties } from "react";

// Live, code-built replacement for the old flat `hero-dashboard-panel.png`.
//
// Server component (no "use client") — every motion is pure CSS (see the
// `.cs-lpr-*` rules in globals.css), so zero client JS ships, the panel paints
// at first render, and `prefers-reduced-motion` collapses each animation to its
// final resting state. CVE counts tick up via an `@property <integer>` CSS
// counter, so even the number roll needs no JS / requestAnimationFrame.
//
// Interior type/spacing scale with the card width via container-query units
// (`cqi`) per the responsive system's card-interior rule — not viewport units.
// The whole panel is a decorative illustration, exposed to assistive tech as a
// single labelled image (mirroring the PNG's old `alt`).

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
    { name: "postgres:16.1", base: "debian:bookworm-slim", cves: 195, tone: "red" },
    {
      name: "postgres:16.5",
      base: "CleanStart verified",
      cves: 43,
      tone: "green",
      verified: true,
      reduction: 78,
    },
  ],
  [
    { name: "nginx:1.25.3", base: "debian:bookworm-slim", cves: 104, tone: "red" },
    {
      name: "nginx:1.26.2",
      base: "CleanStart verified",
      cves: 0,
      tone: "green",
      verified: true,
      reduction: 100,
    },
  ],
  [
    { name: "alertmanager:v0.28.1", base: "busybox:1-uclibc", cves: 46, tone: "amber" },
    {
      name: "alertmanager:0.28.1",
      base: "CleanStart verified",
      cves: 0,
      tone: "green",
      verified: true,
      reduction: 100,
    },
  ],
];

const TONE: Record<Tone, { bg: string; fg: string; border: string }> = {
  red: { bg: "rgba(244, 63, 94, 0.12)", fg: "#fb7185", border: "rgba(244, 63, 94, 0.28)" },
  amber: { bg: "rgba(245, 158, 11, 0.13)", fg: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  green: { bg: "rgba(45, 212, 160, 0.12)", fg: "#34d8a3", border: "rgba(45, 212, 160, 0.3)" },
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
  const tone = TONE[row.tone];
  const rowDelay = 0.3 + index * 0.13;
  const numDelay = rowDelay + 0.18;

  return (
    <div
      className="cs-lpr-row relative flex items-center justify-between rounded-[12px]"
      style={
        {
          "--cs-i": index,
          padding: "clamp(5px, 1.5cqi, 8px) clamp(10px, 3cqi, 16px)",
          background: row.verified ? "rgba(45, 212, 160, 0.06)" : "rgba(255, 255, 255, 0.015)",
          border: row.verified
            ? "1px solid rgba(45, 212, 160, 0.16)"
            : "1px solid rgba(255, 255, 255, 0.05)",
        } as CSSProperties
      }
    >
      {row.verified && (
        <span
          aria-hidden
          className="cs-lpr-bar pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
          style={{ width: "3px", height: "62%", background: "#34d8a3" }}
        />
      )}

      <div className="min-w-0">
        <div
          className="flex items-center gap-[0.4em] font-mono font-medium"
          style={{
            fontSize: "clamp(12px, 2.9cqi, 14px)",
            letterSpacing: "-0.01em",
            color: row.verified ? "#7ef0c6" : "rgba(255, 255, 255, 0.92)",
          }}
        >
          <span className="truncate">{row.name}</span>
          {row.verified && (
            <span className="cs-lpr-checkwrap shrink-0" style={{ color: "#34d8a3" }}>
              <CheckMark />
            </span>
          )}
        </div>
        <div
          className="mt-[0.1em] truncate font-mono"
          style={{
            fontSize: "clamp(9px, 2.3cqi, 11px)",
            color: row.verified ? "rgba(126, 240, 198, 0.62)" : "rgba(255, 255, 255, 0.42)",
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
          className="cs-lpr-pill inline-flex items-center rounded-full font-semibold"
          style={{
            "--cs-i": index,
            padding: "0.34em 0.8em",
            background: tone.bg,
            color: tone.fg,
            border: `1px solid ${tone.border}`,
            fontVariantNumeric: "tabular-nums",
          } as CSSProperties}
        >
          <CveCount value={row.cves} delay={numDelay} />
          &nbsp;CVEs
        </span>
        {row.verified ? (
          <span
            className="cs-lpr-reduce inline-flex items-center gap-[0.15em] font-medium tabular-nums"
            style={{ "--cs-i": index, color: "rgba(255, 255, 255, 0.86)" } as CSSProperties}
          >
            <CveCount value={row.reduction ?? 0} delay={numDelay + 0.1} />%
            <span style={{ color: "#34d8a3" }}>↓</span>
          </span>
        ) : (
          <span
            aria-hidden
            className="cs-lpr-arrow"
            style={{ color: "rgba(255, 255, 255, 0.32)", fontSize: "1.05em" }}
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

      {/* The panel */}
      <div
        role="img"
        aria-label="CleanSight posture report: CleanStart-verified images sharply cut CVE counts — postgres 195 to 43, nginx 104 to 0, alertmanager 46 to 0 — all signed with SBOM, Cosign and SPDX 3.0 at SLSA Level 3."
        className="cs-lpr relative overflow-hidden rounded-[24px]"
        style={{
          containerType: "inline-size",
          padding: "clamp(14px, 4cqi, 22px)",
          background:
            "linear-gradient(165deg, rgba(30, 24, 54, 0.92) 0%, rgba(17, 15, 38, 0.96) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow:
            "0 30px 80px -30px rgba(8, 6, 24, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Slow diagonal sheen across the glass */}
        <span aria-hidden className="cs-lpr-sheen pointer-events-none absolute inset-0" />

        {/* Scan beam — sweeps top→bottom once on load */}
        <span aria-hidden className="cs-lpr-beam pointer-events-none absolute inset-x-0" />

        {/* Header */}
        <div className="cs-lpr-head relative flex items-center justify-between gap-3">
          <div
            className="font-sans font-semibold text-white"
            style={{ fontSize: "clamp(13px, 3.4cqi, 17px)", letterSpacing: "-0.01em" }}
          >
            CleanSight Posture Report
          </div>
          <div
            className="hidden shrink-0 items-center rounded-full font-mono sm:inline-flex"
            style={{
              padding: "0.3em 0.75em",
              fontSize: "clamp(9.5px, 2.4cqi, 12px)",
              color: "rgba(255, 255, 255, 0.6)",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            AWS · EKS · 10 images
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
              style={{ gap: "clamp(4px, 1cqi, 5px)", marginTop: gi === 0 ? 0 : "clamp(3px,0.8cqi,5px)" }}
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
          style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
        >
          <div
            className="flex items-center gap-[0.5em] font-mono font-medium"
            style={{ fontSize: "clamp(10.5px, 2.7cqi, 13px)", color: "rgba(255, 255, 255, 0.82)" }}
          >
            <span
              aria-hidden
              className="cs-lpr-dot inline-block rounded-full"
              style={{ width: "0.55em", height: "0.55em", background: "#6aa3ff" }}
            />
            SBOM · Cosign · SPDX 3.0
          </div>
        </div>
      </div>

      {/* Floating SLSA badge — overlaps the top-right edge */}
      <div
        className="cs-lpr-float cs-lpr-float-slsa absolute z-10 flex items-center gap-[0.5em] rounded-full font-sans font-semibold text-white"
        style={
          {
            "--cs-float-delay": "0.7s",
            "--cs-bob-dur": "5.6s",
            "--cs-bob-delay": "1.6s",
            top: "clamp(-14px, -2cqi, -10px)",
            right: "clamp(10px, 6%, 40px)",
            padding: "0.55em 0.95em",
            fontSize: "clamp(11px, 1.1vw, 13px)",
            background: "linear-gradient(135deg, rgba(40, 34, 66, 0.96), rgba(24, 20, 48, 0.96))",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow: "0 14px 34px -14px rgba(8, 6, 24, 0.85)",
            backdropFilter: "blur(6px)",
          } as CSSProperties
        }
      >
        <span
          aria-hidden
          className="cs-lpr-dot inline-block rounded-full"
          style={{
            width: "0.6em",
            height: "0.6em",
            background: "#34d8a3",
            boxShadow: "0 0 0 0 rgba(52, 216, 163, 0.6)",
          }}
        />
        SLSA Level 3 Verified
      </div>

      {/* Floating stat pill — breaks the bottom-left edge, fills the gutter */}
      <div
        className="cs-lpr-float cs-lpr-float-stat absolute z-10 flex items-center gap-[0.7em] rounded-2xl"
        style={
          {
            "--cs-float-delay": "0.95s",
            "--cs-bob-dur": "6.8s",
            "--cs-bob-delay": "2.1s",
            bottom: "clamp(-16px, -2cqi, -10px)",
            left: "clamp(-16px, -4%, -8px)",
            padding: "0.7em 1em",
            background: "linear-gradient(135deg, rgba(20, 40, 34, 0.96), rgba(14, 28, 26, 0.96))",
            border: "1px solid rgba(52, 216, 163, 0.28)",
            boxShadow: "0 20px 44px -18px rgba(6, 22, 16, 0.9)",
            backdropFilter: "blur(6px)",
          } as CSSProperties
        }
      >
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full font-semibold"
          style={{
            width: "2.1em",
            height: "2.1em",
            fontSize: "clamp(13px, 1.2vw, 16px)",
            color: "#0c1f18",
            background: "linear-gradient(135deg, #5ff0c0, #22c98e)",
          }}
        >
          ↓
        </span>
        <span className="flex flex-col leading-tight">
          <span
            className="font-display font-semibold text-white"
            style={{ fontSize: "clamp(15px, 1.5vw, 19px)", letterSpacing: "-0.02em" }}
          >
            CVEs
          </span>
          <span
            className="font-mono"
            style={{ fontSize: "clamp(9.5px, 0.85vw, 11px)", color: "rgba(126, 240, 198, 0.8)" }}
          >
            eliminated on verified images
          </span>
        </span>
      </div>
    </div>
  );
}
