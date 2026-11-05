import type { CSSProperties, ReactNode } from "react";

export const TEXT_STYLE: CSSProperties = {
  fontFamily: "var(--font-sans), 'Sora', sans-serif",
  fontWeight: 400,
  fontSize: "var(--fs-body)",
  lineHeight: 1.5,
  letterSpacing: "-0.04em",
  color: "#111111",
  opacity: 0.8,
};

export const CONTAINER_STYLE: CSSProperties = {
  maxWidth: "1276px",
  paddingLeft: "clamp(24px, 4vw, 80px)",
  paddingRight: "clamp(24px, 4vw, 80px)",
};

export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <h2
      className={className}
      style={{
        fontFamily: "var(--font-display), 'Manrope', sans-serif",
        fontWeight: 600,
        fontSize: "var(--fs-h3)",
        lineHeight: 1.1,
        letterSpacing: "-0.05em",
        color: "#111111",
      }}
    >
      {children}
    </h2>
  );
}

export const TERM_STYLE: CSSProperties = {
  fontFamily: "var(--font-display), 'Manrope', sans-serif",
  fontWeight: 600,
  fontSize: "var(--fs-body)",
  lineHeight: 1.3,
  letterSpacing: "-0.03em",
  color: "#0F123E",
};
