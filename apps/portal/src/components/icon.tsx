import { ICONS, type IconName } from "./icon-paths";

interface IconProps {
  /** A shared icon from icon-paths.ts. */
  name?: IconName;
  /** A one-off Phosphor path (256 viewbox) for icons that only one screen uses. */
  d?: string;
  small?: boolean;
  className?: string;
}

export function Icon({ name, d, small, className }: IconProps): React.JSX.Element {
  const path = d ?? (name ? ICONS[name] : "");
  const cls = [small ? "ic-sm" : "ic", className].filter(Boolean).join(" ");
  return (
    <svg className={cls} viewBox="0 0 256 256" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
