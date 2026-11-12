import { Icon } from "../icon";
import type { IconName } from "../icon-paths";

export type BadgeTone =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "won"
  | "lost"
  | "neutral"
  | "violet"
  | "blue"
  | "cyan";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}): React.JSX.Element {
  return <span className={`badge b-${tone}`}>{children}</span>;
}

export type Product = "CleanStart Images" | "Clean Libraries" | "CleanSight" | "All products";

const PRODUCT_STYLE: Record<Product, { cls: string; icon: IconName }> = {
  "CleanStart Images": { cls: "pm-img", icon: "img" },
  "Clean Libraries": { cls: "pm-lib", icon: "lib" },
  CleanSight: { cls: "pm-sight", icon: "sight" },
  "All products": { cls: "pm-all", icon: "all" },
};

export function ProductChip({ product }: { product: Product }): React.JSX.Element {
  const style = PRODUCT_STYLE[product];
  return (
    <span className="prod">
      <span className={`pm ${style.cls}`}>
        <Icon name={style.icon} />
      </span>
      {product}
    </span>
  );
}

export function Avatar({
  initials,
  round,
  me,
}: {
  initials: string;
  round?: boolean;
  me?: boolean;
}): React.JSX.Element {
  return <span className={`av av-1${round ? " av-r" : ""}${me ? " av-me" : ""}`}>{initials}</span>;
}

/** Row action: icon-only button with a hover tooltip. The label doubles as the accessible name. */
export function ActButton({
  label,
  icon,
  onClick,
  tone,
  href,
}: {
  label: string;
  icon: IconName;
  onClick?: () => void;
  tone?: "ok" | "no";
  href?: string;
}): React.JSX.Element {
  const cls = `act${tone ? ` act-${tone}` : ""}`;
  if (href) {
    return (
      <a className={cls} href={href} aria-label={label} data-tip={label}>
        <Icon name={icon} />
      </a>
    );
  }
  return (
    <button type="button" className={cls} aria-label={label} data-tip={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}
