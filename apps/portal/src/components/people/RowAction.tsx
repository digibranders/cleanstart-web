import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon-paths";

/** Like ActButton, but the tooltip can differ from the accessible name (the boards word them separately). */
export function RowAction({
  label,
  tip,
  icon,
  tone,
  onClick,
}: {
  label: string;
  tip: string;
  icon: IconName;
  tone?: "ok" | "no";
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={`act${tone ? ` act-${tone}` : ""}`}
      aria-label={label}
      data-tip={tip}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}
