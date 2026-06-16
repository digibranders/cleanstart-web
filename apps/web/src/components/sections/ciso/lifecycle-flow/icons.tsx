/**
 * Neon line glyphs for the CISO lifecycle diagram. Every icon is a stroke-only
 * SVG using `currentColor`, so the parent controls the colour and a
 * `drop-shadow` glow flows through. 24×24 view-box, round caps/joins to read as
 * soft neon at any size.
 */

export interface IconProps {
  className?: string;
  /** CSS size (width = height). Defaults to `1em`. */
  size?: number | string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
};

function svgSize(size: IconProps["size"]): string {
  if (size === undefined) return "1em";
  return typeof size === "number" ? `${size}px` : size;
}

export type IconCmp = (props: IconProps) => React.ReactElement;

/** `</>` — Open Source, Code & Repositories. */
export function CodeIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="m8.5 8-4 4 4 4" />
      <path d="m15.5 8 4 4-4 4" />
      <path d="M13.4 5.5 10.6 18.5" />
    </svg>
  );
}

/** "AI" wordmark — AI-Generated Code. */
export function AiIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display), system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.4"
        fill="currentColor"
        stroke="none"
      >
        AI
      </text>
    </svg>
  );
}

/** Shield with a check — Dependencies, Policy Enforcement. */
export function ShieldCheckIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M12 2.6 5 5.3v5c0 4.3 2.9 8.4 7 9.6 4.1-1.2 7-5.3 7-9.6v-5L12 2.6Z" />
      <path d="m8.9 11.6 2.2 2.2 4-4.4" />
    </svg>
  );
}

/** Three stacked 3D boxes (lucide "boxes") — Third-Party Dependencies. */
export function BoxesIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
      <path d="m7 16.5-4.74-2.85" />
      <path d="m7 16.5 5-3" />
      <path d="M7 16.5v5.17" />
      <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
      <path d="m17 16.5-5-3" />
      <path d="m17 16.5 4.74-2.85" />
      <path d="M17 16.5v5.17" />
      <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
      <path d="M12 8 7.26 5.15" />
      <path d="m12 8 4.74-2.85" />
      <path d="M12 13.5V8" />
    </svg>
  );
}

/** Isometric cube — Build Systems. */
export function CubeIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M12 2.8 20.2 7v10L12 21.2 3.8 17V7L12 2.8Z" />
      <path d="M3.8 7 12 11.6 20.2 7" />
      <path d="M12 11.6V21.2" />
    </svg>
  );
}

/** Artifact container with a bidirectional push/pull arrow — Artifact Registry
 *  (hub). The box = the central artifact store; the double-headed arrow = the
 *  publish (up) / consume (down) flow that makes it the ecosystem's nexus.
 *  Kept distinct from Build Systems' plain cube. */
export function RegistryIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M12 2.8 20.2 7v10L12 21.2 3.8 17V7L12 2.8Z" />
      <path d="M12 6.3V17.7" />
      <path d="M8.9 9.4 12 6.3l3.1 3.1" />
      <path d="M8.9 14.6 12 17.7l3.1-3.1" />
    </svg>
  );
}

/** Cloud — Deployments, Deployment Risk. */
export function CloudIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M7.2 18.5h9.6a3.7 3.7 0 0 0 .5-7.36 5.2 5.2 0 0 0-10.05-1.2A4.04 4.04 0 0 0 7.2 18.5Z" />
    </svg>
  );
}

/** Stacked database/server bars — Runtime Workloads, Vulnerable Workloads. */
export function ServerStackIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <rect x="4" y="4.4" width="16" height="4.4" rx="1.4" />
      <rect x="4" y="10.8" width="16" height="4.4" rx="1.4" />
      <rect x="4" y="17.2" width="16" height="2.4" rx="1.2" />
      <path d="M7 6.6h.01M7 13h.01" />
    </svg>
  );
}

/** Shield with an alert mark — Compliance Drift. */
export function ShieldAlertIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M12 2.6 5 5.3v5c0 4.3 2.9 8.4 7 9.6 4.1-1.2 7-5.3 7-9.6v-5L12 2.6Z" />
      <path d="M12 8.2v4" />
      <path d="M12 15.4h.01" />
    </svg>
  );
}

/** Crosshair / target — Operational Exposure. */
export function TargetIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 1.4v3.6M12 19v3.6M1.4 12h3.6M19 12h3.6" />
    </svg>
  );
}

/** Eye — Continuous Visibility. */
export function EyeIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M2.4 12S5.8 5.6 12 5.6 21.6 12 21.6 12 18.2 18.4 12 18.4 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </svg>
  );
}

/** Fingerprint — Provenance & Integrity. */
export function FingerprintIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M5.6 9.2a7.2 7.2 0 0 1 12.6-1.1" />
      <path d="M5 14.6c.5 1.6.7 3 .7 4.4" />
      <path d="M9 7.4a4.3 4.3 0 0 1 6.3 3.8c0 2.7.3 5 1 6.9" />
      <path d="M12 11.2v1.6c0 2.6.5 4.8 1.4 6.6" />
      <path d="M8.7 12.6c0 3 .6 5.2 1.7 6.9" />
    </svg>
  );
}

/** Document with lines — Compliance Evidence. */
export function DocumentIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M6.4 2.8h7l4.2 4.2v14.2H6.4V2.8Z" />
      <path d="M13.2 2.8V7.4h4.4" />
      <path d="M9 12.4h6M9 15.6h6M9 18.4h3.6" />
    </svg>
  );
}
