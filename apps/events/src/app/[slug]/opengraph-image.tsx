import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { CLEANSTART } from "@/lib/brand";
import { getEvent } from "@/lib/cms";

export const alt = "Event registration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

const LOGO_HEIGHT = 56;
const MAX_LOGO_WIDTH = 230;
const FETCH_TIMEOUT_MS = 5000;

const font = (file: string): Promise<Buffer> =>
  readFile(path.join(process.cwd(), "src/app/[slug]/og-fonts", file));

interface Logo {
  src: string;
  width: number;
  height: number;
}

const pngSize = (bytes: Buffer): { w: number; h: number } | null =>
  bytes.length > 24 && bytes.toString("ascii", 1, 4) === "PNG"
    ? { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) }
    : null;

const svgSize = (text: string): { w: number; h: number } | null => {
  const box = /viewBox="[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/u.exec(text);
  if (box) return { w: Number(box[1]), h: Number(box[2]) };
  const w = /\swidth="([\d.]+)/u.exec(text);
  const h = /\sheight="([\d.]+)/u.exec(text);
  return w && h ? { w: Number(w[1]), h: Number(h[1]) } : null;
};

/** Fits a logo to the row height, capped in width so a wide wordmark cannot crowd the others. */
const toLogo = (mime: string, bytes: Buffer, dims: { w: number; h: number } | null): Logo | null => {
  if (!dims || dims.w <= 0 || dims.h <= 0) return null;
  const width = Math.min(MAX_LOGO_WIDTH, Math.round((LOGO_HEIGHT * dims.w) / dims.h));
  return {
    src: `data:${mime};base64,${bytes.toString("base64")}`,
    width,
    height: Math.round((width * dims.h) / dims.w),
  };
};

const loadBytes = async (url: string): Promise<{ bytes: Buffer; type: string } | null> => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return { bytes: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") ?? "" };
  } catch {
    return null;
  }
};

/** A logo that cannot be fetched or measured is left out; the card falls back to the name as text. */
const loadLogo = async (url: string): Promise<Logo | null> => {
  const file = await loadBytes(url);
  if (!file) return null;
  const png = pngSize(file.bytes);
  if (png) return toLogo("image/png", file.bytes, png);
  const text = file.bytes.toString("utf8");
  return text.includes("<svg") ? toLogo("image/svg+xml", file.bytes, svgSize(text)) : null;
};

const loadCleanStartLogo = async (): Promise<Logo | null> => {
  const bytes = await readFile(path.join(process.cwd(), "public", CLEANSTART.logoUrl ?? "")).catch(() => null);
  return bytes ? toLogo("image/png", bytes, pngSize(bytes)) : null;
};

const RINGS = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' fill='none'>
    <circle cx='1010' cy='-40' r='260' stroke='rgba(255,255,255,0.07)'/>
    <circle cx='1010' cy='-40' r='400' stroke='rgba(255,255,255,0.05)'/>
    <circle cx='1010' cy='-40' r='540' stroke='rgba(255,255,255,0.035)'/>
  </svg>`,
)}`;

const titleSize = (title: string): number => (title.length > 46 ? 64 : title.length > 30 ? 76 : 88);

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const event = await getEvent((await params).slug);
  const [manrope600, manrope700, sora500] = await Promise.all([
    font("manrope-600.woff"),
    font("manrope-700.woff"),
    font("sora-500.woff"),
  ]);

  const title = event?.title ?? "CleanStart Events";
  const partners = event?.partners ?? [];
  const [brand, ...partnerLogos] = await Promise.all([
    loadCleanStartLogo(),
    ...partners.map((partner) => (partner.logoUrl ? loadLogo(partner.logoUrl) : Promise.resolve(null))),
  ]);
  const marks = [
    { name: CLEANSTART.name, logo: brand },
    ...partners.map((partner, index) => ({ name: partner.name, logo: partnerLogos[index] ?? null })),
  ];
  const details = [event?.dateLabel, event?.venue].filter((part): part is string => Boolean(part));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          position: "relative",
          fontFamily: "Manrope",
          color: "#ffffff",
          background: "linear-gradient(135deg, #151021 0%, #1b1240 55%, #2b1670 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={RINGS} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0 }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          {marks.map((mark, index) => (
            <div key={mark.name} style={{ display: "flex", alignItems: "center" }}>
              {index > 0 ? (
                <div
                  style={{
                    width: 56,
                    height: 1,
                    margin: "0 28px",
                    background: "linear-gradient(90deg, rgba(44,193,235,0), rgba(255,255,255,0.45), rgba(154,81,255,0))",
                  }}
                />
              ) : null}
              {mark.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mark.logo.src} alt={mark.name} width={mark.logo.width} height={mark.logo.height} />
              ) : (
                <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{mark.name}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: titleSize(title),
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {details.length > 0 ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontFamily: "Sora",
                fontWeight: 500,
                fontSize: 28,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {details.join("   |   ")}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 60,
              padding: "0 32px",
              borderRadius: 30,
              fontSize: 26,
              fontWeight: 700,
              color: "#151021",
              background: "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 100%)",
            }}
          >
            Register now
          </div>
          <div style={{ display: "flex", fontFamily: "Sora", fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,0.6)" }}>
            events.cleanstart.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: manrope600, weight: 600, style: "normal" },
        { name: "Manrope", data: manrope700, weight: 700, style: "normal" },
        { name: "Sora", data: sora500, weight: 500, style: "normal" },
      ],
    },
  );
}
