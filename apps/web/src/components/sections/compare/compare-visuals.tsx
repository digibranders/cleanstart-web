import { GlassIcon } from "@/components/sections/_shared/GlassIcon";
import { cn } from "@/lib/cn";

/**
 * Visual vocabulary for the comparison page, built from the system the rest of
 * apps/web already uses rather than a new one.
 *
 * Dark sections: glass icon gems, hairline column dividers, ambient glows and a
 * connective thread with a travelling pulse (`clean-libraries/LibrariesTrustGap`).
 * Light sections: accent-tinted panels with one oversized outward corner and a
 * coloured line-icon disc (`clean-libraries/LibrariesGovernance`,
 * `sbom/SbomAdvantage`).
 *
 * The four accents are the page's, matching the site's existing set. They are
 * assigned positionally so each row of items reads as a sequence rather than as
 * repeated identical tiles.
 */

export interface Accent {
  /** Icon-gem and glyph colour on dark. */
  dark: string;
  /** Line-icon and rule colour on light. */
  light: string;
  /** Panel fill on light. */
  fill: string;
  /** Panel border on light. */
  border: string;
  /** Icon-disc drop shadow on light. */
  shadow: string;
}

export const ACCENTS: readonly Accent[] = [
  {
    dark: "#a974ff",
    light: "#6d28d9",
    fill: "#f6f3fe",
    border: "#d4c6f9",
    shadow: "rgba(109,40,217,0.15)",
  },
  {
    dark: "#5b9bff",
    light: "#1d4ed8",
    fill: "#eff3fe",
    border: "#b4c6f4",
    shadow: "rgba(29,78,216,0.15)",
  },
  {
    dark: "#2dd4bf",
    light: "#0f766e",
    fill: "#eefbf7",
    border: "#b5e3d8",
    shadow: "rgba(15,118,110,0.15)",
  },
  {
    dark: "#f7a35c",
    light: "#b45309",
    fill: "#fff7ed",
    border: "#f5d9b5",
    shadow: "rgba(180,83,9,0.15)",
  },
];

export const accentAt = (index: number): Accent =>
  ACCENTS[index % ACCENTS.length] as Accent;

/* ─────────────────────────── glyphs ─────────────────────────── */

export type GlyphKey =
  | "origin"
  | "compiler"
  | "provenance"
  | "binary"
  | "shrink"
  | "packages"
  | "remediate"
  | "overhead"
  | "surface"
  | "sbom"
  | "aibom"
  | "signature"
  | "seal"
  | "fips"
  | "stig"
  | "layers"
  | "check"
  | "image"
  | "build";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Thin line glyphs. Stroke inherits `currentColor` so callers set the colour. */
