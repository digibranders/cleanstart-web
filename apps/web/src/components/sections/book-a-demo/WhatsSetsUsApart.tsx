const VALUE_PROPS: readonly string[] = [
  "The industry's most high performance and lowest footprint images.",
  "Compliance, governance, and security features built-in.",
  "Continuously updated and patched images for maximum security.",
  "Start immediately with 100% zero CVE hardened images.",
];

/**
 * Light-section row with the "Whats sets us Apart?" headline on the left
 * and four shielded value props on the right. Mirrors Figma frame 867:935
 * (layout_99XIKT — row, gap 60, starts at x:197.5, y:473). The section
 * itself is transparent so the parent `BookDemoBody` wrapper's shared
 * decorative layers (grid, radials, ellipse) bleed through into the form
 * area below without a visible seam.
 */
export function WhatsSetsUsApart(): React.ReactElement {
  return (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: "1276px",
        paddingLeft: "clamp(24px, 4vw, 80px)",
        paddingRight: "clamp(24px, 4vw, 80px)",
        paddingTop: "clamp(64px, 7vw, 104px)",
        paddingBottom: "clamp(40px, 5vw, 80px)",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)] items-start gap-10 lg:gap-[60px]">
        <h2
          style={{
            fontFamily: "var(--font-display), 'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(32px, 4.3vw, 62px)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: "#111111",
          }}
        >
          Whats sets
          <br />
          <span
            className="inline-block bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(-44deg, rgba(44, 193, 235, 1) 0%, rgba(154, 81, 255, 1) 65%)",
            }}
          >
            us Apart?
          </span>
        </h2>

        <ul className="flex flex-col" style={{ gap: "16px", maxWidth: "668px" }}>
          {VALUE_PROPS.map((prop) => (
            <li
              key={prop}
              className="flex items-center"
              style={{ gap: "11px" }}
            >
              <ShieldCheckIcon />
              <span
                style={{
                  fontFamily: "var(--font-sans), 'Sora', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(15px, 1.4vw, 20px)",
                  lineHeight: 1.4,
                  letterSpacing: "-0.04em",
                  color: "#111111",
                  opacity: 0.8,
                }}
              >
                {prop}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ShieldCheckIcon(): React.ReactElement {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <title>Shield checkmark</title>
      <defs>
        <linearGradient id="ws-shield-grad" x1="27" y1="3" x2="5" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2CC1EB" />
          <stop offset="0.65" stopColor="#9A51FF" />
        </linearGradient>
      </defs>
      <path d="M16 3 5 7v8.5c0 6 4.6 11.2 11 12 6.4-.8 11-6 11-12V7l-11-4Z" fill="url(#ws-shield-grad)" />
      <path
        d="m11 16 3.5 3.5L21 13"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
