/**
 * Brand-styled neon line glyphs for the remediation-flow diagram.
 *
 * Every icon is a stroke-only SVG using `currentColor`, so the parent controls
 * the colour and a `drop-shadow` glow flows through. 24×24 view-box, round
 * caps/joins to read as soft neon at any size.
 */

interface IconProps {
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

/** Shield with an alert mark — Vulnerability. */
export function ShieldAlertIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M12 2.5 5 5.2v5.1c0 4.4 2.9 8.5 7 9.7 4.1-1.2 7-5.3 7-9.7V5.2L12 2.5Z" />
      <path d="M12 8v4" />
      <path d="M12 15.4h.01" />
    </svg>
  );
}

/** Isometric 3D cube — Affected Component. */
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

/** Stacked layers — Images. */
export function LayersIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M12 3 3.2 7.3 12 11.6l8.8-4.3L12 3Z" />
      <path d="M3.2 12 12 16.3l8.8-4.3" />
      <path d="M3.2 16.6 12 20.9l8.8-4.3" />
    </svg>
  );
}

/** Cloud — Environments. */
export function CloudIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <path d="M7.2 18.5h9.6a3.7 3.7 0 0 0 .5-7.36 5.2 5.2 0 0 0-10.05-1.2A4.04 4.04 0 0 0 7.2 18.5Z" />
    </svg>
  );
}

/** Shield-check sitting on stacked layers — Remediation Recommendation. */
export function ShieldLayersIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      {/* layers beneath */}
      <path d="M12 14.2 4.6 17.8 12 21.4l7.4-3.6L12 14.2Z" />
      <path d="M4.6 14 12 17.6l7.4-3.6" opacity={0.55} />
      {/* shield-check on top */}
      <path d="M12 2.6 6.4 4.8v3.9c0 3.4 2.3 6.5 5.6 7.4 3.3-.9 5.6-4 5.6-7.4V4.8L12 2.6Z" />
      <path d="m9.6 9 1.8 1.8L14.6 7.6" />
    </svg>
  );
}

/** Check in a ring — "Risk reduced". */
export function CheckCircleIcon({ className, size }: IconProps): React.ReactElement {
  const s = svgSize(size);
  return (
    <svg {...base} width={s} height={s} className={className}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="m8.4 12.2 2.4 2.4 4.8-4.9" />
    </svg>
  );
}
