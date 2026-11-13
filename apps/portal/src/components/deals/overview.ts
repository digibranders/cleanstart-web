import { fmtShort, plural } from "@/lib/dates";
import { DOCUMENT_TYPE_LABEL, PRODUCT_SHORT_LABEL } from "@/lib/domain";
import type { AttentionItemDto, DocumentListItemDto, PartnerOverviewDto } from "@/lib/dto";
import type { IconName } from "../icon-paths";

export interface Kpi {
  label: string;
  value: string;
  foot: string;
  cls: string;
}

export function buildOverviewKpis(o: PartnerOverviewDto): Kpi[] {
  const byProduct = o.protectedNow.byProduct.map((x) => `${x.count} ${PRODUCT_SHORT_LABEL[x.product]}`);
  return [
    {
      label: "Waiting",
      value: String(o.waiting.count),
      foot: o.waiting.count ? `Oldest ${plural(o.waiting.oldestDays, "day")}` : "Nothing waiting",
      cls: "",
    },
    {
      label: "Protected",
      value: String(o.protectedNow.count),
      foot: byProduct.length ? byProduct.join(", ") : "None yet",
      cls: "",
    },
    {
      label: "Expiring in 14 days",
      value: String(o.expiring14.count),
      foot: o.expiring14.count ? o.expiring14.customers.join(", ") : "None",
      cls: o.expiring14.count ? "t-amber" : "",
    },
    {
      label: "Won this year",
      value: String(o.wonThisYear.count),
      foot: o.wonThisYear.count ? o.wonThisYear.customers.join(", ") : "None yet",
      cls: "",
    },
  ];
}

/** The icon and tint of a "Needs attention" row, by what it is about. */
export const ATTENTION_STYLE: Record<AttentionItemDto["kind"], { icon: IconName; tone: string }> = {
  access_request: { icon: "team", tone: "tone-violet" },
  expiring: { icon: "hg", tone: "tone-amber" },
  late: { icon: "clk", tone: "" },
  declined: { icon: "warn", tone: "tone-red" },
  invite_pending: { icon: "team", tone: "" },
};

/** "Video, 14 min, 4 Nov" */
export function docMeta(doc: DocumentListItemDto): string {
  const length = doc.type === "video" && doc.durationMinutes ? `, ${doc.durationMinutes} min` : "";
  return `${DOCUMENT_TYPE_LABEL[doc.type]}${length}, ${fmtShort(doc.updatedAt.slice(0, 10))}`;
}

export const docIcon = (doc: DocumentListItemDto): IconName => (doc.type === "video" ? "play" : "file");
