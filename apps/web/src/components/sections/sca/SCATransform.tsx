import type React from "react";
import { Reveal } from "@/components/ui/Reveal";

interface ChipItem {
  id: string;
  line1: string;
  line2: string;
  icon: string;
  iconAlt: string;
}

const OUTCOME_CHIPS: ChipItem[] = [
  { id: "c1", line1: "Cleaner software",  line2: "foundations",  icon: "/images/sca/outcome-ball-cleaner.webp", iconAlt: "Cleaner software foundations" },
  { id: "c2", line1: "Better SCA signal", line2: "quality",      icon: "/images/sca/outcome-ball-signal.webp",  iconAlt: "Better SCA signal quality" },
  { id: "c3", line1: "Faster, focused",   line2: "remediation",  icon: "/images/sca/outcome-ball-target.webp",  iconAlt: "Faster, focused remediation" },
  { id: "c4", line1: "Stronger security", line2: "outcomes",     icon: "/images/sca/outcome-ball-shield.webp",  iconAlt: "Stronger security outcomes" },
];

const STATS = [
  { icon: "/images/sca/cs-stat-89.svg",          value: "89%",        label: "fewer inherited\nCVEs"       },
  { icon: "/images/sca/cs-stat-smaller.svg",      value: "SMALLER",    label: "dependency\ngraph"            },
  { icon: "/images/sca/cs-stat-prioritized.svg",  value: "PRIORITIZED",label: "Actionable\nremediation"     },
] as const;

interface VulnRow {
  id: string;
  dot: string;
  label: string;
  labelColor: string;
  pkg: React.ReactNode;
  cve: string;
  opacity: number;
}

const VULN_ROWS: VulnRow[] = [
  { id: "r1", dot: "#ef4444", label: "CRITICAL", labelColor: "#ef4444", pkg: "openssl",             cve: "CVE-2024-3094",   opacity: 1   },
  { id: "r2", dot: "#f97316", label: "HIGH",     labelColor: "#f97316", pkg: "zlib",                cve: "CVE-2024-24790", opacity: 1   },
  { id: "r3", dot: "#f97316", label: "HIGH",     labelColor: "#f97316", pkg: "libxml2",             cve: "CVE-2024-29806", opacity: 1   },
  { id: "r4", dot: "#f97316", label: "HIGH",     labelColor: "#f97316", pkg: "repeated finding...", cve: "CVE-2024-29806", opacity: 0.8 },
  { id: "r5", dot: "#eab308", label: "MEDIUM",   labelColor: "#eab308", pkg: "curl",                cve: "CVE-2024-38576", opacity: 1   },
  {
    id: "r6", dot: "#eab308", label: "MEDIUM", labelColor: "#eab308",
    pkg: (
      <>
        <p style={{ margin: 0, lineHeight: "16.5px" }}>duplicated</p>
        <p style={{ margin: 0, lineHeight: "16.5px" }}>severity...</p>
      </>
    ),
    cve: "CVE-2023-52425", opacity: 0.7,
  },
  { id: "r7", dot: "#60a5fa", label: "LOW",      labelColor: "#60a5fa", pkg: "busybox",             cve: "CVE-2023-42364", opacity: 0.6 },
  { id: "r8", dot: "#cbd5e1", label: "LOW",      labelColor: "#94a3b8", pkg: "xz-utils",            cve: "CVE-2024-35610", opacity: 0.4 },
];

function GradLine({ left }: { left: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left,
        width: "0.73px",
        height: "264px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50.77%, rgba(255,255,255,0) 100%)",
        opacity: 0.8,
        pointerEvents: "none",
      }}
    />
  );
}

