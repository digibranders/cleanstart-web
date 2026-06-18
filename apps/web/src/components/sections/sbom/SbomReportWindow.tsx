import type React from "react";

/*
 * SbomReportWindow — a decorative editor/terminal window rendering a real SPDX
 * SBOM excerpt (document header + the `go` package). Built in code (no image)
 * so it stays crisp at every DPI, adds ~no network/LCP cost, and never shifts
 * layout. Used as the SBOM hero's right-side visual; the hero applies a slight
 * blur so it reads as a soft backdrop behind the headline.
 *
 * Purely decorative: aria-hidden + non-interactive.
 */

const SYNTAX = {
  comment: "rgba(255,255,255,0.30)",
  key: "#4FD1F5",
  punct: "rgba(255,255,255,0.35)",
  value: "rgba(255,255,255,0.80)",
  gutter: "rgba(255,255,255,0.22)",
} as const;

// Representative SPDX-2.2 excerpt — header + the Go package + its relationship.
const LINES: readonly string[] = [
  "SPDXVersion: SPDX-2.2",
  "DataLicense: CC0-1.0",
  "SPDXID: SPDXRef-DOCUMENT",
  "DocumentName: spdx-sbom-generator",
  "Creator: Tool: spdx-sbom-generator",
  "Created: 2021-05-23T11:25:29Z",
  "",
  "##### Package representing the Go distribution",
  "PackageName: go",
  "SPDXID: SPDXRef-Package-go",
  "PackageVersion: v0.46.3",
  "PackageSupplier: NOASSERTION",
  "PackageDownloadLocation: pkg:golang/cloud.google.com/go@v0.46.3",
  "FilesAnalyzed: false",
  "PackageLicenseConcluded: NOASSERTION",
  "",
  "Relationship: SPDXRef-DOCUMENT DESCRIBES SPDXRef-Package-go",
];

function LineTokens({ line }: { line: string }): React.ReactElement {
  if (line.trim() === "") return <span>&nbsp;</span>;
  if (line.startsWith("#")) {
    return <span style={{ color: SYNTAX.comment, fontStyle: "italic" }}>{line}</span>;
  }
  const idx = line.indexOf(": ");
  if (idx === -1) return <span style={{ color: SYNTAX.value }}>{line}</span>;
  return (
    <>
      <span style={{ color: SYNTAX.key }}>{line.slice(0, idx)}</span>
      <span style={{ color: SYNTAX.punct }}>: </span>
      <span style={{ color: SYNTAX.value }}>{line.slice(idx + 2)}</span>
    </>
  );
}

export function SbomReportWindow(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none"
      style={{
        width: "100%",
        borderRadius: "14px",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0c1130 0%, #080b1f 100%)",
        border: "1px solid rgba(120,140,255,0.18)",
        boxShadow:
          "0 30px 80px -34px rgba(8,10,38,0.85), 0 0 64px rgba(70,30,191,0.22)",
      }}
    >
      {/* Title bar — traffic lights + filename. */}
      <div
        className="flex items-center"
        style={{
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(120,140,255,0.12)",
          background: "rgba(255,255,255,0.025)",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span
            key={c}
            style={{ width: "11px", height: "11px", borderRadius: "50%", background: c }}
          />
        ))}
        <span
          style={{
            marginLeft: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          go-bigquery.spdx
        </span>
      </div>

      {/* Body — line numbers + syntax-coloured SPDX text. Long lines clip; a
          bottom fade implies the document continues. */}
      <div style={{ position: "relative", padding: "16px 0 18px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12.5px",
            lineHeight: 1.55,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {LINES.map((line, i) => (
            <div key={`${i}-${line}`} className="flex" style={{ padding: "0 18px" }}>
              <span
                style={{
                  flexShrink: 0,
                  width: "1.9em",
                  textAlign: "right",
                  marginRight: "1.1em",
                  color: SYNTAX.gutter,
                }}
              >
                {i + 1}
              </span>
              <span style={{ minWidth: 0 }}>
                <LineTokens line={line} />
              </span>
            </div>
          ))}
        </div>

        {/* Bottom fade into the window background. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "64px",
            background: "linear-gradient(180deg, rgba(8,11,31,0) 0%, #080b1f 92%)",
          }}
        />
      </div>
    </div>
  );
}
