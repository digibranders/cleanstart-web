import { PRODUCT_LABEL, type Product, REGISTRATION_STATUS_LABEL, type RegistrationStatus } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { ICONS, type IconName } from "../icon-paths";
import { Badge } from "../ui/badge";
import { avOf, initialsOf, protectionView, statusTone } from "./derive";

export const PLUS_PATH =
  "M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z";

export function StatusBadge({ status }: { status: RegistrationStatus }): React.JSX.Element {
  return <Badge tone={statusTone(status)}>{REGISTRATION_STATUS_LABEL[status]}</Badge>;
}

export function CustomerMark({ name }: { name: string }): React.JSX.Element {
  return <span className={`av ${avOf(name)}`}>{initialsOf(name)}</span>;
}

export function ProtectionCell({
  deal,
  mode,
  today,
}: {
  deal: Pick<RegistrationListItem, "status" | "registeredOn" | "resubmittedOn" | "protectionEnd" | "closedOn">;
  mode: "deals" | "overview";
  today: string;
}): React.JSX.Element {
  const view = protectionView(deal, mode, today);
  return (
    <td className="tnum r">
      <span className={view.cls}>{view.until}</span>
      {view.left ? <div className="li-s">{view.left}</div> : null}
    </td>
  );
}

const PRODUCT_MARK: Record<Product, { cls: string; icon: IconName }> = {
  images: { cls: "pm-img", icon: "img" },
  libraries: { cls: "pm-lib", icon: "lib" },
  cleansight: { cls: "pm-sight", icon: "sight" },
};

/** The small coloured product tile on its own, for rows that print the product name themselves. */
export function ProductMark({
  product,
  size,
  large,
}: {
  product: Product;
  size?: number;
  large?: boolean;
}): React.JSX.Element {
  const mark = PRODUCT_MARK[product];
  const box = size ? { width: size, height: size, borderRadius: 4 } : undefined;
  return (
    <span className={`pm${large ? " pm-lg" : ""} ${mark.cls}`} style={box} data-hint={PRODUCT_LABEL[product]}>
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
