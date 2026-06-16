interface ShieldCheckProps {
  className?: string;
}

/**
 * Brand-styled green security badge — a glossy shield with a checkmark.
 * Replaces the raster `shield.png` so it can recolour, glow, and draw its
 * check on activation. The `.cs-sec-check` path is animated (stroke-draw) by
 * the section's `.cs-sec-on` choreography; see globals.css.
 */
export function ShieldCheck({ className }: ShieldCheckProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 72 72"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="cs-sec-disc" cx="0.5" cy="0.36" r="0.72">
          <stop offset="0" stopColor="#3ad19b" />
          <stop offset="1" stopColor="#0d5e43" />
        </radialGradient>
        <linearGradient id="cs-sec-shield-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1cc088" />
          <stop offset="1" stopColor="#0a6f4e" />
        </linearGradient>
      </defs>

      <circle
        cx="36"
        cy="36"
        r="31"
        fill="url(#cs-sec-disc)"
        stroke="#7df2c2"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <path
        d="M36 11.5 L56.5 18.5 V34 C56.5 46.8 47.6 55.6 36 60.5 C24.4 55.6 15.5 46.8 15.5 34 V18.5 Z"
        fill="url(#cs-sec-shield-fill)"
        stroke="#9bf7cf"
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <path
        className="cs-sec-check"
        d="M26.5 36.5 L33 43 L46 28.5"
        fill="none"
        stroke="#eafff6"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
