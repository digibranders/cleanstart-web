import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon-paths";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  PARTNER_CATEGORY_LABEL,
  PARTNER_STATUS_LABEL,
  type PartnerCategory,
  type PartnerStatus,
  type Product,
  REGISTRATION_STATUS_LABEL,
  type RegistrationStatus,
} from "@/lib/domain";

const CATEGORY_TONE: Record<PartnerCategory, BadgeTone> = {
  distributor: "violet",
  channel: "blue",
  integrator: "cyan",
};

const STATUS_TONE: Record<PartnerStatus, BadgeTone> = {
  active: "accepted",
  onboarding: "pending",
  inactive: "expired",
  suspended: "rejected",
};

const DEAL_TONE: Record<RegistrationStatus, BadgeTone> = {
  pending: "pending",
  accepted: "accepted",
  won: "won",
  lost: "lost",
  rejected: "rejected",
  expired: "expired",
};

const PRODUCT_MARK: Record<Product, { cls: string; icon: IconName }> = {
  images: { cls: "pm-img", icon: "img" },
  libraries: { cls: "pm-lib", icon: "lib" },
  cleansight: { cls: "pm-sight", icon: "sight" },
};

export function PartnerCategoryBadge({ category }: { category: PartnerCategory }): React.JSX.Element {
  return <Badge tone={CATEGORY_TONE[category]}>{PARTNER_CATEGORY_LABEL[category]}</Badge>;
}

export function PartnerStatusBadge({ status }: { status: PartnerStatus }): React.JSX.Element {
  return <Badge tone={STATUS_TONE[status]}>{PARTNER_STATUS_LABEL[status]}</Badge>;
}

export function DealStatusBadge({ status }: { status: RegistrationStatus }): React.JSX.Element {
  return <Badge tone={DEAL_TONE[status]}>{REGISTRATION_STATUS_LABEL[status]}</Badge>;
}

export function ProductMark({ product }: { product: Product }): React.JSX.Element {
  const mark = PRODUCT_MARK[product];
  return (
    <span className={`pm ${mark.cls}`}>
      <Icon name={mark.icon} />
    </span>
  );
}