function IconLayers(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconShield(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l8 3.5v5c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11v-5L12 2z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCode(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TraditionalSCACard(): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden flex-1"
      style={{
        background: "#ffffff",
        border: "1px solid #d70000",
        borderRadius: "36px",
        minWidth: 0,
        minHeight: "726px",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "263px",
          height: "153px",
          background: "#df9bff",
          borderRadius: "50%",
          filter: "blur(66.5px)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <GradLine left="48.47px" />
      <GradLine left="120.03px" />
      <GradLine left="162.38px" />
      <GradLine left="233.94px" />

      {[67.54, 183.54].map((top) => (
        <div
          key={top}
          aria-hidden
          style={{
            position: "absolute",
            top: `${top}px`,
            left: "-68px",
            width: "419px",
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50.77%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: "33px",
          left: "38px",
          right: "38px",
          height: "78px",
          background: "#fee2e2",
          borderRadius: "8px",
        }}
      />

      <p
        style={{
          position: "absolute",
          top: "54px",
          left: "137px",
          fontFamily: "var(--font-display)",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "var(--fs-h4)",
          fontWeight: 700,
          lineHeight: "20px",
          color: "#ef4444",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        Traditional SCA
      </p>

      <p
        style={{
          position: "absolute",
          top: "76px",
          left: "137px",
          fontFamily: "var(--font-body)",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "12px",
          fontWeight: 400,
          lineHeight: "16px",
          color: "#f87171",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        Too much noise
      </p>

      {/* fade-out mask trims the list visually at the bottom edge */}
      <div
        style={{
          position: "absolute",
          top: "159px",
          left: "38px",
          right: "38px",
          height: "285px",
          overflow: "hidden",
          maskImage: "linear-gradient(180deg, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, black 60%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {VULN_ROWS.map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                opacity: row.opacity,
              }}
            >
              <div
                style={{
                  width: "96px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "9999px",
                    background: row.dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "11px",
                    fontWeight: 600,
                    color: row.labelColor,
                    textTransform: "uppercase",
                    lineHeight: "16.5px",
                    letterSpacing: "0.03em",
                  }}
                >
                  {row.label}
                </span>
              </div>

              <div style={{ flex: 1, paddingLeft: "16px", paddingRight: "16px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#334155",
                    lineHeight: "16.5px",
                  }}
                >
                  {row.pkg}
                </div>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-body)",
                  // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  lineHeight: "16.5px",
                  whiteSpace: "nowrap",
                }}
              >
                {row.cve}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p
        style={{
          position: "absolute",
          top: "504px",
          left: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          color: "#cbd5e1",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "var(--fs-body)",
          fontFamily: "var(--font-body)",
          fontWeight: 400,
          lineHeight: "16px",
          textAlign: "center",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        ... 12,834 more lines
      </p>

      <div
        style={{
          position: "absolute",
          top: "612px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "var(--fs-h5)",
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: "28px",
            textAlign: "center",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          Overwhelming Findings
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "var(--fs-body-sm)",
            fontWeight: 400,
            color: "#64748b",
            lineHeight: "20px",
            textAlign: "center",
            maxWidth: "320px",
            textWrap: "balance",
            margin: 0,
          }}
        >
          Thousands of vulnerabilities across hundreds of packages — without context or clarity.
        </p>
      </div>
    </div>
  );
}

function CenterCard(): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden flex-1"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)",
        border: "1.564px solid #dab6f3",
        borderRadius: "18.762px",
        minWidth: 0,
        minHeight: "726px",
        boxShadow:
          "-160.259px 79.739px 50.032px rgba(0,0,0,0),-102.41px 50.814px 46.123px rgba(0,0,0,0.03),-57.85px 28.925px 38.306px rgba(0,0,0,0.12),-25.798px 12.508px 28.925px rgba(0,0,0,0.2),-6.254px 3.127px 15.635px rgba(0,0,0,0.23)",
      }}
    >
      {/* Blue gradient header bar — centred, 336px wide */}
      <div
        style={{
          position: "absolute",
          top: "33px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "336px",
          height: "78px",
          background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
          borderRadius: "8px",
          boxShadow: "inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)",
        }}
      />

      <p
        style={{
          position: "absolute",
          top: "54px",
          left: "50%",
          transform: "translateX(-50%)",
          paddingLeft: "12px",
          fontFamily: "var(--font-display)",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "var(--fs-h4)",
          fontWeight: 700,
          lineHeight: "20px",
          color: "#ffffff",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        CleanStart Foundation
      </p>

      <p
        style={{
          position: "absolute",
          top: "82px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-body)",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "12px",
          fontWeight: 400,
          lineHeight: "16px",
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        Reduce risk at the source
      </p>

      {/* Concentric rings — all centred at 50% horizontal */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "292px",
          height: "292px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(22,163,74,0.1)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "207px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "238px",
          height: "238px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(44,193,235,0.15)",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "235px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "182px",
          height: "182px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(44,193,235,0.2)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sca/center-card-cube.webp"
        alt=""
        aria-hidden
        width={91}
        height={99}
        loading="lazy"
        decoding="async"
        style={{
          position: "absolute",
          top: "277px",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "490px",
          left: "24px",
          right: "24px",
          height: "116px",
          background: "#190e7d",
          borderRadius: "8px",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "507px",
          left: "24px",
          right: "24px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            padding: "0 12px",
          }}
        >
          <IconLayers />
          <p
            style={{
              fontFamily: "var(--font-body)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "10px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              lineHeight: "14px",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Minimal image
          </p>
        </div>

        <div
          aria-hidden
          style={{
            width: "1px",
            height: "36px",
            background: "rgba(255,255,255,0.2)",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            padding: "0 12px",
          }}
        >
          <IconShield />
          <p
            style={{
              fontFamily: "var(--font-body)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "10px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              lineHeight: "14px",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Hardened by default
          </p>
        </div>

        <div
          aria-hidden
          style={{
            width: "1px",
            height: "36px",
            background: "rgba(255,255,255,0.2)",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            padding: "0 12px",
          }}
        >
          <IconCode />
          <p
            style={{
              fontFamily: "var(--font-body)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "10px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              lineHeight: "14px",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Minimal inherited CVEs
          </p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "622px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "var(--fs-h5)",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: "28px",
            textAlign: "center",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          Minimal. Hardened. Clean.
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "var(--fs-body-sm)",
            fontWeight: 400,
            color: "#adadad",
            lineHeight: "20px",
            textAlign: "center",
            maxWidth: "300px",
            margin: 0,
          }}
        >
          CleanStart foundation images eliminate inherited risk before it reaches your scan.
        </p>
      </div>
    </div>
  );
}

function CleanSightCard(): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden flex-1"
      style={{
        background: "#fff",
        border: "4px solid #c0ecf9",
        borderRadius: "36px",
        minWidth: 0,
        minHeight: "726px",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "263px",
          height: "153px",
          background: "#df9bff",
          borderRadius: "50%",
          filter: "blur(66.5px)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <GradLine left="48px" />
      <GradLine left="120px" />
      <GradLine left="162px" />
      <GradLine left="234px" />

      {[68, 184].map((top) => (
        <div
          key={top}
          aria-hidden
          style={{
            position: "absolute",
            top: `${top}px`,
            left: "-68px",
            width: "419px",
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50.77%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: "33px",
          left: "38px",
          right: "38px",
          height: "78px",
          background: "#6366f1",
          borderRadius: "8px",
        }}
      />

      <p
        style={{
          position: "absolute",
          top: "54px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-display)",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "var(--fs-h4)",
          fontWeight: 700,
          lineHeight: "20px",
          color: "#fff",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        CleanSight Insight
      </p>

      <p
        style={{
          position: "absolute",
          top: "76px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-body)",
          // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
          fontSize: "12px",
          fontWeight: 400,
          lineHeight: "16px",
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        Contextualize and act
      </p>

      <div
        style={{ position: "absolute", top: "162px", left: "38px", right: "38px" }}
        className="flex items-center justify-center"
      >
        <div className="flex items-center" style={{ gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sca/cs-icon-recommended-alt.svg"
            alt=""
            aria-hidden
            width={16}
            height={16}
            loading="lazy"
            decoding="async"
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1px",
              color: "#6366f1",
              textTransform: "uppercase",
            }}
          >
            RECOMMENDED ALTERNATIVE
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "194px",
          left: "38px",
          right: "38px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div className="flex flex-col" style={{ gap: "8px" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "11px",
              fontWeight: 600,
              color: "#94a3b8",
              lineHeight: "16.5px",
              margin: 0,
              textAlign: "center",
            }}
          >
            Current Image
          </p>
          <div
            className="flex items-center justify-center"
            style={{
              background: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: "12px",
              padding: "17px",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "9px",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sca/cs-icon-python.svg"
                alt="Python"
                width={24}
                height={24}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                fontSize: "var(--fs-body)",
                fontWeight: 700,
                color: "#1e293b",
                paddingLeft: "16px",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              python:3.11
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center w-full">
          <div
            style={{
              background: "#fff",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sca/cs-icon-swap.svg"
              alt=""
              aria-hidden
              width={24}
              height={24}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: "8px" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "11px",
              fontWeight: 600,
              color: "#6366f1",
              lineHeight: "16.5px",
              margin: 0,
              textAlign: "center",
            }}
          >
            Recommended Image
          </p>
          <div
            className="flex flex-col items-center"
            style={{
              background: "#eef2ff",
              border: "1px solid #e0e7ff",
              borderRadius: "12px",
              padding: "17px",
              gap: "8px",
            }}
          >
            <div className="flex items-center justify-center">
              <div
                style={{
                  background: "#6366f1",
                  borderRadius: "8px",
                  padding: "8px",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/sca/cs-icon-cleanstart.svg"
                  alt="CleanStart"
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col" style={{ paddingLeft: "16px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "var(--fs-body)",
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: "24px",
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  cleanstart/python:3.11
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "10px",
                    fontWeight: 300,
                    color: "#6366f1",
                    letterSpacing: "-0.25px",
                    lineHeight: "15px",
                    margin: 0,
                  }}
                >
                  + Suggested hardened alternative
                </p>
              </div>
            </div>
            <div
              style={{
                display: "inline-flex",
                background: "#bbf7d0",
                borderRadius: "9999px",
                padding: "2px 8px",
                alignSelf: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                  fontSize: "10px",
                  fontWeight: 400,
                  color: "#166534",
                  lineHeight: "15px",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                Hardened &amp; Updated
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "530px",
          left: "38px",
          right: "38px",
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "8px",
        }}
      >
        {STATS.map(({ icon, value, label }) => (
          <div key={value} className="flex flex-col items-center" style={{ gap: "4px" }}>
            <div className="flex items-center justify-center" style={{ gap: "4px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon}
                alt=""
                aria-hidden
                width={12}
                height={12}
                loading="lazy"
                decoding="async"
              />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#6366f1",
                  textTransform: "uppercase",
                  lineHeight: "16px",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                {value}
              </p>
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                fontSize: "9px",
                fontWeight: 400,
                color: "#64748b",
                textAlign: "center",
                lineHeight: "11.25px",
                whiteSpace: "pre-line",
                margin: 0,
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: "622px",
          left: "38px",
          right: "38px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "var(--fs-h5)",
            fontWeight: 700,
            color: "#0f172a",
            textAlign: "center",
            lineHeight: "28px",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          Actionable. Prioritized. Focused.
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "var(--fs-body-sm)",
            fontWeight: 400,
            color: "#64748b",
            textAlign: "center",
            lineHeight: "20px",
            maxWidth: "280px",
            margin: 0,
          }}
        >
          Clean, contextual recommendation your teams can act on with confidence.
        </p>
      </div>
    </div>
  );
}

export function SCATransform(): React.ReactElement {
  return (
    <section
      /* Shrink the inline 120px padding to 60px below lg to avoid dead white
         space above the heading when stacked below SCAReduceNoise. */
      className="relative overflow-hidden bg-white max-lg:!pt-[60px] max-lg:!pb-[60px]"
      style={{ paddingTop: "120px", paddingBottom: "120px" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header>
          <h2
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            Transform SCA{" "}
            <span className="cs-text-gradient-impact">outcomes</span>
          </h2>
        </Reveal>

        {/* Desktop (lg+) only. Each card uses absolute positioning designed
            for ~500px wide; at mobile widths the headers overflow and the
            bottom row gets cramped, so mobile renders scaled clones below. */}
        <div
          className="hidden lg:flex lg:flex-row"
          style={{ marginTop: "64px", gap: "32px", alignItems: "stretch" }}
        >
          <TraditionalSCACard />
          <CenterCard />
          <CleanSightCard />
        </div>

        {/* Native 500px width, CSS-scaled to fit. First in the mobile stack
            so the order matches the desktop left-to-right sequence. */}
        <div
          className="lg:hidden mx-auto"
          style={{
            width: "min(500px, calc(100vw - 48px))",
            aspectRatio: "500 / 726",
            position: "relative",
            marginTop: "64px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "500px",
              height: "726px",
              transform: "scale(min(1, calc((100vw - 48px) / 500px)))",
              transformOrigin: "top left",
            }}
          >
            <TraditionalSCACard />
          </div>
        </div>

        {/* Native 500px width, CSS-scaled to fit. The outer wrapper reserves
            scaled visual space via aspect-ratio so chips below land at the
            right offset. */}
        <div
          className="lg:hidden mx-auto"
          style={{
            width: "min(500px, calc(100vw - 48px))",
            aspectRatio: "500 / 726",
            position: "relative",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "500px",
              height: "726px",
              transform: "scale(min(1, calc((100vw - 48px) / 500px)))",
              transformOrigin: "top left",
            }}
          >
            <CenterCard />
          </div>
        </div>

        {/* Same scale pattern as CenterCard above, rendered below it. */}
        <div
          className="lg:hidden mx-auto"
          style={{
            width: "min(500px, calc(100vw - 48px))",
            aspectRatio: "500 / 726",
            position: "relative",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "500px",
              height: "726px",
              transform: "scale(min(1, calc((100vw - 48px) / 500px)))",
              transformOrigin: "top left",
            }}
          >
            <CleanSightCard />
          </div>
        </div>

        {/* Mobile stacks one chip per row; lg+ keeps the 4-in-a-row layout. */}
        <div
          className="flex flex-col lg:flex-row lg:flex-nowrap justify-center"
          style={{ marginTop: "48px", gap: "16px" }}
        >
          {OUTCOME_CHIPS.map((chip) => (
            <div
              key={chip.id}
              /*
               * Icon sits in an equal square inset on left/top/bottom:
               *   mobile  chip 96 / icon 48 → inset (96 − 48) / 2 = 24
               *   lg+     chip 122 / icon 72 → inset (122 − 72) / 2 = 25
               */
              className="h-[96px] gap-6 lg:h-[122px] lg:gap-[25px] pl-6 lg:pl-[25px]"
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                border: "3px solid #c0ecf9",
                borderRadius: "36px",
                paddingRight: "24px",
                flex: "1 1 0",
                minWidth: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chip.icon}
                alt={chip.iconAlt}
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                className="shrink-0 select-none pointer-events-none block size-12 lg:size-[72px] object-contain"
              />

              <div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "var(--fs-h4)",
                    fontWeight: 700,
                    letterSpacing: "-0.019em",
                    lineHeight: "26px",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {chip.line1}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "var(--fs-h4)",
                    fontWeight: 700,
                    letterSpacing: "-0.019em",
                    lineHeight: "26px",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {chip.line2}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
