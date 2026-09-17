import { SIGNAL, VERDICT } from "./tricorder-palette";

/**
 * The hero artifact: a Tricorder scan console drawn in code. A component is
 * being analysed — its identity, its version chain, four signal meters filling
 * in turn, and finally the verdict. The console sits on a slow radar sweep so
 * the page opens on the act of scanning rather than on a static product shot.
 *
 * Everything here is CSS/SVG (no raster). The meters, the sweep and the verdict
 * reveal are one-shot / ambient CSS animations (`cs-tri-*` in globals.css) and
 * all of them are off under prefers-reduced-motion, where the console renders
 * in its final state.
 */

interface SignalRow {
  key: string;
  label: string;
  finding: string;
  accent: string;
  /** Meter fill, 0–1. */
  level: number;
}

/**
 * The four stage names are the copy doc's own — Analyze, Compare, Correlate,
 * Enrich — so the hero shows the same pipeline the page explains further down,
 * in the same words and the same accent colours.
 */
const ROWS: SignalRow[] = [
  { key: "analyze", label: "Analyze", finding: "Opens outbound socket at install", accent: SIGNAL.behavior, level: 0.92 },
  { key: "compare", label: "Compare", finding: "Install script changed in 2.5.0", accent: SIGNAL.history, level: 0.74 },
  { key: "correlate", label: "Correlate", finding: "Shares infrastructure with 2 flagged packages", accent: SIGNAL.relationships, level: 0.83 },
  { key: "enrich", label: "Enrich", finding: "No CVE on record", accent: SIGNAL.intel, level: 0.18 },
];

const VERSIONS = ["2.4.0", "2.4.1", "2.5.0"] as const;

const MONO = "var(--font-mono), ui-monospace, Menlo, Consolas, monospace";

function CubeGlyph({ size }: { size: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" />
      <path d="M4 7l8 4.5L20 7" />
      <path d="M12 11.5v10" />
    </svg>
  );
}

