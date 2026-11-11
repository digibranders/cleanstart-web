import type { IconName } from "@/components/icon-paths";
import { Icon } from "@/components/icon";
import { Badge, type BadgeTone, type Product } from "@/components/ui/badge";
import type { PartnerCategory, PartnerDealStatus, PartnerStatus } from "@/data/partners";

const CATEGORY_TONE: Record<PartnerCategory, BadgeTone> = {
  Distributor: "violet",
  "Channel partner": "blue",
  "System integrator": "cyan",
};

const STATUS_TONE: Record<PartnerStatus, BadgeTone> = {
  Active: "accepted",
  Onboarding: "pending",
  Inactive: "expired",
  Suspended: "rejected",
};

const DEAL_TONE: Record<PartnerDealStatus, BadgeTone> = {
  Pending: "pending",
  Accepted: "accepted",
  Won: "won",
  Lost: "lost",
  Rejected: "rejected",
};

const PRODUCT_MARK: Record<Product, { cls: string; icon: IconName }> = {
  "CleanStart Images": { cls: "pm-img", icon: "img" },
  "Clean Libraries": { cls: "pm-lib", icon: "lib" },
  CleanSight: { cls: "pm-sight", icon: "sight" },
  "All products": { cls: "pm-all", icon: "all" },
};

export function CategoryBadge({ category }: { category: PartnerCategory }): React.JSX.Element {
  return <Badge tone={CATEGORY_TONE[category]}>{category}</Badge>;
}

export function StatusBadge({ status }: { status: PartnerStatus }): React.JSX.Element {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}

export function DealStatusBadge({ status }: { status: PartnerDealStatus }): React.JSX.Element {
  return <Badge tone={DEAL_TONE[status]}>{status}</Badge>;
}

export function ProductMark({ product }: { product: Product }): React.JSX.Element {
  const mark = PRODUCT_MARK[product];
  return (
    <span className={`pm ${mark.cls}`}>
      <Icon name={mark.icon} />
    </span>
  );
}
