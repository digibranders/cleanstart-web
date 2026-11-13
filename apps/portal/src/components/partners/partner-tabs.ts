export type PartnerTab = "Partners" | "Applications";

/** The tabs a staff viewer sees. The Applications tab and its count follow the `application.read` permission. */
export function partnerTabs(total: number, waiting: number, canReadApplications: boolean): readonly (readonly [PartnerTab, number])[] {
  return canReadApplications
    ? [
        ["Partners", total],
        ["Applications", waiting],
      ]
    : [["Partners", total]];
}
