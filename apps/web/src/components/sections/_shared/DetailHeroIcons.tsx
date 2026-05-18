import type { CSSProperties, SVGProps } from "react";

const baseStyle: CSSProperties = {
  width: "1em",
  height: "1em",
  fontSize: "clamp(0.875rem,1.4vw,1.25rem)",
};

function BaseIcon({
  children,
  style,
  ...rest
}: SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      style={{ ...baseStyle, ...style }}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </BaseIcon>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </BaseIcon>
  );
}

export function LocationIcon(props: SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <BaseIcon {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </BaseIcon>
  );
}
