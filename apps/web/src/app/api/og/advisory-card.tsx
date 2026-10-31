import { advisoryStatusLabel, cvssRating, type AdvisoryFixStatus, type CvssRating } from "@/lib/advisory-utils";

export interface AdvisoryCardProps {
  origin: string;
  width: number;
  height: number;
  gridSvg: string;
  title: string;
  cvssScore: number;
  status: AdvisoryFixStatus;
  technology: string;
  cves: string[];
}

const ACCENT_GRAD = "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)";

/** `glow` tints the radial behind the score; `solid` colours the severity word. */
const SEVERITY_TONE: Record<CvssRating, { solid: string; glow: string }> = {
  Critical: { solid: "#F87171", glow: "rgba(239,68,68,0.30)" },
  High: { solid: "#FB923C", glow: "rgba(249,115,22,0.28)" },
  Medium: { solid: "#FBBF24", glow: "rgba(245,158,11,0.26)" },
  Low: { solid: "#4ADE80", glow: "rgba(34,197,94,0.24)" },
  None: { solid: "#9CA3AF", glow: "rgba(255,255,255,0.12)" },
};

const STATUS_COLOR: Record<AdvisoryFixStatus, string> = {
  identified: "#FCD34D",
  in_progress: "#93C5FD",
  fixed: "#6EE7B7",
  not_affected: "rgba(255,255,255,0.7)",
};

function titleSize(title: string): number {
  if (title.length <= 36) return 56;
  if (title.length <= 60) return 48;
  return 42;
}

/**
 * Advisory social card in the house OG composition: cyan eyebrow, a gradient
 * line (the CVE ID) over a white title, a grey meta line, and the CVSS score as
 * plain large type on the right with a severity-tinted glow behind it.
 */
export function AdvisoryCard({
  origin,
  width,
  height,
  gridSvg,
  title,
  cvssScore,
  status,
  technology,
  cves,
}: AdvisoryCardProps): React.ReactElement {
  const rating = cvssRating(cvssScore);
  const severity = SEVERITY_TONE[rating];
  const [firstCve, ...otherCves] = cves;

  return (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "56px 64px",
        background: "#151021", fontFamily: "Manrope", position: "relative",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gridSvg} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ position: "absolute", top: -200, right: -130, width: 720, height: 720, background: "radial-gradient(circle, rgba(100,13,251,0.34) 0%, rgba(100,13,251,0.10) 42%, rgba(21,16,33,0) 70%)" }} />
      <div style={{ position: "absolute", top: 40, right: 20, width: 640, height: 640, background: `radial-gradient(circle, ${severity.glow} 0%, rgba(21,16,33,0) 62%)` }} />
      <div style={{ position: "absolute", top: 0, left: 0, width, height, background: "radial-gradient(135% 135% at 68% 14%, rgba(21,16,33,0) 30%, rgba(8,6,16,0.74) 100%)" }} />

      <div style={{ display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${origin}/images/cleanstart-logo.png`} width={191} height={40} alt="CleanStart" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#2cc1eb", marginBottom: 20 }}>
            Security advisory
          </div>
          {firstCve ? (
            <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 6 }}>
              <div
                style={{
                  display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.07, letterSpacing: "-0.02em",
                  backgroundImage: ACCENT_GRAD, backgroundClip: "text", color: "transparent",
                  // Same descender guard as the generic card: the clip box is the line box.
                  paddingBottom: "0.2em", marginBottom: "-0.2em",
                }}
              >
                {firstCve}
              </div>
              {otherCves.length > 0 ? (
                <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginLeft: 16, marginBottom: 12 }}>
                  {`+${otherCves.length} more`}
                </div>
              ) : null}
            </div>
          ) : null}
          {/* One flex item per word so a hyphenated word ("out-of-bounds") wraps whole. */}
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: titleSize(title), fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#ffffff" }}>
            {title.split(/\s+/).filter(Boolean).map((word, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static word list, order is the key
              <div key={i} style={{ display: "flex", marginRight: "0.26em" }}>
                {word}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26, fontFamily: "Sora", fontSize: 25, fontWeight: 500 }}>
            <div style={{ display: "flex", color: STATUS_COLOR[status] }}>{advisoryStatusLabel(status)}</div>
            {technology ? (
              <>
                <div style={{ display: "flex", width: 1, height: 24, background: "rgba(255,255,255,0.25)", margin: "0 20px" }} />
                <div style={{ display: "flex", color: "rgba(255,255,255,0.66)" }}>{technology}</div>
              </>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            paddingLeft: 48, marginLeft: 24, borderLeft: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <div style={{ display: "flex", fontFamily: "Sora", fontSize: 20, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            CVSS score
          </div>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#ffffff", margin: "4px 0 6px" }}>
            {cvssScore.toFixed(1)}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: severity.solid }}>
            {rating}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 11, height: 11, borderRadius: 6, background: "#33baec", marginRight: 13, boxShadow: "0 0 12px 2px rgba(51,186,236,0.8)" }} />
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.74)" }}>cleanstart.com</div>
        </div>
        <div style={{ display: "flex", fontSize: 16, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
          Advisory
        </div>
      </div>
    </div>
  );
}
