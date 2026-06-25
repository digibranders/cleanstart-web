import { ImageResponse } from "next/og";

/**
 * Generated branded cover for guides without a real hero image.
 * Renders the title-derived keyword on the CleanStart brand gradient with a
 * dot-grid texture and a faint crystal-mark watermark. 1200×630 so it doubles
 * as the social/OG card. Keyword arrives via `?kw=`; the slug is the cache key.
 */
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

const DOT_GRID = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><defs><pattern id="d" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#ffffff"/></pattern></defs><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#d)"/></svg>`,
)}`;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<ImageResponse> {
  const { slug } = await ctx.params;
  // Keyword travels in the path (no query string) so Next's image optimizer
  // accepts the URL — local images WITH a query string are rejected by
  // default, which would force `unoptimized` and ship the full PNG.
  const keyword = decodeURIComponent(slug).slice(0, 80) || "CleanStart Guide";
  // Original site logo (the navbar lockup) for the eyebrow; the faint crystal
  // mark stays only as a decorative corner watermark.
  const logoUrl = new URL("/images/cleanstart-logo.png", req.url).toString();
  const markUrl = new URL("/images/logo-cleanstart-mark.svg", req.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          position: "relative",
          padding: "72px",
          justifyContent: "space-between",
          color: "#ffffff",
          fontFamily: "sans-serif",
          background:
            "linear-gradient(135deg, #0b0f2e 0%, #1a1a4e 36%, #2d1b9e 72%, #471ec0 100%)",
        }}
      >
        {/* dot-grid texture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DOT_GRID}
          width={WIDTH}
          height={HEIGHT}
          alt=""
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.16 }}
        />
        {/* soft glow */}
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -140,
            width: 680,
            height: 680,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,91,255,0.45) 0%, rgba(124,91,255,0) 70%)",
          }}
        />
        {/* crystal-mark watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={markUrl}
          width={540}
          height={540}
          alt=""
          style={{ position: "absolute", right: -70, bottom: -130, opacity: 0.12 }}
        />

        {/* eyebrow — original site logo + GUIDE label */}
        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={234} height={49} alt="" />
          <span
            style={{
              marginLeft: 28,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#c9c3ff",
            }}
          >
            Guide
          </span>
        </div>

        {/* keyword */}
        <div style={{ display: "flex", flexDirection: "column", position: "relative", maxWidth: 1000 }}>
          <div style={{ width: 72, height: 6, borderRadius: 3, background: "#7c5bff", marginBottom: 30 }} />
          <span style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>
            {keyword}
          </span>
        </div>

        {/* footer */}
        <span style={{ position: "relative", fontSize: 26, fontWeight: 600, color: "#a99cff" }}>
          cleanstart.com
        </span>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    },
  );
}
