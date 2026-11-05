import type { CSSProperties, ReactNode } from "react";

/**
 * Shared recipes for the report landing page. Like the rest of the site it
 * alternates dark and light bands: each section picks a tone, and everything
 * inside reads its colours from `TONES` so a section can be flipped in one place.
 * Containers are "bezels" (an outer tray with a hairline ring around an inner
 * plate). Radii follow one rule: containers 28px outside and 22px inside, inner
 * tiles 14px, controls 8px.
 */

export type Tone = "dark" | "light";

export const GROUND = "#0B0716";
export const WASH = "#F6F6F6";

export const DARK_BAND = "linear-gradient(180deg, #120D1F 0%, #151021 50%, #131E8F 82%, #471EC0 100%)";

const gradientText = (stops: string): CSSProperties => ({
  background: stops,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
});

export const STAT_GRADIENT: CSSProperties = gradientText(
  "linear-gradient(94deg, rgb(177, 126, 255) 1.758%, rgb(79, 209, 245) 98.781%)",
);

const STAT_GRADIENT_LIGHT: CSSProperties = gradientText(
  "linear-gradient(94deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
);

const TITLE_GRADIENT_LIGHT: CSSProperties = gradientText(
  "linear-gradient(105deg, rgb(154, 81, 255) 40%, rgb(44, 193, 235) 98.781%)",
);

interface ToneTokens {
  ground: string;
  heading: string;
  lead: string;
  body: string;
  caption: string;
  strong: string;
  stat: CSSProperties;
  glowA: string;
  glowB: string;
  shell: string;
  plate: string;
  plateShadow: string;
  chip: string;
  publisher: string;
  tick: string;
}

export const TONES: Record<Tone, ToneTokens> = {
  dark: {
    ground: GROUND,
    heading: "#ffffff",
    lead: "rgba(255, 255, 255, 0.94)",
    body: "rgba(255, 255, 255, 0.7)",
    caption: "rgba(255, 255, 255, 0.72)",
    strong: "#ffffff",
    stat: STAT_GRADIENT,
    glowA: "rgba(112, 60, 255, 0.2)",
    glowB: "rgba(44, 193, 235, 0.11)",
    shell: "bg-white/[0.04] ring-white/10",
    plate: "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)",
    plateShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
    chip: "border-white/10 bg-white/[0.04]",
    publisher: "#B9A3FF",
    tick: "rgba(255,255,255,0.22)",
  },
  light: {
    ground: WASH,
    heading: "#111111",
    lead: "#1a1a1a",
    body: "#444444",
    caption: "#444444",
    strong: "#1a1a1a",
    stat: STAT_GRADIENT_LIGHT,
    glowA: "rgba(154, 81, 255, 0.12)",
    glowB: "rgba(44, 193, 235, 0.12)",
    shell: "bg-black/[0.035] ring-black/[0.06]",
    plate: "linear-gradient(#ffffff, #ffffff)",
    plateShadow: "inset 0 1px 0 #ffffff, 0 22px 44px -28px rgba(70, 50, 190, 0.28)",
    chip: "border-black/[0.06] bg-[#F6F6F6]",
    publisher: "#471EC0",
    tick: "rgba(17,17,17,0.16)",
  },
};

export const CARD_PADDING = "clamp(24px, 2.4vw, 36px)";

interface GradientTitleProps {
  text: string;
  /** The words that carry the gradient. They must appear in `text`. */
  accent: string;
  tone?: Tone;
  align?: "center" | "left";
}

/** A section heading with its key words in the brand gradient. */
export function GradientTitle({
  text,
  accent,
  tone = "dark",
  align = "center",
}: GradientTitleProps): React.ReactElement {
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
        color: TONES[tone].heading,
        textWrap: "balance",
      }}
    >
      {before}
      {at >= 0 &&
        (tone === "dark" ? (
          <span className="cs-text-gradient-impact">{accent}</span>
        ) : (
          <span style={TITLE_GRADIENT_LIGHT}>{accent}</span>
        ))}
      {after}
    </h2>
  );
}

interface BezelProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  innerClassName?: string;
  innerStyle?: CSSProperties;
}

/** An outer tray with a hairline ring around an inner plate. */
export function Bezel({
  children,
  tone = "dark",
  className = "",
  innerClassName = "",
  innerStyle,
}: BezelProps): React.ReactElement {
  const t = TONES[tone];
  return (
    <div className={`h-full rounded-[28px] p-1.5 ring-1 ${t.shell} ${className}`}>
      <div
        className={`relative h-full overflow-hidden rounded-[22px] ${innerClassName}`}
        style={{ background: t.plate, boxShadow: t.plateShadow, ...innerStyle }}
      >
        {children}
      </div>
    </div>
  );
}

interface PageSectionProps {
  dataSection: string;
  tone: Tone;
  /** Fades the section in from the hero's violet base instead of cutting to the ground. */
  fromHero?: boolean;
  children: ReactNode;
}

/** A section band in one tone, with two soft aurora glows behind the content. */
export function PageSection({ dataSection, tone, fromHero = false, children }: PageSectionProps): React.ReactElement {
  const t = TONES[tone];
  return (
    <section
      data-section={dataSection}
      className="relative overflow-clip"
      style={{ background: fromHero ? `linear-gradient(180deg, #471EC0 0px, ${t.ground} 150px)` : t.ground }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "-18%",
          top: "-8%",
          width: "64%",
          aspectRatio: "1",
          background: `radial-gradient(closest-side, ${t.glowA} 0%, rgba(0, 0, 0, 0) 100%)`,
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
          background: `radial-gradient(closest-side, ${t.glowB} 0%, rgba(0, 0, 0, 0) 100%)`,
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
