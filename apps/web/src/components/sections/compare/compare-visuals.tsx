import Image from "next/image";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Visual vocabulary for the comparison page.
 *
 * Every device here resolves to something apps/web already ships: the violet 3D
 * icon set under `public/images`, the shared decorative SVGs (hex-grid unions,
 * ellipse glows, card glow), the canonical dark-band gradient, and the
 * oversized-corner white tile from `sbom/SbomAdvantage`.
 *
 * There is deliberately no accent-colour array. The site's palette runs
 * violet → indigo → blue, and the page spends it on one axis only: CleanStart
 * is violet, Docker Hardened Images is neutral slate. A second accent hue for
 * the comparator would read as a second brand.
 */

/* ─────────────────────────── tokens ─────────────────────────── */

/** The canonical dark section gradient, shared across the site's dark bands. */
export const BAND_DARK =
  "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)";

/** Light section wash, matching `WhyMattersGrid` / `SbomAdvantage`. */
export const WASH_LIGHT = "#F6F6F6";

/** The lavender enterprise wash `FinanceRequirements` paints its band with. */
export const WASH_LAVENDER = "#EFEDF7";

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
            /* Capped, not proportional. The bloom is a hint of light behind the
               artwork, so it must not keep growing with the icon — at 128px a
               linear halo became a magenta cloud filling the card. */
            width: Math.min(size * 0.72, 74),
            height: Math.min(size * 0.72, 74),
            background: BRAND.violetPale,
            opacity: 0.16,
            filter: `blur(${Math.min(Math.round(size * 0.3), 24)}px)`,
            /* Explicit. `filter` gives this span its own stacking context, and
               with both it and the image on `z-index: auto` the paint order was
               left to chance — the bloom won and hid the artwork outright at
               large sizes. */
            zIndex: 0,
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
        style={{ width: "100%", height: "100%", zIndex: 1 }}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

/* ───────────────────────────── headings ───────────────────────────── */

/**
 * A section heading with the brand name set in the site's impact gradient,
 * the way the hero sets it. The document's headings all name CleanStart
 * once; colouring that word is the one heading treatment shared with every
 * sibling page, and it keeps the seven long question headings from reading as
 * an article's subheads.
 */
export function AccentHeading({ text }: { text: string }): React.ReactNode {
  const index = text.indexOf("CleanStart");
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="cs-text-gradient-impact">CleanStart</span>
      {text.slice(index + "CleanStart".length)}
    </>
  );
}

/**
 * Band header: the document's H2 on the left, its intro paragraph on the
 * right, top-aligned on wide screens so both start on the same line however
 * many lines each runs to.
 */
export function BandHeader({
  id,
  heading,
  intro,
  tone = "light",
}: {
  id: string;
  heading: string;
  intro: string;
  tone?: "light" | "dark";
}): React.ReactElement {
  const dark = tone === "dark";
  return (
    <div className="grid gap-y-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-x-16">
      <Reveal header>
        <h2
          id={id}
          className="font-display"
          style={{
            fontSize: "var(--fs-h2)",
            fontWeight: "var(--fs-h2-weight)",
            letterSpacing: "var(--fs-h2-ls)",
            lineHeight: "var(--fs-h2-lh)",
            color: dark ? "#ffffff" : "#111111",
            maxWidth: "20ch",
          }}
        >
          <AccentHeading text={heading} />
        </h2>
      </Reveal>
      <Reveal delay={0.1} y={20}>
        <p
          /* A small top inset so the paragraph's first line reads as level
             with the heading's, rather than sitting hard against the grid
             row's top edge under a much larger cap height. */
          className="lg:pt-2"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-lead-sm)",
            fontWeight: "var(--fs-lead-weight)",
            lineHeight: "var(--fs-lead-lh)",
            letterSpacing: "var(--fs-lead-ls)",
            color: dark ? "rgba(255,255,255,0.72)" : "#333333",
            maxWidth: "52ch",
          }}
        >
          {intro}
        </p>
      </Reveal>
    </div>
  );
}

