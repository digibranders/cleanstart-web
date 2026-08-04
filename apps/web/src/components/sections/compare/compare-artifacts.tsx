/**
 * The comparison page's two coded artifacts.
 *
 * Both follow `sbom/SbomReportWindow`: built in code rather than as images, so
 * they stay crisp at every DPI, cost nothing on LCP, and never shift layout.
 * `font-mono` is not registered in this project's Tailwind theme, so the
 * monospace family is applied inline via `var(--font-mono)`.
 *
 * These replace two grids of tiles. In both cases the article's own list became
 * the artifact's content rather than being illustrated next to it — the eight
 * provenance fields ARE the record's rows, and the reproducibility question is
 * answered by showing the two builds resolving to one digest.
 *
 * Values are illustrative and the windows are marked decorative; the labels are
 * the document's wording verbatim.
 */

const WINDOW_SHELL: React.CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  overflow: "hidden",
  background: "linear-gradient(160deg, #0c1130 0%, #080b1f 100%)",
  border: "1px solid rgba(120,140,255,0.18)",
  boxShadow:
    "0 30px 80px -34px rgba(8,10,38,0.85), 0 0 64px rgba(70,30,191,0.18)",
};

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "12.5px",
  lineHeight: 1.55,
};

const KEY_COLOR = "#4FD1F5";
const VALUE_COLOR = "rgba(255,255,255,0.82)";
const MUTED = "rgba(255,255,255,0.34)";

function TitleBar({
  filename,
  chip,
}: {
  filename: string;
  chip?: string;
}): React.ReactElement {
  return (
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
        {filename}
      </span>
      {chip && (
        <span
          className="ml-auto"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#8CE9C0",
            background: "rgba(40,200,64,0.12)",
            border: "1px solid rgba(140,233,192,0.32)",
            borderRadius: "999px",
            padding: "3px 10px",
          }}
        >
          {chip}
        </span>
      )}
    </div>
  );
}

/* ─────────────────── provenance record ─────────────────── */

/**
 * `fields` are the document's eight provenance-record entries, passed in so the
 * copy stays owned by `compare-data`. Values are representative.
 */
const PROVENANCE_VALUES: readonly string[] = [
  "github.com/cleanstart/images",
  "9f2c1ab4e7d0c3b5",
  "cleanstart-builder@slsa-l4",
  ".github/workflows/release.yml",
  "412 packages, fully declared",
  "sha256:7d3f…a91c",
  "2026-07-14T09:22:31Z",
  "cosign · in-toto v1.0",
];

export function ProvenanceRecord({
  fields,
}: {
  fields: readonly string[];
}): React.ReactElement {
  return (
    <div aria-hidden className="pointer-events-none select-none" style={WINDOW_SHELL}>
      <TitleBar filename="provenance.intoto.jsonl" chip="Signature verified" />

      <div style={{ padding: "18px 0 22px" }}>
        {fields.map((field, i) => (
          <div
            key={field}
            className="flex items-baseline gap-4"
            style={{
              ...MONO,
              padding: "7px 20px",
              borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: "1.6em",
                textAlign: "right",
                color: MUTED,
              }}
            >
              {i + 1}
            </span>
            {/* The document's field name, used as the record's key. */}
            <span style={{ color: KEY_COLOR, minWidth: "13.5em", flexShrink: 0 }}>
              {field}
            </span>
            <span
              className="truncate"
              style={{ color: VALUE_COLOR, minWidth: 0 }}
            >
              {PROVENANCE_VALUES[i] ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── reproducible build ─────────────────── */

const DIGEST = "sha256:7d3f9c02e5b8a4176ef31d0ca85b2f9e41c7d6a0b93e8f52a91c";

/** One of the two independent builds. They differ in everything but the result. */
function BuildColumn({
  label,
  builder,
  when,
  where,
}: {
  label: string;
  builder: string;
  when: string;
  where: string;
}): React.ReactElement {
  return (
    <div style={{ ...MONO, flex: "1 1 0", minWidth: 0 }}>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#C9A6FF",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      {[
        ["builder", builder],
        ["ran at", when],
        ["machine", where],
      ].map(([k, v]) => (
        <div key={k} className="flex gap-2 truncate">
          <span style={{ color: MUTED, minWidth: "5.2em", flexShrink: 0 }}>{k}</span>
          <span className="truncate" style={{ color: VALUE_COLOR }}>
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Answers the section's own question — "if another engineer rebuilds this
 * software using the same source code, will they obtain the same artifact?" —
 * by showing two builds that agree on nothing except the digest.
 */
export function ReproducibleBuildProof(): React.ReactElement {
  return (
    <div aria-hidden className="pointer-events-none select-none" style={WINDOW_SHELL}>
      <TitleBar filename="rebuild --verify" chip="Digests match" />

      <div style={{ padding: "22px 20px 24px" }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-5">
          <BuildColumn
            label="Build A"
            builder="cleanstart-ci"
            when="2026-07-14 09:22"
            where="runner-eu-3"
          />

          {/* The equals node — the whole point of the artifact, so it gets a
              real presence rather than a stray glyph. A rail runs through it on
              both axes so the two builds always read as one comparison. */}
          <div className="relative flex shrink-0 items-center justify-center self-stretch py-1 sm:px-4 sm:py-0">
            <span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px sm:inset-x-1/2 sm:inset-y-0 sm:top-auto sm:h-auto sm:w-px"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
            <span
              className="relative inline-flex items-center justify-center rounded-full"
              style={{
                width: "34px",
                height: "34px",
                background: "rgba(140,233,192,0.10)",
                boxShadow: "inset 0 0 0 1px rgba(140,233,192,0.38)",
                fontFamily: "var(--font-mono)",
                fontSize: "16px",
                lineHeight: 1,
                color: "#8CE9C0",
              }}
            >
              =
            </span>
          </div>

          <BuildColumn
            label="Build B"
            builder="independent-auditor"
            when="2026-09-02 17:41"
            where="laptop-local"
          />
        </div>

        {/* The one line both builds agree on. */}
        <div
          style={{
            marginTop: "22px",
            paddingTop: "18px",
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: MUTED,
              marginBottom: "8px",
            }}
          >
            Resulting artifact digest
          </p>
          <p
            className="truncate"
            style={{ ...MONO, fontSize: "13px", color: "#8CE9C0" }}
          >
            {DIGEST}
          </p>
        </div>
      </div>
    </div>
  );
}
