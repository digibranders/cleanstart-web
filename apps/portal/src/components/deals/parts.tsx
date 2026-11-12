import type { Deal, ProductName } from "@/data/deals";
import { ICONS, type IconName } from "../icon-paths";
import { Badge } from "../ui/badge";
import { avOf, initialsOf, protectionView, statusTone } from "./derive";

export const PLUS_PATH =
  "M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z";

export function StatusBadge({ status }: { status: Deal["status"] }): React.JSX.Element {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export function CustomerMark({ name }: { name: string }): React.JSX.Element {
  return <span className={`av ${avOf(name)}`}>{initialsOf(name)}</span>;
}

export function ProtectionCell({ deal, mode }: { deal: Deal; mode: "deals" | "overview" }): React.JSX.Element {
  const view = protectionView(deal, mode);
  return (
    <td className="tnum r">
      <span className={view.cls}>{view.until}</span> <span className="t-muted">{view.left}</span>
    </td>
  );
}

const PRODUCT_MARK: Record<ProductName, { cls: string; icon: IconName }> = {
  "CleanStart Images": { cls: "pm-img", icon: "img" },
  "Clean Libraries": { cls: "pm-lib", icon: "lib" },
  CleanSight: { cls: "pm-sight", icon: "sight" },
};

/** The small coloured product tile on its own, for rows that print the product name themselves. */
export function ProductMark({
  product,
  size,
  large,
}: {
  product: ProductName;
  size?: number;
  large?: boolean;
}): React.JSX.Element {
  const mark = PRODUCT_MARK[product];
  const box = size ? { width: size, height: size, borderRadius: 4 } : undefined;
  return (
    <span className={`pm${large ? " pm-lg" : ""} ${mark.cls}`} style={box}>
      <svg
        className="ic"
        viewBox="0 0 256 256"
        aria-hidden="true"
        style={size ? { width: Math.round(size * 0.65), height: Math.round(size * 0.65) } : undefined}
      >
        <path d={ICONS[mark.icon]} />
      </svg>
    </span>
  );
}
