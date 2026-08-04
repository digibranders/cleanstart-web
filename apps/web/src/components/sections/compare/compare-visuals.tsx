import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Visual vocabulary for the comparison page.
 *
 * Every device here resolves to something apps/web already ships: the violet 3D
 * icon set under `public/images`, the shared decorative SVGs (hex-grid unions,
 * ellipse glows, card glow), the canonical dark-band gradient, and the
 * oversized-corner white tile from `sbom/SbomAdvantage`.
 *
 * There is deliberately no accent-colour array. The site's palette runs
 * violet → indigo → blue; the per-card teal/orange rotation this file used to
 * export is what made the page read as a different product.
 *
 * `Glow` is consumed by `CompareHero`, which is frozen — do not change its
 * signature.
 */

/* ─────────────────────────── tokens ─────────────────────────── */

/** The canonical dark section gradient, shared across the site's dark bands. */
export const BAND_DARK =
  "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)";

/** Shorter dark band for sections that sit between two light ones. */
export const BAND_DARK_SHORT =
  "linear-gradient(180deg, #151021 0%, #1B1B6B 55%, #3A1BA8 100%)";

/** Light section wash, matching `WhyMattersGrid` / `SbomAdvantage`. */
export const WASH_LIGHT = "#F6F6F6";

/** Brand violet, used for the CleanStart side and every accent on the page. */
export const BRAND = {
  violet: "#6A3DF0",
  violetLight: "#A974FF",
  violetPale: "#DF9BFF",
  indigo: "#131E8F",
  blue: "#076EFF",
  /** Neutral used for the Docker Hardened Images side, so it reads as the
   *  comparator rather than as a second brand. */
  slate: "#334155",
} as const;

/** The single hairline weight used for structural lines on light sections. */
export const RULE_LIGHT = "1px solid rgba(17, 17, 17, 0.11)";
export const RULE_DARK = "1px solid rgba(255, 255, 255, 0.16)";

/* ─────────────────────────── 3D icons ─────────────────────────── */

/**
 * One violet 3D icon with the site's purple bloom behind it — the treatment
 * `WhyMattersGrid` uses on its card illustrations.
 *
 * `size` is the rendered box; the icon is contained inside it, so a 96px box
 * and a 72px box show the same artwork at different scales without cropping.
 */