/* ───────────────────────────── vendor marks ───────────────────────────── */

/** Vendor mark: the Docker whale on a white plate, the CleanStart logomark on
    the dark-band tile it needs (the mark is white and cyan, and vanishes on
    any light surface). Decorative; the label names it. */
export function VendorMark({
  tone,
  size = 36,
}: {
  tone: "docker" | "cleanstart";
  size?: number;
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  const glyph = Math.round(size * 0.58);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: isCleanStart
          ? "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)"
          : "#ffffff",
        border: isCleanStart
          ? "1px solid rgba(255,255,255,0.22)"
          : "1px solid rgba(17,17,17,0.1)",
        boxShadow: "0 1px 2px rgba(17,17,17,0.06)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          isCleanStart
            ? "/images/security/cs-logomark.svg"
            : "/images/compare/tools/docker.svg"
        }
        alt=""
        width={glyph}
        height={glyph}
        style={{ width: glyph, height: glyph, objectFit: "contain" }}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

/* ─────────────────────── decorative background ─────────────────────── */

/** Ambient radial glow, used to light the corners of the hero band. */
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
 * The corner unions the lavender enterprise band bleeds off its top corners
 * (`FinanceRequirements`). One asset, mirrored, rotated the same way on both
 * sides, so the band is framed rather than decorated.
 */
export function EnterpriseUnions(): React.ReactElement {
  return (
    <>
      {(
        [
          { side: "left", left: "-218px", top: "-139px" },
          { side: "right", right: "-185px", top: "-193px" },
        ] as const
      ).map((corner) => (
        <div
          key={corner.side}
          aria-hidden
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            ...("left" in corner ? { left: corner.left } : { right: corner.right }),
            top: corner.top,
            width: "488px",
            height: "496px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ciso/enterprise-union.svg"
            alt=""
            className="block size-full"
            style={{ transform: "rotate(141.39deg) scaleY(-1)" }}
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
  top,
  bottom,
  edge = "-6%",
  opacity = 0.55,
}: {
  side?: "left" | "right";
  width?: string;
  /** Vertical anchor. Pass one of `top` / `bottom`; `top: -8%` is the default. */
  top?: string;
  bottom?: string;
  /** Horizontal bleed off the section edge. Push this further negative to keep
   *  the plate clear of a column that reaches into the same corner. */
  edge?: string;
  opacity?: number;
}): React.ReactElement {
  // The plate is flipped on each axis it is anchored to, so its dense corner
  // always faces into the section and the fade always runs off-canvas.
  const flips = [
    side === "left" ? "scaleX(-1)" : "",
    bottom !== undefined ? "scaleY(-1)" : "",
  ].filter(Boolean);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute hidden select-none lg:block"
      style={{
        ...(side === "left" ? { left: edge } : { right: edge }),
        ...(bottom !== undefined ? { bottom } : { top: top ?? "-8%" }),
        width,
        aspectRatio: "730 / 708",
        opacity,
        ...(flips.length ? { transform: flips.join(" ") } : {}),
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
 * The deep navy plate the SaaS "shift left" deck uses on the same dark band:
 * an opaque navy gradient with a violet bloom at the lower left, a cool
 * hairline edge and a deep drop shadow. Opaque on purpose, so the band
 * gradient behind it does not wash the panel's contents.
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
      className={cn("relative overflow-hidden", className)}
      style={{
        borderRadius: "28px",
        border: "1px solid rgba(140, 160, 255, 0.16)",
        background: [
          "radial-gradient(60% 80% at 18% 55%, rgba(106, 61, 240, 0.14) 0%, rgba(106, 61, 240, 0) 70%)",
          "linear-gradient(180deg, rgba(13, 17, 50, 0.88) 0%, rgba(8, 11, 36, 0.96) 100%)",
        ].join(", "),
        boxShadow: [
          "0 34px 90px -40px rgba(0, 0, 0, 0.75)",
          "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        ].join(", "),
        padding: "clamp(22px, 2vw, 34px)",
      }}
    >
      {children}
    </div>
  );
}
