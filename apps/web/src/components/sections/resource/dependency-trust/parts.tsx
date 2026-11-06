import type { CSSProperties, ReactNode } from "react";

/**
 * The site's own section vocabulary, as the CISO and Clean Images pages use it:
 * a centered heading with a purple-to-cyan accent on its key words, white cards
 * with a gradient hairline, and a violet band for dark sections. These are the
 * same recipes, gathered here so the landing page reads as part of the site.
 */

export const DARK_BAND =
  "linear-gradient(180deg, #120D1F 0%, #151021 50%, #131E8F 82%, #471EC0 100%)";

export const STAT_GRADIENT: CSSProperties = {
  background: "linear-gradient(94deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

const TITLE_GRADIENT: CSSProperties = {
  background: "linear-gradient(105deg, rgb(154, 81, 255) 40%, rgb(44, 193, 235) 98.781%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/** White card with the gradient hairline used on the CISO page cards. */
export const HAIRLINE_CARD: CSSProperties = {
  borderRadius: "24px",
  border: "1.5px solid transparent",
  background:
    "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, rgba(154, 81, 255, 0.5) 0%, rgba(44, 193, 235, 0.5) 100%) border-box",
  boxShadow: "0 12px 32px -16px rgba(45, 90, 200, 0.12)",
};

export const CARD_PADDING = "clamp(24px, 2.2vw, 32px)";

interface GradientTitleProps {
  text: string;
  /** The words that carry the gradient. They must appear in `text`. */
  accent: string;
  tone?: "light" | "dark";
}

/** A centered section heading with its key words in the brand gradient. */
export function GradientTitle({ text, accent, tone = "light" }: GradientTitleProps): React.ReactElement {
  const at = text.lastIndexOf(accent);
  const before = at < 0 ? text : text.slice(0, at);
  const after = at < 0 ? "" : text.slice(at + accent.length);
  const dark = tone === "dark";
  return (
    <h2
      className="mx-auto text-center"
      style={{
        maxWidth: "760px",
        fontFamily: "var(--font-display)",
        fontSize: "var(--fs-h2)",
        fontWeight: 600,
        letterSpacing: "-0.04em",
        lineHeight: 1.15,
        color: dark ? "#ffffff" : "#111111",
        textWrap: "balance",
      }}
    >
      {before}
      {at >= 0 &&
        (dark ? (
          <span className="cs-text-gradient-impact">{accent}</span>
        ) : (
          <span style={TITLE_GRADIENT}>{accent}</span>
        ))}
      {after}
    </h2>
  );
}

const DECORATIONS = [
  { src: "deco-union-left.svg", left: -500, top: -539, size: 1181 },
  { src: "deco-union-right.svg", left: 1216, top: -535, size: 1101 },
  { src: "deco-glow-top-left.svg", left: -311, top: -319, size: 744 },
  { src: "deco-glow-top-right.svg", left: 1477, top: -319, size: 744 },
] as const;

interface LightSectionProps {
  dataSection: string;
  /** `wash` is the soft grey band the CISO page uses; `white` is plain. */
  tone?: "wash" | "white";
  children: ReactNode;
}

/** A light section with the faded hex-grid and glow decoration. */
export function LightSection({ dataSection, tone = "wash", children }: LightSectionProps): React.ReactElement {
  return (
    <section
      data-section={dataSection}
      className="relative overflow-hidden"
      style={{
        background:
          tone === "wash"
            ? "linear-gradient(180deg, rgba(246,246,246,0) 0%, #F6F6F6 96px, #F6F6F6 calc(100% - 96px), rgba(246,246,246,0) 100%)"
            : "#ffffff",
      }}
    >
      {DECORATIONS.map((item) => (
        <div
          key={item.src}
          aria-hidden
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            left: `calc(${item.left} / 1920 * 100vw)`,
            top: `calc(${item.top} / 1920 * 100vw)`,
            width: `calc(${item.size} / 1920 * 100vw)`,
            height: `calc(${item.size} / 1920 * 100vw)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/for-developers/why/${item.src}`}
            alt=""
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "var(--container-default)",
          paddingLeft: "clamp(16px, 4vw, 48px)",
          paddingRight: "clamp(16px, 4vw, 48px)",
          paddingTop: "clamp(56px, 6.25vw, 120px)",
          paddingBottom: "clamp(48px, 5.2vw, 100px)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

interface DarkSectionProps {
  dataSection: string;
  children: ReactNode;
}

/**
 * A violet-navy band for sections that sit between two light ones, with the same
 * container and padding as `LightSection` so the page keeps one rhythm.
 */
export function DarkSection({ dataSection, children }: DarkSectionProps): React.ReactElement {
  return (
    <section
      data-section={dataSection}
      className="relative overflow-hidden text-white"
      style={{ background: "linear-gradient(180deg, #151021 0%, #10123E 55%, #131E8F 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, rgba(255,255,255,0) 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0) 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(70% 70% at 50% 30%, #000 0%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "radial-gradient(70% 70% at 50% 30%, #000 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "var(--container-default)",
          paddingLeft: "clamp(16px, 4vw, 48px)",
          paddingRight: "clamp(16px, 4vw, 48px)",
          paddingTop: "clamp(56px, 6.25vw, 120px)",
          paddingBottom: "clamp(48px, 5.2vw, 100px)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

/** Frosted card with the gradient edge the site uses on dark bands. */
export const GLASS_CARD: CSSProperties = {
  background:
    "linear-gradient(155deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 48%, rgba(255,255,255,0.05) 100%)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 40px 90px -30px rgba(8,4,24,0.7), inset 0 1px 0 rgba(255,255,255,0.10)",
};
