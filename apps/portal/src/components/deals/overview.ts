import { fmtShort } from "@/lib/dates";
import { DOCUMENT_TYPE_LABEL } from "@/lib/domain";
import type { AttentionItemDto, DocumentListItemDto } from "@/lib/dto";
import type { IconName } from "../icon-paths";

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