export function Glyph({
  icon,
  size = 24,
}: {
  icon: GlyphKey;
  size?: number;
}): React.ReactElement {
  const c = { ...STROKE, width: size, height: size, viewBox: "0 0 24 24" };
  switch (icon) {
    case "origin":
      return (
        <svg {...c}>
          <circle cx="12" cy="10" r="3" />
          <path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11Z" />
        </svg>
      );
    case "compiler":
      return (
        <svg {...c}>
          <path d="m8 8-4 4 4 4" />
          <path d="m16 8 4 4-4 4" />
          <path d="M13 5l-2 14" />
        </svg>
      );
    case "provenance":
      return (
        <svg {...c}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "binary":
      return (
        <svg {...c}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
          <path d="M11 7.5h4a2 2 0 0 1 2 2V13" />
        </svg>
      );
    case "shrink":
      return (
        <svg {...c}>
          <path d="M9 3H5a2 2 0 0 0-2 2v4" />
          <path d="M15 3h4a2 2 0 0 1 2 2v4" />
          <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
          <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
          <rect x="8" y="8" width="8" height="8" rx="1" />
        </svg>
      );
    case "packages":
      return (
        <svg {...c}>
          <path d="M12 2 3 7v10l9 5 9-5V7Z" />
          <path d="M3 7l9 5 9-5" />
          <path d="M12 12v10" />
        </svg>
      );
    case "remediate":
      return (
        <svg {...c}>
          <path d="M21 12a9 9 0 1 1-3.2-6.9" />
          <path d="M21 4v5h-5" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "overhead":
      return (
        <svg {...c}>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19H2" />
        </svg>
      );
    case "surface":
      return (
        <svg {...c}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
        </svg>
      );
    case "sbom":
      return (
        <svg {...c}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v5h5" />
          <line x1="8.5" y1="13" x2="15" y2="13" />
          <line x1="8.5" y1="17" x2="13" y2="17" />
        </svg>
      );
    case "aibom":
      return (
        <svg {...c}>
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <path d="M9 4V2M15 4V2M12 4V2" />
          <circle cx="9.5" cy="13" r="1" />
          <circle cx="14.5" cy="13" r="1" />
          <path d="M9 17h6" />
        </svg>
      );
    case "signature":
      return (
        <svg {...c}>
          <path d="M3 17c3 0 4-8 7-8s3 8 6 8h5" />
          <path d="M3 21h18" />
        </svg>
      );
    case "seal":
      return (
        <svg {...c}>
          <circle cx="12" cy="10" r="6" />
          <path d="m9 10 2 2 4-4" />
          <path d="M9 16v6l3-2 3 2v-6" />
        </svg>
      );
    case "fips":
      return (
        <svg {...c}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "stig":
      return (
        <svg {...c}>
          <path d="M4 6h16M4 12h16M4 18h10" />
          <path d="m17 16 2 2 3-3" />
        </svg>
      );
    case "layers":
      return (
        <svg {...c}>
          <path d="m12 3 9 5-9 5-9-5Z" />
          <path d="m3 13 9 5 9-5" />
        </svg>
      );
    case "check":
      return (
        <svg {...c}>
          <path d="m4 12.5 5 5L20 6.5" />
        </svg>
      );
    case "image":
      return (
        <svg {...c}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 18v2M17 18v2M7 4v2M17 4v2" />
          <path d="M9 12h6" />
        </svg>
      );
    case "build":
      return (
        <svg {...c}>
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

/* ───────────────────── dark-section devices ───────────────────── */

/**
 * Keyframes for the connective thread's travelling pulse. Mirrors the
 * `tg-thread-pulse` treatment on the Clean Libraries trust row, including its
 * reduced-motion opt-out.
 */
export const THREAD_CSS = `
@keyframes cmp-flow{from{background-position:-40% 0}to{background-position:140% 0}}
.cmp-thread-pulse{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.85) 12%,transparent 24%);background-size:38% 100%;animation:cmp-flow 4s linear infinite}
@keyframes cmp-flow-v{from{background-position:0 -40%}to{background-position:0 140%}}
.cmp-thread-pulse-v{background:linear-gradient(180deg,transparent,rgba(255,255,255,0.8) 12%,transparent 24%);background-size:100% 38%;animation:cmp-flow-v 4.4s linear infinite}
@media (prefers-reduced-motion:reduce){.cmp-thread-pulse,.cmp-thread-pulse-v{animation:none;opacity:0}}
`;

/** Horizontal thread running behind a row of gems. `top` is the gem half-height. */
export function Thread({
  top,
  inset = "12.5%",
}: {
  top: number;
  inset?: string;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-0 hidden select-none overflow-hidden rounded-full lg:block"
      style={{
        top,
        left: inset,
        right: inset,
        height: 2,
        background:
          "linear-gradient(90deg, rgba(169,116,255,0), rgba(169,116,255,0.5), rgba(91,155,255,0.5), rgba(45,212,191,0.5), rgba(247,163,92,0.5), rgba(247,163,92,0))",
      }}
    >
      <div className="cmp-thread-pulse absolute inset-0" />
    </div>
  );
}

/**
 * One borderless column on a dark band: glowing glass gem, title, body. The
 * hairline divider on the left (desktop only) separates columns without drawing
 * four card boxes.
 */
export function GemColumn({
  icon,
  accent,
  title,
  body,
  showDivider,
  size = 72,
}: {
  icon: GlyphKey;
  accent: Accent;
  title: string;
  body?: string;
  showDivider: boolean;
  size?: number;
}): React.ReactElement {
  const glow = `color-mix(in srgb, ${accent.dark} 42%, transparent)`;
  return (
    <div className="relative flex flex-col items-center px-5 text-center">
      {showDivider && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1.5 left-0 top-1.5 hidden w-px select-none lg:block"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,0.14) 22%, rgba(255,255,255,0.14) 78%, transparent)",
          }}
        />
      )}
      <div className="relative mb-5 flex items-center justify-center">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[-32%] select-none rounded-full"
          style={{
            background: `radial-gradient(closest-side, ${glow}, transparent 72%)`,
            filter: "blur(10px)",
          }}
        />
        <div className="relative z-10">
          <GlassIcon accent={accent.dark} size={size}>
            <Glyph icon={icon} size={Math.round(size * 0.4)} />
          </GlassIcon>
        </div>
      </div>
      <p
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
          textWrap: "balance",
        }}
      >
        {title}
      </p>
      {body && (
        <p
          className="mt-2 max-w-[230px] text-white/70"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: 1.5,
            letterSpacing: "-0.01em",
            textWrap: "pretty",
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

/* ───────────────────── light-section devices ───────────────────── */

/** Which corner carries the oversized radius. */
export type Corner = "tl" | "tr" | "bl" | "br";

// 62px matches the oversized-corner value the SBOM advantage grid already uses.
const CORNER_RADIUS: Record<Corner, string> = {
  tl: "62px 8px 8px 8px",
  tr: "8px 62px 8px 8px",
  br: "8px 8px 62px 8px",
  bl: "8px 8px 8px 62px",
};

const CORNER_GRADIENT: Record<Corner, string> = {
  tl: "at 0% 0%",
  tr: "at 100% 0%",
  br: "at 100% 100%",
  bl: "at 0% 100%",
};

/**
 * Accent panel for light sections: tinted fill fading to white from the
 * oversized corner, a 1px accent border, and a coloured line-icon disc. Four of
 * these with rotating corners and accents read as a composition rather than as
 * four identical tiles — the treatment the SBOM and Governance sections use.
 */
export function AccentPanel({
  icon,
  accent,
  corner,
  title,
  body,
  className,
}: {
  icon: GlyphKey;
  accent: Accent;
  corner: Corner;
  title: string;
  body?: string;
  className?: string;
}): React.ReactElement {
  return (
    <article
      className={cn("relative flex h-full flex-col overflow-hidden", className)}
      style={{
        borderRadius: CORNER_RADIUS[corner],
        border: `1px solid ${accent.border}`,
        background: `radial-gradient(120% 120% ${CORNER_GRADIENT[corner]}, ${accent.fill} 0%, #ffffff 62%)`,
        padding: "clamp(20px, 1.9vw, 30px)",
      }}
    >
      <span
        aria-hidden
        className="mb-5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white"
        style={{
          color: accent.light,
          boxShadow: `0 6px 16px -6px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
        }}
      >
        <Glyph icon={icon} size={21} />
      </span>
      <p
        className="font-display text-[#111111]"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.3,
          textWrap: "balance",
        }}
      >
        {title}
      </p>
      {body && (
        <p
          className="mt-2 text-[#4A4A4A]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: 1.55,
            letterSpacing: "-0.01em",
          }}
        >
          {body}
        </p>
      )}
    </article>
  );
}

/**
 * Numbered step in a light chain: accent node on a vertical rail, label beside
 * it. Used for the provenance record and the verification questions, where the
 * article's items are a sequence rather than a set of features.
 */
export function ChainStep({
  index,
  accent,
  label,
  last = false,
}: {
  index: number;
  accent: Accent;
  label: string;
  last?: boolean;
}): React.ReactElement {
  return (
    <li className="relative flex gap-5 pb-6 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-[13px] top-7 w-px select-none"
          style={{
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(17,17,17,0.16), rgba(17,17,17,0.05))",
          }}
        />
      )}
      <span
        aria-hidden
        className="relative z-10 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white tabular-nums"
        style={{
          color: accent.light,
          boxShadow: `inset 0 0 0 1px ${accent.border}, 0 4px 10px -6px ${accent.shadow}`,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
        }}
      >
        {index}
      </span>
      <span
        className="pt-1 text-[#1A1A1A]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </li>
  );
}

/** Static keyframe injection for the thread pulses. */
export function ThreadStyles(): React.ReactElement {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static keyframes string, no user input
    <style dangerouslySetInnerHTML={{ __html: THREAD_CSS }} />
  );
}

/** Ambient radial glow for dark bands. */
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

export { GlassIcon };