export function TricorderHeroConsole(): React.ReactElement {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Radar sweep — two hairline rings and a conic wedge that rotates
          behind the console. Wider than the card so it reads as a field. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden select-none md:block"
        style={{
          width: "min(720px, 120%)",
          aspectRatio: "1 / 1",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <div
          className="absolute rounded-full"
          style={{ inset: "18%", border: "1px solid rgba(255,255,255,0.10)" }}
        />
        <div
          className="absolute rounded-full"
          style={{ inset: "36%", border: "1px dashed rgba(255,255,255,0.12)" }}
        />
        <div
          className="cs-tri-sweep absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(44,193,235,0) 0deg, rgba(44,193,235,0) 300deg, rgba(44,193,235,0.22) 352deg, rgba(154,81,255,0.38) 360deg)",
            WebkitMaskImage: "radial-gradient(circle, #000 0%, #000 58%, transparent 72%)",
            maskImage: "radial-gradient(circle, #000 0%, #000 58%, transparent 72%)",
          }}
        />
      </div>

      {/* The console. */}
      <div
        className="cs-libhero-float relative overflow-hidden"
        style={{
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(20,18,46,0.92) 0%, rgba(11,12,32,0.96) 100%)",
          boxShadow:
            "0 40px 90px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 60px -30px rgba(122,89,255,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {/* Title bar. */}
        <div
          className="flex items-center justify-between px-5"
          style={{
            height: "44px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <span
            className="font-display text-white/70"
            style={{
              fontSize: "var(--fs-badge)",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Tricorder · Scan
          </span>
          <span
            className="inline-flex items-center gap-2 text-white/70"
            style={{ fontFamily: MONO, fontSize: "var(--fs-badge)" }}
          >
            <span
              aria-hidden
              className="cs-tri-blink block h-[6px] w-[6px] rounded-full"
              style={{ background: "#2cc1eb", boxShadow: "0 0 10px #2cc1eb" }}
            />
            analyzing
          </span>
        </div>

        {/* Identity row. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 pt-5">
          <span
            className="flex shrink-0 items-center justify-center text-white"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(145deg, rgba(154,81,255,0.55) 0%, rgba(44,193,235,0.35) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35)",
            }}
          >
            <CubeGlyph size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-white"
              style={{ fontFamily: MONO, fontSize: "var(--fs-code)", fontWeight: 500 }}
            >
              strutil-core<span className="text-white/45">@</span>2.5.0
            </p>
            <p
              className="mt-0.5 text-white/50"
              style={{ fontFamily: MONO, fontSize: "var(--fs-badge)" }}
            >
              npm · 41 transitive dependencies
            </p>
          </div>
          {/* Version chain — the newest version is the one under scrutiny. */}
          <ol className="flex items-center gap-1.5" aria-label="Version history">
            {VERSIONS.map((v, i) => {
              const latest = i === VERSIONS.length - 1;
              return (
                <li key={v} className="flex items-center gap-1.5">
                  {i > 0 ? (
                    <span aria-hidden className="block h-px w-3" style={{ background: "rgba(255,255,255,0.22)" }} />
                  ) : null}
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{
                      fontFamily: MONO,
                      fontSize: "var(--fs-badge)",
                      color: latest ? "#fff" : "rgba(255,255,255,0.55)",
                      border: `1px solid ${latest ? "rgba(91,155,255,0.7)" : "rgba(255,255,255,0.14)"}`,
                      background: latest ? "rgba(91,155,255,0.18)" : "transparent",
                      boxShadow: latest ? "0 0 14px rgba(91,155,255,0.35)" : "none",
                    }}
                  >
                    {v}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Signal meters. */}
        <ul className="mt-5 flex flex-col gap-3 px-5" aria-label="Analysis signals">
          {ROWS.map((row, i) => (
            <li key={row.key} className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[104px_minmax(0,1fr)]">
              <span
                className="font-display text-white/80"
                style={{ fontSize: "var(--fs-caption)", fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                {row.label}
              </span>
              <div className="min-w-0">
                <div
                  className="relative h-[6px] w-full overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <span
                    aria-hidden
                    className="cs-tri-fill absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${row.level * 100}%`,
                      background: `linear-gradient(90deg, color-mix(in srgb, ${row.accent} 55%, transparent), ${row.accent})`,
                      boxShadow: `0 0 12px color-mix(in srgb, ${row.accent} 60%, transparent)`,
                      animationDelay: `${0.5 + i * 0.35}s`,
                    }}
                  />
                </div>
                <p
                  className="cs-tri-late mt-1.5 truncate text-white/55"
                  style={{
                    fontFamily: MONO,
                    fontSize: "var(--fs-badge)",
                    animationDelay: `${0.9 + i * 0.35}s`,
                  }}
                >
                  {row.finding}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Verdict. */}
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(90deg, rgba(244,63,94,0.10) 0%, rgba(244,63,94,0) 60%)",
          }}
        >
          <div>
            <p
              className="font-display text-white/55"
              style={{
                fontSize: "var(--fs-badge)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Verdict
            </p>
            <p
              className="mt-1 text-white/70"
              style={{ fontFamily: MONO, fontSize: "var(--fs-badge)" }}
            >
              3 of 4 stages flagged · evidence attached
            </p>
          </div>
          <span
            className="cs-tri-verdict inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-white"
            style={{
              fontSize: "var(--fs-caption)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: `linear-gradient(135deg, ${VERDICT.malicious} 0%, #c11d3d 100%)`,
              boxShadow: `0 10px 26px -10px ${VERDICT.malicious}, inset 0 1px 1px rgba(255,255,255,0.35)`,
              animationDelay: "2.3s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 8v5" />
              <path d="M12 16.5h.01" />
              <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            Malicious
          </span>
        </div>
      </div>
    </div>
  );
}