export function Icon3D({
  src,
  alt = "",
  size = 72,
  bloom = true,
  className,
}: {
  src: string;
  /** Decorative by default — these sit next to a text label that names them. */
  alt?: string;
  size?: number;
  bloom?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <span
      aria-hidden={alt === "" ? true : undefined}
      className={cn(
        "pointer-events-none relative inline-flex shrink-0 select-none items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {bloom && (
        <span
          aria-hidden
          className="pointer-events-none absolute select-none rounded-full"
          style={{
            width: size * 0.72,
            height: size * 0.72,
            background: BRAND.violetPale,
            /* Low and wide. A tighter, hotter halo reads as fog over the
               artwork rather than as light behind it. */
            opacity: 0.18,
            filter: `blur(${Math.round(size * 0.3)}px)`,
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className="relative object-contain"
        style={{ width: "100%", height: "100%" }}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

/* ─────────────────────── decorative background ─────────────────────── */

/**
 * Ambient radial glow. Kept from the previous revision because `CompareHero`
 * depends on it and the hero is frozen.
 */
export function Glow({
  color,
  size,
  left,
  right,
  top,
  bottom,
  opacity = 1,
}: {
  color: string;
  size: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  opacity?: number;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute hidden select-none rounded-full md:block"
      style={{
        ...(left ? { left } : {}),
        ...(right ? { right } : {}),
        ...(top ? { top } : {}),
        ...(bottom ? { bottom } : {}),
        width: size,
        aspectRatio: "1 / 1",
        opacity,
        background: `radial-gradient(closest-side, ${color}, transparent 72%)`,
      }}
    />
  );
}

/**
 * The hex-grid blobs `WhyMattersGrid` bleeds off its top corners. Positions are
 * proportional to the 1920 artboard so they scale with the viewport instead of
 * drifting inward at wide sizes.
 */
export function HexGrid({
  side,
  vertical = "top",
  opacity = 1,
}: {
  side: "left" | "right";
  vertical?: "top" | "bottom";
  opacity?: number;
}): React.ReactElement {
  const isLeft = side === "left";
  const span = isLeft ? 1181 : 1101;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute hidden select-none lg:block"
      style={{
        ...(isLeft
          ? { left: "calc(-500 / 1920 * 100vw)" }
          : { left: "calc(1216 / 1920 * 100vw)" }),
        ...(vertical === "top"
          ? { top: `calc(${isLeft ? -539 : -535} / 1920 * 100vw)` }
          : { bottom: `calc(${isLeft ? -539 : -535} / 1920 * 100vw)` }),
        width: `calc(${span} / 1920 * 100vw)`,
        height: `calc(${span} / 1920 * 100vw)`,
        opacity,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/for-developers/why/deco-union-${side}.svg`}
        alt=""
        style={{ display: "block", width: "100%", height: "100%" }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/** The soft purple corner glows that sit over the hex grids on light bands. */
export function CornerGlows(): React.ReactElement {
  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            left:
              side === "left"
                ? "calc(-311 / 1920 * 100vw)"
                : "calc(1477 / 1920 * 100vw)",
            top: "calc(-319 / 1920 * 100vw)",
            width: "calc(744 / 1920 * 100vw)",
            height: "calc(744 / 1920 * 100vw)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/for-developers/why/deco-glow-top-${side}.svg`}
            alt=""
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </>
  );
}

/**
 * The site's vector grid plate — the asset the Clean Images hero uses. It has a
 * built-in edge fade, which a tiled CSS grid cannot reproduce: a CSS grid runs
 * at uniform opacity to the section edge and reads as graph paper.
 *
 * Deliberately a single positioned plate rather than a full-bleed tile, so it
 * anchors one corner of a band instead of wallpapering it.
 */
export function VectorGrid({
  side = "right",
  width = "clamp(520px, 46vw, 860px)",
  top = "-8%",
  opacity = 0.55,
}: {
  side?: "left" | "right";
  width?: string;
  top?: string;
  opacity?: number;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute hidden select-none lg:block"
      style={{
        ...(side === "left" ? { left: "-6%" } : { right: "-6%" }),
        top,
        width,
        aspectRatio: "730 / 708",
        opacity,
        ...(side === "left" ? { transform: "scaleX(-1)" } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-images/hero-vector-grid.svg"
        alt=""
        className="block size-full max-w-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/** The ambient ellipse glow the dark bands anchor a corner with. */
export function EllipseGlow({
  side = "left",
  size = "315px",
}: {
  side?: "left" | "right";
  size?: string;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute select-none"
      style={{
        ...(side === "left" ? { left: "-72px" } : { right: "-72px" }),
        bottom: "-40px",
        width: size,
        height: size,
      }}
    >
      <div style={{ position: "absolute", inset: "-64.44%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-ellipse-glow.svg"
          alt=""
          width={721}
          height={721}
          style={{ display: "block", width: "100%", height: "100%" }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

/**
 * The rotated hexagon outline the dark bands set in `overlay` blend mode at the
 * top corners (`CleanStartImagesEnvironment`).
 */
export function HexOutline({
  side,
}: {
  side: "left" | "right";
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute hidden select-none xl:flex"
      style={{
        ...(side === "left"
          ? { left: "-109px" }
          : { left: "calc(1214 / 1920 * 100%)" }),
        top: side === "left" ? "-94px" : "-84px",
        width: "305.606px",
        height: "318.251px",
        mixBlendMode: "overlay",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-images/env-union-hex.svg"
        alt=""
        width={211}
        height={246}
        style={{
          display: "block",
          width: "211px",
          height: "246px",
          flexShrink: 0,
          transform: "rotate(-150deg) scaleY(-1)",
          opacity: 0.3,
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/**
 * Decoration is deliberately NOT bundled into a one-size kit applied to every
 * band. Three sections on this page are decorated — the opening, the section
 * where the article turns, and the close — and the rest are left plain so the
 * decorated ones still register. Compose `VectorGrid`, `EllipseGlow`,
 * `HexOutline`, `HexGrid` and `CornerGlows` per section instead.
 */

/** The decoration for the opening light band: hex grids under corner glows. */
export function LightBandDecor({
  corner = true,
}: {
  corner?: boolean;
}): React.ReactElement {
  return (
    <>
      <HexGrid side="left" />
      <HexGrid side="right" />
      {corner && <CornerGlows />}
    </>
  );
}

/* ───────────────────────────── cards ───────────────────────────── */

/** Which corner carries the oversized radius. */
export type Corner = "tl" | "tr" | "bl" | "br";

// 62px is the SbomAdvantage value — the site's one oversized-corner tile.
const CORNER_RADIUS: Record<Corner, string> = {
  tl: "62px 8px 8px 8px",
  tr: "8px 62px 8px 8px",
  br: "8px 8px 62px 8px",
  bl: "8px 8px 8px 62px",
};

/** The corner sequence SbomAdvantage runs across a 2×2 grid. */
export const CORNER_CYCLE: readonly Corner[] = ["br", "bl", "tr", "tl"];

export const cornerAt = (index: number): Corner =>
  CORNER_CYCLE[index % CORNER_CYCLE.length] as Corner;

/**
 * The white oversized-corner tile from `SbomAdvantage`. One border weight, one
 * fill, one radius vocabulary — the rotation of the oversized corner is what
 * gives a grid of these its rhythm, not a rotation of colours.
 */
export function CornerTile({
  corner,
  className,
  children,
}: {
  corner: Corner;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <article
      className={cn("relative flex h-full flex-col bg-white", className)}
      style={{
        borderRadius: CORNER_RADIUS[corner],
        border: "1.5px solid rgba(0,0,0,0.06)",
        padding: "clamp(20px, 1.67vw, 30px)",
        gap: "12px",
      }}
    >
      {children}
    </article>
  );
}

/**
 * The gradient card from the Clean Images "Engineered for Assurance" row:
 * white → violet wash, cyan hairline border, faint interior grid. Used where a
 * card needs more presence than `CornerTile` — the two recommendation panels
 * and the opening questions.
 */
export function AssuranceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <article
      className={cn("relative overflow-hidden bg-white", className)}
      style={{
        borderRadius: "24px",
        border: "1px solid rgba(120,180,255,0.45)",
        background:
          "linear-gradient(150deg, #ffffff 0%, #ffffff 38%, #F6EDFF 78%, #EFDCFF 100%)",
        padding: "clamp(20px, 1.9vw, 30px)",
        boxShadow: "0 1px 2px rgba(17,17,17,0.04), 0 14px 34px -18px rgba(70,30,190,0.18)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,120,200,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,200,0.07) 1px, transparent 1px)",
          backgroundSize: "68px 68px",
        }}
      />
      <div className="relative flex h-full flex-col">{children}</div>
    </article>
  );
}

/**
 * Dark-band equivalent of `AssuranceCard` — the translucent panel the site's
 * dark sections use instead of a bordered box.
 */
export function DarkPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn("relative h-full overflow-hidden", className)}
      style={{
        borderRadius: "24px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        padding: "clamp(22px, 2vw, 34px)",
      }}
    >
      {children}
    </div>
  );
}
