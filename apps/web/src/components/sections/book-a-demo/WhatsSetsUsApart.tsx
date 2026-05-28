import { Reveal } from "@/components/ui/Reveal";

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
        <Reveal header>
          <h2
            style={{
              fontFamily: "var(--font-display), 'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "var(--fs-h2)",
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
        </Reveal>

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
                  fontSize: "var(--fs-body)",
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
      width="18"
      height="21"
      viewBox="0 0 27 32"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <title>Shield checkmark</title>
      <defs>
        <linearGradient id="ws-shield-grad" x1="27" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2CC1EB" />
          <stop offset="0.65" stopColor="#9A51FF" />
        </linearGradient>
      </defs>
      <path
        d="M26.8542 8.23942C26.8378 7.37546 26.8221 6.55929 26.8221 5.76971C26.8221 5.15113 26.3208 4.64963 25.702 4.64963C20.9118 4.64963 17.2647 3.27297 14.2246 0.317151C13.7897 -0.105792 13.0977 -0.105642 12.6629 0.317151C9.62317 3.27297 5.97664 4.64963 1.18672 4.64963C0.568132 4.64963 0.0666337 5.15113 0.0666337 5.76971C0.0666337 6.55944 0.0511019 7.37591 0.0345247 8.24002C-0.119001 16.2801 -0.329277 27.2914 13.0769 31.9383C13.1958 31.9795 13.3197 32.0001 13.4437 32.0001C13.5677 32.0001 13.6918 31.9795 13.8105 31.9383C27.2177 27.2913 27.0077 16.2797 26.8542 8.23942ZM13.4438 29.6914C1.94628 25.5147 2.12012 16.3651 2.27439 8.28273C2.28365 7.79766 2.29261 7.32752 2.29888 6.86664C6.78519 6.67728 10.3727 5.31779 13.4438 2.64244C16.5153 5.31779 20.1034 6.67743 24.59 6.86664C24.5963 7.32737 24.6052 7.79721 24.6145 8.28198C24.7686 16.3646 24.9423 25.5145 13.4438 29.6914Z"
        fill="url(#ws-shield-grad)"
      />
      <path
        d="M17.3011 12.1091L11.895 17.5149L9.58804 15.208C9.15061 14.7707 8.44138 14.7707 8.0041 15.208C7.56667 15.6455 7.56667 16.3546 8.0041 16.7921L11.103 19.8909C11.3216 20.1096 11.6084 20.2189 11.895 20.2189C12.1816 20.2189 12.4683 20.1096 12.6869 19.8909L18.8849 13.6932C19.3225 13.2557 19.3225 12.5465 18.885 12.1092C18.4477 11.6718 17.7385 11.6716 17.3011 12.1091Z"
        fill="url(#ws-shield-grad)"
      />
    </svg>
  );
}
