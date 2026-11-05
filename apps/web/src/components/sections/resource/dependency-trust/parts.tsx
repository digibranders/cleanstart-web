import type { CSSProperties, ReactNode } from "react";

/**
 * Shared recipes for the report landing page. The page is one dark theme: a
 * near-black violet ground, the brand's violet-to-cyan gradient for the words
 * and figures that matter, and "bezel" containers (an outer tray with a hairline
 * ring around an inner glass plate). Radii follow one rule: containers 28px
 * outside and 22px inside, inner tiles 14px, controls 8px.
 */

export const GROUND = "#0B0716";

export const DARK_BAND = "linear-gradient(180deg, #120D1F 0%, #151021 50%, #131E8F 82%, #471EC0 100%)";

export const STAT_GRADIENT: CSSProperties = {
  background: "linear-gradient(94deg, rgb(177, 126, 255) 1.758%, rgb(79, 209, 245) 98.781%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

export const CARD_PADDING = "clamp(24px, 2.4vw, 36px)";

interface GradientTitleProps {
  text: string;
  /** The words that carry the gradient. They must appear in `text`. */
  accent: string;
  align?: "center" | "left";
}

/** A section heading with its key words in the brand gradient. */
export function GradientTitle({ text, accent, align = "center" }: GradientTitleProps): React.ReactElement {
  const at = text.lastIndexOf(accent);
  const before = at < 0 ? text : text.slice(0, at);
  const after = at < 0 ? "" : text.slice(at + accent.length);
  const centered = align === "center";
  return (
    <h2
      className={centered ? "mx-auto text-center" : "text-left"}
      style={{
        maxWidth: centered ? "760px" : "none",
        fontFamily: "var(--font-display)",
        fontSize: "var(--fs-h2)",
        fontWeight: 600,
        letterSpacing: "-0.04em",
        lineHeight: 1.12,
        color: "#ffffff",
        textWrap: "balance",
      }}
    >
      {before}
      {at >= 0 && <span className="cs-text-gradient-impact">{accent}</span>}
      {after}
    </h2>
  );
}

interface BezelProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  innerStyle?: CSSProperties;
}

/** An outer tray with a hairline ring around an inner glass plate. */
export function Bezel({ children, className = "", innerClassName = "", innerStyle }: BezelProps): React.ReactElement {
  return (
    <div className={`h-full rounded-[28px] bg-white/[0.04] p-1.5 ring-1 ring-white/10 ${className}`}>
      <div
        className={`relative h-full overflow-hidden rounded-[22px] ${innerClassName}`}
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface DarkSectionProps {
  dataSection: string;
  /** Fades the section in from the hero's violet base instead of cutting to the ground. */
  fromHero?: boolean;
  children: ReactNode;
}

/** A section on the page ground, with two soft aurora glows behind the content. */
export function DarkSection({ dataSection, fromHero = false, children }: DarkSectionProps): React.ReactElement {
  return (
    <section
      data-section={dataSection}
      className="relative overflow-clip"
      style={{
        background: fromHero ? `linear-gradient(180deg, #471EC0 0px, ${GROUND} 260px)` : GROUND,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "-18%",
          top: "-8%",
          width: "64%",
          aspectRatio: "1",
          background: "radial-gradient(closest-side, rgba(112, 60, 255, 0.2) 0%, rgba(112, 60, 255, 0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "-16%",
          bottom: "-14%",
          width: "56%",
          aspectRatio: "1",
          background: "radial-gradient(closest-side, rgba(44, 193, 235, 0.11) 0%, rgba(44, 193, 235, 0) 100%)",
        }}
      />
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "var(--container-default)",
          paddingLeft: "clamp(16px, 4vw, 48px)",
          paddingRight: "clamp(16px, 4vw, 48px)",
          paddingTop: "clamp(72px, 8vw, 150px)",
          paddingBottom: "clamp(64px, 7vw, 130px)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
