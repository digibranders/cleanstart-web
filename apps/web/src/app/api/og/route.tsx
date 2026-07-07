import { ImageResponse } from "next/og";
import { pickTitleSize, splitTitleAccent } from "./render";
import type { OgVariant } from "@/lib/seo/og";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;
const FALLBACK_TITLE = "CleanStart: Secure by Design. Built from Source.";
const ACCENT_GRAD = "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)";

// Baked as a single SVG rather than a tiled pattern because Satori does not tile.
const GRID_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='${WIDTH}' height='${HEIGHT}'><defs><pattern id='g' width='80' height='80' patternUnits='userSpaceOnUse'><path d='M80 0H0V80' fill='none' stroke='rgba(255,255,255,0.045)' stroke-width='1'/></pattern></defs><rect width='${WIDTH}' height='${HEIGHT}' fill='url(#g)'/></svg>`,
)}`;

const fonts = (async () => {
  const [m600, m700, s500] = await Promise.all([
    fetch(new URL("./fonts/manrope-600.woff", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./fonts/manrope-700.woff", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./fonts/sora-500.woff", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);
  return [
    { name: "Manrope", data: m600, weight: 600 as const, style: "normal" as const },
    { name: "Manrope", data: m700, weight: 700 as const, style: "normal" as const },
    { name: "Sora", data: s500, weight: 500 as const, style: "normal" as const },
  ];
})();

export async function GET(req: Request): Promise<ImageResponse> {
  const { searchParams, origin } = new URL(req.url);
  const variant = (searchParams.get("variant") === "hero" ? "hero" : "default") as OgVariant;
  const title = (searchParams.get("title") || FALLBACK_TITLE).slice(0, 200);
  const eyebrow = (searchParams.get("eyebrow") || "").slice(0, 40);
  const accent = (searchParams.get("accent") || "").slice(0, 120);
  const sub = (searchParams.get("sub") || "").slice(0, 160);

  const { lead, accent: accentText } = splitTitleAccent(title, accent);
  const titleSize = pickTitleSize(title, variant);
  const fontData = await fonts;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "56px 64px",
          background: "#151021", fontFamily: "Manrope", position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GRID_SVG} width={WIDTH} height={HEIGHT} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        <div style={{ position: "absolute", top: -200, right: -130, width: 720, height: 720, background: "radial-gradient(circle, rgba(100,13,251,0.34) 0%, rgba(100,13,251,0.10) 42%, rgba(21,16,33,0) 70%)" }} />
        <div style={{ position: "absolute", top: -60, right: 150, width: 460, height: 460, background: "radial-gradient(circle, rgba(44,193,235,0.22) 0%, rgba(21,16,33,0) 62%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT, background: "radial-gradient(135% 135% at 68% 14%, rgba(21,16,33,0) 30%, rgba(8,6,16,0.74) 100%)" }} />

        <div style={{ display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${origin}/images/cleanstart-logo.png`} width={191} height={40} alt="CleanStart" />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {variant === "default" && eyebrow ? (
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#2cc1eb", marginBottom: 22 }}>
              {eyebrow}
            </div>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: titleSize, fontWeight: 700, lineHeight: 1.07, letterSpacing: "-0.02em", color: "#ffffff", maxWidth: 1010 }}>
            <span>{lead}</span>
            {accentText ? (
              <span
                style={{
                  backgroundImage: ACCENT_GRAD,
                  backgroundClip: "text",
                  color: "transparent",
                  // `background-clip: text` bounds the gradient paint to the line
                  // box, so with a tight line-height the descenders of g/y/p get
                  // clipped. Pad below (offset by an equal negative margin) to
                  // extend the paint area without shifting surrounding layout.
                  paddingBottom: "0.2em",
                  marginBottom: "-0.2em",
                }}
              >
                {accentText}
              </span>
            ) : null}
          </div>
          {sub ? (
            <div style={{ display: "flex", marginTop: 26, fontFamily: "Sora", fontSize: variant === "hero" ? 27 : 25, fontWeight: 500, lineHeight: 1.4, color: "rgba(255,255,255,0.66)", maxWidth: 900 }}>
              {sub}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 11, height: 11, borderRadius: 6, background: "#33baec", marginRight: 13, boxShadow: "0 0 12px 2px rgba(51,186,236,0.8)" }} />
            <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.74)" }}>cleanstart.com</div>
          </div>
          {eyebrow ? (
            <div style={{ display: "flex", fontSize: 16, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              {eyebrow}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fontData,
      headers: { "cache-control": "public, immutable, no-transform, max-age=31536000" },
    },
  );
}
